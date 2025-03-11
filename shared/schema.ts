import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum('role', ['admin', 'manager', 'member']);
export const projectStatusEnum = pgEnum('project_status', ['planning', 'in_progress', 'testing', 'completed', 'on_hold']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'review', 'completed']);
export const professionEnum = pgEnum('profession', ['developer', 'designer', 'social_media', 'marketing', 'content_writer', 'project_manager', 'qa_tester', 'devops', 'product_owner', 'data_analyst', 'ui_ux', 'business_analyst', 'other']);
export const integrationTypeEnum = pgEnum('integration_type', ['whatsapp', 'whatsapp_web', 'email', 'sms', 'other']);

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
  createdAt: timestamp("created_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default('planning'),
  progress: integer("progress").notNull().default(0),
  startDate: timestamp("start_date"),
  deadline: timestamp("deadline"),
  budget: integer("budget"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").notNull(),
});

// Project members table (junction table)
export const projectMembers = pgTable("project_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  userId: integer("user_id").notNull(),
  role: roleEnum("role").notNull().default('member'),
  profession: professionEnum("profession").default('other'),
});

// Phases table
export const phases = pgTable("phases", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  phaseId: integer("phase_id"),
  name: text("name").notNull(),
  description: text("description"),
  assignedTo: integer("assigned_to"),
  priority: taskPriorityEnum("priority").notNull().default('medium'),
  status: taskStatusEnum("status").notNull().default('todo'),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Checklist items table
export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  text: text("text").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  order: integer("order").notNull(),
});

// Files table
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  taskId: integer("task_id"),
  name: text("name").notNull(),
  path: text("path").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  uploadedBy: integer("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id").notNull(),
  taskId: integer("task_id"),
  action: text("action").notNull(),
  subject: text("subject").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  taskId: integer("task_id"),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// System Integrations table
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  type: integrationTypeEnum("type").notNull(),
  name: text("name").notNull(),
  enabled: boolean("enabled").notNull().default(false),
  credentials: jsonb("credentials"),
  configuredBy: integer("configured_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
  profession: true,
  avatar: true,
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
});

export const insertIntegrationSchema = createInsertSchema(integrations).pick({
  type: true,
  name: true,
  enabled: true,
  credentials: true,
  configuredBy: true,
});

// Types
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
