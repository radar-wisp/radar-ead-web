/**
 * @fileoverview gestao-cursos/index.js — Módulo: Gestão de Cursos
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO: Cursos (window.Cursos)                                  ║
 * ║                                                                  ║
 * ║  Rota: pg-cursos (via Admin.go('cursos'))                        ║
 * ║                                                                  ║
 * ║  Dependências internas (ordem de carregamento):                  ║
 * ║  • CursosState  (state.js)                                       ║
 * ║  • CursosUtils  (utils.js)                                       ║
 * ║  • CursosTable  (table.js)                                       ║
 * ║  • CursosStats  (stats.js)                                       ║
 * ║  • CursosActions (actions.js)                                    ║
 * ║  • CursosModals  (modals.js)                                     ║
 * ║                                                                  ║
 * ║  Dependências externas:                                          ║
 * ║  • window.Storage, window.EadUtils, window.IFT                   ║
 * ║  • window.PortalMenu, window.Admin, window.CursoDrawer           ║
 * ║                                                                  ║
 * ║  API pública (window.Cursos) — contratos não alterados:          ║
 * ║  • init(), refresh()                                             ║
 * ║  • renderTabela(), renderStats(), renderAtividades()             ║
 * ║  • toggleSel(id, checked), toggleSelAll(checkbox)                ║
 * ║  • publicarLote(), arquivarLote(), excluirLote()                 ║
 * ║  • publicarCurso(id), despublicarCurso(id)                       ║
 * ║  • arquivarCurso(id), excluirCurso(id), duplicarCurso(id)        ║
 * ║  • visualizar(id), abrirEdit(id)                                 ║
 * ║  • toggleMenu(btn), closeMenus()                                 ║
 * ║  • exportar()                                                    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

/* global CursosState, CursosUtils, CursosTable, CursosStats, CursosActions, CursosModals, IFT */

var Cursos = (() => {
  'use strict';

  // ── Ciclo de vida ───────────────────────────────────────────────

  function init() {
    CursosState.clearSel();
    CursosState.syncLoteUI();
    CursosTable.popularFiltroCategoria();
    CursosStats.renderStats();
    CursosTable.render();
    CursosStats.renderAtividades();
    if (typeof IFT !== 'undefined') IFT.init();
  }

  function refresh() {
    CursosStats.renderStats();
    CursosTable.render();
    CursosStats.renderAtividades();
    CursosTable.popularFiltroCategoria();
    CursosStats.sincronizarDashboard();
  }

  // ── API pública ─────────────────────────────────────────────────
  // Todas as funções delegam para os sub-módulos.
  // Os nomes públicos são preservados para não quebrar admin.html.

  return {
    // Ciclo de vida
    init,
    refresh,

    // Renderização (chamadas por IFT e event handlers do admin.html)
    renderTabela:     CursosTable.render,
    renderStats:      CursosStats.renderStats,
    renderAtividades: CursosStats.renderAtividades,

    // Seleção
    toggleSel:    CursosActions.toggleSel,
    toggleSelAll: CursosActions.toggleSelAll,

    // Ações em lote
    publicarLote: (...a) => { CursosActions.publicarLote(...a); refresh(); },
    arquivarLote: (...a) => { CursosActions.arquivarLote(...a); refresh(); },
    excluirLote:  (...a) => { CursosActions.excluirLote(...a);  refresh(); },

    // Ações individuais
    publicarCurso:    (id) => { CursosActions.publicarCurso(id);    refresh(); },
    despublicarCurso: (id) => { CursosActions.despublicarCurso(id); refresh(); },
    arquivarCurso:    (id) => { CursosActions.arquivarCurso(id);    refresh(); },
    excluirCurso:     (id) => { CursosActions.excluirCurso(id);     refresh(); },
    duplicarCurso:    (id) => { CursosActions.duplicarCurso(id);    refresh(); },

    // Visualização e edição
    visualizar: CursosModals.visualizar,
    abrirEdit:  CursosActions.abrirEdit,

    // Menu dropdown
    toggleMenu: CursosTable.toggleMenu,
    closeMenus: CursosTable.closeMenus,

    // Paginação (quebra de página)
    setPerPage: CursosTable.setPerPage,
    _goPage:    CursosTable.goPage,

    // Chevron das tabelas de status
    toggleCard: CursosTable.toggleCard,

    // Utilitários
    exportar: CursosActions.exportar,
  };
})();
