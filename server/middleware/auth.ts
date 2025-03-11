import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Não autenticado' });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ message: 'Usuário não encontrado' });
  }
  
  res.locals.user = user;
  next();
};

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Não autenticado' });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ message: 'Usuário não encontrado' });
  }
  
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Permissão negada' });
  }
  
  res.locals.user = user;
  next();
};

export const isProjectMember = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Não autenticado' });
  }
  
  // Verificar para parâmetros projectId ou id (para suportar diferentes rotas)
  const projectIdParam = req.params.projectId || req.params.id;
  const projectId = parseInt(projectIdParam);
  
  if (isNaN(projectId)) {
    return res.status(400).json({ message: 'ID de projeto inválido' });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ message: 'Usuário não encontrado' });
  }
  
  // Admin users can access all projects
  if (user.role === 'admin') {
    res.locals.user = user;
    res.locals.projectRole = 'admin';
    return next();
  }
  
  // Check if user is the project creator
  const project = await storage.getProject(projectId);
  if (project && project.createdBy === user.id) {
    res.locals.user = user;
    res.locals.projectRole = 'admin';
    return next();
  }
  
  // Check if user is a member of the project
  const members = await storage.getProjectMembers(projectId);
  const member = members.find(m => m.userId === user.id);
  
  if (!member) {
    return res.status(403).json({ message: 'Você não é membro deste projeto' });
  }
  
  res.locals.user = user;
  res.locals.projectRole = member.role;
  next();
};

export const hasProjectRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const projectRole = res.locals.projectRole;
    if (!projectRole || !roles.includes(projectRole)) {
      return res.status(403).json({ message: 'Permissão insuficiente para esta operação' });
    }
    next();
  };
};
