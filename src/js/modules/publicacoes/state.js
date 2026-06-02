/**
 * state.js — Estado interno do módulo de Publicações
 * Responsabilidade única: guardar o contexto de edição/modais
 * (publicação em edição, modo, visibilidade, comunicado em edição).
 */

var PubState = (() => {
  'use strict';

  let editId    = null;   // id da publicação em edição
  let modoAtual = 'imediato';
  let visAtual  = 'todos';
  let comEditId = null;   // id do comunicado em edição

  function getEditId()      { return editId; }
  function setEditId(v)     { editId = v; }

  function getModo()        { return modoAtual; }
  function setModo(v)       { modoAtual = v; }

  function getVis()         { return visAtual; }
  function setVis(v)        { visAtual = v; }

  function getComEditId()   { return comEditId; }
  function setComEditId(v)  { comEditId = v; }

  return {
    getEditId, setEditId,
    getModo, setModo,
    getVis, setVis,
    getComEditId, setComEditId,
  };
})();
