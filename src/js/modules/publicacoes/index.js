/**
 * @fileoverview publicacoes/index.js — Módulo: Central de Publicações EAD
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO: Publicações (window.PubMod)                              ║
 * ║                                                                  ║
 * ║  Rota: pg-publicacao (via Admin.go('publicacao'))                ║
 * ║                                                                  ║
 * ║  Dependências internas (ordem de carregamento):                  ║
 * ║  • PubState   (state.js)                                         ║
 * ║  • PubUtils   (utils.js)                                         ║
 * ║  • PubStats   (stats.js)                                         ║
 * ║  • PubTable   (table.js)                                         ║
 * ║  • PubModals  (modals.js)                                        ║
 * ║  • PubActions (actions.js)                                       ║
 * ║                                                                  ║
 * ║  Dependências externas:                                          ║
 * ║  • window.Storage (Publicacoes, Comunicados, Cursos, Materiais,  ║
 * ║    Avaliacoes, Turmas, Setores, Equipes, Alunos)                 ║
 * ║                                                                  ║
 * ║  API pública (window.PubMod) — contratos não alterados.          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

/* global Storage, PubStats, PubTable, PubModals, PubActions */

var PubMod = (() => {
  'use strict';

  // ── Ciclo de vida ───────────────────────────────────────────────
  function init() {
    Storage.Publicacoes.sincronizar();
    Storage.Publicacoes.sincronizarCursos();
    PubStats.renderStats();
    PubTable.renderTabela();
    PubStats.renderAguardando();
    PubStats.renderVencimentos();
    PubStats.renderComunicadosLista();
    PubStats.popularFiltroCurso();
  }

  function refresh() {
    Storage.Publicacoes.sincronizar();
    PubStats.renderStats();
    PubTable.renderTabela();
    PubStats.renderAguardando();
    PubStats.renderVencimentos();
    PubStats.renderComunicadosLista();
  }

  // ── API pública (nomes preservados para não quebrar admin.html) ──
  return {
    // Ciclo de vida
    init,
    refresh,

    // Renderização / listagem
    renderTabela:           PubTable.renderTabela,
    renderAguardando:       PubStats.renderAguardando,
    renderVencimentos:      PubStats.renderVencimentos,
    renderComunicadosLista: PubStats.renderComunicadosLista,

    // Filtros
    setStatus:    PubTable.setStatus,
    resetFiltros: PubTable.resetFiltros,

    // Modais
    abrirModal:      PubModals.abrirModal,
    abrirEdit:       PubModals.abrirEdit,
    salvar:          PubActions.salvar,
    tabModal:        PubModals.tabModal,
    setModo:         PubModals.setModo,
    setVis:          PubModals.setVis,
    _loadRefOptions: PubModals._loadRefOptions,
    abrirComunicado: PubModals.abrirComunicado,
    salvarComunicado: PubActions.salvarComunicado,

    // Ações individuais
    publicar:    PubActions.publicar,
    despublicar: PubActions.despublicar,
    arquivar:    PubActions.arquivar,
    excluir:     PubActions.excluir,

    // Menu dropdown
    _menu: PubTable._menu,
    _cm:   PubTable._cm,

    // Compatibilidade legada
    publicar_legado:     PubActions.publicar_legado,
    arquivar_legado:     PubActions.arquivar_legado,
    openValidade_legado: PubActions.openValidade_legado,
  };
})();
