/**
 * modals.js — Modais auxiliares: Novo/Editar Setor · Nova/Editar Equipe
 * Responsabilidade: abrir, popular e fechar modais de CRUD.
 * Os elementos #modal-se-setor e #modal-se-equipe vivem no admin.html.
 */

/* global EadUtils, Storage, SetoresEquipesMod */

var SetoresModals = (() => {
  'use strict';

  const _x    = EadUtils.escapeHtml;
  const _toast = EadUtils.toast;

  // ── Helpers ──────────────────────────────────────────────────

  function _open(id)  { document.getElementById(id)?.classList.add('open'); }
  function _close(id) { document.getElementById(id)?.classList.remove('open'); }
  function _val(id)   { return document.getElementById(id)?.value?.trim() || ''; }
  function _set(id, v){ const el = document.getElementById(id); if (el) el.value = v ?? ''; }

  // ── SETOR ─────────────────────────────────────────────────────

  let _editSetorId = null;

  function abrirNovoSetor() {
    _editSetorId = null;
    document.getElementById('mse-titulo').textContent = 'Novo Setor';
    _set('mse-nome', '');
    _set('mse-cor', '#0002da');
    _syncCorLabel();
    _open('modal-se-setor');
    setTimeout(() => document.getElementById('mse-nome')?.focus(), 50);
  }

  function abrirEditarSetor(id) {
    const s = Storage.Setores.obter(id);
    if (!s) return;
    _editSetorId = id;
    document.getElementById('mse-titulo').textContent = 'Editar Setor';
    _set('mse-nome', s.nome);
    _set('mse-cor', s.cor || '#0002da');
    _syncCorLabel();
    _open('modal-se-setor');
    setTimeout(() => document.getElementById('mse-nome')?.focus(), 50);
  }

  function salvarSetor() {
    const nome = _val('mse-nome');
    const cor  = _val('mse-cor') || '#0002da';
    if (!nome) { alert('Informe o nome do setor.'); return; }

    if (_editSetorId) {
      Storage.Setores.atualizar(_editSetorId, { nome, cor });
      _toast('Setor atualizado!', 's');
    } else {
      Storage.Setores.criar({ nome, cor });
      _toast('Setor criado!', 's');
    }

    _close('modal-se-setor');
    _editSetorId = null;
    SetoresEquipesMod.refresh();
  }

  function _syncCorLabel() {
    const cor = document.getElementById('mse-cor');
    const lbl = document.getElementById('mse-cor-lbl');
    if (cor && lbl) {
      lbl.textContent = cor.value;
      cor.oninput = () => { lbl.textContent = cor.value; };
    }
  }

  // ── EQUIPE ────────────────────────────────────────────────────

  let _editEquipeId = null;

  function abrirNovaEquipe(setorIdPresel) {
    _editEquipeId = null;
    document.getElementById('meq-titulo').textContent = 'Nova Equipe';
    _set('meq-nome', '');
    _popularSetoresSelect('meq-setor', setorIdPresel);
    _open('modal-se-equipe');
    setTimeout(() => document.getElementById('meq-nome')?.focus(), 50);
  }

  function abrirEditarEquipe(id) {
    const e = Storage.Equipes.obter(id);
    if (!e) return;
    _editEquipeId = id;
    document.getElementById('meq-titulo').textContent = 'Editar Equipe';
    _set('meq-nome', e.nome);
    _popularSetoresSelect('meq-setor', e.setorId);
    _open('modal-se-equipe');
    setTimeout(() => document.getElementById('meq-nome')?.focus(), 50);
  }

  function salvarEquipe() {
    const nome    = _val('meq-nome');
    const setorId = _val('meq-setor');
    if (!nome)    { alert('Informe o nome da equipe.'); return; }
    if (!setorId) { alert('Selecione um setor.'); return; }

    if (_editEquipeId) {
      Storage.Equipes.atualizar(_editEquipeId, { nome, setorId });
      _toast('Equipe atualizada!', 's');
    } else {
      Storage.Equipes.criar({ nome, setorId });
      _toast('Equipe criada!', 's');
    }

    _close('modal-se-equipe');
    _editEquipeId = null;
    SetoresEquipesMod.refresh();
  }

  function _popularSetoresSelect(selId, selectedId) {
    const sel = document.getElementById(selId);
    if (!sel) return;
    sel.innerHTML =
      '<option value="">— Selecione um setor —</option>' +
      Storage.Setores.listar().map(s =>
        `<option value="${_x(s.id)}">${_x(s.nome)}</option>`
      ).join('');
    // Forçar valor após innerHTML para garantir pré-seleção em todos os browsers
    if (selectedId) sel.value = selectedId;
  }

  // ── Fechar modais ─────────────────────────────────────────────

  function fecharSetor()  { _close('modal-se-setor');  _editSetorId  = null; }
  function fecharEquipe() { _close('modal-se-equipe'); _editEquipeId = null; }

  return {
    abrirNovoSetor,
    abrirEditarSetor,
    salvarSetor,
    fecharSetor,
    abrirNovaEquipe,
    abrirEditarEquipe,
    salvarEquipe,
    fecharEquipe,
  };
})();
