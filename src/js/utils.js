/**
 * @fileoverview utils.js — Utilitários compartilhados (EAD)
 *
 * Funções puras reutilizadas por aluno.js e gestao-alunos.js.
 * Deve ser carregado ANTES de qualquer módulo que dependa delas.
 *
 * API pública (window.EadUtils):
 *   escapeHtml(s)          — sanitiza string para inserção no DOM
 *   fmtDate(iso)           — formata data ISO para pt-BR (dd/mm/aa)
 *   fmtRelative(iso)       — formata data relativa ("2h atrás", "Agora"…)
 *   toast(msg, tipo)       — exibe notificação no container #toasts
 *   toEmbed(url)           — converte URL YouTube para embed
 *   tipoLabel(tipo)        — rótulo legível de tipo de aula
 */

var EadUtils = (() => {
  'use strict';

  /**
   * Escapa HTML para evitar XSS.
   * @param {*} s
   * @returns {string}
   */
  function escapeHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;');
  }

  /**
   * Formata data ISO 8601 para pt-BR (dd/mm/aa).
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
   * Formata data relativa ao momento atual.
   * @param {string|null} iso
   * @returns {string}
   */
  function fmtRelative(iso) {
    if (!iso) return 'Nunca';
    const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (diff < 1)    return 'Agora';
    if (diff < 60)   return `${diff}min atrás`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`;
    return fmtDate(iso);
  }

  /**
   * Exibe toast no container global #toasts.
   * @param {string}       msg
   * @param {'s'|'e'|'i'} tipo  — s=sucesso, e=erro, i=info
   */
  function toast(msg, tipo = 'i') {
    const stack = document.getElementById('toasts');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.innerHTML = `<span>${{ s: '✅', e: '❌', i: 'ℹ️' }[tipo] || 'ℹ️'}</span><span>${escapeHtml(msg)}</span>`;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  /**
   * Converte URL do YouTube para formato embed.
   * @param {string} url
   * @returns {string}
   */
  function toEmbed(url) {
    if (!url) return '';
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : url;
  }

  /**
   * Rótulo legível para tipo de aula.
   * @param {string} tipo
   * @returns {string}
   */
  function tipoLabel(tipo) {
    return { video: '🎬 Vídeo', texto: '📝 Texto', pdf: '📄 PDF', link: '🔗 Link' }[tipo] || tipo;
  }

  return { escapeHtml, fmtDate, fmtRelative, toast, toEmbed, tipoLabel };
})();
