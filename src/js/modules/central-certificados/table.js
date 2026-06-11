/**
 * table.js — Stats, filtros, tabela e painéis laterais (Certificados).
 * Responsabilidade: renderização da listagem/indicadores e filtros
 * (sem CRUD, sem modal, sem geração de PDF/SVG).
 *
 * @module CertTable
 */

/* global Storage, CertUtils */

var CertTable = (() => {
  'use strict';

  const _q          = CertUtils.q;
  const _x          = CertUtils.x;
  const _fmtDate    = CertUtils.fmtDate;
  const _fmtRelative= CertUtils.fmtRelative;
  const _stBadge    = CertUtils.stBadge;

  // ── CHIPS DE FILTRO ───────────────────────────────────────────
  const CHIP_CLS = {
    '':        '',
    emitido:   'active-pub',
    pendente:  'active-rev',
    expirado:  'active-exp',
    cancelado: 'active-ras',
  };

  function setStatus(btn, value) {
    document.querySelectorAll('.ift-chip[data-cest]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
    });
    if (value && CHIP_CLS[value]) btn.classList.add(CHIP_CLS[value]);
    const sel = document.getElementById('cert-filtro-status');
    if (sel) sel.value = value;
    renderTabela();
    _badge();
  }

  function resetFiltros() {
    ['cert-busca', 'cert-filtro-status', 'cert-filtro-curso', 'cert-filtro-data'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const ord = document.getElementById('cert-order');
    if (ord) ord.value = 'recente';
    document.querySelectorAll('.ift-chip[data-cest]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
    });
    renderTabela();
    _badge();
  }

  function _badge() {
    const b = document.getElementById('cert-badge');
    if (!b) return;
    let n = 0;
    ['cert-busca', 'cert-filtro-status', 'cert-filtro-curso', 'cert-filtro-data']
      .forEach(id => { if (document.getElementById(id)?.value?.trim()) n++; });
    b.textContent = n;
    b.classList.toggle('show', n > 0);
  }

  // ── STATS ─────────────────────────────────────────────────────
  function renderStats() {}

  // ── FILTRO DE CURSOS ──────────────────────────────────────────
  function _popularFiltroCurso() {
    const sel = document.getElementById('cert-filtro-curso');
    if (!sel) return;
    sel.innerHTML =
      '<option value="">Curso</option>' +
      Storage.Cursos.listar().map(c =>
        `<option value="${_x(c.id)}">${_x(c.titulo)}</option>`
      ).join('');
  }

  // ── TABELA PRINCIPAL ──────────────────────────────────────────
  function renderTabela() {
    const busca   = (_q('#cert-busca')?.value         || '').toLowerCase().trim();
    const fStatus = _q('#cert-filtro-status')?.value  || '';
    const fCurso  = _q('#cert-filtro-curso')?.value   || '';
    const fData   = _q('#cert-filtro-data')?.value    || '';
    const ordem   = _q('#cert-order')?.value          || 'recente';

    let lista = Storage.Certificados.listar().filter(c => c.status === 'pendente');
    if (fCurso)  lista = lista.filter(c => c.cursoId === fCurso);
    if (fData)   lista = lista.filter(c => c.dataEmissao && c.dataEmissao.slice(0, 10) >= fData);
    if (busca) {
      lista = lista.filter(c => {
        const al  = Storage.Alunos.obter(c.alunoId);
        const cur = Storage.Cursos.obter(c.cursoId);
        return al?.nome?.toLowerCase().includes(busca) ||
               cur?.titulo?.toLowerCase().includes(busca) ||
               c.codigo?.toLowerCase().includes(busca);
      });
    }

    lista.sort((a, b) => {
      if (ordem === 'az') {
        return (Storage.Alunos.obter(a.alunoId)?.nome || '').localeCompare(
          Storage.Alunos.obter(b.alunoId)?.nome || ''
        );
      }
      if (ordem === 'antigo') return new Date(a.dataEmissao) - new Date(b.dataEmissao);
      return new Date(b.dataEmissao || 0) - new Date(a.dataEmissao || 0);
    });

    const tbody = _q('#cert-tbody');
    const empty = _q('#cert-empty');
    const count = _q('#cert-count');

    if (count) count.textContent = `${lista.length} certificado(s)`;
    if (!lista.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = lista.map(c => _renderLinha(c)).join('');
  }

  /**
   * Gera o HTML de uma linha da tabela para um certificado.
   * @param {object} c — certificado
   * @returns {string}
   */
  function _renderLinha(c) {
    const al    = Storage.Alunos.obter(c.alunoId);
    const cur   = Storage.Cursos.obter(c.cursoId);
    const agora = new Date();
    const expDiff = c.dataValidade
      ? Math.ceil((new Date(c.dataValidade) - agora) / 86400000)
      : null;
    const expCls = expDiff !== null && expDiff < 0 ? 'expirado-txt'
      : expDiff !== null && expDiff <= 30 ? 'vencendo' : '';

    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--blue-light);color:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;flex-shrink:0">
            ${(al?.nome?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text)">${_x(al?.nome || '—')}</div>
            <div style="font-size:11px;color:var(--text4)">${_x(al?.email || '')}</div>
          </div>
        </div>
      </td>
      <td>
        <div style="font-size:13px;font-weight:500;color:var(--text);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_x(cur?.titulo || '—')}</div>
        <div style="font-size:11px;color:var(--text4)">${c.cargaHoraria || 0}h</div>
      </td>
      <td style="text-align:center;font-size:12px;font-weight:600">${c.cargaHoraria || 0}h</td>
      <td>
        <code style="font-size:10px;background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:2px 6px;color:var(--text3);letter-spacing:.04em">${_x(c.codigo)}</code>
      </td>
      <td style="font-size:11px;color:var(--text4)">${_fmtDate(c.dataEmissao)}</td>
      <td>
        <div class="gc-validade ${expCls}" style="font-size:12px">
          ${c.dataValidade
            ? _fmtRelative(c.dataValidade)
            : '<span style="color:var(--text4)">Sem validade</span>'}
        </div>
      </td>
      <td>${_stBadge(c.status)}</td>
      <td>
        <div class="gc-actions">
          <button class="gc-actions-btn" onclick="CertMod._menu(this)">
            Ações
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="gc-menu">
            <button onclick="CertMod.visualizar('${c.id}');CertMod._cm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Visualizar
            </button>
            <button onclick="CertMod.baixarCert('${c.id}');CertMod._cm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Baixar
            </button>
            <button onclick="CertMod.reemitir('${c.id}');CertMod._cm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3.04"/></svg>
              Reemitir
            </button>
            <hr class="sep">
            <button onclick="CertMod.cancelar('${c.id}');CertMod._cm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              Cancelar
            </button>
            <button class="danger" onclick="CertMod.excluir('${c.id}');CertMod._cm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              Excluir
            </button>
          </div>
        </div>
      </td>
    </tr>`;
  }

  // ── MENU DROPDOWN ─────────────────────────────────────────────
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

  // ── TABELA: PENDENTES ─────────────────────────────────────────
  function renderPendentes() {
    const tbody  = document.getElementById('cert-pend-tbody');
    const empty  = document.getElementById('cert-pend-empty');
    const count  = document.getElementById('cert-pend-count');
    if (!tbody) return;

    const cursos   = Storage.Cursos.listar().filter(c => c.status === 'publicado');
    const emitidos = new Set(
      Storage.Certificados.listar()
        .filter(c => c.status !== 'cancelado')
        .map(c => `${c.alunoId}:${c.cursoId}`)
    );

    const pend = [];
    Storage.Alunos.listar().filter(a => a.ativo).forEach(al => {
      cursos.forEach(cu => {
        if (
          Storage.Progresso.pctCurso(al.id, cu.id) === 100 &&
          !emitidos.has(`${al.id}:${cu.id}`)
        ) {
          pend.push({ al, cu });
        }
      });
    });

    if (count) count.textContent = `${pend.length} pendente(s)`;
    if (!pend.length) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = pend.map(({ al, cu }) => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:28px;height:28px;border-radius:50%;background:var(--blue-light);color:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;flex-shrink:0">
              ${(al.nome?.[0] || '?').toUpperCase()}
            </div>
            <div style="font-size:13px;font-weight:600;color:var(--text)">${_x(al.nome)}</div>
          </div>
        </td>
        <td style="font-size:13px;color:var(--text)">${_x(cu.titulo)}</td>
        <td>
          <button onclick="CertMod._emitirRapido('${al.id}','${cu.id}')"
            style="background:var(--blue);color:#fff;border:none;border-radius:var(--radius-sm);padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font);white-space:nowrap">
            Emitir
          </button>
        </td>
      </tr>`).join('');
  }

  // ── TABELA: VENCIMENTOS ───────────────────────────────────────
  function renderVencimentos() {
    const tbody = document.getElementById('cert-venc-tbody');
    const empty = document.getElementById('cert-venc-empty');
    const count = document.getElementById('cert-venc-count');
    if (!tbody) return;

    const agora = new Date();
    const em30  = new Date();
    em30.setDate(em30.getDate() + 30);

    const prox = Storage.Certificados.listar()
      .filter(c =>
        c.status === 'emitido' &&
        c.dataValidade &&
        new Date(c.dataValidade) > agora &&
        new Date(c.dataValidade) <= em30
      )
      .sort((a, b) => new Date(a.dataValidade) - new Date(b.dataValidade));

    if (count) count.textContent = `${prox.length} vencimento(s)`;
    if (!prox.length) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = prox.map(c => {
      const al   = Storage.Alunos.obter(c.alunoId);
      const cur  = Storage.Cursos.obter(c.cursoId);
      const diff = Math.ceil((new Date(c.dataValidade) - agora) / 86400000);
      const cor  = diff <= 7 ? 'var(--red)' : 'var(--amber)';
      return `<tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:28px;height:28px;border-radius:50%;background:var(--blue-light);color:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;flex-shrink:0">
              ${(al?.nome?.[0] || '?').toUpperCase()}
            </div>
            <div style="font-size:13px;font-weight:600;color:var(--text)">${_x(al?.nome || '—')}</div>
          </div>
        </td>
        <td style="font-size:13px;color:var(--text)">${_x(cur?.titulo || '—')}</td>
        <td><code style="font-size:10px;background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:2px 6px;color:var(--text3);letter-spacing:.04em">${_x(c.codigo)}</code></td>
        <td style="font-size:12px;color:var(--text4)">${_fmtDate(c.dataValidade)}</td>
        <td><span style="font-size:12px;font-weight:600;color:${cor}">${diff === 1 ? 'amanhã' : diff + ' dias'}</span></td>
      </tr>`;
    }).join('');
  }

  return {
    renderStats, renderTabela, renderPendentes, renderVencimentos,
    setStatus, resetFiltros, _popularFiltroCurso, _menu, _cm,
  };
})();
