[README-modules-index (1).md](https://github.com/user-attachments/files/28476150/README-modules-index.1.md)
# Módulos — Radar Internet EAD Platform

**Projeto:** Radar Internet — EAD Platform
**Local:** `src/js/modules/`
**Status:** Produção

---

## Visão Geral

Este diretório reúne os módulos de UI do painel administrativo (`admin.html`).
Cada módulo é **autocontido** e se comunica com o resto do sistema apenas
através das interfaces públicas de `src/js/storage.js` (persistência) e do
roteador `src/js/admin.js` (navegação). Nenhum módulo acessa `localStorage`
diretamente — exceto logs auxiliares pontuais.

> **Princípio de migração:** quando o backend mudar (Fase 2), apenas
> `storage.js` precisa ser reescrito. Os módulos não tocam na camada de dados.
> Detalhes em `docs/ARCHITECTURE.md`.

---

## Mapa dos Módulos

| Diretório | Objeto global | Rota (`Admin.go(...)`) | Responsabilidade |
|---|---|---|---|
| `gestao-cursos/` | `window.Cursos` | `cursos` | Listagem, filtros, ações em lote e edição de cursos |
| `gestao-turmas/` | `window.Turmas` | `turmas` | Turmas, vínculo de alunos por setor/equipe |
| `central-materiais/` | `window.MatMod` | `materiais` | Materiais de apoio: upload, vínculo, lote |
| `central-certificados/` | `window.CertMod` | `certificados` | Emissão, validação e modelos de certificados |
| `controle-acessos/` | `window.AcessosMod` | `acessos` | Restrições e liberações de acesso a cursos |
| `sistema-avaliacoes/` | `window.Aval` | `avaliacoes` | Avaliações e editor de questões |
| `alunos/` | `window.AlunosMod` | `colaboradores` | Cadastro, perfil e filtros de alunos/colaboradores |
| `setores-equipes/` | `window.SetoresEquipesMod` | `setores-equipes` | Gestão de setores e equipes |
| `curso-drawer.js` | `window.CursoDrawer` | — | Drawer lateral que carrega o wizard `novo-curso.html` |

`curso-drawer.js` é o único módulo de arquivo único; é um sub-módulo de
`gestao-cursos` (abre/fecha o painel de edição) e fica na raiz por ser
compartilhável.

---

## Padrão de Arquitetura

Todos os módulos em pasta seguem a mesma divisão em arquivos. Cada arquivo
expõe um objeto interno (ex.: `CursosState`, `CursosTable`) e o `index.js`
monta a fachada pública (ex.: `window.Cursos`).

| Arquivo | Papel |
|---|---|
| `state.js` | Estado interno do módulo (seleção em lote, IDs em edição) |
| `utils.js` | Helpers e configuração visual do módulo |
| `validators.js` | Validação de formulários (apenas onde há cadastro complexo) |
| `table.js` | Stats, filtros, renderização da tabela e menus de linha |
| `stats.js` | Cards de indicadores e feed de atividades (quando separado) |
| `render.js` | Renderização especializada (ex.: visualizador/impressão) |
| `cards.js` | Renderização em grade de cards (alternativa a `table.js`) |
| `modals.js` | Modais de criação/edição e fluxos de wizard |
| `actions.js` | Ações sobre os dados (publicar, arquivar, excluir, lote…) |
| `index.js` | **Fachada** — orquestra os arquivos acima e expõe a API pública |

Nem todo módulo tem todos os arquivos. Por exemplo, `setores-equipes` usa
`cards.js` no lugar de `table.js`, e `controle-acessos` não tem `state.js`.

---

## Ordem de Carregamento

A ordem dos `<script>` no `admin.html` é **obrigatória**: as dependências
internas precisam existir antes do `index.js` que as orquestra. O padrão é:

```
storage.js  →  utils.js  →  (dependências internas do módulo)  →  index.js
```

A regra geral por módulo é:

```html
<script src="src/js/modules/<modulo>/state.js"></script>
<script src="src/js/modules/<modulo>/utils.js"></script>
<script src="src/js/modules/<modulo>/table.js"></script>
<script src="src/js/modules/<modulo>/modals.js"></script>
<script src="src/js/modules/<modulo>/actions.js"></script>
<script src="src/js/modules/<modulo>/index.js"></script>
```

Variações por módulo (consulte o cabeçalho de cada `index.js` para a ordem
exata): `gestao-cursos` insere `stats.js` antes de `actions.js`;
`alunos` insere `validators.js` e `perfil.js`; `central-certificados` insere
`render.js`. O `curso-drawer.js` é carregado **antes** do bloco de
`gestao-cursos`.

---

## Ciclo de Vida Comum

Toda fachada expõe ao menos:

| Função | Descrição |
|---|---|
| `init()` | Ponto de entrada. Chamado pelo roteador em `admin.js` ao navegar para a rota. Inicializa estado e renderiza tudo. |
| `refresh()` | Re-renderiza stats, tabela e painéis após uma ação. |

O roteador em `src/js/admin.js` (objeto `renders`) decide qual `init()`
chamar a cada `Admin.go(rota)`.

---

## Documentação Detalhada por Módulo

A API pública completa de cada módulo está documentada no cabeçalho do
respectivo `index.js`. README detalhado é criado sob demanda, conforme o
módulo recebe manutenção. Atualmente:

- `gestao-cursos/README.md` — referência completa (API, fluxo de dados, DOM, checklist).

Ao criar a documentação detalhada de um novo módulo, use o
`gestao-cursos/README.md` como template.

---

## Convenções

- Sem acesso direto a `localStorage` (use `window.Storage`).
- A API pública (`window.<Modulo>`) é o contrato com o `admin.html` (handlers
  `onclick`) e o `admin.js`. **Não** alterar assinaturas sem atualizar os dois.
- Funções prefixadas com `_` são privadas por convenção.

---

## Histórico

| Versão | Data | Mudança |
|---|---|---|
| 2.0.0 | 2026 | Refatoração dos módulos monolíticos em pastas (state/utils/table/modals/actions/index) |
| 1.0.0 | 2025-05 | Extração do código inline de `admin.html` para módulos isolados |
