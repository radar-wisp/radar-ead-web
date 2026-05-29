/**
 * state.js — Estado interno compartilhado do módulo Controle de Acessos.
 * Responsabilidade única: variáveis mutáveis acessadas por modals e actions.
 *
 * @module AcState
 */

/* exported AcState */

var AcState = (() => {
  'use strict';

  let _editCtx    = null;      // { cursoId, tipo, refId } do acesso em edição (null = novo)
  let _scopeAtual = 'global';  // escopo selecionado no modal

  return {
    get editCtx()     { return _editCtx; },
    set editCtx(v)    { _editCtx = v; },
    get scopeAtual()  { return _scopeAtual; },
    set scopeAtual(v) { _scopeAtual = v; },
  };
})();
