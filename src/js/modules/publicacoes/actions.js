/**
 * actions.js — Ações CRUD de publicações/comunicados e compatibilidade legada
 * Responsabilidade única: operações que mutam o Storage (publicar, arquivar,
 * excluir, salvar) e integrações de compatibilidade com o admin.js legado.
 */

/* global Storage, PubUtils, PubState, PubMod */

var PubActions = (() => {
  'use strict';

  const _toast = PubUtils.toast;

  /* ── Ações individuais ──────────────────────────────────────── */
  function publicar(id)    { Storage.Publicacoes.publicar(id);    _toast('Publicado!', 's');     PubMod.refresh(); }
  function despublicar(id) { Storage.Publicacoes.despublicar(id); _toast('Despublicado.', 'i');  PubMod.refresh(); }
  function arquivar(id)    { Storage.Publicacoes.arquivar(id);    _toast('Arquivado.', 'i');     PubMod.refresh(); }
  function excluir(id) {
    if (!confirm('Excluir publicação?')) return;
    Storage.Publicacoes.excluir(id); _toast('Excluído.', 'i'); PubMod.refresh();
  }

  /* ── Salvar publicação ──────────────────────────────────────── */
  function salvar() {
    const tipo  = document.getElementById('mpub-tipo')?.value;
    const refId = document.getElementById('mpub-ref')?.value;
    if (!tipo)  { alert('Selecione o tipo de conteúdo.'); return; }
    if (!refId) { alert('Selecione o conteúdo.'); return; }

    const tituloCustom = document.getElementById('mpub-titulo-custom')?.value.trim();
    const titulo = tituloCustom || PubUtils.getTituloRef(tipo, refId) || refId;
    const dataIni = document.getElementById('mpub-data-ini')?.value;
    const dataExp = document.getElementById('mpub-data-exp')?.value;
    const visRefId = document.getElementById('mpub-vis-ref')?.value || '';
    const getTog  = id => document.getElementById(id)?.classList.contains('on') ?? false;

    const modoAtual = PubState.getModo();
    const visAtual  = PubState.getVis();

    let status = 'rascunho';
    if (modoAtual === 'imediato') status = 'publicado';
    if (modoAtual === 'agendado') status = 'agendado';

    const dados = {
      tipo, refId, titulo,
      cursoId:   document.getElementById('mpub-curso-rel')?.value || '',
      turmaId:   document.getElementById('mpub-turma-rel')?.value || '',
      status,
      dataPublicacao:  modoAtual === 'imediato' ? new Date().toISOString() : null,
      dataAgendada:    modoAtual === 'agendado' && dataIni ? new Date(dataIni).toISOString() : null,
      dataExpiracao:   dataExp ? new Date(dataExp).toISOString() : null,
      visibilidade:    visAtual,
      visRefId,
      responsavel:     document.getElementById('mpub-resp')?.value.trim() || 'Admin',
      liberarAuto:     getTog('mpubcfg-auto'),
      ocultarAposPrazo: getTog('mpubcfg-ocultar'),
      bloquearAposVencimento: getTog('mpubcfg-bloquear'),
      notificarUsuarios: getTog('mpubcfg-notif'),
    };

    const editId = PubState.getEditId();
    if (editId) { Storage.Publicacoes.atualizar(editId, dados); _toast('Publicação atualizada!', 's'); }
    else        { Storage.Publicacoes.criar(dados);             _toast('Publicação criada!', 's'); }
    document.getElementById('modal-publicacao').classList.remove('open');
    PubState.setEditId(null); PubMod.refresh();
  }

  /* ── Salvar comunicado ──────────────────────────────────────── */
  function salvarComunicado() {
    const titulo = document.getElementById('mcom-tit')?.value.trim();
    const msg    = document.getElementById('mcom-msg')?.value.trim();
    if (!titulo || !msg) { alert('Preencha título e mensagem.'); return; }
    const dados = {
      titulo, mensagem: msg,
      prioridade:     document.getElementById('mcom-prio')?.value || 'normal',
      responsavel:    document.getElementById('mcom-resp')?.value.trim() || 'Admin',
      dataExpiracao:  document.getElementById('mcom-exp')?.value ? new Date(document.getElementById('mcom-exp').value).toISOString() : null,
      status: 'publicado', dataPublicacao: new Date().toISOString(),
    };
    const comEditId = PubState.getComEditId();
    if (comEditId) { Storage.Comunicados.atualizar(comEditId, dados); _toast('Comunicado atualizado!', 's'); }
    else           { Storage.Comunicados.criar(dados); _toast('Comunicado publicado!', 's'); }
    document.getElementById('modal-comunicado').classList.remove('open');
    PubState.setComEditId(null);
    // Cria entrada de publicação para o comunicado
    if (!PubState.getComEditId()) {
      const c = Storage.Comunicados.listar().at(-1);
      if (c) Storage.Publicacoes.criar({ tipo: 'comunicado', refId: c.id, titulo: c.titulo, status: 'publicado', dataPublicacao: now() });
    }
    PubMod.refresh();
  }

  /* ── Compatibilidade com admin.js legado ────────────────────── */
  function publicar_legado(id)  { Storage.Cursos.publicar(id); PubMod.refresh(); }
  function arquivar_legado(id)  { Storage.Cursos.arquivar(id); PubMod.refresh(); }
  function openValidade_legado(cId) { const c = Storage.Cursos.obter(cId), v = prompt('Data (AAAA-MM-DD):', c?.validadeAte ? c.validadeAte.split('T')[0] : ''); if (v === null) return; Storage.Cursos.atualizar(cId, { validadeAte: v ? new Date(v).toISOString() : null }); PubMod.refresh(); }

  return {
    publicar, despublicar, arquivar, excluir,
    salvar, salvarComunicado,
    publicar_legado, arquivar_legado, openValidade_legado,
  };
})();
