/**
 * utils.js — Utilitários puros do módulo Sistema de Avaliações.
 * Responsabilidade única: helpers sem estado e sem acesso a window.Storage
 * (DOM, formatação, escaping, toast, badge de status).
 *
 * Extraído de sistema-avaliacoes.js (modularização gradual — fatia 1).
 *
 * @module AvalUtils
 */

/* exported AvalUtils */

var AvalUtils = (() => {
  'use strict';

  /** Atalho para querySelector */
  function q(sel) { return document.querySelector(sel); }

  /** Escapa HTML para evitar XSS */
  function x(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Gera ID único local (antes de salvar no Storage) */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  }

  /** Formata data ISO 8601 para pt-BR. */
  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
    });
  }

  /** Formata segundos em formato legível. */
  function fmtTempo(seg) {
    if (!seg) return '—';
    const m = Math.floor(seg / 60), s = seg % 60;
    return m ? `${m}min ${s}s` : `${s}s`;
  }

  /** Helper para setar value de campo pelo ID */
  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  }

  /** Exibe toast usando o container global #toasts. */
  function toast(msg, tipo = 'i') {
    const s = document.getElementById('toasts');
    if (!s) return;
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.innerHTML = `<span>${{ s: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>', e: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>', i: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' }[tipo] || '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'}</span><span>${x(msg)}</span>`;
    s.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  const ST = {
    rascunho:  { cls: 'badge-gray',  label: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Rascunho'  },
    publicada: { cls: 'badge-green', label: '● Publicada'  },
    encerrada: { cls: 'badge-amber', label: '■ Encerrada'  },
    arquivada: { cls: 'badge-red',   label: '▣ Arquivada'  },
  };

  /** Badge visual de status. */
  function stBadge(s) {
    const c = ST[s] || ST.rascunho;
    return `<span class="badge ${c.cls}">${c.label}</span>`;
  }

  return { q, x, uid, fmtDate, fmtTempo, setVal, toast, stBadge };
})();
