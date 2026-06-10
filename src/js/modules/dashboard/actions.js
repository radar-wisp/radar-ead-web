/**
 * actions.js — Ações do Dashboard sobre cursos
 * Responsabilidade: menu de ações contextual e navegação a partir do dashboard.
 */

/* global Storage, EadUtils */
/* exported DashboardActions */

var DashboardActions = (() => {
  'use strict';

  const _toast = EadUtils.toast;

  // ── Menu de ações (dropdown) ─────────────────────────────────────

  /**
   * Abre/fecha o menu de ações contextual de um curso.
   * @param {HTMLElement} btn — botão que disparou o clique
   */
  function toggleMenu(btn) {
    const menu   = btn.nextElementSibling;
    const isOpen = menu.classList.contains('open');
    closeMenus();
    if (!isOpen) {
      menu.classList.add('open');
      setTimeout(() => document.addEventListener('click', closeMenus, { once: true }), 10);
    }
  }

  /** Fecha todos os menus de ações abertos. */
  function closeMenus() {
    document.querySelectorAll('.action-menu.open').forEach(m => m.classList.remove('open'));
  }

  // ── Ações de estado de curso ─────────────────────────────────────

  /**
   * Publica um curso e re-renderiza a view atual.
   * @param {string} id
   */
  function publicar(id) {
    Storage.Cursos.publicar(id);
    _toast('Publicado!', 's');
    _refresh();
  }

  /**
   * Arquiva um curso e re-renderiza a view atual.
   * @param {string} id
   */
  function arquivar(id) {
    Storage.Cursos.arquivar(id);
    _toast('Arquivado.', 'i');
    _refresh();
  }

  /**
   * Abre prompt para editar a data de validade de um curso.
   * @param {string} cursoId
   */
  function openValidade(cursoId) {
    const c = Storage.Cursos.obter(cursoId);
    const v = prompt('Data:', c?.validadeAte ? c.validadeAte.split('T')[0] : '');
    if (v === null) return;
    Storage.Cursos.atualizar(cursoId, { validadeAte: v ? new Date(v).toISOString() : null });
    _toast('Validade atualizada!', 's');
    _refresh();
  }

  // ── Navegação ────────────────────────────────────────────────────

  /**
   * Navega para a página de Acessos filtrando pelo curso informado.
   * @param {string} cursoId
   */
  function goAcessos(cursoId) {
    if (typeof Admin === 'undefined') return;
    Admin.go('acessos');
    setTimeout(() => {
      const sel = document.querySelector('#ac-curso-sel');
      if (sel) { sel.value = cursoId; sel.dispatchEvent(new Event('change')); }
    }, 100);
  }

  /**
   * Navega para Gestão de Cursos e abre o modal de edição do curso.
   * @param {string} cursoId
   */
  function goEdit(cursoId) {
    if (typeof Admin === 'undefined') return;
    Admin.go('cursos');
    setTimeout(() => Admin.openModalCurso(cursoId), 100);
  }

  // ── Interno ──────────────────────────────────────────────────────

  /** Re-renderiza a página corrente após uma ação. */
  function _refresh() {
    if (typeof DashboardMod !== 'undefined') DashboardMod.refresh();
  }

  return {
    toggleMenu,
    closeMenus,
    publicar,
    arquivar,
    openValidade,
    goAcessos,
    goEdit,
  };
})();
