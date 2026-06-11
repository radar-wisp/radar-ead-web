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
  function _renderModelosInline() {
    const lista = Storage.Certificados.listarModelos();
    const el = document.getElementById('cert-modelos-lista');
    if (!el) return;
    if (!lista.length) { el.innerHTML = '<div style="font-size:13px;color:var(--t3)">Nenhum modelo cadastrado.</div>'; return; }
    el.innerHTML = lista.map(m => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--t1)">${_x(m.nome)}</div>
          ${m.textoRodape ? `<div style="font-size:11px;color:var(--t3);margin-top:2px">${_x(m.textoRodape).slice(0,60)}…</div>` : ''}
        </div>
        <div style="display:flex;gap:6px">
          <button onclick="CertMod._editarModelo('${m.id}')" class="btn btn-ghost btn-sm">Editar</button>
          <button onclick="CertMod._excluirModelo('${m.id}')" class="btn btn-danger btn-sm">×</button>
        </div>
      </div>`).join('');
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
