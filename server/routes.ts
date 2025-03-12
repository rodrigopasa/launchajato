import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});
import { storage } from "./storage";
import session from "express-session";
import { isAuthenticated, isAdmin, isProjectMember, hasProjectRole } from "./middleware/auth";
import { upload, deleteFile } from "./middleware/upload";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { validateRequest } from "./middleware/validation";
import { 
  insertUserSchema, 
  insertProjectSchema, 
  insertProjectMemberSchema, 
  insertTaskSchema, 
  insertPhaseSchema, 
  insertChecklistItemSchema,
  insertIntegrationSchema,
  integrations
} from "@shared/schema";
import chatbotRoutes from "./chatbot/routes";
import whatsappWebRoutes from "./chatbot/whatsapp-web-routes";
import { setupNotificationScheduler } from "./chatbot/notifications";
import { initWhatsAppWebClient } from "./chatbot/whatsapp-web";

import MemoryStore from "memorystore";

const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Rota para criar uma nova organização
  app.post("/api/organizations", async (req: Request, res: Response) => {
    try {
      const {
        name
      } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Nome da organização é obrigatório" });
      }

      const organization = await storage.createOrganization({
        name,
        createdAt: new Date(),
      });

      // Criar configurações para a organização
      await storage.createOrganizationSettings({
        organizationId: organization.id,
        theme: {
          primary: "#0ea5e9",
          variant: "professional",
          appearance: "light",
          radius: 0.5
        },
        logo: null,
        features: {
          taskComments: true,
          fileUploads: true,
          chatbot: true,
          reports: true
        }
      });

      // Criar inscrição gratuita para a organização
      await storage.createSubscription({
        organizationId: organization.id,
        plan: "free",
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        paymentMethod: null,
        paymentId: null
      });

      return res.status(201).json(organization);
    } catch (error) {
      console.error("Erro ao criar organização:", error);
      return res.status(500).json({ message: "Erro ao criar organização" });
    }
  });

  // Rota para adicionar um membro à organização
  app.post("/api/organizations/:id/members", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId, role } = req.body;

      if (!userId || !role) {
        return res.status(400).json({ message: "ID do usuário e cargo são obrigatórios" });
      }

      const result = await storage.addOrganizationMember({
        organizationId: parseInt(id),
        userId,
        role,
        joinedAt: new Date()
      });

      return res.status(201).json(result);
    } catch (error) {
      console.error("Erro ao adicionar membro:", error);
      return res.status(500).json({ message: "Erro ao adicionar membro à organização" });
    }
  });
  // Set up session middleware
  app.use(
    session({
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      secret: process.env.SESSION_SECRET || "launchpro-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 86400000 }, // 24 hours
    })
  );

  // Auth Routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username e senha são obrigatórios" });
    }

    const user = await storage.getUserByUsername(username);

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    req.session.userId = user.id;

    // Don't send the password back to the client
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ message: "Logout efetuado com sucesso" });
    });
  });

  app.get("/api/auth/me", isAuthenticated, (req: Request, res: Response) => {
    const { password: _, ...userWithoutPassword } = res.locals.user;
    res.json(userWithoutPassword);
  });

  // User Routes
  app.get("/api/users", isAuthenticated, async (req: Request, res: Response) => {
    const users = await storage.getAllUsers();
    // Remove passwords from the response
    const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
    res.json(usersWithoutPasswords);
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    // Se não for uma requisição de registro (sem organizationId e orgRole), exigir ser admin
    if (!req.body.organizationId && !req.body.orgRole && 
        (!res.locals.user || res.locals.user.role !== 'admin')) {
      return res.status(403).json({ message: "Permissão negada" });
    }
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }
      
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email já está em uso" });
      }
      
      const user = await storage.createUser(validatedData);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });

  app.put("/api/users/:id", isAuthenticated, async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    
    // Only admins can update other users
    if (userId !== res.locals.user.id && res.locals.user.role !== 'admin') {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    try {
      // For security, don't allow role changes through this endpoint except for admins
      let updateData = req.body;
      if (res.locals.user.role !== 'admin') {
        const { role, ...safeData } = updateData;
        updateData = safeData;
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  // Project Routes
  app.get("/api/projects", isAuthenticated, async (req: Request, res: Response) => {
    if (res.locals.user.role === 'admin') {
      const projects = await storage.getAllProjects();
      return res.json(projects);
    } else {
      const projects = await storage.getProjectsByUser(res.locals.user.id);
      return res.json(projects);
    }
  });

  app.get("/api/projects/:id", isProjectMember, async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);
    
    if (!project) {
      return res.status(404).json({ message: "Projeto não encontrado" });
    }
    
    res.json(project);
  });

  app.post("/api/projects", isAuthenticated, async (req: Request, res: Response) => {
    console.log("Corpo da requisição:", req.body);
    try {
      // Converter strings de data para objetos Date
      const body = {...req.body};
      if (body.startDate && typeof body.startDate === 'string') {
        body.startDate = new Date(body.startDate);
      }
      if (body.deadline && typeof body.deadline === 'string') {
        body.deadline = new Date(body.deadline);
      }
      
      const validatedData = insertProjectSchema.parse({
        ...body,
        createdBy: res.locals.user.id
      });
      
      console.log("Dados validados:", validatedData);
      const project = await storage.createProject(validatedData);
      
      // Create activity
      await storage.createActivity({
        userId: res.locals.user.id,
        projectId: project.id,
        action: "criou",
        subject: "um novo projeto",
        details: project.name
      });
      
      res.status(201).json(project);
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar projeto" });
    }
  });

  app.put("/api/projects/:id", isProjectMember, hasProjectRole(['admin', 'manager']), async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.id);
    
    try {
      // Converter strings de data para objetos Date
      const body = {...req.body};
      if (body.startDate && typeof body.startDate === 'string') {
        body.startDate = new Date(body.startDate);
      }
      if (body.deadline && typeof body.deadline === 'string') {
        body.deadline = new Date(body.deadline);
      }
      
      const updatedProject = await storage.updateProject(projectId, body);
      
      if (!updatedProject) {
        return res.status(404).json({ message: "Projeto não encontrado" });
      }
      
      // Create activity
      await storage.createActivity({
        userId: res.locals.user.id,
        projectId: projectId,
        action: "atualizou",
        subject: "detalhes do projeto",
        details: updatedProject.name
      });
      
      res.json(updatedProject);
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar projeto" });
    }
  });

  app.delete("/api/projects/:id", isProjectMember, hasProjectRole(['admin']), async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.id);
    
    const deleted = await storage.deleteProject(projectId);
    
    if (!deleted) {
      return res.status(404).json({ message: "Projeto não encontrado" });
    }
    
    res.json({ message: "Projeto excluído com sucesso" });
  });

  // Project Members Routes
  app.get("/api/projects/:projectId/members", isProjectMember, async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    
    const members = await storage.getProjectMembers(projectId);
    
    // Get user details for each member
    const usersPromises = members.map(async (member) => {
      const user = await storage.getUser(member.userId);
      if (!user) return null;
      
      const { password: _, ...userWithoutPassword } = user;
      return {
        ...member,
        user: userWithoutPassword
      };
    });
    
    const memberDetails = (await Promise.all(usersPromises)).filter(Boolean);
    
    res.json(memberDetails);
  });

  app.post("/api/projects/:projectId/members", isProjectMember, hasProjectRole(['admin', 'manager']), async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Validar entrada usando o schema Zod
      const validatedData = insertProjectMemberSchema.parse({
        ...req.body,
        projectId
      });
      
      // Check if user exists
      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Check if user is already a member
      const members = await storage.getProjectMembers(projectId);
      const existingMember = members.find(m => m.userId === validatedData.userId);
      
      if (existingMember) {
        return res.status(400).json({ message: "Usuário já é membro deste projeto" });
      }
      
      // Verificar se o papel é válido (embora o schema já deva fazer isso)
      if (!['admin', 'manager', 'member'].includes(validatedData.role)) {
        return res.status(400).json({ 
          message: "Papel inválido. Os papéis permitidos são 'admin', 'manager' ou 'member'" 
        });
      }
      
      const member = await storage.addProjectMember(validatedData);
      
      // Create activity
      await storage.createActivity({
        userId: res.locals.user.id,
        projectId,
        action: "adicionou",
        subject: "um novo membro",
        details: `${user.name} como ${validatedData.role}`
      });
      
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos para adição de membro", 
          errors: error.errors 
        });
      }
      console.error("Erro ao adicionar membro ao projeto:", error);
      res.status(500).json({ message: "Erro ao adicionar membro ao projeto" });
    }
  });

  app.delete("/api/projects/:projectId/members/:userId", isProjectMember, hasProjectRole(['admin', 'manager']), async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const userId = parseInt(req.params.userId);
    
    // Prevent removing the last admin
    if (res.locals.projectRole === 'admin') {
      const members = await storage.getProjectMembers(projectId);
      const admins = members.filter(m => m.role === 'admin');
      
      if (admins.length === 1 && admins[0].userId === userId) {
        return res.status(400).json({ message: "Não é possível remover o último administrador do projeto" });
      }
    }
    
    const removed = await storage.removeProjectMember(projectId, userId);
    
    if (!removed) {
      return res.status(404).json({ message: "Membro não encontrado" });
    }
    
    // Get user details for activity log
    const user = await storage.getUser(userId);
    
    // Create activity
    await storage.createActivity({
      userId: res.locals.user.id,
      projectId,
      action: "removeu",
      subject: "um membro",
      details: user ? user.name : `ID: ${userId}`
    });
    
    res.json({ message: "Membro removido com sucesso" });
  });

  app.put("/api/projects/:projectId/members/:userId/role", isProjectMember, hasProjectRole(['admin']), async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = parseInt(req.params.userId);
      const { role } = req.body;
      
      // Validar se o papel é fornecido
      if (!role) {
        return res.status(400).json({ message: "role é obrigatório" });
      }
      
      // Validar se o papel está entre os valores permitidos
      if (!['admin', 'manager', 'member'].includes(role)) {
        return res.status(400).json({ 
          message: "Papel inválido. Os papéis permitidos são 'admin', 'manager' ou 'member'" 
        });
      }
      
      // Prevent changing the last admin
      if (role !== 'admin') {
        const members = await storage.getProjectMembers(projectId);
        const admins = members.filter(m => m.role === 'admin');
        
        if (admins.length === 1 && admins[0].userId === userId) {
          return res.status(400).json({ message: "Não é possível rebaixar o último administrador do projeto" });
        }
      }
      
      // Verificar se o usuário existe
      const userToUpdate = await storage.getUser(userId);
      if (!userToUpdate) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Verificar se o usuário é um membro do projeto
      const members = await storage.getProjectMembers(projectId);
      const existingMember = members.find(m => m.userId === userId);
      
      if (!existingMember) {
        return res.status(404).json({ message: "Usuário não é membro deste projeto" });
      }
      
      const updated = await storage.updateProjectMemberRole(projectId, userId, role);
      
      if (!updated) {
        return res.status(404).json({ message: "Falha ao atualizar papel do membro" });
      }
      
      // Create activity
      await storage.createActivity({
        userId: res.locals.user.id,
        projectId,
        action: "atualizou",
        subject: "função de membro",
        details: `${userToUpdate.name} para ${role}`
      });
      
      res.json({ 
        message: "Função atualizada com sucesso",
        member: {
          userId,
          projectId,
          role
        }
      });
    } catch (error) {
      console.error("Erro ao atualizar papel do membro:", error);
      res.status(500).json({ message: "Erro ao atualizar papel do membro" });
    }
  });

  // Phases Routes
  app.get("/api/projects/:projectId/phases", isProjectMember, async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const phases = await storage.getPhases(projectId);
    res.json(phases);
  });

  app.post("/api/projects/:projectId/phases", isProjectMember, hasProjectRole(['admin', 'manager']), async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    
    try {
      const validatedData = insertPhaseSchema.parse({
        ...req.body,
        projectId
      });
      
      const phase = await storage.createPhase(validatedData);
      
      // Create activity
      await storage.createActivity({
        userId: res.locals.user.id,
        projectId,
        action: "criou",
        subject: "uma nova fase",
        details: phase.name
      });
      
      res.status(201).json(phase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar fase" });
    }
  });

  app.put("/api/phases/:id", isAuthenticated, async (req: Request, res: Response) => {
    const phaseId = parseInt(req.params.id);
    
    // Get phase to check project permissions
    const phase = await storage.getPhases(phaseId);
    if (!phase) {
      return res.status(404).json({ message: "Fase não encontrada" });
    }
    
    // Check if user is a member of the project with proper role
    const members = await storage.getProjectMembers(phase.projectId);
    const member = members.find(m => m.userId === res.locals.user.id);
    
    if (!member || (member.role !== 'admin' && member.role !== 'manager')) {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    try {
      const updatedPhase = await storage.updatePhase(phaseId, req.body);
      
      if (!updatedPhase) {
        return res.status(404).json({ message: "Fase não encontrada" });
      }
      
      // Create activity
      await storage.createActivity({
        userId: res.locals.user.id,
        projectId: updatedPhase.projectId,
        action: "atualizou",
        subject: "uma fase",
        details: updatedPhase.name
      });
      
      res.json(updatedPhase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar fase" });
    }
  });

  app.delete("/api/phases/:id", isAuthenticated, async (req: Request, res: Response) => {
    const phaseId = parseInt(req.params.id);
    
    // Get phase to check project permissions
    const phase = await storage.getPhases(phaseId);
    if (!phase) {
      return res.status(404).json({ message: "Fase não encontrada" });
    }
    
    // Check if user is a member of the project with proper role
    const members = await storage.getProjectMembers(phase.projectId);
    const member = members.find(m => m.userId === res.locals.user.id);
    
    if (!member || (member.role !== 'admin' && member.role !== 'manager')) {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    const deleted = await storage.deletePhase(phaseId);
    
    if (!deleted) {
      return res.status(404).json({ message: "Fase não encontrada" });
    }
    
    // Create activity
    await storage.createActivity({
      userId: res.locals.user.id,
      projectId: phase.projectId,
      action: "removeu",
      subject: "uma fase",
      details: phase.name
    });
    
    res.json({ message: "Fase excluída com sucesso" });
  });

  // Tasks Routes
  app.get("/api/projects/:projectId/tasks", isProjectMember, async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const tasks = await storage.getTasksByProject(projectId);
    res.json(tasks);
  });

  app.get("/api/phases/:phaseId/tasks", isAuthenticated, async (req: Request, res: Response) => {
    const phaseId = parseInt(req.params.phaseId);
    
    // Get phase to check project permissions
    const phase = await storage.getPhases(phaseId);
    if (!phase) {
      return res.status(404).json({ message: "Fase não encontrada" });
    }
    
    // Check if user is a member of the project
    const members = await storage.getProjectMembers(phase.projectId);
    const member = members.find(m => m.userId === res.locals.user.id);
    
    if (!member && res.locals.user.role !== 'admin') {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    const tasks = await storage.getTasksByPhase(phaseId);
    res.json(tasks);
  });

  app.get("/api/tasks/:id", isAuthenticated, async (req: Request, res: Response) => {
    const taskId = parseInt(req.params.id);
    const task = await storage.getTask(taskId);
    
    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }
    
    // Check if user is a member of the project
    const members = await storage.getProjectMembers(task.projectId);
    const member = members.find(m => m.userId === res.locals.user.id);
    
    if (!member && res.locals.user.role !== 'admin') {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    res.json(task);
  });

  app.get("/api/tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = res.locals.user.id;
      // Buscar tarefas do usuário
      const userTasks = await storage.getTasksByUser(userId);
      
      // Buscar projetos do usuário
      const userProjects = await storage.getProjectsByUser(userId);
      
      // Buscar todas as tarefas em todos os projetos do usuário
      const projectTasks = [];
      for (const project of userProjects) {
        const tasks = await storage.getTasksByProject(project.id);
        projectTasks.push(...tasks);
      }
      
      // Combinar tarefas e remover duplicatas
      const allTaskIds = new Set();
      const allTasks = [];
      
      [...userTasks, ...projectTasks].forEach(task => {
        if (!allTaskIds.has(task.id)) {
          allTaskIds.add(task.id);
          allTasks.push(task);
        }
      });
      
      res.json(allTasks);
    } catch (error) {
      console.error("Error fetching all tasks:", error);
      res.status(500).json({ message: "Erro ao buscar todas as tarefas" });
    }
  });

  app.get("/api/tasks/user/me", isAuthenticated, async (req: Request, res: Response) => {
    const tasks = await storage.getTasksByUser(res.locals.user.id);
    res.json(tasks);
  });

  app.post("/api/projects/:projectId/tasks", isProjectMember, async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    
    try {
      // Converter strings de data para objetos Date
      const body = {...req.body};
      if (body.dueDate && typeof body.dueDate === 'string') {
        body.dueDate = new Date(body.dueDate);
      }
      
      const validatedData = insertTaskSchema.parse({
        ...body,
        projectId
      });
      
      const task = await storage.createTask(validatedData);
      
      // Create activity
      await storage.createActivity({
        userId: res.locals.user.id,
        projectId,
        action: "criou",
        subject: "uma nova tarefa",
        details: task.name
      });
      
      res.status(201).json(task);
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar tarefa" });
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req: Request, res: Response) => {
    const taskId = parseInt(req.params.id);
    
    // Get task to check project permissions
    const task = await storage.getTask(taskId);
    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }
    
    // Check if user is a member of the project
    const members = await storage.getProjectMembers(task.projectId);
    const member = members.find(m => m.userId === res.locals.user.id);
    
    if (!member && res.locals.user.role !== 'admin') {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    try {
      // Converter strings de data para objetos Date
      const body = {...req.body};
      if (body.dueDate && typeof body.dueDate === 'string') {
        body.dueDate = new Date(body.dueDate);
      }
      
      const updatedTask = await storage.updateTask(taskId, body);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
      }
      
      // Create activity
      await storage.createActivity({
        userId: res.locals.user.id,
        projectId: task.projectId,
        taskId: task.id,
        action: "atualizou",
        subject: "uma tarefa",
        details: updatedTask.name
      });
      
      res.json(updatedTask);
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar tarefa" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req: Request, res: Response) => {
    const taskId = parseInt(req.params.id);
    
    // Get task to check project permissions
    const task = await storage.getTask(taskId);
    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }
    
    // Check if user is a member of the project with proper role
    const members = await storage.getProjectMembers(task.projectId);
    const member = members.find(m => m.userId === res.locals.user.id);
    
    if (!member || (member.role !== 'admin' && member.role !== 'manager')) {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    const deleted = await storage.deleteTask(taskId);
    
    if (!deleted) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }
    
    // Create activity
    await storage.createActivity({
      userId: res.locals.user.id,
      projectId: task.projectId,
      action: "removeu",
      subject: "uma tarefa",
      details: task.name
    });
    
    res.json({ message: "Tarefa excluída com sucesso" });
  });

  // Checklist Items Routes
  app.get("/api/tasks/:taskId/checklist", isAuthenticated, async (req: Request, res: Response) => {
    const taskId = parseInt(req.params.taskId);
    
    // Get task to check project permissions
    const task = await storage.getTask(taskId);
    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }
    
    // Check if user is a member of the project
    const members = await storage.getProjectMembers(task.projectId);
    const member = members.find(m => m.userId === res.locals.user.id);
    
    if (!member && res.locals.user.role !== 'admin') {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    const items = await storage.getChecklistItems(taskId);
    res.json(items);
  });

  app.post("/api/tasks/:taskId/checklist", isAuthenticated, async (req: Request, res: Response) => {
    const taskId = parseInt(req.params.taskId);
    
    // Get task to check project permissions
    const task = await storage.getTask(taskId);
    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }
    
    // Check if user is a member of the project
    const members = await storage.getProjectMembers(task.projectId);
    const member = members.find(m => m.userId === res.locals.user.id);
    
    if (!member && res.locals.user.role !== 'admin') {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    try {
      const validatedData = insertChecklistItemSchema.parse({
        ...req.body,
        taskId
      });
      
      const item = await storage.createChecklistItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar item de checklist" });
    }
  });

  app.put("/api/checklist/:id", isAuthenticated, async (req: Request, res: Response) => {
    const itemId = parseInt(req.params.id);
    
    // We need to get the task, then check project permissions
    const checklistItems = await storage.getChecklistItems(itemId);
    if (!checklistItems || checklistItems.length === 0) {
      return res.status(404).json({ message: "Item de checklist não encontrado" });
    }
    
    const task = await storage.getTask(checklistItems[0].taskId);
    if (!task) {
      return res.status(404).json({ message: "Tarefa associada não encontrada" });
    }
    
    // Check if user is a member of the project
    const members = await storage.getProjectMembers(task.projectId);
    const member = members.find(m => m.userId === res.locals.user.id);
    
    if (!member && res.locals.user.role !== 'admin') {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    try {
      const updatedItem = await storage.updateChecklistItem(itemId, req.body);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Item de checklist não encontrado" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar item de checklist" });
    }
  });

  app.delete("/api/checklist/:id", isAuthenticated, async (req: Request, res: Response) => {
    const itemId = parseInt(req.params.id);
    
    // Similar logic to put method to check permissions
    const checklistItems = await storage.getChecklistItems(itemId);
    if (!checklistItems || checklistItems.length === 0) {
      return res.status(404).json({ message: "Item de checklist não encontrado" });
    }
    
    const task = await storage.getTask(checklistItems[0].taskId);
    if (!task) {
      return res.status(404).json({ message: "Tarefa associada não encontrada" });
    }
    
    // Check if user is a member of the project
    const members = await storage.getProjectMembers(task.projectId);
    const member = members.find(m => m.userId === res.locals.user.id);
    
    if (!member && res.locals.user.role !== 'admin') {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    const deleted = await storage.deleteChecklistItem(itemId);
    
    if (!deleted) {
      return res.status(404).json({ message: "Item de checklist não encontrado" });
    }
    
    res.json({ message: "Item de checklist excluído com sucesso" });
  });

  // Files Routes
  app.get("/api/projects/:projectId/files", isProjectMember, async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const files = await storage.getFilesByProject(projectId);
    res.json(files);
  });

  app.get("/api/tasks/:taskId/files", isAuthenticated, async (req: Request, res: Response) => {
    const taskId = parseInt(req.params.taskId);
    
    // Get task to check project permissions
    const task = await storage.getTask(taskId);
    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }
    
    // Check if user is a member of the project
    const members = await storage.getProjectMembers(task.projectId);
    const member = members.find(m => m.userId === res.locals.user.id);
    
    if (!member && res.locals.user.role !== 'admin') {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    const files = await storage.getFilesByTask(taskId);
    res.json(files);
  });

  app.post("/api/projects/:projectId/files", isProjectMember, upload.single('file'), async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const { taskId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "Nenhum arquivo enviado" });
    }
    
    // If taskId is provided, check if it belongs to the project
    if (taskId) {
      const task = await storage.getTask(parseInt(taskId));
      if (!task || task.projectId !== projectId) {
        return res.status(400).json({ message: "Tarefa não pertence a este projeto" });
      }
    }
    
    try {
      const fileData = {
        projectId,
        taskId: taskId ? parseInt(taskId) : null,
        name: req.file.originalname,
        path: req.file.path,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedBy: res.locals.user.id
      };
      
      const file = await storage.createFile(fileData);
      
      // Create activity
      await storage.createActivity({
        userId: res.locals.user.id,
        projectId,
        taskId: taskId ? parseInt(taskId) : null,
        action: "adicionou",
        subject: "um novo arquivo",
        details: req.file.originalname
      });
      
      res.status(201).json(file);
    } catch (error) {
      // Delete uploaded file if storage failed
      if (req.file?.path) {
        await deleteFile(req.file.path).catch(() => {});
      }
      
      res.status(500).json({ message: "Erro ao salvar informações do arquivo" });
    }
  });

  app.get("/api/files/:id/download", isAuthenticated, async (req: Request, res: Response) => {
    const fileId = parseInt(req.params.id);
    const file = await storage.getFile(fileId);
    
    if (!file) {
      return res.status(404).json({ message: "Arquivo não encontrado" });
    }
    
    // Check if user is a member of the project
    const members = await storage.getProjectMembers(file.projectId);
    const member = members.find(m => m.userId === res.locals.user.id);
    
    if (!member && res.locals.user.role !== 'admin') {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ message: "Arquivo físico não encontrado" });
    }
    
    res.download(file.path, file.name);
  });

  app.delete("/api/files/:id", isAuthenticated, async (req: Request, res: Response) => {
    const fileId = parseInt(req.params.id);
    const file = await storage.getFile(fileId);
    
    if (!file) {
      return res.status(404).json({ message: "Arquivo não encontrado" });
    }
    
    // Check if user is a member of the project with proper permissions
    const members = await storage.getProjectMembers(file.projectId);
    const member = members.find(m => m.userId === res.locals.user.id);
    
    // Only admin, manager, or the user who uploaded the file can delete it
    if ((!member || (member.role !== 'admin' && member.role !== 'manager' && file.uploadedBy !== res.locals.user.id)) && res.locals.user.role !== 'admin') {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    try {
      // First try to delete the physical file
      if (fs.existsSync(file.path)) {
        await deleteFile(file.path);
      }
      
      // Then remove from storage
      const deleted = await storage.deleteFile(fileId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }
      
      // Create activity
      await storage.createActivity({
        userId: res.locals.user.id,
        projectId: file.projectId,
        taskId: file.taskId,
        action: "removeu",
        subject: "um arquivo",
        details: file.name
      });
      
      res.json({ message: "Arquivo excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir arquivo" });
    }
  });

  // Activities Routes
  app.get("/api/activities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Obter todos os projetos que o usuário é membro
      const userProjects = await storage.getProjectsByUser(res.locals.user.id);
      const projectIds = userProjects.map(project => project.id);
      
      // Obter atividades para todos esses projetos
      let allActivities: any[] = [];
      for (const projectId of projectIds) {
        const projectActivities = await storage.getActivitiesByProject(projectId);
        allActivities.push(...projectActivities);
      }
      
      // Ordenar por data decrescente
      allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Limitar o número de resultados (opcional)
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      if (limit) {
        allActivities = allActivities.slice(0, limit);
      }
      
      // Get user details for each activity
      const activitiesWithUsers = await Promise.all(allActivities.map(async (activity) => {
        const user = await storage.getUser(activity.userId);
        if (!user) return activity;
        
        const { password: _, ...userWithoutPassword } = user;
        return {
          ...activity,
          user: userWithoutPassword
        };
      }));
      
      return res.json(activitiesWithUsers);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar atividades", error });
    }
  });

  app.get("/api/projects/:projectId/activities", isProjectMember, async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    
    const activities = await storage.getActivitiesByProject(projectId, limit);
    
    // Get user details for each activity
    const activitiesWithUsers = await Promise.all(activities.map(async (activity) => {
      const user = await storage.getUser(activity.userId);
      if (!user) return activity;
      
      const { password: _, ...userWithoutPassword } = user;
      return {
        ...activity,
        user: userWithoutPassword
      };
    }));
    
    res.json(activitiesWithUsers);
  });

  // Comments Routes
  app.get("/api/projects/:projectId/comments", isProjectMember, async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const comments = await storage.getCommentsByProject(projectId);
    
    // Get user details for each comment
    const commentsWithUsers = await Promise.all(comments.map(async (comment) => {
      const user = await storage.getUser(comment.userId);
      if (!user) return comment;
      
      const { password: _, ...userWithoutPassword } = user;
      return {
        ...comment,
        user: userWithoutPassword
      };
    }));
    
    res.json(commentsWithUsers);
  });

  app.get("/api/tasks/:taskId/comments", isAuthenticated, async (req: Request, res: Response) => {
    const taskId = parseInt(req.params.taskId);
    
    // Get task to check project permissions
    const task = await storage.getTask(taskId);
    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }
    
    // Check if user is a member of the project
    const members = await storage.getProjectMembers(task.projectId);
    const member = members.find(m => m.userId === res.locals.user.id);
    
    if (!member && res.locals.user.role !== 'admin') {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    const comments = await storage.getCommentsByTask(taskId);
    
    // Get user details for each comment
    const commentsWithUsers = await Promise.all(comments.map(async (comment) => {
      const user = await storage.getUser(comment.userId);
      if (!user) return comment;
      
      const { password: _, ...userWithoutPassword } = user;
      return {
        ...comment,
        user: userWithoutPassword
      };
    }));
    
    res.json(commentsWithUsers);
  });

  app.post("/api/projects/:projectId/comments", isProjectMember, async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const { taskId, content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: "Conteúdo é obrigatório" });
    }
    
    // If taskId is provided, check if it belongs to the project
    if (taskId) {
      const task = await storage.getTask(parseInt(taskId));
      if (!task || task.projectId !== projectId) {
        return res.status(400).json({ message: "Tarefa não pertence a este projeto" });
      }
    }
    
    try {
      const comment = await storage.createComment({
        projectId,
        taskId: taskId ? parseInt(taskId) : null,
        userId: res.locals.user.id,
        content
      });
      
      // Include user info in response
      const user = await storage.getUser(res.locals.user.id);
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({
          ...comment,
          user: userWithoutPassword
        });
      } else {
        res.status(201).json(comment);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar comentário" });
    }
  });

  app.delete("/api/comments/:id", isAuthenticated, async (req: Request, res: Response) => {
    const commentId = parseInt(req.params.id);
    const comment = await storage.getCommentsByProject(commentId);
    
    if (!comment) {
      return res.status(404).json({ message: "Comentário não encontrado" });
    }
    
    // Only the comment author or admin can delete
    if (comment[0].userId !== res.locals.user.id && res.locals.user.role !== 'admin') {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    const deleted = await storage.deleteComment(commentId);
    
    if (!deleted) {
      return res.status(404).json({ message: "Comentário não encontrado" });
    }
    
    res.json({ message: "Comentário excluído com sucesso" });
  });

  // Validação de requisições movida para middleware/validation.ts
  
  // API para configurações
  app.get("/api/settings", async (req: Request, res: Response) => {
    try {
      // Configurações padrão
      const defaultSettings = {
        theme: {
          primary: "#0ea5e9",
          variant: "professional",
          appearance: "light",
          radius: "0.5",
        },
        organization: {
          name: "LaunchRocket",
          logo: null,
        }
      };
      
      res.json(defaultSettings);
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      res.status(500).json({ message: "Erro ao buscar configurações" });
    }
  });
  
  app.put("/api/settings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Verificar se o usuário é administrador
      if (res.locals.user.role !== 'admin') {
        return res.status(403).json({ message: "Apenas administradores podem alterar as configurações" });
      }
      
      const settings = req.body;
      // Aqui seria implementada a lógica para salvar as configurações em um banco de dados
      // Por enquanto, apenas retornamos as configurações recebidas
      res.json(settings);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      res.status(500).json({ message: "Erro ao salvar configurações" });
    }
  });
  
  app.post("/api/settings/logo", isAuthenticated, upload.single('logo'), async (req: Request, res: Response) => {
    try {
      // Verificar se o usuário é administrador
      if (res.locals.user.role !== 'admin') {
        return res.status(403).json({ message: "Apenas administradores podem alterar o logo" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }
      
      // Retorna o caminho do arquivo
      res.status(201).json({ 
        logo: `/uploads/${req.file.filename}` 
      });
    } catch (error) {
      console.error("Erro ao enviar logo:", error);
      res.status(500).json({ message: "Erro ao enviar logo" });
    }
  });

  // Rotas para Integrações
  app.get("/api/integrations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Verificar se o usuário é administrador
      if (res.locals.user.role !== 'admin') {
        return res.status(403).json({ message: "Apenas administradores podem visualizar integrações" });
      }
      
      const integrations = await storage.getAllIntegrations();
      return res.json(integrations);
    } catch (error) {
      console.error("Erro ao obter integrações:", error);
      return res.status(500).json({ message: "Erro ao obter integrações" });
    }
  });
  
  app.get("/api/integrations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Verificar se o usuário é administrador
      if (res.locals.user.role !== 'admin') {
        return res.status(403).json({ message: "Apenas administradores podem visualizar integrações" });
      }
      
      const integration = await storage.getIntegration(parseInt(req.params.id));
      
      if (!integration) {
        return res.status(404).json({ message: "Integração não encontrada" });
      }
      
      return res.json(integration);
    } catch (error) {
      console.error("Erro ao obter integração:", error);
      return res.status(500).json({ message: "Erro ao obter integração" });
    }
  });
  
  app.post("/api/integrations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Verificar se o usuário é administrador
      if (res.locals.user.role !== 'admin') {
        return res.status(403).json({ message: "Apenas administradores podem criar integrações" });
      }
      
      const { type, name, enabled, credentials } = req.body;
      
      // Verificar se já existe uma integração do mesmo tipo
      const existingIntegration = await storage.getIntegrationByType(type);
      if (existingIntegration) {
        return res.status(400).json({ message: `Já existe uma integração do tipo ${type}` });
      }
      
      const integration = await storage.createIntegration({
        type,
        name,
        enabled,
        credentials,
        configuredBy: res.locals.user.id
      });
      
      return res.status(201).json(integration);
    } catch (error) {
      console.error("Erro ao criar integração:", error);
      return res.status(500).json({ message: "Erro ao criar integração" });
    }
  });
  
  app.put("/api/integrations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Verificar se o usuário é administrador
      if (res.locals.user.role !== 'admin') {
        return res.status(403).json({ message: "Apenas administradores podem atualizar integrações" });
      }
      
      const id = parseInt(req.params.id);
      const integration = await storage.getIntegration(id);
      
      if (!integration) {
        return res.status(404).json({ message: "Integração não encontrada" });
      }
      
      const { type, name, enabled, credentials } = req.body;
      
      const updatedIntegration = await storage.updateIntegration(id, {
        type,
        name,
        enabled,
        credentials,
        configuredBy: res.locals.user.id
      });
      
      return res.json(updatedIntegration);
    } catch (error) {
      console.error("Erro ao atualizar integração:", error);
      return res.status(500).json({ message: "Erro ao atualizar integração" });
    }
  });
  
  app.delete("/api/integrations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Verificar se o usuário é administrador
      if (res.locals.user.role !== 'admin') {
        return res.status(403).json({ message: "Apenas administradores podem excluir integrações" });
      }
      
      const id = parseInt(req.params.id);
      const integration = await storage.getIntegration(id);
      
      if (!integration) {
        return res.status(404).json({ message: "Integração não encontrada" });
      }
      
      await storage.deleteIntegration(id);
      
      return res.json({ message: "Integração excluída com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir integração:", error);
      return res.status(500).json({ message: "Erro ao excluir integração" });
    }
  });
  
  app.post("/api/integrations/whatsapp/test", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Verificar se o usuário é administrador
      if (res.locals.user.role !== 'admin') {
        return res.status(403).json({ message: "Apenas administradores podem testar integrações" });
      }
      
      const whatsappIntegration = await storage.getIntegrationByType('whatsapp');
      
      if (!whatsappIntegration) {
        return res.status(404).json({ message: "Integração WhatsApp não configurada" });
      }
      
      if (!whatsappIntegration.enabled) {
        return res.status(400).json({ message: "Integração WhatsApp está desativada" });
      }
      
      // Em uma implementação real, aqui você faria uma chamada para a API do WhatsApp
      // para verificar se as credenciais estão funcionando
      
      // Simulando teste básico
      const credentials = whatsappIntegration.credentials;
      if (!credentials?.phoneNumberId || !credentials?.accessToken || !credentials?.webhookToken) {
        return res.status(400).json({ message: "Configurações do WhatsApp incompletas" });
      }
      
      // Simulando resposta positiva
      return res.json({ 
        message: "Conexão com WhatsApp realizada com sucesso",
        status: "ok" 
      });
      
    } catch (error) {
      console.error("Erro ao testar integração WhatsApp:", error);
      return res.status(500).json({ message: "Erro ao testar integração WhatsApp" });
    }
  });

  // Rotas de Super Admin
  // Verificação de permissão de super admin
  const isSuperAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    storage.getUser(req.session.userId).then(user => {
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Acesso negado: permissão de administrador necessária" });
      }
      next();
    }).catch(error => {
      console.error("Erro ao verificar permissões de admin:", error);
      return res.status(500).json({ message: "Erro interno ao verificar permissões" });
    });
  };

  // Configurações do sistema
  app.get("/api/admin/settings", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      // Buscar configurações do banco ou retornar padrões
      const settings = await storage.getAdminSettings();
      if (!settings || Object.keys(settings).length === 0) {
        return res.json({
          appName: "LaunchRocket",
          defaultPlanTrialDays: 14,
          maxFileSize: 10,
          maintanceMode: false,
          disableRegistration: false,
          notificationEmail: "",
          customCss: "",
          defaultCurrency: "BRL",
          termsUrl: "",
          privacyUrl: ""
        });
      }
      return res.json(settings);
    } catch (error) {
      console.error("Erro ao buscar configurações admin:", error);
      return res.status(500).json({ message: "Erro ao buscar configurações" });
    }
  });

  app.put("/api/admin/settings", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const settingsData = req.body;
      const settings = await storage.updateAdminSettings(settingsData);
      return res.json(settings);
    } catch (error) {
      console.error("Erro ao atualizar configurações admin:", error);
      return res.status(500).json({ message: "Erro ao atualizar configurações" });
    }
  });
  
  // Configurações de preços
  app.get("/api/admin/settings/pricing", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      // Buscar configurações de preços do banco ou retornar padrões
      const pricingSettings = {
        freePlan: await storage.getAdminSetting('pricing_free_plan'),
        starterPlan: await storage.getAdminSetting('pricing_starter_plan'),
        proPlan: await storage.getAdminSetting('pricing_pro_plan'),
        enterprisePlan: await storage.getAdminSetting('pricing_enterprise_plan')
      };
      
      // Valores padrão se não existirem configurações
      return res.json({
        freePlan: pricingSettings.freePlan?.settingValue || {
          price: 0,
          features: ['1 projeto', '3 usuários', '1GB de armazenamento'],
          enabled: true
        },
        starterPlan: pricingSettings.starterPlan?.settingValue || {
          price: 29.90,
          features: ['5 projetos', '10 usuários', '5GB de armazenamento'],
          enabled: true
        },
        proPlan: pricingSettings.proPlan?.settingValue || {
          price: 79.90,
          features: ['20 projetos', 'Usuários ilimitados', '20GB de armazenamento'],
          enabled: true
        },
        enterprisePlan: pricingSettings.enterprisePlan?.settingValue || {
          price: 199.90,
          features: ['Projetos ilimitados', 'Usuários ilimitados', 'Armazenamento ilimitado', 'API dedicada'],
          enabled: true
        }
      });
    } catch (error) {
      console.error("Erro ao buscar configurações de preços:", error);
      return res.status(500).json({ message: "Erro ao buscar configurações de preços" });
    }
  });

  app.put("/api/admin/settings/pricing", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const { freePlan, starterPlan, proPlan, enterprisePlan } = req.body;
      
      // Atualizar cada plano no banco de dados
      if (freePlan) {
        await storage.updateAdminSetting('pricing_free_plan', freePlan);
      }
      
      if (starterPlan) {
        await storage.updateAdminSetting('pricing_starter_plan', starterPlan);
      }
      
      if (proPlan) {
        await storage.updateAdminSetting('pricing_pro_plan', proPlan);
      }
      
      if (enterprisePlan) {
        await storage.updateAdminSetting('pricing_enterprise_plan', enterprisePlan);
      }
      
      return res.json({
        success: true,
        message: "Configurações de preços atualizadas com sucesso",
        data: { freePlan, starterPlan, proPlan, enterprisePlan }
      });
    } catch (error) {
      console.error("Erro ao atualizar configurações de preços:", error);
      return res.status(500).json({ message: "Erro ao atualizar configurações de preços" });
    }
  });

  // Agências parceiras
  app.get("/api/admin/partner-agencies", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const agencies = await storage.getAllPartnerAgencies();
      return res.json(agencies);
    } catch (error) {
      console.error("Erro ao buscar agências parceiras:", error);
      return res.status(500).json({ message: "Erro ao buscar agências parceiras" });
    }
  });

  app.get("/api/admin/partner-agencies/:id", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const agencyId = parseInt(req.params.id);
      const agency = await storage.getPartnerAgency(agencyId);
      if (!agency) {
        return res.status(404).json({ message: "Agência parceira não encontrada" });
      }
      return res.json(agency);
    } catch (error) {
      console.error("Erro ao buscar agência parceira:", error);
      return res.status(500).json({ message: "Erro ao buscar agência parceira" });
    }
  });

  app.post("/api/admin/partner-agencies", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      // Converter datas de string para Date se necessário
      const body = {...req.body};
      if (body.trialStartDate && typeof body.trialStartDate === 'string') {
        body.trialStartDate = new Date(body.trialStartDate);
      }
      if (body.trialEndDate && typeof body.trialEndDate === 'string') {
        body.trialEndDate = new Date(body.trialEndDate);
      }
      
      // Adicionar o ID do usuário atual como criador
      const agencyData = {
        ...body,
        createdBy: req.session.userId!
      };

      const agency = await storage.createPartnerAgency(agencyData);
      return res.status(201).json(agency);
    } catch (error) {
      console.error("Erro ao criar agência parceira:", error);
      return res.status(500).json({ message: "Erro ao criar agência parceira" });
    }
  });

  app.put("/api/admin/partner-agencies/:id", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const agencyId = parseInt(req.params.id);
      
      // Converter datas de string para Date se necessário
      const body = {...req.body};
      if (body.trialStartDate && typeof body.trialStartDate === 'string') {
        body.trialStartDate = new Date(body.trialStartDate);
      }
      if (body.trialEndDate && typeof body.trialEndDate === 'string') {
        body.trialEndDate = new Date(body.trialEndDate);
      }
      
      const agency = await storage.updatePartnerAgency(agencyId, body);
      if (!agency) {
        return res.status(404).json({ message: "Agência parceira não encontrada" });
      }
      return res.json(agency);
    } catch (error) {
      console.error("Erro ao atualizar agência parceira:", error);
      return res.status(500).json({ message: "Erro ao atualizar agência parceira" });
    }
  });

  app.delete("/api/admin/partner-agencies/:id", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const agencyId = parseInt(req.params.id);
      const success = await storage.deletePartnerAgency(agencyId);
      if (!success) {
        return res.status(404).json({ message: "Agência parceira não encontrada" });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error("Erro ao excluir agência parceira:", error);
      return res.status(500).json({ message: "Erro ao excluir agência parceira" });
    }
  });

  // Integrações de pagamento
  app.get("/api/admin/payment-integrations/mercado-pago", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const integration = await storage.getPaymentIntegrationByProvider("mercado_pago");
      if (!integration) {
        return res.json({
          accessToken: "",
          publicKey: "",
          enabled: false,
          testMode: true,
          webhookUrl: "",
          webhookSecret: ""
        });
      }
      
      // Extrair os dados relevantes da integração
      const { credentials, settings, ...rest } = integration;
      return res.json({
        accessToken: credentials?.accessToken || "",
        publicKey: credentials?.publicKey || "",
        enabled: rest.enabled,
        testMode: settings?.testMode || true,
        webhookUrl: rest.webhook_url || "",
        webhookSecret: rest.webhook_secret || ""
      });
    } catch (error) {
      console.error("Erro ao buscar configuração Mercado Pago:", error);
      return res.status(500).json({ message: "Erro ao buscar configuração" });
    }
  });

  app.put("/api/admin/payment-integrations/mercado-pago", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const { accessToken, publicKey, enabled, testMode, webhookUrl, webhookSecret } = req.body;
      
      // Formatar os dados para o formato de armazenamento
      const integrationData = {
        provider: "mercado_pago",
        name: "Mercado Pago",
        enabled,
        organizationId: 1, // ID da organização principal/sistema
        configuredBy: req.session.userId!,
        webhook_url: webhookUrl,
        webhook_secret: webhookSecret,
        credentials: {
          accessToken,
          publicKey
        },
        settings: {
          testMode
        }
      };

      // Verificar se a integração já existe
      const existingIntegration = await storage.getPaymentIntegrationByProvider("mercado_pago");
      
      let integration;
      if (existingIntegration) {
        integration = await storage.updatePaymentIntegration(existingIntegration.id, integrationData);
      } else {
        integration = await storage.createPaymentIntegration(integrationData);
      }

      return res.json({
        success: true,
        message: "Configuração salva com sucesso"
      });
    } catch (error) {
      console.error("Erro ao salvar configuração Mercado Pago:", error);
      return res.status(500).json({ message: "Erro ao salvar configuração" });
    }
  });

  // API para buscar configurações do Stripe
  app.get("/api/admin/payment-integrations/stripe", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const integration = await storage.getPaymentIntegrationByProvider("stripe");
      if (!integration) {
        return res.json({
          secretKey: "",
          publicKey: "",
          enabled: false,
          testMode: true,
          webhookUrl: "",
          webhookSecret: "",
          priceId: ""
        });
      }
      
      // Recuperar as credenciais do Stripe
      const credentials = integration.credentials || {};
      const settings = integration.settings || {};
      
      res.json({
        secretKey: credentials.secretKey || "",
        publicKey: credentials.publicKey || "",
        enabled: integration.enabled,
        testMode: settings.testMode || true,
        webhookUrl: integration.webhook_url || "",
        webhookSecret: integration.webhook_secret || "",
        priceId: settings.priceId || ""
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // API para atualizar configurações do Stripe
  app.put("/api/admin/payment-integrations/stripe", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const { secretKey, publicKey, enabled, testMode, webhookUrl, webhookSecret, priceId } = req.body;
      
      // Formatar os dados para o formato de armazenamento
      const integrationData = {
        provider: "stripe",
        name: "Stripe",
        enabled,
        organizationId: 1, // ID da organização principal/sistema
        configuredBy: req.session.userId!,
        webhook_url: webhookUrl,
        webhook_secret: webhookSecret,
        credentials: {
          secretKey,
          publicKey
        },
        settings: {
          testMode,
          priceId
        }
      };
      
      // Verificar se a integração já existe
      const existingIntegration = await storage.getPaymentIntegrationByProvider("stripe");
      
      let integration;
      if (existingIntegration) {
        integration = await storage.updatePaymentIntegration(existingIntegration.id, integrationData);
      } else {
        integration = await storage.createPaymentIntegration(integrationData);
      }

      return res.json({
        success: true,
        message: "Configuração salva com sucesso"
      });
    } catch (error) {
      console.error("Erro ao salvar configuração Stripe:", error);
      return res.status(500).json({ message: "Erro ao salvar configuração" });
    }
  });
  
  // Registrar rotas do chatbot
  app.use('/api/chatbot', chatbotRoutes);
  
  // Registrar rotas do WhatsApp Web
  app.use('/api/whatsapp-web', whatsappWebRoutes);
  
  // Inicializar o sistema de notificações do chatbot
  setupNotificationScheduler();
  
  // Inicializar WhatsApp Web (se configurado e ativo)
  try {
    await initWhatsAppWebClient();
    console.log("Sistema de WhatsApp Web inicializado");
  } catch (error) {
    console.error("Erro ao inicializar WhatsApp Web:", error);
  }
  
  console.log("Sistema de chatbot WhatsApp inicializado");

    // Stripe Routes
  app.post("/api/create-payment-intent", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { amount } = req.body;
      
      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: res.locals.user.id
        }
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/get-or-create-subscription", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = res.locals.user;
      
      if (!user.email) {
        throw new Error('No user email on file');
      }
      
      // Verificar se o usuário já tem um customer ID
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        // Criar um novo customer se não existir
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
        });
        
        customerId = customer.id;
        await storage.updateUser(user.id, { stripeCustomerId: customer.id });
      }
      
      // Verificar se o usuário já tem uma assinatura
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (subscription.status === "active") {
          return res.send({
            subscriptionId: subscription.id,
            clientSecret: undefined // Já está ativa, não precisa de pagamento
          });
        }
      }
      
      // Criar uma nova assinatura
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: process.env.STRIPE_PRICE_ID,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      
      await storage.updateUser(user.id, { 
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id
      });

      res.send({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Error setting up subscription:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Webhook para processar eventos do Stripe
  app.post("/api/stripe-webhook", async (req: Request, res: Response) => {
    let event: Stripe.Event;

    // Verificar se o webhook secret está configurado
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE_WEBHOOK_SECRET não configurado no ambiente");
      return res.status(500).send("Webhook Error: Configuração incompleta no servidor");
    }

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'] as string,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // Handle the event
      console.log(`Processando evento Stripe: ${event.type}`);
      
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`✅ Pagamento ${paymentIntent.id} processado com sucesso`);
          
          // Atualizar o status do pagamento no banco de dados
          if (paymentIntent.metadata.userId) {
            try {
              // Implementar lógica de atualização do status do pagamento
              console.log(`Atualizando status de pagamento para o usuário ${paymentIntent.metadata.userId}`);
            } catch (error) {
              console.error(`Erro ao atualizar status de pagamento:`, error);
            }
          }
          break;
          
        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          console.log(`❌ Falha no pagamento ${failedPayment.id}: ${failedPayment.last_payment_error?.message || 'Erro desconhecido'}`);
          break;
          
        case 'customer.subscription.created':
          const newSubscription = event.data.object as Stripe.Subscription;
          console.log(`✅ Nova assinatura ${newSubscription.id} criada para cliente ${newSubscription.customer}`);
          break;
          
        case 'customer.subscription.updated':
          const updatedSubscription = event.data.object as Stripe.Subscription;
          console.log(`Assinatura ${updatedSubscription.id} atualizada para ${updatedSubscription.status}`);
          
          // Tratamento específico de status
          try {
            if (updatedSubscription.status === 'active') {
              console.log(`Assinatura ${updatedSubscription.id} ativada com sucesso`);
            } else if (updatedSubscription.status === 'past_due') {
              console.log(`Assinatura ${updatedSubscription.id} com pagamento pendente`);
            }
          } catch (error) {
            console.error(`Erro ao processar atualização de assinatura:`, error);
          }
          break;
          
        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object as Stripe.Subscription;
          console.log(`Assinatura ${deletedSubscription.id} cancelada`);
          
          try {
            // Implementar lógica de cancelamento da assinatura
            console.log(`Atualizando status para assinatura cancelada ${deletedSubscription.id}`);
          } catch (error) {
            console.error(`Erro ao processar cancelamento de assinatura:`, error);
          }
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("Error processing webhook:", err);
      res.status(500).send(`Webhook Error: ${err.message}`);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
