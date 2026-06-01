/**
 * utils.js — Helpers puros e configuração visual (MatUtils).
 * Responsabilidade: querySelector, escape, formatação, toast e os mapas
 * de tipo/status com seus badges. Sem estado de domínio, sem Storage.
 *
 * @module MatUtils
 */

var MatUtils = (() => {
  'use strict';

  /** Atalho para querySelector */
  function q(sel) { return document.querySelector(sel); }

  /** Escapa HTML para evitar XSS */
  function x(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Formata data ISO 8601 para pt-BR.
   * @param {string|null} iso
   * @returns {string}
   */
  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
    });
  }

  /**
   * Formata bytes para exibição legível.
   * @param {number|string} b
   * @returns {string}
   */
  function fmtBytes(b) {
    if (!b || isNaN(+b)) return '—';
    const n = +b;
    if (n < 1024)    return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  }

  /**
   * Exibe toast usando o container global #toasts.
   * @param {string} msg
   * @param {'s'|'e'|'i'} tipo
   */
  function toast(msg, tipo = 'i') {
    const s = document.getElementById('toasts');
    if (!s) return;
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.innerHTML = `<span>${{ s: '✅', e: '❌', i: 'ℹ️' }[tipo] || 'ℹ️'}</span><span>${x(msg)}</span>`;
    s.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  /**
   * Configuração visual por tipo de material.
   * @type {Record<string, {label:string, bg:string, txt:string}>}
   */
  const TIPO_CFG = {
    pdf:    { label: 'PDF',          bg: '#fee2e2', txt: '#b91c1c' },
    video:  { label: 'Vídeo',        bg: '#fef3c7', txt: '#b45309' },
    xlsx:   { label: 'Planilha',     bg: '#d1fae5', txt: '#065f46' },
    doc:    { label: 'Documento',    bg: '#dbeafe', txt: '#1e40af' },
    imagem: { label: 'Imagem',       bg: '#ede9fe', txt: '#5b21b6' },
    link:   { label: 'Link',         bg: '#ede9fe', txt: '#7c3aed' },
    zip:    { label: 'ZIP',          bg: '#fef3c7', txt: '#92400e' },
    pptx:   { label: 'Apresentação', bg: '#fee2e2', txt: '#991b1b' },
    quiz:   { label: 'Avaliação',    bg: '#fef9c3', txt: '#713f12' },
    outro:  { label: 'Outro',        bg: '#f0f0f8', txt: '#5252a0' },
  };

  /**
   * Retorna HTML de badge colorido por tipo.
   * @param {string} tipo
   * @returns {string}
   */
  function tipoBadge(tipo) {
    const c = TIPO_CFG[tipo] || TIPO_CFG.outro;
    return `<span style="display:inline-block;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;background:${c.bg};color:${c.txt}">${c.label}</span>`;
  }

  /**
   * Configuração visual por status de material.
   */
  const STATUS_CFG = {
    ativo:     { cls: 'badge-green', label: '● Ativo'     },
    oculto:    { cls: 'badge-amber', label: '◉ Oculto'    },
    arquivado: { cls: 'badge-gray',  label: '▣ Arquivado' },
  };

  function statusBadge(s) {
    const c = STATUS_CFG[s] || STATUS_CFG.ativo;
    return `<span class="badge ${c.cls}">${c.label}</span>`;
  }

  return { q, x, fmtDate, fmtBytes, toast, TIPO_CFG, tipoBadge, STATUS_CFG, statusBadge };
})();
