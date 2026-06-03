/**
 * @fileoverview sistema-avaliacoes/index.js — Módulo: Sistema de Avaliações
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  MÓDULO: Aval (Sistema de Avaliações EAD)                    ║
 * ║                                                              ║
 * ║  Fachada do módulo — mantém a API pública window.Aval        ║
 * ║  consumida por admin.html (onclick) sem alterações.          ║
 * ║                                                              ║
 * ║  Dependências (ordem de carregamento):                       ║
 * ║  • window.Storage   (storage.js)                             ║
 * ║  • AvalUtils   → utils.js                                    ║
 * ║  • AvalState   → state.js                                    ║
 * ║  • AvalTable   → table.js                                    ║
 * ║  • AvalModals  → modals.js                                   ║
 * ║  • AvalActions → actions.js                                  ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * @module Aval
 */

/* global AvalTable, AvalModals, AvalActions */

var Aval = (() => {
  'use strict';

  function init() {
    AvalTable.renderStats();
    AvalTable.renderTabela();
    AvalTable._popularFiltros();
  }

  function refresh() {
    AvalTable.renderStats();
    AvalTable.renderTabela();
    AvalTable._popularFiltros();
  }

  return {
    // Ciclo de vida
    init, refresh,

    // Tabela e filtros
    renderTabela: AvalTable.renderTabela,
    setStatus:    AvalTable.setStatus,
    resetFiltros: AvalTable.resetFiltros,
    _menu:        AvalTable._menu,
    _cm:          AvalTable._cm,

    // Paginação (quebra de página)
    _goPage:    AvalTable.goPage,
    setPerPage: AvalTable.setPerPage,

    // Modal e editor de questões
    abrirModal:    AvalModals.abrirModal,
    abrirEdit:     AvalModals.abrirEdit,
    tabModal:      AvalModals.tabModal,
    _loadModulos:  AvalModals._loadModulos,
    addQuestao:    AvalModals.addQuestao,
    renderQuestoes:AvalModals.renderQuestoes,
    _setPergunta:  AvalModals._setPergunta,
    _setPontos:    AvalModals._setPontos,
    _setFeedback:  AvalModals._setFeedback,
    _setCorreta:   AvalModals._setCorreta,
    _setAlt:       AvalModals._setAlt,
    _addAlt:       AvalModals._addAlt,
    _remAlt:       AvalModals._remAlt,
    _remQuestao:   AvalModals._remQuestao,
    _toggleQuestao:AvalModals._toggleQuestao,

    // Ações
    salvar:       AvalActions.salvar,
    publicar:     AvalActions.publicar,
    encerrar:     AvalActions.encerrar,
    excluir:      AvalActions.excluir,
    duplicar:     AvalActions.duplicar,
    verResultados:AvalActions.verResultados,
  };
})();
