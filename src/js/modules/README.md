[README.md](https://github.com/user-attachments/files/28232930/README.md)
# Módulo: Gestão de Cursos

**Versão:** 1.0.0  
**Projeto:** Radar Internet — EAD Platform  
**Status:** Produção

---

## Visão Geral

O módulo de Gestão de Cursos é responsável por toda a interface administrativa de gerenciamento de cursos dentro do painel `admin.html`. Ele é **completamente desacoplado** dos demais módulos, comunicando-se apenas através das interfaces públicas definidas em `storage.js`.

---

## Arquitetura do Módulo

```
src/js/modules/
├── gestao-cursos.js      ← Módulo principal (window.Cursos)
├── curso-drawer.js       ← Sub-módulo do drawer de edição (window.CursoDrawer)
└── README.md             ← Este arquivo
```

---

## Dependências Externas

| Dependência | Fonte | Uso |
|---|---|---|
| `window.Storage` | `src/js/storage.js` | Toda persistência de dados |
| `window.PortalMenu` | `admin.html` inline | Menu dropdown flutuante |
| `window.Admin.go()` | `src/js/admin.js` | Navegação entre páginas |
| `window.IFT` | `admin.html` inline | Toolbar de filtros |

---

## API Pública (`window.Cursos`)

### Ciclo de Vida

| Função | Descrição |
|---|---|
| `init()` | Ponto de entrada. Chamado por `Admin.go('cursos')`. Inicializa estado e renderiza tudo. |
| `refresh()` | Re-renderiza stats, tabela, atividades e atualiza o dashboard. |

### Renderização

| Função | Descrição |
|---|---|
| `renderTabela()` | Lê filtros e redesenha o tbody. Sem side-effects. |
| `renderStats()` | Atualiza os 5 cards de indicadores. |
| `renderAtividades()` | Atualiza o feed de atividades recentes. |

### Seleção em Lote

| Função | Descrição |
|---|---|
| `toggleSel(id, checked)` | Adiciona/remove um curso da seleção. |
| `toggleSelAll(checkbox)` | Seleciona ou deseleciona todos. |

### Ações em Lote

| Função | Descrição |
|---|---|
| `publicarLote()` | Publica todos os cursos selecionados. |
| `arquivarLote()` | Arquiva todos os cursos selecionados. |
| `excluirLote()` | Exclui (com cascade) todos os cursos selecionados. |

### Ações Individuais

| Função | Parâmetros | Descrição |
|---|---|---|
| `publicarCurso(id)` | `id: string` | Publica e loga atividade. |
| `despublicarCurso(id)` | `id: string` | Volta para rascunho. |
| `arquivarCurso(id)` | `id: string` | Arquiva e loga atividade. |
| `excluirCurso(id)` | `id: string` | Exclui com cascade (confirm). |
| `duplicarCurso(id)` | `id: string` | Duplica curso, módulos e aulas. |
| `visualizar(id)` | `id: string` | Abre modal de visualização rápida. |
| `abrirEdit(id)` | `id: string` | Abre drawer de edição (wizard). |

### Utilitários

| Função | Descrição |
|---|---|
| `toggleMenu(btn)` | Abre/fecha o menu de ações de uma linha. |
| `closeMenus()` | Fecha todos os menus abertos. |
| `exportar()` | Gera e baixa CSV com BOM UTF-8. |

---

## API Pública (`window.CursoDrawer`)

| Função | Descrição |
|---|---|
| `abrir(id)` | Abre o drawer lateral carregando `novo-curso.html?edit=<id>` no iframe. |
| `fechar()` | Fecha o drawer, limpa o iframe e dispara `renderTabela()`. |

### Comunicação com o Wizard

O wizard (`novo-curso.html`) comunica conclusão via:

```javascript
window.parent.postMessage('wizard:concluido', '*');
```

O `CursoDrawer` escuta e fecha automaticamente.

---

## Fluxo de Dados

```
Admin.go('cursos')
    └─→ Cursos.init()
            ├─→ Storage.Cursos.listar()     ← leitura
            ├─→ renderStats()               ← DOM write
            ├─→ renderTabela()              ← DOM write
            └─→ renderAtividades()          ← DOM write

[Usuário clica "Publicar"]
    └─→ Cursos.publicarCurso(id)
            ├─→ Storage.Cursos.publicar(id) ← escrita
            ├─→ _logAtividade(...)          ← localStorage
            └─→ refresh()                   ← re-renderiza tudo
```

---

## Estrutura de Estado Interno

```javascript
// Privado ao módulo (não acessível externamente)
let _selecionados = new Set();  // IDs selecionados para ação em lote
let _cursoEditId  = null;       // ID do curso sendo editado (legado)
let _matEdit      = [];         // Materiais em edição (legado)
```

---

## Integração com o HTML (admin.html)

### Carregamento dos scripts

```html
<!-- Ordem obrigatória -->
<script src="src/js/storage.js"></script>
<script src="src/js/modules/curso-drawer.js"></script>
<script src="src/js/modules/gestao-cursos.js"></script>
<script src="src/js/admin.js"></script>
```

### Elementos DOM esperados

| ID | Descrição |
|---|---|
| `#gc-stats` | Container dos 5 cards de estatísticas |
| `#gc-toolbar` | Barra de filtros (IFT) |
| `#gc-tabela` / `#gc-tbody` | Tabela de cursos |
| `#gc-empty` | Estado vazio |
| `#gc-result-count` | Contagem de resultados |
| `#gc-search` | Campo de busca |
| `#gc-filtro-status` | Select de status (hidden) |
| `#gc-filtro-cat` | Select de categoria |
| `#gc-filtro-fmt` | Select de formato |
| `#gc-filtro-data` | Input de data mínima |
| `#gc-order` | Select de ordenação |
| `#gc-sel-count` | Label de seleção em lote |
| `#ift-lote-row` | Painel de ações em lote |
| `#gc-atividades` | Feed de atividades recentes |
| `#modal-curso-view` | Modal de visualização rápida |
| `#curso-editor-drawer` | Drawer de edição |
| `#curso-editor-iframe` | Iframe do wizard |
| `#drawer-titulo` | Título do drawer |

---

## Migrações Futuras

### Fase 2: REST API

Quando migrar para backend, **apenas** a camada de dados (`storage.js`) precisa mudar. Este módulo não acessa `localStorage` diretamente — exceto o log de atividades (`ead_atividades`).

```javascript
// O log de atividades precisa ser migrado para:
// POST /api/v1/atividades { tipo, cursoId, ts }
// GET  /api/v1/atividades?limit=10

// Localizar em gestao-cursos.js:
// _logAtividade() → POST /api/v1/atividades
// renderAtividades() → GET /api/v1/atividades
```

---

## Checklist de Testes

```
[ ] Listar cursos (tabela vazia, com dados)
[ ] Filtrar por busca de texto
[ ] Filtrar por status (todos os 5 chips)
[ ] Filtrar por categoria
[ ] Filtrar por formato
[ ] Filtrar por data de publicação
[ ] Ordenar (5 opções)
[ ] Limpar filtros
[ ] Selecionar individual → painel lote aparece
[ ] Selecionar tudo → painel lote aparece
[ ] Publicar em lote
[ ] Arquivar em lote
[ ] Excluir em lote (cascade de módulos/aulas)
[ ] Menu dropdown de ações (por linha)
[ ] Visualizar (modal de detalhes)
[ ] Editar (abre drawer com iframe)
[ ] Publicar individual
[ ] Despublicar
[ ] Arquivar individual
[ ] Excluir individual
[ ] Duplicar (verifica cópia criada)
[ ] Exportar CSV (abre download)
[ ] Stats cards atualizam após ações
[ ] Feed de atividades registra ações
[ ] Dashboard (ds-cursos, ds-publicados) atualiza
[ ] Fechar drawer com Escape
[ ] Fechar drawer com botão ×
[ ] Wizard concluído fecha drawer automaticamente
```

---

## Histórico de Versões

| Versão | Data | Mudança |
|---|---|---|
| 1.0.0 | 2025-05 | Extração do código inline de admin.html para módulo isolado |
