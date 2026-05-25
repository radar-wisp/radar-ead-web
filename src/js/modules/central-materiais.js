/**
 * @fileoverview central-materiais.js — Módulo: Central de Materiais
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO ISOLADO — Central de Materiais de Apoio                  ║
 * ║                                                                  ║
 * ║  Responsabilidades:                                              ║
 * ║  • Stats/indicadores do painel de materiais                      ║
 * ║  • Tabela com filtros (busca, tipo, curso, status, data)         ║
 * ║  • Seleção e ações em lote (ativar, arquivar, excluir)           ║
 * ║  • Modal de criação e edição de material (3 tabs)                ║
 * ║  • Upload de arquivo com drag & drop                             ║
 * ║  • Modo link externo                                             ║
 * ║  • Visualizador inline (vídeo, PDF, imagem, link)                ║
 * ║  • Vinculação de material a cursos adicionais                    ║
 * ║  • Ações individuais: arquivar, excluir, duplicar, baixar        ║
 * ║                                                                  ║
 * ║  Contrato de entrada (dependências externas):                    ║
 * ║  • window.Storage  — camada de dados (storage.js)                ║
 * ║    └─ Storage.Materiais, Storage.Cursos, Storage.Modulos         ║
 * ║                                                                  ║
 * ║  Contrato de saída (API pública exposta em window.MatMod):       ║
 * ║  • init(), refresh(), renderTabela()                             ║
 * ║  • setStatus(btn, value), resetFiltros()                         ║
 * ║  • abrirModal(), abrirEdit(id), salvar()                         ║
 * ║  • visualizar(id), arquivar(id), excluir(id)                     ║
 * ║  • duplicar(id), baixar(id)                                      ║
 * ║  • abrirVincular(id), confirmarVinculo()                         ║
 * ║  • toggleSel(id, checked), toggleSelAll(checkbox)                ║
 * ║  • ativarLote(), arquivarLote(), excluirLote()                   ║
 * ║  • tabModal(idx, btn)                                            ║
 * ║  • setUploadMode(mode)                                           ║
 * ║  • handleFile(input), onDragOver(e), onDragLeave(e), onDrop(e)  ║
 * ║  • _menu(btn), _closeMenus()                                     ║
 * ║                                                                  ║
 * ║  MIGRAÇÃO BACKEND: Apenas window.Storage precisa mudar.          ║
 * ║  Este módulo NÃO acessa localStorage diretamente.                ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * @module CentralMateriais
 * @version 1.0.0
 * @see docs/ARCHITECTURE.md
 */

/* global Storage */

var MatMod = (() => {
  'use strict';

  // ── Estado interno do módulo ──────────────────────────────────
  let _editId      = null;    // ID do material sendo editado (null = novo)
  let _uploadMode  = 'file';  // 'file' | 'link'
  let _fileAtual   = null;    // { nome, tamanho, tipo, url } — arquivo selecionado
  let _selecionados = new Set();
  let _vincularId  = null;    // ID do material sendo vinculado a curso

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
   * Formata bytes para exibição legível.
   * @param {number|string} b
   * @returns {string}
   */
  function _fmtBytes(b) {
    if (!b || isNaN(+b)) return '—';
    const n = +b;
    if (n < 1024)    return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
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
  // CONFIGURAÇÕES VISUAIS POR TIPO E STATUS
  // ══════════════════════════════════════════════════════════════

  /**
   * Configuração visual por tipo de material.
   * @type {Record<string, {label:string, bg:string, txt:string}>}
   */
  const TIPO_CFG = {
    pdf:    { label: 'PDF',          bg: '#fee2e2', txt: '#b91c1c' },
    video:  { label: 'Vídeo',        bg: '#fef3c7', txt: '#b45309' },
    xlsx:   { label: 'Planilha',     bg: '#d1fae5', txt: '#065f46' },
    doc:    { label: 'Documento',    bg: '#dbeafe', txt: '#1e40af' },
    imagem: { label: 'Imagem',       bg: '#ede9fe', txt: '#5b21b6' },
    link:   { label: 'Link',         bg: '#ede9fe', txt: '#7c3aed' },
    zip:    { label: 'ZIP',          bg: '#fef3c7', txt: '#92400e' },
    pptx:   { label: 'Apresentação', bg: '#fee2e2', txt: '#991b1b' },
    quiz:   { label: 'Avaliação',    bg: '#fef9c3', txt: '#713f12' },
    outro:  { label: 'Outro',        bg: '#f0f0f8', txt: '#5252a0' },
  };

  /**
   * Retorna HTML de badge colorido por tipo.
   * @param {string} tipo
   * @returns {string}
   */
  function _tipoBadge(tipo) {
    const c = TIPO_CFG[tipo] || TIPO_CFG.outro;
    return `<span style="display:inline-block;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;background:${c.bg};color:${c.txt}">${c.label}</span>`;
  }

  /**
   * Configuração visual por status de material.
   */
  const STATUS_CFG = {
    ativo:     { cls: 'badge-green', label: '● Ativo'     },
    oculto:    { cls: 'badge-amber', label: '◉ Oculto'    },
    arquivado: { cls: 'badge-gray',  label: '▣ Arquivado' },
  };

  function _statusBadge(s) {
    const c = STATUS_CFG[s] || STATUS_CFG.ativo;
    return `<span class="badge ${c.cls}">${c.label}</span>`;
  }

  // ══════════════════════════════════════════════════════════════
  // CHIPS DE FILTRO DE STATUS
  // ══════════════════════════════════════════════════════════════

  const CHIP_CLS = {
    '':        '',
    ativo:     'active-pub',
    oculto:    'active-arq',
    arquivado: 'active-ras',
  };

  /**
   * Ativa o chip de status selecionado e atualiza a tabela.
   * @param {HTMLElement} btn
   * @param {string}      value
   */
  function setStatus(btn, value) {
    document.querySelectorAll('.ift-chip[data-mstatus]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
    });
    if (value && CHIP_CLS[value]) btn.classList.add(CHIP_CLS[value]);
    const sel = document.getElementById('mat-filtro-status');
    if (sel) sel.value = value;
    renderTabela();
    _updateBadge();
  }

  /**
   * Limpa todos os filtros ativos.
   */
  function resetFiltros() {
    ['mat-busca', 'mat-filtro-tipo', 'mat-filtro-curso', 'mat-filtro-status', 'mat-filtro-data'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const ord = document.getElementById('mat-order');
    if (ord) ord.value = 'recente';
    document.querySelectorAll('.ift-chip[data-mstatus]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
    });
    renderTabela();
    _updateBadge();
  }

  /**
   * Atualiza o badge de contagem de filtros ativos.
   */
  function _updateBadge() {
    const badge = document.getElementById('mat-badge');
    if (!badge) return;
    let n = 0;
    ['mat-busca', 'mat-filtro-tipo', 'mat-filtro-curso', 'mat-filtro-status', 'mat-filtro-data']
      .forEach(id => { if (document.getElementById(id)?.value?.trim()) n++; });
    badge.textContent = n;
    badge.classList.toggle('show', n > 0);
  }

  // ══════════════════════════════════════════════════════════════
  // STATS
  // ══════════════════════════════════════════════════════════════

  /**
   * Renderiza os cards de estatísticas do painel de materiais.
   */
  function renderStats() {
    const wrap = document.getElementById('mat-stats');
    if (!wrap) return;

    const st = Storage.Materiais.stats();
    const icoFolder = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;

    const card = (label, val, sub, cls = '') => `
      <div class="stat">
        <div class="stat-top">
          <div>
            <div class="stat-lbl">${label}</div>
            <div class="stat-val ${cls}">${val}</div>
          </div>
          <div class="stat-ico">${icoFolder}</div>
        </div>
        <div class="stat-sub">${sub}</div>
      </div>`;

    wrap.innerHTML =
      card('Total',      st.total,      'na biblioteca') +
      card('PDFs',       st.pdf,        'documentos') +
      card('Vídeos',     st.video,      'gravações') +
      card('Ativos',     st.ativos,     'disponíveis', 'blue') +
      card('Arquivados', st.arquivados, 'desativados');
  }

  // ══════════════════════════════════════════════════════════════
  // FILTRO DE CURSOS
  // ══════════════════════════════════════════════════════════════

  function _popularFiltroCurso() {
    const sel = document.getElementById('mat-filtro-curso');
    if (!sel) return;
    const cursos = Storage.Cursos.listar();
    sel.innerHTML =
      '<option value="">Curso</option>' +
      cursos.map(c => `<option value="${_x(c.id)}">${_x(c.titulo)}</option>`).join('');
  }

  // ══════════════════════════════════════════════════════════════
  // TABELA PRINCIPAL
  // ══════════════════════════════════════════════════════════════

  /**
   * Lê filtros do DOM e (re)renderiza o tbody da tabela de materiais.
   */
  function renderTabela() {
    const busca   = (_q('#mat-busca')?.value         || '').toLowerCase().trim();
    const fTipo   = _q('#mat-filtro-tipo')?.value    || '';
    const fCurso  = _q('#mat-filtro-curso')?.value   || '';
    const fStatus = _q('#mat-filtro-status')?.value  || '';
    const fData   = _q('#mat-filtro-data')?.value    || '';
    const ordem   = _q('#mat-order')?.value          || 'recente';

    let lista = Storage.Materiais.listar();

    if (busca) lista = lista.filter(m =>
      m.nome?.toLowerCase().includes(busca) ||
      m.tags?.toLowerCase().includes(busca) ||
      m.responsavel?.toLowerCase().includes(busca) ||
      m.categoria?.toLowerCase().includes(busca)
    );
    if (fTipo)   lista = lista.filter(m => m.tipo === fTipo);
    if (fCurso)  lista = lista.filter(m => m.cursoId === fCurso || (m.cursosVinc || []).includes(fCurso));
    if (fStatus) lista = lista.filter(m => (m.status || 'ativo') === fStatus);
    if (fData)   lista = lista.filter(m => m.criadoEm && m.criadoEm.slice(0, 10) >= fData);

    lista.sort((a, b) => {
      if (ordem === 'az')     return (a.nome || '').localeCompare(b.nome || '');
      if (ordem === 'za')     return (b.nome || '').localeCompare(a.nome || '');
      if (ordem === 'antigo') return new Date(a.criadoEm) - new Date(b.criadoEm);
      return new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0);
    });

    const tbody = _q('#mat-tbody');
    const empty = _q('#mat-empty');
    const count = _q('#mat-count');

    if (count) {
      count.textContent = `${lista.length} ${lista.length === 1 ? 'material' : 'materiais'}`;
    }

    if (!lista.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = lista.map(m => _renderLinha(m)).join('');
  }

  /**
   * Gera o HTML de uma linha da tabela para um material.
   * @param {object} m — material
   * @returns {string}
   */
  function _renderLinha(m) {
    const curso  = m.cursoId ? Storage.Cursos.obter(m.cursoId) : null;
    const status = m.status || 'ativo';
    const vinc   = (m.cursosVinc || []).length;
    const sel    = _selecionados.has(m.id);
    const tipoCfg = TIPO_CFG[m.tipo] || TIPO_CFG.outro;

    const temUrl = m.url && m.url !== '#simulado';

    return `<tr class="${sel ? 'selected' : ''}" id="mrow-${m.id}">
      <td style="padding:8px 10px">
        <input type="checkbox" class="row-check" ${sel ? 'checked' : ''}
          onchange="MatMod.toggleSel('${m.id}',this.checked)"
          style="width:14px;height:14px;accent-color:var(--blue);cursor:pointer">
      </td>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:var(--radius-sm);background:${tipoCfg.bg};color:${tipoCfg.txt};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;flex-shrink:0">
            ${tipoCfg.label.slice(0, 3).toUpperCase()}
          </div>
          <div style="min-width:0">
            <div style="font-weight:600;font-size:13px;color:var(--text)">${_x(m.nome)}</div>
            <div style="font-size:11px;color:var(--text4)">${m.descricao ? _x(m.descricao).slice(0, 55) : (m.tags ? '🏷 ' + _x(m.tags) : '—')}</div>
          </div>
        </div>
      </td>
      <td>${_tipoBadge(m.tipo)}</td>
      <td style="font-size:12px">
        ${curso ? `<span style="color:var(--text2)">${_x(curso.titulo)}</span>` : '<span style="color:var(--text4)">—</span>'}
        ${vinc > 0 ? `<div style="font-size:10px;color:var(--blue);margin-top:2px">+${vinc} curso${vinc > 1 ? 's' : ''} vinculado${vinc > 1 ? 's' : ''}</div>` : ''}
      </td>
      <td style="font-size:12px;color:var(--text3)">${_x(m.categoria || '—')}</td>
      <td style="font-size:12px;color:var(--text4)">${m.tamanho || '—'}</td>
      <td>${_statusBadge(status)}</td>
      <td style="font-size:11px;color:var(--text4)">${_fmtDate(m.criadoEm)}</td>
      <td>
        <div class="gc-actions">
          <button class="gc-actions-btn" onclick="MatMod._menu(this)">
            Ações
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="gc-menu">
            <button onclick="MatMod.visualizar('${m.id}');MatMod._closeMenus()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Visualizar
            </button>
            <button onclick="MatMod.abrirEdit('${m.id}');MatMod._closeMenus()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>
            <button onclick="MatMod.abrirVincular('${m.id}');MatMod._closeMenus()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Vincular a curso
            </button>
            <button onclick="MatMod.duplicar('${m.id}');MatMod._closeMenus()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Duplicar
            </button>
            ${temUrl ? `
            <button onclick="MatMod.baixar('${m.id}');MatMod._closeMenus()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Baixar
            </button>` : ''}
            <hr class="sep">
            <button onclick="MatMod.arquivar('${m.id}');MatMod._closeMenus()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><rect x="1" y="3" width="22" height="5" rx="1"/></svg>
              Arquivar
            </button>
            <hr class="sep">
            <button class="danger" onclick="MatMod.excluir('${m.id}');MatMod._closeMenus()">
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
    const menu   = btn.nextElementSibling;
    const isOpen = menu.classList.contains('open');
    _closeMenus();
    if (!isOpen) {
      menu.classList.add('open');
      setTimeout(() => document.addEventListener('click', _closeMenus, { once: true }), 10);
    }
  }

  function _closeMenus() {
    document.querySelectorAll('.gc-menu.open').forEach(m => m.classList.remove('open'));
  }

  // ══════════════════════════════════════════════════════════════
  // SELEÇÃO EM LOTE
  // ══════════════════════════════════════════════════════════════

  function toggleSel(id, checked) {
    checked ? _selecionados.add(id) : _selecionados.delete(id);
    const row = document.getElementById('mrow-' + id);
    if (row) row.classList.toggle('selected', checked);
    _atualizarLote();
  }

  function toggleSelAll(checkbox) {
    Storage.Materiais.listar().forEach(m => {
      checkbox.checked ? _selecionados.add(m.id) : _selecionados.delete(m.id);
    });
    document.querySelectorAll('.row-check').forEach(ch => ch.checked = checkbox.checked);
    document.querySelectorAll('#mat-tbody tr').forEach(r =>
      r.classList.toggle('selected', checkbox.checked)
    );
    _atualizarLote();
  }

  function _atualizarLote() {
    const n     = _selecionados.size;
    const count = document.getElementById('mat-sel-count');
    if (count) count.textContent = `${n} material(is) selecionado(s)`;
    const row = document.getElementById('mat-lote-row');
    if (row) row.classList.toggle('show', n > 0);
  }

  function ativarLote() {
    if (!_selecionados.size) return;
    _selecionados.forEach(id => Storage.Materiais.atualizar(id, { status: 'ativo' }));
    _toast(`${_selecionados.size} material(is) ativado(s).`, 's');
    _selecionados.clear();
    refresh();
  }

  function arquivarLote() {
    if (!_selecionados.size || !confirm(`Arquivar ${_selecionados.size} material(is)?`)) return;
    _selecionados.forEach(id => Storage.Materiais.arquivar(id));
    _toast(`${_selecionados.size} material(is) arquivado(s).`, 'i');
    _selecionados.clear();
    refresh();
  }

  function excluirLote() {
    if (!_selecionados.size || !confirm(`Excluir permanentemente ${_selecionados.size} material(is)?`)) return;
    _selecionados.forEach(id => Storage.Materiais.excluir(id));
    _toast(`${_selecionados.size} material(is) excluído(s).`, 'i');
    _selecionados.clear();
    refresh();
  }

  // ══════════════════════════════════════════════════════════════
  // AÇÕES INDIVIDUAIS
  // ══════════════════════════════════════════════════════════════

  function arquivar(id) {
    Storage.Materiais.arquivar(id);
    _toast('Material arquivado.', 'i');
    refresh();
  }

  function excluir(id) {
    if (!confirm('Excluir permanentemente este material?')) return;
    Storage.Materiais.excluir(id);
    _toast('Material excluído.', 'i');
    refresh();
  }

  function duplicar(id) {
    const m = Storage.Materiais.obter(id);
    if (!m) return;
    Storage.Materiais.criar({ ...m, id: undefined, nome: '[Cópia] ' + m.nome, criadoEm: undefined });
    _toast('Material duplicado!', 's');
    refresh();
  }

  function baixar(id) {
    const m = Storage.Materiais.obter(id);
    if (!m || !m.url || m.url === '#simulado') { _toast('URL não disponível.', 'e'); return; }
    const a    = document.createElement('a');
    a.href     = m.url;
    a.download = m.nome || 'material';
    a.target   = '_blank';
    a.click();
  }

  // ══════════════════════════════════════════════════════════════
  // VISUALIZADOR INLINE
  // ══════════════════════════════════════════════════════════════

  /**
   * Abre o modal visualizador com o conteúdo apropriado para o tipo.
   * @param {string} id
   */
  function visualizar(id) {
    const m = Storage.Materiais.obter(id);
    if (!m) return;

    const nomeEl = document.getElementById('viewer-nome');
    const metaEl = document.getElementById('viewer-meta');
    const dlBtn  = document.getElementById('viewer-dl-btn');
    const body   = document.getElementById('viewer-body');

    if (nomeEl) nomeEl.textContent = m.nome || '—';
    if (metaEl) metaEl.textContent = [
      TIPO_CFG[m.tipo]?.label,
      m.tamanho,
      _fmtDate(m.criadoEm),
    ].filter(Boolean).join(' · ');

    if (dlBtn) dlBtn.style.display = m.config?.permitirDownload !== false ? '' : 'none';

    if (body) {
      body.innerHTML = _renderViewer(m);
    }

    document.getElementById('modal-viewer')?.classList.add('open');
  }

  /**
   * Gera o HTML do conteúdo do visualizador conforme o tipo do material.
   * @param {object} m — material
   * @returns {string}
   */
  function _renderViewer(m) {
    const temUrl = m.url && m.url !== '#simulado';
    const tipoCfg = TIPO_CFG[m.tipo] || TIPO_CFG.outro;

    if (m.tipo === 'video' && temUrl) {
      return `<video controls style="max-width:100%;max-height:60vh;border-radius:var(--radius-sm)">
        <source src="${_x(m.url)}">Seu navegador não suporta vídeo.
      </video>`;
    }

    if (m.tipo === 'link' && m.url) {
      return `
        <div style="text-align:center">
          <div style="font-size:36px;margin-bottom:16px">🔗</div>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:8px">${_x(m.nome)}</div>
          <div style="font-size:12px;color:var(--text4);margin-bottom:20px">${_x(m.url)}</div>
          <a href="${_x(m.url)}" target="_blank" class="btn btn-primary">Abrir link externo</a>
        </div>`;
    }

    if (m.tipo === 'pdf' && temUrl) {
      return `<iframe src="${_x(m.url)}" style="width:100%;height:500px;border:none;border-radius:var(--radius-sm)"></iframe>`;
    }

    if (m.tipo === 'imagem' && m.url?.startsWith('data:')) {
      return `<img src="${_x(m.url)}" style="max-width:100%;max-height:500px;border-radius:var(--radius-sm);object-fit:contain">`;
    }

    // Fallback genérico
    return `
      <div style="text-align:center;padding:24px">
        <div style="width:64px;height:64px;border-radius:12px;background:${tipoCfg.bg};color:${tipoCfg.txt};font-size:20px;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          ${tipoCfg.label.slice(0, 3).toUpperCase()}
        </div>
        <div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:6px">${_x(m.nome)}</div>
        <div style="font-size:12px;color:var(--text4);margin-bottom:20px">${_x(m.descricao || 'Sem descrição')}</div>
        ${temUrl
          ? `<a href="${_x(m.url)}" download="${_x(m.nome)}" class="btn btn-primary">Baixar arquivo</a>`
          : '<span style="font-size:12px;color:var(--text4)">Arquivo simulado — sem URL real</span>'}
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════
  // VINCULAR A OUTRO CURSO
  // ══════════════════════════════════════════════════════════════

  function abrirVincular(id) {
    _vincularId = id;
    const m   = Storage.Materiais.obter(id);
    const el  = document.getElementById('mv-nome');
    if (el) el.textContent = m ? `Material: ${m.nome}` : '';

    const sel    = document.getElementById('mv-curso-sel');
    const cursos = Storage.Cursos.listar().filter(c => c.id !== m?.cursoId);
    if (sel) {
      sel.innerHTML =
        '<option value="">Selecione um curso...</option>' +
        cursos.map(c => `<option value="${_x(c.id)}">${_x(c.titulo)}</option>`).join('');
    }
    document.getElementById('modal-vincular')?.classList.add('open');
  }

  function confirmarVinculo() {
    const cursoId = document.getElementById('mv-curso-sel')?.value;
    if (!cursoId || !_vincularId) { alert('Selecione um curso.'); return; }
    Storage.Materiais.vincular(_vincularId, cursoId);
    const c = Storage.Cursos.obter(cursoId);
    _toast(`Material vinculado a "${c?.titulo || 'curso'}"!`, 's');
    document.getElementById('modal-vincular')?.classList.remove('open');
    _vincularId = null;
    refresh();
  }

  // ══════════════════════════════════════════════════════════════
  // MODAL DE CRIAÇÃO / EDIÇÃO
  // ══════════════════════════════════════════════════════════════

  /**
   * Abre o modal para criação de um novo material.
   */
  function abrirModal() {
    _editId    = null;
    _fileAtual = null;
    _uploadMode = 'file';

    const tituloEl = document.getElementById('mm-titulo');
    const subEl    = document.getElementById('mm-sub');
    if (tituloEl) tituloEl.textContent = 'Novo Material';
    if (subEl)    subEl.textContent    = '';

    ['mm-nome', 'mm-desc', 'mm-responsavel', 'mm-url', 'mm-url-texto'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    _setVal('mm-tipo',      '');
    _setVal('mm-categoria', '');
    _setVal('mm-status',    'ativo');

    const dzText = document.getElementById('mm-dropzone-text');
    const dzSub  = document.getElementById('mm-dropzone-sub');
    if (dzText) dzText.textContent = 'Arraste o arquivo ou clique para selecionar';
    if (dzSub)  dzSub.textContent  = 'PDF · MP4 · XLSX · DOC · PPTX · IMG · ZIP — máx. 100MB';

    const prev = document.getElementById('mm-file-preview');
    if (prev) prev.style.display = 'none';

    _popularSelectCursoModal();
    _renderConfigModal({});
    setUploadMode('file');
    tabModal(0, document.querySelector('#modal-material .mc-tab'));
    document.getElementById('modal-material')?.classList.add('open');
  }

  /**
   * Abre o modal preenchido com dados de um material existente.
   * @param {string} id
   */
  function abrirEdit(id) {
    const m = Storage.Materiais.obter(id);
    if (!m) return;

    _editId    = id;
    _fileAtual = null;

    const tituloEl = document.getElementById('mm-titulo');
    const subEl    = document.getElementById('mm-sub');
    if (tituloEl) tituloEl.textContent = 'Editar Material';
    if (subEl)    subEl.textContent    = `Criado em ${_fmtDate(m.criadoEm)}`;

    _setVal('mm-nome',        m.nome);
    _setVal('mm-desc',        m.descricao);
    _setVal('mm-responsavel', m.responsavel);
    _setVal('mm-tipo',        m.tipo);
    _setVal('mm-categoria',   m.categoria);
    _setVal('mm-status',      m.status || 'ativo');
    _setVal('mm-url',         m.url !== '#simulado' ? m.url : '');

    _popularSelectCursoModal(m.cursoId);
    _carregarModulos(m.cursoId, m.moduloId);
    _renderConfigModal(m.config || {});

    if (m.tipo === 'link') {
      setUploadMode('link');
    } else {
      setUploadMode('file');
      if (m.nome) {
        const dt = document.getElementById('mm-dropzone-text');
        const ds = document.getElementById('mm-dropzone-sub');
        if (dt) dt.textContent = m.nome;
        if (ds) ds.textContent = m.tamanho || '';
      }
    }

    tabModal(0, document.querySelector('#modal-material .mc-tab'));
    document.getElementById('modal-material')?.classList.add('open');
  }

  /** Helper para setar value de campo pelo ID */
  function _setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  /**
   * Popula o <select> de cursos dentro do modal.
   * @param {string} [selectedId]
   */
  function _popularSelectCursoModal(selectedId) {
    const sel = document.getElementById('mm-curso');
    if (!sel) return;
    const cursos = Storage.Cursos.listar();
    sel.innerHTML =
      '<option value="">Sem curso vinculado</option>' +
      cursos.map(c =>
        `<option value="${_x(c.id)}" ${c.id === selectedId ? 'selected' : ''}>${_x(c.titulo)}</option>`
      ).join('');
    sel.onchange = () => _carregarModulos(sel.value);
    if (selectedId) _carregarModulos(selectedId);
  }

  /**
   * Popula o <select> de módulos conforme o curso selecionado.
   * @param {string} cursoId
   * @param {string} [selectedId]
   */
  function _carregarModulos(cursoId, selectedId) {
    const sel = document.getElementById('mm-modulo');
    if (!sel) return;
    const mods = cursoId ? Storage.Modulos.listarPorCurso(cursoId) : [];
    sel.disabled = !cursoId || mods.length === 0;
    sel.innerHTML =
      '<option value="">' +
      (!cursoId ? 'Selecione um curso primeiro' : mods.length === 0 ? 'Nenhum módulo cadastrado' : 'Selecione um módulo...') +
      '</option>' +
      mods.map(m =>
        `<option value="${_x(m.id)}" ${m.id === selectedId ? 'selected' : ''}>${_x(m.titulo)}</option>`
      ).join('');
  }

  /**
   * Renderiza os toggles de configuração do material no modal.
   * @param {object} cfg — configurações atuais
   */
  function _renderConfigModal(cfg) {
    const wrap = document.getElementById('mm-config-body');
    if (!wrap) return;

    const togRow = (id, label, desc, val) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px">${label}</div>
          <div style="font-size:11px;color:var(--text4)">${desc}</div>
        </div>
        <div id="${id}" class="toggle ${val ? 'on' : ''}"
          onclick="this.classList.toggle('on');this.querySelector('span').style.left=this.classList.contains('on')?'21px':'3px';this.style.background=this.classList.contains('on')?'var(--blue)':'var(--border2)'"
          style="position:relative;width:40px;height:22px;background:${val ? 'var(--blue)' : 'var(--border2)'};border-radius:11px;cursor:pointer;transition:background .2s;flex-shrink:0">
          <span style="position:absolute;top:3px;left:${val ? 21 : 3}px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></span>
        </div>
      </div>`;

    wrap.innerHTML =
      togRow('mmcfg-obrig',   'Material obrigatório',             'O aluno deve acessar para progredir',          cfg.obrigatorio) +
      togRow('mmcfg-dl',      'Permitir download',                'O aluno pode baixar o arquivo',                cfg.permitirDownload !== false) +
      togRow('mmcfg-ocultar', 'Ocultar após conclusão',           'Desaparece para quem concluiu o curso',        cfg.ocultarAposConclusao) +
      togRow('mmcfg-turma',   'Exibir apenas para turma',         'Visível somente para turmas específicas',      cfg.apenasParaTurma) +
      togRow('mmcfg-compl',   'Material complementar',            'Indicado como recurso extra, não obrigatório', cfg.complementar) +
      togRow('mmcfg-antes',   'Necessário antes da próxima aula', 'Bloqueia avanço até o aluno visualizar',       cfg.necessarioAntesDaProxima);
  }

  // ══════════════════════════════════════════════════════════════
  // UPLOAD — FILE E DRAG & DROP
  // ══════════════════════════════════════════════════════════════

  /**
   * Alterna entre modo de upload por arquivo ou link externo.
   * @param {'file'|'link'} mode
   */
  function setUploadMode(mode) {
    _uploadMode = mode;

    const mFile = document.getElementById('mm-mode-file');
    const mLink = document.getElementById('mm-mode-link');
    const sFile = document.getElementById('mm-upload-section');
    const sLink = document.getElementById('mm-link-section');

    if (mFile) {
      mFile.style.background = mode === 'file' ? 'var(--blue)' : 'var(--surface)';
      mFile.style.color      = mode === 'file' ? '#fff' : 'var(--text3)';
    }
    if (mLink) {
      mLink.style.background = mode === 'link' ? 'var(--blue)' : 'var(--surface)';
      mLink.style.color      = mode === 'link' ? '#fff' : 'var(--text3)';
    }
    if (sFile) sFile.style.display = mode === 'file' ? 'block' : 'none';
    if (sLink) sLink.style.display = mode === 'link' ? 'block' : 'none';
  }

  /**
   * Processa o arquivo selecionado no input file.
   * Detecta tipo automaticamente pela extensão e popula campos.
   * @param {HTMLInputElement} input
   */
  function handleFile(input) {
    const file = input.files[0];
    if (!file) return;

    const ext     = file.name.split('.').pop().toLowerCase();
    const tipoMap = {
      pdf: 'pdf', mp4: 'video', webm: 'video', avi: 'video',
      xlsx: 'xlsx', xls: 'xlsx', doc: 'doc', docx: 'doc',
      png: 'imagem', jpg: 'imagem', jpeg: 'imagem', webp: 'imagem',
      zip: 'zip', rar: 'zip', pptx: 'pptx', ppt: 'pptx', quiz: 'quiz',
    };
    const tipo = tipoMap[ext] || 'outro';
    _fileAtual = { nome: file.name, tamanho: _fmtBytes(file.size), tipo, url: null };

    // Preenche campos automaticamente se estiverem vazios
    const nomeEl = document.getElementById('mm-nome');
    if (nomeEl && !nomeEl.value) nomeEl.value = file.name.replace(/\.[^.]+$/, '');
    const tipoEl = document.getElementById('mm-tipo');
    if (tipoEl && !tipoEl.value) tipoEl.value = tipo;

    // Atualiza visual da dropzone
    const dz = document.getElementById('mm-dropzone');
    const dt = document.getElementById('mm-dropzone-text');
    const ds = document.getElementById('mm-dropzone-sub');
    if (dt) dt.textContent = file.name;
    if (ds) ds.textContent = _fmtBytes(file.size);
    if (dz) { dz.style.borderColor = 'var(--blue)'; dz.style.background = 'var(--blue-light)'; }

    // Para imagens, carrega base64 para preview
    if (tipo === 'imagem') {
      const reader  = new FileReader();
      reader.onload = e => { _fileAtual.url = e.target.result; };
      reader.readAsDataURL(file);
    } else {
      _fileAtual.url = URL.createObjectURL(file);
    }

    // Preview do arquivo selecionado
    const prev = document.getElementById('mm-file-preview');
    if (prev) {
      const tipoCfg = TIPO_CFG[tipo] || TIPO_CFG.outro;
      prev.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm)">
          <div style="width:32px;height:32px;border-radius:var(--radius-sm);background:${tipoCfg.bg};color:${tipoCfg.txt};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800">
            ${tipoCfg.label.slice(0, 3).toUpperCase()}
          </div>
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text)">${_x(file.name)}</div>
            <div style="font-size:11px;color:var(--text4)">${_fmtBytes(file.size)}</div>
          </div>
        </div>`;
      prev.style.display = 'block';
    }
  }

  function onDragOver(e) {
    e.preventDefault();
    const dz = document.getElementById('mm-dropzone');
    if (dz) { dz.style.borderColor = 'var(--blue)'; dz.style.background = 'var(--blue-light)'; }
  }

  function onDragLeave() {
    const dz = document.getElementById('mm-dropzone');
    if (dz) { dz.style.borderColor = ''; dz.style.background = 'var(--bg)'; }
  }

  function onDrop(e) {
    e.preventDefault();
    onDragLeave();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const input = document.getElementById('mm-file-input');
    if (input) {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      handleFile(input);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // SALVAR MATERIAL
  // ══════════════════════════════════════════════════════════════

  /**
   * Lê os campos do modal, valida e persiste o material.
   */
  function salvar() {
    const nome = document.getElementById('mm-nome')?.value.trim();
    const tipo = document.getElementById('mm-tipo')?.value;

    if (!nome) { alert('Informe o nome do material.'); return; }
    if (!tipo) { alert('Selecione o tipo do material.'); return; }

    const getTogOn = id => document.getElementById(id)?.classList.contains('on') ?? false;

    const dados = {
      nome,
      descricao:   document.getElementById('mm-desc')?.value.trim()        || '',
      tipo,
      categoria:   document.getElementById('mm-categoria')?.value           || '',
      tags:        '',
      cursoId:     document.getElementById('mm-curso')?.value               || '',
      moduloId:    document.getElementById('mm-modulo')?.value              || '',
      responsavel: document.getElementById('mm-responsavel')?.value.trim()  || '',
      status:      document.getElementById('mm-status')?.value              || 'ativo',
      url: _uploadMode === 'link'
        ? (document.getElementById('mm-url')?.value.trim() || '#')
        : (_fileAtual?.url || '#simulado'),
      tamanho: _uploadMode === 'file' && _fileAtual ? _fileAtual.tamanho : '',
      config: {
        obrigatorio:              getTogOn('mmcfg-obrig'),
        permitirDownload:         getTogOn('mmcfg-dl'),
        ocultarAposConclusao:     getTogOn('mmcfg-ocultar'),
        apenasParaTurma:          getTogOn('mmcfg-turma'),
        complementar:             getTogOn('mmcfg-compl'),
        necessarioAntesDaProxima: getTogOn('mmcfg-antes'),
      },
    };

    if (_editId) {
      Storage.Materiais.atualizar(_editId, dados);
      _toast('Material atualizado!', 's');
    } else {
      Storage.Materiais.criar(dados);
      _toast('Material cadastrado!', 's');
    }

    document.getElementById('modal-material')?.classList.remove('open');
    _editId    = null;
    _fileAtual = null;
    refresh();
  }

  // ══════════════════════════════════════════════════════════════
  // TABS DO MODAL
  // ══════════════════════════════════════════════════════════════

  function tabModal(idx, btn) {
    document.querySelectorAll('#modal-material .mc-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
    document.querySelectorAll('#modal-material .mc-pane').forEach((p, i) => p.classList.toggle('active', i === idx));
  }

  // ══════════════════════════════════════════════════════════════
  // REFRESH E PONTO DE ENTRADA
  // ══════════════════════════════════════════════════════════════

  function refresh() {
    renderStats();
    renderTabela();
    _popularFiltroCurso();
  }

  function init() {
    renderStats();
    renderTabela();
    _popularFiltroCurso();
    _selecionados.clear();
    _atualizarLote();
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

    // Upload
    setUploadMode,
    handleFile,
    onDragOver,
    onDragLeave,
    onDrop,

    // Ações individuais
    visualizar,
    arquivar,
    excluir,
    duplicar,
    baixar,

    // Vínculo com curso
    abrirVincular,
    confirmarVinculo,

    // Seleção em lote
    toggleSel,
    toggleSelAll,
    ativarLote,
    arquivarLote,
    excluirLote,

    // Menu
    _menu,
    _closeMenus,
  };
})();
