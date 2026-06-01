/**
 * state.js — Seleção em lote da tabela de materiais (MatState).
 * Responsabilidade única: gerenciar o conjunto _selecionados e a UI do
 * painel de ações em lote. Não acessa Storage.
 *
 * @module MatState
 */

var MatState = (() => {
  'use strict';

  // Itens selecionados na tabela
  const _selecionados = new Set();

  function select(id)   { _selecionados.add(id); }
  function deselect(id) { _selecionados.delete(id); }
  function clearSel()   { _selecionados.clear(); }
  function hasSel(id)   { return _selecionados.has(id); }
  function selSize()    { return _selecionados.size; }
  function selList()    { return [..._selecionados]; }

  /**
   * Atualiza label e visibilidade do painel de ações em lote.
   */
  function syncLoteUI() {
    const n     = _selecionados.size;
    const count = document.getElementById('mat-sel-count');
    if (count) count.textContent = `${n} material(is) selecionado(s)`;
    const row = document.getElementById('mat-lote-row');
    if (row) row.classList.toggle('show', n > 0);
  }

  return { select, deselect, clearSel, hasSel, selSize, selList, syncLoteUI };
})();
