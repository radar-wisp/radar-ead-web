/**
 * table.js — Stats, filtros e tabela do módulo Avaliações.
 * Responsabilidade: renderização da listagem e filtros (sem CRUD/modal).
 *
 * @module AvalTable
 */

/* global Storage, AvalUtils, AvalState */

var AvalTable = (() => {
  'use strict';

  const _q       = AvalUtils.q;
  const _x       = AvalUtils.x;
  const _fmtDate = AvalUtils.fmtDate;
  const _fmtTempo= AvalUtils.fmtTempo;
  const _stBadge = AvalUtils.stBadge;

  const CHIP_CLS = {
    '':         '',
    rascunho:   'active-ras',
    publicada:  'active-pub',
    encerrada:  'active-arq',
    arquivada:  'active-exp',
  };

  // IDs dos campos de filtro (fonte única — usado por reset e badge)
  const FILTRO_IDS = ['av-busca', 'av-filtro-status', 'av-filtro-curso', 'av-filtro-turma', 'av-filtro-data'];

  function setStatus(btn, value) {
    document.querySelectorAll('.ift-chip[data-avst]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
    });
    if (value && CHIP_CLS[value]) btn.classList.add(CHIP_CLS[value]);
    const sel = document.getElementById('av-filtro-status');
    if (sel) sel.value = value;
    renderTabela();
    _badge();
  }

  function resetFiltros() {
    FILTRO_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.querySelectorAll('.ift-chip[data-avst]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
    });
    AvalState.page = 1;
    renderTabela();
    _badge();
  }

  function _badge() {
    const b = document.getElementById('av-badge');
    if (!b) return;
    let n = 0;
    FILTRO_IDS.forEach(id => { if (document.getElementById(id)?.value?.trim()) n++; });
    b.textContent = n;
    b.classList.toggle('show', n > 0);
  }

  // ══════════════════════════════════════════════════════════════
  // STATS
  // ══════════════════════════════════════════════════════════════

  function renderStats() {
    const wrap = document.getElementById('av-stats');
    if (!wrap) return;

    const st = Storage.Avaliacoes.stats();
    const icoQuiz = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

    const card = (lbl, val, sub, cls = '') => `
      <div class="stat">
        <div class="stat-top">
          <div>
            <div class="stat-lbl">${lbl}</div>
            <div class="stat-val ${cls}">${val}</div>
          </div>
          <div class="stat-ico">${icoQuiz}</div>
        </div>
        <div class="stat-sub">${sub}</div>
      </div>`;

    wrap.innerHTML =
      card('Total',       st.total,       'cadastradas') +
      card('Publicadas',  st.publicadas,  'ativas',        'blue') +
      card('Rascunhos',   st.rascunhos,   'em edição') +
      card('Média geral', st.media + '%', 'nota média',    st.media >= 70 ? 'green' : 'red') +
      card('Aprovação',   st.taxa + '%',  `${st.aprovados} aprovados`, st.taxa >= 70 ? 'green' : '');
  }

  // ══════════════════════════════════════════════════════════════
  // FILTROS
  // ══════════════════════════════════════════════════════════════

  function _popularFiltros() {
    const sC = document.getElementById('av-filtro-curso');
    const sT = document.getElementById('av-filtro-turma');
    if (sC) {
      sC.innerHTML =
        '<option value="">Curso</option>' +
        Storage.Cursos.listar().map(c =>
          `<option value="${_x(c.id)}">${_x(c.titulo)}</option>`
        ).join('');
    }
    if (sT) {
      sT.innerHTML =
        '<option value="">Turma</option>' +
        Storage.Turmas.listar().map(t =>
          `<option value="${_x(t.id)}">${_x(t.nome)}</option>`
        ).join('');
    }
  }

  // ══════════════════════════════════════════════════════════════
  // TABELA PRINCIPAL
  // ══════════════════════════════════════════════════════════════

  // Tabelas-accordion por status (rótulo exibido no contador)
  const SECOES = ['rascunho', 'publicada', 'encerrada', 'arquivada'];

  function renderTabela() {
    const busca   = (_q('#av-busca')?.value          || '').toLowerCase().trim();
    const fStatus = _q('#av-filtro-status')?.value   || '';
    const fCurso  = _q('#av-filtro-curso')?.value    || '';
    const fTurma  = _q('#av-filtro-turma')?.value    || '';
    const fData   = _q('#av-filtro-data')?.value     || '';

    let lista = Storage.Avaliacoes.listar();
    if (busca)   lista = lista.filter(a => a.nome?.toLowerCase().includes(busca));
    if (fStatus) lista = lista.filter(a => a.status === fStatus);
    if (fCurso)  lista = lista.filter(a => a.cursoId === fCurso);
    if (fTurma)  lista = lista.filter(a => a.turmaId === fTurma);
    if (fData)   lista = lista.filter(a => a.criadoEm && a.criadoEm.slice(0, 10) >= fData);
    lista.sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0));

    SECOES.forEach(st => {
      const itens = lista.filter(a => a.status === st);
      const tbody = _q('#av-tbody-' + st);
      const empty = _q('#av-empty-' + st);
      const count = _q('#av-count-' + st);
      if (count) count.textContent = `${itens.length} avaliação(ões)`;
      if (tbody) tbody.innerHTML = itens.map(av => _renderLinha(av)).join('');
      if (empty) empty.style.display = itens.length ? 'none' : 'block';
    });
  }

  /** Expande/recolhe um accordion (somente no clique manual no cabeçalho). */
  function toggleAcc(head) {
    const body = head.nextElementSibling;
    if (!body) return;
    const aberto = body.style.display !== 'none';
    body.style.display = aberto ? 'none' : 'block';
    const chev = head.querySelector('.av-chev');
    if (chev) chev.style.transform = aberto ? '' : 'rotate(90deg)';
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
    const pager = document.getElementById('av-pager');
    if (!pager) return;
    if (!total) { pager.innerHTML = ''; return; }
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const ini = (page - 1) * perPage + 1;
    const fim = Math.min(page * perPage, total);
    const info = `<span class="al-pg-info">${ini}–${fim} de ${total}</span>`;

    if (totalPages <= 1) { pager.innerHTML = info; return; }

    const btn = (lbl, p, dis, active) =>
      `<button class="al-pg-btn${active ? ' active' : ''}"${dis ? ' disabled' : ''}` +
      `${dis ? '' : ` onclick="Aval._goPage(${p})"`}>${lbl}</button>`;

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
    AvalState.page = p;
    renderTabela();
    document.getElementById('av-tbody')?.scrollIntoView({ block: 'nearest' });
  }

  function setPerPage(val) {
    AvalState.perPage = parseInt(val, 10) || 25;
    AvalState.page = 1;
    renderTabela();
  }

  /**
   * Gera o HTML de uma linha da tabela para uma avaliação.
   * @param {object} av — avaliação
   * @returns {string}
   */
  function _renderLinha(av) {
    const curso  = av.cursoId ? Storage.Cursos.obter(av.cursoId) : null;
    const turma  = av.turmaId ? Storage.Turmas.obter(av.turmaId) : null;
    const nQ     = Storage.Questoes.porAvaliacao(av.id).length;
    const stats  = Storage.Respostas.statsAvaliacao(av.id);
    const nota   = av.notaMinima || 70;
    const tent   = av.tentativas || 1;

    const acaoStatus = av.status === 'rascunho'
      ? `<button onclick="Aval.publicar('${av.id}');Aval._cm()">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Publicar
         </button>`
      : av.status === 'publicada'
      ? `<button onclick="Aval.encerrar('${av.id}');Aval._cm()">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          Encerrar
         </button>`
      : '';

    return `<tr>
      <td>
        <div style="font-weight:600;font-size:13px;color:var(--text)">${_x(av.nome)}</div>
        <div style="font-size:11px;color:var(--text4)">${av.descricao ? _x(av.descricao).slice(0, 50) : '—'}</div>
      </td>
      <td style="font-size:12px;color:var(--text3)">${curso ? _x(curso.titulo) : '—'}</td>
      <td style="font-size:12px;color:var(--text3)">${turma ? _x(turma.nome) : '<span style="color:var(--text4)">Todas</span>'}</td>
      <td style="text-align:center;font-size:13px;font-weight:600">${nQ}</td>
      <td style="text-align:center"><span class="badge badge-blue">${nota}%</span></td>
      <td style="text-align:center;font-size:12px;color:var(--text3)">${tent === 0 ? '∞' : tent}</td>
      <td style="text-align:center;font-size:12px;font-weight:600">${stats.participantes}</td>
      <td style="text-align:center">
        ${stats.participantes > 0
          ? `<span class="badge ${stats.taxa >= nota ? 'badge-green' : 'badge-red'}">${stats.taxa}%</span>`
          : '<span style="color:var(--text4);font-size:12px">—</span>'}
      </td>
      <td>${_stBadge(av.status)}</td>
      <td style="font-size:11px;color:var(--text4)">${_fmtDate(av.criadoEm)}</td>
      <td>
        <div class="gc-actions">
          <button class="gc-actions-btn" onclick="Aval._menu(this)">
            Ações
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="gc-menu">
            <button onclick="Aval.verResultados('${av.id}');Aval._cm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Resultados
            </button>
            <button onclick="Aval.abrirEdit('${av.id}');Aval._cm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>
            <button onclick="Aval.duplicar('${av.id}');Aval._cm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Duplicar
            </button>
            <hr class="sep">
            ${acaoStatus}
            <hr class="sep">
            <button class="danger" onclick="Aval.excluir('${av.id}');Aval._cm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              Excluir
            </button>
          </div>
        </div>
      </td>
    </tr>`;
  }

  // ══════════════════════════════════════════════════════════════
  // MENU DROPDOWN
  // ══════════════════════════════════════════════════════════════

  function _menu(btn) {
    const m = btn.nextElementSibling; // .gc-menu (template de itens)
    // Usa o mesmo portal de Gestão de Cursos: dropdown no body, sem clip.
    if (typeof PortalMenu !== 'undefined' && m) {
      PortalMenu.open(btn, m.innerHTML);
      return;
    }
    // Fallback (caso o portal não esteja disponível)
    if (!m) return;
    const isOpen = m.classList.contains('open');
    _cm();
    if (!isOpen) {
      m.classList.add('open');
      setTimeout(() => document.addEventListener('click', _cm, { once: true }), 10);
    }
  }

  function _cm() {
    if (typeof PortalMenu !== 'undefined') PortalMenu.close();
    document.querySelectorAll('.gc-menu.open').forEach(m => m.classList.remove('open'));
  }

  return {
    renderStats, renderTabela, _popularFiltros, toggleAcc,
    setStatus, resetFiltros, _menu, _cm,
    goPage, setPerPage,
  };
})();
