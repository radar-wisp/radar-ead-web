/**
 * @fileoverview central-certificados/index.js — Fachada do módulo.
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO: CertMod (Central de Certificados EAD)                   ║
 * ║                                                                  ║
 * ║  Fachada do módulo — mantém a API pública window.CertMod         ║
 * ║  consumida por admin.html (onclick) SEM alterações.              ║
 * ║                                                                  ║
 * ║  Dependências (ordem de carregamento):                           ║
 * ║  • window.Storage  (storage.js)                                  ║
 * ║  • CertState   → state.js                                        ║
 * ║  • CertUtils   → utils.js                                        ║
 * ║  • CertTable   → table.js   (stats, filtros, tabela, painéis)    ║
 * ║  • CertRender  → render.js  (visualizador + impressão)           ║
 * ║  • CertModals  → modals.js  (emissão, lote, validação, modelos)  ║
 * ║  • CertActions → actions.js (reemitir, cancelar, excluir)        ║
 * ║                                                                  ║
 * ║  MIGRAÇÃO BACKEND: apenas window.Storage precisa mudar.          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * @module CertMod
 * @version 2.0.0
 */

/* global Storage, CertTable, CertRender, CertModals, CertActions */

var CertMod = (() => {
  'use strict';

  // ── Tabs ───────────────────────────────────────────────────────
  function switchTab(tab, btn) {
    document.querySelectorAll('.cert-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.cert-tab-panel').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const panel = document.getElementById('cert-panel-' + tab);
    if (panel) panel.classList.add('active');
    const phActions = document.getElementById('cert-ph-actions');
    if (phActions) phActions.style.display = tab === 'modelos' ? '' : 'none';
    if (tab === 'emitir')    _initEmitirInline();
    if (tab === 'lote')      _initLoteInline();
    if (tab === 'modelos')   _renderModelosInline();
    if (tab === 'relatorio') { CertTable.renderTabela(); CertTable.renderPendentes(); CertTable.renderVencimentos(); }
  }

  // ── Init inline: Emitir ────────────────────────────────────────
  function _initEmitirInline() {
    const alunos = Storage.Alunos.listar().filter(a => a.ativo);
    const cursos = Storage.Cursos.listar();
    const sA = document.getElementById('mce-aluno');
    const sC = document.getElementById('mce-curso');
    if (sA) sA.innerHTML = '<option value="">Selecione...</option>' +
      alunos.map(a => `<option value="${_x(a.id)}">${_x(a.nome)}</option>`).join('');
    if (sC) sC.innerHTML = '<option value="">Selecione...</option>' +
      cursos.map(c => `<option value="${_x(c.id)}">${_x(c.titulo)}</option>`).join('');
    const concl = document.getElementById('mce-conclusao');
    if (concl) concl.value = new Date().toISOString().slice(0, 10);
    ['mce-validade','mce-nota','mce-obs'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
    const resp = document.getElementById('mce-resp'); if(resp) resp.value='Admin';
  }

  function salvarEmissaoInline() {
    const alunoId = document.getElementById('mce-aluno')?.value;
    const cursoId = document.getElementById('mce-curso')?.value;
    if (!alunoId || !cursoId) { alert('Selecione aluno e curso.'); return; }
    const cur = Storage.Cursos.obter(cursoId);
    Storage.Certificados.emitir({
      alunoId, cursoId,
      cargaHoraria:  cur?.carga || 0,
      dataConclucao: document.getElementById('mce-conclusao')?.value ? new Date(document.getElementById('mce-conclusao').value).toISOString() : new Date().toISOString(),
      dataValidade:  document.getElementById('mce-validade')?.value  ? new Date(document.getElementById('mce-validade').value).toISOString()  : null,
      nota:          parseInt(document.getElementById('mce-nota')?.value) || 0,
      responsavel:   document.getElementById('mce-resp')?.value.trim() || 'Admin',
      obs:           document.getElementById('mce-obs')?.value.trim()  || '',
    });
    CertUtils.toast('Certificado emitido!', 's');
    _initEmitirInline();
    refresh();
  }

  // ── Init inline: Lote ──────────────────────────────────────────
  function _initLoteInline() {
    const sel    = document.getElementById('mlote-curso');
    const cursos = Storage.Cursos.listar().filter(c => c.status === 'publicado');
    if (sel) sel.innerHTML = '<option value="">Selecione...</option>' +
      cursos.map(c => `<option value="${_x(c.id)}">${_x(c.titulo)}</option>`).join('');
    const prev = document.getElementById('mlote-preview'); if(prev) prev.innerHTML='';
  }

  function previewLoteInline() {
    const cursoId = document.getElementById('mlote-curso')?.value;
    if (!cursoId) { alert('Selecione um curso.'); return; }
    const alunos = Storage.Alunos.listar().filter(a => {
      const mat = (Storage.Matriculas?.listar() || []).find(m => m.alunoId===a.id && m.cursoId===cursoId);
      return mat && mat.progresso >= 100;
    });
    const existentes = new Set(Storage.Certificados.listar().filter(c => c.cursoId===cursoId && c.status!=='cancelado').map(c => c.alunoId));
    const elegiveis = alunos.filter(a => !existentes.has(a.id));
    const prev = document.getElementById('mlote-preview');
    if (!prev) return;
    prev.innerHTML = elegiveis.length
      ? `Serão emitidos <strong style="color:var(--blue)">${elegiveis.length}</strong> certificado(s) para:<br>${elegiveis.slice(0,5).map(a=>`• ${_x(a.nome)}`).join('<br>')}${elegiveis.length>5?`<br>+ ${elegiveis.length-5} outros`:''}`
      : '<span style="color:var(--t3);font-size:13px">Nenhum aluno elegível encontrado.</span>';
  }

  function executarLoteInline() {
    const cursoId = document.getElementById('mlote-curso')?.value;
    if (!cursoId) { alert('Selecione um curso.'); return; }
    CertModals.executarLote(cursoId);
    _initLoteInline();
    refresh();
  }

  // ── Modelos inline ─────────────────────────────────────────────
  let _tabModeloEditId = null;

  function _renderModelosInline() {
    const lista = Storage.Certificados.listarModelos();
    const el = document.getElementById('cert-modelos-lista');
    if (!el) return;
    if (!lista.length) {
      el.innerHTML = '<div style="padding:12px 0;font-size:13px;color:var(--text3)">Nenhum modelo cadastrado. Clique em <strong>Novo modelo</strong> para começar.</div>';
      return;
    }
    el.innerHTML = lista.map(m => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="width:20px;height:20px;border-radius:4px;background:${m.corPrimaria||'#0002da'};flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;color:var(--text)">${_x(m.nome)}</div>
          ${m.logoTexto ? `<div style="font-size:11px;color:var(--text3)">${_x(m.logoTexto)}</div>` : ''}
        </div>
        ${m.ativo ? '<span style="font-size:10px;font-weight:600;color:var(--green);background:var(--green-light,#e6f9ee);padding:2px 7px;border-radius:99px">Ativo</span>' : ''}
        <div class="cert-acoes-wrap">
          <button class="btn btn-ghost btn-sm" onclick="CertMod._tabToggleAcoes(this)">
            Ações <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="cert-acoes-menu">
            <button onclick="CertMod._tabEditarModelo('${m.id}');CertMod._tabCloseAcoes()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Editar
            </button>
            <button class="danger" onclick="CertMod._tabExcluirModelo('${m.id}');CertMod._tabCloseAcoes()">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>Excluir
            </button>
          </div>
        </div>
      </div>`).join('');
  }

  function _tabToggleAcoes(btn) {
    const menu = btn.nextElementSibling;
    const isOpen = menu.classList.contains('open');
    _tabCloseAcoes();
    if (!isOpen) {
      const r = btn.getBoundingClientRect();
      menu.style.top  = (r.bottom + 4) + 'px';
      menu.style.left = (r.right - 140) + 'px';
      menu.classList.add('open');
      setTimeout(() => document.addEventListener('click', _tabCloseAcoes, { once: true }), 0);
    }
  }

  function _tabCloseAcoes() {
    document.querySelectorAll('.cert-acoes-menu.open').forEach(m => m.classList.remove('open'));
  }

  function _tabNovoModelo() {
    CertModals.novoModelo();
  }

  function _tabEditarModelo(id) {
    CertModals._editarModelo(id);
  }

  function _tabExcluirModelo(id) {
    if (!confirm('Excluir este modelo?')) return;
    Storage.Certificados.excluirModelo(id);
    _renderModelosInline();
  }

  const _x = s => (s||'').toString().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // ── Ciclo de vida ──────────────────────────────────────────────
  function init() {
    Storage.Certificados.sincronizar();
    if (!Storage.Certificados.listarModelos().length) {
      Storage.Certificados.criarModelo({ nome: 'Modelo Padrão' });
    }
    CertTable.renderStats();
    CertTable._popularFiltroCurso();
    _renderModelosInline();
    const phActions = document.getElementById('cert-ph-actions');
    if (phActions) phActions.style.display = '';
  }

  function refresh() {
    Storage.Certificados.sincronizar();
    CertTable.renderStats();
    CertTable.renderTabela();
    CertTable.renderPendentes();
    CertTable.renderVencimentos();
    _renderModelosInline();
  }

  return {
    // Ciclo de vida
    init, refresh,

    // Tabs
    switchTab,

    // Renderização (tabela e painéis)
    renderTabela:     CertTable.renderTabela,
    renderPendentes:  CertTable.renderPendentes,
    renderVencimentos:CertTable.renderVencimentos,

    // Filtros
    setStatus:    CertTable.setStatus,
    resetFiltros: CertTable.resetFiltros,

    // Visualização e download
    visualizar:   CertRender.visualizar,
    baixarCert:   CertRender.baixarCert,
    imprimirCert: CertRender.imprimirCert,

    // Ações individuais
    reemitir: CertActions.reemitir,
    cancelar: CertActions.cancelar,
    excluir:  CertActions.excluir,

    // Emissão inline (tabs)
    salvarEmissaoInline,
    previewLoteInline,
    executarLoteInline,

    // Emissão via modal (legado — mantidos para compatibilidade)
    abrirEmissaoManual: CertModals.abrirEmissaoManual,
    salvarEmissao:      CertModals.salvarEmissao,
    abrirEmissaoLote:   CertModals.abrirEmissaoLote,
    previewLote:        CertModals.previewLote,
    executarLote:       CertModals.executarLote,

    // Validação
    abrirValidar:      CertModals.abrirValidar,
    executarValidacao: CertModals.executarValidacao,

    // Modelos inline (tab)
    _tabNovoModelo, _tabEditarModelo, _tabExcluirModelo,
    _tabToggleAcoes, _tabCloseAcoes,
    _renderModelosTab: _renderModelosInline,

    // Modelos
    abrirModelos: CertModals.abrirModelos,
    novoModelo:   CertModals.novoModelo,
    salvarModelo: CertModals.salvarModelo,

    // Menu
    _menu: CertTable._menu,
    _cm:   CertTable._cm,

    // Internos chamados pelo HTML inline
    _emitirRapido:  CertActions._emitirRapido,
    _editarModelo:  CertModals._editarModelo,
    _excluirModelo: CertModals._excluirModelo,
  };
})();
