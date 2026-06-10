/**
 * utils.js — Helpers visuais e utilitários do módulo Dashboard
 * Responsabilidade única: funções puras sem efeitos colaterais.
 */

/* global EadUtils */
/* exported DashboardUtils */

var DashboardUtils = (() => {
  'use strict';

  // Delegação para EadUtils — sem reimplementação
  const _x          = EadUtils.escapeHtml;
  const fmtDate     = EadUtils.fmtDate;
  const fmtRelative = EadUtils.fmtRelative;

  /**
   * Formata data relativa ao momento atual (alias local para compatibilidade).
   * @param {string|null} iso
   * @returns {string}
   */
  function fmtDateShort(iso) {
    return fmtRelative(iso);
  }

  /**
   * Renderiza um badge HTML.
   * @param {string} txt
   * @param {string} cls
   * @returns {string}
   */
  function badge(txt, cls) {
    return `<span class="badge ${cls}">${txt}</span>`;
  }

  /**
   * Retorna a classe CSS de badge para um tipo de aula.
   * @param {string} tipo
   * @returns {string}
   */
  function tipoBadge(tipo) {
    return { video: 'badge-amber', texto: 'badge-blue', pdf: 'badge-red', link: 'badge-green' }[tipo] || 'badge-gray';
  }

  /**
   * Renderiza um gráfico de barras horizontais simples (sem libs externas).
   * @param {string}   elId   — ID do elemento container
   * @param {Array}    dados  — [{nome, valor}]
   * @param {string}   cor    — classe CSS da barra (blue|green|purple)
   * @param {Function} [fmt]  — formata o valor exibido
   * @param {number}   [escala] — valor máximo fixo (padrão: máximo do conjunto)
   */
  function renderBarChart(elId, dados, cor, fmt, escala) {
    const el = document.querySelector('#' + elId);
    if (!el) return;
    const fmtVal = fmt || (v => v);
    if (!dados.length || dados.every(d => !d.valor)) {
      el.innerHTML = '<div class="ds-chart-empty">Sem dados ainda</div>';
      return;
    }
    const max = escala || Math.max(...dados.map(d => d.valor), 1);
    el.innerHTML = dados.map(d => {
      const w = Math.round((d.valor / max) * 100);
      return `<div class="ds-bar-row">
        <div class="ds-bar-head"><span class="ds-bar-name">${_x(d.nome)}</span><span class="ds-bar-val">${fmtVal(d.valor)}</span></div>
        <div class="ds-bar-track"><div class="ds-bar-fill ${cor}" style="width:${w}%"></div></div>
      </div>`;
    }).join('');
  }

  return {
    escapeHtml: _x,
    fmtDate,
    fmtDateShort,
    badge,
    tipoBadge,
    renderBarChart,
  };
})();
