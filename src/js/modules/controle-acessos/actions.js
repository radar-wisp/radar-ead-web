/**
 * actions.js — Ações sobre acessos/restrições (AcActions).
 * Responsabilidade: bloquear, ativar, revogar, renovar e a camada de
 * compatibilidade legada (addRestricao/remRestricao) consumida por
 * admin.js. Persiste via Storage, registra log e dispara AcessosMod.refresh().
 *
 * @module AcActions
 */

/* global Storage, AcUtils, AcessosMod */

var AcActions = (() => {
  'use strict';

  const _q     = AcUtils.q;
  const _toast = AcUtils.toast;

  function bloquear(cursoId, tipo, refId) {
    Storage.Restricoes.atualizar(cursoId, tipo, refId, { statusAcesso: 'bloqueado' });
    Storage.LogAcessos.registrar({ acao: 'bloqueou', cursoId, tipo, refId, responsavel: 'Admin' });
    _toast('Acesso bloqueado.', 'i');
    AcessosMod.refresh();
  }

  function ativar(cursoId, tipo, refId) {
    Storage.Restricoes.atualizar(cursoId, tipo, refId, { statusAcesso: 'ativo' });
    Storage.LogAcessos.registrar({ acao: 'ativou', cursoId, tipo, refId, responsavel: 'Admin' });
    _toast('Acesso ativado!', 's');
    AcessosMod.refresh();
  }

  function revogar(cursoId, tipo, refId) {
    if (!confirm('Revogar este acesso permanentemente?')) return;
    Storage.Restricoes.remover(cursoId, tipo, refId);
    Storage.LogAcessos.registrar({ acao: 'revogou', cursoId, tipo, refId, responsavel: 'Admin' });
    _toast('Acesso revogado.', 'i');
    AcessosMod.refresh();
  }

  /**
   * Renova o acesso por 30 dias a partir de hoje.
   * @param {string} cursoId
   * @param {string} tipo
   * @param {string} refId
   */
  function renovar(cursoId, tipo, refId) {
    const nova = new Date();
    nova.setDate(nova.getDate() + 30);
    Storage.Restricoes.atualizar(cursoId, tipo, refId, {
      dataExpira:   nova.toISOString(),
      statusAcesso: 'ativo',
    });
    Storage.LogAcessos.registrar({ acao: 'renovou', cursoId, tipo, refId, responsavel: 'Admin' });
    _toast('Acesso renovado por 30 dias!', 's');
    AcessosMod.refresh();
  }

  // ── Compatibilidade com admin.js legado ───────────────────────

  function addRestricao(cId) {
    const tipo  = _q('#ac-tipo')?.value;
    const refId = _q('#ac-ref')?.value;
    if (!refId) { _toast('Selecione um item', 'e'); return; }
    Storage.Restricoes.adicionar({ cursoId: cId, tipo, refId });
    Storage.LogAcessos.registrar({ acao: 'liberou', cursoId: cId, tipo, refId });
    _toast('Restrição adicionada!', 's');
    AcessosMod.refresh();
  }

  function remRestricao(cId, tipo, refId) {
    Storage.Restricoes.remover(cId, tipo, refId);
    Storage.LogAcessos.registrar({ acao: 'revogou', cursoId: cId, tipo, refId });
    AcessosMod.refresh();
  }

  return {
    bloquear, ativar, revogar, renovar, addRestricao, remRestricao,
  };
})();
