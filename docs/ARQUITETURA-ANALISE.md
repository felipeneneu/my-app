# Análise Arquitetural — Sprint OS

> Data: Julho 2026
> Projeto: Felipe Neneu Portfolio — my-app
> Stack: Next.js 16.2 / React 19 / Drizzle ORM / Turso SQLite / Tailwind v4 / shadcn (base-nova)

---

## 1. O Que o Sistema FAZ

**ERP pessoal gamificado** para freelancer — 27 páginas funcionais conectadas ao banco de dados.

### Módulos Principais

| Módulo | Descrição |
|--------|-----------|
| **Pipeline de Vendas** | Leads com estágios, contatos, conversão para cliente |
| **Orçamento/Proposta** | Dois construtores (admin + `/orcamento`), PDF com `@react-pdf/renderer` |
| **Fluxo de Aprovação** | Orçamento → Projeto → Contrato → Recibo (cadeia completa) |
| **Gestão de Projetos** | Milestones, tasks (blocos de horário), despesas, checklists |
| **Ordens de Serviço** | OS por projeto com itens, prazos, valores |
| **Portal do Cliente** | `/track/[token]` com progresso, milestones, documentos |
| **Hunter System** | Gamificação: level, XP, gold, atributos STR/INT/WIS |
| **Crescimento** | Hábitos diários com recompensa em XP/gold |
| **Dashboard** | Métricas, calendário semanal, engine de notificações (SSE) |
| **DRE Financeiro** | Receitas - Custos = Lucro Líquido |
| **Company/Workspace** | Dados da empresa, CEP autofill (ViaCEP), configurações |
| **Briefing** | Formulário estruturado + notas estilo chat por projeto |

### Stack Atual

```
Frontend     Next.js 16.2 / React 19.2.4 / Tailwind v4
UI Kit       shadcn/ui (base-nova) + @base-ui/react 1.6
Estado       TanStack React Query 5 (staleTime 30s)
ORM          Drizzle ORM rc4 + @libsql/client
DB           Turso/libSQL (SQLite, local ou edge)
PDF          @react-pdf/renderer 4.5 + html2canvas + jsPDF
Ícones       Lucide React
Notificações SSE + Engine própria (lib/engine/)
Formulários  react-hook-form 7 + zod 4
```

---

## 2. Arquitetura de Rotas

```
/                    → Home (placeholder)
/onboarding          → Wizard criação de Hunter
/orcamento           → Editor orçamento (html2canvas+jsPDF) — NÃO PERSISTE

/adm                 → Layout: AppShell (IconRail + ProjectSidebar)
├── /adm             → Dashboard (métricas, calendário, automação)
├── /adm/[projectId] → Detalhe do projeto
├── /adm/clients/*   → CRUD clientes
├── /adm/budget/*    → Orçamentos (new, [id])
├── /adm/financial   → DRE, custos fixos, custos projeto, receitas
├── /adm/pipeline    → Kanban de leads
├── /adm/os/*        → Ordens de Serviço
├── /adm/hunter-system → Gamificação
├── /adm/growth      → Hábitos diários
├── /adm/company     → Dados da empresa (CEP autofill)
├── /adm/briefing/*  → Briefings
├── /adm/contract/*  → Contratos
├── /adm/receipt/*   → Recibos
├── /adm/calendar    → Calendário
├── /adm/system      → Health check + backup
├── /adm/notifications → Central de notificações
├── /adm/products    → Catálogo de produtos
├── /adm/quotations  → Propostas de leads
├── /adm/checklist-templates → Templates
├── /adm/profile     → Perfil do Hunter
└── /adm/project/[id]/briefing → Briefing por projeto

/track/[token]      → Portal cliente (read-only)
/p/[id]             → Proposta pública (com approve)
/p/contract/[id]    → Contrato público
/p/receipt/[id]     → Recibo público

/api/notifications/stream → SSE (sem autenticação)
```

### Padrão Arquitetural

**Server Component → Client Component**
- Toda página admin é **Server Component** que busca dados via Drizzle
- Passa props serializáveis para um `*Client.tsx`
- Mutações via **Server Actions** (`"use server"`) com `revalidatePath()`

---

## 3. Banco de Dados — 18 Tabelas

| Tabela | Finalidade |
|--------|-----------|
| `hunter_status` | Level, XP, gold, rank (E→S), STR/INT/WIS |
| `daily_quests` | Missões diárias |
| `leads` | Pipeline com estágio, status, contato |
| `products` | Catálogo de serviços |
| `clients` | Clientes com endereço, CPF/CNPJ |
| `projects` | Projetos com FK cliente, preço, status |
| `checklist_templates` | Templates de checklist |
| `checklist_template_items` | Itens do template |
| `project_checklist_items` | Itens por projeto |
| `business_expenses` | Despesas (fixas/variáveis/software/infra) |
| `documents` | Polimórfico: contrato, invoice, proposta, OS, briefing |
| `tasks` | Tasks com bloco, horário, FK projeto |
| `notifications` | Notificações com prioridade, tipo, entidade |
| `milestones` | Marcos do projeto (pending/done/delivered) |
| `fixed_costs` | Custos fixos mensais |
| `revenues` | Receitas vinculadas a projetos |
| `habits` | Hábitos STR/INT/WIS com XP/gold |
| `company_info` | Dados legais, banco, PIX |
| `briefing_notes` | Notas estilo chat por projeto |
| `client_contacts` | Histórico de contato |
| `addresses` | Múltiplos endereços por cliente |
| `project_tokens` | Tokens SHA-256 para portal cliente |
| `workspace_config` | Configuração single-row do workspace |

---

## 4. O Que o Sistema Faz RUIM

### 🔴 Críticos — Impedem Uso Profissional

| # | Problema | Detalhe | Localização |
|---|----------|---------|-------------|
| 1 | **Zero error handling** | 25/26 action files sem `try/catch`. Qualquer falha de DB vira 500 | `lib/actions/*.ts` |
| 2 | **Zero error boundaries** | Nenhum `error.tsx` em 27 rotas. Qualquer exceção quebra a UI | `app/**/*` |
| 3 | **Zero loading states** | Nenhum `loading.tsx`. Telas brancas durante carregamento | `app/**/*` |
| 4 | **Sem transações** | `approveBudget` faz 6 writes sequenciais sem transaction | `lib/actions/budget.ts` |
| 5 | **Race conditions** | `addXp`/`toggleHabit` lêem → calculam → escrevem sem proteção | `lib/actions/hunter.ts`, `growth.ts` |
| 6 | **Recibo duplicado** | `approveBudget` + `approveContract` criam recibos separados | `budget.ts`, `contract.ts` |
| 7 | **Campos mortos** | `client_morale` no schema, `updateProjectStatus` nunca criado | `db/schema.ts`, `lib/actions/` |
| 8 | **Tipos `any`** | Casts `as unknown as` e `as any` espalhados nas actions | Vários `lib/actions/*.ts` |

#### Detalhamento dos Erros Críticos

**Ausência total de try/catch** (`lib/actions/*.ts`):
```typescript
// Em 25 de 26 arquivos — padrão atual:
export async function createClient(data) {
  return await db.insert(clients).values(data).returning();
  // Se o banho cair: Unhandled Runtime Error
  // Se FK violar: Unhandled Runtime Error
  // Se INSERT falhar: Unhandled Runtime Error
}
```

**Race Conditions sem proteção** (`lib/actions/hunter.ts`):
```typescript
// Duas chamadas concorrentes:
// Request 1: lê XP=100, calcula novoXP=150, escreve XP=150
// Request 2: lê XP=100 (não viu Request 1), calcula novoXP=150, escreve XP=150
// Resultado: 50 XP perdidos
```

---

### 🟠 Financeiro — Maior Buraco do Sistema

| Problema | Impacto |
|----------|---------|
| `revenues` não tem `status`, `dueDate`, `paidAt` | **Não existe contas a receber.** Toda receita é assumida como recebida |
| Sem NF-e / DANFE | **Impossível emitir nota fiscal** (obrigatório para PJ no Brasil) |
| Sem invoice/fatura | Recibo só pós-pagamento. Nenhuma fatura formal para enviar |
| DRE é cálculo client-side com arrays flat | Sem série histórica, sem alocação de custos, sem tendência |
| `monthlyGoal` mede lucro, não receita | Métrica estranha — meta mensal deveria ser receita ou faturamento |
| Sem fluxo de caixa projetado | Não sabe se vai ter dinheiro para pagar contas no mês que vem |
| Sem categorização fiscal | Não separa ISS, IRPJ, CSLL, etc. |

---

### 🟡 Fluxos Desconectados

| GAP | Consequência |
|-----|-------------|
| Pipeline "Won" vira cliente mas **não cria orçamento** | Usuário precisa navegar manualmente entre páginas |
| `/orcamento` (rota pública) **não persiste nada** | Proposta feita lá não pode virar contrato. Preview descartável |
| Milestones e tasks **não são linkados** | Fechar milestone não fecha tasks relacionadas |
| Projetos **não têm `updateProjectStatus`** | Stuck em "active" para sempre. Sem mover para "completed" |
| OS duplica itens do orçamento | Sem relação entre OS items e budget items |
| Lead → Cliente → Orçamento | Três ações manuais, zero automação |
| Gold não tem função (`spendGold` não existe) | Moeda cosmética, não impulsiona comportamento |

---

### 🟢 Segurança

| Problema | Risco |
|----------|-------|
| Token SHA-256 usa `Math.random()` | Previsível (não crypto-safe) |
| SSE endpoint sem autenticação | Qualquer um conecta no stream |
| `approvePublicBudget` sem rate limit | Spam de aprovações |
| `approvePublicContract` sem rate limit | Spam de contratos |
| Sem CSRF protection | Aprovações podem ser forjadas |
| Sem rate limiting em nenhum endpoint | DoS silencioso |

### 🔵 Comunicação

| Ausência | Impacto |
|----------|---------|
| **Zero email** | Cliente nunca recebe proposta/contrato/recibo automaticamente |
| Sem WhatsApp API | Só link manual, sem template de mensagem |
| Sem notificação push | Notificações só no app |
| Sem lembrete automático | Nenhum follow-up de pagamento ou proposta pendente |

---

## 5. Serve para Trabalho Profissional?

### ✅ O Que JÁ SERVE (75% pronto)

| Funcionalidade | Status |
|----------------|--------|
| Pipeline de vendas + conversão | ✅ Funcional |
| Criação de propostas com PDF | ✅ Funcional (admin) |
| Fluxo de aprovação público | ✅ Funcional |
| Portal do cliente (track) | ✅ Funcional (read-only) |
| Dashboard com métricas | ✅ Funcional |
| Gamificação (hunter, hábitos) | ✅ Funcional (gold cosmético) |
| Gestão de projetos (milestones, OS) | ✅ Funcional |
| Briefing interativo | ✅ Funcional |
| Cadastro de clientes | ✅ Funcional |

### ❌ O Que IMPEDE Uso Profissional

| Prioridade | Bloqueio | Motivo |
|------------|----------|--------|
| **#1 🔴** | Financeiro incompleto | Sem contas a receber, NF-e, invoice, fluxo de caixa |
| **#2 🟠** | Fluxos desconectados | Pipeline → Budget → Project não é automático |
| **#3 🟠** | Resiliência zero | Sem error handling, loading, transações |
| **#4 🟡** | Sem comunicação | Zero email, SMS, push |
| **#5 🟡** | Segurança frágil | Rate limit, CSRF, token frágil |

### Diagnóstico Final

```
Estado Atual:     MVP Funcional ────●───────────────── Produção
                                    75%

Pronto para uso profissional:  ❌ NÃO
Pronto para portfolio/demo:    ✅ SIM
Pronto para uso pessoal:       ✅ SIM (com cuidado)
```

---

## 6. Recomendações de Priorização

### Sprint 1 — Fundação Financeira (eliminatório)

- [ ] Adicionar `status` (pending/received/overdue), `dueDate`, `paidAt` na tabela `revenues`
- [ ] Criar módulo de contas a receber com aging report
- [ ] Implementar geração de invoice/fatura (não NF-e, mas documento formal)
- [ ] Adicionar `updateProjectStatus()` e conectar ao fluxo financeiro
- [ ] Criar `updateProjectStatus` action e botões na UI

### Sprint 2 — Resiliência

- [ ] Adicionar `try/catch` em todas as 26 actions com retorno padronizado `{ success, data?, error? }`
- [ ] Adicionar `error.tsx` em todas as 5 seções principais (adm, track, p, orcamento, onboarding)
- [ ] Adicionar `loading.tsx` nas rotas principais
- [ ] Envolver fluxos multi-step em transações Drizzle
- [ ] Proteger `addXp`/`addGold` contra race conditions

### Sprint 3 — Conectividade

- [ ] Adicionar botão "Criar Orçamento" na página de cliente (pós pipeline win)
- [ ] Eliminar `/orcamento` (ou dar persistência a ele)
- [ ] Vincular milestones a tasks (fechar milestone = fechar tasks)
- [ ] Criar `spendGold()` e uma loja real no hunter system

### Sprint 4 — Comunicação

- [ ] Integrar Resend/SendGrid para email transacional
- [ ] Email automático ao aprovar orçamento
- [ ] Email com link do portal do cliente ao criar token
- [ ] Template de email para proposta, contrato, recibo

### Sprint 5 — Segurança

- [ ] Substituir `Math.random()` por `crypto.randomBytes()` nos tokens
- [ ] Adicionar rate limiting nas rotas de aprovação pública
- [ ] Autenticar SSE endpoint (pelo menos verificar hunter existe)
- [ ] Adicionar CSRF tokens nas server actions públicas
- [ ] Logging estruturado (pino/winston)

---

## 7. Métricas do Projeto

```
Páginas/Rotas:      30+ (27 funcionais + API)
Tabelas:            18
Actions (server):   26 arquivos
Componentes UI:     53 (shadcn)
Componentes App:    12+
Engine templates:   15 tipos de notificação
Migration files:    9
Dependências:       52 produção + 8 dev
Versão Next:        16.2.10 (bleeding edge)
Versão React:       19.2.4 (bleeding edge)
```

---

## 8. Riscos Técnicos

| Risco | Probabilidade | Impacto |
|-------|:------------:|:-------:|
| Next 16 quebra em upgrade | Média | Alto |
| React 19 libs incompatíveis | Média | Alto |
| Drizzle rc4 muda stable | Baixa | Médio |
| Turso/libSQL muda API | Baixa | Médio |
| Sem testes = regressão silenciosa | Alta | Alto |
| DB local vs edge inconsistency | Média | Médio |

---

*Análise gerada em Julho 2026 via opencode explorer-agent.*
