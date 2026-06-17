/**
 * state.js — Estado interno do Portal do Aluno
 * Responsabilidade única: aluno logado e curso/aula em exibição.
 */

var AlunoState = (() => {
  'use strict';

  let _me  = null;
  let _cur = { cursoId: null, aulaId: null };

  function getMe()       { return _me; }
  function setMe(aluno)  { _me = aluno; }

  function getCur()      { return _cur; }
  function setCur(obj)   { _cur = { ..._cur, ...obj }; }
  function resetCur()    { _cur = { cursoId: null, aulaId: null }; }

  return { getMe, setMe, getCur, setCur, resetCur };
})();
