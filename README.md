# Sprint OS

Sistema operacional pessoal para freelancers — dashboard inteligente com gamificação, finanças, prospecção e gestão de projetos.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16.2 (App Router) |
| Database | Turso (libSQL) / SQLite local |
| ORM | Drizzle ORM (rc.4) |
| UI | shadcn/ui (base-nova), Tailwind v4, @base-ui/react |
| Language | TypeScript |

## Funcionalidades

- **Dashboard** — visão semanal com blocos de foco, métricas ao vivo, timeline 9 dias, modo carreira
- **Sistema Hunter** — gamificação de prospecção com rank, XP, gold, quests diárias, cold email generator
- **Growth System** — desenvolvimento pessoal com atributos STR/INT/WIS, hábitos diários, penalty zone
- **Financeiro** — PDV com receitas, custos fixos e por projeto, DRE, meta mensal
- **Orçamentos** — calculadora de preço mínimo + previewer de contrato
- **Projetos** — marcos de entrega, despesas, moral do cliente, central de documentos
- **Onboarding** — wizard de criação de persona (escolha de classe, atributos)
- **Notificações** — SSE em tempo real com central de notificações
- **Perfil** — ficha do hunter com nível, rank, gold e atributos

## Estrutura de diretórios

```
app/
├── adm/                    # Dashboard (protegido)
│   ├── [projectId]/        # Detalhe do projeto
│   ├── financial/          # PDV Financeiro
│   ├── growth/             # Sistema de evolução
│   ├── hunter-system/      # Sistema de prospecção
│   ├── notifications/      # Central de notificações
│   ├── profile/            # Perfil do hunter
│   ├── quotations/         # Orçamentos e contratos
│   └── layout.tsx          # Layout com AppShell
├── api/notifications/stream/  # SSE endpoint
├── onboarding/             # Wizard de criação
└── layout.tsx              # Root layout
components/
├── AppShell.tsx            # Shell principal (sidebar + rail)
├── EditWorkspaceSheet.tsx  # Edição de workspace
├── CreateProjectSheet.tsx  # Criação de projeto
├── CreateTaskSheet.tsx     # Criação de tarefa
├── NotificationsBell.tsx   # Sino de notificações
└── ui/                     # shadcn/ui components
db/
├── index.ts                # Conexão com banco
├── schema.ts               # Schema Drizzle ORM
└── migrations/             # Migrações SQL
lib/actions/
├── hunter.ts               # Server actions do hunter
├── growth.ts               # Server actions de evolução
├── financial.ts            # Server actions financeiras
├── quotations.ts           # Server actions de leads
├── project-detail.ts       # Server actions de projetos
├── projects.ts             # CRUD de projetos
├── tasks.ts                # CRUD de tarefas
├── notifications.ts        # Notificações
└── workspace.ts            # Configuração do workspace
```

## Setup local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env se necessário (TURSO_DB_URL)

# Migrar banco de dados
npx drizzle-kit push

# Iniciar dev server
npm run dev
```

Acesse `http://localhost:3000` e complete o onboarding para criar seu hunter.
