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

    chevron: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" class="se-chevron">
      <polyline points="6 9 12 15 18 9"/>
    </svg>`,

    casa: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>`,
  };

  // ── Estado de expansão (em memória por sessão) ────────────────
  const _expandido = {};

  /**
   * Alterna expandido/recolhido de um setor.
   * Chamado pelo onclick do cabeçalho do card.
   * @param {string} setorId
   */
  function toggleSetor(setorId) {
    const abrindo = !_expandido[setorId];

    // Fechar todos os cards via DOM (independente do estado em memória)
    document.querySelectorAll('.se-card').forEach(c => {
      const b = c.querySelector('.se-equipes');
      if (!b) return;
      const id = c.id.replace('setor-', '');
      _expandido[id] = false;
      b.style.maxHeight = b.scrollHeight + 'px';
      requestAnimationFrame(() => { b.style.maxHeight = '0'; });
      c.classList.remove('se-expanded');
    });

    // Abrir o selecionado (se estava fechado)
    if (abrindo) {
      _expandido[setorId] = true;
      const card = document.getElementById(`setor-${setorId}`);
      const body = card?.querySelector('.se-equipes');
      if (!card || !body) return;
      // Duplo rAF garante que a animação de fechar não cancela a de abrir
      requestAnimationFrame(() => {
        card.classList.add('se-expanded');
        body.style.maxHeight = body.scrollHeight + 'px';
      });
    }
  }

  // ── Renderização ──────────────────────────────────────────────

  /**
   * Card de um setor com corpo expansível (accordion).
   * Primeiro setor inicia expandido por padrão.
   * @param {{id,nome,cor}} setor
   * @param {boolean}       [primeiroAberto=false]
   * @returns {string} HTML
   */
  function renderSetor(setor, primeiroAberto = false) {
    const eqs  = Storage.Equipes.listarPorSetor(setor.id);
    const cnt  = Storage.Alunos.porSetor(setor.id).length;
    const cor  = setor.cor || '#0002da';

    // Estado inicial
    _expandido[setor.id] = primeiroAberto;
    const expandidoCls   = primeiroAberto ? 'se-expanded' : '';
    const chevronStyle   = primeiroAberto ? 'transform:rotate(180deg)' : '';
    // max-height inline: aberto = valor grande, fechado = 0
    const bodyStyle      = primeiroAberto ? 'max-height:600px' : 'max-height:0';

    const equipeRows = eqs.length
      ? eqs.map(e => _renderEquipe(e)).join('')
      : `<div class="se-empty-eq">Nenhuma equipe cadastrada.</div>`;

    return `
      <div class="se-card ${expandidoCls}" id="setor-${setor.id}">
        <div class="se-card-head" onclick="SetoresCards.toggleSetor('${setor.id}')" role="button" tabindex="0"
          onkeydown="if(event.key==='Enter'||event.key===' ')SetoresCards.toggleSetor('${setor.id}')">
          <div class="se-card-head-left">
            <span class="se-dot" style="background:${cor}"></span>
            <strong class="se-card-title">${_x(setor.nome)}</strong>
            <span class="se-badge">${cnt} colaborador${cnt !== 1 ? 'es' : ''}</span>
          </div>
          <div class="se-card-head-right">
            <span class="se-chevron-wrap" style="${chevronStyle}">${_SVG.chevron}</span>
            <button class="btn btn-ghost btn-sm" title="Editar setor"
              onclick="event.stopPropagation();SetoresEquipesMod.editarSetor('${setor.id}')">
              ${_SVG.editar}
            </button>
            <button class="btn btn-ghost btn-sm se-btn-danger" title="Excluir setor"
              onclick="event.stopPropagation();SetoresEquipesMod.excluirSetor('${setor.id}')">
              ${_SVG.excluir}
            </button>
          </div>
        </div>
        <div class="se-equipes" style="${bodyStyle}">
          ${equipeRows}
        </div>
        <div class="se-card-footer">
          <button class="se-add-equipe"
            onclick="event.stopPropagation();SetoresEquipesMod.novaEquipe('${setor.id}')">
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

  return { renderSetor, renderVazio, renderStats, toggleSetor };
})();
