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

  // ── Paginação (quebra de página) ──────────────────────────────
  let _page          = 1;      // Página atual da tabela
  let _perPage       = 25;     // Itens por página (25 / 50 / 75 / 100)
  let _lastFilterSig = null;   // Assinatura dos filtros p/ resetar página

  function getPage()       { return _page; }
  function setPage(p)      { _page = p; }
  function getPerPage()    { return _perPage; }
  function setPerPage(n)   { _perPage = n; }
  function getFilterSig()  { return _lastFilterSig; }
  function setFilterSig(s) { _lastFilterSig = s; }

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

  return {
    select, deselect, clearSel, hasSel, selSize, selList, syncLoteUI,
    getPage, setPage, getPerPage, setPerPage, getFilterSig, setFilterSig,
  };
})();
