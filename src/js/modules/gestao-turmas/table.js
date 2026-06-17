/**
 * table.js — Renderização da tabela principal e dos cards de stats.
 * Responsabilidade: HTML da tabela, células e indicadores do topo.
 *
 * @module TurmasTable
 */

/* global Storage, TurmasUtils, PortalMenu, TurmasState */
/* exported TurmasTable */

var TurmasTable = (() => {
  'use strict';

  const { q, x, fmtDate } = TurmasUtils;

  // ── Configuração visual de status ────────────────────────────

  const STATUS_CFG = {
    aberta:       { cls: 'badge-blue',  label: '◎ Aberta'       },
    em_andamento: { cls: 'badge-green', label: '● Em andamento' },
    encerrada:    { cls: 'badge-gray',  label: '▣ Encerrada'    },
    cancelada:    { cls: 'badge-red',   label: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cancelada'    },
  };

  const CHIP_CLS = {
    '':           'active-todos',
    aberta:       'active-pub',
    em_andamento: 'active-rev',
    encerrada:    'active-arq',
    cancelada:    'active-exp',
  };

  function statusBadge(status) {
    const cfg = STATUS_CFG[status] || { cls: 'badge-gray', label: status };
    return `<span class="badge ${cfg.cls}" style="white-space:nowrap">${cfg.label}</span>`;
  }

  // ── Filtros de status (chips) ────────────────────────────────

  function setStatus(btn, value) {
    document.querySelectorAll('.tm-chip').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
      c.style.borderColor = '';
      c.style.color = '';
    });
    if (value && CHIP_CLS[value]) {
      btn.classList.add(CHIP_CLS[value]);
    } else {
      btn.style.borderColor = 'var(--border2)';
      btn.style.color = 'var(--text2)';
    }
    const sel = document.getElementById('tm-filtro-status');
    if (sel) sel.value = value;
    renderTabela();
  }

  function resetFiltros() {
    ['tm-busca', 'tm-filtro-status', 'tm-filtro-curso',
     'tm-filtro-data', 'tm-filtro-resp', 'tm-filtro-status-sel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.querySelectorAll('.tm-chip').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
      c.style.borderColor = '';
      c.style.color = '';
    });
    renderTabela();
  }

  // ── Filtro de cursos ─────────────────────────────────────────

  function popularFiltroCurso() {
    const sel = q('#tm-filtro-curso');
    if (!sel) return;
    const cursos = Storage.Cursos.listar().filter(c =>
      c.status === 'publicado' || Storage.Turmas.porCurso(c.id).length > 0
    );
    sel.innerHTML =
      '<option value="">Todos os cursos</option>' +
      cursos.map(c => `<option value="${x(c.id)}">${x(c.titulo)}</option>`).join('');
  }

  // ── Células ──────────────────────────────────────────────────

  function _celulaNome(t) {
    const desc = t.descricao ? x(t.descricao).slice(0, 50) + '…' : '—';
    return `<td>
      <div style="font-weight:600;font-size:13px;color:var(--text)">${x(t.nome)}</div>
      <div style="font-size:11px;color:var(--text4)">${desc}</div>
    </td>`;
  }

  function _celulaAlunos(t) {
    const n      = t.alunos?.length || 0;
    const limite = t.limiteAlunos > 0
      ? `<div style="font-size:10px;color:var(--text4)">${n}/${t.limiteAlunos}</div>`
      : `<div style="font-size:10px;color:var(--text4)">ilimitado</div>`;
    return `<td style="text-align:center">
      <span style="font-size:14px;font-weight:600">${n}</span>${limite}
    </td>`;
  }

  function _celulaMenu(t) {
    return `<td>
      <div class="gc-actions">
        <button class="gc-actions-btn" onclick="Turmas._menu(this)" title="Ações"
          data-id="${t.id}" data-menu-open="0">
          Ações
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
    </td>`;
  }

  function _renderLinha(t) {
    const curso = t.cursoId ? Storage.Cursos.obter(t.cursoId) : null;
    const prog  = Storage.Turmas.progresso(t.id);
    return `<tr>
      ${_celulaNome(t)}
      <td style="font-size:12px;color:var(--text3)">
        ${curso ? x(curso.titulo) : '<span style="color:var(--text4)">—</span>'}
      </td>
      ${_celulaAlunos(t)}
      <td style="min-width:90px">
        <div class="gc-prog-wrap">
          <div class="gc-prog-bar"><div class="gc-prog-fill" style="width:${prog}%"></div></div>
          <span class="gc-prog-lbl">${prog}%</span>
        </div>
      </td>
      <td style="font-size:12px;color:var(--text3)">${x(t.responsavel || '—')}</td>
      <td style="font-size:11px;color:var(--text4)">${fmtDate(t.dataInicio)}</td>
      <td style="font-size:11px;color:var(--text4)">${fmtDate(t.dataFim)}</td>
      <td>${statusBadge(t.status)}</td>
      ${_celulaMenu(t)}
    </tr>`;
  }

  // ── Tabela principal ─────────────────────────────────────────

  function _aplicarFiltros(lista) {
    const busca  = (q('#tm-busca')?.value       || '').toLowerCase().trim();
    const fCurso = q('#tm-filtro-curso')?.value || '';
    const fData  = q('#tm-filtro-data')?.value  || '';
    const fResp  = (q('#tm-filtro-resp')?.value || '').toLowerCase().trim();

    if (busca)  lista = lista.filter(t =>
      t.nome?.toLowerCase().includes(busca) ||
      t.responsavel?.toLowerCase().includes(busca)
    );
    if (fCurso) lista = lista.filter(t => t.cursoId === fCurso);
    if (fData)  lista = lista.filter(t => t.dataInicio && t.dataInicio.slice(0, 10) >= fData);
    if (fResp)  lista = lista.filter(t => t.responsavel?.toLowerCase().includes(fResp));

    return lista.sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0));
  }

  function renderTabela() {
    let lista = _aplicarFiltros(
      Storage.Turmas.listar().filter(t => t.status === 'aberta')
    );

    const tbody = q('#tm-tbody');
    const empty = q('#tm-empty');
    const count = q('#tm-count');

    if (count) count.textContent = `${lista.length} ${lista.length === 1 ? 'turma' : 'turmas'}`;

    if (!lista.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      _renderPager(0, 1, 1);
      _renderEncerradas();
      return;
    }
    if (empty) empty.style.display = 'none';

    // ── Paginação (quebra de página) ──────────────────────────
    // Reseta para a página 1 sempre que os filtros mudam.
    const sig = JSON.stringify([
      q('#tm-busca')?.value, q('#tm-filtro-curso')?.value,
      q('#tm-filtro-data')?.value, q('#tm-filtro-resp')?.value,
    ]);
    if (TurmasState.lastSig !== sig) {
      TurmasState.page = 1;
      TurmasState.lastSig = sig;
    }
    const perPage    = TurmasState.perPage || 25;
    const totalPages = Math.max(1, Math.ceil(lista.length / perPage));
    if (TurmasState.page > totalPages) TurmasState.page = totalPages;
    if (TurmasState.page < 1)          TurmasState.page = 1;
    const ini    = (TurmasState.page - 1) * perPage;
    const pagina = lista.slice(ini, ini + perPage);

    tbody.innerHTML = pagina.map(t => _renderLinha(t)).join('');
    _renderPager(lista.length, perPage, TurmasState.page);
    _renderEncerradas();
  }

  function _renderEncerradas() {
    const lista = _aplicarFiltros(
      Storage.Turmas.listar().filter(t => t.status === 'encerrada')
    );
    const tbody = q('#tm-tbody-enc');
    const empty = q('#tm-empty-enc');
    const count = q('#tm-count-enc');

    if (count) count.textContent = `${lista.length} ${lista.length === 1 ? 'turma' : 'turmas'}`;
    if (!tbody) return;

    if (!lista.length) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    tbody.innerHTML = lista.map(t => _renderLinha(t)).join('');
  }

  // ── Paginação ────────────────────────────────────────────────

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
    const pager = document.getElementById('tm-pager');
    if (!pager) return;
    if (!total) { pager.innerHTML = ''; return; }
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const ini  = (page - 1) * perPage + 1;
    const fim  = Math.min(page * perPage, total);
    const info = `<span class="al-pg-info">${ini}–${fim} de ${total}</span>`;

    if (totalPages <= 1) { pager.innerHTML = info; return; }

    const btn = (lbl, p, dis, active) =>
      `<button class="al-pg-btn${active ? ' active' : ''}"${dis ? ' disabled' : ''}` +
      `${dis ? '' : ` onclick="Turmas._goPage(${p})"`}>${lbl}</button>`;

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
    TurmasState.page = p;
    renderTabela();
    document.getElementById('tm-tbody')?.scrollIntoView({ block: 'nearest' });
  }

  function setPerPage(val) {
    TurmasState.perPage = parseInt(val, 10) || 25;
    TurmasState.page = 1;
    renderTabela();
  }

  // ── Stats ────────────────────────────────────────────────────

  function renderStats() {
    const wrap = document.getElementById('tm-stats');
    if (!wrap) return;

    const lista   = Storage.Turmas.listar();
    const total   = lista.length;
    const abertas = lista.filter(t => t.status === 'aberta').length;
    const andando = lista.filter(t => t.status === 'em_andamento').length;
    const encerr  = lista.filter(t => t.status === 'encerrada').length;

    const ico = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`;

    const card = (label, val, sub, valCls = '') => `
      <div class="stat">
        <div class="stat-top">
          <div>
            <div class="stat-lbl">${label}</div>
            <div class="stat-val ${valCls}">${val}</div>
          </div>
          <div class="stat-ico">${ico}</div>
        </div>
        <div class="stat-sub">${sub}</div>
      </div>`;

    wrap.innerHTML =
      card('Total de Turmas', total,   'cadastradas',      '') +
      card('Abertas',         abertas, 'aguardando início','blue') +
      card('Em andamento',    andando, 'em progresso',     'green') +
      card('Encerradas',      encerr,  'concluídas',       '');
  }

  return {
    renderTabela,
    renderStats,
    popularFiltroCurso,
    setStatus,
    resetFiltros,
    statusBadge,
    goPage,
    setPerPage,
  };
})();
