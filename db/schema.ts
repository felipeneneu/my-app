import { sqliteTable, text, integer, foreignKey } from "drizzle-orm/sqlite-core";

export const hunterRank = ["E", "D", "C", "B", "A", "S"] as const;
export const questType = ["lead", "project", "xp", "general"] as const;
export const leadStatus = ["new", "contacted", "negotiating", "won", "lost"] as const;
export const projectStatus = ["active", "paused", "completed", "cancelled"] as const;
export const expenseType = ["fixed", "variable", "software", "infrastructure"] as const;
export const documentType = ["contract", "invoice", "proposal"] as const;
export const taskBlockType = ["deep_focus", "meeting", "deadline"] as const;
export const notificationType = ["info", "warning", "deadline", "insight", "suggestion", "system"] as const;
export const notificationPriority = ["low", "medium", "high"] as const;

export const hunterStatus = sqliteTable("hunter_status", {
  id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
  level: integer("level").notNull().default(1),
  currentXp: integer("current_xp").notNull().default(0),
  maxXp: integer("max_xp").notNull().default(100),
  goldBalance: integer("gold_balance").notNull().default(0),
  hunterRank: text("hunter_rank", { enum: ["E", "D", "C", "B", "A", "S"] }).notNull(),
  strength: integer("strength").notNull().default(10),
  intelligence: integer("intelligence").notNull().default(10),
  wisdom: integer("wisdom").notNull().default(10),
});

export const dailyQuests = sqliteTable("daily_quests", {
  id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
  description: text("description").notNull(),
  progressCurrent: integer("progress_current").notNull().default(0),
  progressTarget: integer("progress_target").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  type: text("type", { enum: ["lead", "project", "xp", "general"] }).notNull(),
});

export const leads = sqliteTable("leads", {
  id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
  businessName: text("business_name").notNull(),
  email: text("email"),
  status: text("status", { enum: ["new", "contacted", "negotiating", "won", "lost"] }).notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
  name: text("name").notNull(),
  clientName: text("client_name").notNull(),
  price: integer("price").notNull(),
  status: text("status", { enum: ["active", "paused", "completed", "cancelled"] }).notNull(),
  clientMorale: integer("client_morale"),
  startDate: text("start_date").notNull(),
});

export const businessExpenses = sqliteTable(
  "business_expenses",
  {
    id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
    description: text("description").notNull(),
    amount: integer("amount").notNull(),
    type: text("type", { enum: ["fixed", "variable", "software", "infrastructure"] }).notNull(),
    projectId: text("project_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
    }).onDelete("set null"),
  ],
);

export const documents = sqliteTable(
  "documents",
  {
    id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
    projectId: text("project_id").notNull(),
    type: text("type", { enum: ["contract", "invoice", "proposal"] }).notNull(),
    contentJson: text("content_json").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
    }).onDelete("cascade"),
  ],

);
export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
    title: text("title").notNull(),
    projectId: text("project_id").notNull(),
    blockType: text("block_type", { enum: ["deep_focus", "meeting", "deadline"] }).notNull(),
    dueDate: text("due_date").notNull(),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
    }).onDelete("cascade"),
  ],
);

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
  type: text("type", { enum: ["info", "warning", "deadline", "insight", "suggestion", "system"] }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  priority: text("priority", { enum: ["low", "medium", "high"] }).notNull().default("low"),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const milestoneStatus = ["pending", "done", "delivered"] as const;

export const milestones = sqliteTable(
  "milestones",
  {
    id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
    projectId: text("project_id").notNull(),
    label: text("label").notNull(),
    status: text("status", { enum: ["pending", "done", "delivered"] }).notNull().default("pending"),
  },
  (table) => [
    foreignKey({ columns: [table.projectId], foreignColumns: [projects.id] }).onDelete("cascade"),
  ],
);

export const fixedCosts = sqliteTable("fixed_costs", {
  id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
  label: text("label").notNull(),
  amount: integer("amount").notNull(),
  category: text("category").notNull().default("Software"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const revenues = sqliteTable(
  "revenues",
  {
    id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
    projectId: text("project_id").notNull(),
    label: text("label").notNull(),
    amount: integer("amount").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    foreignKey({ columns: [table.projectId], foreignColumns: [projects.id] }).onDelete("cascade"),
  ],
);

export const habits = sqliteTable("habits", {
  id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
  label: text("label").notNull(),
  attribute: text("attribute", { enum: ["STR", "INT", "WIS"] }).notNull(),
  xpReward: integer("xp_reward").notNull().default(50),
  goldReward: integer("gold_reward").notNull().default(30),
  category: text("category").notNull().default("Geral"),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  date: text("date").notNull(),
});

export const workspaceConfig = sqliteTable("workspace_config", {
  id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
  workspaceName: text("workspace_name").notNull().default("Studio One"),
  userName: text("user_name").notNull().default("Felipe Neneu"),
  userEmail: text("user_email").notNull().default(""),
  userRole: text("user_role").notNull().default("Autônomo · Pro"),
  userInitials: text("user_initials").notNull().default("FN"),
  businessAlias: text("business_alias").notNull().default("Jordan Diaz"),
  monthlyGoal: integer("monthly_goal").notNull().default(15000),
});