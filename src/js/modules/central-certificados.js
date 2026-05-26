/**
 * @fileoverview central-certificados.js — Módulo: Central de Certificados
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO ISOLADO — Central de Certificados EAD                    ║
 * ║                                                                  ║
 * ║  Responsabilidades:                                              ║
 * ║  • Stats/indicadores (emitidos, pendentes, expirados, vencendo) ║
 * ║  • Tabela com filtros (busca, status, curso, data, ordem)        ║
 * ║  • Painel de emissões pendentes (alunos elegíveis sem cert.)     ║
 * ║  • Painel de vencimentos próximos (30 dias)                      ║
 * ║  • Visualizador SVG do certificado                               ║
 * ║  • Impressão / download em nova janela                           ║
 * ║  • Emissão manual (por aluno e curso)                            ║
 * ║  • Emissão em lote (todos elegíveis de um curso)                 ║
 * ║  • Validação de certificado por código                           ║
 * ║  • Gestão de modelos visuais de certificado                      ║
 * ║  • Ações: reemitir, cancelar, excluir                            ║
 * ║                                                                  ║
 * ║  Contrato de entrada (dependências externas):                    ║
 * ║  • window.Storage  — camada de dados (storage.js)                ║
 * ║    └─ Storage.Certificados, Storage.Cursos, Storage.Alunos       ║
 * ║    └─ Storage.Progresso, Storage.Turmas                          ║
 * ║                                                                  ║
 * ║  Contrato de saída (API pública exposta em window.CertMod):      ║
 * ║  • init(), refresh(), renderTabela()                             ║
 * ║  • renderPendentes(), renderVencimentos()                        ║
 * ║  • setStatus(btn, value), resetFiltros()                         ║
 * ║  • visualizar(id), baixarCert(id), imprimirCert()                ║
 * ║  • reemitir(id), cancelar(id), excluir(id)                       ║
 * ║  • abrirEmissaoManual(alunoId?, cursoId?), salvarEmissao()       ║
 * ║  • abrirEmissaoLote(), previewLote(), executarLote()             ║
 * ║  • abrirValidar(), executarValidacao()                           ║
 * ║  • abrirModelos(), novoModelo(), salvarModelo()                  ║
 * ║  • _menu(btn), _cm()                                             ║
 * ║  • _emitirRapido(alunoId, cursoId)                               ║
 * ║  • _editarModelo(id), _excluirModelo(id)                         ║
 * ║                                                                  ║
 * ║  MIGRAÇÃO BACKEND: Apenas window.Storage precisa mudar.          ║
 * ║  Este módulo NÃO acessa localStorage diretamente.                ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * @module CentralCertificados
 * @version 1.0.0
 * @see docs/ARCHITECTURE.md
 */

/* global Storage */

var CertMod = (() => {
  'use strict';

  // ── Estado interno do módulo ──────────────────────────────────
  let _modeloEditId = null;  // ID do modelo em edição (null = novo)

  // ══════════════════════════════════════════════════════════════
  // UTILITÁRIOS INTERNOS
  // ══════════════════════════════════════════════════════════════

  /** Atalho para querySelector */
  function _q(sel) { return document.querySelector(sel); }

  /** Escapa HTML para evitar XSS */
  function _x(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
    });
  }

  function _fmtDateLong(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  }

  /**
   * Formata a data de validade de forma relativa ao momento atual.
   * @param {string|null} iso
   * @returns {string}
   */
  function _fmtRelative(iso) {
    if (!iso) return '';
    const diff = Math.ceil((new Date(iso) - Date.now()) / 86400000);
    if (diff < 0)   return `expirou ${-diff}d atrás`;
    if (diff === 0) return 'expira hoje';
    if (diff <= 30) return `expira em ${diff}d`;
    return _fmtDate(iso);
  }

  /** Helper para setar value de campo pelo ID */
  function _setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  }

  function _toast(msg, tipo = 'i') {
    const s = document.getElementById('toasts');
    if (!s) return;
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.innerHTML = `<span>${{ s: '✅', e: '❌', i: 'ℹ️' }[tipo] || 'ℹ️'}</span><span>${_x(msg)}</span>`;
    s.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  // ══════════════════════════════════════════════════════════════
  // STATUS
  // ══════════════════════════════════════════════════════════════

  const ST = {
    emitido:   { cls: 'badge-green', label: '● Emitido'   },
    pendente:  { cls: 'badge-blue',  label: '◎ Pendente'  },
    expirado:  { cls: 'badge-red',   label: '✕ Expirado'  },
    cancelado: { cls: 'badge-gray',  label: '■ Cancelado' },
  };

  function _stBadge(s) {
    const c = ST[s] || ST.pendente;
    return `<span class="badge ${c.cls}">${c.label}</span>`;
  }

  // ══════════════════════════════════════════════════════════════
  // CHIPS DE FILTRO
  // ══════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════
  // STATS
  // ══════════════════════════════════════════════════════════════

  function renderStats() {
    const wrap = document.getElementById('cert-stats');
    if (!wrap) return;

    const st   = Storage.Certificados.stats();
    const pend = Storage.Certificados.pendentesElegivel();

    const icoCert = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`;

    const card = (lbl, val, sub, cls = '') => `
      <div class="stat">
        <div class="stat-top">
          <div>
            <div class="stat-lbl">${lbl}</div>
            <div class="stat-val ${cls}">${val}</div>
          </div>
          <div class="stat-ico">${icoCert}</div>
        </div>
        <div class="stat-sub">${sub}</div>
      </div>`;

    wrap.innerHTML =
      card('Certificados', st.emitidos,  'emitidos',             'blue') +
      card('Pendentes',    pend,         'elegíveis sem cert.',  pend > 0 ? 'amber' : '') +
      card('Expirados',    st.expirados, 'vencidos',             st.expirados > 0 ? 'red' : '') +
      card('Vencendo',     st.vencendo,  'nos próximos 30d',     st.vencendo > 0 ? 'amber' : '') +
      card('Cancelados',   st.cancelados,'revogados');
  }

  // ══════════════════════════════════════════════════════════════
  // FILTRO DE CURSOS
  // ══════════════════════════════════════════════════════════════

  function _popularFiltroCurso() {
    const sel = document.getElementById('cert-filtro-curso');
    if (!sel) return;
    sel.innerHTML =
      '<option value="">Curso</option>' +
      Storage.Cursos.listar().map(c =>
        `<option value="${_x(c.id)}">${_x(c.titulo)}</option>`
      ).join('');
  }

  // ══════════════════════════════════════════════════════════════
  // TABELA PRINCIPAL
  // ══════════════════════════════════════════════════════════════

  function renderTabela() {
    const busca   = (_q('#cert-busca')?.value         || '').toLowerCase().trim();
    const fStatus = _q('#cert-filtro-status')?.value  || '';
    const fCurso  = _q('#cert-filtro-curso')?.value   || '';
    const fData   = _q('#cert-filtro-data')?.value    || '';
    const ordem   = _q('#cert-order')?.value          || 'recente';

    let lista = Storage.Certificados.listar();
    if (fStatus) lista = lista.filter(c => c.status === fStatus);
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

  // ══════════════════════════════════════════════════════════════
  // MENU DROPDOWN
  // ══════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════
  // PAINEL: PENDENTES
  // ══════════════════════════════════════════════════════════════

  /**
   * Renderiza o painel de alunos elegíveis que ainda não receberam certificado.
   */
  function renderPendentes() {
    const wrap = document.getElementById('cert-pendentes');
    if (!wrap) return;

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

    if (!pend.length) {
      wrap.innerHTML = '<div style="font-size:12px;color:var(--text4)">Nenhuma emissão pendente.</div>';
      return;
    }

    wrap.innerHTML =
      pend.slice(0, 6).map(({ al, cu }) => `
        <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_x(al.nome)}</div>
            <div style="font-size:10px;color:var(--text4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_x(cu.titulo)}</div>
          </div>
          <button onclick="CertMod._emitirRapido('${al.id}','${cu.id}')"
            style="background:var(--blue);color:#fff;border:none;border-radius:var(--radius-sm);padding:3px 8px;font-size:10px;font-weight:700;cursor:pointer;font-family:var(--font);white-space:nowrap">
            Emitir
          </button>
        </div>`).join('') +
      (pend.length > 6
        ? `<div style="font-size:11px;color:var(--text4);padding-top:6px">+${pend.length - 6} outros</div>`
        : '');
  }

  function _emitirRapido(alunoId, cursoId) {
    const cur = Storage.Cursos.obter(cursoId);
    Storage.Certificados.emitir({
      alunoId,
      cursoId,
      cargaHoraria:  cur?.carga || 0,
      dataConclucao: new Date().toISOString(),
    });
    _toast('Certificado emitido!', 's');
    refresh();
  }

  // ══════════════════════════════════════════════════════════════
  // PAINEL: VENCIMENTOS
  // ══════════════════════════════════════════════════════════════

  function renderVencimentos() {
    const wrap = document.getElementById('cert-vencimentos');
    if (!wrap) return;

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
      .sort((a, b) => new Date(a.dataValidade) - new Date(b.dataValidade))
      .slice(0, 5);

    if (!prox.length) {
      wrap.innerHTML = '<div style="font-size:12px;color:var(--text4)">Nenhum vencimento próximo.</div>';
      return;
    }

    wrap.innerHTML = prox.map(c => {
      const al   = Storage.Alunos.obter(c.alunoId);
      const diff = Math.ceil((new Date(c.dataValidade) - agora) / 86400000);
      const cor  = diff <= 7 ? 'var(--red)' : 'var(--amber)';
      return `
        <div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)">
          <div style="width:6px;height:6px;border-radius:50%;background:${cor};margin-top:4px;flex-shrink:0"></div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_x(al?.nome || '—')}</div>
            <div style="font-size:10px;color:var(--text4)">${diff === 1 ? 'amanhã' : diff + ' dias'}</div>
          </div>
        </div>`;
    }).join('');
  }

  // ══════════════════════════════════════════════════════════════
  // AÇÕES INDIVIDUAIS
  // ══════════════════════════════════════════════════════════════

  function reemitir(id) {
    const c = Storage.Certificados.reemitir(id);
    if (c) { _toast('Certificado reemitido com novo código!', 's'); refresh(); }
  }

  function cancelar(id) {
    if (!confirm('Cancelar este certificado?')) return;
    Storage.Certificados.cancelar(id);
    _toast('Certificado cancelado.', 'i');
    refresh();
  }

  function excluir(id) {
    if (!confirm('Excluir permanentemente?')) return;
    Storage.Certificados.excluir(id);
    _toast('Excluído.', 'i');
    refresh();
  }

  // ══════════════════════════════════════════════════════════════
  // VISUALIZADOR SVG
  // ══════════════════════════════════════════════════════════════

  function visualizar(id) {
    const c = Storage.Certificados.obter(id);
    if (!c) return;

    const codigoEl = document.getElementById('cv-codigo-badge');
    if (codigoEl) codigoEl.textContent = `📋 ${c.codigo}`;

    const renderEl = document.getElementById('cert-render');
    if (renderEl) renderEl.innerHTML = _renderCertSVG(id);

    const modal = document.getElementById('modal-cert-view');
    if (modal) {
      modal.classList.add('open');
      modal._certId = id;
    }
  }

  /**
   * Gera o HTML visual do certificado a partir dos dados do Storage.
   * @param {string} certId
   * @returns {string} HTML do certificado
   */
  function _renderCertSVG(certId) {
    const c   = Storage.Certificados.obter(certId);
    if (!c) return '';
    const al  = Storage.Alunos.obter(c.alunoId);
    const cur = Storage.Cursos.obter(c.cursoId);
    const m   = c.modeloId
      ? Storage.Certificados.listarModelos().find(m => m.id === c.modeloId)
      : null;

    const cor = m?.corPrimaria  || '#0002da';
    const org = m?.logoTexto    || 'Radar Internet';
    const sub = m?.subtitulo    || 'Plataforma EAD';
    const as1 = m?.assinatura1  || 'Diretor(a) de Operações';
    const ca1 = m?.cargo1       || 'Assinatura 1';
    const as2 = m?.assinatura2  || 'Coordenador(a) de T&D';
    const ca2 = m?.cargo2       || 'Assinatura 2';
    const rod = m?.textoRodape  || 'Este certificado atesta a conclusão do curso conforme registros da plataforma.';

    const nomeAluno = al?.nome    || '—';
    const nomeCurso = cur?.titulo || '—';
    const carga     = c.cargaHoraria || cur?.carga || 0;
    const dataConcl = _fmtDateLong(c.dataConclucao || c.dataEmissao);
    const dataEmiss = _fmtDate(c.dataEmissao);
    const validade  = c.dataValidade ? _fmtDate(c.dataValidade) : 'Sem validade';

    // QR-code simulado (grid de quadrados)
    const qrCells = Array.from({ length: 49 }, (_, i) => {
      const row = Math.floor(i / 7), col = i % 7;
      const corner = (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2);
      const fill   = corner || Math.random() > 0.45;
      return `<rect x="${col * 8 + 2}" y="${row * 8 + 2}" width="${fill ? 6 : 0}" height="${fill ? 6 : 0}" fill="${cor}" rx="1"/>`;
    }).join('');

    return `
      <div id="cert-printable" style="background:#fff;width:760px;min-height:540px;margin:0 auto;font-family:'DM Sans',sans-serif;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.12)">
        <div style="height:8px;background:${cor}"></div>
        <div style="padding:28px 40px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e8e8f5">
          <div>
            <div style="font-size:22px;font-weight:800;color:${cor};letter-spacing:-.5px">${_x(org)}</div>
            <div style="font-size:12px;color:#888;margin-top:2px">${_x(sub)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#aaa">Certificado de Conclusão</div>
            <div style="font-size:10px;color:#bbb;margin-top:3px">Emitido em ${_x(dataEmiss)}</div>
          </div>
        </div>
        <div style="padding:32px 40px;display:grid;grid-template-columns:1fr auto;gap:32px;align-items:start">
          <div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#aaa;margin-bottom:8px">Certificamos que</div>
            <div style="font-size:30px;font-weight:800;color:#111;letter-spacing:-.8px;line-height:1.15;margin-bottom:16px">${_x(nomeAluno)}</div>
            <div style="font-size:13px;color:#666;line-height:1.6;max-width:440px">
              concluiu com êxito o curso
              <strong style="color:#111">"${_x(nomeCurso)}"</strong>,
              com carga horária de <strong>${carga} horas</strong>,
              em <strong>${_x(dataConcl)}</strong>.
            </div>
            ${c.nota ? `<div style="margin-top:12px;display:inline-block;padding:4px 14px;background:${cor}15;border-radius:99px;font-size:12px;font-weight:700;color:${cor}">Nota final: ${c.nota}%</div>` : ''}
            <div style="display:flex;gap:40px;margin-top:36px">
              <div style="text-align:center">
                <div style="width:120px;border-top:1.5px solid #ccc;padding-top:6px">
                  <div style="font-size:12px;font-weight:600;color:#333">${_x(as1)}</div>
                  <div style="font-size:10px;color:#aaa">${_x(ca1)}</div>
                </div>
              </div>
              <div style="text-align:center">
                <div style="width:120px;border-top:1.5px solid #ccc;padding-top:6px">
                  <div style="font-size:12px;font-weight:600;color:#333">${_x(as2)}</div>
                  <div style="font-size:10px;color:#aaa">${_x(ca2)}</div>
                </div>
              </div>
            </div>
          </div>
          <div style="text-align:center;flex-shrink:0">
            <svg viewBox="0 0 60 60" width="80" height="80" style="display:block;margin:0 auto 8px;border:1.5px solid #eee;border-radius:6px;padding:4px;background:#fff">
              ${qrCells}
            </svg>
            <div style="font-size:9px;font-family:monospace;color:#999;letter-spacing:.04em;word-break:break-all;max-width:90px">${_x(c.codigo)}</div>
            <div style="font-size:9px;color:#ccc;margin-top:4px">Validade: ${_x(validade)}</div>
          </div>
        </div>
        <div style="padding:14px 40px;background:#fafafa;border-top:1px solid #eee;display:flex;align-items:center;justify-content:space-between">
          <div style="font-size:10px;color:#bbb;max-width:500px;line-height:1.5">${_x(rod)}</div>
          <div style="font-size:9px;color:#ddd;text-align:right;flex-shrink:0">ID: ${_x(c.id.slice(0, 8).toUpperCase())}</div>
        </div>
        <div style="height:4px;background:${cor}"></div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════
  // DOWNLOAD / IMPRESSÃO
  // ══════════════════════════════════════════════════════════════

  function baixarCert(id) {
    const c = Storage.Certificados.obter(id);
    if (!c) return;
    visualizar(id);
    setTimeout(() => imprimirCert(), 400);
  }

  function imprimirCert() {
    const area = document.getElementById('cert-printable');
    if (!area) return;
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>Certificado</title>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#f4f5fb; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:20px; }
        @media print {
          body { background:#fff; padding:0; }
          .no-print { display:none; }
        }
      </style>
    </head><body>
      <div class="no-print" style="position:fixed;top:16px;right:16px;z-index:9">
        <button onclick="window.print()" style="background:#0002da;color:#fff;border:none;border-radius:7px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer">
          Imprimir / Salvar PDF
        </button>
      </div>
      ${area.outerHTML}
    </body></html>`);
    w.document.close();
  }

  // ══════════════════════════════════════════════════════════════
  // EMISSÃO MANUAL
  // ══════════════════════════════════════════════════════════════

  function abrirEmissaoManual(alunoId, cursoId) {
    const alunos = Storage.Alunos.listar().filter(a => a.ativo);
    const cursos = Storage.Cursos.listar();

    const sA = document.getElementById('mce-aluno');
    const sC = document.getElementById('mce-curso');
    if (sA) sA.innerHTML =
      '<option value="">Selecione...</option>' +
      alunos.map(a =>
        `<option value="${_x(a.id)}" ${a.id === alunoId ? 'selected' : ''}>${_x(a.nome)}</option>`
      ).join('');
    if (sC) sC.innerHTML =
      '<option value="">Selecione...</option>' +
      cursos.map(c =>
        `<option value="${_x(c.id)}" ${c.id === cursoId ? 'selected' : ''}>${_x(c.titulo)}</option>`
      ).join('');

    _setVal('mce-conclusao', new Date().toISOString().slice(0, 10));
    _setVal('mce-validade', '');
    _setVal('mce-nota',     '');
    _setVal('mce-obs',      '');
    _setVal('mce-resp',     'Admin');

    document.getElementById('modal-cert-emitir')?.classList.add('open');
  }

  function salvarEmissao() {
    const alunoId = document.getElementById('mce-aluno')?.value;
    const cursoId = document.getElementById('mce-curso')?.value;
    if (!alunoId || !cursoId) { alert('Selecione aluno e curso.'); return; }

    const concl = document.getElementById('mce-conclusao')?.value;
    const val   = document.getElementById('mce-validade')?.value;
    const nota  = parseInt(document.getElementById('mce-nota')?.value) || 0;
    const cur   = Storage.Cursos.obter(cursoId);

    Storage.Certificados.emitir({
      alunoId,
      cursoId,
      cargaHoraria:  cur?.carga || 0,
      dataConclucao: concl ? new Date(concl).toISOString() : new Date().toISOString(),
      dataValidade:  val   ? new Date(val).toISOString()   : null,
      nota,
      responsavel:   document.getElementById('mce-resp')?.value.trim() || 'Admin',
      obs:           document.getElementById('mce-obs')?.value.trim()  || '',
    });

    _toast('Certificado emitido!', 's');
    document.getElementById('modal-cert-emitir')?.classList.remove('open');
    refresh();
  }

  // ══════════════════════════════════════════════════════════════
  // EMISSÃO EM LOTE
  // ══════════════════════════════════════════════════════════════

  function abrirEmissaoLote() {
    const sel    = document.getElementById('mlote-curso');
    const cursos = Storage.Cursos.listar().filter(c => c.status === 'publicado');
    if (sel) sel.innerHTML =
      '<option value="">Selecione...</option>' +
      cursos.map(c => `<option value="${_x(c.id)}">${_x(c.titulo)}</option>`).join('');

    const prev = document.getElementById('mlote-preview');
    if (prev) prev.style.display = 'none';

    document.getElementById('modal-cert-lote')?.classList.add('open');
  }

  function previewLote() {
    const cursoId = document.getElementById('mlote-curso')?.value;
    if (!cursoId) { alert('Selecione um curso.'); return; }

    const emitidos = new Set(
      Storage.Certificados.listar()
        .filter(c => c.status !== 'cancelado')
        .map(c => `${c.alunoId}:${c.cursoId}`)
    );
    const elegiveis = Storage.Alunos.listar().filter(a => {
      if (!a.ativo) return false;
      if (Storage.Progresso.pctCurso(a.id, cursoId) < 100) return false;
      if (emitidos.has(`${a.id}:${cursoId}`)) return false;
      return true;
    });

    const prev = document.getElementById('mlote-preview');
    if (!prev) return;
    prev.style.display = 'block';
    prev.innerHTML = elegiveis.length
      ? `Serão emitidos <strong style="color:var(--blue)">${elegiveis.length}</strong> certificado(s) para:<br>` +
        elegiveis.slice(0, 5).map(a => `• ${_x(a.nome)}`).join('<br>') +
        (elegiveis.length > 5 ? `<br>+ ${elegiveis.length - 5} outros` : '')
      : '<span style="color:var(--text4)">Nenhum aluno elegível encontrado para este curso.</span>';
  }

  function executarLote() {
    const cursoId  = document.getElementById('mlote-curso')?.value;
    if (!cursoId) { alert('Selecione um curso.'); return; }

    const nota     = parseInt(document.getElementById('mlote-nota')?.value)     || 0;
    const valDias  = parseInt(document.getElementById('mlote-validade')?.value) || 0;
    const resp     = document.getElementById('mlote-resp')?.value.trim()        || 'Admin';

    const emitidos = Storage.Certificados.emitirLote(cursoId, {
      notaMinima:   nota,
      validadeDias: valDias,
      responsavel:  resp,
    });

    _toast(`${emitidos.length} certificado(s) emitido(s)!`, emitidos.length > 0 ? 's' : 'i');
    document.getElementById('modal-cert-lote')?.classList.remove('open');
    refresh();
  }

  // ══════════════════════════════════════════════════════════════
  // VALIDAÇÃO DE CÓDIGO
  // ══════════════════════════════════════════════════════════════

  function abrirValidar() {
    _setVal('validar-codigo', '');
    const res = document.getElementById('validar-result');
    if (res) res.style.display = 'none';
    document.getElementById('modal-cert-validar')?.classList.add('open');
  }

  function executarValidacao() {
    const codigo = document.getElementById('validar-codigo')?.value.trim().toUpperCase();
    if (!codigo) { alert('Digite o código do certificado.'); return; }

    const c   = Storage.Certificados.porCodigo(codigo);
    const res = document.getElementById('validar-result');
    if (!res) return;
    res.style.display = 'block';

    if (!c) {
      res.innerHTML = `
        <div style="padding:14px;background:#fee2e2;border-radius:var(--radius-sm);border:1.5px solid #fca5a5">
          <div style="font-size:14px;font-weight:700;color:var(--red);margin-bottom:4px">❌ Certificado não encontrado</div>
          <div style="font-size:12px;color:var(--red)">O código informado não existe na base de dados.</div>
        </div>`;
      return;
    }

    const al    = Storage.Alunos.obter(c.alunoId);
    const cur   = Storage.Cursos.obter(c.cursoId);
    const clsBg  = c.status === 'emitido' ? '#d1fae5' : c.status === 'expirado' ? '#fee2e2' : '#fef3c7';
    const clsBo  = c.status === 'emitido' ? '#6ee7b7' : c.status === 'expirado' ? '#fca5a5' : '#fcd34d';
    const clsTxt = c.status === 'emitido' ? 'var(--green-dark)' : c.status === 'expirado' ? 'var(--red)' : 'var(--amber-dark)';
    const icon   = c.status === 'emitido' ? '✅' : c.status === 'expirado' ? '⚠️' : '❌';

    res.innerHTML = `
      <div style="padding:14px;background:${clsBg};border-radius:var(--radius-sm);border:1.5px solid ${clsBo}">
        <div style="font-size:14px;font-weight:700;color:${clsTxt};margin-bottom:8px">${icon} Certificado ${ST[c.status]?.label || c.status}</div>
        <div style="font-size:12px;color:var(--text);line-height:1.8">
          <strong>Aluno:</strong> ${_x(al?.nome || '—')}<br>
          <strong>Curso:</strong> ${_x(cur?.titulo || '—')}<br>
          <strong>Carga:</strong> ${c.cargaHoraria}h<br>
          <strong>Emitido:</strong> ${_fmtDate(c.dataEmissao)}<br>
          <strong>Validade:</strong> ${c.dataValidade ? _fmtDate(c.dataValidade) : 'Sem validade'}
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════
  // MODELOS DE CERTIFICADO
  // ══════════════════════════════════════════════════════════════

  function abrirModelos() {
    _renderModelos();
    document.getElementById('modal-cert-modelos')?.classList.add('open');
  }

  function _renderModelos() {
    const wrap = document.getElementById('modelos-lista');
    if (!wrap) return;

    const lista = Storage.Certificados.listarModelos();
    if (!lista.length) {
      wrap.innerHTML = '<div style="color:var(--text4);font-size:13px">Nenhum modelo cadastrado.</div>';
      return;
    }

    wrap.innerHTML = lista.map(m => `
      <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
        <div style="width:20px;height:20px;border-radius:4px;background:${m.corPrimaria || '#0002da'};flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;color:var(--text)">${_x(m.nome)}</div>
          <div style="font-size:11px;color:var(--text4)">${_x(m.logoTexto)}</div>
        </div>
        ${m.ativo ? '<span class="badge badge-green" style="font-size:9px">Ativo</span>' : ''}
        <button onclick="CertMod._editarModelo('${m.id}')" class="btn btn-ghost btn-sm">Editar</button>
        <button onclick="CertMod._excluirModelo('${m.id}')" class="btn btn-danger btn-sm">×</button>
      </div>`).join('');
  }

  function novoModelo() {
    _modeloEditId = null;
    ['mod-nome', 'mod-logo', 'mod-sub', 'mod-as1', 'mod-c1', 'mod-as2', 'mod-c2', 'mod-rodape'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    _setVal('mod-cor', '#0002da');
    const editor = document.getElementById('modelo-editor');
    if (editor) editor.style.display = 'block';
  }

  function _editarModelo(id) {
    _modeloEditId = id;
    const m = Storage.Certificados.listarModelos().find(m => m.id === id);
    if (!m) return;

    _setVal('mod-nome',   m.nome);
    _setVal('mod-logo',   m.logoTexto);
    _setVal('mod-sub',    m.subtitulo);
    _setVal('mod-as1',    m.assinatura1);
    _setVal('mod-c1',     m.cargo1);
    _setVal('mod-as2',    m.assinatura2);
    _setVal('mod-c2',     m.cargo2);
    _setVal('mod-rodape', m.textoRodape);
    _setVal('mod-cor',    m.corPrimaria || '#0002da');

    const editor = document.getElementById('modelo-editor');
    if (editor) editor.style.display = 'block';
  }

  function salvarModelo() {
    const nome = document.getElementById('mod-nome')?.value.trim();
    if (!nome) { alert('Informe o nome do modelo.'); return; }

    const dados = {
      nome,
      corPrimaria:  document.getElementById('mod-cor')?.value                 || '#0002da',
      logoTexto:    document.getElementById('mod-logo')?.value.trim()         || 'Radar Internet',
      subtitulo:    document.getElementById('mod-sub')?.value.trim()          || 'Plataforma EAD',
      assinatura1:  document.getElementById('mod-as1')?.value.trim()          || '',
      cargo1:       document.getElementById('mod-c1')?.value.trim()           || '',
      assinatura2:  document.getElementById('mod-as2')?.value.trim()          || '',
      cargo2:       document.getElementById('mod-c2')?.value.trim()           || '',
      textoRodape:  document.getElementById('mod-rodape')?.value.trim()       || '',
    };

    if (_modeloEditId) {
      Storage.Certificados.atualizarModelo(_modeloEditId, dados);
    } else {
      Storage.Certificados.criarModelo(dados);
    }

    const editor = document.getElementById('modelo-editor');
    if (editor) editor.style.display = 'none';

    _renderModelos();
    _toast('Modelo salvo!', 's');
    _modeloEditId = null;
  }

  function _excluirModelo(id) {
    if (!confirm('Excluir este modelo?')) return;
    Storage.Certificados.excluirModelo(id);
    _renderModelos();
  }

  // ══════════════════════════════════════════════════════════════
  // REFRESH E PONTO DE ENTRADA
  // ══════════════════════════════════════════════════════════════

  function refresh() {
    Storage.Certificados.sincronizar();
    renderStats();
    renderTabela();
    renderPendentes();
    renderVencimentos();
  }

  function init() {
    Storage.Certificados.sincronizar();
    if (!Storage.Certificados.listarModelos().length) {
      Storage.Certificados.criarModelo({ nome: 'Modelo Padrão' });
    }
    renderStats();
    renderTabela();
    renderPendentes();
    renderVencimentos();
    _popularFiltroCurso();
  }

  // ══════════════════════════════════════════════════════════════
  // API PÚBLICA DO MÓDULO
  // ══════════════════════════════════════════════════════════════
  return {
    // Ciclo de vida
    init,
    refresh,

    // Renderização
    renderTabela,
    renderPendentes,
    renderVencimentos,

    // Filtros
    setStatus,
    resetFiltros,

    // Visualização e download
    visualizar,
    baixarCert,
    imprimirCert,

    // Ações individuais
    reemitir,
    cancelar,
    excluir,

    // Emissão
    abrirEmissaoManual,
    salvarEmissao,
    abrirEmissaoLote,
    previewLote,
    executarLote,

    // Validação
    abrirValidar,
    executarValidacao,

    // Modelos
    abrirModelos,
    novoModelo,
    salvarModelo,

    // Menu
    _menu,
    _cm,

    // Internos chamados pelo HTML inline
    _emitirRapido,
    _editarModelo,
    _excluirModelo,
  };
})();
