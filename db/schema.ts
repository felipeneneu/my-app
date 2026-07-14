import { sqliteTable, text, integer, foreignKey } from "drizzle-orm/sqlite-core";

export const defaultFocusBlocks = [
  { id: "deep", label: "Modo Foco Profundo", hours: "09:00 → 13:00", tone: "emerald", start: 540, end: 780 },
  { id: "meet", label: "Reuniões com Clientes", hours: "14:00 → 16:00", tone: "violet", start: 840, end: 960 },
  { id: "design", label: "Sessão de UI/UX Design", hours: "16:30 → 18:30", tone: "emerald", start: 990, end: 1110 },
  { id: "admin", label: "Admin e Faturamento", hours: "18:30 → 19:00", tone: "amber", start: 1110, end: 1140 },
];

export const hunterRank = ["E", "D", "C", "B", "A", "S"] as const;
export const questType = ["lead", "project", "xp", "general"] as const;
export const leadStatus = ["new", "contacted", "negotiating", "won", "lost"] as const;
export const pipelineStage = ["hot", "warm", "cold"] as const;
export const projectStatus = ["active", "paused", "completed", "cancelled"] as const;
export const expenseType = ["fixed", "variable", "software", "infrastructure"] as const;
export const documentType = ["contract", "invoice", "proposal", "budget", "receipt", "os"] as const;
export const productCategory = ["branding", "ui-ux", "dev", "consulting", "other"] as const;
export const taskBlockType = ["deep_focus", "meeting", "deadline", "design", "admin"] as const;
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
  phone: text("phone"),
  status: text("status", { enum: ["new", "contacted", "negotiating", "won", "lost"] }).notNull().default("new"),
  pipelineStage: text("pipeline_stage", { enum: ["hot", "warm", "cold"] }),
  notes: text("notes"),
  lastContact: text("last_contact"),
  contactsCount: integer("contacts_count").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
  name: text("name").notNull(),
  description: text("description"),
  estimatedHours: integer("estimated_hours").notNull().default(0),
  materialCost: integer("material_cost").notNull().default(0),
  category: text("category", { enum: ["branding", "ui-ux", "dev", "consulting", "other"] }).notNull().default("other"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const clients = sqliteTable("clients", {
  id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  document: text("document"),
  documentType: text("document_type", { enum: ["cpf", "cnpj"] }).default("cpf"),
  cep: text("cep"),
  street: text("street"),
  number: text("number"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
    name: text("name").notNull(),
    clientName: text("client_name").notNull(),
    clientId: text("client_id"),
    price: integer("price").notNull(),
    status: text("status", { enum: ["active", "paused", "completed", "cancelled"] }).notNull(),
    clientMorale: integer("client_morale"),
    startDate: text("start_date").notNull(),
    totalHours: integer("total_hours"),
  },
  (table) => [
    foreignKey({
      columns: [table.clientId],
      foreignColumns: [clients.id],
    }).onDelete("set null"),
  ],
);

export const checklistTemplates = sqliteTable("checklist_templates", {
  id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const checklistTemplateItems = sqliteTable(
  "checklist_template_items",
  {
    id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
    templateId: text("template_id").notNull(),
    label: text("label").notNull(),
    orderIndex: integer("order_index").notNull().default(0),
  },
  (table) => [
    foreignKey({
      columns: [table.templateId],
      foreignColumns: [checklistTemplates.id],
    }).onDelete("cascade"),
  ],
);

export const projectChecklistItems = sqliteTable(
  "project_checklist_items",
  {
    id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
    projectId: text("project_id").notNull(),
    templateId: text("template_id"),
    label: text("label").notNull(),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.templateId],
      foreignColumns: [checklistTemplates.id],
    }).onDelete("set null"),
  ],
);

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
    projectId: text("project_id"),
    type: text("type", { enum: ["contract", "invoice", "proposal", "budget", "receipt", "os", "briefing"] }).notNull(),
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
    blockType: text("block_type", { enum: ["deep_focus", "meeting", "deadline", "design", "admin"] }).notNull(),
    dueDate: text("due_date").notNull(),
    startTime: text("start_time"),
    endTime: text("end_time"),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    estimatedHours: integer("estimated_hours"),
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
    estimatedHours: integer("estimated_hours"),
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

export const companyInfo = sqliteTable("company_info", {
  id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
  tradingName: text("trading_name").notNull().default(""),
  legalName: text("legal_name").notNull().default(""),
  document: text("document").notNull().default(""),
  stateRegistration: text("state_registration").default(""),
  cep: text("cep").default(""),
  street: text("street").default(""),
  number: text("number").default(""),
  complement: text("complement").default(""),
  neighborhood: text("neighborhood").default(""),
  city: text("city").default(""),
  state: text("state").default(""),
  phone: text("phone").default(""),
  email: text("email").default(""),
  logo: text("logo").default(""),
  bankName: text("bank_name").default(""),
  bankAgency: text("bank_agency").default(""),
  bankAccount: text("bank_account").default(""),
  pixKey: text("pix_key").default(""),
  pixKeyType: text("pix_key_type", { enum: ["cpf", "cnpj", "email", "phone", "random"] }).notNull().default("random"),
});

export const briefingNotes = sqliteTable(
  "briefing_notes",
  {
    id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
    projectId: text("project_id").notNull(),
    content: text("content").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    foreignKey({ columns: [table.projectId], foreignColumns: [projects.id] }).onDelete("cascade"),
  ],
);

export const clientContacts = sqliteTable(
  "client_contacts",
  {
    id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
    clientId: text("client_id").notNull(),
    type: text("type", { enum: ["call", "email", "meeting", "note", "other"] }).notNull().default("note"),
    subject: text("subject").notNull(),
    description: text("description"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    foreignKey({ columns: [table.clientId], foreignColumns: [clients.id] }).onDelete("cascade"),
  ],
);

export const addresses = sqliteTable(
  "addresses",
  {
    id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
    clientId: text("client_id").notNull(),
    label: text("label").notNull().default("Principal"),
    cep: text("cep"),
    street: text("street"),
    number: text("number"),
    neighborhood: text("neighborhood"),
    city: text("city"),
    state: text("state"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    foreignKey({ columns: [table.clientId], foreignColumns: [clients.id] }).onDelete("cascade"),
  ],
);

export const standardFases = sqliteTable("standard_fases", {
  id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
  nome: text("nome").notNull(),
  prazo_dias: integer("prazo_dias").notNull().default(15),
  ordem: integer("ordem").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
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
  proposalDefaultDiscount: integer("proposal_default_discount").notNull().default(10),
  proposalDownPayment: integer("proposal_down_payment").notNull().default(50),
  proposalInstallments: integer("proposal_installments").notNull().default(6),
  proposalSignatureName: text("proposal_signature_name").notNull().default("Felipe Neneu"),
  proposalSignatureRole: text("proposal_signature_role").notNull().default("Full-Stack Developer & Designer"),
  proposalSignatureSite: text("proposal_signature_site").notNull().default("www.felipeneneu.com.br"),
  proposalSignatureEmail: text("proposal_signature_email").notNull().default("contato@felipeneneu.com.br"),
  proposalSignatureCity: text("proposal_signature_city").notNull().default("São Paulo / SP"),
  proposalIntroMessage: text("proposal_intro_message").notNull().default("ESTA PROPOSTA É DIVIDIDA EM 3 ETAPAS PRINCIPAIS: BRANDING, DESIGN DE INTERFACE (UI/UX) E DESENVOLVIMENTO TECNOLÓGICO."),
  focusBlocks: text("focus_blocks").$defaultFn(() => JSON.stringify(defaultFocusBlocks)),
  streak: integer("streak").notNull().default(0),
  multaAtrasoPct: integer("multa_atraso_pct").notNull().default(5),
  jurosMoraPctMes: integer("juros_mora_pct_mes").notNull().default(1),
  valorHoraTecnica: integer("valor_hora_tecnica").notNull().default(10000),
  multaRescisaoPct: integer("multa_rescisao_pct").notNull().default(25),
  prazoEntregaMaterialDias: integer("prazo_entrega_material_dias").notNull().default(15),
  foroCidade: text("foro_cidade").notNull().default("São Paulo/SP"),
});

export const workSchedule = sqliteTable("work_schedule", {
  id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  blockType: text("block_type", { enum: ["work", "focus", "meeting", "break", "unavailable"] }).notNull().default("work"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
    projectId: text("project_id").notNull(),
    osId: text("os_id"),
    amount: integer("amount").notNull(),
    date: text("date").notNull(),
    method: text("method", { enum: ["pix", "transfer", "cash", "credit", "debit", "other"] }).notNull().default("pix"),
    note: text("note"),
    receiptId: text("receipt_id"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    foreignKey({ columns: [table.projectId], foreignColumns: [projects.id] }).onDelete("cascade"),
    foreignKey({ columns: [table.osId], foreignColumns: [documents.id] }).onDelete("set null"),
    foreignKey({ columns: [table.receiptId], foreignColumns: [documents.id] }).onDelete("set null"),
  ],
);

export const projectDeliverables = sqliteTable("project_deliverables", {
  id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
  name: text("name").notNull(),
  url: text("url"),
  status: text("status", { enum: ["online", "inactive", "maintenance"] }).notNull().default("online"),
  type: text("type").notNull().default("site"),
  deliveryDate: text("delivery_date"),
  note: text("note"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const achievements = sqliteTable("achievements", {
  id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
  name: text("name").notNull(),
  description: text("description"),
  conditionType: text("condition_type", {
    enum: ["task_ontime", "milestone_delivered", "project_completed", "phase_early", "payment_received"],
  }).notNull(),
  conditionValue: integer("condition_value").notNull(),
  xpBonus: integer("xp_bonus").notNull().default(100),
  icon: text("icon"),
  unlockedAt: text("unlocked_at"),
});

export const personalAccessTokens = sqliteTable("personal_access_tokens", {
  id: text("id").primaryKey().$defaultFn(crypto.randomUUID),
  token: text("token").notNull().unique(),
  name: text("name").notNull().default("Mobile Access"),
  lastUsedAt: text("last_used_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});