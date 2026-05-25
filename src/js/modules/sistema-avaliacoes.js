/**
 * @fileoverview sistema-avaliacoes.js — Módulo: Sistema de Avaliações
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO ISOLADO — Sistema de Avaliações EAD                      ║
 * ║                                                                  ║
 * ║  Responsabilidades:                                              ║
 * ║  • Stats/indicadores (total, publicadas, rascunhos, aprovação)   ║
 * ║  • Tabela com filtros (busca, status, curso, turma, data)         ║
 * ║  • Modal de criação e edição (3 tabs: dados, config, questões)   ║
 * ║  • Editor de questões (4 tipos: múltipla, V/F, única, descritiva)║
 * ║  • Ações: publicar, encerrar, excluir, duplicar                  ║
 * ║  • Modal de resultados por aluno                                 ║
 * ║                                                                  ║
 * ║  Contrato de entrada (dependências externas):                    ║
 * ║  • window.Storage  — camada de dados (storage.js)                ║
 * ║    └─ Storage.Avaliacoes, Storage.Questoes, Storage.Respostas    ║
 * ║    └─ Storage.Cursos, Storage.Turmas, Storage.Modulos            ║
 * ║    └─ Storage.Alunos                                             ║
 * ║                                                                  ║
 * ║  Contrato de saída (API pública exposta em window.Aval):         ║
 * ║  • init(), refresh(), renderTabela()                             ║
 * ║  • setStatus(btn, value), resetFiltros()                         ║
 * ║  • abrirModal(), abrirEdit(id), salvar()                         ║
 * ║  • publicar(id), encerrar(id), excluir(id), duplicar(id)         ║
 * ║  • verResultados(id)                                             ║
 * ║  • tabModal(idx, btn)                                            ║
 * ║  • addQuestao(tipo), renderQuestoes()                            ║
 * ║  • _menu(btn), _cm()                                             ║
 * ║  • _setPergunta, _setPontos, _setFeedback                        ║
 * ║  • _setCorreta, _setAlt, _addAlt, _remQuestao                    ║
 * ║  • _loadModulos                                                  ║
 * ║                                                                  ║
 * ║  MIGRAÇÃO BACKEND: Apenas window.Storage precisa mudar.          ║
 * ║  Este módulo NÃO acessa localStorage diretamente.                ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * @module SistemaAvaliacoes
 * @version 1.0.0
 * @see docs/ARCHITECTURE.md
 */

/* global Storage */

var Aval = (() => {
  'use strict';

  // ── Estado interno do módulo ──────────────────────────────────
  let _editId   = null;  // ID da avaliação em edição (null = nova)
  let _questoes = [];    // questões da avaliação em edição (estado local)

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

  /** Gera ID único local (antes de salvar no Storage) */
  function _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
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
   * Formata segundos em formato legível.
   * @param {number} seg
   * @returns {string}
   */
  function _fmtTempo(seg) {
    if (!seg) return '—';
    const m = Math.floor(seg / 60), s = seg % 60;
    return m ? `${m}min ${s}s` : `${s}s`;
  }

  /** Helper para setar value de campo pelo ID */
  function _setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
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
  // CONFIGURAÇÕES VISUAIS DE STATUS
  // ══════════════════════════════════════════════════════════════

  const ST = {
    rascunho:  { cls: 'badge-gray',  label: '✎ Rascunho'  },
    publicada: { cls: 'badge-green', label: '● Publicada'  },
    encerrada: { cls: 'badge-amber', label: '■ Encerrada'  },
    arquivada: { cls: 'badge-red',   label: '▣ Arquivada'  },
  };

  function _stBadge(s) {
    const c = ST[s] || ST.rascunho;
    return `<span class="badge ${c.cls}">${c.label}</span>`;
  }

  // ══════════════════════════════════════════════════════════════
  // CHIPS DE FILTRO DE STATUS
  // ══════════════════════════════════════════════════════════════

  const CHIP_CLS = {
    '':         '',
    rascunho:   'active-ras',
    publicada:  'active-pub',
    encerrada:  'active-arq',
    arquivada:  'active-exp',
  };

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
    ['av-busca', 'av-filtro-status', 'av-filtro-curso', 'av-filtro-turma', 'av-filtro-data'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.querySelectorAll('.ift-chip[data-avst]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
    });
    renderTabela();
    _badge();
  }

  function _badge() {
    const b = document.getElementById('av-badge');
    if (!b) return;
    let n = 0;
    ['av-busca', 'av-filtro-status', 'av-filtro-curso', 'av-filtro-turma', 'av-filtro-data']
      .forEach(id => { if (document.getElementById(id)?.value?.trim()) n++; });
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

    const tbody = _q('#av-tbody');
    const empty = _q('#av-empty');
    const count = _q('#av-count');

    if (count) count.textContent = `${lista.length} avaliação(ões)`;

    if (!lista.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = lista.map(av => _renderLinha(av)).join('');
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

  function publicar(id) {
    Storage.Avaliacoes.publicar(id);
    _toast('Avaliação publicada!', 's');
    refresh();
  }

  function encerrar(id) {
    Storage.Avaliacoes.encerrar(id);
    _toast('Avaliação encerrada.', 'i');
    refresh();
  }

  function excluir(id) {
    if (!confirm('Excluir avaliação e todos os resultados?')) return;
    Storage.Avaliacoes.excluir(id);
    _toast('Excluída.', 'i');
    refresh();
  }

  function duplicar(id) {
    const nova = Storage.Avaliacoes.duplicar(id);
    if (nova) { _toast('Avaliação duplicada!', 's'); refresh(); }
  }

  // ══════════════════════════════════════════════════════════════
  // MODAL DE CRIAÇÃO
  // ══════════════════════════════════════════════════════════════

  function abrirModal() {
    _editId   = null;
    _questoes = [];

    const tituloEl = document.getElementById('mav-titulo');
    const subEl    = document.getElementById('mav-sub');
    if (tituloEl) tituloEl.textContent = 'Nova Avaliação';
    if (subEl)    subEl.textContent    = '';

    ['mav-nome', 'mav-desc'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    _setVal('mav-nota-min',  70);
    _setVal('mav-tempo',     0);
    _setVal('mav-tentativas', 1);
    _setVal('mav-status',    'rascunho');

    _popularSelectsCursoTurma();
    _renderConfigToggles({});
    renderQuestoes();
    tabModal(0, document.querySelector('#modal-avaliacao .mc-tab'));
    document.getElementById('modal-avaliacao')?.classList.add('open');
  }

  // ══════════════════════════════════════════════════════════════
  // MODAL DE EDIÇÃO
  // ══════════════════════════════════════════════════════════════

  function abrirEdit(id) {
    const av = Storage.Avaliacoes.obter(id);
    if (!av) return;

    _editId   = id;
    _questoes = Storage.Questoes.porAvaliacao(id).map(q => ({ ...q })); // cópia local

    const tituloEl = document.getElementById('mav-titulo');
    const subEl    = document.getElementById('mav-sub');
    if (tituloEl) tituloEl.textContent = 'Editar Avaliação';
    if (subEl)    subEl.textContent    = `Criada em ${_fmtDate(av.criadoEm)}`;

    _setVal('mav-nome',       av.nome);
    _setVal('mav-desc',       av.descricao);
    _setVal('mav-nota-min',   av.notaMinima  || 70);
    _setVal('mav-tempo',      av.tempoLimite || 0);
    _setVal('mav-tentativas', av.tentativas  || 1);
    _setVal('mav-status',     av.status      || 'rascunho');

    _popularSelectsCursoTurma(av.cursoId, av.moduloId, av.turmaId);
    _renderConfigToggles(av);
    renderQuestoes();
    tabModal(0, document.querySelector('#modal-avaliacao .mc-tab'));
    document.getElementById('modal-avaliacao')?.classList.add('open');
  }

  // ══════════════════════════════════════════════════════════════
  // SELECTS DE CURSO / TURMA / MÓDULO
  // ══════════════════════════════════════════════════════════════

  function _popularSelectsCursoTurma(cursoId, moduloId, turmaId) {
    const sCurso = document.getElementById('mav-curso');
    const sTurma = document.getElementById('mav-turma');

    if (sCurso) {
      sCurso.innerHTML =
        '<option value="">Sem curso</option>' +
        Storage.Cursos.listar().map(c =>
          `<option value="${_x(c.id)}" ${c.id === cursoId ? 'selected' : ''}>${_x(c.titulo)}</option>`
        ).join('');
      sCurso.onchange = _loadModulos;
    }
    if (sTurma) {
      sTurma.innerHTML =
        '<option value="">Todas as turmas</option>' +
        Storage.Turmas.listar().map(t =>
          `<option value="${_x(t.id)}" ${t.id === turmaId ? 'selected' : ''}>${_x(t.nome)}</option>`
        ).join('');
    }
    _loadModulos(cursoId, moduloId);
  }

  function _loadModulos(cursoId, selectedId) {
    const cId  = cursoId || document.getElementById('mav-curso')?.value;
    const sMod = document.getElementById('mav-modulo');
    if (!sMod) return;
    const mods = cId ? Storage.Modulos.listarPorCurso(cId) : [];
    sMod.innerHTML =
      '<option value="">Selecione um módulo...</option>' +
      mods.map(m =>
        `<option value="${_x(m.id)}" ${m.id === selectedId ? 'selected' : ''}>${_x(m.titulo)}</option>`
      ).join('');
  }

  // ══════════════════════════════════════════════════════════════
  // TOGGLES DE CONFIGURAÇÃO
  // ══════════════════════════════════════════════════════════════

  function _renderConfigToggles(av) {
    const wrap = document.getElementById('mav-config-toggles');
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
      row('mavcfg-imediato',  'Exibir resultado imediatamente', 'O aluno vê a nota ao terminar',                        av.resultadoImediato !== false) +
      row('mavcfg-aleatoria', 'Ordem aleatória de questões',    'Embaralha a ordem para cada tentativa',                av.ordemAleatoria) +
      row('mavcfg-correcao',  'Correção automática',            'Corrige automaticamente (exceto descritivas)',          av.correcaoAutomatica !== false);
  }

  // ══════════════════════════════════════════════════════════════
  // TABS DO MODAL
  // ══════════════════════════════════════════════════════════════

  function tabModal(idx, btn) {
    document.querySelectorAll('#modal-avaliacao .mc-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
    document.querySelectorAll('#modal-avaliacao .mc-pane').forEach((p, i) => p.classList.toggle('active', i === idx));
    if (idx === 2) renderQuestoes();
  }

  // ══════════════════════════════════════════════════════════════
  // EDITOR DE QUESTÕES
  // ══════════════════════════════════════════════════════════════

  /**
   * Adiciona uma nova questão ao estado local.
   * @param {'multipla'|'vf'|'unica'|'descritiva'} tipo
   */
  function addQuestao(tipo) {
    const nova = {
      _lid:        _uid(),
      avaliacaoId: _editId || '_novo_',
      tipo,
      pergunta:    '',
      alternativas: ['', '', '', ''],
      correta:     '0',
      pontos:      10,
      feedback:    '',
      categoria:   '',
      ordem:       _questoes.length + 1,
    };
    if (tipo === 'vf')        { nova.alternativas = ['Verdadeiro', 'Falso']; nova.correta = '0'; }
    if (tipo === 'descritiva') { nova.alternativas = []; nova.correta = ''; }

    _questoes.push(nova);
    renderQuestoes();

    // Scroll para a nova questão
    const lista = document.getElementById('mav-questoes-lista');
    if (lista) setTimeout(() => lista.scrollTop = lista.scrollHeight, 50);
  }

  /**
   * Re-renderiza a lista de questões no editor.
   */
  function renderQuestoes() {
    const lista = document.getElementById('mav-questoes-lista');
    const empty = document.getElementById('mav-questoes-empty');
    const cnt   = document.getElementById('mav-q-count');
    if (cnt) cnt.textContent = _questoes.length;

    if (!_questoes.length) {
      if (lista) lista.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    const TIPO_LABEL = {
      multipla:   'Múltipla escolha',
      vf:         'Verdadeiro/Falso',
      unica:      'Resposta única',
      descritiva: 'Descritiva',
    };

    lista.innerHTML = _questoes.map((q, idx) => {
      let altHtml = '';

      if (q.tipo === 'multipla' || q.tipo === 'unica') {
        const alts = q.alternativas.length ? q.alternativas : ['', '', '', ''];
        altHtml = `
          <div style="margin-top:10px">
            <div style="font-size:11px;font-weight:600;color:var(--text4);margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">Alternativas</div>
            ${alts.map((alt, ai) => `
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <input type="radio" name="correta_${idx}" value="${ai}"
                  ${String(q.correta) === String(ai) ? 'checked' : ''}
                  onchange="Aval._setCorreta(${idx},${ai})"
                  style="accent-color:var(--blue);flex-shrink:0" title="Marcar como correta">
                <input type="text" value="${_x(alt)}"
                  placeholder="Alternativa ${ai + 1}"
                  oninput="Aval._setAlt(${idx},${ai},this.value)"
                  style="flex:1;padding:6px 10px;border:1.5px solid var(--border2);border-radius:var(--radius-sm);font-size:12px;font-family:var(--font);outline:none">
              </div>`).join('')}
            <button onclick="Aval._addAlt(${idx})" class="btn btn-ghost btn-sm" style="margin-top:4px">+ Alternativa</button>
          </div>`;

      } else if (q.tipo === 'vf') {
        altHtml = `
          <div style="margin-top:10px;display:flex;gap:12px">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
              <input type="radio" name="correta_${idx}" value="0" ${String(q.correta) === '0' ? 'checked' : ''}
                onchange="Aval._setCorreta(${idx},'0')" style="accent-color:var(--blue)">
              <span style="font-size:13px">Verdadeiro</span>
            </label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
              <input type="radio" name="correta_${idx}" value="1" ${String(q.correta) === '1' ? 'checked' : ''}
                onchange="Aval._setCorreta(${idx},'1')" style="accent-color:var(--blue)">
              <span style="font-size:13px">Falso</span>
            </label>
          </div>`;

      } else {
        altHtml = `
          <div style="margin-top:8px;padding:8px 12px;background:var(--bg);border-radius:var(--radius-sm);font-size:12px;color:var(--text4)">
            Questão descritiva — correção manual necessária
          </div>`;
      }

      return `
        <div style="border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:14px;background:var(--surface)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="width:22px;height:22px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${idx + 1}</span>
              <span style="font-size:11px;font-weight:600;color:var(--text4);text-transform:uppercase;letter-spacing:.06em">${TIPO_LABEL[q.tipo]}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <label style="font-size:11px;color:var(--text4)">Pontos:</label>
              <input type="number" value="${q.pontos || 10}" min="1" max="100"
                oninput="Aval._setPontos(${idx},this.value)"
                style="width:55px;padding:4px 7px;border:1.5px solid var(--border2);border-radius:var(--radius-sm);font-size:12px;font-family:var(--font);outline:none;text-align:center">
              <button onclick="Aval._remQuestao(${idx})"
                style="background:none;border:none;cursor:pointer;color:var(--text4);padding:2px" title="Remover">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              </button>
            </div>
          </div>
          <textarea placeholder="Enunciado da questão *" rows="2"
            oninput="Aval._setPergunta(${idx},this.value)"
            style="width:100%;padding:8px 11px;border:1.5px solid var(--border2);border-radius:var(--radius-sm);font-size:13px;font-family:var(--font);resize:vertical;outline:none">${_x(q.pergunta)}</textarea>
          ${altHtml}
          <div style="margin-top:10px">
            <input type="text" value="${_x(q.feedback || '')}" placeholder="Feedback opcional (exibido após resposta)"
              oninput="Aval._setFeedback(${idx},this.value)"
              style="width:100%;padding:6px 10px;border:1.5px solid var(--border2);border-radius:var(--radius-sm);font-size:12px;font-family:var(--font);outline:none;color:var(--text3)">
          </div>
        </div>`;
    }).join('');
  }

  // ── Mutadores de questão (chamados pelo HTML inline) ──────────

  function _setPergunta(idx, v) { _questoes[idx].pergunta = v; }
  function _setPontos(idx, v)   { _questoes[idx].pontos   = parseInt(v) || 10; }
  function _setFeedback(idx, v) { _questoes[idx].feedback = v; }
  function _setCorreta(idx, v)  { _questoes[idx].correta  = String(v); }

  function _setAlt(idx, ai, v) {
    if (!_questoes[idx].alternativas) _questoes[idx].alternativas = [];
    _questoes[idx].alternativas[ai] = v;
  }

  function _addAlt(idx) {
    if (!_questoes[idx].alternativas) _questoes[idx].alternativas = [];
    _questoes[idx].alternativas.push('');
    renderQuestoes();
  }

  function _remQuestao(idx) {
    _questoes.splice(idx, 1);
    _questoes.forEach((q, i) => { q.ordem = i + 1; });
    renderQuestoes();
  }

  // ══════════════════════════════════════════════════════════════
  // SALVAR AVALIAÇÃO
  // ══════════════════════════════════════════════════════════════

  function salvar() {
    const nome = document.getElementById('mav-nome')?.value.trim();
    if (!nome) { alert('Informe o nome da avaliação.'); return; }

    const getTog = id => document.getElementById(id)?.classList.contains('on') ?? false;

    const dados = {
      nome,
      descricao:          document.getElementById('mav-desc')?.value.trim()          || '',
      cursoId:            document.getElementById('mav-curso')?.value                 || '',
      moduloId:           document.getElementById('mav-modulo')?.value                || '',
      turmaId:            document.getElementById('mav-turma')?.value                 || '',
      status:             document.getElementById('mav-status')?.value                || 'rascunho',
      notaMinima:         parseInt(document.getElementById('mav-nota-min')?.value)    || 70,
      tempoLimite:        parseInt(document.getElementById('mav-tempo')?.value)       || 0,
      tentativas:         parseInt(document.getElementById('mav-tentativas')?.value)  || 1,
      resultadoImediato:  getTog('mavcfg-imediato'),
      ordemAleatoria:     getTog('mavcfg-aleatoria'),
      correcaoAutomatica: getTog('mavcfg-correcao'),
    };

    let avalId = _editId;
    if (_editId) {
      Storage.Avaliacoes.atualizar(_editId, dados);
    } else {
      const nova = Storage.Avaliacoes.criar(dados);
      avalId = nova.id;
    }

    // Salva questões: remove antigas e recria todas
    if (_editId) {
      Storage.Questoes.porAvaliacao(_editId).forEach(q => Storage.Questoes.excluir(q.id));
    }
    _questoes.forEach((q, i) => {
      Storage.Questoes.criar({
        avaliacaoId:  avalId,
        tipo:         q.tipo,
        pergunta:     q.pergunta,
        alternativas: q.alternativas,
        correta:      q.correta,
        pontos:       q.pontos  || 10,
        feedback:     q.feedback || '',
        categoria:    q.categoria || '',
        ordem:        i + 1,
      });
    });

    _toast(_editId ? 'Avaliação atualizada!' : 'Avaliação criada!', 's');
    document.getElementById('modal-avaliacao')?.classList.remove('open');
    _editId   = null;
    _questoes = [];
    refresh();
  }

  // ══════════════════════════════════════════════════════════════
  // MODAL DE RESULTADOS
  // ══════════════════════════════════════════════════════════════

  /**
   * Abre o modal com os resultados de todos os alunos para uma avaliação.
   * @param {string} id
   */
  function verResultados(id) {
    const av = Storage.Avaliacoes.obter(id);
    if (!av) return;

    const stats     = Storage.Respostas.statsAvaliacao(id);
    const respostas = Storage.Respostas.porAvaliacao(id);

    // Preenche cabeçalho
    const _set = (elId, val) => {
      const el = document.getElementById(elId);
      if (el) el.textContent = val;
    };
    _set('av-res-nome',   av.nome);
    _set('av-res-part',   stats.participantes);
    _set('av-res-media',  stats.media + '%');
    _set('av-res-aprov',  stats.aprovados);
    _set('av-res-reprov', stats.reprovados);
    _set('av-res-taxa',   stats.taxa + '%');
    _set('av-res-taxa2',  stats.taxa + '%');

    const bar = document.getElementById('av-res-bar');
    if (bar) bar.style.width = stats.taxa + '%';

    const tbody = document.getElementById('av-res-tbody');
    const empty = document.getElementById('av-res-empty');

    if (!respostas.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
    } else {
      if (empty) empty.style.display = 'none';
      tbody.innerHTML = respostas
        .sort((a, b) => new Date(b.concluidoEm) - new Date(a.concluidoEm))
        .map(r => {
          const aluno = Storage.Alunos.obter(r.alunoId);
          const nome  = aluno ? _x(aluno.nome) : 'Aluno ' + r.alunoId.slice(0, 6);
          const stCls = r.aprovado ? 'badge-green' : 'badge-red';
          const stLbl = r.aprovado ? '✓ Aprovado'  : '✕ Reprovado';
          return `<tr>
            <td style="padding:8px 10px;border-bottom:1px solid #f0f1fb">
              <div style="font-size:12px;font-weight:500;color:var(--text)">${nome}</div>
            </td>
            <td style="padding:8px 10px;border-bottom:1px solid #f0f1fb;text-align:center">
              <span style="font-size:14px;font-weight:700;color:${r.aprovado ? 'var(--green-dark)' : 'var(--red)'}">${r.nota}%</span>
            </td>
            <td style="padding:8px 10px;border-bottom:1px solid #f0f1fb;text-align:center">
              <span class="badge ${stCls}">${stLbl}</span>
            </td>
            <td style="padding:8px 10px;border-bottom:1px solid #f0f1fb;text-align:center;font-size:12px;color:var(--text3)">${r.tentativa}ª</td>
            <td style="padding:8px 10px;border-bottom:1px solid #f0f1fb;text-align:center;font-size:12px;color:var(--text4)">${_fmtTempo(r.tempoUsado)}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #f0f1fb;font-size:11px;color:var(--text4)">${_fmtDate(r.concluidoEm)}</td>
          </tr>`;
        }).join('');
    }

    document.getElementById('modal-av-resultados')?.classList.add('open');
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

    // Filtros
    setStatus,
    resetFiltros,

    // Modal
    abrirModal,
    abrirEdit,
    salvar,
    tabModal,

    // Ações individuais
    publicar,
    encerrar,
    excluir,
    duplicar,
    verResultados,

    // Editor de questões
    addQuestao,
    renderQuestoes,
    _setPergunta,
    _setPontos,
    _setFeedback,
    _setCorreta,
    _setAlt,
    _addAlt,
    _remQuestao,

    // Selects
    _loadModulos,

    // Menu
    _menu,
    _cm,
  };
})();
