# 🌌 DESIGN SYSTEM & DIRETRIZES DE COMPONENTES: SPRINT OS

> **Regra de Ouro Inegociável:** Não crie componentes complexos de interface do zero (HTML puro ou botões simulando seletores). Utilize **estritamente** as primitivas do **Shadcn/UI** (baseados em Radix UI + Tailwind CSS) instalados em `@/components/ui/`. Toda a estilização deve seguir a identidade Dark Cyber Premium abaixo.

---

## 1. CANÔNICO DE COMPONENTES (SHADCN/UI)

Sempre que a interface precisar de elementos interativos, use os componentes oficiais correspondentes:
- **Switches/Alternadores:** `import { Switch } from "@/components/ui/switch"`
- **Formulários Laterais / Slide-overs:** `import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"`
- **Modais / Diálogos:** `import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"`
- **Inputs e Seletores:** `import { Input } from "@/components/ui/input"`, `import { Select } from "@/components/ui/select"`
- **Calendários e Dropdowns:** `import { Calendar } from "@/components/ui/calendar"`, `import { DropdownMenu } from "@/components/ui/dropdown-menu"`
- **Notificações / Toasts:** `import { toast } from "sonner"` (Shadcn Sonner)

---

## 2. PALETA DE CORES & EFEITOS DE LUZ (GLOW)

O sistema utiliza uma estética Dark Cyber Premium baseada em superfícies opacas e pontos focalizados de iluminação neon de fundo (glow).

- **Fundo Principal (`surface-0`):** `#09090b` (Zinco 950 / `bg-black` ou `bg-zinc-950`).
- **Superfícies de Cards (`surface-1`):** `#18181b` (Zinco 900 / `bg-zinc-900`) sempre acompanhado de uma borda sutil (`border border-zinc-800/50`).
- **Superfícies de Inputs e Hover (`surface-2`):** `#27272a` (Zinco 800 / `bg-zinc-800`).
- **Cores de Acentuação Temática (Glow Neon):**
  - **Emerald (Foco/Sucesso/Financeiro):** `text-emerald-400` / `bg-emerald-500` / Brilho: `shadow-[0_0_20px_rgba(52,211,153,0.15)]`.
  - **Violet (Reuniões/Sincronização/Ações):** `text-violet-400` / `bg-violet-500` / Brilho: `shadow-[0_0_20px_rgba(167,139,250,0.15)]`.
  - **Amber (Prazos/Alertas/Avisos):** `text-amber-400` / `bg-amber-500` / Brilho: `shadow-[0_0_20px_rgba(251,191,36,0.15)]`.

---

## 3. TIPOGRAFIA & HIERARQUIA

- **Títulos Principais:** Classe `font-tracking-tight font-bold text-foreground` (utilizar tamanho grande como `text-4xl` ou `text-5xl`).
- **Subtítulos e Labels Técnicos:** Classe `text-mono` (obrigatoriamente tamanho mínimo `text-[10px]` ou `text-[11px]`, em caixa alta `uppercase`, com espaçamento estendido `tracking-widest` e cor discreta `text-muted-foreground`).
- **Textos de Apoio / Parágrafos:** `text-sm text-muted-foreground` (Zinco 400).

---

## 4. RESPONSIVIDADE & UX (MOBILE-FIRST)

- **Layouts e Malhas:** Toda estrutura complexa deve ser montada sobre Grid fluida e responsiva (`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12`).
- **Formulários Dinâmicos:** Painéis de criação ou edição rápidos não devem ocupar uma página inteira. Eles devem abrir via **Sheet (Shadcn)** saindo da lateral direita em telas desktop, e se adaptar para gavetas inferiores (`Drawer`) em telas mobile.
- **Tratamento de Estado Vazio (Empty States):** Se uma lista, tabela ou o calendário semanal não possuir dados retornados pelo banco de dados, nunca renderize um bloco vazio ou quebrado. Sempre exiba um container sutil com borda pontilhada (`border-dashed border-zinc-800`), um ícone centralizado da biblioteca `lucide-react` e um botão claro de ação para resolver o vazio (ex: `+ Criar Nova Tarefa`).