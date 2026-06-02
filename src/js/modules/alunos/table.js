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
    return Storage.Cursos.listar().filter(c => {
      const rest = Storage.Restricoes.porCurso(c.id);
      if (!rest.length) return c.status === 'publicado';
      return rest.some(r =>
        (r.tipo === 'colaborador' && r.refId === alunoId)      ||
        (r.tipo === 'setor'       && r.refId === al?.setorId)  ||
        (r.tipo === 'equipe'      && r.refId === al?.equipeId)
      );
    });
  }

  // ── Stats ─────────────────────────────────────────────────────

  function renderStats() {
    const wrap = document.getElementById('al-stats');
    if (!wrap) return;
    const st           = Storage.Alunos.stats();
    const cursosAtivos = Storage.Cursos.listar().filter(c => c.status === 'publicado').length;
    const ico = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`;
    const card = (lbl, val, sub, cls = '') => `
      <div class="stat">
        <div class="stat-top">
          <div><div class="stat-lbl">${lbl}</div><div class="stat-val ${cls}">${val}</div></div>
          <div class="stat-ico">${ico}</div>
        </div>
        <div class="stat-sub">${sub}</div>
      </div>`;
    wrap.innerHTML =
      card('Total de Alunos', st.total,      'cadastrados') +
      card('Ativos',          st.ativos,     'com acesso',  'blue') +
      card('Pendentes',       st.pendentes,  'aguardando') +
      card('Bloqueados',      st.bloqueados, 'sem acesso',  st.bloqueados > 0 ? 'red' : '') +
      card('Cursos Ativos',   cursosAtivos,  'disponíveis');
  }

  // ── Filtros ───────────────────────────────────────────────────

  function popularFiltros() {
    const sS = document.getElementById('al-filtro-setor');
    if (sS) sS.innerHTML = '<option value="">Setor</option>' +
      Storage.Setores.listar().map(s => `<option value="${_x(s.id)}">${_x(s.nome)}</option>`).join('');
  }

  // ── Tabela ────────────────────────────────────────────────────

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
    if (fSt) lista = lista.filter(a => (a.statusAcesso || (a.ativo ? 'ativo' : 'bloqueado')) === fSt);
    if (fSe) lista = lista.filter(a => a.setorId  === fSe);

    lista.sort((a, b) => {
      if (ordem === 'az')        return (a.nome || '').localeCompare(b.nome || '');
      if (ordem === 'za')        return (b.nome || '').localeCompare(a.nome || '');
      if (ordem === 'progresso') return progGeral(b.id) - progGeral(a.id);
      return new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0);
    });

    const tbody = q('#al-tbody');
    const empty = q('#al-empty');
    const count = q('#al-count');
    if (count) count.textContent = `${lista.length} aluno(s)`;
    if (!lista.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      AlunosState.progCache = null;
      return;
    }
    if (empty) empty.style.display = 'none';

    const setores = Storage.Setores.listar();
    const equipes = Storage.Equipes.listar();
    tbody.innerHTML = lista.map(al => _renderLinha(al, setores, equipes)).join('');
    AlunosState.progCache = null;
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

  return { render, renderStats, popularFiltros, progGeral, cursosDoAluno, stBadge };
})();
