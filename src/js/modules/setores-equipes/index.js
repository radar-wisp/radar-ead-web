/**
 * @fileoverview setores-equipes/index.js — Módulo: Tela Setores e Equipes
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  MÓDULO: SetoresEquipesMod                                   ║
 * ║                                                              ║
 * ║  Rota: pg-setores-equipes (via Admin.go('setores-equipes'))  ║
 * ║  Breadcrumb: Radar EAD › Alunos › Setores e Equipes          ║
 * ║                                                              ║
 * ║  Dependências:                                               ║
 * ║  • window.Storage  (storage.js)                              ║
 * ║  • window.EadUtils (utils.js)                                ║
 * ║  • window.SetoresCards  (cards.js)                           ║
 * ║  • window.SetoresModals (modals.js)                          ║
 * ║                                                              ║
 * ║  API pública (window.SetoresEquipesMod):                     ║
 * ║  • init(), refresh()                                         ║
 * ║  • novoSetor(), editarSetor(id), excluirSetor(id)            ║
 * ║  • novaEquipe(setorId?), editarEquipe(id), excluirEquipe(id) ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * @module SetoresEquipesMod
 */

/* global EadUtils, Storage, SetoresCards, SetoresModals */

var SetoresEquipesMod = (() => {
  'use strict';

  const _toast = EadUtils.toast;

  // ── Helpers ───────────────────────────────────────────────────

  /**
   * Centraliza confirmações de exclusão.
   * Ponto único para futura troca por modal customizado.
   * @param {string} msg
   * @returns {boolean}
   */
  function _confirmarExclusao(msg) {
    return confirm(msg);
  }

  // ── Renderização principal ────────────────────────────────────

  function _renderPage() {
    const grid = document.getElementById('se-grid');
    if (!grid) return;

    const setores = Storage.Setores.listar();

    // Grid de cards — primeiro setor inicia expandido
    if (!setores.length) {
      grid.innerHTML = SetoresCards.renderVazio();
      return;
    }

    grid.innerHTML = setores
      .map(s => SetoresCards.renderSetor(s, false))
      .join('');
  }

  // ── Ciclo de vida ─────────────────────────────────────────────

  function init()    { _renderPage(); }

  function refresh() {
    _renderPage();
    if (typeof AlunosMod !== 'undefined') AlunosMod.refresh();
  }

  // ── Ações: Setores ────────────────────────────────────────────

  function novoSetor()     { SetoresModals.abrirNovoSetor(); }
  function editarSetor(id) { SetoresModals.abrirEditarSetor(id); }

  function excluirSetor(id) {
    const s    = Storage.Setores.obter(id);
    const eqs  = Storage.Equipes.listarPorSetor(id).length;
    const cols = Storage.Alunos.porSetor(id).length;

    let aviso = `Excluir o setor "${s?.nome}"?`;
    if (eqs > 0 || cols > 0) {
      aviso += `\n\nAtenção: ${eqs} equipe(s) e ${cols} colaborador(es) serão desvinculados.`;
    }
    if (!_confirmarExclusao(aviso)) return;

    Storage.Equipes.listarPorSetor(id).forEach(e => {
      Storage.Equipes.excluir(e.id);
      Storage.Alunos.porEquipe(e.id).forEach(a =>
        Storage.Alunos.atualizar(a.id, { equipeId: null })
      );
    });
    Storage.Alunos.porSetor(id).forEach(a =>
      Storage.Alunos.atualizar(a.id, { setorId: null })
    );
    Storage.Setores.excluir(id);

    _toast('Setor removido.', 'i');
    refresh();
  }

  // ── Ações: Equipes ────────────────────────────────────────────

  function novaEquipe(setorId)  { SetoresModals.abrirNovaEquipe(setorId); }
  function editarEquipe(id)     { SetoresModals.abrirEditarEquipe(id); }

  function excluirEquipe(id) {
    const e    = Storage.Equipes.obter(id);
    const cols = Storage.Alunos.porEquipe(id).length;

    let aviso = `Excluir a equipe "${e?.nome}"?`;
    if (cols > 0) aviso += `\n\n${cols} colaborador(es) serão desvinculados.`;
    if (!_confirmarExclusao(aviso)) return;

    Storage.Alunos.porEquipe(id).forEach(a =>
      Storage.Alunos.atualizar(a.id, { equipeId: null })
    );
    Storage.Equipes.excluir(id);

    _toast('Equipe removida.', 'i');
    refresh();
  }

  // ── API pública ───────────────────────────────────────────────

  return {
    init,
    refresh,
    novoSetor,
    editarSetor,
    excluirSetor,
    novaEquipe,
    editarEquipe,
    excluirEquipe,
  };
})();
