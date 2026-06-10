/**
 * table.js — Renderização da tabela de alunos, stats e filtros
 * Responsabilidade: HTML da tabela, linhas, stats e filtros.
 * Sem regras de negócio — apenas apresentação de dados.
 */

/* global EadUtils, Storage, AlunosState, AlunosMod */
/* exported AlunosTable */

var AlunosTable = (() => {
  'use strict';

  const _x          = EadUtils.escapeHtml;
  const _fmtRelative = EadUtils.fmtRelative;

  // ── Status badge ──────────────────────────────────────────────

  const ST_CFG = {
    ativo:     { cls: 'badge-green', lbl: 'Ativo' },
    pendente:  { cls: 'badge-amber', lbl: 'Pendente' },
    bloqueado: { cls: 'badge-red',   lbl: 'Bloqueado' },
    inativo:   { cls: 'badge-gray',  lbl: 'Inativo' },
  };

  function stBadge(al) {
    const st  = al.statusAcesso || (al.ativo ? 'ativo' : 'bloqueado');
    const cfg = ST_CFG[st] || { cls: 'badge-gray', lbl: st };
    return `<span class="badge ${cfg.cls}">${cfg.lbl}</span>`;
  }

  // ── Progresso (com cache por ciclo) ──────────────────────────

  function progGeral(alunoId) {
    const cache = AlunosState.progCache;
    if (cache && cache.has(alunoId)) return cache.get(alunoId);
    const cursos = Storage.Cursos.listar().filter(c => c.status === 'publicado');
    if (!cursos.length) return 0;
    const soma   = cursos.reduce((acc, c) => acc + Storage.Progresso.pctCurso(alunoId, c.id), 0);
    const result = Math.round(soma / cursos.length);
    if (cache) cache.set(alunoId, result);
    return result;
  }

  function cursosDoAluno(alunoId) {
    const al = Storage.Alunos.obter(alunoId);
    // Cursos vinculados via turmas em que o aluno participa
    const cursosTurma = new Set(
      (Storage.Turmas.listar() || [])
        .filter(t => (t.alunos || []).includes(alunoId))
        .map(t => t.cursoId)
    );
    // Conta SOMENTE os cursos em que o aluno está realmente vinculado
    // (por restrição direta/setor/equipe ou por turma). Sem fallback "todos publicados".
    return Storage.Cursos.listar().filter(c => {
      if (cursosTurma.has(c.id)) return true;
      return Storage.Restricoes.porCurso(c.id).some(r =>
        (r.tipo === 'colaborador' && r.refId === alunoId)      ||
        (r.tipo === 'setor'       && r.refId === al?.setorId)  ||
        (r.tipo === 'equipe'      && r.refId === al?.equipeId)
      );
    });
  }

  // ── Stats ─────────────────────────────────────────────────────

  function renderStats() {}

  // ── Filtros ───────────────────────────────────────────────────

  function popularFiltros() {
    const sS = document.getElementById('al-filtro-setor');
    if (sS) sS.innerHTML = '<option value="">Setor</option>' +
      Storage.Setores.listar().map(s => `<option value="${_x(s.id)}">${_x(s.nome)}</option>`).join('');
  }

  // ── Tabela ────────────────────────────────────────────────────

  // Tabelas por status. Cada uma é independente (chevron + paginação própria).
  const BUCKETS = [
    { key: 'pendente',  label: 'Pendentes'  },
    { key: 'ativo',     label: 'Ativos'     },
    { key: 'inativo',   label: 'Inativos'   },
    { key: 'bloqueado', label: 'Bloqueados' },
  ];

  const _statusOf = a => a.statusAcesso || (a.ativo ? 'ativo' : 'bloqueado');

  function render() {
    AlunosState.progCache = new Map();

    const q      = sel => document.querySelector(sel);
    const busca  = (q('#al-busca')?.value       || '').toLowerCase().trim();
    const fSt    = q('#al-filtro-status')?.value || '';
    const fSe    = q('#al-filtro-setor')?.value  || '';
    const ordem  = q('#al-order')?.value         || 'recente';

    let lista = Storage.Alunos.listar();
    if (busca) lista = lista.filter(a =>
      a.nome?.toLowerCase().includes(busca) ||
      a.email?.toLowerCase().includes(busca) ||
      a.matricula?.toLowerCase().includes(busca)
    );
    if (fSt) lista = lista.filter(a => _statusOf(a) === fSt);
    if (fSe) lista = lista.filter(a => a.setorId  === fSe);

    lista.sort((a, b) => {
      if (ordem === 'az')        return (a.nome || '').localeCompare(b.nome || '');
      if (ordem === 'za')        return (b.nome || '').localeCompare(a.nome || '');
      if (ordem === 'progresso') return progGeral(b.id) - progGeral(a.id);
      return new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0);
    });

    // Reseta a página de todas as tabelas sempre que os filtros mudam.
    const sig = JSON.stringify([busca, fSt, fSe, ordem]);
    if (AlunosState.lastFilterSig !== sig) {
      BUCKETS.forEach(b => { AlunosState.pages[b.key] = 1; });
      AlunosState.lastFilterSig = sig;
    }

    const setores = Storage.Setores.listar();
    const equipes = Storage.Equipes.listar();
    BUCKETS.forEach(b => {
      const itens = lista.filter(a => _statusOf(a) === b.key);
      _renderBucket(b.key, itens, setores, equipes);
    });
    AlunosState.progCache = null;
  }

  function _renderBucket(key, itens, setores, equipes) {
    const tbody = document.getElementById('al-tbody-' + key);
    const empty = document.getElementById('al-empty-' + key);
    const count = document.getElementById('al-count-' + key);
    if (count) count.textContent = `${itens.length} aluno(s)`;

    if (!itens.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      _renderPager(key, 0, 1, 1);
      return;
    }
    if (empty) empty.style.display = 'none';

    const perPage    = AlunosState.perPage || 25;
    const totalPages = Math.max(1, Math.ceil(itens.length / perPage));
    let page = AlunosState.pages[key] || 1;
    if (page > totalPages) page = totalPages;
    if (page < 1)          page = 1;
    AlunosState.pages[key] = page;

    const ini    = (page - 1) * perPage;
    const pagina = itens.slice(ini, ini + perPage);
    tbody.innerHTML = pagina.map(al => _renderLinha(al, setores, equipes)).join('');
    _renderPager(key, itens.length, perPage, page);
  }

  // ── Chevron (expandir / recolher) ────────────────────────────────

  function toggleCard(key) {
    const card = document.getElementById('al-card-' + key);
    if (!card) return;
    _setCollapsed(key, card.dataset.collapsed !== '1');
  }

  function _setCollapsed(key, collapsed) {
    const card = document.getElementById('al-card-' + key);
    if (!card) return;
    card.dataset.collapsed = collapsed ? '1' : '0';
    const body = card.querySelector('.al-card-body');
    const chev = card.querySelector('.al-chevron');
    if (body) body.style.display = collapsed ? 'none' : '';
    if (chev) chev.style.transform = collapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
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

  function _renderPager(key, total, perPage, page) {
    const pager = document.getElementById('al-pager-' + key);
    if (!pager) return;
    if (!total) { pager.innerHTML = ''; return; }
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const ini = (page - 1) * perPage + 1;
    const fim = Math.min(page * perPage, total);
    const info = `<span class="al-pg-info">${ini}–${fim} de ${total}</span>`;

    if (totalPages <= 1) { pager.innerHTML = info; return; }

    const btn = (lbl, p, dis, active) =>
      `<button class="al-pg-btn${active ? ' active' : ''}"${dis ? ' disabled' : ''}` +
      `${dis ? '' : ` onclick="AlunosMod._goPage('${key}',${p})"`}>${lbl}</button>`;

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

  function goPage(key, p) {
    AlunosState.pages[key] = p;
    render();
    document.getElementById('al-tbody-' + key)?.scrollIntoView({ block: 'nearest' });
  }

  function setPerPage(val) {
    AlunosState.perPage = parseInt(val, 10) || 25;
    BUCKETS.forEach(b => { AlunosState.pages[b.key] = 1; });
    render();
  }

  function _renderLinha(al, setores, equipes) {
    const setor   = al.setorId  ? setores.find(s => s.id === al.setorId)  : null;
    const equipe  = al.equipeId ? equipes.find(e => e.id === al.equipeId) : null;
    const prog    = progGeral(al.id);
    const nCursos = cursosDoAluno(al.id).length;
    const orgHtml = setor || equipe
      ? `${setor  ? `<span class="badge badge-blue"  style="margin-bottom:3px;display:block;width:fit-content">${_x(setor.nome)}</span>`  : ''}
         ${equipe ? `<span class="badge badge-green" style="display:block;width:fit-content">${_x(equipe.nome)}</span>` : ''}`
      : '<span style="color:var(--text4);font-size:12px">—</span>';

    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--blue-light);color:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;border:1px solid var(--border)">
            ${(al.nome?.[0] || '?').toUpperCase()}
          </div>
          <div style="min-width:0">
            <div style="font-weight:600;font-size:13px;color:var(--text)">${_x(al.nome)}</div>
            <div style="font-size:11px;color:var(--text4)">${_x(al.email)}</div>
          </div>
        </div>
      </td>
      <td style="font-size:12px;color:var(--text3)">${_x(al.matricula || '—')}</td>
      <td style="font-size:12px;color:var(--text3)">${_x(al.cargo || '—')}</td>
      <td>${orgHtml}</td>
      <td style="text-align:center;font-size:13px;font-weight:600">${nCursos}</td>
      <td style="min-width:90px">
        <div class="gc-prog-wrap">
          <div class="gc-prog-bar"><div class="gc-prog-fill" style="width:${prog}%"></div></div>
          <span class="gc-prog-lbl">${prog}%</span>
        </div>
      </td>
      <td>${stBadge(al)}</td>
      <td style="font-size:11px;color:var(--text4)">${_fmtRelative(al.ultimoAcesso)}</td>
      <td>
        <div class="gc-actions">
          <button class="gc-actions-btn" data-al-id="${al.id}" onclick="AlunosMod._menu(this)">
            Ações
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }

  return { render, renderStats, popularFiltros, progGeral, cursosDoAluno, stBadge, goPage, setPerPage, toggleCard };
})();
