/**
 * actions.js — Ações individuais sobre um aluno
 * Responsabilidade: bloquear, ativar, excluir, resetarSenha, vincularTurma.
 * Sem HTML de renderização — apenas lógica de operação + feedback.
 */

/* global EadUtils, Storage, AlunosState, PortalMenu, AlunosMod */
/* exported AlunosActions */

var AlunosActions = (() => {
  'use strict';

  const _x     = EadUtils.escapeHtml;
  const _toast = EadUtils.toast;

  // ── Menu dropdown (PortalMenu) ────────────────────────────────

  function openMenu(btn) {
    const id = btn.dataset.alId;
    const al = Storage.Alunos.obter(id);
    if (!al) return;

    PortalMenu.open(btn, `
      <button onclick="AlunosMod.verPerfil('${id}');PortalMenu.close()">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        Visualizar perfil
      </button>
      <button onclick="AlunosMod.abrirEdit('${id}');PortalMenu.close()">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Editar
      </button>
      <button onclick="AlunosMod.vincularTurma('${id}');PortalMenu.close()">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        Vincular turma
      </button>
      <hr class="sep">
      <button class="danger" onclick="AlunosMod.excluir('${id}');PortalMenu.close()">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        Excluir
      </button>`);
  }

  function closeMenu() { PortalMenu.close(); }

  // ── CRUD ──────────────────────────────────────────────────────

  function bloquear(id) {
    Storage.Alunos.atualizar(id, { ativo: false, statusAcesso: 'bloqueado' });
    _toast('Aluno bloqueado.', 'i');
    if (typeof AlunosMod !== 'undefined') AlunosMod.refresh();
  }

  function ativar(id) {
    Storage.Alunos.atualizar(id, { ativo: true, statusAcesso: 'ativo' });
    _toast('Aluno ativado.', 's');
    if (typeof AlunosMod !== 'undefined') AlunosMod.refresh();
  }

  function resetarSenha(id) {
    const nova = prompt('Nova senha:');
    if (!nova) return;
    Storage.Alunos.atualizar(id, { senha: nova });
    _toast('Senha redefinida.', 's');
  }

  function excluir(id) {
    if (!confirm('Excluir aluno permanentemente?')) return;
    Storage.Alunos.excluir(id);
    _toast('Aluno excluído.', 'i');
    if (typeof AlunosMod !== 'undefined') AlunosMod.refresh();
  }

  // ── Vincular turma ────────────────────────────────────────────

  function vincularTurma(alunoId) {
    const turmas = Storage.Turmas.listar();
    if (!turmas.length) { _toast('Nenhuma turma disponível.', 'i'); return; }
    AlunosState.vincularAlunoId = alunoId;
    const al  = Storage.Alunos.obter(alunoId);
    const sub = document.getElementById('mvt-sub');
    if (sub) sub.textContent = al?.nome || '';
    const sel = document.getElementById('mvt-turma');
    if (sel) sel.innerHTML = turmas.map(t =>
      `<option value="${_x(t.id)}">${_x(t.nome)}</option>`
    ).join('');
    document.getElementById('modal-vincular-turma')?.classList.add('open');
  }

  function confirmarVincularTurma() {
    const turmaId = document.getElementById('mvt-turma')?.value;
    if (!turmaId || !AlunosState.vincularAlunoId) return;
    Storage.Turmas.adicionarAluno(turmaId, AlunosState.vincularAlunoId);
    const nome = Storage.Turmas.listar().find(t => t.id === turmaId)?.nome || '';
    document.getElementById('modal-vincular-turma')?.classList.remove('open');
    AlunosState.vincularAlunoId = null;
    _toast(`Aluno vinculado a "${nome}"!`, 's');
    if (typeof AlunosMod !== 'undefined') AlunosMod.refresh();
  }

  return {
    openMenu, closeMenu,
    bloquear, ativar, resetarSenha, excluir,
    vincularTurma, confirmarVincularTurma,
  };
})();
