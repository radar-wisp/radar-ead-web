/**
 * @fileoverview central-materiais/index.js — Módulo: Central de Materiais
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO: MatMod (Central de Materiais de Apoio)                  ║
 * ║                                                                  ║
 * ║  Fachada do módulo — mantém a API pública window.MatMod          ║
 * ║  consumida por admin.html (onclick) sem alterações.              ║
 * ║                                                                  ║
 * ║  Dependências (ordem de carregamento):                           ║
 * ║  • window.Storage  (storage.js)                                  ║
 * ║  • MatUtils   → utils.js                                         ║
 * ║  • MatState   → state.js                                         ║
 * ║  • MatTable   → table.js                                         ║
 * ║  • MatModals  → modals.js                                        ║
 * ║  • MatActions → actions.js                                       ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * @module CentralMateriais
 * @version 2.0.0
 */

/* global MatState, MatTable, MatModals, MatActions */

var MatMod = (() => {
  'use strict';

  function refresh() {
    MatTable.renderStats();
    MatTable.renderTabela();
    MatTable._popularFiltroCurso();
  }

  function init() {
    MatTable.renderStats();
    MatTable.renderTabela();
    MatTable._popularFiltroCurso();
    MatState.selecionados.clear();
    MatTable._atualizarLote();
  }

  return {
    // Ciclo de vida
    init,
    refresh,

    // Renderização / filtros
    renderTabela: MatTable.renderTabela,
    setStatus:    MatTable.setStatus,
    resetFiltros: MatTable.resetFiltros,

    // Modal
    abrirModal: MatModals.abrirModal,
    abrirEdit:  MatModals.abrirEdit,
    salvar:     MatActions.salvar,
    tabModal:   MatModals.tabModal,

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
    abrirVincular:   MatModals.abrirVincular,
    confirmarVinculo: MatActions.confirmarVinculo,

    // Seleção em lote
    toggleSel:    MatTable.toggleSel,
    toggleSelAll: MatTable.toggleSelAll,
    ativarLote:   MatActions.ativarLote,
    arquivarLote: MatActions.arquivarLote,
    excluirLote:  MatActions.excluirLote,

    // Menu
    _menu:      MatTable._menu,
    _closeMenus: MatTable._closeMenus,
  };
})();
