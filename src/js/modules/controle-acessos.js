/**
 * @fileoverview controle-acessos.js — Módulo: Controle de Acessos
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO ISOLADO — Controle de Acessos EAD                        ║
 * ║                                                                  ║
 * ║  Responsabilidades:                                              ║
 * ║  • Stats/indicadores (ativos, expirados, bloqueados, cursos)     ║
 * ║  • Tabela com filtros (busca, status, curso, tipo, data)         ║
 * ║  • Painel de vencimentos próximos (30 dias)                      ║
 * ║  • Histórico de ações (log de acessos)                           ║
 * ║  • Modal de liberação/edição (3 tabs: alvo, período, regras)     ║
 * ║  • Seletor de escopo (global, colaborador, setor, equipe)        ║
 * ║  • Ações: bloquear, ativar, revogar, renovar (+30 dias)         ║
 * ║                                                                  ║
 * ║  Contrato de entrada (dependências externas):                    ║
 * ║  • window.Storage  — camada de dados (storage.js)                ║
 * ║    └─ Storage.Restricoes, Storage.LogAcessos                     ║
 * ║    └─ Storage.Cursos, Storage.Turmas, Storage.Alunos             ║
 * ║    └─ Storage.Setores, Storage.Equipes                           ║
 * ║                                                                  ║
 * ║  Contrato de saída (API pública exposta em window.AcessosMod):   ║
 * ║  • init(), refresh()                                             ║
 * ║  • renderTabela(), renderVencimentos(), renderHistorico()         ║
 * ║  • setStatus(btn, value), resetFiltros()                         ║
 * ║  • abrirModal(), abrirEdit(cursoId, tipo, refId), salvar()       ║
 * ║  • tabModal(idx, btn), setScope(btn)                             ║
 * ║  • bloquear(cursoId, tipo, refId)                                ║
 * ║  • ativar(cursoId, tipo, refId)                                  ║
 * ║  • revogar(cursoId, tipo, refId)                                 ║
 * ║  • renovar(cursoId, tipo, refId)                                 ║
 * ║  • addRestricao(cId) — compatibilidade legada                    ║
 * ║  • remRestricao(cId, tipo, refId) — compatibilidade legada       ║
 * ║  • _menu(btn), _cm()                                             ║
 * ║                                                                  ║
 * ║  MIGRAÇÃO BACKEND: Apenas window.Storage precisa mudar.          ║
 * ║  Este módulo NÃO acessa localStorage diretamente.                ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * @module ControleAcessos
 * @version 1.0.0
 * @see docs/ARCHITECTURE.md
 */

/* global Storage */

var AcessosMod = (() => {
  'use strict';

  // ── Estado interno do módulo ──────────────────────────────────
  let _editCtx    = null;      // { cursoId, tipo, refId } do acesso em edição
  let _scopeAtual = 'global';  // escopo selecionado no modal

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

  /**
   * Formata data ISO 8601 para pt-BR.
   * @param {string|null} iso
   * @returns {string}
   */
  function _fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
    });
  }

  /**
   * Formata a data de expiração de forma relativa ao momento atual.
   * @param {string|null} iso
   * @returns {string}
   */
  function _fmtExpira(iso) {
    if (!iso) return '—';
    const diff = Math.ceil((new Date(iso) - Date.now()) / 86400000);
    if (diff < 0)   return `Expirou ${-diff}d atrás`;
    if (diff === 0) return 'Expira hoje';
    if (diff <= 7)  return `Expira em ${diff}d`;
    return _fmtDate(iso);
  }

  /** Helper para setar value de campo pelo ID */
  function _setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  }

  /**
   * Controla visualmente um toggle on/off.
   * @param {string}  id
   * @param {boolean} on
   */
  function _setToggle(id, on) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('on', !!on);
    const span = el.querySelector('span');
    if (span) span.style.left = on ? '21px' : '3px';
    el.style.background = on ? 'var(--blue)' : 'var(--border2)';
  }

  /**
   * Exibe toast usando o container global #toasts.
   * @param {string} msg
   * @param {'s'|'e'|'i'} tipo
   */
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
  // CONFIGURAÇÕES VISUAIS DE STATUS E TIPO
  // ══════════════════════════════════════════════════════════════

  const ST = {
    ativo:     { cls: 'badge-green', label: '● Ativo'     },
    expirado:  { cls: 'badge-red',   label: '✕ Expirado'  },
    bloqueado: { cls: 'badge-amber', label: '■ Bloqueado' },
    pendente:  { cls: 'badge-blue',  label: '◎ Pendente'  },
  };

  const TIPO_LABEL = {
    colaborador: 'Individual',
    equipe:      'Equipe',
    setor:       'Setor',
    global:      'Global',
  };

  const TIPO_BADGE = {
    colaborador: 'badge-amber',
    equipe:      'badge-green',
    setor:       'badge-blue',
    global:      'badge-purple',
  };

  /**
   * Resolve o status efetivo da restrição considerando expiração.
   * @param {object} r — restrição
   * @returns {string}
   */
  function _resolveStatus(r) {
    let st = r.statusAcesso || 'ativo';
    if (st === 'ativo' && r.dataExpira && new Date(r.dataExpira) < new Date()) {
      st = 'expirado';
    }
    return st;
  }

  function _stBadge(r) {
    const st = _resolveStatus(r);
    const c  = ST[st] || ST.ativo;
    return `<span class="badge ${c.cls}">${c.label}</span>`;
  }

  // ══════════════════════════════════════════════════════════════
  // CHIPS DE FILTRO DE STATUS
  // ══════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════
  // STATS
  // ══════════════════════════════════════════════════════════════

  function renderStats() {
    const wrap = document.getElementById('ac-stats');
    if (!wrap) return;

    const st     = Storage.Restricoes.stats();
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

  // ══════════════════════════════════════════════════════════════
  // FILTRO DE CURSOS
  // ══════════════════════════════════════════════════════════════

  function _popularFiltroCurso() {
    const sel = document.getElementById('ac-filtro-curso');
    if (!sel) return;
    sel.innerHTML =
      '<option value="">Curso</option>' +
      Storage.Cursos.listar().map(c =>
        `<option value="${_x(c.id)}">${_x(c.titulo)}</option>`
      ).join('');
  }

  // ══════════════════════════════════════════════════════════════
  // HELPER: NOME DO ALVO
  // ══════════════════════════════════════════════════════════════

  /**
   * Resolve o nome exibível do alvo de um acesso (aluno, setor ou equipe).
   * @param {string} tipo
   * @param {string} refId
   * @returns {string}
   */
  function _nomeAlvo(tipo, refId) {
    if (tipo === 'setor')  return Storage.Setores.obter(refId)?.nome || refId;
    if (tipo === 'equipe') return Storage.Equipes.obter(refId)?.nome || refId;
    const al = Storage.Alunos.obter(refId);
    return al ? al.nome : refId;
  }

  // ══════════════════════════════════════════════════════════════
  // TABELA PRINCIPAL
  // ══════════════════════════════════════════════════════════════

  function renderTabela() {
    const busca   = (_q('#ac-busca')?.value         || '').toLowerCase().trim();
    const fStatus = _q('#ac-filtro-status')?.value  || '';
    const fCurso  = _q('#ac-filtro-curso')?.value   || '';
    const fTipo   = _q('#ac-filtro-tipo')?.value    || '';
    const fData   = _q('#ac-filtro-data')?.value    || '';

    let lista = Storage.Restricoes.listar();

    if (fCurso)  lista = lista.filter(r => r.cursoId === fCurso);
    if (fTipo)   lista = lista.filter(r => r.tipo    === fTipo);
    if (fStatus) lista = lista.filter(r => _resolveStatus(r) === fStatus);
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

  /**
   * Gera o HTML de uma linha da tabela para um acesso/restrição.
   * @param {object} r — restrição
   * @returns {string}
   */
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

    const acaoBloqueio = _resolveStatus(r) !== 'bloqueado'
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
  // AÇÕES INDIVIDUAIS
  // ══════════════════════════════════════════════════════════════

  function bloquear(cursoId, tipo, refId) {
    Storage.Restricoes.atualizar(cursoId, tipo, refId, { statusAcesso: 'bloqueado' });
    Storage.LogAcessos.registrar({ acao: 'bloqueou', cursoId, tipo, refId, responsavel: 'Admin' });
    _toast('Acesso bloqueado.', 'i');
    refresh();
  }

  function ativar(cursoId, tipo, refId) {
    Storage.Restricoes.atualizar(cursoId, tipo, refId, { statusAcesso: 'ativo' });
    Storage.LogAcessos.registrar({ acao: 'ativou', cursoId, tipo, refId, responsavel: 'Admin' });
    _toast('Acesso ativado!', 's');
    refresh();
  }

  function revogar(cursoId, tipo, refId) {
    if (!confirm('Revogar este acesso permanentemente?')) return;
    Storage.Restricoes.remover(cursoId, tipo, refId);
    Storage.LogAcessos.registrar({ acao: 'revogou', cursoId, tipo, refId, responsavel: 'Admin' });
    _toast('Acesso revogado.', 'i');
    refresh();
  }

  /**
   * Renova o acesso por 30 dias a partir de hoje.
   * @param {string} cursoId
   * @param {string} tipo
   * @param {string} refId
   */
  function renovar(cursoId, tipo, refId) {
    const nova = new Date();
    nova.setDate(nova.getDate() + 30);
    Storage.Restricoes.atualizar(cursoId, tipo, refId, {
      dataExpira:   nova.toISOString(),
      statusAcesso: 'ativo',
    });
    Storage.LogAcessos.registrar({ acao: 'renovou', cursoId, tipo, refId, responsavel: 'Admin' });
    _toast('Acesso renovado por 30 dias!', 's');
    refresh();
  }

  // ══════════════════════════════════════════════════════════════
  // PAINEL DE VENCIMENTOS PRÓXIMOS
  // ══════════════════════════════════════════════════════════════

  /**
   * Renderiza o painel lateral de acessos que vencem nos próximos 30 dias.
   */
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

  // ══════════════════════════════════════════════════════════════
  // HISTÓRICO DE AÇÕES
  // ══════════════════════════════════════════════════════════════

  /**
   * Renderiza o feed das últimas ações registradas no log de acessos.
   */
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

  // ══════════════════════════════════════════════════════════════
  // MODAL DE LIBERAÇÃO / EDIÇÃO
  // ══════════════════════════════════════════════════════════════

  function abrirModal() {
    _editCtx = null;

    const tituloEl = document.getElementById('mac-titulo');
    const subEl    = document.getElementById('mac-sub');
    if (tituloEl) tituloEl.textContent = 'Liberar Acesso';
    if (subEl)    subEl.textContent    = '';

    _resetModal();
    tabModal(0, document.querySelector('#modal-acesso .mc-tab'));
    document.getElementById('modal-acesso')?.classList.add('open');
  }

  function abrirEdit(cursoId, tipo, refId) {
    const r = Storage.Restricoes.listar()
      .find(r => r.cursoId === cursoId && r.tipo === tipo && r.refId === refId);
    if (!r) return;

    _editCtx = { cursoId, tipo, refId };

    const tituloEl = document.getElementById('mac-titulo');
    const subEl    = document.getElementById('mac-sub');
    if (tituloEl) tituloEl.textContent = 'Editar Acesso';
    if (subEl)    subEl.textContent    = `${TIPO_LABEL[tipo]} · ${_nomeAlvo(tipo, refId)}`;

    _resetModal();
    _popularCursoModal(cursoId);
    _popularTurmaModal(r.turmaId);

    // Ativa o escopo correto
    const scopeKey = tipo === 'colaborador' ? 'colaborador'
      : tipo === 'setor' ? 'setor'
      : tipo === 'equipe' ? 'equipe'
      : 'global';
    const scopeBtn = document.querySelector(`.mac-scope-btn[data-scope="${scopeKey}"]`);
    if (scopeBtn) setScope(scopeBtn);

    // Pré-seleciona o alvo após o DOM atualizar
    setTimeout(() => {
      const selId = `mac-${tipo === 'colaborador' ? 'colab' : tipo}-sel`;
      const sel   = document.getElementById(selId);
      if (sel) sel.value = refId;
    }, 50);

    // Preenche campos de período e configuração
    _setVal('mac-inicio',      r.dataInicio ? r.dataInicio.slice(0, 10) : '');
    _setVal('mac-expira',      r.dataExpira  ? r.dataExpira.slice(0, 10)  : '');
    _setVal('mac-prazo',       r.prazo       || 0);
    _setVal('mac-status',      r.statusAcesso || 'ativo');
    _setVal('mac-responsavel', r.responsavel  || 'Admin');

    _setToggle('mac-obrig',     r.obrigatorio);
    _setToggle('mac-renovauto', r.renovacaoAuto);

    tabModal(0, document.querySelector('#modal-acesso .mc-tab'));
    document.getElementById('modal-acesso')?.classList.add('open');
  }

  /**
   * Reseta todos os campos do modal para o estado inicial.
   */
  function _resetModal() {
    _scopeAtual = 'global';

    ['mac-colab-sel', 'mac-setor-sel', 'mac-equipe-sel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    _setVal('mac-inicio',      '');
    _setVal('mac-expira',      '');
    _setVal('mac-prazo',       0);
    _setVal('mac-status',      'ativo');
    _setVal('mac-responsavel', 'Admin');

    _popularCursoModal();
    _popularTurmaModal();
    _popularScopeSels();
    _renderToggleRegras({});

    // Reseta botões de escopo visualmente
    document.querySelectorAll('.mac-scope-btn').forEach(b => {
      b.style.background = 'var(--surface)';
      b.style.color      = 'var(--text3)';
    });
    const globalBtn = document.querySelector('.mac-scope-btn[data-scope="global"]');
    if (globalBtn) {
      globalBtn.style.background = 'var(--blue)';
      globalBtn.style.color      = '#fff';
    }

    // Mostra apenas o painel global
    ['mac-scope-global', 'mac-scope-colaborador', 'mac-scope-setor', 'mac-scope-equipe'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = id === 'mac-scope-global' ? 'block' : 'none';
    });
  }

  // ══════════════════════════════════════════════════════════════
  // SELECTS DO MODAL
  // ══════════════════════════════════════════════════════════════

  function _popularCursoModal(selectedId) {
    const sel = document.getElementById('mac-curso');
    if (!sel) return;
    sel.innerHTML =
      '<option value="">Selecione um curso...</option>' +
      Storage.Cursos.listar().map(c =>
        `<option value="${_x(c.id)}" ${c.id === selectedId ? 'selected' : ''}>${_x(c.titulo)}</option>`
      ).join('');
  }

  function _popularTurmaModal(selectedId) {
    const sel = document.getElementById('mac-turma');
    if (!sel) return;
    sel.innerHTML =
      '<option value="">Todas as turmas</option>' +
      Storage.Turmas.listar().map(t =>
        `<option value="${_x(t.id)}" ${t.id === selectedId ? 'selected' : ''}>${_x(t.nome)}</option>`
      ).join('');
  }

  /**
   * Popula todos os selects de escopo (colaborador, setor, equipe).
   */
  function _popularScopeSels() {
    // Colaboradores
    const sC = document.getElementById('mac-colab-sel');
    if (sC) {
      sC.innerHTML =
        '<option value="">Selecione...</option>' +
        Storage.Alunos.listar().filter(a => a.ativo).map(a =>
          `<option value="${_x(a.id)}">${_x(a.nome)} — ${_x(a.email)}</option>`
        ).join('');
    }

    // Setores
    const sSe = document.getElementById('mac-setor-sel');
    if (sSe) {
      sSe.innerHTML =
        '<option value="">Selecione...</option>' +
        Storage.Setores.listar().map(s =>
          `<option value="${_x(s.id)}">${_x(s.nome)}</option>`
        ).join('');
    }

    // Equipes
    const sEq = document.getElementById('mac-equipe-sel');
    if (sEq) {
      sEq.innerHTML =
        '<option value="">Selecione...</option>' +
        Storage.Equipes.listar().map(e =>
          `<option value="${_x(e.id)}">${_x(e.nome)}</option>`
        ).join('');
    }
  }

  /**
   * Renderiza os toggles de regras de acesso no modal.
   * @param {object} r — restrição existente (para pré-popular)
   */
  function _renderToggleRegras(r) {
    const wrap = document.getElementById('mac-regras-body');
    if (!wrap) return;

    const row = (id, lbl, desc, val) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px">${lbl}</div>
          <div style="font-size:11px;color:var(--text4)">${desc}</div>
        </div>
        <div id="${id}" class="toggle ${val ? 'on' : ''}"
          onclick="this.classList.toggle('on');this.querySelector('span').style.left=this.classList.contains('on')?'21px':'3px';this.style.background=this.classList.contains('on')?'var(--blue)':'var(--border2)'"
          style="position:relative;width:40px;height:22px;background:${val ? 'var(--blue)' : 'var(--border2)'};border-radius:11px;cursor:pointer;transition:background .2s;flex-shrink:0">
          <span style="position:absolute;top:3px;left:${val ? 21 : 3}px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></span>
        </div>
      </div>`;

    wrap.innerHTML =
      row('mac-obrig',     'Acesso obrigatório',  'O aluno deve acessar antes de avançar', r.obrigatorio) +
      row('mac-renovauto', 'Renovação automática', 'Renova automaticamente ao expirar',     r.renovacaoAuto);
  }

  // ══════════════════════════════════════════════════════════════
  // SELETOR DE ESCOPO
  // ══════════════════════════════════════════════════════════════

  /**
   * Alterna o escopo do acesso sendo configurado no modal.
   * @param {HTMLElement} btn — botão de escopo clicado
   */
  function setScope(btn) {
    _scopeAtual = btn.dataset.scope;

    document.querySelectorAll('.mac-scope-btn').forEach(b => {
      b.style.background = 'var(--surface)';
      b.style.color      = 'var(--text3)';
    });
    btn.style.background = 'var(--blue)';
    btn.style.color      = '#fff';

    ['global', 'colaborador', 'setor', 'equipe'].forEach(sc => {
      const el = document.getElementById(`mac-scope-${sc}`);
      if (el) el.style.display = sc === _scopeAtual ? 'block' : 'none';
    });
  }

  // ══════════════════════════════════════════════════════════════
  // TABS DO MODAL
  // ══════════════════════════════════════════════════════════════

  function tabModal(idx, btn) {
    document.querySelectorAll('#modal-acesso .mc-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
    document.querySelectorAll('#modal-acesso .mc-pane').forEach((p, i) => p.classList.toggle('active', i === idx));
  }

  // ══════════════════════════════════════════════════════════════
  // SALVAR ACESSO
  // ══════════════════════════════════════════════════════════════

  function salvar() {
    const cursoId = document.getElementById('mac-curso')?.value;
    if (!cursoId) { alert('Selecione um curso.'); return; }

    let tipo, refId;
    if (_scopeAtual === 'global') {
      tipo  = 'setor';
      refId = '__global__';
    } else if (_scopeAtual === 'colaborador') {
      tipo  = 'colaborador';
      refId = document.getElementById('mac-colab-sel')?.value;
      if (!refId) { alert('Selecione um colaborador.'); return; }
    } else if (_scopeAtual === 'setor') {
      tipo  = 'setor';
      refId = document.getElementById('mac-setor-sel')?.value;
      if (!refId) { alert('Selecione um setor.'); return; }
    } else {
      tipo  = 'equipe';
      refId = document.getElementById('mac-equipe-sel')?.value;
      if (!refId) { alert('Selecione uma equipe.'); return; }
    }

    const ini    = document.getElementById('mac-inicio')?.value;
    const exp    = document.getElementById('mac-expira')?.value;
    const getTog = id => document.getElementById(id)?.classList.contains('on') ?? false;

    const dados = {
      cursoId,
      tipo,
      refId,
      dataInicio:    ini ? new Date(ini).toISOString() : null,
      dataExpira:    exp ? new Date(exp).toISOString() : null,
      prazo:         parseInt(document.getElementById('mac-prazo')?.value)       || 0,
      statusAcesso:  document.getElementById('mac-status')?.value                || 'ativo',
      responsavel:   document.getElementById('mac-responsavel')?.value?.trim()   || 'Admin',
      obrigatorio:   getTog('mac-obrig'),
      renovacaoAuto: getTog('mac-renovauto'),
    };

    Storage.Restricoes.adicionar(dados);
    Storage.LogAcessos.registrar({
      acao:        _editCtx ? 'editou' : 'liberou',
      cursoId,
      tipo,
      refId,
      responsavel: dados.responsavel,
    });

    _toast(_editCtx ? 'Acesso atualizado!' : 'Acesso liberado!', 's');
    document.getElementById('modal-acesso')?.classList.remove('open');
    _editCtx = null;
    refresh();
  }

  // ══════════════════════════════════════════════════════════════
  // REFRESH E PONTO DE ENTRADA
  // ══════════════════════════════════════════════════════════════

  function refresh() {
    Storage.Restricoes.sincronizarStatus();
    renderStats();
    renderTabela();
    renderVencimentos();
    renderHistorico();
  }

  function init() {
    Storage.Restricoes.sincronizarStatus();
    renderStats();
    renderTabela();
    renderVencimentos();
    renderHistorico();
    _popularFiltroCurso();
  }

  // ══════════════════════════════════════════════════════════════
  // COMPATIBILIDADE COM ADMIN.JS LEGADO
  // ══════════════════════════════════════════════════════════════

  function addRestricao(cId) {
    const tipo  = _q('#ac-tipo')?.value;
    const refId = _q('#ac-ref')?.value;
    if (!refId) { _toast('Selecione um item', 'e'); return; }
    Storage.Restricoes.adicionar({ cursoId: cId, tipo, refId });
    Storage.LogAcessos.registrar({ acao: 'liberou', cursoId: cId, tipo, refId });
    _toast('Restrição adicionada!', 's');
    refresh();
  }

  function remRestricao(cId, tipo, refId) {
    Storage.Restricoes.remover(cId, tipo, refId);
    Storage.LogAcessos.registrar({ acao: 'revogou', cursoId: cId, tipo, refId });
    refresh();
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
    renderVencimentos,
    renderHistorico,

    // Filtros
    setStatus,
    resetFiltros,

    // Modal
    abrirModal,
    abrirEdit,
    salvar,
    tabModal,
    setScope,

    // Ações individuais
    bloquear,
    ativar,
    revogar,
    renovar,

    // Menu
    _menu,
    _cm,

    // Compatibilidade legada
    addRestricao,
    remRestricao,
  };
})();
