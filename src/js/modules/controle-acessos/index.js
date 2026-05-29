/**
 * @fileoverview index.js — Módulo: Controle de Acessos (fachada)
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO: AcessosMod (Controle de Acessos EAD)                    ║
 * ║                                                                  ║
 * ║  Fachada do módulo — mantém a API pública window.AcessosMod      ║
 * ║  consumida por admin.html (onclick) sem alterações.              ║
 * ║                                                                  ║
 * ║  Dependências (ordem de carregamento):                           ║
 * ║  • window.Storage (storage.js)                                   ║
 * ║  • AcUtils   → utils.js                                          ║
 * ║  • AcState   → state.js                                          ║
 * ║  • AcTable   → table.js                                          ║
 * ║  • AcModals  → modals.js                                         ║
 * ║  • AcActions → actions.js                                        ║
 * ║                                                                  ║
 * ║  MIGRAÇÃO BACKEND: Apenas window.Storage precisa mudar.          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * @module ControleAcessos
 * @version 2.0.0
 * @see docs/ARCHITECTURE.md
 */

/* global Storage, AcTable, AcModals, AcActions */

var AcessosMod = (() => {
  'use strict';

  function refresh() {
    Storage.Restricoes.sincronizarStatus();
    AcTable.renderStats();
    AcTable.renderTabela();
    AcTable.renderVencimentos();
    AcTable.renderHistorico();
  }

  function init() {
    refresh();
    AcTable._popularFiltroCurso();
  }

  return {
    // Ciclo de vida
    init,
    refresh,

    // Renderização
    renderTabela:      AcTable.renderTabela,
    renderVencimentos: AcTable.renderVencimentos,
    renderHistorico:   AcTable.renderHistorico,

    // Filtros
    setStatus:    AcTable.setStatus,
    resetFiltros: AcTable.resetFiltros,

    // Modal
    abrirModal: AcModals.abrirModal,
    abrirEdit:  AcModals.abrirEdit,
    salvar:     AcActions.salvar,
    tabModal:   AcModals.tabModal,
    setScope:   AcModals.setScope,

    // Ações individuais
    bloquear: AcActions.bloquear,
    ativar:   AcActions.ativar,
    revogar:  AcActions.revogar,
    renovar:  AcActions.renovar,

    // Menu
    _menu: AcTable._menu,
    _cm:   AcTable._cm,

    // Compatibilidade legada
    addRestricao: AcActions.addRestricao,
    remRestricao: AcActions.remRestricao,
  };
})();
