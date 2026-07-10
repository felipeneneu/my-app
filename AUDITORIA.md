# Auditoria Sprint OS — Julho 2026

> Auditoria completa do sistema: funcionalidades, fluxos, requisitos, o que é real vs estético e oportunidades de melhoria.

---

## O que é o sistema

**Sprint OS** é um sistema de gestão para freelancer/estúdio criado por Felipe Neneu (Full-stack Developer & Designer). Combina:

- **Gestão comercial**: leads/pipeline, clientes, projetos, produtos, orçamentos, contratos, recibos
- **Criação de propostas**: editor de propostas comerciais com preview visual e exportação PDF
- **Portal do cliente**: página pública tokenizada para o cliente acompanhar o projeto
- **Produtividade**: calendário com time-blocking, dashboard semanal, engine de sugestões
- **Gamificação**: sistema RPG completo (hunter, XP, gold, atributos STR/INT/WIS, hábitos, quests diárias, ranking E-S)
- **Business intelligence**: engine de notificações que monitora o banco de dados e gera insights acionáveis
- **Tempo real**: SSE (Server-Sent Events) para notificações live

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.10 |
| Build | Turbopack | — |
| Linguagem | TypeScript | 5.x |
| UI | Tailwind CSS v4 + shadcn/ui (base-ui) | — |
| Icons | Lucide React | 1.23.x |
| Banco de Dados | Turso (libSQL) com fallback SQLite local | — |
| ORM | Drizzle ORM + Drizzle Kit | 1.0.0-rc.4 |
| Estado/Data Fetching | TanStack React Query | 5.x |
| Formulários | react-hook-form + zod | 7.x / 4.x |
| PDF (cliente) | html2canvas + jsPDF | — |
| PDF (servidor) | @react-pdf/renderer | — |
| Gráficos | Recharts | 3.x |
| Drag-and-Drop | @dnd-kit | — |
| Notificações | Sonner (toast) | — |
| Streaming | SSE (Server-Sent Events) | — |
| Tema | next-themes | — |
| Autenticação | ❌ **NENHUMA** | — |
| Testes | ❌ **NENHUM** | — |

---

## Rotas, Estado e Funcionalidade

### Front-end (App Router)

| Rota | Estado | Funcionalidade | DB |
|---|---|---|---|
| `/` | **ESQUELETO** | Placeholder de 5 linhas: "Welcome to the Home Page" | ❌ |
| `/onboarding` | ✅ Completo | Wizard de criação de personagem (Solo/Mage/Warrior), distribuição de atributos (30 pontos), cria hunter no DB, redireciona pra `/adm` | ✅ |
| `/orcamento` | ✅ Completo | Editor full-page de proposta comercial: busca cliente, tipo de projeto, preços por etapa, cronograma, preview de 17 páginas, exportação PDF (html2canvas+jsPDF), contato | ✅ |
| `/track` | ✅ Completo | Input de token para cliente acessar projeto | ❌ |
| `/track/[token]` | ✅ Completo | Portal do cliente: dados do projeto, milestones, notas do briefing, documentos, barra de progresso | ✅ |
| `/p/[id]` | ✅ Completo | Proposta pública com slides, dados financeiros, botão de aprovação. Aprovar → cria projeto+contrato+token | ✅ |

### Admin (`/adm`)

| Rota | Estado | Funcionalidade | DB |
|---|---|---|---|
| `/adm` | ✅ Completo | Dashboard semanal (9 dias), tasks reais do DB, stats, notificações SSE, focus blocks (hardcoded), criação de projeto/task | ✅ |
| `/adm/pipeline` | ✅ Completo | Kanban real com @dnd-kit (Hot/Warm/Cold/Won/Lost), converter lead em cliente dá XP+Gold, nota, contato WhatsApp, delete | ✅ |
| `/adm/clients` | ✅ Completo | CRUD clientes, busca, stats | ✅ |
| `/adm/clients/[id]` | ✅ Completo | Detalhe do cliente com projetos e orçamentos relacionados | ✅ |
| `/adm/project` | ✅ Completo | Seletor de projetos para briefing | ✅ |
| `/adm/project/[id]/briefing` | ✅ Completo | Anotações de briefing por projeto | ✅ |
| `/adm/[projectId]` | ✅ Completo | Detalhe do projeto: milestones, despesas, checklists (de template), tasks, contrato, orçamento, token | ✅ |
| `/adm/budget` | ✅ Completo | Lista de orçamentos salvos | ✅ |
| `/adm/budget/new` | ✅ Completo | Criar orçamento: busca cliente+produtos, rateio por meta mensal, preço por etapa, gera JSON e salva como documento | ✅ |
| `/adm/budget/[id]` | ✅ Completo | Visualizar orçamento, aprovar → cria projeto+contrato+token, link público /p/[id] | ✅ |
| `/adm/contract` | ✅ Completo | Lista de contratos | ✅ |
| `/adm/contract/[id]` | ✅ Completo | Detalhe do contrato | ✅ |
| `/adm/receipt` | ✅ Completo | Lista de recibos | ✅ |
| `/adm/receipt/[id]` | ✅ Completo | Detalhe do recibo | ✅ |
| `/adm/quotations` | ✅ Completo | Hub unificado: budgets, contratos e recibos num lugar só | ✅ |
| `/adm/products` | ✅ Completo | Catálogo de produtos/serviços (branding, ui-ux, dev, consulting, other) com horas e custo material | ✅ |
| `/adm/company` | ✅ Completo | Dados da empresa: nome, documento, endereço (CEP auto-fill ViaCEP), dados bancários, PIX | ✅ |
| `/adm/financial` | ✅ Completo | Custos fixos, custos de projeto, receitas, DRE (por projeto), meta mensal (editável) | ✅ |
| `/adm/calendar` | ✅ Completo | Calendário de tasks com filtro por projeto | ✅ |
| `/adm/growth` | ✅ Completo | Hábitos diários com recompensa XP/Gold, atributos STR/INT/WIS, barra de progresso diário | ✅ |
| `/adm/hunter-system` | ✅ Completo | Level, XP, Gold, Rank (E-S), quests diárias, "Golpe de Prospecção" (gera script + XP+Gold), Shop (não persiste compras) | ✅ |
| `/adm/notifications` | ✅ Completo | Central de notificações com abas All/Unread, mark read/dismiss/clear, SSE em tempo real | ✅ |
| `/adm/checklist-templates` | ✅ Completo | Gerenciar templates de checklist reutilizáveis | ✅ |
| `/adm/system` | ✅ Completo | Health check do sistema e banco | ✅ |
| `/adm/profile` | ✅ Completo | Ficha do personagem com atributos | ✅ |

### API

| Rota | Estado | Funcionalidade |
|---|---|---|
| `/api/notifications/stream` | ✅ Completo | SSE stream real: engine gera notificações a cada 40s, envia para clientes conectados |

---

## Banco de Dados (20 tabelas)

Todas com CRUD funcional via Server Actions.

| Tabela | Colunas | Finalidade |
|---|---|---|
| `hunter_status` | id, level, currentXp, maxXp, goldBalance, hunterRank (E-S), strength, intelligence, wisdom | RPG character stats |
| `daily_quests` | id, description, progressCurrent, progressTarget, completed, type (lead/project/xp/general) | Quests diárias gamificadas |
| `leads` | id, businessName, email, phone, status (new/contacted/negotiating/won/lost), pipelineStage (hot/warm/cold), notes, lastContact, contactsCount, createdAt | Pipeline de vendas |
| `products` | id, name, description, estimatedHours, materialCost, category (branding/ui-ux/dev/consulting/other), createdAt | Catálogo de serviços |
| `clients` | id, name, email, phone, document, notes, createdAt | Clientes |
| `projects` | id, name, clientName, clientId (FK), price, status (active/paused/completed/cancelled), clientMorale, startDate | Projetos |
| `checklist_templates` | id, name, description, createdAt | Blueprints de checklist |
| `checklist_template_items` | id, templateId (FK), label, orderIndex | Itens do template |
| `project_checklist_items` | id, projectId (FK), templateId (FK), label, completed, createdAt | Itens por projeto |
| `business_expenses` | id, description, amount, type (fixed/variable/software/infrastructure), projectId (FK) | Despesas de projeto |
| `documents` | id, projectId (FK), type (contract/invoice/proposal/budget/receipt/os), contentJson (JSON) | Orçamentos, contratos, recibos |
| `tasks` | id, title, projectId (FK), blockType (deep_focus/meeting/deadline/design/admin), dueDate, startTime, endTime, completed, createdAt | Tasks do calendário |
| `notifications` | id, type (info/warning/deadline/insight/suggestion/system), title, message, read, priority (low/medium/high), entityType, entityId, createdAt | Notificações do engine |
| `milestones` | id, projectId (FK), label, status (pending/done/delivered) | Marcos do projeto |
| `fixed_costs` | id, label, amount, category, active | Custos fixos mensais |
| `revenues` | id, projectId (FK), label, amount, createdAt | Receitas por projeto |
| `habits` | id, label, attribute (STR/INT/WIS), xpReward, goldReward, category, done, date | Hábitos diários |
| `company_info` | id, tradingName, legalName, document, stateRegistration, cep, street, number, complement, neighborhood, city, state, phone, email, logo, bankName, bankAgency, bankAccount, pixKey, pixKeyType | Dados da empresa |
| `briefing_notes` | id, projectId (FK), content, createdAt | Notas de briefing |
| `project_tokens` | id, projectId (FK), token (unique), active, createdAt | Tokens para acesso do cliente |
| `workspace_config` | id, workspaceName, userName, userEmail, userRole, userInitials, businessAlias, monthlyGoal, proposalDefaultDiscount, proposalDownPayment, proposalInstallments, proposalSignatureName, proposalSignatureRole, proposalSignatureSite, proposalSignatureEmail, proposalSignatureCity, proposalIntroMessage | Config centralizada |

---

## Engine de Notificações (`lib/engine/`)

Código real (~517 linhas em `engine.ts`) que analisa o banco de dados e gera insights automaticamente:

| Tipo | O que monitora |
|---|---|
| Overdue tasks | Tarefas com dueDate passado e não concluídas |
| Empty days | Dias sem tasks no calendário |
| Budget consumption | Projetos com despesas perto do valor |
| Stale leads | Leads sem contato há 7+ dias |
| Empty pipeline | Nenhum lead no pipeline |
| Converted leads | Lead movido para Won |
| Prospecting goal | Meta de prospecção não batida |
| Pending proposals | Propostas enviadas sem retorno |
| Pipeline insights | Taxa de conversão, forecast, saldo |
| Weekly productivity | Tasks feitas na semana |
| Monthly goal pacing | Progresso da meta mensal |
| Agenda suggestions | Sugestão de blocos de foco, deadlines, follow-ups |

---

## Fluxos Principais

### 1. Lead → Cliente → Projeto

```
Pipeline (novo lead)
  → Negociação (Hot / Warm / Cold)
  → Won → vira Cliente (+XP, +Gold)
  → Cria Projeto
  → Gera Token pro cliente acompanhar
  → Cliente acessa /track/[token]
```

### 2. Proposta → Aprovação → Projeto

```
/orcamento (rápido) ou /adm/budget/new (completo)
  → Preenche dados, clientes, produtos, prazos, financeiro
  → Preview visual + exportação PDF
  → Salva como documento (type: budget)
  → /p/[id] — link público pro cliente
  → Cliente aprova → cria Projeto + Contrato + Token
```

### 3. Produtividade Diária

```
Dashboard mostra semana com tasks do DB
  → Focus blocks guiam o dia (Deep Focus 9-13, Meetings 14-16, Design 16:30-18:30, Admin 18:30-19)
  → Engine sugere blocos de foco e alertas
  → Notificações SSE em tempo real
  → Growth: hábitos diários dão XP+Gold
  → Hunter System: quests diárias guiam prospecção
```

---

## Funcional vs Estético — Diagnóstico

### ✅ REAL (funciona de ponta a ponta com DB)

- Onboarding → wizard cria hunter no banco, redireciona
- Pipeline → kanban real, CRUD leads, converter em cliente dá XP+Gold
- Orçamentos → cria, edita, aprova, gera projeto+contrato+token automaticamente
- Propostas (/orcamento) → builder interativo com preview e PDF
- Financeiro → CRUD custos fixos, despesas, receitas, DRE, meta mensal
- Hunter System → nível, XP, gold, quests, "Golpe de Prospecção"
- Growth → hábitos diários com recompensa e atributos
- Notificações → engine gera no servidor, SSE entrega em tempo real
- Calendar → tasks filtradas por projeto
- Clientes, Produtos, Empresa, Checklist → CRUD completo
- Track → portal do cliente funcional com milestones
- Pproposal → proposta pública com aprovação

### ⚠️ PARCIAL (funciona com ressalvas)

| Funcionalidade | Problema | O que falta |
|---|---|---|
| Focus blocks (dashboard) | Hardcoded no scheduler | Criar tabela/JSON no workspace_config, sheet de edição (SPRINT.md item 7) |
| Hunter Shop | 4 itens na UI, compra só atualiza estado local | Persistir no DB (descontar gold, tabela inventário) |
| Habits (Growth) | Fallback hardcoded se DB vazio | Já salva no DB quando cria, só precisa de seed inicial |
| Dashboard Focus Automation | Toggle existe mas não controla nada | Integrar toggle com scheduler pra bloocar tempo |

### ❌ ESQUELETO / AUSENTE

| Item | Status | Impacto |
|---|---|---|
| Home page (`/`) | Placeholder 5 linhas | Sem fachada profissional pro mundo |
| Autenticação | Zero | App single-user, sem login/sessão |
| Testes | Zero arquivos `.test.` ou `.spec.` | Risco alto pra refatoração |
| Gráficos financeiros | Só tabelas e cards | Podia ter recharts pra visualizar |
| Shop CRUD | Sem tabela de inventário | Gold não tem utilidade real |
| Focus blocks editáveis | Hardcoded, sem DB | Pendente do SPRINT.md |

---

## Oportunidades de Melhoria

### Para você como freelancer começando carreira

| # | Oportunidade | Por que importa |
|---|---|---|
| 1 | **Home Page profissional** — `/` vazia, podia ser portfólio/showcase | É a porta de entrada pro mundo |
| 2 | **Autenticação** — essencial se quiser abrir pra outros usos | Sem login não escala |
| 3 | **Página pública "Como eu trabalho"** — pacotes, preços, metodologia | Cliente entende seu processo |
| 4 | **Captura de leads automatizada** — formulário público → pipeline | Cliente chega sozinho |
| 5 | **Site pessoal integrado** — o sistema já tem propostas, tracking, portfólio. Só falta a fachada | Tudo num lugar só |
| 6 | **Templates de proposta editáveis** — hoje o texto é fixo no código | Mais flexibilidade por cliente |
| 7 | **Shop funcional** — compras com gold deviam persistir (ex: desbloquear template, pular quest) | Gold vira moeda real |
| 8 | **Focus modes editáveis** — já planejado no SPRINT.md | Produtividade adaptável |
| 9 | **Testes** — fundamental pra qualquer sistema que vai crescer | Previne regressão |
| 10 | **Modo PWA / mobile** — ideal pra usar no dia a dia | Acesso rápido do celular |

### O que é único e pode ser seu diferencial

- **Gamificação de produtividade + prospecção**: o hunter system integrado ao pipeline de vendas é algo que não se vê em ferramentas como Trello, Notion ou PipeDrive
- **Engine de notificações** age como um "assistente virtual" que monitora seu negócio e sugere ações
- **Fluxo completo** proposta → aprovação → projeto → tracking do cliente, tudo num ecossistema só
- **Visual escuro/tech** que impressiona cliente na hora de apresentar uma proposta

---

## Server Actions (`lib/actions/`)

22 arquivos de server action, todos com `"use server"` e operações reais de banco:

| Arquivo | Funções |
|---|---|
| `hunter.ts` | createHunter, getHunterStatus, updateHunter, addXp, addGold, getDailyQuests, completeQuest |
| `projects.ts` | CRUD projetos |
| `project-detail.ts` | getProjectWithMilestones, getProjectExpenses |
| `clients.ts` | CRUD clientes com stats |
| `pipeline.ts` | CRUD leads, pipelineStats, convertToClient |
| `products.ts` | CRUD produtos |
| `budget.ts` | CRUD orçamentos |
| `contract.ts` | CRUD contratos |
| `receipt.ts` | CRUD recibos |
| `company.ts` | getCompany, updateCompany |
| `workspace.ts` | updateWorkspaceConfig |
| `tasks.ts` | CRUD tasks |
| `checklists.ts` | CRUD templates e itens de projeto |
| `financial.ts` | CRUD fixedCosts, businessExpenses, revenues |
| `growth.ts` | CRUD habits, toggleHabit |
| `tracking.ts` | CRUD projectTokens, getProjectByToken |
| `briefing.ts` | CRUD briefingNotes |
| `notifications.ts` | markAsRead, markAllAsRead, dismiss, clearAll |
| `public-budget.ts` | getPublicBudget, approvePublicBudget |
| `system.ts` | getSystemHealth |
| `quotations.ts` | getQuotations |
| `email-templates.ts` | getEmailTemplates |
| `seed-products.ts` | seedProducts |

---

## Resumo

| Métrica | Valor |
|---|---|
| Páginas FULLY FUNCTIONAL | 27 de 28 |
| Páginas ESQUELETO | 1 (`/`) |
| Tabelas no banco | 20 |
| Server Actions | 22 arquivos |
| Migrations | 9 |
| Engine de notificações | ~517 linhas de código real |
| Testes | 0 |
| Autenticação | ❌ |

O sistema é **significativamente mais real do que casca**. Praticamente todas as páginas têm integração real com banco de dados, server actions e UI funcional. As lacunas são pequenas: home page vazia, focus blocks hardcoded, shop sem persistência, e ausência de testes/auth.
