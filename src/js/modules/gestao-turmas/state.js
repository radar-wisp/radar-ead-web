/**
 * state.js — Estado interno compartilhado do módulo Turmas.
 * Responsabilidade única: variáveis mutáveis acessadas por múltiplos sub-módulos.
 *
 * @module TurmasState
 */

/* exported TurmasState */

var TurmasState = (() => {
  'use strict';

  let _editId    = null;      // ID da turma em edição (null = nova)
  let _viewingId = null;      // ID da turma aberta no dashboard
  let _alunosSel = new Set(); // IDs selecionados no modal de alunos

  return {
    get editId()    { return _editId; },
    set editId(v)   { _editId = v; },

    get viewingId() { return _viewingId; },
    set viewingId(v){ _viewingId = v; },

    get alunosSel() { return _alunosSel; },
    resetAlunos()   { _alunosSel = new Set(); },
    setAlunos(set)  { _alunosSel = new Set(set); },
  };
})();
