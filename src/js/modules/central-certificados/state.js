/**
 * state.js — Estado interno compartilhado do módulo Central de Certificados.
 * Responsabilidade única: variáveis mutáveis acessadas por modals/actions.
 *
 * @module CertState
 */

/* exported CertState */

var CertState = (() => {
  'use strict';

  let _editId = null;  // ID do modelo em edição (null = novo)

  return {
    get editId()  { return _editId; },
    set editId(v) { _editId = v; },
  };
})();
