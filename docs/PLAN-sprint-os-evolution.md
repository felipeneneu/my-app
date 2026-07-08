# PLAN: Sprint OS Evolution

## Fases

| Fase | Descrição | Agentes |
|------|-----------|---------|
| 1 | Pipeline Kanban (Hot/Warm/Cold) + wa.me | database-architect, backend-specialist, frontend-specialist |
| 2 | Smart Email System (template engine) | backend-specialist, frontend-specialist |
| 3 | Smart Quotations & OS (PDF, auto-fill) | backend-specialist, frontend-specialist |
| 4 | System Config & Backup (JSON export/import) | backend-specialist, frontend-specialist |
| 5 | Engine Templates Expansion (.json + engine.ts) | backend-specialist |
| 6 | Lint/Quality Corrections | backend-specialist, frontend-specialist |

## Estrutura de Arquivos

```
app/adm/pipeline/
  page.tsx          (server - fetch leads)
  client.tsx        (client - kanban UI)
app/adm/system/
  page.tsx          (server - fetch health)
  client.tsx        (client - backup/config UI)
lib/actions/
  pipeline.ts       (pipeline CRUD + contacts)
  email-templates.ts (smart email generation)
  system.ts         (backup/restore/health)
lib/engine/templates/
  insights.json     (expanded: 10→18)
  notifications.json (expanded: 12→20)
  agenda-suggestions.json (expanded: 7→14)
lib/engine/
  engine.ts         (enhanced: eval ALL conditions)
db/
  schema.ts         (enhanced leads table)
components/
  AppShell.tsx      (add Pipeline + System nav)
```

## Migration

- Add `phone`, `pipeline_stage`, `notes`, `last_contact` to `leads`
- Run `drizzle-kit generate` + `drizzle-kit migrate`
