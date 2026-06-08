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
  let _setorSel  = null;      // Setor escolhido em "Por setor" (filtra "Por equipe")
  let _alunoPage = 1;         // Página atual da lista de alunos do modal (25/pág)
  let _page      = 1;         // Página atual da tabela (quebra de página)
  let _perPage   = 25;        // Itens por página (25 / 50 / 75 / 100)
  let _lastSig   = null;      // Assinatura dos filtros p/ resetar página ao mudar

  return {
    get editId()    { return _editId; },
    set editId(v)   { _editId = v; },

    get viewingId() { return _viewingId; },
    set viewingId(v){ _viewingId = v; },

    get alunosSel() { return _alunosSel; },
    resetAlunos()   { _alunosSel = new Set(); _setorSel = null; _alunoPage = 1; },
    setAlunos(set)  { _alunosSel = new Set(set); _setorSel = null; _alunoPage = 1; },

    get setorSel()  { return _setorSel; },
    set setorSel(v) { _setorSel = v; },

    get alunoPage() { return _alunoPage; },
    set alunoPage(v){ _alunoPage = v; },

    get page()      { return _page; },
    set page(v)     { _page = v; },

    get perPage()   { return _perPage; },
    set perPage(v)  { _perPage = v; },

    get lastSig()   { return _lastSig; },
    set lastSig(v)  { _lastSig = v; },
  };
})();
