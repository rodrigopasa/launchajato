import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, jsonb, uuid, varchar, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum('role', ['admin', 'manager', 'member']);
export const orgRoleEnum = pgEnum('org_role', ['owner', 'admin', 'member']); // Papéis específicos da organização
export const projectStatusEnum = pgEnum('project_status', ['planning', 'in_progress', 'testing', 'completed', 'on_hold']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'review', 'completed']);
export const professionEnum = pgEnum('profession', ['developer', 'designer', 'social_media', 'marketing', 'content_writer', 'project_manager', 'qa_tester', 'devops', 'product_owner', 'data_analyst', 'ui_ux', 'business_analyst', 'other']);
export const integrationTypeEnum = pgEnum('integration_type', ['whatsapp', 'whatsapp_web', 'email', 'sms', 'other']);
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['free', 'starter', 'professional', 'enterprise', 'custom', 'partner_trial']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'trialing', 'past_due', 'canceled', 'unpaid']);
export const paymentMethodEnum = pgEnum('payment_method', ['credit_card', 'bank_transfer', 'mercado_pago', 'free_trial', 'partner_offer']);

// Organizations table (multi-tenant)
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // Identificador único para URLs - example: acme-corporation
  domain: text("domain").unique(), // Domínio personalizado opcional
  logo: text("logo"),
  primaryColor: text("primary_color").default('#0EA5E9'), // Cor principal da marca
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization settings table
export const organizationSettings = pgTable("organization_settings", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  defaultTimeZone: text("default_time_zone").default('UTC'),
  dateFormat: text("date_format").default('DD/MM/YYYY'),
  timeFormat: text("time_format").default('HH:mm'),
  logoUrl: text("logo_url"),
  whatsappEnabled: boolean("whatsapp_enabled").default(false), 
  emailNotificationsEnabled: boolean("email_notifications_enabled").default(true),
  maxStorageGb: integer("max_storage_gb").default(5),
  maxUsers: integer("max_users").default(5),
  maxProjects: integer("max_projects").default(10),
  settings: jsonb("settings").default({}), // Configurações adicionais em formato JSON
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription plans for SaaS model
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  plan: subscriptionPlanEnum("plan").notNull().default('free'),
  status: subscriptionStatusEnum("status").notNull().default('active'),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  trialEndsAt: timestamp("trial_ends_at"),
  paymentProvider: text("payment_provider"), // stripe, paypal, etc.
  paymentProviderId: text("payment_provider_id"), // ID externo no provedor de pagamento
  quantity: integer("quantity").default(1), // Número de licenças
  pricePerUnit: integer("price_per_unit"), // Preço em centavos
  billingCycle: text("billing_cycle").default('monthly'), // monthly, yearly
  canceledAt: timestamp("canceled_at"),
  cancelReason: text("cancel_reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: roleEnum("role").notNull().default('member'),
  profession: professionEnum("profession").default('other'),
  avatar: text("avatar"),
  
  // Campos do Stripe
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Organization members table (junction entre users e organizations)
export const organizationMembers = pgTable("organization_members", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: orgRoleEnum("role").notNull().default('member'),
  joinedAt: timestamp("joined_at").defaultNow(),
  invitedBy: integer("invited_by").references(() => users.id),
  inviteStatus: text("invite_status").default('accepted'), // pending, accepted, declined
  inviteToken: text("invite_token"),
  inviteExpiresAt: timestamp("invite_expires_at"),
  activeOrganization: boolean("active_organization").default(true), // Indica se essa é a organização atualmente ativa para o usuário
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    uniqueMember: unique("unique_org_member").on(table.organizationId, table.userId),
  }
});

// Projects table (com referência à organização)
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default('planning'),
  progress: integer("progress").notNull().default(0),
  startDate: timestamp("start_date"),
  deadline: timestamp("deadline"),
  budget: integer("budget"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project members table (junction table)
export const projectMembers = pgTable("project_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: roleEnum("role").notNull().default('member'),
  profession: professionEnum("profession").default('other'),
  addedAt: timestamp("added_at").defaultNow(),
  addedBy: integer("added_by").references(() => users.id),
}, (table) => {
  return {
    uniqueMember: unique("unique_project_member").on(table.projectId, table.userId),
  }
});

// Phases table
export const phases = pgTable("phases", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  phaseId: integer("phase_id").references(() => phases.id, { onDelete: 'set null' }),
  name: text("name").notNull(),
  description: text("description"),
  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: 'set null' }),
  priority: taskPriorityEnum("priority").notNull().default('medium'),
  status: taskStatusEnum("status").notNull().default('todo'),
  dueDate: timestamp("due_date"),
  estimatedHours: integer("estimated_hours"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Checklist items table
export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  text: text("text").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedBy: integer("completed_by").references(() => users.id),
  completedAt: timestamp("completed_at"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Files table
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: 'set null' }),
  name: text("name").notNull(),
  path: text("path").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id),
  projectId: integer("project_id").references(() => projects.id, { onDelete: 'cascade' }),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: 'set null' }),
  action: text("action").notNull(),
  subject: text("subject").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: 'cascade' }),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: 'set null' }),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System Integrations table (com referência à organização)
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  type: integrationTypeEnum("type").notNull(),
  name: text("name").notNull(),
  enabled: boolean("enabled").notNull().default(false),
  credentials: jsonb("credentials"),
  configuredBy: integer("configured_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments Integrations - específico para métodos de pagamento
export const paymentIntegrations = pgTable("payment_integrations", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  provider: text("provider").notNull(), // 'mercado_pago', 'stripe', etc
  name: text("name").notNull(),
  enabled: boolean("enabled").notNull().default(false),
  isDefault: boolean("is_default").default(false),
  credentials: jsonb("credentials"), // armazena credenciais API como access_token
  webhook_url: text("webhook_url"),
  webhook_secret: text("webhook_secret"),
  configuredBy: integer("configured_by").notNull().references(() => users.id),
  settings: jsonb("settings").default({}), // configurações específicas do provedor
  testMode: boolean("test_mode").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stripe Products table
export const stripeProducts = pgTable("stripe_products", {
  id: serial("id").primaryKey(),
  stripeId: text("stripe_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stripe Prices table
export const stripePrices = pgTable("stripe_prices", {
  id: serial("id").primaryKey(),
  stripeId: text("stripe_id").notNull().unique(),
  productId: integer("product_id").notNull().references(() => stripeProducts.id, { onDelete: 'cascade' }),
  type: text("type").notNull().default('recurring'), // 'recurring' or 'one_time'
  recurring: jsonb("recurring"), // interval, interval_count, etc.
  unitAmount: integer("unit_amount").notNull(), // amount in cents
  currency: text("currency").notNull().default('usd'),
  active: boolean("active").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stripe Customers table
export const stripeCustomers = pgTable("stripe_customers", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  stripeId: text("stripe_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  phone: text("phone"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Super Admin Settings
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: jsonb("setting_value"),
  description: text("description"),
  category: text("category").default('general'),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Partner Agencies - para liberar acesso temporário
export const partnerAgencies = pgTable("partner_agencies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  accessLevel: text("access_level").default('trial'), // 'trial', 'partner', 'reseller'
  trialStartDate: timestamp("trial_start_date").defaultNow(),
  trialEndDate: timestamp("trial_end_date"),
  maxOrganizations: integer("max_organizations").default(1),
  status: text("status").default('active'), // 'active', 'suspended', 'expired'
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).pick({
  name: true,
  slug: true,
  domain: true,
  logo: true,
  primaryColor: true,
  active: true,
});

export const insertOrganizationSettingsSchema = createInsertSchema(organizationSettings).pick({
  organizationId: true,
  defaultTimeZone: true,
  dateFormat: true,
  timeFormat: true,
  logoUrl: true,
  whatsappEnabled: true,
  emailNotificationsEnabled: true,
  maxStorageGb: true,
  maxUsers: true,
  maxProjects: true,
  settings: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  organizationId: true,
  plan: true,
  status: true,
  startDate: true,
  endDate: true,
  trialEndsAt: true,
  paymentProvider: true,
  paymentProviderId: true,
  quantity: true,
  pricePerUnit: true,
  billingCycle: true,
  metadata: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
  profession: true,
  avatar: true,
});

export const insertOrganizationMemberSchema = createInsertSchema(organizationMembers).pick({
  organizationId: true,
  userId: true,
  role: true,
  invitedBy: true,
  inviteStatus: true,
  inviteToken: true,
  inviteExpiresAt: true,
  activeOrganization: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  status: true,
  progress: true,
  startDate: true,
  deadline: true,
  budget: true,
  createdBy: true,
});

export const insertProjectMemberSchema = createInsertSchema(projectMembers).pick({
  projectId: true,
  userId: true,
  role: true,
  profession: true,
});

export const insertPhaseSchema = createInsertSchema(phases).pick({
  projectId: true,
  name: true,
  description: true,
  order: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  projectId: true,
  phaseId: true,
  name: true,
  description: true,
  assignedTo: true,
  priority: true,
  status: true,
  dueDate: true,
});

export const insertChecklistItemSchema = createInsertSchema(checklistItems).pick({
  taskId: true,
  text: true,
  isCompleted: true,
  completedBy: true,
  order: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  projectId: true,
  taskId: true,
  name: true,
  path: true,
  mimeType: true,
  size: true,
  uploadedBy: true,
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  projectId: true,
  taskId: true,
  action: true,
  subject: true,
  details: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  projectId: true,
  taskId: true,
  userId: true,
  content: true,
  parentId: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).pick({
  type: true,
  name: true,
  enabled: true,
  credentials: true,
  configuredBy: true,
});

export const insertPaymentIntegrationSchema = createInsertSchema(paymentIntegrations).pick({
  organizationId: true,
  provider: true,
  name: true,
  enabled: true,
  isDefault: true,
  credentials: true,
  webhook_url: true,
  webhook_secret: true,
  configuredBy: true,
  settings: true,
  testMode: true,
});

export const insertStripeProductSchema = createInsertSchema(stripeProducts).pick({
  stripeId: true,
  name: true,
  description: true,
  active: true,
  metadata: true,
});

export const insertStripePriceSchema = createInsertSchema(stripePrices).pick({
  stripeId: true,
  productId: true,
  type: true,
  recurring: true,
  unitAmount: true,
  currency: true,
  active: true,
  metadata: true,
});

export const insertStripeCustomerSchema = createInsertSchema(stripeCustomers).pick({
  organizationId: true,
  stripeId: true,
  email: true,
  name: true,
  phone: true,
  metadata: true,
});

export const insertAdminSettingSchema = createInsertSchema(adminSettings).pick({
  settingKey: true,
  settingValue: true,
  description: true,
  category: true,
  updatedBy: true,
});

export const insertPartnerAgencySchema = createInsertSchema(partnerAgencies).pick({
  name: true,
  contactName: true,
  email: true,
  phone: true,
  accessLevel: true,
  trialStartDate: true,
  trialEndDate: true,
  maxOrganizations: true,
  status: true,
  notes: true,
  createdBy: true,
});

// Types para organização
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

export type InsertOrganizationSettings = z.infer<typeof insertOrganizationSettingsSchema>;
export type OrganizationSettings = typeof organizationSettings.$inferSelect;

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertOrganizationMember = z.infer<typeof insertOrganizationMemberSchema>;
export type OrganizationMember = typeof organizationMembers.$inferSelect;

// Tipos para entidades existentes
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertProjectMember = z.infer<typeof insertProjectMemberSchema>;
export type ProjectMember = typeof projectMembers.$inferSelect;

export type InsertPhase = z.infer<typeof insertPhaseSchema>;
export type Phase = typeof phases.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type ChecklistItem = typeof checklistItems.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;

export type InsertPaymentIntegration = z.infer<typeof insertPaymentIntegrationSchema>;
export type PaymentIntegration = typeof paymentIntegrations.$inferSelect;

export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
export type AdminSetting = typeof adminSettings.$inferSelect;

export type InsertPartnerAgency = z.infer<typeof insertPartnerAgencySchema>;
export type PartnerAgency = typeof partnerAgencies.$inferSelect;

// Tipos para Stripe
export type InsertStripeProduct = z.infer<typeof insertStripeProductSchema>;
export type StripeProduct = typeof stripeProducts.$inferSelect;

export type InsertStripePrice = z.infer<typeof insertStripePriceSchema>;
export type StripePrice = typeof stripePrices.$inferSelect;

export type InsertStripeCustomer = z.infer<typeof insertStripeCustomerSchema>;
export type StripeCustomer = typeof stripeCustomers.$inferSelect;
