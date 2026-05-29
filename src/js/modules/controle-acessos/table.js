/**
 * table.js — Stats, filtros, tabela, menu e painéis de listagem
 * (vencimentos próximos e histórico) do módulo Controle de Acessos.
 * Responsabilidade: renderização de leitura (sem CRUD/modal).
 *
 * @module AcTable
 */

/* global Storage, AcUtils */
/* exported AcTable */

var AcTable = (() => {
  'use strict';

  const _q          = AcUtils.q;
  const _x          = AcUtils.x;
  const _fmtDate    = AcUtils.fmtDate;
  const _fmtExpira  = AcUtils.fmtExpira;
  const _stBadge    = AcUtils.stBadge;
  const _resolveSt  = AcUtils.resolveStatus;
  const _nomeAlvo   = AcUtils.nomeAlvo;
  const TIPO_LABEL  = AcUtils.TIPO_LABEL;
  const TIPO_BADGE  = AcUtils.TIPO_BADGE;

  // ── Chips de filtro de status ───────────────────────────────────
  const CHIP_CLS = {
    '':        '',
    ativo:     'active-pub',
    expirado:  'active-exp',
    bloqueado: 'active-arq',
    pendente:  'active-rev',
  };

  function setStatus(btn, value) {
    document.querySelectorAll('.ift-chip[data-acst]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
    });
    if (value && CHIP_CLS[value]) btn.classList.add(CHIP_CLS[value]);
    const sel = document.getElementById('ac-filtro-status');
    if (sel) sel.value = value;
    renderTabela();
    _badge();
  }

  function resetFiltros() {
    ['ac-busca', 'ac-filtro-status', 'ac-filtro-curso', 'ac-filtro-tipo', 'ac-filtro-data'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.querySelectorAll('.ift-chip[data-acst]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
    });
    renderTabela();
    _badge();
  }

  function _badge() {
    const b = document.getElementById('ac-badge');
    if (!b) return;
    let n = 0;
    ['ac-busca', 'ac-filtro-status', 'ac-filtro-curso', 'ac-filtro-tipo', 'ac-filtro-data']
      .forEach(id => { if (document.getElementById(id)?.value?.trim()) n++; });
    b.textContent = n;
    b.classList.toggle('show', n > 0);
  }

  // ── Stats ───────────────────────────────────────────────────────
  function renderStats() {
    const wrap = document.getElementById('ac-stats');
    if (!wrap) return;

    const st = Storage.Restricoes.stats();

    const icoLock = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

    const card = (lbl, val, sub, cls = '') => `
      <div class="stat">
        <div class="stat-top">
          <div>
            <div class="stat-lbl">${lbl}</div>
            <div class="stat-val ${cls}">${val}</div>
          </div>
          <div class="stat-ico">${icoLock}</div>
        </div>
        <div class="stat-sub">${sub}</div>
      </div>`;

    wrap.innerHTML =
      card('Acessos Ativos',   st.ativos,    'configurados',  'blue') +
      card('Expirados',        st.expirados, 'vencidos',      st.expirados  > 0 ? 'red'   : '') +
      card('Cursos Liberados', st.cursos,    'com restrições') +
      card('Bloqueados',       st.bloqueados,'suspensos',     st.bloqueados > 0 ? 'amber' : '');
  }

  // ── Filtro de cursos ────────────────────────────────────────────
  function _popularFiltroCurso() {
    const sel = document.getElementById('ac-filtro-curso');
    if (!sel) return;
    sel.innerHTML =
      '<option value="">Curso</option>' +
      Storage.Cursos.listar().map(c =>
        `<option value="${_x(c.id)}">${_x(c.titulo)}</option>`
      ).join('');
  }

  // ── Tabela principal ────────────────────────────────────────────
  function renderTabela() {
    const busca   = (_q('#ac-busca')?.value         || '').toLowerCase().trim();
    const fStatus = _q('#ac-filtro-status')?.value  || '';
    const fCurso  = _q('#ac-filtro-curso')?.value   || '';
    const fTipo   = _q('#ac-filtro-tipo')?.value    || '';
    const fData   = _q('#ac-filtro-data')?.value    || '';

    let lista = Storage.Restricoes.listar();

    if (fCurso)  lista = lista.filter(r => r.cursoId === fCurso);
    if (fTipo)   lista = lista.filter(r => r.tipo    === fTipo);
    if (fStatus) lista = lista.filter(r => _resolveSt(r) === fStatus);
    if (fData)   lista = lista.filter(r => r.dataExpira && r.dataExpira.slice(0, 10) >= fData);
    if (busca) {
      lista = lista.filter(r => {
        const curso = Storage.Cursos.obter(r.cursoId);
        const nome  = _nomeAlvo(r.tipo, r.refId);
        return curso?.titulo?.toLowerCase().includes(busca) || nome.toLowerCase().includes(busca);
      });
    }

    lista.sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0));

    const tbody = _q('#ac-tbody');
    const empty = _q('#ac-empty');
    const count = _q('#ac-count');

    if (count) count.textContent = `${lista.length} acesso(s)`;
    if (!lista.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = lista.map(r => _renderLinha(r)).join('');
  }

  /** Gera o HTML de uma linha da tabela para um acesso/restrição. */
  function _renderLinha(r) {
    const curso   = Storage.Cursos.obter(r.cursoId);
    const alvo    = _nomeAlvo(r.tipo, r.refId);
    const tipoCls = TIPO_BADGE[r.tipo] || 'badge-gray';
    const agora   = new Date();
    const expDiff = r.dataExpira
      ? Math.ceil((new Date(r.dataExpira) - agora) / 86400000)
      : null;
    const expCls  = expDiff !== null && expDiff < 0
      ? 'expirado-txt'
      : expDiff !== null && expDiff <= 7 ? 'vencendo' : '';

    const acaoBloqueio = _resolveSt(r) !== 'bloqueado'
      ? `<button onclick="AcessosMod.bloquear('${r.cursoId}','${r.tipo}','${r.refId}');AcessosMod._cm()">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Bloquear
         </button>`
      : `<button onclick="AcessosMod.ativar('${r.cursoId}','${r.tipo}','${r.refId}');AcessosMod._cm()">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          Ativar
         </button>`;

    return `<tr>
      <td>
        <div style="font-weight:600;font-size:13px;color:var(--text)">${_x(curso?.titulo || '—')}</div>
        <div style="font-size:11px;color:var(--text4)">${_x(curso?.categoria || '')}</div>
      </td>
      <td>
        <div style="font-size:13px;font-weight:500;color:var(--text)">${_x(alvo)}</div>
      </td>
      <td><span class="badge ${tipoCls}">${TIPO_LABEL[r.tipo] || r.tipo}</span></td>
      <td>
        <div class="gc-validade ${expCls}" style="font-size:12px">
          ${r.dataExpira
            ? _fmtExpira(r.dataExpira)
            : '<span style="color:var(--text4)">Sem validade</span>'}
        </div>
      </td>
      <td>${_stBadge(r)}</td>
      <td style="font-size:12px;color:var(--text4)">${_x(r.responsavel || 'Admin')}</td>
      <td>
        <div class="gc-actions">
          <button class="gc-actions-btn" onclick="AcessosMod._menu(this)">
            Ações
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="gc-menu">
            <button onclick="AcessosMod.abrirEdit('${r.cursoId}','${r.tipo}','${r.refId}');AcessosMod._cm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>
            <button onclick="AcessosMod.renovar('${r.cursoId}','${r.tipo}','${r.refId}');AcessosMod._cm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3.04"/></svg>
              Renovar
            </button>
            <hr class="sep">
            ${acaoBloqueio}
            <button class="danger" onclick="AcessosMod.revogar('${r.cursoId}','${r.tipo}','${r.refId}');AcessosMod._cm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              Revogar acesso
            </button>
          </div>
        </div>
      </td>
    </tr>`;
  }

  // ── Menu dropdown ───────────────────────────────────────────────
  function _menu(btn) {
    const m      = btn.nextElementSibling;
    const isOpen = m.classList.contains('open');
    _cm();
    if (!isOpen) {
      m.classList.add('open');
      setTimeout(() => document.addEventListener('click', _cm, { once: true }), 10);
    }
  }

  function _cm() {
    document.querySelectorAll('.gc-menu.open').forEach(m => m.classList.remove('open'));
  }

  // ── Painel de vencimentos próximos (30 dias) ────────────────────
  function renderVencimentos() {
    const wrap = document.getElementById('ac-vencimentos');
    if (!wrap) return;

    const agora = new Date();
    const em30  = new Date();
    em30.setDate(em30.getDate() + 30);

    const prox = Storage.Restricoes.listar()
      .filter(r =>
        r.dataExpira &&
        new Date(r.dataExpira) >= agora &&
        new Date(r.dataExpira) <= em30
      )
      .sort((a, b) => new Date(a.dataExpira) - new Date(b.dataExpira))
      .slice(0, 5);

    if (!prox.length) {
      wrap.innerHTML = '<div style="font-size:12px;color:var(--text4)">Nenhum vencimento nos próximos 30 dias.</div>';
      return;
    }

    wrap.innerHTML = prox.map(r => {
      const curso = Storage.Cursos.obter(r.cursoId);
      const alvo  = _nomeAlvo(r.tipo, r.refId);
      const diff  = Math.ceil((new Date(r.dataExpira) - agora) / 86400000);
      const cor   = diff <= 7 ? 'var(--red)' : 'var(--amber)';

      return `
        <div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)">
          <div style="width:6px;height:6px;border-radius:50%;background:${cor};margin-top:5px;flex-shrink:0"></div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_x(curso?.titulo || '—')}</div>
            <div style="font-size:11px;color:var(--text4)">${_x(alvo)} · ${diff === 1 ? 'amanhã' : diff + ' dias'}</div>
          </div>
        </div>`;
    }).join('');
  }

  // ── Histórico de ações ──────────────────────────────────────────
  function renderHistorico() {
    const wrap = document.getElementById('ac-historico');
    if (!wrap) return;

    const logs = Storage.LogAcessos.listar().slice(0, 8);

    if (!logs.length) {
      wrap.innerHTML = '<div style="font-size:12px;color:var(--text4)">Nenhuma ação registrada.</div>';
      return;
    }

    const ACAO_CFG = {
      liberou:  { cls: 'badge-green', label: 'Liberou'  },
      revogou:  { cls: 'badge-red',   label: 'Revogou'  },
      bloqueou: { cls: 'badge-amber', label: 'Bloqueou' },
      ativou:   { cls: 'badge-green', label: 'Ativou'   },
      renovou:  { cls: 'badge-blue',  label: 'Renovou'  },
      editou:   { cls: 'badge-blue',  label: 'Editou'   },
    };

    wrap.innerHTML = logs.map(l => {
      const curso = l.cursoId ? Storage.Cursos.obter(l.cursoId) : null;
      const cfg   = ACAO_CFG[l.acao] || { cls: 'badge-gray', label: l.acao };
      const diff  = Math.floor((Date.now() - new Date(l.ts)) / 60000);
      const tempo = diff < 1   ? 'Agora'
        : diff < 60            ? `${diff}min`
        : diff < 1440          ? `${Math.floor(diff / 60)}h`
        : _fmtDate(l.ts);

      return `
        <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)">
          <span class="badge ${cfg.cls}" style="flex-shrink:0;font-size:9px">${cfg.label}</span>
          <span style="flex:1;font-size:12px;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_x(curso?.titulo || '—')}</span>
          <span style="font-size:10px;color:var(--text4);flex-shrink:0">${tempo}</span>
        </div>`;
    }).join('');
  }

  return {
    renderStats, renderTabela, renderVencimentos, renderHistorico,
    setStatus, resetFiltros, _popularFiltroCurso, _menu, _cm,
  };
})();
