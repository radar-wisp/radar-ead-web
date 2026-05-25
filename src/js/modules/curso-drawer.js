/**
 * @fileoverview curso-drawer.js — Sub-módulo: Drawer de Edição de Curso
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO ISOLADO — CursoDrawer                                    ║
 * ║                                                                  ║
 * ║  Responsabilidade única:                                         ║
 * ║  Gerenciar o painel lateral (drawer) que carrega o wizard        ║
 * ║  novo-curso.html via <iframe> para edição de curso existente.    ║
 * ║                                                                  ║
 * ║  Contrato de entrada (dependências externas):                    ║
 * ║  • window.Storage.Cursos.obter(id) — leitura do título           ║
 * ║  • window.Cursos.renderTabela()    — refresh pós-edição          ║
 * ║  • DOM: #curso-editor-drawer, #curso-editor-iframe, #drawer-titulo║
 * ║                                                                  ║
 * ║  Contrato de saída (API pública):                                ║
 * ║  • window.CursoDrawer.abrir(id)                                  ║
 * ║  • window.CursoDrawer.fechar()                                   ║
 * ║                                                                  ║
 * ║  Comunicação com o wizard (novo-curso.html):                     ║
 * ║  Recebe window.postMessage('wizard:concluido') para fechar       ║
 * ║  automaticamente após salvar.                                    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * @module CursoDrawer
 * @version 1.0.0
 * @see docs/ARCHITECTURE.md
 */

/* global Storage, Cursos */

var CursoDrawer = (() => {
  'use strict';

  /**
   * Abre o drawer lateral carregando o wizard de edição no iframe.
   * @param {string} id — ID do curso a editar
   */
  function abrir(id) {
    const drawer = document.getElementById('curso-editor-drawer');
    const iframe = document.getElementById('curso-editor-iframe');
    const titulo = document.getElementById('drawer-titulo');

    if (!drawer || !iframe) {
      console.warn('[CursoDrawer] Elementos do drawer não encontrados no DOM.');
      return;
    }

    const c = Storage.Cursos.obter(id);
    if (titulo) titulo.textContent = c ? 'Editar: ' + c.titulo : 'Editar Curso';

    iframe.src = 'novo-curso.html?edit=' + encodeURIComponent(id);
    drawer.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Fecha o drawer e limpa o iframe.
   * Dispara renderTabela() para refletir alterações salvas.
   */
  function fechar() {
    const drawer = document.getElementById('curso-editor-drawer');
    const iframe = document.getElementById('curso-editor-iframe');

    if (!drawer) return;

    drawer.style.display = 'none';
    document.body.style.overflow = '';

    // Limpa o iframe para liberar memória e evitar estado residual
    if (iframe) iframe.src = '';

    // Atualiza a tabela de cursos após o fechamento
    if (typeof Cursos !== 'undefined' && typeof Cursos.renderTabela === 'function') {
      Cursos.renderTabela();
    }
  }

  // Fecha com a tecla Escape
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const drawer = document.getElementById('curso-editor-drawer');
    if (drawer && drawer.style.display === 'flex') fechar();
  });

  // Recebe mensagem do wizard quando o curso é salvo/publicado
  window.addEventListener('message', e => {
    if (e.data === 'wizard:concluido') fechar();
  });

  return { abrir, fechar };
})();
