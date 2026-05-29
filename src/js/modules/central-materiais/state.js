/**
 * state.js — Estado interno compartilhado do módulo Central de Materiais.
 * Responsabilidade única: variáveis mutáveis acessadas por table, modals e actions.
 *
 * @module MatState
 */

/* exported MatState */

var MatState = (() => {
  'use strict';

  let _editId       = null;      // ID do material em edição (null = novo)
  let _uploadMode   = 'file';    // 'file' | 'link'
  let _fileAtual    = null;      // { nome, tamanho, tipo, url } selecionado
  let _selecionados = new Set();  // IDs marcados para ação em lote
  let _vincularId   = null;      // ID do material sendo vinculado a curso

  return {
    get editId()        { return _editId; },
    set editId(v)       { _editId = v; },
    get uploadMode()    { return _uploadMode; },
    set uploadMode(v)   { _uploadMode = v; },
    get fileAtual()     { return _fileAtual; },
    set fileAtual(v)    { _fileAtual = v; },
    get vincularId()    { return _vincularId; },
    set vincularId(v)   { _vincularId = v; },
    get selecionados()  { return _selecionados; },  // Set mutável (add/delete/clear/size)
  };
})();
