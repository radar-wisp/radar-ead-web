/**
 * table.js — Stats, filtros, tabela e menu da Central de Materiais (MatTable).
 * Responsabilidade: renderização de indicadores, chips/badge de filtro,
 * select de cursos, tabela principal e dropdown de ações por linha.
 * Lê seleção em MatState; usa helpers de MatUtils e dados de Storage.
 *
 * @module MatTable
 */

/* global Storage, MatUtils, MatState */

var MatTable = (() => {
  'use strict';

  const _q          = MatUtils.q;
  const _x          = MatUtils.x;
  const _fmtDate    = MatUtils.fmtDate;
  const _tipoBadge  = MatUtils.tipoBadge;
  const _statusBadge = MatUtils.statusBadge;
  const TIPO_CFG    = MatUtils.TIPO_CFG;

  // ── Estilo do menu de ações (scoped ao módulo) ────────────────
  // Reaproveita os mesmos tokens do #gc-portal-menu para manter o
  // dropdown da Central de Materiais visualmente consistente com os
  // demais menus de ação do sistema. Não altera regras globais.
  (function _injectMenuStyle() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('cm-actions-menu-style')) return;
    const css = `
      .gc-actions { position:relative; display:inline-block; }
      .cm-menu {
        display:none; position:absolute; top:calc(100% + 4px); right:0; z-index:9000;
        background:var(--surface); border:1px solid var(--border);
        border-radius:var(--radius-sm); box-shadow:0 8px 24px rgba(0,2,60,.14);
        min-width:185px; padding:4px;
      }
      .cm-menu.open { display:block; animation:popIn .12s ease; }
      .cm-menu button {
        display:flex; align-items:center; gap:8px; width:100%; padding:7px 10px;
        border-radius:5px; font-size:12px; line-height:1.2; color:var(--text2);
        background:none; border:none; cursor:pointer; text-align:left;
        white-space:nowrap; transition:background .1s; font-family:var(--font);
      }
      .cm-menu button svg { flex:0 0 auto; }
      .cm-menu button:hover { background:var(--blue-l); color:var(--blue); }
      .cm-menu button.danger { color:var(--red); }
      .cm-menu button.danger:hover { background:var(--red-l,#fee2e2); }
      .cm-menu hr { border:none; border-top:1px solid var(--border); margin:3px 0; }
    `;
    const el = document.createElement('style');
    el.id = 'cm-actions-menu-style';
    el.textContent = css;
    (document.head || document.documentElement).appendChild(el);
  })();

  // ── Chips de filtro de status ─────────────────────────────────

  const CHIP_CLS = {
    '':        '',
    ativo:     'active-pub',
    oculto:    'active-arq',
    arquivado: 'active-ras',
  };

  /**
   * Ativa o chip de status selecionado e atualiza a tabela.
   * @param {HTMLElement} btn
   * @param {string}      value
   */
  function setStatus(btn, value) {
    document.querySelectorAll('.ift-chip[data-mstatus]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
    });
    if (value && CHIP_CLS[value]) btn.classList.add(CHIP_CLS[value]);
    const sel = document.getElementById('mat-filtro-status');
    if (sel) sel.value = value;
    renderTabela();
    _updateBadge();
  }

  /**
   * Limpa todos os filtros ativos.
   */
  function resetFiltros() {
    ['mat-busca', 'mat-filtro-tipo', 'mat-filtro-curso', 'mat-filtro-status', 'mat-filtro-data'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const ord = document.getElementById('mat-order');
    if (ord) ord.value = 'recente';
    document.querySelectorAll('.ift-chip[data-mstatus]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
    });
    renderTabela();
    _updateBadge();
  }

  /**
   * Atualiza o badge de contagem de filtros ativos.
   */
  function _updateBadge() {
    const badge = document.getElementById('mat-badge');
    if (!badge) return;
    let n = 0;
    ['mat-busca', 'mat-filtro-tipo', 'mat-filtro-curso', 'mat-filtro-status', 'mat-filtro-data']
      .forEach(id => { if (document.getElementById(id)?.value?.trim()) n++; });
    badge.textContent = n;
    badge.classList.toggle('show', n > 0);
  }

  // ── Stats ─────────────────────────────────────────────────────

  /**
   * Renderiza os cards de estatísticas do painel de materiais.
   */
  function renderStats() {
    const wrap = document.getElementById('mat-stats');
    if (!wrap) return;

    const st = Storage.Materiais.stats();
    const icoFolder = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;

    const card = (label, val, sub, cls = '') => `
      <div class="stat">
        <div class="stat-top">
          <div>
            <div class="stat-lbl">${label}</div>
            <div class="stat-val ${cls}">${val}</div>
          </div>
          <div class="stat-ico">${icoFolder}</div>
        </div>
        <div class="stat-sub">${sub}</div>
      </div>`;

    wrap.innerHTML =
      card('Total',      st.total,      'na biblioteca') +
      card('PDFs',       st.pdf,        'documentos') +
      card('Vídeos',     st.video,      'gravações') +
      card('Ativos',     st.ativos,     'disponíveis', 'blue') +
      card('Arquivados', st.arquivados, 'desativados');
  }

  // ── Filtro de cursos ──────────────────────────────────────────

  function popularFiltroCurso() {
    const sel = document.getElementById('mat-filtro-curso');
    if (!sel) return;
    const cursos = Storage.Cursos.listar();
    sel.innerHTML =
      '<option value="">Curso</option>' +
      cursos.map(c => `<option value="${_x(c.id)}">${_x(c.titulo)}</option>`).join('');
  }

  // ── Tabela principal ──────────────────────────────────────────

  /**
   * Lê filtros do DOM e (re)renderiza o tbody da tabela de materiais.
   */
  function renderTabela() {
    const busca   = (_q('#mat-busca')?.value         || '').toLowerCase().trim();
    const fTipo   = _q('#mat-filtro-tipo')?.value    || '';
    const fCurso  = _q('#mat-filtro-curso')?.value   || '';
    const fStatus = _q('#mat-filtro-status')?.value  || '';
    const fData   = _q('#mat-filtro-data')?.value    || '';
    const ordem   = _q('#mat-order')?.value          || 'recente';

    let lista = Storage.Materiais.listar();

    if (busca) lista = lista.filter(m =>
      m.nome?.toLowerCase().includes(busca) ||
      m.tags?.toLowerCase().includes(busca) ||
      m.responsavel?.toLowerCase().includes(busca) ||
      m.categoria?.toLowerCase().includes(busca)
    );
    if (fTipo)   lista = lista.filter(m => m.tipo === fTipo);
    if (fCurso)  lista = lista.filter(m => m.cursoId === fCurso || (m.cursosVinc || []).includes(fCurso));
    if (fStatus) lista = lista.filter(m => (m.status || 'ativo') === fStatus);
    if (fData)   lista = lista.filter(m => m.criadoEm && m.criadoEm.slice(0, 10) >= fData);

    lista.sort((a, b) => {
      if (ordem === 'az')     return (a.nome || '').localeCompare(b.nome || '');
      if (ordem === 'za')     return (b.nome || '').localeCompare(a.nome || '');
      if (ordem === 'antigo') return new Date(a.criadoEm) - new Date(b.criadoEm);
      return new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0);
    });

    const tbody = _q('#mat-tbody');
    const empty = _q('#mat-empty');
    const count = _q('#mat-count');

    if (count) {
      count.textContent = `${lista.length} ${lista.length === 1 ? 'material' : 'materiais'}`;
    }

    if (!lista.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = lista.map(m => _renderLinha(m)).join('');
  }

  /**
   * Gera o HTML de uma linha da tabela para um material.
   * @param {object} m — material
   * @returns {string}
   */
  function _renderLinha(m) {
    const curso  = m.cursoId ? Storage.Cursos.obter(m.cursoId) : null;
    const status = m.status || 'ativo';
    const vinc   = (m.cursosVinc || []).length;
    const sel    = MatState.hasSel(m.id);
    const tipoCfg = TIPO_CFG[m.tipo] || TIPO_CFG.outro;

    const temUrl = m.url && m.url !== '#simulado';

    return `<tr class="${sel ? 'selected' : ''}" id="mrow-${m.id}">
      <td style="padding:8px 10px">
        <input type="checkbox" class="row-check" ${sel ? 'checked' : ''}
          onchange="MatMod.toggleSel('${m.id}',this.checked)"
          style="width:14px;height:14px;accent-color:var(--blue);cursor:pointer">
      </td>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:var(--radius-sm);background:${tipoCfg.bg};color:${tipoCfg.txt};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;flex-shrink:0">
            ${tipoCfg.label.slice(0, 3).toUpperCase()}
          </div>
          <div style="min-width:0">
            <div style="font-weight:600;font-size:13px;color:var(--text)">${_x(m.nome)}</div>
            <div style="font-size:11px;color:var(--text4)">${m.descricao ? _x(m.descricao).slice(0, 55) : (m.tags ? '🏷 ' + _x(m.tags) : '—')}</div>
          </div>
        </div>
      </td>
      <td>${_tipoBadge(m.tipo)}</td>
      <td style="font-size:12px">
        ${curso ? `<span style="color:var(--text2)">${_x(curso.titulo)}</span>` : '<span style="color:var(--text4)">—</span>'}
        ${vinc > 0 ? `<div style="font-size:10px;color:var(--blue);margin-top:2px">+${vinc} curso${vinc > 1 ? 's' : ''} vinculado${vinc > 1 ? 's' : ''}</div>` : ''}
      </td>
      <td style="font-size:12px;color:var(--text3)">${_x(m.categoria || '—')}</td>
      <td style="font-size:12px;color:var(--text4)">${m.tamanho || '—'}</td>
      <td>${_statusBadge(status)}</td>
      <td style="font-size:11px;color:var(--text4)">${_fmtDate(m.criadoEm)}</td>
      <td>
        <div class="gc-actions">
          <button class="gc-actions-btn" onclick="MatMod._menu(this)">
            Ações
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="gc-menu cm-menu">
            <button onclick="MatMod.visualizar('${m.id}');MatMod._closeMenus()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Visualizar
            </button>
            <button onclick="MatMod.abrirEdit('${m.id}');MatMod._closeMenus()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>
            <button onclick="MatMod.abrirVincular('${m.id}');MatMod._closeMenus()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Vincular a curso
            </button>
            <button onclick="MatMod.duplicar('${m.id}');MatMod._closeMenus()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Duplicar
            </button>
            ${temUrl ? `
            <button onclick="MatMod.baixar('${m.id}');MatMod._closeMenus()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Baixar
            </button>` : ''}
            <hr class="sep">
            <button onclick="MatMod.arquivar('${m.id}');MatMod._closeMenus()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><rect x="1" y="3" width="22" height="5" rx="1"/></svg>
              Arquivar
            </button>
            <hr class="sep">
            <button class="danger" onclick="MatMod.excluir('${m.id}');MatMod._closeMenus()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              Excluir
            </button>
          </div>
        </div>
      </td>
    </tr>`;
  }

  // ── Menu dropdown ─────────────────────────────────────────────

  function _menu(btn) {
    const menu   = btn.nextElementSibling;
    const isOpen = menu.classList.contains('open');
    _closeMenus();
    if (!isOpen) {
      menu.classList.add('open');
      setTimeout(() => document.addEventListener('click', _closeMenus, { once: true }), 10);
    }
  }

  function _closeMenus() {
    document.querySelectorAll('.gc-menu.open').forEach(m => m.classList.remove('open'));
  }

  return {
    setStatus, resetFiltros, renderStats, popularFiltroCurso,
    renderTabela, _menu, _closeMenus,
  };
})();
