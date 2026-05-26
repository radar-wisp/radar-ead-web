/**
 * @fileoverview gestao-turmas.js — Módulo: Gestão de Turmas
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO ISOLADO — Gestão de Turmas                               ║
 * ║                                                                  ║
 * ║  Responsabilidades:                                              ║
 * ║  • Stats/indicadores do painel de turmas                         ║
 * ║  • Tabela com filtros (busca, status, curso, data)               ║
 * ║  • Modal de criação e edição de turma                            ║
 * ║  • Gerenciamento de alunos vinculados à turma                    ║
 * ║  • Seleções rápidas (por setor, por equipe, todos)               ║
 * ║  • Dashboard de visualização individual da turma                 ║
 * ║  • Ações: encerrar, excluir                                      ║
 * ║                                                                  ║
 * ║  Contrato de entrada (dependências externas):                    ║
 * ║  • window.Storage  — camada de dados (storage.js)                ║
 * ║    └─ Storage.Turmas, Storage.Cursos, Storage.Alunos             ║
 * ║    └─ Storage.Setores, Storage.Equipes, Storage.Progresso        ║
 * ║                                                                  ║
 * ║  Contrato de saída (API pública exposta em window.Turmas):       ║
 * ║  • init()                                                        ║
 * ║  • refresh()                                                     ║
 * ║  • renderTabela()                                                ║
 * ║  • setStatus(btn, value)                                         ║
 * ║  • resetFiltros()                                                ║
 * ║  • filtrarAlunos()                                               ║
 * ║  • abrirModal()                                                  ║
 * ║  • abrirEdit(id)                                                 ║
 * ║  • abrirGerenciarAlunos(id)                                      ║
 * ║  • visualizar(id)                                                ║
 * ║  • encerrar(id)                                                  ║
 * ║  • excluir(id)                                                   ║
 * ║  • salvar()                                                      ║
 * ║  • tabModal(idx, btn)                                            ║
 * ║  • renderListaAlunos(filtro?)                                    ║
 * ║  • selecionarPorSetor()                                          ║
 * ║  • selecionarPorEquipe()                                         ║
 * ║  • selecionarTodos()                                             ║
 * ║  • limparAlunos()                                                ║
 * ║  • _menu(btn)                                                    ║
 * ║  • _closeMenus()                                                 ║
 * ║  • _toggleAluno(id, label)                                       ║
 * ║  • _viewingId                                                    ║
 * ║                                                                  ║
 * ║  MIGRAÇÃO BACKEND: Apenas window.Storage precisa mudar.          ║
 * ║  Este módulo NÃO acessa localStorage diretamente.                ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * @module GestaoCursos
 * @version 1.0.0
 * @see docs/ARCHITECTURE.md
 */

/* global Storage */

var Turmas = (() => {
  'use strict';

  // ── Estado interno do módulo ──────────────────────────────────
  let _editId    = null;        // ID da turma sendo editada (null = nova)
  let _alunosSel = new Set();   // IDs dos alunos selecionados no modal

  // Exposto publicamente para o botão "Gerenciar alunos" do modal-dash
  let _viewingId = null;

  // ══════════════════════════════════════════════════════════════
  // UTILITÁRIOS INTERNOS (não expostos)
  // ══════════════════════════════════════════════════════════════

  /** Atalho para querySelector */
  function _q(sel) {
    return document.querySelector(sel);
  }

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
   * Lê o valor de um toggle (on/off) pelo ID do elemento.
   * @param {string} id
   * @returns {boolean}
   */
  function _getToggleOn(id) {
    return document.getElementById(id)?.classList.contains('on') ?? false;
  }

  /**
   * Define o estado visual de um toggle.
   * @param {string}  id
   * @param {boolean} val
   */
  function _setToggle(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('on', val);
    el.style.background = val ? 'var(--blue)' : 'var(--border2)';
    const span = el.querySelector('span');
    if (span) span.style.left = val ? '21px' : '3px';
  }

  /**
   * Exibe toast usando o container global #toasts.
   * @param {string} msg
   * @param {'s'|'e'|'i'} tipo  s=sucesso, e=erro, i=info
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
  // DIÁLOGOS INTERNOS — substitutos de confirm() / prompt() / alert()
  // ══════════════════════════════════════════════════════════════

  /**
   * Exibe o modal de confirmação genérico (#modal-tm-confirm).
   * @param {string}   titulo
   * @param {string}   msg
   * @param {string}   labelOk   — texto do botão de confirmação
   * @param {string}   tipoBotao — 'danger' | 'primary'
   * @param {Function} onOk      — callback executado ao confirmar
   */
  function _confirm(titulo, msg, labelOk, tipoBotao, onOk) {
    const modal  = document.getElementById('modal-tm-confirm');
    const elTit  = document.getElementById('tm-confirm-titulo');
    const elMsg  = document.getElementById('tm-confirm-msg');
    const btnOk  = document.getElementById('tm-confirm-ok');
    if (!modal || !elTit || !elMsg || !btnOk) {
      // fallback seguro caso o modal não exista no HTML
      if (window.confirm(msg)) onOk();
      return;
    }
    elTit.textContent = titulo;
    elMsg.textContent = msg;
    btnOk.textContent = labelOk;
    btnOk.className   = `btn btn-${tipoBotao}`;
    // Remove listener anterior para evitar duplos disparo
    btnOk.replaceWith(btnOk.cloneNode(true));
    const btnOkNovo = document.getElementById('tm-confirm-ok');
    btnOkNovo.addEventListener('click', () => {
      modal.classList.remove('open');
      onOk();
    });
    modal.classList.add('open');
  }

  /**
   * Exibe um select inline no modal #modal-tm-select para substituir prompt().
   * @param {string}   titulo
   * @param {Array<{id:string,nome:string}>} opcoes
   * @param {Function} onOk — callback(item) com o item escolhido
   */
  function _selectPrompt(titulo, opcoes, onOk) {
    const modal = document.getElementById('modal-tm-select');
    const elTit = document.getElementById('tm-select-titulo');
    const sel   = document.getElementById('tm-select-opcoes');
    const btnOk = document.getElementById('tm-select-ok');
    if (!modal || !elTit || !sel || !btnOk) return;

    elTit.textContent = titulo;
    sel.innerHTML = opcoes.map(o =>
      `<option value="${_x(o.id)}">${_x(o.nome)}</option>`
    ).join('');
    btnOk.replaceWith(btnOk.cloneNode(true));
    const btnOkNovo = document.getElementById('tm-select-ok');
    btnOkNovo.addEventListener('click', () => {
      const escolhido = opcoes.find(o => o.id === sel.value);
      if (!escolhido) return;
      modal.classList.remove('open');
      onOk(escolhido);
    });
    modal.classList.add('open');
  }

  // ══════════════════════════════════════════════════════════════
  // STATUS — helpers de resolução e apresentação
  // ══════════════════════════════════════════════════════════════

  /**
   * Mapa de configuração visual por status de turma.
   * @type {Record<string, {cls:string, label:string}>}
   */
  const STATUS_CFG = {
    aberta:        { cls: 'badge-blue',  label: '◎ Aberta'        },
    em_andamento:  { cls: 'badge-green', label: '● Em andamento'  },
    encerrada:     { cls: 'badge-gray',  label: '▣ Encerrada'     },
    cancelada:     { cls: 'badge-red',   label: '✕ Cancelada'     },
  };

  /**
   * Mapa de classes ativas para os chips de filtro de status.
   */
  const CHIP_CLS = {
    '':            'active-todos',
    aberta:        'active-pub',
    em_andamento:  'active-rev',
    encerrada:     'active-arq',
    cancelada:     'active-exp',
  };

  /**
   * Retorna HTML de badge de status de turma.
   * @param {string} status
   * @returns {string}
   */
  function _statusBadge(status) {
    const cfg = STATUS_CFG[status] || { cls: 'badge-gray', label: status };
    return `<span class="badge ${cfg.cls}" style="white-space:nowrap">${cfg.label}</span>`;
  }

  // ══════════════════════════════════════════════════════════════
  // FILTROS DE STATUS (chips)
  // ══════════════════════════════════════════════════════════════

  /**
   * Ativa o chip de status selecionado e atualiza a tabela.
   * @param {HTMLElement} btn
   * @param {string}      value
   */
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

  /**
   * Limpa todos os filtros e volta ao estado inicial.
   */
  function resetFiltros() {
    ['tm-busca', 'tm-filtro-status', 'tm-filtro-curso', 'tm-filtro-data'].forEach(id => {
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

  // ══════════════════════════════════════════════════════════════
  // STATS — Painel de indicadores
  // ══════════════════════════════════════════════════════════════

  /**
   * Renderiza os cards de estatísticas da página de turmas.
   */
  function renderStats() {
    const wrap = document.getElementById('tm-stats');
    if (!wrap) return;

    const lista   = Storage.Turmas.listar();
    const total   = lista.length;
    const abertas = lista.filter(t => t.status === 'aberta').length;
    const andando = lista.filter(t => t.status === 'em_andamento').length;
    const encerr  = lista.filter(t => t.status === 'encerrada').length;

    const icoGrupo = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;

    const card = (label, val, sub, valCls = '') => `
      <div class="stat">
        <div class="stat-top">
          <div>
            <div class="stat-lbl">${label}</div>
            <div class="stat-val ${valCls}">${val}</div>
          </div>
          <div class="stat-ico">${icoGrupo}</div>
        </div>
        <div class="stat-sub">${sub}</div>
      </div>`;

    wrap.innerHTML =
      card('Total de Turmas', total,   'cadastradas',     '') +
      card('Abertas',         abertas, 'aguardando início','blue') +
      card('Em andamento',    andando, 'em progresso',    'green') +
      card('Encerradas',      encerr,  'concluídas',      '');
  }

  // ══════════════════════════════════════════════════════════════
  // FILTRO DE CURSOS
  // ══════════════════════════════════════════════════════════════

  /**
   * Popula o <select> de cursos com cursos publicados ou que já têm turmas.
   */
  function _popularFiltroCurso() {
    const sel = _q('#tm-filtro-curso');
    if (!sel) return;
    const cursos = Storage.Cursos.listar().filter(c =>
      c.status === 'publicado' || Storage.Turmas.porCurso(c.id).length > 0
    );
    sel.innerHTML =
      '<option value="">Todos os cursos</option>' +
      cursos.map(c => `<option value="${_x(c.id)}">${_x(c.titulo)}</option>`).join('');
  }

  // ══════════════════════════════════════════════════════════════
  // TABELA PRINCIPAL
  // ══════════════════════════════════════════════════════════════

  /**
   * Lê filtros do DOM e (re)renderiza o tbody da tabela de turmas.
   */
  function renderTabela() {
    const busca   = (_q('#tm-busca')?.value        || '').toLowerCase().trim();
    const fStatus = _q('#tm-filtro-status')?.value || '';
    const fCurso  = _q('#tm-filtro-curso')?.value  || '';
    const fData   = _q('#tm-filtro-data')?.value   || '';

    let lista = Storage.Turmas.listar();

    if (busca)   lista = lista.filter(t =>
      t.nome?.toLowerCase().includes(busca) ||
      t.responsavel?.toLowerCase().includes(busca)
    );
    if (fStatus) lista = lista.filter(t => t.status === fStatus);
    if (fCurso)  lista = lista.filter(t => t.cursoId === fCurso);
    if (fData)   lista = lista.filter(t => t.dataInicio && t.dataInicio.slice(0, 10) >= fData);

    // Ordena: mais recente primeiro
    lista.sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0));

    const tbody = _q('#tm-tbody');
    const empty = _q('#tm-empty');
    const count = _q('#tm-count');

    if (count) {
      count.textContent = `${lista.length} ${lista.length === 1 ? 'turma' : 'turmas'}`;
    }

    if (!lista.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = lista.map(t => _renderLinha(t)).join('');
  }

  /**
   * Gera o HTML de uma linha da tabela para uma turma.
   * @param {object} t — turma
   * @returns {string}
   */
  /** Célula: nome e descrição resumida da turma. */
  function _renderCelulaNome(t) {
    const desc = t.descricao ? _x(t.descricao).slice(0, 50) + '…' : '—';
    return `<td>
      <div style="font-weight:600;font-size:13px;color:var(--text)">${_x(t.nome)}</div>
      <div style="font-size:11px;color:var(--text4)">${desc}</div>
    </td>`;
  }

  /** Célula: contagem de alunos e limite. */
  function _renderCelulaAlunos(t) {
    const n      = t.alunos?.length || 0;
    const limite = t.limiteAlunos > 0
      ? `<div style="font-size:10px;color:var(--text4)">${n}/${t.limiteAlunos}</div>`
      : `<div style="font-size:10px;color:var(--text4)">ilimitado</div>`;
    return `<td style="text-align:center">
      <span style="font-size:14px;font-weight:600">${n}</span>
      ${limite}
    </td>`;
  }

  /** Célula: menu dropdown de ações da linha. */
  function _renderMenuAcoes(t) {
    const podeEncerrar = t.status !== 'encerrada' && t.status !== 'cancelada';
    const btnEncerrar  = podeEncerrar
      ? `<button onclick="Turmas.encerrar('${t.id}');Turmas._closeMenus()">
           <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
           Encerrar turma
         </button>`
      : '';
    return `<td>
      <div class="gc-actions">
        <button class="gc-actions-btn" onclick="Turmas._menu(this)" title="Ações">
          Ações
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="gc-menu">
          <button onclick="Turmas.visualizar('${t.id}');Turmas._closeMenus()">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Visualizar
          </button>
          <button onclick="Turmas.abrirEdit('${t.id}');Turmas._closeMenus()">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar
          </button>
          <button onclick="Turmas.abrirGerenciarAlunos('${t.id}');Turmas._closeMenus()">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            Gerenciar alunos
          </button>
          <hr class="sep">
          ${btnEncerrar}
          <hr class="sep">
          <button class="danger" onclick="Turmas.excluir('${t.id}');Turmas._closeMenus()">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            Excluir
          </button>
        </div>
      </div>
    </td>`;
  }

  /**
   * Gera o HTML de uma linha da tabela para uma turma.
   * @param {object} t — turma
   * @returns {string}
   */
  function _renderLinha(t) {
    const curso = t.cursoId ? Storage.Cursos.obter(t.cursoId) : null;
    const prog  = Storage.Turmas.progresso(t.id);

    return `<tr>
      ${_renderCelulaNome(t)}
      <td style="font-size:12px;color:var(--text3)">
        ${curso ? _x(curso.titulo) : '<span style="color:var(--text4)">—</span>'}
      </td>
      ${_renderCelulaAlunos(t)}
      <td style="min-width:90px">
        <div class="gc-prog-wrap">
          <div class="gc-prog-bar"><div class="gc-prog-fill" style="width:${prog}%"></div></div>
          <span class="gc-prog-lbl">${prog}%</span>
        </div>
      </td>
      <td style="font-size:12px;color:var(--text3)">${_x(t.responsavel || '—')}</td>
      <td style="font-size:11px;color:var(--text4)">${_fmtDate(t.dataInicio)}</td>
      <td style="font-size:11px;color:var(--text4)">${_fmtDate(t.dataFim)}</td>
      <td>${_statusBadge(t.status)}</td>
      ${_renderMenuAcoes(t)}
    </tr>`;
  }

  // ══════════════════════════════════════════════════════════════
  // MENU DROPDOWN
  // ══════════════════════════════════════════════════════════════

  /**
   * Abre o menu de ações de uma linha da tabela.
   * @param {HTMLElement} btn
   */
  function _menu(btn) {
    const menu   = btn.nextElementSibling;
    const isOpen = menu.classList.contains('open');
    _closeMenus();
    if (!isOpen) {
      menu.classList.add('open');
      setTimeout(() => document.addEventListener('click', _closeMenus, { once: true }), 10);
    }
  }

  /** Fecha todos os menus abertos */
  function _closeMenus() {
    document.querySelectorAll('.gc-menu.open').forEach(m => m.classList.remove('open'));
  }

  // ══════════════════════════════════════════════════════════════
  // MODAL DE VISUALIZAÇÃO (dashboard da turma)
  // ══════════════════════════════════════════════════════════════

  /**
   * Abre o modal de dashboard de uma turma específica.
   * Exibe progresso individual de cada aluno.
   * @param {string} id
   */
  function visualizar(id) {
    const t = Storage.Turmas.obter(id);
    if (!t) return;
    _viewingId = id;

    const curso  = t.cursoId ? Storage.Cursos.obter(t.cursoId) : null;
    const stats  = Storage.Turmas.stats(id);
    const prog   = Storage.Turmas.progresso(id);

    // Preenche campos do modal
    _setElText('td-nome',        t.nome);
    _setElText('td-curso',       curso ? curso.titulo : '—');
    _setElText('td-total',       t.alunos?.length || 0);
    _setElText('td-pct',         prog + '%');
    _setElText('td-pct-label',   prog + '%');
    _setElText('td-concl',       stats.concluidos);
    _setElText('td-pend',        stats.pendentes);
    _setElText('td-encerramento',_fmtDate(t.dataFim));

    const bar = document.getElementById('td-prog-bar');
    if (bar) bar.style.width = prog + '%';

    // Lista de participantes com progresso individual
    const wrapper = document.getElementById('td-participantes');
    if (wrapper) {
      if (!t.alunos?.length) {
        wrapper.innerHTML = '<div style="color:var(--text4);font-size:13px;padding:12px">Nenhum aluno vinculado</div>';
      } else {
        wrapper.innerHTML = t.alunos.map(alunoId => {
          const al   = Storage.Alunos.obter(alunoId);
          if (!al) return '';
          const pct  = t.cursoId ? Storage.Progresso.pctCurso(alunoId, t.cursoId) : 0;
          const done = t.cursoId ? Storage.Progresso.cursoConcluido(alunoId, t.cursoId) : false;
          return `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
              <div style="width:30px;height:30px;border-radius:50%;background:var(--blue-light);color:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;flex-shrink:0;border:1px solid var(--border)">
                ${(al.nome?.[0] || '?').toUpperCase()}
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:500;color:var(--text)">${_x(al.nome)}</div>
                <div style="font-size:11px;color:var(--text4)">${_x(al.email)}</div>
              </div>
              <div style="min-width:100px">
                <div class="gc-prog-wrap">
                  <div class="gc-prog-bar"><div class="gc-prog-fill" style="width:${pct}%"></div></div>
                  <span class="gc-prog-lbl">${pct}%</span>
                </div>
              </div>
              ${done ? `<span class="badge badge-green" style="flex-shrink:0">✓ Concluído</span>` : ''}
            </div>`;
        }).join('');
      }
    }

    document.getElementById('modal-turma-dash')?.classList.add('open');
  }

  /**
   * Helper para setar textContent pelo ID.
   * @param {string} id
   * @param {string|number} val
   */
  function _setElText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ══════════════════════════════════════════════════════════════
  // MODAL DE CRIAÇÃO / EDIÇÃO
  // ══════════════════════════════════════════════════════════════

  /**
   * Abre o modal para criação de uma nova turma.
   * Reseta todos os campos para o estado inicial.
   */
  function abrirModal() {
    _editId = null;
    _alunosSel.clear();

    _setElText('mt-titulo', 'Nova Turma');
    _setElText('mt-sub', '');

    // Reseta campos de texto e data
    ['mt-nome', 'mt-desc', 'mt-responsavel', 'mt-inicio', 'mt-fim'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    const limite  = document.getElementById('mt-limite');
    const status  = document.getElementById('mt-status');
    const prazo   = document.getElementById('mt-cfg-prazo');
    if (limite) limite.value = '0';
    if (status) status.value = 'aberta';
    if (prazo)  prazo.value  = '0';

    // Toggles — valores padrão
    _setToggle('mt-cfg-auto',     true);
    _setToggle('mt-cfg-bloquear', true);
    _setToggle('mt-cfg-entrada',  true);

    _popularSelectCursos();
    renderListaAlunos();
    tabModal(0, document.querySelector('.mc-tab'));
    document.getElementById('modal-turma')?.classList.add('open');
  }

  /**
   * Abre o modal preenchido com os dados de uma turma existente para edição.
   * @param {string} id
   */
  function abrirEdit(id) {
    const t = Storage.Turmas.obter(id);
    if (!t) return;

    _editId    = id;
    _alunosSel = new Set(t.alunos || []);

    _setElText('mt-titulo', 'Editar Turma');
    _setElText('mt-sub', `Criada em ${_fmtDate(t.criadoEm)}`);

    // Preenche campos
    _setVal('mt-nome',        t.nome        || '');
    _setVal('mt-desc',        t.descricao   || '');
    _setVal('mt-responsavel', t.responsavel || '');
    _setVal('mt-limite',      t.limiteAlunos || 0);
    _setVal('mt-status',      t.status      || 'aberta');
    _setVal('mt-inicio',      t.dataInicio  ? t.dataInicio.slice(0, 10) : '');
    _setVal('mt-fim',         t.dataFim     ? t.dataFim.slice(0, 10)    : '');
    _setVal('mt-cfg-prazo',   t.config?.prazoConclucaoDias || 0);

    const cfg = t.config || {};
    _setToggle('mt-cfg-auto',     cfg.acessoAutomatico !== false);
    _setToggle('mt-cfg-bloquear', cfg.bloquearAposEncerramento !== false);
    _setToggle('mt-cfg-entrada',  cfg.permitirEntradaAposInicio !== false);

    _popularSelectCursos(t.cursoId);
    renderListaAlunos();
    tabModal(0, document.querySelector('.mc-tab'));
    document.getElementById('modal-turma')?.classList.add('open');
  }

  /**
   * Abre o modal de edição já na aba de gerenciamento de alunos.
   * @param {string} id
   */
  function abrirGerenciarAlunos(id) {
    abrirEdit(id);
    setTimeout(() => {
      const tabs = document.querySelectorAll('.mc-tab');
      if (tabs[1]) tabModal(1, tabs[1]);
    }, 50);
  }

  /**
   * Helper para setar value de um campo pelo ID.
   * @param {string} id
   * @param {string|number} val
   */
  function _setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  }

  /**
   * Popula o <select> de cursos dentro do modal.
   * @param {string} [selectedId] — ID do curso pré-selecionado (edição)
   */
  function _popularSelectCursos(selectedId) {
    const sel = document.getElementById('mt-curso');
    if (!sel) return;
    const lista = Storage.Cursos.listar();
    sel.innerHTML =
      '<option value="">Selecione um curso...</option>' +
      lista.map(c =>
        `<option value="${_x(c.id)}" ${c.id === selectedId ? 'selected' : ''}>${_x(c.titulo)}</option>`
      ).join('');
  }

  // ══════════════════════════════════════════════════════════════
  // TABS DO MODAL
  // ══════════════════════════════════════════════════════════════

  /**
   * Ativa a aba de índice `idx` dentro do modal de turma.
   * @param {number}      idx
   * @param {HTMLElement} btn
   */
  function tabModal(idx, btn) {
    document.querySelectorAll('.mc-tab').forEach((t, i) => {
      t.classList.toggle('active', i === idx);
    });
    document.querySelectorAll('#modal-turma .mc-pane').forEach((p, i) => {
      p.classList.toggle('active', i === idx);
    });
    // Ao abrir a aba de alunos, re-renderiza a lista
    if (idx === 1) renderListaAlunos();
  }

  // ══════════════════════════════════════════════════════════════
  // GESTÃO DE ALUNOS NO MODAL
  // ══════════════════════════════════════════════════════════════

  /**
   * Renderiza a lista de alunos selecionáveis dentro do modal.
   * @param {string} [filtro] — texto de busca (opcional, lê do DOM se ausente)
   */
  function renderListaAlunos(filtro) {
    const busca  = (filtro || _q('#mt-aluno-busca')?.value || '').toLowerCase().trim();
    let alunos   = Storage.Alunos.listar().filter(a => a.ativo);

    if (busca) {
      alunos = alunos.filter(a =>
        a.nome?.toLowerCase().includes(busca) ||
        a.email?.toLowerCase().includes(busca)
      );
    }

    const wrap = document.getElementById('mt-alunos-lista');
    if (!wrap) return;

    if (!alunos.length) {
      wrap.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text4);font-size:13px">Nenhum aluno encontrado</div>';
      _atualizarCountAlunos();
      return;
    }

    wrap.innerHTML = alunos.map(al => {
      const sel    = _alunosSel.has(al.id);
      const setor  = al.setorId  ? Storage.Setores.obter(al.setorId)?.nome  || '' : '';
      const equipe = al.equipeId ? Storage.Equipes.obter(al.equipeId)?.nome || '' : '';
      const meta   = [setor, equipe].filter(Boolean).join(' · ');

      return `
        <label style="display:flex;align-items:center;gap:10px;padding:9px 12px;cursor:pointer;transition:background .1s;${sel ? 'background:var(--blue-light)' : ''}"
          onmouseover="this.style.background='var(--blue-light)'"
          onmouseout="this.style.background='${sel ? 'var(--blue-light)' : ''}'"
          onclick="Turmas._toggleAluno('${al.id}',this)">
          <input type="checkbox" ${sel ? 'checked' : ''} style="width:14px;height:14px;accent-color:var(--blue);cursor:pointer" onclick="event.stopPropagation()">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--blue-light);color:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;flex-shrink:0">
            ${(al.nome?.[0] || '?').toUpperCase()}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:500;color:var(--text)">${_x(al.nome)}</div>
            <div style="font-size:11px;color:var(--text4)">${_x(al.email)}${meta ? ` · ${_x(meta)}` : ''}</div>
          </div>
        </label>`;
    }).join('');

    _atualizarCountAlunos();
  }

  /** Dispara re-render ao digitar no campo de busca de alunos */
  function filtrarAlunos() {
    renderListaAlunos();
  }

  /**
   * Alterna a seleção de um aluno na lista do modal.
   * @param {string}      id    — ID do aluno
   * @param {HTMLElement} label — elemento <label> clicado
   */
  function _toggleAluno(id, label) {
    const chk = label.querySelector('input[type=checkbox]');
    if (_alunosSel.has(id)) {
      _alunosSel.delete(id);
      label.style.background = '';
      if (chk) chk.checked = false;
    } else {
      _alunosSel.add(id);
      label.style.background = 'var(--blue-light)';
      if (chk) chk.checked = true;
    }
    _atualizarCountAlunos();
  }

  /**
   * Atualiza o contador de alunos selecionados no modal.
   */
  function _atualizarCountAlunos() {
    const el = document.getElementById('mt-alunos-count');
    if (el) el.textContent = _alunosSel.size;
  }

  // ══════════════════════════════════════════════════════════════
  // SELEÇÕES RÁPIDAS DE ALUNOS
  // ══════════════════════════════════════════════════════════════

  /**
   * Adiciona todos os alunos de um setor escolhido via modal de seleção.
   */
  function selecionarPorSetor() {
    const setores = Storage.Setores.listar();
    if (!setores.length) { _toast('Nenhum setor cadastrado.', 'i'); return; }

    _selectPrompt('Selecionar por setor', setores, (setor) => {
      const ids = Storage.Alunos.porSetor(setor.id).map(a => a.id);
      ids.forEach(id => _alunosSel.add(id));
      renderListaAlunos();
      _toast(`${ids.length} aluno(s) do setor "${setor.nome}" adicionados.`, 's');
    });
  }

  /**
   * Adiciona todos os alunos de uma equipe escolhida via modal de seleção.
   */
  function selecionarPorEquipe() {
    const equipes = Storage.Equipes.listar();
    if (!equipes.length) { _toast('Nenhuma equipe cadastrada.', 'i'); return; }

    _selectPrompt('Selecionar por equipe', equipes, (equipe) => {
      const ids = Storage.Alunos.porEquipe(equipe.id).map(a => a.id);
      ids.forEach(id => _alunosSel.add(id));
      renderListaAlunos();
      _toast(`${ids.length} aluno(s) da equipe "${equipe.nome}" adicionados.`, 's');
    });
  }

  /** Seleciona todos os alunos ativos. */
  function selecionarTodos() {
    Storage.Alunos.listar().filter(a => a.ativo).forEach(a => _alunosSel.add(a.id));
    renderListaAlunos();
  }

  /** Remove todos os alunos da seleção. */
  function limparAlunos() {
    _alunosSel.clear();
    renderListaAlunos();
  }

  // ══════════════════════════════════════════════════════════════
  // SALVAR TURMA
  // ══════════════════════════════════════════════════════════════

  /**
   * Lê os campos do modal, valida e persiste a turma (nova ou editada).
   * Chamado pelo botão "Salvar" do modal.
   */
  function salvar() {
    const nome    = document.getElementById('mt-nome')?.value.trim();
    const cursoId = document.getElementById('mt-curso')?.value;

    if (!nome)    { _toast('Informe o nome da turma.', 'e'); return; }
    if (!cursoId) { _toast('Selecione um curso.', 'e'); return; }

    const inicio = document.getElementById('mt-inicio')?.value;
    const fim    = document.getElementById('mt-fim')?.value;

    const dados = {
      nome,
      cursoId,
      descricao:    document.getElementById('mt-desc')?.value.trim()        || '',
      responsavel:  document.getElementById('mt-responsavel')?.value.trim() || '',
      limiteAlunos: parseInt(document.getElementById('mt-limite')?.value)   || 0,
      status:       document.getElementById('mt-status')?.value             || 'aberta',
      dataInicio:   inicio ? new Date(inicio).toISOString() : '',
      dataFim:      fim    ? new Date(fim).toISOString()    : '',
      alunos:       [..._alunosSel],
      config: {
        acessoAutomatico:          _getToggleOn('mt-cfg-auto'),
        bloquearAposEncerramento:  _getToggleOn('mt-cfg-bloquear'),
        permitirEntradaAposInicio: _getToggleOn('mt-cfg-entrada'),
        prazoConclucaoDias:        parseInt(document.getElementById('mt-cfg-prazo')?.value) || 0,
      },
    };

    if (_editId) {
      Storage.Turmas.atualizar(_editId, dados);
      _toast('Turma atualizada!', 's');
    } else {
      Storage.Turmas.criar(dados);
      _toast('Turma criada com sucesso!', 's');
    }

    document.getElementById('modal-turma')?.classList.remove('open');
    _editId = null;
    _alunosSel.clear();
    refresh();
  }

  // ══════════════════════════════════════════════════════════════
  // AÇÕES INDIVIDUAIS
  // ══════════════════════════════════════════════════════════════

  /**
   * Encerra uma turma (status → 'encerrada').
   * @param {string} id
   */
  function encerrar(id) {
    const t = Storage.Turmas.obter(id);
    if (!t) return;
    _confirm(
      'Encerrar turma',
      `Deseja encerrar a turma "${t.nome}"? Esta ação não pode ser desfeita.`,
      'Encerrar',
      'danger',
      () => {
        Storage.Turmas.encerrar(id);
        _toast('Turma encerrada.', 'i');
        refresh();
      }
    );
  }

  /**
   * Exclui permanentemente uma turma.
   * @param {string} id
   */
  function excluir(id) {
    const t = Storage.Turmas.obter(id);
    if (!t) return;
    _confirm(
      'Excluir turma',
      `Excluir permanentemente "${t.nome}"? Esta ação não pode ser desfeita.`,
      'Excluir',
      'danger',
      () => {
        Storage.Turmas.excluir(id);
        _toast('Turma excluída.', 'i');
        refresh();
      }
    );
  }

  // ══════════════════════════════════════════════════════════════
  // REFRESH E PONTO DE ENTRADA
  // ══════════════════════════════════════════════════════════════

  /**
   * Re-renderiza todos os componentes do módulo.
   */
  function refresh() {
    renderStats();
    renderTabela();
    _popularFiltroCurso();
  }

  /**
   * Inicializa o módulo. Chamado pelo Admin.go('turmas').
   */
  function init() {
    renderStats();
    renderTabela();
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

    // Filtros
    setStatus,
    resetFiltros,
    filtrarAlunos,

    // Modal
    abrirModal,
    abrirEdit,
    abrirGerenciarAlunos,
    salvar,
    tabModal,

    // Lista de alunos
    renderListaAlunos,
    selecionarPorSetor,
    selecionarPorEquipe,
    selecionarTodos,
    limparAlunos,

    // Ações individuais
    visualizar,
    encerrar,
    excluir,

    // Menu dropdown
    _menu,
    _closeMenus,

    // Seleção de aluno (chamado pelo HTML inline)
    _toggleAluno,

    // Estado exposto (necessário para o botão do modal-dash)
    get _viewingId() { return _viewingId; },
  };
})();
