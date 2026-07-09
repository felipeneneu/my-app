# Roteiro de Testes — Sprint OS

## Pré-requisitos

```bash
npm run dev
```

Acessar `http://localhost:3000` — o sistema redireciona para `/onboarding` se for a primeira vez.

---

## 1. Onboarding & Configuração Inicial

### 1.1 — Finalizar onboarding
- [ ] Abrir `/onboarding`
- [ ] Preencher nome, workspace, e-mail
- [ ] Clicar em "Concluir"
- [ ] **Esperado**: redirecionar para `/adm` com o painel carregado

### 1.2 — Configurar dados da empresa
- [ ] Ir em **Sistema > Empresa** (`/adm/company`)
- [ ] Preencher:
  - Nome fantasia
  - Razão social
  - CNPJ (apenas números)
- [ ] **CEP** — digitar um CEP válido (ex: `01310-000`)
  - **Esperado**: após 600ms, logradouro, bairro, cidade e estado preencherem automático
  - Spinner aparece no campo CEP durante a busca
- [ ] Preencher número, telefone, e-mail
- [ ] Clicar em **Salvar**
- [ ] **Esperado**: toast "Dados salvos"

### 1.3 — Configurar dados bancários
- [ ] No mesmo formulário, rolar até "Dados bancários & PIX"
- [ ] Preencher banco, agência, conta
- [ ] Inserir chave PIX (CPF, e-mail, etc.)
- [ ] Selecionar tipo da chave
- [ ] Clicar em **Gerar QR Code PIX**
  - **Esperado**: QR Code aparece ao lado
- [ ] Salvar novamente

---

## 2. Pipeline de Vendas (Prospecção)

### 2.1 — Criar leads
- [ ] Ir em **Prospecção > Pipeline** (`/adm/pipeline`)
- [ ] Clicar em "Adicionar Lead"
- [ ] Preencher: nome do negócio, e-mail, telefone
- [ ] Selecionar estágio inicial (Hot/Warm/Cold)
- [ ] Confirmar
- [ ] **Esperado**: lead aparece no kanban na coluna escolhida
- [ ] Repetir criando mais 2-3 leads em estágios diferentes

### 2.2 — Mover leads entre estágios
- [ ] Clicar em "←" ou "→" em um lead para movê-lo de coluna
- [ ] **Esperado**: lead muda de coluna (hot → warm → cold)

### 2.3 — Registrar contato
- [ ] Clicar em um lead
- [ ] Clicar em "Registrar Contato"
- [ ] Digitar uma nota sobre o contato
- [ ] Confirmar
- [ ] **Esperado**: nota salva, `last_contact` atualizado

### 2.4 — Converter lead em cliente
- [ ] Mover um lead para **Won** ou marcar como ganho
- [ ] Clicar em "Converter em Cliente"
- [ ] **Esperado**: cliente criado em `/adm/clients`
- [ ] Ir em **Gestão > Clientes** para confirmar

### 2.5 — Deletar lead
- [ ] Clicar em um lead perdido (Lost)
- [ ] Confirmar deleção
- [ ] **Esperado**: lead some do kanban

---

## 3. Orçamento (Comercial)

### 3.1 — Criar orçamento
- [ ] Ir em **Comercial > Orçamento** (`/adm/budget`)
- [ ] Clicar em "Novo Orçamento"
- [ ] Selecionar um cliente (criado no passo anterior)
- [ ] Preencher:
  - Meta mensal (ex: 15000)
  - Horas mensais contratadas
  - Mão de obra, custos extras
  - Adicionar entregáveis (ex: "Site institucional", "Dashboard admin")
- [ ] **Esperado**: preview do orçamento atualiza ao vivo
- [ ] Clicar em **Aprovar**
- [ ] **Esperado**: orçamento aprovado, redirecionar para contrato

### 3.2 — Visualizar orçamentos
- [ ] Voltar para `/adm/budget`
- [ ] **Esperado**: orçamento aparece na lista com badge "approved"

---

## 4. Contrato (Comercial)

### 4.1 — Visualizar contrato gerado
- [ ] Ir em **Comercial > Contrato** (`/adm/contract`)
- [ ] **Esperado**: contrato listado com status "pending"
- [ ] Clicar no contrato
- [ ] **Esperado**: documento com 6 seções (Partes, Objeto, Entregas, Pagamento, Prazo, Dados Bancários)

### 4.2 — Aprovar contrato
- [ ] Clicar em **Aprovar Contrato**
- [ ] **Esperado**:
  - Contrato vira "approved"
  - Recibo gerado automaticamente
  - Projeto criado no sidebar
  - Token de rastreamento gerado
  - Notificação criada

### 4.3 — Verificar projeto criado
- [ ] No sidebar esquerdo, buscar o projeto pelo nome
- [ ] **Esperado**: projeto aparece na lista com status "active"

---

## 5. Recibo (Comercial)

### 5.1 — Visualizar recibo
- [ ] Ir em **Comercial > Recibo** (`/adm/receipt`)
- [ ] **Esperado**: recibo listado
- [ ] Clicar no recibo
- [ ] **Esperado**: documento do recibo com emissor, tomador, valor, datas
- [ ] Clicar em **Imprimir / PDF**
  - **Esperado**: janela de impressão do navegador abre

---

## 6. Briefing (Desenvolvimento)

### 6.1 — Acessar briefing do projeto
- [ ] Ir em **Desenvolvimento > Briefing** (`/adm/project`)
- [ ] **Esperado**: lista de projetos
- [ ] Clicar em um projeto
- [ ] **Esperado**: chat estilo Discord carregado

### 6.2 — Enviar mensagens
- [ ] Digitar uma nota de briefing
- [ ] Pressionar **Enter** para enviar
- [ ] **Esperado**: mensagem aparece no feed com:
  - Avatar com inicial do autor
  - Nome do autor
  - Timestamp
  - Conteúdo
- [ ] Enviar mais mensagens em sequência
- [ ] **Esperado**: mensagens do mesmo minuto agrupadas (sem avatar repetido)
- [ ] Enviar mensagens em dias diferentes
- [ ] **Esperado**: date divider entre os dias ("Hoje", "Ontem", ou data)

### 6.3 — Testar input
- [ ] Digitar texto longo com quebras de linha (Shift+Enter)
- [ ] **Esperado**: múltiplas linhas suportadas
- [ ] Tentar enviar vazio
- [ ] **Esperado**: botão desabilitado

---

## 7. Portal do Cliente (Tracking)

### 7.1 — Acessar token do projeto
- [ ] O token é gerado automaticamente ao aprovar o contrato
- [ ] Para teste, verificar no banco ou na action de budget
- [ ] Alternativa: criar um token manualmente via SQL

### 7.2 — Portal do Cliente
- [ ] Abrir `/track` em uma aba anônima
- [ ] **Esperado**: landing page com campo de token
- [ ] Digitar um token inválido
- [ ] **Esperado**: redireciona para 404
- [ ] Digitar o token válido do projeto
- [ ] **Esperado**: página de acompanhamento com:
  - Nome do projeto + status badge
  - Barra de progresso
  - Marcos (se houver)
  - Últimas notas de briefing
  - Documentos

---

## 8. Painel Administrativo

### 8.1 — Dashboard
- [ ] Ir em `/adm`
- [ ] **Esperado**: visão geral com:
  - Cards de métricas (receita, clientes ativos, tarefas, etc.)
  - Projetos em andamento
  - Metas mensais

### 8.2 — Navegação
- [ ] Testar todos os ícones da rail lateral (esquerda)
  - **Esperado**: cada ícone leva à página correta
- [ ] Clicar com botão direito em ícones de grupos com múltiplos itens
  - **Esperado**: context menu com todas as opções do grupo
- [ ] Clicar em grupo com apenas 1 item
  - **Esperado**: navegação direta (sem context menu)

### 8.3 — Sidebar de projetos
- [ ] Testar busca por nome de projeto
- [ ] Testar filtros: "Ativos", "Aguardando fatura", "Atrasados", etc.
- [ ] Clicar em um projeto
  - **Esperado**: abre detalhes do projeto
- [ ] Passar o mouse sobre um projeto
  - **Esperado**: ícone de deletar aparece
- [ ] Clicar em deletar
  - **Esperado**: ConfirmDialog abre, confirmação remove o projeto

---

## 9. Checklists

### 9.1 — Gerenciar templates
- [ ] Ir em **Pessoal > Checklists** (`/adm/checklist-templates`)
- [ ] Criar um template com nome e descrição
- [ ] Adicionar itens ao template
- [ ] **Esperado**: template salvo com itens

### 9.2 — Aplicar checklist no projeto
- [ ] Ir em um projeto (`/adm/[projectId]`)
- [ ] Associar um template de checklist
- [ ] **Esperado**: itens do template aparecem no projeto
- [ ] Marcar/desmarcar itens como concluídos
- [ ] **Esperado**: estado persiste

---

## 10. Notificações

### 10.1 — Central de notificações
- [ ] Clicar no sino no canto inferior esquerdo do sidebar
- [ ] **Esperado**: popover com lista de notificações
- [ ] Notificações não lidas devem ter opacidade diferente
- [ ] Clicar em "Limpar todas"
  - **Esperado**: notificações são marcadas como lidas

### 10.2 — Engine de notificações
- [ ] O sistema gera notificações automaticamente via engine (a cada ~40s)
- [ ] Tipos de notificação:
  - Leads estagnados (7+ dias sem contato)
  - Pipeline vazio
  - Clientes inativos
  - Metas de prospecção
  - Orçamentos sem resposta
  - Insights de margem de projeto

---

## 11. Sistema & Backup

### 11.1 — Health check
- [ ] Ir em **Sistema > Sistema** (`/adm/system`)
- [ ] **Esperado**: status do banco (online/offline) + contagem de registros por tabela

### 11.2 — Backup
- [ ] Clicar em **Exportar Backup**
- [ ] **Esperado**: download de arquivo `.json` com todos os dados
- [ ] Selecionar entidades específicas e exportar
- [ ] **Esperado**: apenas as entidades selecionadas no JSON

### 11.3 — Restore
- [ ] Clicar em "Restaurar"
- [ ] **Esperado**: toast informando que restore está em desenvolvimento

---

## 12. Perfil & Configurações

### 12.1 — Editar workspace
- [ ] Clicar no nome do workspace no topo do sidebar
- [ ] **Esperado**: EditWorkspaceSheet abre
- [ ] Alterar nome, meta mensal
- [ ] Salvar
- [ ] **Esperado**: sidebar atualiza

### 12.2 — Perfil
- [ ] Ir em **Sistema > Perfil** (`/adm/profile`)
- [ ] **Esperado**: página de perfil do usuário

---

## 13. Fluxo Completo (Teste Integrado)

Este teste simula o ciclo completo de um projeto:

```
1. /adm/company       → preencher dados da empresa + CEP auto-fill + salvar
2. /adm/pipeline      → criar lead → mover para won → converter em cliente
3. /adm/budget/new    → criar orçamento para o cliente → aprovar
4. /adm/contract      → visualizar contrato → aprovar
5. /adm/project       → clicar no projeto → enviar notas de briefing
6. /adm/receipt       → visualizar recibo gerado
7. /track             → digitar token → ver portal do cliente
8. /adm/notifications → ver notificações geradas pelo sistema
```

---

## Problemas Conhecidos

| Problema | Status |
|----------|--------|
| Restore de backup não implementado | Esperado (stub) |
| Email templates sem UI conectada | Fase 2 do plano |
| `/adm/project` mostra projetos sem briefing ainda | Normal (vazio se nenhum contrato aprovado) |
