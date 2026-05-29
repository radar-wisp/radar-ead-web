/**
 * state.js — Estado interno e seleção em lote
 * Responsabilidade única: gerenciar _selecionados e _progressCache.
 */

/* global EadUtils */

var CursosState = (() => {
  'use strict';

  // Itens selecionados na tabela
  const _selecionados = new Set();

  // Cache de progresso por ciclo de renderização
  let _progressCache = {};

  function clearCache()   { _progressCache = {}; }
  function getCache(id)   { return _progressCache[id]; }
  function setCache(id, v){ _progressCache[id] = v; }

  function select(id)     { _selecionados.add(id); }
  function deselect(id)   { _selecionados.delete(id); }
  function clearSel()     { _selecionados.clear(); }
  function hasSel(id)     { return _selecionados.has(id); }
  function selSize()      { return _selecionados.size; }
  function selList()      { return [..._selecionados]; }

  /**
   * Atualiza label e visibilidade do painel de ações em lote.
   */
  function syncLoteUI() {
    const n = _selecionados.size;
    const countEl = document.getElementById('gc-sel-count');
    if (countEl) countEl.textContent = `${n} curso${n !== 1 ? 's' : ''} selecionado${n !== 1 ? 's' : ''}`;
    const loteRow = document.getElementById('ift-lote-row');
    if (loteRow) loteRow.classList.toggle('show', n > 0);
  }

  return { clearCache, getCache, setCache, select, deselect, clearSel, hasSel, selSize, selList, syncLoteUI };
})();
