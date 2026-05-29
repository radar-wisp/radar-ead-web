/**
 * actions.js — Operações de escrita do módulo Central de Materiais.
 * Responsabilidade única: persistir no window.Storage (salvar, arquivar,
 * excluir, duplicar, baixar, confirmar vínculo, ações em lote) e disparar
 * o refresh da UI via MatMod.
 *
 * @module MatActions
 */

/* global Storage, MatUtils, MatState, MatMod */

var MatActions = (() => {
  'use strict';

  const _toast = MatUtils.toast;

  // ── Salvar material (criação / edição) ────────────────────────
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
      url: MatState.uploadMode === 'link'
        ? (document.getElementById('mm-url')?.value.trim() || '#')
        : (MatState.fileAtual?.url || '#simulado'),
      tamanho: MatState.uploadMode === 'file' && MatState.fileAtual ? MatState.fileAtual.tamanho : '',
      config: {
        obrigatorio:              getTogOn('mmcfg-obrig'),
        permitirDownload:         getTogOn('mmcfg-dl'),
        ocultarAposConclusao:     getTogOn('mmcfg-ocultar'),
        apenasParaTurma:          getTogOn('mmcfg-turma'),
        complementar:             getTogOn('mmcfg-compl'),
        necessarioAntesDaProxima: getTogOn('mmcfg-antes'),
      },
    };

    if (MatState.editId) {
      Storage.Materiais.atualizar(MatState.editId, dados);
      _toast('Material atualizado!', 's');
    } else {
      Storage.Materiais.criar(dados);
      _toast('Material cadastrado!', 's');
    }

    document.getElementById('modal-material')?.classList.remove('open');
    MatState.editId    = null;
    MatState.fileAtual = null;
    MatMod.refresh();
  }

  // ── Ações individuais ─────────────────────────────────────────
  function arquivar(id) {
    Storage.Materiais.arquivar(id);
    _toast('Material arquivado.', 'i');
    MatMod.refresh();
  }

  function excluir(id) {
    if (!confirm('Excluir permanentemente este material?')) return;
    Storage.Materiais.excluir(id);
    _toast('Material excluído.', 'i');
    MatMod.refresh();
  }

  function duplicar(id) {
    const m = Storage.Materiais.obter(id);
    if (!m) return;
    Storage.Materiais.criar({ ...m, id: undefined, nome: '[Cópia] ' + m.nome, criadoEm: undefined });
    _toast('Material duplicado!', 's');
    MatMod.refresh();
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

  // ── Confirmar vínculo a curso ─────────────────────────────────
  function confirmarVinculo() {
    const cursoId = document.getElementById('mv-curso-sel')?.value;
    if (!cursoId || !MatState.vincularId) { alert('Selecione um curso.'); return; }
    Storage.Materiais.vincular(MatState.vincularId, cursoId);
    const c = Storage.Cursos.obter(cursoId);
    _toast(`Material vinculado a "${c?.titulo || 'curso'}"!`, 's');
    document.getElementById('modal-vincular')?.classList.remove('open');
    MatState.vincularId = null;
    MatMod.refresh();
  }

  // ── Ações em lote ─────────────────────────────────────────────
  function ativarLote() {
    const sel = MatState.selecionados;
    if (!sel.size) return;
    sel.forEach(id => Storage.Materiais.atualizar(id, { status: 'ativo' }));
    _toast(`${sel.size} material(is) ativado(s).`, 's');
    sel.clear();
    MatMod.refresh();
  }

  function arquivarLote() {
    const sel = MatState.selecionados;
    if (!sel.size || !confirm(`Arquivar ${sel.size} material(is)?`)) return;
    sel.forEach(id => Storage.Materiais.arquivar(id));
    _toast(`${sel.size} material(is) arquivado(s).`, 'i');
    sel.clear();
    MatMod.refresh();
  }

  function excluirLote() {
    const sel = MatState.selecionados;
    if (!sel.size || !confirm(`Excluir permanentemente ${sel.size} material(is)?`)) return;
    sel.forEach(id => Storage.Materiais.excluir(id));
    _toast(`${sel.size} material(is) excluído(s).`, 'i');
    sel.clear();
    MatMod.refresh();
  }

  return {
    salvar, arquivar, excluir, duplicar, baixar,
    confirmarVinculo,
    ativarLote, arquivarLote, excluirLote,
  };
})();
