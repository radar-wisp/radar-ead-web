/**
 * @fileoverview dashboard/index.js — Módulo: Dashboard
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO: Dashboard (window.DashboardMod)                         ║
 * ║                                                                  ║
 * ║  Rota: pg-dashboard (via Admin.go('dashboard'))                   ║
 * ║                                                                  ║
 * ║  Dependências internas (ordem de carregamento):                  ║
 * ║  • DashboardUtils   (utils.js)                                   ║
 * ║  • DashboardStats   (stats.js)                                   ║
 * ║  • DashboardActions (actions.js)                                 ║
 * ║  • DashboardMod     (index.js — este arquivo)                    ║
 * ║                                                                  ║
 * ║  Dependências externas:                                          ║
 * ║  • window.Storage, window.EadUtils                               ║
 * ║  • window.Admin (navegação entre rotas)                          ║
 * ║                                                                  ║
 * ║  API pública (window.DashboardMod):                              ║
 * ║  • init()           — ponto de entrada (chamado por admin.js)    ║
 * ║  • refresh()        — re-renderiza após ação                     ║
 * ║  • toggleMenu(btn)  — menu de ações contextual                   ║
 * ║  • closeMenus()     — fecha menus abertos                        ║
 * ║  • publicar(id)     — publica curso                              ║
 * ║  • arquivar(id)     — arquiva curso                              ║
 * ║  • openValidade(id) — edita validade do curso                    ║
 * ║  • goAcessos(id)    — navega para Acessos filtrado por curso     ║
 * ║  • goEdit(id)       — navega para edição do curso                ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

/* global DashboardUtils, DashboardStats, DashboardActions */

var DashboardMod = (() => {
  'use strict';

  // ── Ciclo de vida ─────────────────────────────────────────────────

  function init() {
    DashboardStats.render();
  }

  function refresh() {
    DashboardStats.render();
  }

  // ── API pública ───────────────────────────────────────────────────

  return {
    // Ciclo de vida
    init,
    refresh,

    // Menu de ações
    toggleMenu: DashboardActions.toggleMenu,
    closeMenus: DashboardActions.closeMenus,

    // Ações de curso
    publicar:     DashboardActions.publicar,
    arquivar:     DashboardActions.arquivar,
    openValidade: DashboardActions.openValidade,

    // Navegação
    goAcessos: DashboardActions.goAcessos,
    goEdit:    DashboardActions.goEdit,
  };
})();
