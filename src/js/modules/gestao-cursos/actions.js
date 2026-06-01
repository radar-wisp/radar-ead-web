/**
 * actions.js — Ações CRUD individuais e em lote
 * Responsabilidade única: operações que mutam o Storage.
 */

/* global Storage, EadUtils, CursosState, CursosUtils, CursoDrawer */

var CursosActions = (() => {
  'use strict';

  const _toast = EadUtils.toast;

  // ── Seleção em lote ─────────────────────────────────────────────

  function toggleSel(id, checked) {
    checked ? CursosState.select(id) : CursosState.deselect(id);
    const row = document.getElementById('row-' + id);
    if (row) row.classList.toggle('selected', checked);
    CursosState.syncLoteUI();
  }

  function toggleSelAll(checkbox) {
    Storage.Cursos.listar().forEach(c => {
      checkbox.checked ? CursosState.select(c.id) : CursosState.deselect(c.id);
    });
    document.querySelectorAll('.row-check').forEach(ch => { ch.checked = checkbox.checked; });
    document.querySelectorAll('#gc-tbody tr').forEach(r => { r.classList.toggle('selected', checkbox.checked); });
    CursosState.syncLoteUI();
  }

  // ── Lote ────────────────────────────────────────────────────────

  function publicarLote() {
    if (!CursosState.selSize()) return;
    if (!confirm(`Publicar ${CursosState.selSize()} curso(s)?`)) return;
    CursosState.selList().forEach(id => Storage.Cursos.publicar(id));
    _toast(`${CursosState.selSize()} curso(s) publicado(s)!`, 's');
    CursosState.clearSel();
  }

  function arquivarLote() {
    if (!CursosState.selSize()) return;
    if (!confirm(`Arquivar ${CursosState.selSize()} curso(s)?`)) return;
    CursosState.selList().forEach(id => Storage.Cursos.arquivar(id));
    _toast(`${CursosState.selSize()} curso(s) arquivado(s).`, 'i');
    CursosState.clearSel();
  }

  function excluirLote() {
    if (!CursosState.selSize()) return;
    if (!confirm(`Excluir permanentemente ${CursosState.selSize()} curso(s)?`)) return;
    CursosState.selList().forEach(id => Storage.Cursos.excluir(id));
    _toast(`${CursosState.selSize()} curso(s) excluído(s).`, 'i');
    CursosState.clearSel();
  }

  // ── Individuais ─────────────────────────────────────────────────

  function publicarCurso(id) {
    Storage.Cursos.publicar(id);
    _toast('Curso publicado!', 's');
    Storage.Atividades.registrar({ tipo: 'publicou', cursoId: id });
  }

  function despublicarCurso(id) {
    Storage.Cursos.atualizar(id, { status: 'rascunho', publicadoEm: null });
    _toast('Curso despublicado.', 'i');
  }

  function arquivarCurso(id) {
    if (!confirm('Arquivar este curso?')) return;
    Storage.Cursos.arquivar(id);
    _toast('Curso arquivado.', 'i');
    Storage.Atividades.registrar({ tipo: 'arquivou', cursoId: id });
  }

  function excluirCurso(id) {
    if (!confirm('Excluir permanentemente este curso? Esta ação não pode ser desfeita.')) return;
    Storage.Cursos.excluir(id);
    _toast('Curso excluído.', 'i');
  }

  function duplicarCurso(id) {
    const novo = Storage.Cursos.duplicar(id);
    if (novo) {
      _toast('Curso duplicado!', 's');
      Storage.Atividades.registrar({ tipo: 'duplicou', cursoId: novo.id });
    }
  }

  function abrirEdit(id) {
    if (typeof CursoDrawer !== 'undefined') {
      CursoDrawer.abrir(id);
    } else {
      console.warn('[GestaoCursos] CursoDrawer não encontrado.');
    }
  }

  function exportar() {
    const lista = Storage.Cursos.listar();
    const rows  = [['ID', 'Título', 'Categoria', 'Formato', 'Carga (h)', 'Status', 'Publicado', 'Criado em']];
    lista.forEach(c => rows.push([
      c.id, c.titulo || '', c.categoria || '', c.formato || 'ead',
      c.carga || 0, CursosUtils.resolveStatus(c), c.publicadoEm || '', c.criadoEm || '',
    ]));
    const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `cursos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return {
    toggleSel, toggleSelAll,
    publicarLote, arquivarLote, excluirLote,
    publicarCurso, despublicarCurso, arquivarCurso, excluirCurso, duplicarCurso,
    abrirEdit, exportar,
  };
})();
