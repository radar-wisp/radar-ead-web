/**
 * table.js — Stats, filtros, tabela e menu da Central de Materiais (MatTable).
 * Responsabilidade: renderização de indicadores, chips/badge de filtro,
 * select de cursos, tabela principal e dropdown de ações por linha.
 * Lê seleção em MatState; usa helpers de MatUtils e dados de Storage.
 *
 * @module MatTable
 */

/* global Storage, MatUtils, MatState, PortalMenu */

var MatTable = (() => {
  'use strict';

  const _q          = MatUtils.q;
  const _x          = MatUtils.x;
  const _fmtDate    = MatUtils.fmtDate;
  const _tipoBadge  = MatUtils.tipoBadge;
  const _statusBadge = MatUtils.statusBadge;
  const TIPO_CFG    = MatUtils.TIPO_CFG;

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
    MatState.setPage(1);
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
    if (wrap) wrap.innerHTML = '';
  }

  // ── Filtro de cursos ──────────────────────────────────────────

  function popularFiltroCurso() {
    const sel = document.getElementById('mat-filtro-curso');
    if (!sel) return;
    const cursos = Storage.Cursos.listar();
    sel.innerHTML =
      '<option value="">Todos os cursos</option>' +
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
    const fData   = _q('#mat-filtro-data')?.value    || '';
    const ordem   = _q('#mat-order')?.value          || 'recente';

    let base = Storage.Materiais.listar();

    if (busca) base = base.filter(m =>
      m.nome?.toLowerCase().includes(busca) ||
      m.tags?.toLowerCase().includes(busca) ||
      m.responsavel?.toLowerCase().includes(busca) ||
      m.categoria?.toLowerCase().includes(busca)
    );
    if (fTipo)  base = base.filter(m => m.tipo === fTipo);
    if (fCurso) base = base.filter(m => m.cursoId === fCurso || (m.cursosVinc || []).includes(fCurso));
    if (fData)  base = base.filter(m => m.criadoEm && m.criadoEm.slice(0, 10) >= fData);

    base.sort((a, b) => {
      if (ordem === 'az')     return (a.nome || '').localeCompare(b.nome || '');
      if (ordem === 'za')     return (b.nome || '').localeCompare(a.nome || '');
      if (ordem === 'antigo') return new Date(a.criadoEm) - new Date(b.criadoEm);
      return new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0);
    });

    const st = m => m.status || 'ativo';

    // "Ativos" — paginada (estado de página em MatState).
    _renderAtivos(base.filter(m => st(m) === 'ativo'), [busca, fTipo, fCurso, fData, ordem]);
    // "Arquivados" e "Ocultos" — listagem completa.
    _renderSecao(base.filter(m => st(m) === 'arquivado'), '#mat-tbody-arq', '#mat-empty-arq', '#mat-count-arq');
    _renderSecao(base.filter(m => st(m) === 'oculto'),    '#mat-tbody-oc',  '#mat-empty-oc',  '#mat-count-oc');
  }

  /** Renderiza uma seção simples (sem paginação). */
  function _renderSecao(lista, tbodySel, emptySel, countSel) {
    const tbody = _q(tbodySel), empty = _q(emptySel), count = _q(countSel);
    if (count) count.textContent = `${lista.length} ${lista.length === 1 ? 'material' : 'materiais'}`;
    if (!lista.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    if (tbody) tbody.innerHTML = lista.map(m => _renderLinha(m)).join('');
  }

  /** Renderiza a tabela "Ativos" com paginação. */
  function _renderAtivos(lista, sigParts) {
    const tbody = _q('#mat-tbody');
    const empty = _q('#mat-empty');
    const count = _q('#mat-count');

    if (count) count.textContent = `${lista.length} ${lista.length === 1 ? 'material' : 'materiais'}`;

    if (!lista.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      _renderPager(0, 1, 1);
      return;
    }
    if (empty) empty.style.display = 'none';

    // Reseta para a página 1 sempre que os filtros mudam.
    const sig = JSON.stringify(sigParts);
    if (MatState.getFilterSig() !== sig) {
      MatState.setPage(1);
      MatState.setFilterSig(sig);
    }
    const perPage    = MatState.getPerPage() || 25;
    const totalPages = Math.max(1, Math.ceil(lista.length / perPage));
    let page = MatState.getPage();
    if (page > totalPages) page = totalPages;
    if (page < 1)          page = 1;
    MatState.setPage(page);
    const ini    = (page - 1) * perPage;
    const pagina = lista.slice(ini, ini + perPage);

    tbody.innerHTML = pagina.map(m => _renderLinha(m)).join('');
    _renderPager(lista.length, perPage, page);
  }

  // ── Paginação ─────────────────────────────────────────────────

  function _pageList(page, totalPages) {
    const pages = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages; }
    pages.push(1);
    if (page > 3) pages.push('…');
    const start = Math.max(2, page - 1);
    const end   = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
    return pages;
  }

  function _renderPager(total, perPage, page) {
    const pager = document.getElementById('mat-pager');
    if (!pager) return;
    if (!total) { pager.innerHTML = ''; return; }
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const ini = (page - 1) * perPage + 1;
    const fim = Math.min(page * perPage, total);
    const info = `<span class="al-pg-info">${ini}–${fim} de ${total}</span>`;

    if (totalPages <= 1) { pager.innerHTML = info; return; }

    const btn = (lbl, p, dis, active) =>
      `<button class="al-pg-btn${active ? ' active' : ''}"${dis ? ' disabled' : ''}` +
      `${dis ? '' : ` onclick="MatMod._goPage(${p})"`}>${lbl}</button>`;

    const nums = _pageList(page, totalPages).map(p =>
      p === '…' ? '<span class="al-pg-dots">…</span>' : btn(p, p, false, p === page)
    ).join('');

    pager.innerHTML =
      info +
      `<div class="al-pg-ctrls">` +
        btn('‹', page - 1, page <= 1, false) +
        nums +
        btn('›', page + 1, page >= totalPages, false) +
      `</div>`;
  }

  function goPage(p) {
    MatState.setPage(p);
    renderTabela();
    document.getElementById('mat-tbody')?.scrollIntoView({ block: 'nearest' });
  }

  function setPerPage(val) {
    MatState.setPerPage(parseInt(val, 10) || 25);
    MatState.setPage(1);
    renderTabela();
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
          <div class="gc-menu" hidden>
            <button onclick="MatMod.visualizar('${m.id}');MatMod._closeMenus()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Visualizar
            </button>
            <button onclick="MatMod.abrirEdit('${m.id}');MatMod._closeMenus()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
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
  // Renderizado via PortalMenu (#gc-portal-menu, no body) — mesmo
  // mecanismo dos demais módulos — para não ser recortado pelo
  // overflow do .tbl-wrap e ficar visualmente idêntico aos outros.

  function _menu(btn) {
    const tpl = btn.nextElementSibling; // template oculto (.gc-menu[hidden])
    if (typeof PortalMenu !== 'undefined' && tpl) {
      const isOpen = btn.dataset.menuOpen === '1';
      _closeMenus();
      if (isOpen) return;
      btn.dataset.menuOpen = '1';
      PortalMenu.open(btn, tpl.innerHTML);
      const pm = document.getElementById('gc-portal-menu');
      if (pm) {
        const obs = new MutationObserver(() => {
          if (pm.style.display === 'none') { btn.dataset.menuOpen = '0'; obs.disconnect(); }
        });
        obs.observe(pm, { attributes: true, attributeFilter: ['style'] });
      }
      return;
    }
    // Fallback (sem PortalMenu): comportamento inline anterior.
    if (!tpl) return;
    tpl.hidden = false;
    const isOpen = tpl.classList.contains('open');
    _closeMenus();
    if (!isOpen) {
      tpl.classList.add('open');
      setTimeout(() => document.addEventListener('click', _closeMenus, { once: true }), 10);
    }
  }

  function _closeMenus() {
    if (typeof PortalMenu !== 'undefined') PortalMenu.close();
    document.querySelectorAll('[data-menu-open="1"]').forEach(b => { b.dataset.menuOpen = '0'; });
    document.querySelectorAll('.gc-menu.open').forEach(m => m.classList.remove('open'));
  }

  return {
    setStatus, resetFiltros, renderStats, popularFiltroCurso,
    renderTabela, goPage, setPerPage, _menu, _closeMenus,
  };
})();
