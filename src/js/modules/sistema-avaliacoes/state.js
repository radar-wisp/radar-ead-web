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

  return {
    get editId()    { return _editId; },
    set editId(v)   { _editId = v; },
    get questoes()  { return _questoes; },
    set questoes(v) { _questoes = v; },
  };
})();
