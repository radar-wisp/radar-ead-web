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
 *   toEmbed(url)           — converte URL de vídeo para embed (YouTube, Vimeo, Drive, Loom, Panda, MP4)
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
    el.innerHTML = `<span>${{ s: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>', e: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>', i: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' }[tipo] || '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'}</span><span>${escapeHtml(msg)}</span>`;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  /**
   * Converte URL de vídeo para formato embed.
   * Suporta: YouTube, Vimeo, Google Drive, Loom, Panda Video, MP4 direto.
   * @param {string} url
   * @returns {string} URL embed ou URL original
   */
  function toEmbed(url) {
    if (!url) return '';

    // YouTube: watch?v=, youtu.be/, /embed/, /shorts/
    const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`;

    // Vimeo: vimeo.com/123456789 ou player.vimeo.com/video/123456789
    const vm = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`;

    // Google Drive: /file/d/{id}/view → embed
    const gd = url.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
    if (gd) return `https://drive.google.com/file/d/${gd[1]}/preview`;

    // Loom: loom.com/share/{id}
    const lm = url.match(/loom\.com\/share\/([A-Za-z0-9]+)/);
    if (lm) return `https://www.loom.com/embed/${lm[1]}`;

    // Panda Video: dashboard.pandavideo.com.br/videos/{id} ou embed
    const pv = url.match(/pandavideo\.com\.br\/(?:videos|embed)\/([A-Za-z0-9_-]+)/);
    if (pv) return `https://player-vz.pandavideo.com.br/embed/?v=${pv[1]}`;

    // MP4 direto — retorna como está (tratado pelo player com <video>)
    return url;
  }

  /**
   * Rótulo legível para tipo de aula.
   * @param {string} tipo
   * @returns {string}
   */
  function tipoLabel(tipo) {
    return { video: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> Vídeo', texto: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Texto', pdf: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF', link: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg> Link' }[tipo] || tipo;
  }

  return { escapeHtml, fmtDate, fmtRelative, toast, toEmbed, tipoLabel };
})();
