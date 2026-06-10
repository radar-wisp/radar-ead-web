/**
 * modals.js — Modal criar/editar aluno (stepper 3 etapas)
 * Responsabilidade: abrir, popular, navegar entre etapas e salvar.
 */

/* global EadUtils, Storage, AlunosState, AlunosValidators, AlunosMod */
/* exported AlunosModals */

var AlunosModals = (() => {
  'use strict';

  const _x     = EadUtils.escapeHtml;
  const _toast = EadUtils.toast;

  // ── Helpers de campo ─────────────────────────────────────────

  function _set(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  }

  function _get(id) {
    return document.getElementById(id)?.value?.trim() || '';
  }

  function _setToggle(id, on) {
    const el = document.getElementById(id);
    if (!el) return;
    const span = el.querySelector('span');
    el.classList.toggle('on', on);
    el.style.background = on ? 'var(--blue)' : 'var(--border2)';
    if (span) span.style.left = on ? '21px' : '3px';
  }

  function _gerarMatricula() {
    const ano  = new Date().getFullYear();
    const seq  = String(Storage.Alunos.listar().length + 1).padStart(3, '0');
    return `MAT${ano}${seq}`;
  }

  // ── Selects de cargo e cidade ─────────────────────────────────

  function popularCargos(selected) {
    const sel = document.getElementById('mal-cargo');
    if (!sel) return;
    const items = (() => { try { return JSON.parse(localStorage.getItem('ead_cfg_cargos')) || []; } catch { return []; } })();
    sel.innerHTML = '<option value="">— Selecione —</option>' +
      items.map(c => `<option value="${_x(c.nome)}" ${c.nome === selected ? 'selected' : ''}>${_x(c.nome)}</option>`).join('');
  }

  function popularCidades(selected) {
    const sel = document.getElementById('mal-unidade');
    if (!sel) return;
    const items = (() => { try { return JSON.parse(localStorage.getItem('ead_cfg_unidades')) || []; } catch { return []; } })();
    sel.innerHTML = '<option value="">— Selecione —</option>' +
      items.map(c => `<option value="${_x(c.nome)}" ${c.nome === selected ? 'selected' : ''}>${_x(c.nome)} ${c.estado ? '(' + _x(c.estado) + ')' : ''}</option>`).join('');
  }

  // ── Selects de setor/equipe ───────────────────────────────────

  function popularSetores(setorId, equipeId) {
    const sel = document.getElementById('mal-setor');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Selecione —</option>' +
      Storage.Setores.listar().map(s =>
        `<option value="${_x(s.id)}" ${s.id === setorId ? 'selected' : ''}>${_x(s.nome)}</option>`
      ).join('');
    loadEquipes(setorId, equipeId);
  }

  function loadEquipes(setorId, selectedEquipeId) {
    const sel = document.getElementById('mal-equipe');
    if (!sel) return;
    const sid = setorId || document.getElementById('mal-setor')?.value;
    sel.innerHTML = '<option value="">— Selecione —</option>' +
      Storage.Equipes.listar()
        .filter(e => !sid || e.setorId === sid)
        .map(e => `<option value="${_x(e.id)}" ${e.id === selectedEquipeId ? 'selected' : ''}>${_x(e.nome)}</option>`)
        .join('');
  }

  // ── Stepper ───────────────────────────────────────────────────

  function goStep(idx) {
    AlunosState.step = idx;

    document.querySelectorAll('#modal-aluno .mc-pane')
      .forEach((p, i) => p.classList.toggle('active', i === idx));

    [0, 1, 2].forEach(i => {
      const s = document.getElementById('mal-step-' + i);
      if (!s) return;
      s.classList.toggle('active', i === idx);
      s.classList.toggle('done',   i < idx);
    });

    document.querySelectorAll('.mal-step-line')
      .forEach((l, i) => l.classList.toggle('done', i < idx));

    const prev   = document.getElementById('mal-btn-prev');
    const next   = document.getElementById('mal-btn-next');
    const salvar = document.getElementById('mal-btn-salvar');
    if (prev)   prev.style.display   = idx > 0   ? '' : 'none';
    if (next)   next.style.display   = idx < 2   ? '' : 'none';
    if (salvar) salvar.style.display = idx === 2 ? '' : 'none';
  }

  function step(dir) {
    if (dir > 0) {
      AlunosValidators.clearErrors();
      if (!AlunosValidators.validateStep(AlunosState.step)) return;
    }
    const next = AlunosState.step + dir;
    if (next < 0 || next > 2) return;
    goStep(next);
  }

  // Alias mantido para compatibilidade com onclick no HTML
  function tabModal(idx) { goStep(idx); }

  // ── Abrir modal ───────────────────────────────────────────────

  function abrirModal() {
    AlunosState.editId = null;
    document.getElementById('mal-titulo').textContent = 'Novo Aluno';
    document.getElementById('mal-sub').textContent    = '';
    ['mal-nome', 'mal-email', 'mal-senha']
      .forEach(id => _set(id, ''));
    _set('mal-matricula', _gerarMatricula());
    _set('mal-status', 'ativo');
    _setToggle('mal-primeiro', true);
    popularCargos();
    popularCidades();
    popularSetores();
    AlunosValidators.clearErrors();
    goStep(0);
    document.getElementById('modal-aluno')?.classList.add('open');
  }

  function abrirEdit(id) {
    const al = Storage.Alunos.obter(id);
    if (!al) return;
    AlunosState.editId = id;
    const tEl = document.getElementById('mal-titulo');
    const sEl = document.getElementById('mal-sub');
    if (tEl) tEl.textContent = 'Editar Aluno';
    if (sEl) sEl.textContent = al.nome || '';
    _set('mal-nome',       al.nome);
    _set('mal-email',      al.email);
    _set('mal-matricula',  al.matricula);
    _set('mal-senha',      al.senha);
    _set('mal-status',     al.statusAcesso || (al.ativo ? 'ativo' : 'bloqueado'));
    _setToggle('mal-primeiro', !!al.primeiroAcesso);
    popularCargos(al.cargo);
    popularCidades(al.unidade);
    popularSetores(al.setorId, al.equipeId);
    AlunosValidators.clearErrors();
    goStep(0);
    document.getElementById('modal-aluno')?.classList.add('open');
  }

  // ── Salvar ────────────────────────────────────────────────────

  function salvar() {
    AlunosValidators.clearErrors();
    const editando = !!AlunosState.editId;
    if (editando) {
      if (!AlunosValidators.validateEdit()) { goStep(0); return; }
    } else if (!AlunosValidators.validateAll()) {
      // Leva o usuário ao primeiro passo com erro (não falha em silêncio).
      const falha = [0, 1, 2].find(i => !AlunosValidators.validateStep(i));
      if (falha != null) goStep(falha);
      return;
    }

    const toggle     = document.getElementById('mal-primeiro');
    const primeiroAcesso = toggle?.classList.contains('on') ?? true;
    const statusAcesso   = _get('mal-status') || 'ativo';

    const dados = {
      nome:          _get('mal-nome'),
      email:         _get('mal-email'),
      matricula:     _get('mal-matricula'),
      cargo:         _get('mal-cargo'),
      unidade:       _get('mal-unidade'),
      senha:         _get('mal-senha'),
      setorId:       document.getElementById('mal-setor')?.value  || null,
      equipeId:      document.getElementById('mal-equipe')?.value || null,
      statusAcesso,
      ativo:         statusAcesso === 'ativo',
      primeiroAcesso,
    };

    if (AlunosState.editId) {
      Storage.Alunos.atualizar(AlunosState.editId, dados);
      _toast('Aluno atualizado!', 's');
    } else {
      const novo = Storage.Alunos.criar(dados);
      if (!novo) { _toast('E-mail já cadastrado!', 'e'); return; }
      _toast('Aluno cadastrado!', 's');
    }

    document.getElementById('modal-aluno')?.classList.remove('open');
    AlunosState.editId = null;
    if (typeof AlunosMod !== 'undefined') AlunosMod.refresh();
  }

  return {
    abrirModal, abrirEdit, salvar,
    step, tabModal, goStep,
    loadEquipes,
  };
})();
