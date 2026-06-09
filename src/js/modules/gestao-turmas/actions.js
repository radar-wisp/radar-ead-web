/**
 * actions.js — Ações CRUD e menu dropdown do módulo Turmas.
 * Responsabilidade: salvar, encerrar, excluir, menu PortalMenu.
 *
 * @module TurmasActions
 */

/* global Storage, PortalMenu, TurmasState, TurmasUtils */
/* exported TurmasActions */

var TurmasActions = (() => {
  'use strict';

  const { el, x, toast, confirm } = TurmasUtils;

  // ── Salvar (criar / editar) ───────────────────────────────────

  function salvar() {
    const nome    = el('mt-nome')?.value.trim();
    const cursoId = el('mt-curso')?.value;

    if (!nome)    { toast('Informe o nome da turma.', 'e'); return; }
    if (!cursoId) { toast('Selecione um curso.', 'e'); return; }

    const inicio = el('mt-inicio')?.value;
    const fim    = el('mt-fim')?.value;

    if (!inicio) { toast('Informe a data de início.', 'e'); return; }
    if (!fim)    { toast('Informe a data de encerramento.', 'e'); return; }

    const dados = {
      nome,
      cursoId,
      status:       el('mt-status')?.value             || 'aberta',
      dataInicio:   new Date(inicio).toISOString(),
      dataFim:      new Date(fim).toISOString(),
      alunos:       [...TurmasState.alunosSel],
    };

    if (TurmasState.editId) {
      Storage.Turmas.atualizar(TurmasState.editId, dados);
      toast('Turma atualizada!', 's');
    } else {
      Storage.Turmas.criar(dados);
      toast('Turma criada com sucesso!', 's');
    }

    el('modal-turma')?.classList.remove('open');
    TurmasState.editId = null;
    TurmasState.resetAlunos();
    Turmas.refresh();
  }

  // ── Encerrar / Excluir ────────────────────────────────────────

  function encerrar(id) {
    const t = Storage.Turmas.obter(id);
    if (!t) return;
    confirm(
      'Encerrar turma',
      `Deseja encerrar a turma "${t.nome}"? Esta ação não pode ser desfeita.`,
      'Encerrar', 'danger',
      () => {
        Storage.Turmas.encerrar(id);
        toast('Turma encerrada.', 'i');
        Turmas.refresh();
      }
    );
  }

  function excluir(id) {
    const t = Storage.Turmas.obter(id);
    if (!t) return;
    confirm(
      'Excluir turma',
      `Excluir permanentemente "${t.nome}"? Esta ação não pode ser desfeita.`,
      'Excluir', 'danger',
      () => {
        Storage.Turmas.excluir(id);
        toast('Turma excluída.', 'i');
        Turmas.refresh();
      }
    );
  }

  // ── Menu dropdown (PortalMenu) ────────────────────────────────

  function menu(btn) {
    const isOpen = btn.dataset.menuOpen === '1';
    closeMenus();
    if (isOpen) return;

    const id = btn.dataset.id;
    const t  = id ? Storage.Turmas.obter(id) : null;
    if (!t) return;

    const podeEncerrar = t.status !== 'encerrada' && t.status !== 'cancelada';

    const SVG = {
      eye:    `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
      edit:   `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
      people: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
      stop:   `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
      trash:  `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>`,
    };

    const html = `
      <button onclick="Turmas.visualizar('${t.id}');PortalMenu.close()">${SVG.eye} Visualizar</button>
      <button onclick="Turmas.abrirEdit('${t.id}');PortalMenu.close()">${SVG.edit} Editar</button>
      <button onclick="Turmas.abrirGerenciarAlunos('${t.id}');PortalMenu.close()">${SVG.people} Gerenciar alunos</button>
      <hr class="sep">
      ${podeEncerrar
        ? `<button onclick="Turmas.encerrar('${t.id}');PortalMenu.close()">${SVG.stop} Encerrar turma</button>`
        : ''}
      ${t.status !== 'encerrada'
        ? `<hr class="sep">
      <button class="danger" onclick="Turmas.excluir('${t.id}');PortalMenu.close()">${SVG.trash} Excluir</button>`
        : ''}`;

    btn.dataset.menuOpen = '1';
    PortalMenu.open(btn, html);

    const pm = document.getElementById('gc-portal-menu');
    if (pm) {
      const obs = new MutationObserver(() => {
        if (pm.style.display === 'none') { btn.dataset.menuOpen = '0'; obs.disconnect(); }
      });
      obs.observe(pm, { attributes: true, attributeFilter: ['style'] });
    }
  }

  function closeMenus() {
    if (typeof PortalMenu !== 'undefined') PortalMenu.close();
    document.querySelectorAll('[data-menu-open="1"]').forEach(b => { b.dataset.menuOpen = '0'; });
  }

  return { salvar, encerrar, excluir, menu, closeMenus };
})();
