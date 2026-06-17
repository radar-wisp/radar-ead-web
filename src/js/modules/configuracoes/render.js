/**
 * configuracoes/render.js — Renderização HTML
 * Dependências: CfgConstants
 */

/* global CfgConstants */
/* exported CfgRender */
var CfgRender = (() => {
  'use strict';

  const { TABS, FORMAT_ICONS, KEYS } = CfgConstants;

  const x = s => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';
  const getIcon = v => FORMAT_ICONS.find(i => i.value === v) || FORMAT_ICONS[0];

  /* ── Page ──────────────────────────────────────────────────────── */
  function page(activeTab) {
    const pg = document.getElementById('pg-configuracoes');
    if (!pg) return;
    pg.innerHTML = `
      <div class="ph">
        <div>
          <h2>Configurações</h2>
          <p>Gerencie as opções e tabelas de referência do sistema</p>
        </div>
      </div>
      <div class="cfg-tabs" style="display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:18px;overflow-x:auto">
        ${TABS.map((t,i) => `
          <button class="cfg-tab-btn ${i===activeTab?'cfg-tab-active':''}" data-tab="${i}"
            onclick="ConfigMod.switchTab(${i})"
            style="padding:10px 16px;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;font-family:var(--font);color:${i===activeTab?'var(--blue)':'var(--text3)'};border-bottom:2px solid ${i===activeTab?'var(--blue)':'transparent'};margin-bottom:-1px;white-space:nowrap;transition:color .12s,border-color .12s"
          >${x(t.label)}</button>
        `).join('')}
      </div>
      ${TABS.map((t,i) => `
        <div id="cfg-pane-${i}" style="display:${i===activeTab?'block':'none'}">
          ${pane(t, i)}
        </div>
      `).join('')}
    `;
  }

  /* ── Icon picker ───────────────────────────────────────────────── */
  function iconPicker(idx, selectedValue) {
    return `
      <div class="fg" style="grid-column:1/-1">
        <label>Ícone do Formato</label>
        <div id="cfg-icon-picker-${idx}" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
          ${FORMAT_ICONS.map(ic => `
            <button type="button" title="${x(ic.label)}"
              onclick="ConfigMod.selectIcon(${idx},'${ic.value}')"
              data-icon-val="${ic.value}"
              style="display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 10px;border-radius:var(--radius);border:2px solid ${ic.value===selectedValue?'var(--blue)':'var(--border)'};background:${ic.value===selectedValue?'var(--blue-light)':'var(--bg)'};cursor:pointer;font-size:10px;color:var(--text3);transition:border-color .12s,background .12s;min-width:56px"
            >${ic.svg}<span>${x(ic.label)}</span></button>
          `).join('')}
        </div>
        <input type="hidden" id="cfg-icone-${idx}" value="${x(selectedValue||'video')}">
      </div>
    `;
  }

  /* ── Pane ──────────────────────────────────────────────────────── */
  function pane(tab, idx) {
    const isUnidade = tab.key === KEYS.UNIDADE;
    const isFmt     = !!tab.hasIcon;
    const col2      = isUnidade ? 'Estado/UF' : 'Descrição';
    const col2ph    = isUnidade ? 'Ex: SP' : 'Descrição opcional';
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:200px">
          <div style="position:relative;flex:1;max-width:320px">
            <input id="cfg-busca-${idx}" class="ift-input" type="text"
              placeholder="Buscar ${x(tab.singular)}..."
              oninput="ConfigMod.renderList(${idx})"
              style="padding-left:32px;width:100%">
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text4);pointer-events:none">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
          </div>
          <span id="cfg-count-${idx}" style="font-size:12px;color:var(--text4)"></span>
        </div>
        <button class="btn btn-primary" onclick="ConfigMod.openForm(${idx})" style="white-space:nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo ${x(tab.singular)}
        </button>
      </div>

      <div id="cfg-form-${idx}" style="display:none;background:var(--blue-light);border:1px solid var(--blue-mid);border-radius:var(--radius);padding:16px;margin-bottom:14px">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:12px" id="cfg-form-title-${idx}">Novo ${x(tab.singular)}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:end">
          <div class="fg">
            <label>Nome <span style="color:var(--red)">*</span></label>
            <input type="text" id="cfg-nome-${idx}" placeholder="Nome do ${x(tab.singular)}">
          </div>
          <div class="fg">
            <label>${x(col2)}</label>
            <input type="text" id="cfg-desc-${idx}" placeholder="${col2ph}">
          </div>
          ${isFmt ? iconPicker(idx, 'video') : ''}
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end">
          <button class="btn btn-ghost" onclick="ConfigMod.cancelForm(${idx})">Cancelar</button>
          <button class="btn btn-primary" onclick="ConfigMod.saveItem(${idx})">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Salvar
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-head" style="padding:10px 16px">
          <div class="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            ${x(tab.label)}
          </div>
        </div>
        <div class="tbl-wrap">
          <table>
            <thead>
              <tr>
                ${isFmt ? '<th style="width:48px">Ícone</th>' : ''}
                <th>Nome</th>
                <th>${x(col2)}</th>
                <th>Cadastrado em</th>
                <th style="width:80px"></th>
              </tr>
            </thead>
            <tbody id="cfg-tbody-${idx}"></tbody>
          </table>
        </div>
        <div id="cfg-empty-${idx}" style="display:none;text-align:center;padding:48px 20px;color:var(--text4)">
          <div style="font-size:36px;margin-bottom:12px"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg></div>
          <div style="font-size:14px;font-weight:600;color:var(--text2);margin-bottom:6px">Nenhum ${x(tab.singular)} cadastrado</div>
          <div style="font-size:12px">Clique em "Novo ${x(tab.singular)}" para começar</div>
        </div>
      </div>
    `;
  }

  /* ── List rows ─────────────────────────────────────────────────── */
  function list(idx, items) {
    const tab       = TABS[idx];
    const isUnidade = tab.key === KEYS.UNIDADE;
    const isFmt     = !!tab.hasIcon;

    const tbody = document.getElementById(`cfg-tbody-${idx}`);
    const empty = document.getElementById(`cfg-empty-${idx}`);
    const count = document.getElementById(`cfg-count-${idx}`);

    if (count) count.textContent = `${items.length} item(s)`;
    if (!tbody) return;

    if (!items.length) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = items.map(it => {
      const col2 = isUnidade
        ? `<span class="badge badge-blue" style="font-size:10px">${x(it.estado||'—')}</span>`
        : `<span style="font-size:12px;color:var(--text3)">${x(it.descricao||'—')}</span>`;
      const dt = it.criadoEm
        ? new Date(it.criadoEm).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'})
        : '—';
      const iconCell = isFmt
        ? `<td style="text-align:center;color:var(--blue)">${getIcon(it.icone).svg}</td>`
        : '';
      return `<tr>
        ${iconCell}
        <td><div style="font-weight:600;font-size:13px;color:var(--text)">${x(it.nome)}</div></td>
        <td>${col2}</td>
        <td style="font-size:11px;color:var(--text4)">${dt}</td>
        <td>
          <div style="display:flex;gap:4px;justify-content:flex-end">
            <button class="btn btn-ghost btn-sm" title="Editar" onclick="ConfigMod.editItem(${idx},'${it.id}')" style="padding:4px 8px">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-danger btn-sm" title="Excluir" onclick="ConfigMod.deleteItem(${idx},'${it.id}')" style="padding:4px 8px">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  return { page, list, iconPicker, x };
})();
