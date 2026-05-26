[CHANGELOG.md](https://github.com/user-attachments/files/28263623/CHANGELOG.md)
# CHANGELOG

Todas as mudanças relevantes do projeto **Radar Internet — Plataforma EAD** são documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).
Versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.8.0] — 2025-05-26

### Adicionado
- **Módulo: Central de Certificados** (`src/js/modules/central-certificados.js`)
  - Stats/indicadores: emitidos, pendentes elegíveis, expirados, vencendo, cancelados
  - Tabela com filtros por busca, status, curso, data e ordenação
  - Painel de emissões pendentes com botão de emissão rápida por aluno
  - Painel de vencimentos nos próximos 30 dias
  - Visualizador SVG do certificado com QR-code simulado e assinaturas
  - Impressão e download em nova janela (compatível com Salvar como PDF)
  - Emissão manual por aluno e curso com campos de nota, validade e responsável
  - Emissão em lote com preview de elegíveis antes de confirmar
  - Validação de certificado por código com feedback visual
  - Gestão completa de modelos visuais (criar, editar, excluir)
  - Ações individuais: reemitir, cancelar, excluir
  - 995 linhas · 42 funções · API pública documentada

---

## [1.7.0] — 2025-05-26

### Adicionado
- **Módulo: Controle de Acessos** (`src/js/modules/controle-acessos.js`)
  - Stats/indicadores: acessos ativos, expirados, cursos liberados, bloqueados
  - Tabela com filtros por busca, status, curso, tipo e data
  - Painel de vencimentos próximos (30 dias) com alerta por cor
  - Histórico de ações recentes (log de acessos)
  - Modal de liberação com seletor de escopo: global, colaborador, setor, equipe
  - Configuração de período (início, expiração, prazo em dias)
  - Toggles de regras: acesso obrigatório, renovação automática
  - Ações: bloquear, ativar, revogar, renovar (+30 dias)
  - Compatibilidade com funções legadas do `admin.js`
  - 906 linhas · 39 funções · API pública documentada

---

## [1.6.0] — 2025-05-26

### Adicionado
- **Módulo: Gestão de Alunos** (`src/js/modules/gestao-alunos.js`)
  - Stats/indicadores: total, ativos, pendentes, bloqueados, cursos disponíveis
  - Tabela com filtros por busca, status, setor, equipe e ordenação
  - Modal de criação/edição com 3 tabs: dados pessoais, organização, acesso
  - Perfil completo do aluno com 3 tabs: informações, cursos, histórico
  - Cálculo de progresso geral e por curso respeitando restrições de acesso
  - Gestão de setores e equipes (criar, editar, excluir)
  - Ações: bloquear, ativar, resetar senha, excluir, vincular turma
  - Compatibilidade com função `toggleColab` do `admin.js` legado
  - 933 linhas · 42 funções · API pública documentada

---

## [1.5.0] — 2025-05-26

### Adicionado
- **Módulo: Sistema de Avaliações** (`src/js/modules/sistema-avaliacoes.js`)
  - Stats/indicadores: total, publicadas, rascunhos, média geral, taxa de aprovação
  - Tabela com filtros por busca, status, curso, turma e data
  - Modal de criação/edição com 3 tabs: dados, configurações, questões
  - Editor de questões com 4 tipos: múltipla escolha, verdadeiro/falso, resposta única, descritiva
  - Adição dinâmica de alternativas por questão
  - Toggles de configuração: resultado imediato, ordem aleatória, correção automática
  - Modal de resultados com stats e tabela de respostas por aluno
  - Ações: publicar, encerrar, excluir, duplicar
  - 863 linhas · 40 funções · API pública documentada

---

## [1.4.0] — 2025-05-26

### Adicionado
- **Módulo: Central de Materiais** (`src/js/modules/central-materiais.js`)
  - Stats/indicadores: total, PDFs, vídeos, ativos, arquivados
  - Tabela com filtros por busca, tipo, curso, status, data e ordenação
  - Seleção e ações em lote: ativar, arquivar, excluir
  - Modal de criação/edição com 3 tabs: arquivo, vínculo, configurações
  - Upload com drag & drop e detecção automática de tipo por extensão
  - Modo link externo alternativo ao upload de arquivo
  - Visualizador inline por tipo: vídeo, PDF, imagem, link, fallback genérico
  - Vinculação de material a múltiplos cursos
  - Ações individuais: arquivar, excluir, duplicar, baixar
  - 1019 linhas · 45 funções · API pública documentada

---

## [1.3.0] — 2025-05-26

### Adicionado
- **Módulo: Gestão de Turmas** (`src/js/modules/gestao-turmas.js`)
  - Stats/indicadores: total, abertas, em andamento, encerradas
  - Tabela com filtros por busca, status, curso e data
  - Modal de criação/edição com 2 tabs: dados e alunos
  - Lista de alunos selecionáveis com busca inline
  - Seleções rápidas: por setor, por equipe, todos, limpar
  - Dashboard de visualização da turma com progresso individual por aluno
  - Toggles de configuração: acesso automático, bloquear após encerramento, entrada após início
  - Ações: encerrar, excluir
  - 901 linhas · 36 funções · API pública documentada

---

## [1.2.0] — 2025-05-26

### Adicionado
- **Módulo: Gestão de Cursos** (`src/js/modules/gestao-cursos.js`)
  - Stats/indicadores: total, publicados, rascunhos, arquivados, expirados
  - Tabela com filtros por busca, status, categoria, formato, data e ordenação
  - Seleção e ações em lote: publicar, arquivar, excluir
  - Menu dropdown de ações por linha (via PortalMenu)
  - Modal de visualização rápida com métricas, configurações e progresso
  - Drawer de edição via iframe do wizard `novo-curso.html`
  - Cálculo de progresso médio por curso entre todos os alunos ativos
  - Exportação CSV com BOM UTF-8 (compatível com Excel pt-BR)
  - Feed de atividades recentes (criação, publicação, edição, materiais)
  - 969 linhas · 36 funções · API pública documentada

- **Sub-módulo: CursoDrawer** (`src/js/modules/curso-drawer.js`)
  - Gerencia o painel lateral de edição via iframe
  - Fecha automaticamente ao receber `postMessage('wizard:concluido')`
  - Fecha com tecla Escape
  - 92 linhas · 2 funções públicas

---

## [1.1.0] — 2025-05 (base do projeto)

### Adicionado
- Estrutura inicial do painel administrativo (`admin.html`)
- Portal do aluno (`aluno.html`)
- Wizard de criação de cursos (`novo-curso.html`)
- Página inicial (`index.html`)
- Camada de dados com localStorage (`src/js/storage.js`)
  - Entidades: Cursos, Módulos, Aulas, Materiais, Turmas, Alunos
  - Entidades: Avaliações, Questões, Respostas, Certificados
  - Entidades: Restrições, LogAcessos, Setores, Equipes, Progresso
  - Entidades: Publicações, Comunicados, Sessão, Admin
  - Dados de demonstração pré-carregados
  - Comentários de migração futura para REST API em cada entidade
- Módulos inline no `admin.html` (versão pré-modularização):
  - Dashboard, SidebarNav, IFT, PortalMenu, CursoDrawer
  - Cursos, Turmas, MatMod, Aval, AlunosMod
  - AcessosMod, CertMod, PubMod
- Estilização global (`src/css/style.css`)
- Documentação de arquitetura (`docs/ARCHITECTURE.md`)
- Configuração do GitHub Pages (`_config.yml`)

---

## [1.0.0] — 2025-05 (versão inicial)

### Adicionado
- Repositório criado em `github.com/radar-wisp/radar-ead-web`
- Primeira versão do frontend EAD publicada via GitHub Pages

---

## Roadmap

### Planejado para versões futuras

- `[1.9.0]` — Módulo: Relatórios (criação do zero — página HTML + JS + integração no admin.js)
- `[2.0.0]` — Migração da camada de dados de localStorage para REST API (Node.js + PostgreSQL)
- `[2.1.0]` — Notificações (vencimentos, certificados pendentes, avaliações novas)
- `[2.2.0]` — Melhorias no Portal do Aluno
- `[3.0.0]` — Progressive Web App (PWA) para acesso mobile

---

## Convenções de versionamento

| Tipo de mudança | Versão |
|---|---|
| Novo módulo ou funcionalidade maior | MINOR (1.x.0) |
| Correção de bug ou ajuste pontual | PATCH (1.x.x) |
| Migração de backend ou breaking change | MAJOR (x.0.0) |

## Padrão de commits

| Prefixo | Uso |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Refatoração sem mudança de comportamento |
| `style` | Ajuste visual ou de formatação |
| `perf` | Melhoria de performance |
| `docs` | Documentação |
| `test` | Testes |
| `chore` | Tarefas de manutenção |
