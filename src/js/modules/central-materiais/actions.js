/**
 * actions.js — Seleção em lote e ações por item (MatActions).
 * Responsabilidade: marcar/desmarcar linhas, ações em lote (ativar,
 * arquivar, excluir) e ações individuais (arquivar, excluir, duplicar,
 * baixar). Persiste via Storage e dispara MatMod.refresh().
 *
 * @module MatActions
 */

/* global Storage, MatUtils, MatState, MatMod */

var MatActions = (() => {
  'use strict';

  const _toast = MatUtils.toast;

  // ── Seleção em lote ───────────────────────────────────────────

  function toggleSel(id, checked) {
    checked ? MatState.select(id) : MatState.deselect(id);
    const row = document.getElementById('mrow-' + id);
    if (row) row.classList.toggle('selected', checked);
    MatState.syncLoteUI();
  }

  function toggleSelAll(checkbox) {
    // Opera apenas sobre as linhas visíveis (respeita o filtro aplicado),
    // mantendo o estado de seleção coerente com o que está na tela.
    document.querySelectorAll('#mat-tbody tr').forEach(row => {
      const id = row.id.replace('mrow-', '');
      if (!id) return;
      checkbox.checked ? MatState.select(id) : MatState.deselect(id);
      const ch = row.querySelector('.row-check');
      if (ch) ch.checked = checkbox.checked;
      row.classList.toggle('selected', checkbox.checked);
    });
    MatState.syncLoteUI();
  }

  function ativarLote() {
    if (!MatState.selSize()) return;
    MatState.selList().forEach(id => Storage.Materiais.atualizar(id, { status: 'ativo' }));
    _toast(`${MatState.selSize()} material(is) ativado(s).`, 's');
    MatState.clearSel();
    MatMod.refresh();
  }

  function arquivarLote() {
    if (!MatState.selSize() || !confirm(`Arquivar ${MatState.selSize()} material(is)?`)) return;
    MatState.selList().forEach(id => Storage.Materiais.arquivar(id));
    _toast(`${MatState.selSize()} material(is) arquivado(s).`, 'i');
    MatState.clearSel();
    MatMod.refresh();
  }

  function excluirLote() {
    if (!MatState.selSize() || !confirm(`Excluir permanentemente ${MatState.selSize()} material(is)?`)) return;
    MatState.selList().forEach(id => Storage.Materiais.excluir(id));
    _toast(`${MatState.selSize()} material(is) excluído(s).`, 'i');
    MatState.clearSel();
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
    Storage.Materiais.criar({
      ...m,
      id:          undefined,
      nome:        '[Cópia] ' + m.nome,
      criadoEm:    undefined,
      config:      { ...(m.config || {}) },
      cursosVinc:  [...(m.cursosVinc || [])],
    });
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

  return {
    toggleSel, toggleSelAll,
    ativarLote, arquivarLote, excluirLote,
    arquivar, excluir, duplicar, baixar,
  };
})();
