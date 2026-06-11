/**
 * @fileoverview controle-acessos/index.js — Fachada do módulo.
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO: AcessosMod (Controle de Acessos EAD)                   ║
 * ║                                                                  ║
 * ║  Fachada — mantém a API pública window.AcessosMod consumida por  ║
 * ║  admin.html (onclick) e admin.js (legado) SEM alterações.        ║
 * ║                                                                  ║
 * ║  Dependências (ordem de carregamento):                           ║
 * ║  • window.Storage  (storage.js)                                  ║
 * ║  • AcUtils   → utils.js   (helpers + config + resolveStatus)     ║
 * ║  • AcTable   → table.js   (stats, filtros, tabela, painéis)      ║
 * ║  • AcModals  → modals.js  (modal de liberação/edição, escopo)    ║
 * ║  • AcActions → actions.js (bloquear/ativar/revogar/renovar)      ║
 * ║                                                                  ║
 * ║  API pública (window.AcessosMod) — contratos não alterados:      ║
 * ║  • init(), refresh()                                             ║
 * ║  • renderTabela(), renderVencimentos(), renderHistorico()         ║
 * ║  • setStatus(btn, value), resetFiltros()                         ║
 * ║  • abrirModal(), abrirEdit(cursoId, tipo, refId), salvar()       ║
 * ║  • tabModal(idx, btn), setScope(btn)                             ║
 * ║  • bloquear/ativar/revogar/renovar(cursoId, tipo, refId)         ║
 * ║  • addRestricao(cId), remRestricao(cId, tipo, refId) — legado    ║
 * ║  • _menu(btn), _cm()                                             ║
 * ║                                                                  ║
 * ║  MIGRAÇÃO BACKEND: apenas window.Storage precisa mudar.          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * @module AcessosMod
 * @version 2.0.0
 */

/* global Storage, AcTable, AcModals, AcActions */

var AcessosMod = (() => {
  'use strict';

  function refresh() {
    Storage.Restricoes.sincronizarStatus();
    AcTable.renderTabela();
    AcTable.renderVencimentos();
    AcTable.renderHistorico();
  }

  function init() {
    Storage.Restricoes.sincronizarStatus();
    AcTable.renderTabela();
    AcTable.renderVencimentos();
    AcTable.renderHistorico();
    AcTable.popularFiltroCurso();
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
    salvar:     AcModals.salvar,
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
