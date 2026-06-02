/**
 * @fileoverview alunos/index.js — Orquestrador do módulo Alunos
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Dependências (carregar nesta ordem):                        ║
 * ║  1. storage.js · utils.js                                    ║
 * ║  2. alunos/state.js                                          ║
 * ║  3. alunos/validators.js                                     ║
 * ║  4. alunos/table.js                                          ║
 * ║  5. alunos/actions.js                                        ║
 * ║  6. alunos/modals.js                                         ║
 * ║  7. alunos/perfil.js                                         ║
 * ║  8. alunos/index.js  (este arquivo)                          ║
 * ║                                                              ║
 * ║  API pública exposta em window.AlunosMod — compatível        ║
 * ║  100% com admin.html e admin.js existentes.                  ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

/* global AlunosState, AlunosTable, AlunosActions, AlunosModals, AlunosPerfil, AlunosValidators */

var AlunosMod = (() => {
  'use strict';

  // ── Filtros (status + chips) ─────────────────────────────────

  const CHIP_CLS = {
    ativo:     'chip-active',
    pendente:  'chip-pending',
    bloqueado: 'chip-blocked',
    inativo:   'chip-inactive',
  };

  function setStatus(btn, value) {
    document.querySelectorAll('#al-filter-chips .al-chip')
      .forEach(c => c.classList.remove(...Object.values(CHIP_CLS), 'active'));
    const sel = document.getElementById('al-filtro-status');
    if (sel) sel.value = value;
    if (btn) {
      btn.classList.add('active');
      if (value && CHIP_CLS[value]) btn.classList.add(CHIP_CLS[value]);
    }
    AlunosTable.render();
  }

  function resetFiltros() {
    ['al-busca', 'al-filtro-status', 'al-filtro-setor', 'al-order']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.querySelectorAll('#al-filter-chips .al-chip')
      .forEach(c => c.classList.remove(...Object.values(CHIP_CLS), 'active'));
    AlunosTable.render();
  }

  // ── Ciclo de vida ─────────────────────────────────────────────

  function init() {
    AlunosTable.renderStats();
    AlunosTable.render();
    AlunosTable.popularFiltros();
  }

  function refresh() {
    AlunosTable.renderStats();
    AlunosTable.render();
    AlunosTable.popularFiltros();
  }

  // ── API pública ───────────────────────────────────────────────
  // Todos os nomes abaixo são referenciados diretamente no admin.html
  // e no admin.js. NÃO renomear sem atualizar as chamadas no HTML.

  return {
    // Ciclo de vida
    init, refresh,

    // Renderização (chamado por admin.js)
    renderTabela:       AlunosTable.render,
    renderSetoresEquipes: () => {}, // delegado ao SetoresEquipesMod; mantido para compatibilidade

    // Filtros
    setStatus,
    resetFiltros,

    // Modal criar/editar
    abrirModal:  AlunosModals.abrirModal,
    abrirEdit:   AlunosModals.abrirEdit,
    salvar:      AlunosModals.salvar,
    tabModal:    AlunosModals.tabModal,
    stepModal:   AlunosModals.step,

    // Selects do modal (chamado via onchange no HTML)
    _loadEquipes: AlunosModals.loadEquipes,

    // Perfil
    verPerfil:         AlunosPerfil.verPerfil,
    tabPerfil:         AlunosPerfil.tabPerfil,
    resetarSenhaModal: AlunosPerfil.resetarSenhaModal,
    alternarBloqueio:  AlunosPerfil.alternarBloqueio,

    // Ações individuais
    bloquear:               AlunosActions.bloquear,
    ativar:                 AlunosActions.ativar,
    resetarSenha:           AlunosActions.resetarSenha,
    excluir:                AlunosActions.excluir,
    vincularTurma:          AlunosActions.vincularTurma,
    confirmarVincularTurma: AlunosActions.confirmarVincularTurma,

    // Menu dropdown
    _menu: AlunosActions.openMenu,
    _cm:   AlunosActions.closeMenu,

    // Setores e equipes — compatibilidade com admin.js legado
    abrirSetores: () => { if (typeof Admin !== 'undefined') Admin.go('setores-equipes'); },
    criarSetor:   () => { if (typeof SetoresEquipesMod !== 'undefined') SetoresEquipesMod.novoSetor(); },
    criarEquipe:  () => { if (typeof SetoresEquipesMod !== 'undefined') SetoresEquipesMod.novaEquipe(); },
    delSetor:     id => { if (typeof SetoresEquipesMod !== 'undefined') SetoresEquipesMod.excluirSetor(id); },
    delEquipe:    id => { if (typeof SetoresEquipesMod !== 'undefined') SetoresEquipesMod.excluirEquipe(id); },

    // Alias admin.js legado
    renderColabList: () => AlunosTable.render(),
    toggleColab:     (id, ativo) => ativo ? AlunosActions.ativar(id) : AlunosActions.bloquear(id),

    // Salvar setor/equipe (mini-modals legados — delegados ao SetoresModals)
    salvarSetor:  () => { if (typeof SetoresModals !== 'undefined') SetoresModals.salvarSetor(); },
    salvarEquipe: () => { if (typeof SetoresModals !== 'undefined') SetoresModals.salvarEquipe(); },
  };
})();
