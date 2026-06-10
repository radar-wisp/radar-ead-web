/**
 * @fileoverview configuracoes/index.js — Fachada do módulo Configurações
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO: ConfigMod (Configurações EAD)                           ║
 * ║                                                                  ║
 * ║  Dependências (ordem de carregamento):                           ║
 * ║  1. configuracores/constants.js  → CfgConstants                 ║
 * ║  2. configuracores/render.js     → CfgRender                    ║
 * ║  3. configuracores/actions.js    → CfgActions                   ║
 * ║  4. configuracores/index.js      → ConfigMod (este arquivo)     ║
 * ║                                                                  ║
 * ║  API pública (window.ConfigMod) — contratos não alterados:       ║
 * ║  • init()                                                        ║
 * ║  • switchTab(idx)                                                ║
 * ║  • renderList(idx)                                               ║
 * ║  • openForm(idx), cancelForm(idx), saveItem(idx)                 ║
 * ║  • editItem(idx, id), deleteItem(idx, id)                        ║
 * ║  • selectIcon(idx, value)                                        ║
 * ║  • getItems(key), KEYS                                           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

/* global CfgConstants, CfgRender, CfgActions */

var ConfigMod = (() => {
  'use strict';

  let _activeTab = 0;

  function init() {
    CfgActions.seedDefaults();
    CfgRender.page(_activeTab);
    CfgActions.renderList(_activeTab);
  }

  function switchTab(idx) {
    _activeTab = idx;
    CfgActions.switchTab(idx);
  }

  return {
    init,
    switchTab,
    renderList:  CfgActions.renderList,
    openForm:    CfgActions.openForm,
    cancelForm:  CfgActions.cancelForm,
    saveItem:    CfgActions.saveItem,
    editItem:    CfgActions.editItem,
    deleteItem:  CfgActions.deleteItem,
    selectIcon:  CfgActions.selectIcon,
    getItems:    CfgActions.getItems,
    KEYS:        CfgConstants.KEYS,
  };
})();
