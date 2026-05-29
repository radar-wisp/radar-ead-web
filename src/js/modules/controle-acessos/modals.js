/**
 * modals.js — Modal de liberação/edição, selects, seletor de escopo e tabs
 * do módulo Controle de Acessos.
 * Responsabilidade: UI do modal e preenchimento de campos (sem persistência).
 *
 * @module AcModals
 */

/* global Storage, AcUtils, AcState */
/* exported AcModals */

var AcModals = (() => {
  'use strict';

  const _x         = AcUtils.x;
  const _setVal    = AcUtils.setVal;
  const _setToggle = AcUtils.setToggle;
  const _nomeAlvo  = AcUtils.nomeAlvo;
  const TIPO_LABEL = AcUtils.TIPO_LABEL;

  // ── Abertura do modal ───────────────────────────────────────────
  function abrirModal() {
    AcState.editCtx = null;

    const tituloEl = document.getElementById('mac-titulo');
    const subEl    = document.getElementById('mac-sub');
    if (tituloEl) tituloEl.textContent = 'Liberar Acesso';
    if (subEl)    subEl.textContent    = '';

    _resetModal();
    tabModal(0, document.querySelector('#modal-acesso .mc-tab'));
    document.getElementById('modal-acesso')?.classList.add('open');
  }

  function abrirEdit(cursoId, tipo, refId) {
    const r = Storage.Restricoes.listar()
      .find(r => r.cursoId === cursoId && r.tipo === tipo && r.refId === refId);
    if (!r) return;

    AcState.editCtx = { cursoId, tipo, refId };

    const tituloEl = document.getElementById('mac-titulo');
    const subEl    = document.getElementById('mac-sub');
    if (tituloEl) tituloEl.textContent = 'Editar Acesso';
    if (subEl)    subEl.textContent    = `${TIPO_LABEL[tipo]} · ${_nomeAlvo(tipo, refId)}`;

    _resetModal();
    _popularCursoModal(cursoId);
    _popularTurmaModal(r.turmaId);

    // Ativa o escopo correto
    const scopeKey = tipo === 'colaborador' ? 'colaborador'
      : tipo === 'setor' ? 'setor'
      : tipo === 'equipe' ? 'equipe'
      : 'global';
    const scopeBtn = document.querySelector(`.mac-scope-btn[data-scope="${scopeKey}"]`);
    if (scopeBtn) setScope(scopeBtn);

    // Pré-seleciona o alvo após o DOM atualizar
    setTimeout(() => {
      const selId = `mac-${tipo === 'colaborador' ? 'colab' : tipo}-sel`;
      const sel   = document.getElementById(selId);
      if (sel) sel.value = refId;
    }, 50);

    // Preenche campos de período e configuração
    _setVal('mac-inicio',      r.dataInicio ? r.dataInicio.slice(0, 10) : '');
    _setVal('mac-expira',      r.dataExpira  ? r.dataExpira.slice(0, 10)  : '');
    _setVal('mac-prazo',       r.prazo       || 0);
    _setVal('mac-status',      r.statusAcesso || 'ativo');
    _setVal('mac-responsavel', r.responsavel  || 'Admin');

    _setToggle('mac-obrig',     r.obrigatorio);
    _setToggle('mac-renovauto', r.renovacaoAuto);

    tabModal(0, document.querySelector('#modal-acesso .mc-tab'));
    document.getElementById('modal-acesso')?.classList.add('open');
  }

  /** Reseta todos os campos do modal para o estado inicial. */
  function _resetModal() {
    AcState.scopeAtual = 'global';

    ['mac-colab-sel', 'mac-setor-sel', 'mac-equipe-sel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    _setVal('mac-inicio',      '');
    _setVal('mac-expira',      '');
    _setVal('mac-prazo',       0);
    _setVal('mac-status',      'ativo');
    _setVal('mac-responsavel', 'Admin');

    _popularCursoModal();
    _popularTurmaModal();
    _popularScopeSels();
    _renderToggleRegras({});

    // Reseta botões de escopo visualmente
    document.querySelectorAll('.mac-scope-btn').forEach(b => {
      b.style.background = 'var(--surface)';
      b.style.color      = 'var(--text3)';
    });
    const globalBtn = document.querySelector('.mac-scope-btn[data-scope="global"]');
    if (globalBtn) {
      globalBtn.style.background = 'var(--blue)';
      globalBtn.style.color      = '#fff';
    }

    // Mostra apenas o painel global
    ['mac-scope-global', 'mac-scope-colaborador', 'mac-scope-setor', 'mac-scope-equipe'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = id === 'mac-scope-global' ? 'block' : 'none';
    });
  }

  // ── Selects do modal ────────────────────────────────────────────
  function _popularCursoModal(selectedId) {
    const sel = document.getElementById('mac-curso');
    if (!sel) return;
    sel.innerHTML =
      '<option value="">Selecione um curso...</option>' +
      Storage.Cursos.listar().map(c =>
        `<option value="${_x(c.id)}" ${c.id === selectedId ? 'selected' : ''}>${_x(c.titulo)}</option>`
      ).join('');
  }

  function _popularTurmaModal(selectedId) {
    const sel = document.getElementById('mac-turma');
    if (!sel) return;
    sel.innerHTML =
      '<option value="">Todas as turmas</option>' +
      Storage.Turmas.listar().map(t =>
        `<option value="${_x(t.id)}" ${t.id === selectedId ? 'selected' : ''}>${_x(t.nome)}</option>`
      ).join('');
  }

  /** Popula todos os selects de escopo (colaborador, setor, equipe). */
  function _popularScopeSels() {
    // Colaboradores
    const sC = document.getElementById('mac-colab-sel');
    if (sC) {
      sC.innerHTML =
        '<option value="">Selecione...</option>' +
        Storage.Alunos.listar().filter(a => a.ativo).map(a =>
          `<option value="${_x(a.id)}">${_x(a.nome)} — ${_x(a.email)}</option>`
        ).join('');
    }

    // Setores
    const sSe = document.getElementById('mac-setor-sel');
    if (sSe) {
      sSe.innerHTML =
        '<option value="">Selecione...</option>' +
        Storage.Setores.listar().map(s =>
          `<option value="${_x(s.id)}">${_x(s.nome)}</option>`
        ).join('');
    }

    // Equipes
    const sEq = document.getElementById('mac-equipe-sel');
    if (sEq) {
      sEq.innerHTML =
        '<option value="">Selecione...</option>' +
        Storage.Equipes.listar().map(e =>
          `<option value="${_x(e.id)}">${_x(e.nome)}</option>`
        ).join('');
    }
  }

  /** Renderiza os toggles de regras de acesso no modal. */
  function _renderToggleRegras(r) {
    const wrap = document.getElementById('mac-regras-body');
    if (!wrap) return;

    const row = (id, lbl, desc, val) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px">${lbl}</div>
          <div style="font-size:11px;color:var(--text4)">${desc}</div>
        </div>
        <div id="${id}" class="toggle ${val ? 'on' : ''}"
          onclick="this.classList.toggle('on');this.querySelector('span').style.left=this.classList.contains('on')?'21px':'3px';this.style.background=this.classList.contains('on')?'var(--blue)':'var(--border2)'"
          style="position:relative;width:40px;height:22px;background:${val ? 'var(--blue)' : 'var(--border2)'};border-radius:11px;cursor:pointer;transition:background .2s;flex-shrink:0">
          <span style="position:absolute;top:3px;left:${val ? 21 : 3}px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></span>
        </div>
      </div>`;

    wrap.innerHTML =
      row('mac-obrig',     'Acesso obrigatório',  'O aluno deve acessar antes de avançar', r.obrigatorio) +
      row('mac-renovauto', 'Renovação automática', 'Renova automaticamente ao expirar',     r.renovacaoAuto);
  }

  // ── Seletor de escopo ───────────────────────────────────────────
  function setScope(btn) {
    AcState.scopeAtual = btn.dataset.scope;

    document.querySelectorAll('.mac-scope-btn').forEach(b => {
      b.style.background = 'var(--surface)';
      b.style.color      = 'var(--text3)';
    });
    btn.style.background = 'var(--blue)';
    btn.style.color      = '#fff';

    ['global', 'colaborador', 'setor', 'equipe'].forEach(sc => {
      const el = document.getElementById(`mac-scope-${sc}`);
      if (el) el.style.display = sc === AcState.scopeAtual ? 'block' : 'none';
    });
  }

  // ── Tabs do modal ───────────────────────────────────────────────
  function tabModal(idx, btn) {
    document.querySelectorAll('#modal-acesso .mc-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
    document.querySelectorAll('#modal-acesso .mc-pane').forEach((p, i) => p.classList.toggle('active', i === idx));
  }

  return { abrirModal, abrirEdit, setScope, tabModal };
})();
