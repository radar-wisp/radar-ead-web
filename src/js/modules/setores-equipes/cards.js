/**
 * cards.js — Renderização dos cards de Setor e Equipe
 * Responsabilidade única: HTML dos blocos expansíveis.
 */

/* global EadUtils, Storage */

var SetoresCards = (() => {
  'use strict';

  const _x = EadUtils.escapeHtml;

  // ── SVGs reutilizáveis ────────────────────────────────────────
  const _SVG = {
    editar: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>`,

    excluir: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
    </svg>`,

    equipe: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`,

    adicionar: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>`,

    casa: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>`,
  };

  // ── Renderização ──────────────────────────────────────────────

  /**
   * Card de um setor com suas equipes aninhadas.
   * Busca as equipes internamente via Storage.Equipes.listarPorSetor().
   * @param {{id,nome,cor}} setor
   * @returns {string} HTML
   */
  function renderSetor(setor) {
    const eqs  = Storage.Equipes.listarPorSetor(setor.id);
    const cnt  = Storage.Alunos.porSetor(setor.id).length;
    const cor  = setor.cor || '#0002da';

    const equipeRows = eqs.length
      ? eqs.map(e => _renderEquipe(e)).join('')
      : `<div class="se-empty-eq">Nenhuma equipe cadastrada.</div>`;

    return `
      <div class="se-card" id="setor-${setor.id}">
        <div class="se-card-head">
          <div class="se-card-head-left">
            <span class="se-dot" style="background:${cor}"></span>
            <strong class="se-card-title">${_x(setor.nome)}</strong>
            <span class="se-badge">${cnt} colaborador${cnt !== 1 ? 'es' : ''}</span>
          </div>
          <div class="se-card-head-right">
            <button class="btn btn-ghost btn-sm"
              onclick="SetoresEquipesMod.editarSetor('${setor.id}')" title="Editar setor">
              ${_SVG.editar}
            </button>
            <button class="btn btn-ghost btn-sm se-btn-danger"
              onclick="SetoresEquipesMod.excluirSetor('${setor.id}')" title="Excluir setor">
              ${_SVG.excluir}
            </button>
          </div>
        </div>
        <div class="se-equipes">
          ${equipeRows}
          <button class="se-add-equipe"
            onclick="SetoresEquipesMod.novaEquipe('${setor.id}')">
            ${_SVG.adicionar}
            Adicionar equipe
          </button>
        </div>
      </div>`;
  }

  /**
   * Linha de equipe dentro de um card de setor.
   * @param {{id,nome,setorId}} equipe
   * @returns {string} HTML
   */
  function _renderEquipe(equipe) {
    const membros = Storage.Alunos.porEquipe(equipe.id).length;
    return `
      <div class="se-equipe-row" id="equipe-${equipe.id}">
        <span class="se-equipe-icon">${_SVG.equipe}</span>
        <span class="se-equipe-nome">${_x(equipe.nome)}</span>
        <span class="se-equipe-count">${membros} membro${membros !== 1 ? 's' : ''}</span>
        <div class="se-equipe-actions">
          <button class="btn btn-ghost btn-sm"
            onclick="SetoresEquipesMod.editarEquipe('${equipe.id}')" title="Editar equipe">
            ${_SVG.editar}
          </button>
          <button class="btn btn-ghost btn-sm se-btn-danger"
            onclick="SetoresEquipesMod.excluirEquipe('${equipe.id}')" title="Excluir equipe">
            ${_SVG.excluir}
          </button>
        </div>
      </div>`;
  }

  /**
   * Estado vazio quando não há setores.
   * @returns {string} HTML
   */
  function renderVazio() {
    return `
      <div class="se-empty">
        <div class="se-empty-icon">${_SVG.casa}</div>
        <h3>Nenhum setor cadastrado</h3>
        <p>Crie o primeiro setor para começar a organizar seus colaboradores.</p>
        <button class="btn btn-primary" onclick="SetoresEquipesMod.novoSetor()">
          + Novo Setor
        </button>
      </div>`;
  }

  /**
   * Stats resumo no topo da página.
   * @returns {string} HTML
   */
  function renderStats() {
    const setores = Storage.Setores.listar();
    const equipes = Storage.Equipes.listar();
    const alunos  = Storage.Alunos.listar().filter(a => a.setorId);

    const stat = (val, lbl, cls = '') => `
      <div class="stat">
        <div class="stat-val ${cls}">${val}</div>
        <div class="stat-lbl">${lbl}</div>
      </div>`;

    return stat(setores.length, 'Setores') +
           stat(equipes.length, 'Equipes', 'blue') +
           stat(alunos.length,  'Colaboradores alocados');
  }

  return { renderSetor, renderVazio, renderStats };
})();
