/**
 * @fileoverview gestao-turmas/index.js — Módulo: Gestão de Turmas
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  MÓDULO: Turmas                                              ║
 * ║                                                              ║
 * ║  Rota: pg-turmas (via Admin.go('turmas'))                    ║
 * ║                                                              ║
 * ║  Dependências (ordem de carregamento):                       ║
 * ║  • window.EadUtils   (utils.js)                              ║
 * ║  • window.Storage    (storage.js)                            ║
 * ║  • window.PortalMenu (admin.html inline)                     ║
 * ║  • TurmasState   → state.js                                  ║
 * ║  • TurmasUtils   → utils.js     (deste módulo)               ║
 * ║  • TurmasTable   → table.js                                  ║
 * ║  • TurmasModals  → modals.js                                 ║
 * ║  • TurmasActions → actions.js                                ║
 * ║                                                              ║
 * ║  API pública (window.Turmas) — contratos mantidos:           ║
 * ║  init, refresh, renderTabela                                 ║
 * ║  setStatus, resetFiltros, filtrarAlunos                      ║
 * ║  abrirModal, abrirEdit, abrirGerenciarAlunos                 ║
 * ║  salvar, tabModal, visualizar                                ║
 * ║  encerrar, excluir                                           ║
 * ║  renderListaAlunos, selecionarPorSetor, selecionarPorEquipe  ║
 * ║  selecionarTodos, limparAlunos                               ║
 * ║  _menu, _closeMenus, _toggleAluno, _viewingId               ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * @module Turmas
 */

/* global TurmasState, TurmasTable, TurmasModals, TurmasActions */

var Turmas = (() => {
  'use strict';

  // ── Ciclo de vida ─────────────────────────────────────────────

  function init() {
    TurmasTable.renderStats();
    TurmasTable.renderTabela();
    TurmasTable.popularFiltroCurso();
  }

  function refresh() {
    TurmasTable.renderStats();
    TurmasTable.renderTabela();
    TurmasTable.popularFiltroCurso();
  }

  // ── API pública ───────────────────────────────────────────────

  return {
    // Ciclo de vida
    init,
    refresh,

    // Tabela e filtros
    renderTabela:  TurmasTable.renderTabela,
    setStatus:     TurmasTable.setStatus,
    resetFiltros:  TurmasTable.resetFiltros,
    filtrarAlunos: TurmasModals.renderListaAlunos,

    // Modais
    abrirModal:           TurmasModals.abrirModal,
    abrirEdit:            TurmasModals.abrirEdit,
    abrirGerenciarAlunos: TurmasModals.abrirGerenciarAlunos,
    tabModal:             TurmasModals.tabModal,
    visualizar:           TurmasModals.visualizar,

    // Lista de alunos no modal
    renderListaAlunos:  TurmasModals.renderListaAlunos,
    selecionarPorSetor: TurmasModals.selecionarPorSetor,
    selecionarPorEquipe:TurmasModals.selecionarPorEquipe,
    selecionarTodos:    TurmasModals.selecionarTodos,
    limparAlunos:       TurmasModals.limparAlunos,

    // Ações
    salvar:  TurmasActions.salvar,
    encerrar:TurmasActions.encerrar,
    excluir: TurmasActions.excluir,

    // Menu
    _menu:       TurmasActions.menu,
    _closeMenus: TurmasActions.closeMenus,

    // Chamado pelo HTML inline (lista de alunos)
    _toggleAluno: TurmasModals._toggleAluno,

    // Estado exposto (usado pelo modal-dash)
    get _viewingId() { return TurmasState.viewingId; },
  };
})();
