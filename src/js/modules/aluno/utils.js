/**
 * utils.js — Constantes e helpers locais do Portal do Aluno
 */

/* global EadUtils, Storage, AlunoState */

var AlunoUtils = (() => {
  'use strict';

  const ICON_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

  const x         = EadUtils.escapeHtml;
  const toast     = EadUtils.toast;
  const toEmbed   = EadUtils.toEmbed;
  const tipoLabel = EadUtils.tipoLabel;

  /**
   * Retorna cursos publicados acessíveis pelo aluno logado,
   * respeitando as restrições de acesso.
   */
  function cursosAcessiveis() {
    const me        = AlunoState.getMe();
    const todos     = Storage.Cursos.listar().filter(c => c.status === 'publicado');
    const restricoes = Storage.Restricoes.listar();
    return todos.filter(c => {
      const restr = restricoes.filter(r => r.cursoId === c.id);
      if (!restr.length) return true;
      return restr.some(r => {
        if (r.tipo === 'colaborador') return r.refId === me.id;
        if (r.tipo === 'equipe')     return r.refId === me.equipeId;
        if (r.tipo === 'setor')      return r.refId === me.setorId;
        return false;
      });
    });
  }

  /**
   * Alterna visibilidade entre dois formulários e limpa erro.
   */
  function toggle(hideId, showId) {
    document.getElementById(hideId).style.display = 'none';
    document.getElementById(showId).style.display = 'block';
    document.getElementById('loginErr').classList.remove('show');
  }

  return { ICON_CHECK, x, toast, toEmbed, tipoLabel, cursosAcessiveis, toggle };
})();
