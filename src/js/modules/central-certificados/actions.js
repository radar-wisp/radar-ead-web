/**
 * actions.js — Ações individuais sobre certificados (Certificados).
 * Responsabilidade: ciclo de vida por item (reemitir, cancelar, excluir)
 * e emissão rápida a partir do painel de pendentes. Sem renderização.
 *
 * @module CertActions
 */

/* global Storage, CertUtils, CertMod */

var CertActions = (() => {
  'use strict';

  const _toast = CertUtils.toast;

  function reemitir(id) {
    const c = Storage.Certificados.reemitir(id);
    if (c) { _toast('Certificado reemitido com novo código!', 's'); CertMod.refresh(); }
  }

  function cancelar(id) {
    if (!confirm('Cancelar este certificado?')) return;
    Storage.Certificados.cancelar(id);
    _toast('Certificado cancelado.', 'i');
    CertMod.refresh();
  }

  function excluir(id) {
    if (!confirm('Excluir permanentemente?')) return;
    Storage.Certificados.excluir(id);
    _toast('Excluído.', 'i');
    CertMod.refresh();
  }

  function _emitirRapido(alunoId, cursoId) {
    const cur = Storage.Cursos.obter(cursoId);
    Storage.Certificados.emitir({
      alunoId,
      cursoId,
      cargaHoraria:  cur?.carga || 0,
      dataConclucao: new Date().toISOString(),
    });
    _toast('Certificado emitido!', 's');
    CertMod.refresh();
  }

  return { reemitir, cancelar, excluir, _emitirRapido };
})();
