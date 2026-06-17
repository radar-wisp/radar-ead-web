/**
 * configuracoes/actions.js — CRUD, estado do form e seed
 * Dependências: CfgConstants, CfgRender
 */

/* global CfgConstants, CfgRender */
/* exported CfgActions */
var CfgActions = (() => {
  'use strict';

  const { KEYS, TABS, SEED } = CfgConstants;

  /* ── Storage helpers ───────────────────────────────────────────── */
  const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  const now  = () => new Date().toISOString();
  const get  = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
  const save = (k,v) => localStorage.setItem(k, JSON.stringify(v));

  /* ── Seed ──────────────────────────────────────────────────────── */
  function seedDefaults() {
    Object.entries(SEED).forEach(([key, items]) => {
      if (!get(key).length) {
        save(key, items.map(d => ({ id:uid(), ...d, criadoEm:now() })));
      }
    });
  }

  /* ── Tab switch ────────────────────────────────────────────────── */
  function switchTab(idx) {
    document.querySelectorAll('.cfg-tab-btn').forEach((btn, i) => {
      const on = i === idx;
      btn.style.color            = on ? 'var(--blue)' : 'var(--text3)';
      btn.style.borderBottomColor = on ? 'var(--blue)' : 'transparent';
    });
    TABS.forEach((_, i) => {
      const p = document.getElementById(`cfg-pane-${i}`);
      if (p) p.style.display = i === idx ? 'block' : 'none';
    });
    renderList(idx);
  }

  /* ── Icon select ───────────────────────────────────────────────── */
  function selectIcon(idx, value) {
    document.getElementById(`cfg-icone-${idx}`).value = value;
    document.querySelectorAll(`#cfg-icon-picker-${idx} button`).forEach(btn => {
      const on = btn.getAttribute('data-icon-val') === value;
      btn.style.borderColor = on ? 'var(--blue)' : 'var(--border)';
      btn.style.background  = on ? 'var(--blue-light)' : 'var(--bg)';
    });
  }

  /* ── Render list ───────────────────────────────────────────────── */
  function renderList(idx) {
    const tab    = TABS[idx];
    const busca  = (document.getElementById(`cfg-busca-${idx}`)?.value || '').toLowerCase().trim();
    const isUnidade = tab.key === KEYS.UNIDADE;
    let items = get(tab.key);
    if (busca) {
      items = items.filter(it =>
        it.nome?.toLowerCase().includes(busca) ||
        (isUnidade ? it.estado?.toLowerCase().includes(busca) : it.descricao?.toLowerCase().includes(busca))
      );
    }
    CfgRender.list(idx, items);
  }

  /* ── Form: open ────────────────────────────────────────────────── */
  function openForm(idx) {
    const tab  = TABS[idx];
    const form = document.getElementById(`cfg-form-${idx}`);
    if (!form) return;
    form.removeAttribute('data-edit-id');
    const title = document.getElementById(`cfg-form-title-${idx}`);
    if (title) title.textContent = `Novo ${tab.singular}`;
    const nome = document.getElementById(`cfg-nome-${idx}`);
    const desc = document.getElementById(`cfg-desc-${idx}`);
    if (nome) nome.value = '';
    if (desc) desc.value = '';
    if (tab.hasIcon) selectIcon(idx, 'video');
    form.style.display = 'block';
    nome?.focus();
  }

  /* ── Form: cancel ──────────────────────────────────────────────── */
  function cancelForm(idx) {
    const form = document.getElementById(`cfg-form-${idx}`);
    if (form) { form.style.display = 'none'; form.removeAttribute('data-edit-id'); }
  }

  /* ── Form: save ────────────────────────────────────────────────── */
  function saveItem(idx) {
    const tab    = TABS[idx];
    const nome   = document.getElementById(`cfg-nome-${idx}`)?.value.trim();
    const desc   = document.getElementById(`cfg-desc-${idx}`)?.value.trim();
    const icone  = document.getElementById(`cfg-icone-${idx}`)?.value || 'video';
    const form   = document.getElementById(`cfg-form-${idx}`);
    const editId = form?.getAttribute('data-edit-id');

    if (!nome) { _toast('O campo "Nome" é obrigatório.', 'e'); return; }

    const isUnidade = tab.key === KEYS.UNIDADE;
    const isFmt    = !!tab.hasIcon;
    const items    = get(tab.key);

    if (editId) {
      const i = items.findIndex(it => it.id === editId);
      if (i > -1) {
        items[i] = {
          ...items[i], nome,
          ...(isUnidade ? { estado:desc } : { descricao:desc }),
          ...(isFmt ? { icone } : {}),
          atualizadoEm: now(),
        };
      }
      _toast('Atualizado com sucesso!', 's');
    } else {
      items.push({
        id: uid(), nome,
        ...(isUnidade ? { estado:desc } : { descricao:desc }),
        ...(isFmt ? { icone } : {}),
        criadoEm: now(),
      });
      _toast('Cadastrado com sucesso!', 's');
    }

    save(tab.key, items);
    cancelForm(idx);
    renderList(idx);
  }

  /* ── Edit: open pre-filled ─────────────────────────────────────── */
  function editItem(idx, id) {
    const tab  = TABS[idx];
    const item = get(tab.key).find(it => it.id === id);
    if (!item) return;

    const isUnidade = tab.key === KEYS.UNIDADE;
    const form  = document.getElementById(`cfg-form-${idx}`);
    const title = document.getElementById(`cfg-form-title-${idx}`);
    if (!form) return;

    form.setAttribute('data-edit-id', id);
    if (title) title.textContent = `Editar ${tab.singular}`;

    const nome = document.getElementById(`cfg-nome-${idx}`);
    const desc = document.getElementById(`cfg-desc-${idx}`);
    if (nome) nome.value = item.nome || '';
    if (desc) desc.value = isUnidade ? (item.estado || '') : (item.descricao || '');
    if (tab.hasIcon) selectIcon(idx, item.icone || 'video');

    form.style.display = 'block';
    nome?.focus();
    form.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  /* ── Delete ────────────────────────────────────────────────────── */
  function deleteItem(idx, id) {
    if (!confirm('Excluir este item permanentemente?')) return;
    const tab   = TABS[idx];
    const items = get(tab.key).filter(it => it.id !== id);
    save(tab.key, items);
    _toast('Item excluído.', 'i');
    renderList(idx);
  }

  /* ── Toast ─────────────────────────────────────────────────────── */
  function _toast(msg, tipo='i') {
    const s = document.getElementById('toasts');
    if (!s) return;
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.innerHTML = `<span>${{s:'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',e:'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',i:'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'}[tipo]||'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'}</span><span>${msg}</span>`;
    s.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  return {
    seedDefaults, switchTab, selectIcon,
    renderList, openForm, cancelForm,
    saveItem, editItem, deleteItem,
    getItems: k => get(k),
  };
})();
