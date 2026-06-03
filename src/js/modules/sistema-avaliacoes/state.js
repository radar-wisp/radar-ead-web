/**
 * state.js — Estado interno compartilhado do módulo Avaliações.
 * Responsabilidade única: variáveis mutáveis acessadas por modals e actions.
 *
 * @module AvalState
 */

/* exported AvalState */

var AvalState = (() => {
  'use strict';

  let _editId   = null;  // ID da avaliação em edição (null = nova)
  let _questoes = [];    // questões da avaliação em edição (estado local)

  let _page          = 1;     // Página atual da tabela (quebra de página)
  let _perPage       = 25;    // Itens por página (25 / 50 / 75 / 100)
  let _lastFilterSig = null;  // Assinatura dos filtros p/ resetar página ao mudar

  return {
    get editId()    { return _editId; },
    set editId(v)   { _editId = v; },
    get questoes()  { return _questoes; },
    set questoes(v) { _questoes = v; },
    get page()          { return _page; },
    set page(v)         { _page = v; },
    get perPage()       { return _perPage; },
    set perPage(v)      { _perPage = v; },
    get lastFilterSig() { return _lastFilterSig; },
    set lastFilterSig(v){ _lastFilterSig = v; },
  };
})();
