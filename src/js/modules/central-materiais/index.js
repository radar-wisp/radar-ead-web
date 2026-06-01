/**
 * @fileoverview central-materiais/index.js — Fachada do módulo.
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO: MatMod (Central de Materiais de Apoio)                 ║
 * ║                                                                  ║
 * ║  Fachada — mantém a API pública window.MatMod consumida por      ║
 * ║  admin.html (onclick) SEM alterações.                            ║
 * ║                                                                  ║
 * ║  Dependências (ordem de carregamento):                           ║
 * ║  • window.Storage  (storage.js)                                  ║
 * ║  • MatUtils   → utils.js   (helpers + config visual)             ║
 * ║  • MatState   → state.js   (seleção em lote)                     ║
 * ║  • MatTable   → table.js   (stats, filtros, tabela, menu)        ║
 * ║  • MatModals  → modals.js  (viewer, vínculo, modal, upload)      ║
 * ║  • MatActions → actions.js (seleção + ações em lote/individuais) ║
 * ║                                                                  ║
 * ║  API pública (window.MatMod) — contratos não alterados:          ║
 * ║  • init(), refresh(), renderTabela()                             ║
 * ║  • setStatus(btn, value), resetFiltros()                         ║
 * ║  • abrirModal(), abrirEdit(id), salvar(), tabModal(idx, btn)     ║
 * ║  • setUploadMode(mode), handleFile(input)                        ║
 * ║  • onDragOver(e), onDragLeave(e), onDrop(e)                      ║
 * ║  • visualizar(id), arquivar(id), excluir(id)                     ║
 * ║  • duplicar(id), baixar(id)                                      ║
 * ║  • abrirVincular(id), confirmarVinculo()                         ║
 * ║  • toggleSel(id, checked), toggleSelAll(checkbox)                ║
 * ║  • ativarLote(), arquivarLote(), excluirLote()                   ║
 * ║  • _menu(btn), _closeMenus()                                     ║
 * ║                                                                  ║
 * ║  MIGRAÇÃO BACKEND: apenas window.Storage precisa mudar.          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * @module MatMod
 * @version 2.0.0
 */

/* global MatState, MatTable, MatModals, MatActions */

var MatMod = (() => {
  'use strict';

  function refresh() {
    MatTable.renderStats();
    MatTable.renderTabela();
    MatTable.popularFiltroCurso();
  }

  function init() {
    MatTable.renderStats();
    MatTable.renderTabela();
    MatTable.popularFiltroCurso();
    MatState.clearSel();
    MatState.syncLoteUI();
  }

  return {
    // Ciclo de vida
    init,
    refresh,

    // Renderização
    renderTabela: MatTable.renderTabela,

    // Filtros
    setStatus:    MatTable.setStatus,
    resetFiltros: MatTable.resetFiltros,

    // Modal
    abrirModal:   MatModals.abrirModal,
    abrirEdit:    MatModals.abrirEdit,
    salvar:       MatModals.salvar,
    tabModal:     MatModals.tabModal,

    // Upload
    setUploadMode: MatModals.setUploadMode,
    handleFile:    MatModals.handleFile,
    onDragOver:    MatModals.onDragOver,
    onDragLeave:   MatModals.onDragLeave,
    onDrop:        MatModals.onDrop,

    // Ações individuais
    visualizar: MatModals.visualizar,
    arquivar:   MatActions.arquivar,
    excluir:    MatActions.excluir,
    duplicar:   MatActions.duplicar,
    baixar:     MatActions.baixar,

    // Vínculo com curso
    abrirVincular:    MatModals.abrirVincular,
    confirmarVinculo: MatModals.confirmarVinculo,

    // Seleção em lote
    toggleSel:    MatActions.toggleSel,
    toggleSelAll: MatActions.toggleSelAll,
    ativarLote:   MatActions.ativarLote,
    arquivarLote: MatActions.arquivarLote,
    excluirLote:  MatActions.excluirLote,

    // Menu
    _menu:       MatTable._menu,
    _closeMenus: MatTable._closeMenus,
  };
})();
