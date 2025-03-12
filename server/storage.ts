import {
  users, projects, projectMembers, phases, 
  tasks, checklistItems, files, activities, comments, integrations,
  organizations, organizationSettings, subscriptions, organizationMembers,
  paymentIntegrations, adminSettings, partnerAgencies,
  budgetCategories, expenses, budgetForecasts,
  type User, type InsertUser, type Project, type InsertProject,
  type ProjectMember, type InsertProjectMember, type Phase, type InsertPhase,
  type Task, type InsertTask, type ChecklistItem, type InsertChecklistItem,
  type File, type InsertFile, type Activity, type InsertActivity,
  type Comment, type InsertComment, type Integration, type InsertIntegration,
  type Organization, type InsertOrganization, 
  type OrganizationSettings, type InsertOrganizationSettings,
  type Subscription, type InsertSubscription,
  type OrganizationMember, type InsertOrganizationMember,
  type PaymentIntegration, type InsertPaymentIntegration,
  type AdminSetting, type InsertAdminSetting,
  type PartnerAgency, type InsertPartnerAgency,
  type BudgetCategory, type InsertBudgetCategory,
  type Expense, type InsertExpense,
  type BudgetForecast, type InsertBudgetForecast
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // Organizações
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganization(id: number): Promise<Organization | undefined>;
  updateOrganization(id: number, data: Partial<InsertOrganization>): Promise<Organization | undefined>;
  
  // Configurações de Organização
  createOrganizationSettings(settings: InsertOrganizationSettings): Promise<OrganizationSettings>;
  getOrganizationSettings(organizationId: number): Promise<OrganizationSettings | undefined>;
  updateOrganizationSettings(organizationId: number, data: Partial<InsertOrganizationSettings>): Promise<OrganizationSettings | undefined>;
  
  // Assinaturas
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscription(organizationId: number): Promise<Subscription | undefined>;
  updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  
  // Membros da Organização
  addOrganizationMember(member: InsertOrganizationMember): Promise<OrganizationMember>;
  getOrganizationMembers(organizationId: number): Promise<OrganizationMember[]>;
  removeOrganizationMember(organizationId: number, userId: number): Promise<boolean>;
  updateOrganizationMemberRole(organizationId: number, userId: number, role: string): Promise<boolean>;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  
  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  getProjectsByUser(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Project Members
  getProjectMembers(projectId: number): Promise<ProjectMember[]>;
  addProjectMember(member: InsertProjectMember): Promise<ProjectMember>;
  removeProjectMember(projectId: number, userId: number): Promise<boolean>;
  updateProjectMemberRole(projectId: number, userId: number, role: string): Promise<boolean>;
  
  // Phases
  getPhases(projectId: number): Promise<Phase[]>;
  createPhase(phase: InsertPhase): Promise<Phase>;
  updatePhase(id: number, data: Partial<InsertPhase>): Promise<Phase | undefined>;
  deletePhase(id: number): Promise<boolean>;
  
  // Tasks
  getTask(id: number): Promise<Task | undefined>;
  getTasksByProject(projectId: number): Promise<Task[]>;
  getTasksByPhase(phaseId: number): Promise<Task[]>;
  getTasksByUser(userId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Checklist Items
  getChecklistItems(taskId: number): Promise<ChecklistItem[]>;
  createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem>;
  updateChecklistItem(id: number, data: Partial<InsertChecklistItem>): Promise<ChecklistItem | undefined>;
  deleteChecklistItem(id: number): Promise<boolean>;
  
  // Files
  getFile(id: number): Promise<File | undefined>;
  getFilesByProject(projectId: number): Promise<File[]>;
  getFilesByTask(taskId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: number): Promise<boolean>;
  
  // Activities
  getActivitiesByProject(projectId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Comments
  getCommentsByProject(projectId: number): Promise<Comment[]>;
  getCommentsByTask(taskId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;
  
  // Integrations
  getIntegration(id: number): Promise<Integration | undefined>;
  getIntegrationByType(type: string): Promise<Integration | undefined>;
  getAllIntegrations(): Promise<Integration[]>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: number, data: Partial<InsertIntegration>): Promise<Integration | undefined>;
  deleteIntegration(id: number): Promise<boolean>;
  
  // Payment Integrations
  getPaymentIntegration(id: number): Promise<PaymentIntegration | undefined>;
  getPaymentIntegrationByProvider(provider: string): Promise<PaymentIntegration | undefined>;
  getAllPaymentIntegrations(): Promise<PaymentIntegration[]>;
  createPaymentIntegration(integration: InsertPaymentIntegration): Promise<PaymentIntegration>;
  updatePaymentIntegration(id: number, data: Partial<InsertPaymentIntegration>): Promise<PaymentIntegration | undefined>;
  deletePaymentIntegration(id: number): Promise<boolean>;
  
  // Admin Settings
  getAdminSettings(): Promise<Record<string, any> | undefined>;
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  createAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting>;
  updateAdminSetting(key: string, value: any): Promise<AdminSetting | undefined>;
  updateAdminSettings(settings: Record<string, any>): Promise<Record<string, any>>;
  deleteAdminSetting(key: string): Promise<boolean>;
  
  // Partner Agencies
  getPartnerAgency(id: number): Promise<PartnerAgency | undefined>;
  getPartnerAgencyByEmail(email: string): Promise<PartnerAgency | undefined>;
  getAllPartnerAgencies(): Promise<PartnerAgency[]>;
  createPartnerAgency(agency: InsertPartnerAgency): Promise<PartnerAgency>;
  updatePartnerAgency(id: number, data: Partial<InsertPartnerAgency>): Promise<PartnerAgency | undefined>;
  deletePartnerAgency(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private organizations: Map<number, Organization>;
  private organizationSettings: Map<number, OrganizationSettings>;
  private subscriptions: Map<number, Subscription>;
  private organizationMembers: Map<number, OrganizationMember>;
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private projectMembers: Map<number, ProjectMember>;
  private phases: Map<number, Phase>;
  private tasks: Map<number, Task>;
  private checklistItems: Map<number, ChecklistItem>;
  private files: Map<number, File>;
  private activities: Map<number, Activity>;
  private comments: Map<number, Comment>;
  private integrations: Map<number, Integration>;
  
  private organizationIdCounter: number;
  private organizationSettingsIdCounter: number;
  private subscriptionIdCounter: number;
  private organizationMemberIdCounter: number;
  private userIdCounter: number;
  private projectIdCounter: number;
  private memberIdCounter: number;
  private phaseIdCounter: number;
  private taskIdCounter: number;
  private checklistIdCounter: number;
  private fileIdCounter: number;
  private activityIdCounter: number;
  private commentIdCounter: number;
  private integrationIdCounter: number;

  constructor() {
    this.organizations = new Map();
    this.organizationSettings = new Map();
    this.subscriptions = new Map();
    this.organizationMembers = new Map();
    this.users = new Map();
    this.projects = new Map();
    this.projectMembers = new Map();
    this.phases = new Map();
    this.tasks = new Map();
    this.checklistItems = new Map();
    this.files = new Map();
    this.activities = new Map();
    this.comments = new Map();
    this.integrations = new Map();
    
    this.organizationIdCounter = 1;
    this.organizationSettingsIdCounter = 1;
    this.subscriptionIdCounter = 1;
    this.organizationMemberIdCounter = 1;
    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.memberIdCounter = 1;
    this.phaseIdCounter = 1;
    this.taskIdCounter = 1;
    this.checklistIdCounter = 1;
    this.fileIdCounter = 1;
    this.activityIdCounter = 1;
    this.commentIdCounter = 1;
    this.integrationIdCounter = 1;
    
    // Add default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      name: "Administrador",
      email: "admin@launchpro.com",
      role: "admin",
      avatar: ""
    });
  }
  
  // Organization methods
  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const now = new Date();
    const id = this.organizationIdCounter++;
    const org: Organization = { 
      ...insertOrg, 
      id, 
      createdAt: now,
      updatedAt: now,
    };
    this.organizations.set(id, org);
    return org;
  }
  
  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }
  
  async updateOrganization(id: number, data: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const org = this.organizations.get(id);
    if (!org) return undefined;
    
    const updatedOrg = { 
      ...org, 
      ...data, 
      updatedAt: new Date() 
    };
    this.organizations.set(id, updatedOrg);
    return updatedOrg;
  }
  
  // Organization Settings methods
  async createOrganizationSettings(insertSettings: InsertOrganizationSettings): Promise<OrganizationSettings> {
    const id = this.organizationSettingsIdCounter++;
    const settings: OrganizationSettings = { 
      ...insertSettings, 
      id,
      updatedAt: new Date()
    };
    this.organizationSettings.set(insertSettings.organizationId, settings);
    return settings;
  }
  
  async getOrganizationSettings(organizationId: number): Promise<OrganizationSettings | undefined> {
    return Array.from(this.organizationSettings.values())
      .find(setting => setting.organizationId === organizationId);
  }
  
  async updateOrganizationSettings(
    organizationId: number, 
    data: Partial<InsertOrganizationSettings>
  ): Promise<OrganizationSettings | undefined> {
    const settings = await this.getOrganizationSettings(organizationId);
    if (!settings) return undefined;
    
    const updatedSettings = { 
      ...settings, 
      ...data, 
      updatedAt: new Date() 
    };
    this.organizationSettings.set(settings.id, updatedSettings);
    return updatedSettings;
  }
  
  // Subscription methods
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const now = new Date();
    const id = this.subscriptionIdCounter++;
    const subscription: Subscription = { 
      ...insertSubscription, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.subscriptions.set(insertSubscription.organizationId, subscription);
    return subscription;
  }
  
  async getSubscription(organizationId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values())
      .find(sub => sub.organizationId === organizationId);
  }
  
  async updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return undefined;
    
    const updatedSubscription = { 
      ...subscription, 
      ...data, 
      updatedAt: new Date() 
    };
    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }
  
  // Organization Members methods
  async addOrganizationMember(insertMember: InsertOrganizationMember): Promise<OrganizationMember> {
    const now = new Date();
    const id = this.organizationMemberIdCounter++;
    const member: OrganizationMember = { 
      ...insertMember, 
      id, 
      addedAt: now 
    };
    this.organizationMembers.set(id, member);
    return member;
  }
  
  async getOrganizationMembers(organizationId: number): Promise<OrganizationMember[]> {
    return Array.from(this.organizationMembers.values())
      .filter(member => member.organizationId === organizationId);
  }
  
  async removeOrganizationMember(organizationId: number, userId: number): Promise<boolean> {
    const memberEntry = Array.from(this.organizationMembers.entries())
      .find(([_, member]) => member.organizationId === organizationId && member.userId === userId);
    
    if (!memberEntry) return false;
    return this.organizationMembers.delete(memberEntry[0]);
  }
  
  async updateOrganizationMemberRole(organizationId: number, userId: number, role: string): Promise<boolean> {
    const memberEntry = Array.from(this.organizationMembers.entries())
      .find(([_, member]) => member.organizationId === organizationId && member.userId === userId);
    
    if (!memberEntry) return false;
    
    const [id, member] = memberEntry;
    this.organizationMembers.set(id, { ...member, role: role as any });
    return true;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date();
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async getProjectsByUser(userId: number): Promise<Project[]> {
    const memberProjects = Array.from(this.projectMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.projectId);
    
    const createdProjects = Array.from(this.projects.values())
      .filter(project => project.createdBy === userId)
      .map(project => project.id);
    
    const projectIds = [...new Set([...memberProjects, ...createdProjects])];
    
    return Array.from(this.projects.values())
      .filter(project => projectIds.includes(project.id));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const now = new Date();
    const id = this.projectIdCounter++;
    const project: Project = { ...insertProject, id, createdAt: now };
    this.projects.set(id, project);
    
    // Add creator as project member with admin role
    await this.addProjectMember({
      projectId: id,
      userId: insertProject.createdBy,
      role: "admin"
    });
    
    return project;
  }
  
  async updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...data };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Project Members methods
  async getProjectMembers(projectId: number): Promise<ProjectMember[]> {
    return Array.from(this.projectMembers.values())
      .filter(member => member.projectId === projectId);
  }
  
  async addProjectMember(insertMember: InsertProjectMember): Promise<ProjectMember> {
    const id = this.memberIdCounter++;
    const member: ProjectMember = { ...insertMember, id };
    this.projectMembers.set(id, member);
    return member;
  }
  
  async removeProjectMember(projectId: number, userId: number): Promise<boolean> {
    const memberEntry = Array.from(this.projectMembers.entries())
      .find(([_, member]) => member.projectId === projectId && member.userId === userId);
    
    if (!memberEntry) return false;
    return this.projectMembers.delete(memberEntry[0]);
  }
  
  async updateProjectMemberRole(projectId: number, userId: number, role: string): Promise<boolean> {
    const memberEntry = Array.from(this.projectMembers.entries())
      .find(([_, member]) => member.projectId === projectId && member.userId === userId);
    
    if (!memberEntry) return false;
    
    const [id, member] = memberEntry;
    this.projectMembers.set(id, { ...member, role: role as any });
    return true;
  }

  // Phase methods
  async getPhases(projectId: number): Promise<Phase[]> {
    return Array.from(this.phases.values())
      .filter(phase => phase.projectId === projectId)
      .sort((a, b) => a.order - b.order);
  }
  
  async createPhase(insertPhase: InsertPhase): Promise<Phase> {
    const id = this.phaseIdCounter++;
    const phase: Phase = { ...insertPhase, id };
    this.phases.set(id, phase);
    return phase;
  }
  
  async updatePhase(id: number, data: Partial<InsertPhase>): Promise<Phase | undefined> {
    const phase = this.phases.get(id);
    if (!phase) return undefined;
    
    const updatedPhase = { ...phase, ...data };
    this.phases.set(id, updatedPhase);
    return updatedPhase;
  }
  
  async deletePhase(id: number): Promise<boolean> {
    return this.phases.delete(id);
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getTasksByProject(projectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.projectId === projectId);
  }
  
  async getTasksByPhase(phaseId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.phaseId === phaseId);
  }
  
  async getTasksByUser(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.assignedTo === userId);
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const now = new Date();
    const id = this.taskIdCounter++;
    const task: Task = { ...insertTask, id, createdAt: now };
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...data };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Checklist Items methods
  async getChecklistItems(taskId: number): Promise<ChecklistItem[]> {
    return Array.from(this.checklistItems.values())
      .filter(item => item.taskId === taskId)
      .sort((a, b) => a.order - b.order);
  }
  
  async createChecklistItem(insertItem: InsertChecklistItem): Promise<ChecklistItem> {
    const id = this.checklistIdCounter++;
    const item: ChecklistItem = { ...insertItem, id };
    this.checklistItems.set(id, item);
    return item;
  }
  
  async updateChecklistItem(id: number, data: Partial<InsertChecklistItem>): Promise<ChecklistItem | undefined> {
    const item = this.checklistItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...data };
    this.checklistItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteChecklistItem(id: number): Promise<boolean> {
    return this.checklistItems.delete(id);
  }

  // Files methods
  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }
  
  async getFilesByProject(projectId: number): Promise<File[]> {
    return Array.from(this.files.values())
      .filter(file => file.projectId === projectId);
  }
  
  async getFilesByTask(taskId: number): Promise<File[]> {
    return Array.from(this.files.values())
      .filter(file => file.taskId === taskId);
  }
  
  async createFile(insertFile: InsertFile): Promise<File> {
    const now = new Date();
    const id = this.fileIdCounter++;
    const file: File = { ...insertFile, id, uploadedAt: now };
    this.files.set(id, file);
    return file;
  }
  
  async deleteFile(id: number): Promise<boolean> {
    return this.files.delete(id);
  }

  // Activities methods
  async getActivitiesByProject(projectId: number, limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .filter(activity => activity.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? activities.slice(0, limit) : activities;
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const now = new Date();
    const id = this.activityIdCounter++;
    const activity: Activity = { ...insertActivity, id, createdAt: now };
    this.activities.set(id, activity);
    return activity;
  }

  // Comments methods
  async getCommentsByProject(projectId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getCommentsByTask(taskId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.taskId === taskId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const now = new Date();
    const id = this.commentIdCounter++;
    const comment: Comment = { ...insertComment, id, createdAt: now };
    this.comments.set(id, comment);
    return comment;
  }
  
  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }

  // Integrations methods
  async getIntegration(id: number): Promise<Integration | undefined> {
    return this.integrations.get(id);
  }
  
  async getIntegrationByType(type: string): Promise<Integration | undefined> {
    return Array.from(this.integrations.values())
      .find(integration => integration.type === type);
  }
  
  async getAllIntegrations(): Promise<Integration[]> {
    return Array.from(this.integrations.values());
  }
  
  async createIntegration(insertIntegration: InsertIntegration): Promise<Integration> {
    const now = new Date();
    const id = this.integrationIdCounter++;
    const integration: Integration = { 
      ...insertIntegration, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.integrations.set(id, integration);
    return integration;
  }
  
  async updateIntegration(id: number, data: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const integration = this.integrations.get(id);
    if (!integration) return undefined;
    
    const updatedIntegration = { 
      ...integration, 
      ...data, 
      updatedAt: new Date() 
    };
    this.integrations.set(id, updatedIntegration);
    return updatedIntegration;
  }
  
  async deleteIntegration(id: number): Promise<boolean> {
    return this.integrations.delete(id);
  }

  // Payment Integrations methods
  private paymentIntegrations: Map<number, PaymentIntegration> = new Map();
  private paymentIntegrationIdCounter: number = 1;

  async getPaymentIntegration(id: number): Promise<PaymentIntegration | undefined> {
    return this.paymentIntegrations.get(id);
  }

  async getPaymentIntegrationByProvider(provider: string): Promise<PaymentIntegration | undefined> {
    return Array.from(this.paymentIntegrations.values()).find(
      (integration) => integration.provider === provider
    );
  }

  async getAllPaymentIntegrations(): Promise<PaymentIntegration[]> {
    return Array.from(this.paymentIntegrations.values());
  }

  async createPaymentIntegration(insertIntegration: InsertPaymentIntegration): Promise<PaymentIntegration> {
    const now = new Date();
    const id = this.paymentIntegrationIdCounter++;
    const integration: PaymentIntegration = { 
      ...insertIntegration, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.paymentIntegrations.set(id, integration);
    return integration;
  }

  async updatePaymentIntegration(id: number, data: Partial<InsertPaymentIntegration>): Promise<PaymentIntegration | undefined> {
    const integration = this.paymentIntegrations.get(id);
    if (!integration) return undefined;
    
    const updatedIntegration = { 
      ...integration, 
      ...data, 
      updatedAt: new Date() 
    };
    this.paymentIntegrations.set(id, updatedIntegration);
    return updatedIntegration;
  }

  async deletePaymentIntegration(id: number): Promise<boolean> {
    return this.paymentIntegrations.delete(id);
  }

  // Admin Settings methods
  private adminSettings: Map<string, AdminSetting> = new Map();
  private adminSettingIdCounter: number = 1;

  async getAdminSettings(): Promise<Record<string, any> | undefined> {
    const settings = Array.from(this.adminSettings.values());
    if (settings.length === 0) return undefined;
    
    // Convert settings array to record
    const result: Record<string, any> = {};
    for (const setting of settings) {
      result[setting.settingKey] = setting.settingValue;
    }
    return result;
  }

  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    return Array.from(this.adminSettings.values()).find(
      (setting) => setting.settingKey === key
    );
  }

  async createAdminSetting(insertSetting: InsertAdminSetting): Promise<AdminSetting> {
    const id = this.adminSettingIdCounter++;
    const setting: AdminSetting = { 
      ...insertSetting, 
      id, 
      updatedAt: new Date() 
    };
    
    this.adminSettings.set(insertSetting.settingKey, setting);
    return setting;
  }

  async updateAdminSetting(key: string, value: any): Promise<AdminSetting | undefined> {
    const setting = await this.getAdminSetting(key);
    if (!setting) {
      // Create new setting if it doesn't exist
      return this.createAdminSetting({
        settingKey: key,
        settingValue: value,
        description: '',
        category: 'general'
      });
    }
    
    const updatedSetting = { 
      ...setting, 
      settingValue: value, 
      updatedAt: new Date() 
    };
    this.adminSettings.set(key, updatedSetting);
    return updatedSetting;
  }

  async updateAdminSettings(settings: Record<string, any>): Promise<Record<string, any>> {
    // Update or create each setting
    for (const [key, value] of Object.entries(settings)) {
      await this.updateAdminSetting(key, value);
    }
    return settings;
  }

  async deleteAdminSetting(key: string): Promise<boolean> {
    const setting = await this.getAdminSetting(key);
    if (!setting) return false;
    return this.adminSettings.delete(key);
  }

  // Partner Agencies methods
  private partnerAgencies: Map<number, PartnerAgency> = new Map();
  private partnerAgencyIdCounter: number = 1;

  async getPartnerAgency(id: number): Promise<PartnerAgency | undefined> {
    return this.partnerAgencies.get(id);
  }

  async getPartnerAgencyByEmail(email: string): Promise<PartnerAgency | undefined> {
    return Array.from(this.partnerAgencies.values()).find(
      (agency) => agency.email === email
    );
  }

  async getAllPartnerAgencies(): Promise<PartnerAgency[]> {
    return Array.from(this.partnerAgencies.values());
  }

  async createPartnerAgency(insertAgency: InsertPartnerAgency): Promise<PartnerAgency> {
    const now = new Date();
    const id = this.partnerAgencyIdCounter++;
    const agency: PartnerAgency = { 
      ...insertAgency, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.partnerAgencies.set(id, agency);
    return agency;
  }

  async updatePartnerAgency(id: number, data: Partial<InsertPartnerAgency>): Promise<PartnerAgency | undefined> {
    const agency = this.partnerAgencies.get(id);
    if (!agency) return undefined;
    
    const updatedAgency = { 
      ...agency, 
      ...data, 
      updatedAt: new Date() 
    };
    this.partnerAgencies.set(id, updatedAgency);
    return updatedAgency;
  }

  async deletePartnerAgency(id: number): Promise<boolean> {
    return this.partnerAgencies.delete(id);
  }
}

// Implementação do armazenamento com banco de dados PostgreSQL
export class DatabaseStorage implements IStorage {
  // Organization methods
  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(insertOrg).returning();
    return org;
  }
  
  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }
  
  async updateOrganization(id: number, data: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const [updatedOrg] = await db
      .update(organizations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updatedOrg;
  }
  
  // Organization Settings methods
  async createOrganizationSettings(insertSettings: InsertOrganizationSettings): Promise<OrganizationSettings> {
    const [settings] = await db
      .insert(organizationSettings)
      .values(insertSettings)
      .returning();
    return settings;
  }
  
  async getOrganizationSettings(organizationId: number): Promise<OrganizationSettings | undefined> {
    const [settings] = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, organizationId));
    return settings;
  }
  
  async updateOrganizationSettings(
    organizationId: number, 
    data: Partial<InsertOrganizationSettings>
  ): Promise<OrganizationSettings | undefined> {
    const [updatedSettings] = await db
      .update(organizationSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizationSettings.organizationId, organizationId))
      .returning();
    return updatedSettings;
  }
  
  // Subscription methods
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }
  
  async getSubscription(organizationId: number): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, organizationId));
    return subscription;
  }
  
  async updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription;
  }
  
  // Organization Members methods
  async addOrganizationMember(insertMember: InsertOrganizationMember): Promise<OrganizationMember> {
    const [member] = await db
      .insert(organizationMembers)
      .values(insertMember)
      .returning();
    return member;
  }
  
  async getOrganizationMembers(organizationId: number): Promise<OrganizationMember[]> {
    return db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, organizationId));
  }
  
  async removeOrganizationMember(organizationId: number, userId: number): Promise<boolean> {
    await db
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, userId)
        )
      );
    return true;
  }
  
  async updateOrganizationMemberRole(organizationId: number, userId: number, role: string): Promise<boolean> {
    await db
      .update(organizationMembers)
      .set({ role: role as any })
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, userId)
        )
      );
    return true;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }
  
  async getAllProjects(): Promise<Project[]> {
    return db.select().from(projects);
  }
  
  async getProjectsByUser(userId: number): Promise<Project[]> {
    // Obter projetos em que o usuário é membro
    const memberProjects = await db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId));
    
    const memberProjectIds = memberProjects.map(p => p.projectId);
    
    // Obter projetos criados pelo usuário
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.createdBy, userId));
    
    // Combinar resultados, removendo duplicatas
    if (memberProjectIds.length === 0) {
      return userProjects;
    }
    
    // Use o operador 'in' da forma correta com o drizzle-orm
    const memberProjectsList = await db
      .select()
      .from(projects)
      .where(
        // Uso correto do operador 'in' no drizzle
        memberProjectIds.length > 0 ? 
          inArray(projects.id, memberProjectIds) : 
          undefined
      );
    
    // Remover duplicatas (projetos que o usuário criou e também é membro)
    const projectMap = new Map<number, Project>();
    [...userProjects, ...memberProjectsList].forEach(project => {
      projectMap.set(project.id, project);
    });
    
    return Array.from(projectMap.values());
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    
    // Adicionar criador como membro do projeto com função de administrador
    await this.addProjectMember({
      projectId: project.id,
      userId: insertProject.createdBy,
      role: "admin"
    });
    
    return project;
  }
  
  async updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set(data)
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    await db.delete(projects).where(eq(projects.id, id));
    return true;
  }

  // Project Members methods
  async getProjectMembers(projectId: number): Promise<ProjectMember[]> {
    return db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, projectId));
  }
  
  async addProjectMember(insertMember: InsertProjectMember): Promise<ProjectMember> {
    const [member] = await db
      .insert(projectMembers)
      .values(insertMember)
      .returning();
    return member;
  }
  
  async removeProjectMember(projectId: number, userId: number): Promise<boolean> {
    await db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        )
      );
    return true;
  }
  
  async updateProjectMemberRole(projectId: number, userId: number, role: string): Promise<boolean> {
    await db
      .update(projectMembers)
      .set({ role: role as any })
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        )
      );
    return true;
  }

  // Phase methods
  async getPhases(projectId: number): Promise<Phase[]> {
    return db
      .select()
      .from(phases)
      .where(eq(phases.projectId, projectId))
      .orderBy(phases.order);
  }
  
  async createPhase(insertPhase: InsertPhase): Promise<Phase> {
    const [phase] = await db
      .insert(phases)
      .values(insertPhase)
      .returning();
    return phase;
  }
  
  async updatePhase(id: number, data: Partial<InsertPhase>): Promise<Phase | undefined> {
    const [updatedPhase] = await db
      .update(phases)
      .set(data)
      .where(eq(phases.id, id))
      .returning();
    return updatedPhase;
  }
  
  async deletePhase(id: number): Promise<boolean> {
    await db.delete(phases).where(eq(phases.id, id));
    return true;
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));
    return task;
  }
  
  async getTasksByProject(projectId: number): Promise<Task[]> {
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId));
  }
  
  async getTasksByPhase(phaseId: number): Promise<Task[]> {
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.phaseId, phaseId));
  }
  
  async getTasksByUser(userId: number): Promise<Task[]> {
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedTo, userId));
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }
  
  async updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set(data)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    await db.delete(tasks).where(eq(tasks.id, id));
    return true;
  }

  // Checklist Items methods
  async getChecklistItems(taskId: number): Promise<ChecklistItem[]> {
    return db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.taskId, taskId))
      .orderBy(checklistItems.order);
  }
  
  async createChecklistItem(insertItem: InsertChecklistItem): Promise<ChecklistItem> {
    const [item] = await db
      .insert(checklistItems)
      .values(insertItem)
      .returning();
    return item;
  }
  
  async updateChecklistItem(id: number, data: Partial<InsertChecklistItem>): Promise<ChecklistItem | undefined> {
    const [updatedItem] = await db
      .update(checklistItems)
      .set(data)
      .where(eq(checklistItems.id, id))
      .returning();
    return updatedItem;
  }
  
  async deleteChecklistItem(id: number): Promise<boolean> {
    await db.delete(checklistItems).where(eq(checklistItems.id, id));
    return true;
  }

  // Files methods
  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, id));
    return file;
  }
  
  async getFilesByProject(projectId: number): Promise<File[]> {
    return db
      .select()
      .from(files)
      .where(eq(files.projectId, projectId));
  }
  
  async getFilesByTask(taskId: number): Promise<File[]> {
    return db
      .select()
      .from(files)
      .where(eq(files.taskId, taskId));
  }
  
  async createFile(insertFile: InsertFile): Promise<File> {
    const [file] = await db
      .insert(files)
      .values(insertFile)
      .returning();
    return file;
  }
  
  async deleteFile(id: number): Promise<boolean> {
    await db.delete(files).where(eq(files.id, id));
    return true;
  }

  // Activities methods
  async getActivitiesByProject(projectId: number, limit?: number): Promise<Activity[]> {
    const query = db
      .select()
      .from(activities)
      .where(eq(activities.projectId, projectId))
      .orderBy(desc(activities.createdAt));
    
    if (limit) {
      query.limit(limit);
    }
    
    return query;
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  // Comments methods
  async getCommentsByProject(projectId: number): Promise<Comment[]> {
    return db
      .select()
      .from(comments)
      .where(eq(comments.projectId, projectId))
      .orderBy(desc(comments.createdAt));
  }
  
  async getCommentsByTask(taskId: number): Promise<Comment[]> {
    return db
      .select()
      .from(comments)
      .where(eq(comments.taskId, taskId))
      .orderBy(desc(comments.createdAt));
  }
  
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }
  
  async deleteComment(id: number): Promise<boolean> {
    await db.delete(comments).where(eq(comments.id, id));
    return true;
  }

  // Integrations methods
  async getIntegration(id: number): Promise<Integration | undefined> {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(eq(integrations.id, id));
    return integration;
  }
  
  async getIntegrationByType(type: string): Promise<Integration | undefined> {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(eq(integrations.type, type));
    return integration;
  }
  
  async getAllIntegrations(): Promise<Integration[]> {
    return db.select().from(integrations);
  }
  
  async createIntegration(insertIntegration: InsertIntegration): Promise<Integration> {
    const [integration] = await db
      .insert(integrations)
      .values(insertIntegration)
      .returning();
    return integration;
  }
  
  async updateIntegration(id: number, data: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const [updatedIntegration] = await db
      .update(integrations)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(integrations.id, id))
      .returning();
    return updatedIntegration;
  }
  
  async deleteIntegration(id: number): Promise<boolean> {
    await db.delete(integrations).where(eq(integrations.id, id));
    return true;
  }

  // Payment Integrations methods
  async getPaymentIntegration(id: number): Promise<PaymentIntegration | undefined> {
    const [integration] = await db
      .select()
      .from(paymentIntegrations)
      .where(eq(paymentIntegrations.id, id));
    return integration;
  }

  async getPaymentIntegrationByProvider(provider: string): Promise<PaymentIntegration | undefined> {
    const [integration] = await db
      .select()
      .from(paymentIntegrations)
      .where(eq(paymentIntegrations.provider, provider));
    return integration;
  }

  async getAllPaymentIntegrations(): Promise<PaymentIntegration[]> {
    return db.select().from(paymentIntegrations);
  }

  async createPaymentIntegration(insertIntegration: InsertPaymentIntegration): Promise<PaymentIntegration> {
    const [integration] = await db
      .insert(paymentIntegrations)
      .values(insertIntegration)
      .returning();
    return integration;
  }

  async updatePaymentIntegration(id: number, data: Partial<InsertPaymentIntegration>): Promise<PaymentIntegration | undefined> {
    const [updatedIntegration] = await db
      .update(paymentIntegrations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentIntegrations.id, id))
      .returning();
    return updatedIntegration;
  }

  async deletePaymentIntegration(id: number): Promise<boolean> {
    await db.delete(paymentIntegrations).where(eq(paymentIntegrations.id, id));
    return true;
  }

  // Admin Settings methods
  async getAdminSettings(): Promise<Record<string, any> | undefined> {
    const settings = await db.select().from(adminSettings);
    if (settings.length === 0) return undefined;
    
    // Convert settings array to record
    const result: Record<string, any> = {};
    for (const setting of settings) {
      result[setting.settingKey] = setting.settingValue;
    }
    return result;
  }

  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    const [setting] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.settingKey, key));
    return setting;
  }

  async createAdminSetting(insertSetting: InsertAdminSetting): Promise<AdminSetting> {
    const [setting] = await db
      .insert(adminSettings)
      .values(insertSetting)
      .returning();
    return setting;
  }

  async updateAdminSetting(key: string, value: any): Promise<AdminSetting | undefined> {
    // Verificar se a configuração existe
    const existingSetting = await this.getAdminSetting(key);
    
    if (!existingSetting) {
      // Criar nova configuração se não existir
      return this.createAdminSetting({
        settingKey: key,
        settingValue: value,
        description: '',
        category: 'general'
      });
    }
    
    // Atualizar configuração existente
    const [updatedSetting] = await db
      .update(adminSettings)
      .set({ 
        settingValue: value,
        updatedAt: new Date()
      })
      .where(eq(adminSettings.settingKey, key))
      .returning();
    
    return updatedSetting;
  }

  async updateAdminSettings(settings: Record<string, any>): Promise<Record<string, any>> {
    // Atualizar ou criar cada configuração
    for (const [key, value] of Object.entries(settings)) {
      await this.updateAdminSetting(key, value);
    }
    return settings;
  }

  async deleteAdminSetting(key: string): Promise<boolean> {
    await db
      .delete(adminSettings)
      .where(eq(adminSettings.settingKey, key));
    return true;
  }

  // Partner Agencies methods
  async getPartnerAgency(id: number): Promise<PartnerAgency | undefined> {
    const [agency] = await db
      .select()
      .from(partnerAgencies)
      .where(eq(partnerAgencies.id, id));
    return agency;
  }

  async getPartnerAgencyByEmail(email: string): Promise<PartnerAgency | undefined> {
    const [agency] = await db
      .select()
      .from(partnerAgencies)
      .where(eq(partnerAgencies.email, email));
    return agency;
  }

  async getAllPartnerAgencies(): Promise<PartnerAgency[]> {
    return db.select().from(partnerAgencies);
  }

  async createPartnerAgency(insertAgency: InsertPartnerAgency): Promise<PartnerAgency> {
    const [agency] = await db
      .insert(partnerAgencies)
      .values(insertAgency)
      .returning();
    return agency;
  }

  async updatePartnerAgency(id: number, data: Partial<InsertPartnerAgency>): Promise<PartnerAgency | undefined> {
    const [updatedAgency] = await db
      .update(partnerAgencies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(partnerAgencies.id, id))
      .returning();
    return updatedAgency;
  }

  async deletePartnerAgency(id: number): Promise<boolean> {
    await db
      .delete(partnerAgencies)
      .where(eq(partnerAgencies.id, id));
    return true;
  }
}

// Para desenvolvimento, é possível alternar entre armazenamento em memória ou banco de dados
// Usar MemStorage para desenvolvimento sem banco de dados
export const storage = new MemStorage();

// Usar DatabaseStorage para produção com banco de dados PostgreSQL
// export const storage = new DatabaseStorage();

// Inicializar o usuário admin se não existir
async function initializeAdmin() {
  try {
    const adminUser = await storage.getUserByUsername("admin");
    if (!adminUser) {
      await storage.createUser({
        username: "admin",
        password: "admin123",
        name: "Super Administrador",
        email: "admin@launchrocket.com",
        role: "admin",
        profession: "other",
        bio: "Administrador do sistema LaunchRocket",
        active: true
      });
      console.log("Usuário Super Admin criado com sucesso");
    } else {
      // Atualizar a senha do admin se necessário
      if (adminUser.password !== "admin123") {
        await storage.updateUser(adminUser.id, {
          password: "admin123"
        });
        console.log("Senha do usuário Super Admin atualizada");
      }
    }
  } catch (error) {
    console.error("Erro ao inicializar usuário Super Admin:", error);
  }
}

// Inicializar o admin na inicialização
initializeAdmin();
