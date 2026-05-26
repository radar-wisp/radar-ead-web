/**
 * @fileoverview gestao-alunos.js — Módulo: Gestão de Alunos / Colaboradores
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO ISOLADO — Gestão de Alunos                               ║
 * ║                                                                  ║
 * ║  Responsabilidades:                                              ║
 * ║  • Stats/indicadores (total, ativos, pendentes, bloqueados)      ║
 * ║  • Tabela com filtros (busca, status, setor, equipe, ordem)      ║
 * ║  • Modal de criação e edição (3 tabs: dados, org, acesso)        ║
 * ║  • Perfil completo do aluno (3 tabs: info, cursos, histórico)    ║
 * ║  • Ações: bloquear, ativar, resetar senha, excluir, vincular     ║
 * ║  • Gerenciamento de Setores e Equipes                            ║
 * ║                                                                  ║
 * ║  Contrato de entrada (dependências externas):                    ║
 * ║  • window.Storage  — camada de dados (storage.js)                ║
 * ║    └─ Storage.Alunos, Storage.Setores, Storage.Equipes           ║
 * ║    └─ Storage.Cursos, Storage.Turmas, Storage.Progresso          ║
 * ║    └─ Storage.Restricoes, Storage.Respostas                      ║
 * ║                                                                  ║
 * ║  Contrato de saída (API pública exposta em window.AlunosMod):    ║
 * ║  • init(), refresh(), renderTabela(), renderSetoresEquipes()      ║
 * ║  • setStatus(btn, value), resetFiltros()                         ║
 * ║  • abrirModal(), abrirEdit(id), salvar(), tabModal(idx, btn)     ║
 * ║  • verPerfil(id), tabPerfil(idx, btn)                            ║
 * ║  • resetarSenhaModal(), alternarBloqueio()                       ║
 * ║  • abrirSetores(), criarSetor(), criarEquipe()                   ║
 * ║  • delSetor(id), delEquipe(id)                                   ║
 * ║  • bloquear(id), ativar(id), resetarSenha(id)                    ║
 * ║  • excluir(id), vincularTurma(alunoId)                           ║
 * ║  • toggleColab(id, ativo)                                        ║
 * ║  • _menu(btn), _cm(), _loadEquipes()                             ║
 * ║                                                                  ║
 * ║  MIGRAÇÃO BACKEND: Apenas window.Storage precisa mudar.          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * @module GestaoAlunos
 * @version 1.0.0
 * @see docs/ARCHITECTURE.md
 */

/* global Storage */

var AlunosMod = (() => {
  'use strict';

  // ── Estado interno do módulo ──────────────────────────────────
  let _editId   = null;  // ID do aluno sendo editado (null = novo)
  let _perfilId = null;  // ID do aluno sendo visualizado no perfil
  let _progCache = null; // Cache de progresso por ciclo de renderTabela()

  // ══════════════════════════════════════════════════════════════
  // UTILITÁRIOS INTERNOS
  // ══════════════════════════════════════════════════════════════

  /** Atalho para querySelector */
  function _q(sel) { return document.querySelector(sel); }

  /* global EadUtils */

  // Aliases locais para EadUtils (mantém nomes internos intactos)
  const _x           = EadUtils.escapeHtml;
  const _fmtDate     = EadUtils.fmtDate;
  const _fmtRelative = EadUtils.fmtRelative;
  const _toast       = EadUtils.toast;


  // ══════════════════════════════════════════════════════════════
  // CONFIGURAÇÕES VISUAIS DE STATUS
  // ══════════════════════════════════════════════════════════════

  const ST_CFG = {
    ativo:     { cls: 'badge-green', label: '● Ativo'     },
    pendente:  { cls: 'badge-blue',  label: '◎ Pendente'  },
    bloqueado: { cls: 'badge-red',   label: '✕ Bloqueado' },
    inativo:   { cls: 'badge-gray',  label: '▣ Inativo'   },
  };

  function _stBadge(al) {
    const st = al.statusAcesso || (al.ativo ? 'ativo' : 'bloqueado');
    const c  = ST_CFG[st] || ST_CFG.ativo;
    return `<span class="badge ${c.cls}">${c.label}</span>`;
  }

  // ══════════════════════════════════════════════════════════════
  // CHIPS DE FILTRO DE STATUS
  // ══════════════════════════════════════════════════════════════

  const CHIP_CLS = {
    '':        '',
    ativo:     'active-pub',
    pendente:  'active-rev',
    bloqueado: 'active-exp',
    inativo:   'active-ras',
  };

  function setStatus(btn, value) {
    document.querySelectorAll('.ift-chip[data-alst]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
    });
    if (value && CHIP_CLS[value]) btn.classList.add(CHIP_CLS[value]);
    const sel = document.getElementById('al-filtro-status');
    if (sel) sel.value = value;
    renderTabela();
    _badge();
  }

  function resetFiltros() {
    ['al-busca', 'al-filtro-status', 'al-filtro-setor', 'al-filtro-equipe'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const ord = document.getElementById('al-order');
    if (ord) ord.value = 'recente';
    document.querySelectorAll('.ift-chip[data-alst]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
    });
    renderTabela();
    _badge();
  }

  function _badge() {
    const b = document.getElementById('al-badge');
    if (!b) return;
    let n = 0;
    ['al-busca', 'al-filtro-status', 'al-filtro-setor', 'al-filtro-equipe']
      .forEach(id => { if (document.getElementById(id)?.value?.trim()) n++; });
    b.textContent = n;
    b.classList.toggle('show', n > 0);
  }

  // ══════════════════════════════════════════════════════════════
  // STATS
  // ══════════════════════════════════════════════════════════════

  function renderStats() {
    const wrap = document.getElementById('al-stats');
    if (!wrap) return;

    const st           = Storage.Alunos.stats();
    const cursosAtivos = Storage.Cursos.listar().filter(c => c.status === 'publicado').length;

    const icoAlunos = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;

    const card = (lbl, val, sub, cls = '') => `
      <div class="stat">
        <div class="stat-top">
          <div>
            <div class="stat-lbl">${lbl}</div>
            <div class="stat-val ${cls}">${val}</div>
          </div>
          <div class="stat-ico">${icoAlunos}</div>
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

  // ══════════════════════════════════════════════════════════════
  // FILTROS
  // ══════════════════════════════════════════════════════════════

  function _popularFiltros() {
    const sS = document.getElementById('al-filtro-setor');
    const sE = document.getElementById('al-filtro-equipe');
    if (sS) {
      sS.innerHTML =
        '<option value="">Setor</option>' +
        Storage.Setores.listar().map(s =>
          `<option value="${_x(s.id)}">${_x(s.nome)}</option>`
        ).join('');
    }
    if (sE) {
      sE.innerHTML =
        '<option value="">Equipe</option>' +
        Storage.Equipes.listar().map(e =>
          `<option value="${_x(e.id)}">${_x(e.nome)}</option>`
        ).join('');
    }
  }

  // ══════════════════════════════════════════════════════════════
  // TABELA PRINCIPAL
  // ══════════════════════════════════════════════════════════════

  function renderTabela() {
    _progCache = new Map(); // inicia cache para este ciclo
    const busca   = (_q('#al-busca')?.value          || '').toLowerCase().trim();
    const fStatus = _q('#al-filtro-status')?.value   || '';
    const fSetor  = _q('#al-filtro-setor')?.value    || '';
    const fEquipe = _q('#al-filtro-equipe')?.value   || '';
    const ordem   = _q('#al-order')?.value           || 'recente';

    let lista = Storage.Alunos.listar();

    if (busca)   lista = lista.filter(a =>
      a.nome?.toLowerCase().includes(busca) ||
      a.email?.toLowerCase().includes(busca) ||
      a.matricula?.toLowerCase().includes(busca)
    );
    if (fStatus) lista = lista.filter(a =>
      (a.statusAcesso || (a.ativo ? 'ativo' : 'bloqueado')) === fStatus
    );
    if (fSetor)  lista = lista.filter(a => a.setorId  === fSetor);
    if (fEquipe) lista = lista.filter(a => a.equipeId === fEquipe);

    lista.sort((a, b) => {
      if (ordem === 'az')        return (a.nome || '').localeCompare(b.nome || '');
      if (ordem === 'za')        return (b.nome || '').localeCompare(a.nome || '');
      if (ordem === 'progresso') return _progGeral(b.id) - _progGeral(a.id);
      return new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0);
    });

    const tbody = _q('#al-tbody');
    const empty = _q('#al-empty');
    const count = _q('#al-count');

    if (count) count.textContent = `${lista.length} aluno(s)`;
    if (!lista.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    const setores = Storage.Setores.listar();
    const equipes = Storage.Equipes.listar();

    tbody.innerHTML = lista.map(al => _renderLinha(al, setores, equipes)).join('');
    _progCache = null; // libera cache após render
  }

  /**
   * Gera o HTML de uma linha da tabela para um aluno.
   * @param {object} al      — aluno
   * @param {Array}  setores — lista de setores (cache)
   * @param {Array}  equipes — lista de equipes (cache)
   * @returns {string}
   */
  function _renderLinha(al, setores, equipes) {
    const setor   = al.setorId  ? setores.find(s => s.id === al.setorId)  : null;
    const equipe  = al.equipeId ? equipes.find(e => e.id === al.equipeId) : null;
    const prog    = _progGeral(al.id);
    const nCursos = _cursosDoAluno(al.id).length;

    const orgHtml = setor || equipe
      ? `${setor  ? `<span class="badge badge-blue"  style="margin-bottom:3px;display:block;width:fit-content">${_x(setor.nome)}</span>`  : ''}
         ${equipe ? `<span class="badge badge-green" style="display:block;width:fit-content">${_x(equipe.nome)}</span>` : ''}`
      : '<span style="color:var(--text4);font-size:12px">—</span>';

    const acaoBloqueio = al.ativo
      ? `<button onclick="AlunosMod.bloquear('${al.id}');AlunosMod._cm()">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Bloquear
         </button>`
      : `<button onclick="AlunosMod.ativar('${al.id}');AlunosMod._cm()">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          Ativar
         </button>`;

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
      <td>${_stBadge(al)}</td>
      <td style="font-size:11px;color:var(--text4)">${_fmtRelative(al.ultimoAcesso)}</td>
      <td>
        <div class="gc-actions">
          <button class="gc-actions-btn" onclick="AlunosMod._menu(this)">
            Ações
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="gc-menu">
            <button onclick="AlunosMod.verPerfil('${al.id}');AlunosMod._cm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Visualizar perfil
            </button>
            <button onclick="AlunosMod.abrirEdit('${al.id}');AlunosMod._cm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>
            <button onclick="AlunosMod.vincularTurma('${al.id}');AlunosMod._cm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              Vincular turma
            </button>
            <hr class="sep">
            <button onclick="AlunosMod.resetarSenha('${al.id}');AlunosMod._cm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              Resetar senha
            </button>
            ${acaoBloqueio}
            <hr class="sep">
            <button class="danger" onclick="AlunosMod.excluir('${al.id}');AlunosMod._cm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              Excluir
            </button>
          </div>
        </div>
      </td>
    </tr>`;
  }

  // ══════════════════════════════════════════════════════════════
  // HELPERS DE CÁLCULO
  // ══════════════════════════════════════════════════════════════

  /**
   * Calcula o progresso geral do aluno em todos os cursos publicados.
   * @param {string} alunoId
   * @returns {number} 0–100
   */
  /**
   * Calcula o progresso geral do aluno em todos os cursos publicados.
   * Usa _progCache quando disponível (ciclo de renderTabela) para evitar O(n²).
   * @param {string} alunoId
   * @returns {number} 0–100
   */
  function _progGeral(alunoId) {
    if (_progCache && _progCache.has(alunoId)) return _progCache.get(alunoId);
    const cursos = Storage.Cursos.listar().filter(c => c.status === 'publicado');
    if (!cursos.length) return 0;
    const soma = cursos.reduce((acc, c) => acc + Storage.Progresso.pctCurso(alunoId, c.id), 0);
    const result = Math.round(soma / cursos.length);
    if (_progCache) _progCache.set(alunoId, result);
    return result;
  }

  /**
   * Retorna os cursos acessíveis para um aluno (publicados + respeitando restrições).
   * @param {string} alunoId
   * @returns {Array}
   */
  function _cursosDoAluno(alunoId) {
    const al = Storage.Alunos.obter(alunoId);
    return Storage.Cursos.listar().filter(c => {
      const rest = Storage.Restricoes.porCurso(c.id);
      if (!rest.length) return c.status === 'publicado';
      return rest.some(r =>
        (r.tipo === 'colaborador' && r.refId === alunoId) ||
        (r.tipo === 'setor'       && r.refId === al?.setorId) ||
        (r.tipo === 'equipe'      && r.refId === al?.equipeId)
      );
    });
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

  function bloquear(id) {
    Storage.Alunos.bloquear(id);
    _toast('Aluno bloqueado.', 'i');
    refresh();
  }

  function ativar(id) {
    Storage.Alunos.ativar(id);
    _toast('Aluno ativado!', 's');
    refresh();
  }

  function resetarSenha(id) {
    if (!confirm('Resetar a senha para "123456"?')) return;
    Storage.Alunos.resetarSenha(id);
    _toast('Senha resetada para 123456.', 'i');
  }

  /**
   * Exclui permanentemente um aluno.
   * TODO MIGRAÇÃO: Storage.Alunos.excluir() deve chamar DELETE /api/v1/alunos/:id
   * @param {string} id
   */
  function excluir(id) {
    if (!confirm('Excluir aluno permanentemente?')) return;
    Storage.Alunos.excluir(id);
    _toast('Aluno excluído.', 'i');
    refresh();
  }

  function vincularTurma(alunoId) {
    const turmas = Storage.Turmas.listar();
    if (!turmas.length) { _toast('Nenhuma turma disponível.', 'i'); return; }
    const opts = turmas.map((t, i) => `${i + 1}. ${t.nome}`).join('\n');
    const resp = prompt(`Selecionar turma para o aluno:\n${opts}`);
    const idx  = parseInt(resp) - 1;
    if (isNaN(idx) || idx < 0 || idx >= turmas.length) return;
    Storage.Turmas.adicionarAluno(turmas[idx].id, alunoId);
    _toast(`Aluno vinculado a "${turmas[idx].nome}"!`, 's');
  }

  // ══════════════════════════════════════════════════════════════
  // MODAL DE CRIAÇÃO
  // ══════════════════════════════════════════════════════════════

  function abrirModal() {
    _editId = null;

    const tituloEl = document.getElementById('mal-titulo');
    const subEl    = document.getElementById('mal-sub');
    if (tituloEl) tituloEl.textContent = 'Novo Aluno';
    if (subEl)    subEl.textContent    = '';

    ['mal-nome', 'mal-email', 'mal-matricula', 'mal-telefone', 'mal-cargo', 'mal-unidade', 'mal-senha']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

    _setVal('mal-status', 'ativo');

    // Toggle "Primeiro acesso" ligado por padrão
    _setToggle('mal-primeiro', true);

    _popularSetoresModal();
    tabModal(0, document.querySelector('#modal-aluno .mc-tab'));
    document.getElementById('modal-aluno')?.classList.add('open');
  }

  // ══════════════════════════════════════════════════════════════
  // MODAL DE EDIÇÃO
  // ══════════════════════════════════════════════════════════════

  function abrirEdit(id) {
    const al = Storage.Alunos.obter(id);
    if (!al) return;
    _editId = id;

    const tituloEl = document.getElementById('mal-titulo');
    const subEl    = document.getElementById('mal-sub');
    if (tituloEl) tituloEl.textContent = 'Editar Aluno';
    if (subEl)    subEl.textContent    = `Matriculado em ${_fmtDate(al.criadoEm)}`;

    _setVal('mal-nome',      al.nome);
    _setVal('mal-email',     al.email);
    _setVal('mal-matricula', al.matricula);
    _setVal('mal-telefone',  al.telefone);
    _setVal('mal-cargo',     al.cargo);
    _setVal('mal-unidade',   al.unidade);
    _setVal('mal-senha',     al.senha);
    _setVal('mal-status',    al.statusAcesso || (al.ativo ? 'ativo' : 'bloqueado'));

    _setToggle('mal-primeiro', al.primeiroAcesso !== false);

    _popularSetoresModal(al.setorId, al.equipeId);
    tabModal(0, document.querySelector('#modal-aluno .mc-tab'));
    document.getElementById('modal-aluno')?.classList.add('open');
  }

  /**
   * Controla visualmente um toggle on/off.
   * @param {string}  id
   * @param {boolean} on
   */
  function _setToggle(id, on) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('on', on);
    const span = el.querySelector('span');
    if (span) span.style.left = on ? '21px' : '3px';
    el.style.background = on ? 'var(--blue)' : 'var(--border2)';
  }

  /**
   * Popula selects de setor e equipe dentro do modal.
   * @param {string} [setorId]
   * @param {string} [equipeId]
   */
  function _popularSetoresModal(setorId, equipeId) {
    const sSe = document.getElementById('mal-setor');
    if (sSe) {
      sSe.innerHTML =
        '<option value="">— Selecione —</option>' +
        Storage.Setores.listar().map(s =>
          `<option value="${_x(s.id)}" ${s.id === setorId ? 'selected' : ''}>${_x(s.nome)}</option>`
        ).join('');
      sSe.onchange = () => _loadEquipes();
    }
    _loadEquipes(setorId, equipeId);
  }

  /**
   * Popula o select de equipes conforme o setor selecionado.
   * @param {string} [setorId]
   * @param {string} [selectedEquipeId]
   */
  function _loadEquipes(setorId, selectedEquipeId) {
    const sId = setorId || document.getElementById('mal-setor')?.value;
    const sEq = document.getElementById('mal-equipe');
    if (!sEq) return;
    const eqs = sId ? Storage.Equipes.listarPorSetor(sId) : Storage.Equipes.listar();
    sEq.innerHTML =
      '<option value="">— Selecione —</option>' +
      eqs.map(e =>
        `<option value="${_x(e.id)}" ${e.id === selectedEquipeId ? 'selected' : ''}>${_x(e.nome)}</option>`
      ).join('');
  }

  // ══════════════════════════════════════════════════════════════
  // TABS DO MODAL CRIAR/EDITAR
  // ══════════════════════════════════════════════════════════════

  function tabModal(idx, btn) {
    document.querySelectorAll('#modal-aluno .mc-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
    document.querySelectorAll('#modal-aluno .mc-pane').forEach((p, i) => p.classList.toggle('active', i === idx));
  }

  // ══════════════════════════════════════════════════════════════
  // SALVAR ALUNO
  // ══════════════════════════════════════════════════════════════

  function salvar() {
    const nome  = document.getElementById('mal-nome')?.value.trim();
    const email = document.getElementById('mal-email')?.value.trim();
    if (!nome)  { alert('Informe o nome do aluno.'); return; }
    if (!email) { alert('Informe o e-mail.'); return; }

    const statusAcesso = document.getElementById('mal-status')?.value || 'ativo';
    const dados = {
      nome, email,
      matricula:      document.getElementById('mal-matricula')?.value.trim() || '',
      telefone:       document.getElementById('mal-telefone')?.value.trim()  || '',
      cargo:          document.getElementById('mal-cargo')?.value.trim()     || '',
      unidade:        document.getElementById('mal-unidade')?.value.trim()   || '',
      senha:          document.getElementById('mal-senha')?.value            || '123456',
      setorId:        document.getElementById('mal-setor')?.value            || null,
      equipeId:       document.getElementById('mal-equipe')?.value           || null,
      statusAcesso,
      ativo:          statusAcesso !== 'bloqueado' && statusAcesso !== 'inativo',
      primeiroAcesso: document.getElementById('mal-primeiro')?.classList.contains('on') ?? true,
    };

    if (_editId) {
      Storage.Alunos.atualizar(_editId, dados);
      _toast('Aluno atualizado!', 's');
    } else {
      const r = Storage.Alunos.criar(dados);
      if (!r) { alert('E-mail já cadastrado!'); return; }
      _toast('Aluno cadastrado!', 's');
    }

    document.getElementById('modal-aluno')?.classList.remove('open');
    _editId = null;
    refresh();
  }

  // ══════════════════════════════════════════════════════════════
  // PERFIL DO ALUNO
  // ══════════════════════════════════════════════════════════════

  /**
   * Abre o modal de perfil completo de um aluno.
   * @param {string} id
   */
  function verPerfil(id) {
    const al = Storage.Alunos.obter(id);
    if (!al) return;
    _perfilId = id;

    const setor    = al.setorId  ? Storage.Setores.obter(al.setorId)  : null;
    const equipe   = al.equipeId ? Storage.Equipes.obter(al.equipeId) : null;
    const prog     = _progGeral(id);
    const cursos   = _cursosDoAluno(id);
    const concluidos = cursos.filter(c => Storage.Progresso.cursoConcluido(id, c.id)).length;

    // Header
    const _setTxt = (elId, val) => { const el = document.getElementById(elId); if (el) el.textContent = val; };
    _setTxt('pa-avatar',  (al.nome?.[0] || '?').toUpperCase());
    _setTxt('pa-nome',    al.nome);
    _setTxt('pa-cargo',   [al.cargo, setor?.nome].filter(Boolean).join(' · ') || 'Sem cargo definido');
    _setTxt('pa-ncursos', cursos.length);
    _setTxt('pa-prog',    prog + '%');
    _setTxt('pa-concl',   concluidos);

    const statusEl = document.getElementById('pa-status-badge');
    if (statusEl) statusEl.innerHTML = _stBadge(al);

    // Botão bloquear/ativar
    const btnBlq = document.getElementById('pa-btn-bloquear');
    if (btnBlq) {
      btnBlq.textContent = al.ativo ? '🔒 Bloquear' : '✓ Ativar';
      btnBlq.onclick = al.ativo
        ? () => { bloquear(id); verPerfil(id); }
        : () => { ativar(id);   verPerfil(id); };
    }

    // Tab 0: Informações pessoais e organizacionais
    const rv = (lbl, val) => `
      <div style="padding:7px 0;border-bottom:1px solid var(--border)">
        <div style="font-size:11px;color:var(--text4);margin-bottom:2px">${lbl}</div>
        <div style="font-size:13px;font-weight:500;color:var(--text)">${val || '—'}</div>
      </div>`;

    const infoEl = document.getElementById('pa-info-body');
    if (infoEl) infoEl.innerHTML =
      rv('E-mail',        _x(al.email)) +
      rv('Matrícula',     _x(al.matricula)) +
      rv('Telefone',      _x(al.telefone)) +
      rv('Cargo',         _x(al.cargo)) +
      rv('Cadastro',      _fmtDate(al.criadoEm)) +
      rv('Último acesso', _fmtRelative(al.ultimoAcesso));

    const orgEl = document.getElementById('pa-org-body');
    if (orgEl) orgEl.innerHTML =
      rv('Setor',    setor  ? _x(setor.nome)  : null) +
      rv('Equipe',   equipe ? _x(equipe.nome) : null) +
      rv('Unidade',  _x(al.unidade)) +
      rv('1º acesso', al.primeiroAcesso ? 'Pendente' : 'Realizado') +
      rv('Status',    ST_CFG[al.statusAcesso || 'ativo']?.label || '—');

    // Barra de progresso
    const progLbl = document.getElementById('pa-prog-lbl');
    const progBar = document.getElementById('pa-prog-bar');
    if (progLbl) progLbl.textContent  = prog + '%';
    if (progBar) progBar.style.width  = prog + '%';

    // Tab 1: Cursos
    const cursosEl = document.getElementById('pa-cursos-body');
    if (cursosEl) {
      cursosEl.innerHTML = cursos.length
        ? cursos.map(c => {
            const pct  = Storage.Progresso.pctCurso(id, c.id);
            const done = Storage.Progresso.cursoConcluido(id, c.id);
            return `
              <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;font-weight:500;color:var(--text)">${_x(c.titulo)}</div>
                  <div style="font-size:11px;color:var(--text4)">${c.carga}h · ${c.categoria || 'Geral'}</div>
                </div>
                <div style="min-width:100px">
                  <div class="gc-prog-wrap">
                    <div class="gc-prog-bar"><div class="gc-prog-fill" style="width:${pct}%"></div></div>
                    <span class="gc-prog-lbl">${pct}%</span>
                  </div>
                </div>
                ${done ? '<span class="badge badge-green" style="flex-shrink:0">✓</span>' : ''}
              </div>`;
          }).join('')
        : '<div style="color:var(--text4);font-size:13px;padding:12px">Nenhum curso acessível.</div>';
    }

    // Tab 2: Histórico
    const respostas  = Storage.Respostas ? Storage.Respostas.listar().filter(r => r.alunoId === id) : [];
    const nConcluidas = Storage.Progresso.concluidas(id).length;
    const mediaAval  = respostas.length
      ? Math.round(respostas.reduce((s, r) => s + r.nota, 0) / respostas.length)
      : null;

    const histEl = document.getElementById('pa-historico-body');
    if (histEl) histEl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="padding:9px 12px;background:var(--bg);border-radius:var(--radius-sm);font-size:13px;color:var(--text2)">
          <strong>${nConcluidas}</strong> aulas concluídas no total
        </div>
        <div style="padding:9px 12px;background:var(--bg);border-radius:var(--radius-sm);font-size:13px;color:var(--text2)">
          <strong>${respostas.length}</strong> avaliações realizadas
          ${mediaAval !== null ? ` · Média: <strong>${mediaAval}%</strong>` : ''}
        </div>
        <div style="padding:9px 12px;background:var(--bg);border-radius:var(--radius-sm);font-size:13px;color:var(--text2)">
          <strong>${concluidos}</strong> cursos concluídos
        </div>
        ${al.ultimoAcesso
          ? `<div style="padding:9px 12px;background:var(--bg);border-radius:var(--radius-sm);font-size:12px;color:var(--text4)">
              Último acesso: ${_fmtRelative(al.ultimoAcesso)}
             </div>`
          : ''}
      </div>`;

    tabPerfil(0, document.querySelector('#modal-perfil-aluno .mc-tab'));
    document.getElementById('modal-perfil-aluno')?.classList.add('open');
  }

  // ══════════════════════════════════════════════════════════════
  // TABS DO MODAL PERFIL
  // ══════════════════════════════════════════════════════════════

  function tabPerfil(idx, btn) {
    document.querySelectorAll('#modal-perfil-aluno .mc-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
    ['pa-pane-0', 'pa-pane-1', 'pa-pane-2'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.style.display = i === idx ? 'block' : 'none';
    });
  }

  function resetarSenhaModal() {
    if (_perfilId) resetarSenha(_perfilId);
  }

  function alternarBloqueio() {
    const al = _perfilId ? Storage.Alunos.obter(_perfilId) : null;
    if (!al) return;
    al.ativo ? bloquear(_perfilId) : ativar(_perfilId);
    verPerfil(_perfilId);
  }

  // ══════════════════════════════════════════════════════════════
  // GESTÃO DE SETORES E EQUIPES
  // ══════════════════════════════════════════════════════════════

  function abrirSetores() {
    renderSetoresEquipes();
    document.getElementById('modal-setores')?.classList.add('open');
  }

  function renderSetoresEquipes() {
    const wrap = document.getElementById('setores-equipes');
    if (!wrap) return;

    const setores = Storage.Setores.listar();
    const equipes = Storage.Equipes.listar();

    if (!setores.length) {
      wrap.innerHTML = '<p style="color:var(--text4);font-size:13px">Nenhum setor cadastrado.</p>';
      return;
    }

    wrap.innerHTML = setores.map(s => {
      const eqs = equipes.filter(e => e.setorId === s.id);
      const cnt = Storage.Alunos.porSetor(s.id).length;
      return `
        <div class="setor-card" style="margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <div style="width:10px;height:10px;border-radius:50%;background:${s.cor || '#0002da'};flex-shrink:0"></div>
            <strong style="font-size:13px;color:var(--text)">${_x(s.nome)}</strong>
            <span style="color:var(--text4);font-size:11px;margin-left:auto">${cnt} colaboradores</span>
            <button class="btn btn-danger btn-sm" onclick="AlunosMod.delSetor('${s.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </button>
          </div>
          ${eqs.map(e => `
            <div class="equipe-row">
              <span style="font-size:12px;color:var(--text2)">${_x(e.nome)}</span>
              <span style="font-size:11px;color:var(--text4)">${Storage.Alunos.porEquipe(e.id).length} membros</span>
              <button class="btn btn-danger btn-sm" onclick="AlunosMod.delEquipe('${e.id}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              </button>
            </div>`).join('')}
          ${!eqs.length ? '<p style="color:var(--text4);font-size:12px;padding:4px 0">Sem equipes</p>' : ''}
        </div>`;
    }).join('');
  }

  function criarSetor() {
    const nome = prompt('Nome do setor:');
    if (!nome) return;
    const cor = prompt('Cor hex (opcional):', '#0002da') || '#0002da';
    Storage.Setores.criar({ nome, cor });
    renderSetoresEquipes();
    _popularFiltros();
    _toast('Setor criado!', 's');
  }

  function criarEquipe() {
    const setores = Storage.Setores.listar();
    if (!setores.length) { _toast('Crie um setor primeiro.', 'i'); return; }
    const nome = prompt('Nome da equipe:');
    if (!nome) return;
    const opts = setores.map((s, i) => `${i + 1}. ${s.nome}`).join('\n');
    const idx  = parseInt(prompt(`Setor da equipe:\n${opts}`)) - 1;
    if (isNaN(idx) || idx < 0 || idx >= setores.length) return;
    Storage.Equipes.criar({ nome, setorId: setores[idx].id });
    renderSetoresEquipes();
    _popularFiltros();
    _toast('Equipe criada!', 's');
  }

  function delSetor(id) {
    if (!confirm('Excluir setor?')) return;
    Storage.Setores.excluir(id);
    renderSetoresEquipes();
    _popularFiltros();
    _toast('Setor removido.', 'i');
  }

  function delEquipe(id) {
    if (!confirm('Excluir equipe?')) return;
    Storage.Equipes.excluir(id);
    renderSetoresEquipes();
    _popularFiltros();
    _toast('Equipe removida.', 'i');
  }

  // ══════════════════════════════════════════════════════════════
  // REFRESH E PONTO DE ENTRADA
  // ══════════════════════════════════════════════════════════════

  function refresh() {
    renderStats();
    renderTabela();
    _popularFiltros();
  }

  function init() {
    renderStats();
    renderTabela();
    _popularFiltros();
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
    renderSetoresEquipes,

    // Filtros
    setStatus,
    resetFiltros,

    // Modal criar/editar
    abrirModal,
    abrirEdit,
    salvar,
    tabModal,

    // Perfil
    verPerfil,
    tabPerfil,
    resetarSenhaModal,
    alternarBloqueio,

    // Setores e equipes
    abrirSetores,
    criarSetor,
    criarEquipe,
    delSetor,
    delEquipe,

    // Ações individuais
    bloquear,
    ativar,
    resetarSenha,
    excluir,
    vincularTurma,

    // Menu
    _menu,
    _cm,

    // Selects (chamado pelo HTML inline)
    _loadEquipes,

    // Compatibilidade com admin.js legado
    toggleColab: (id, ativo) => ativo ? ativar(id) : bloquear(id),
  };
})();
