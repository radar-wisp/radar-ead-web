/**
 * actions.js — Ações de acesso (Controle de Acessos).
 * Responsabilidade: persistência via Storage + log + refresh (salvar,
 * bloquear, ativar, revogar, renovar) e compatibilidade legada. Sem render.
 *
 * @module AcActions
 */

/* global Storage, AcUtils, AcState, AcessosMod */
/* exported AcActions */

var AcActions = (() => {
  'use strict';

  const _q     = AcUtils.q;
  const _toast = AcUtils.toast;

  // ── Salvar acesso (criar/editar) ────────────────────────────────
  function salvar() {
    const cursoId = document.getElementById('mac-curso')?.value;
    if (!cursoId) { alert('Selecione um curso.'); return; }

    const scope = AcState.scopeAtual;
    let tipo, refId;
    if (scope === 'global') {
      tipo  = 'setor';
      refId = '__global__';
    } else if (scope === 'colaborador') {
      tipo  = 'colaborador';
      refId = document.getElementById('mac-colab-sel')?.value;
      if (!refId) { alert('Selecione um colaborador.'); return; }
    } else if (scope === 'setor') {
      tipo  = 'setor';
      refId = document.getElementById('mac-setor-sel')?.value;
      if (!refId) { alert('Selecione um setor.'); return; }
    } else {
      tipo  = 'equipe';
      refId = document.getElementById('mac-equipe-sel')?.value;
      if (!refId) { alert('Selecione uma equipe.'); return; }
    }

    const ini    = document.getElementById('mac-inicio')?.value;
    const exp    = document.getElementById('mac-expira')?.value;
    const getTog = id => document.getElementById(id)?.classList.contains('on') ?? false;

    const dados = {
      cursoId,
      tipo,
      refId,
      dataInicio:    ini ? new Date(ini).toISOString() : null,
      dataExpira:    exp ? new Date(exp).toISOString() : null,
      prazo:         parseInt(document.getElementById('mac-prazo')?.value)       || 0,
      statusAcesso:  document.getElementById('mac-status')?.value                || 'ativo',
      responsavel:   document.getElementById('mac-responsavel')?.value?.trim()   || 'Admin',
      obrigatorio:   getTog('mac-obrig'),
      renovacaoAuto: getTog('mac-renovauto'),
    };

    Storage.Restricoes.adicionar(dados);
    Storage.LogAcessos.registrar({
      acao:        AcState.editCtx ? 'editou' : 'liberou',
      cursoId,
      tipo,
      refId,
      responsavel: dados.responsavel,
    });

    _toast(AcState.editCtx ? 'Acesso atualizado!' : 'Acesso liberado!', 's');
    document.getElementById('modal-acesso')?.classList.remove('open');
    AcState.editCtx = null;
    AcessosMod.refresh();
  }

  // ── Ações individuais ───────────────────────────────────────────
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

  /** Renova o acesso por 30 dias a partir de hoje. */
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

  // ── Compatibilidade com admin.js legado ─────────────────────────
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

  return { salvar, bloquear, ativar, revogar, renovar, addRestricao, remRestricao };
})();
