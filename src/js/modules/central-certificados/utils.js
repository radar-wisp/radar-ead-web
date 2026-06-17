/**
 * utils.js — Utilitários puros do módulo Central de Certificados.
 * Responsabilidade única: helpers sem estado e sem acesso a window.Storage
 * (DOM, formatação de datas, escaping, toast, status/badge).
 *
 * @module CertUtils
 */

/* exported CertUtils */

var CertUtils = (() => {
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

  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
    });
  }

  function fmtDateLong(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  }

  /**
   * Formata a data de validade de forma relativa ao momento atual.
   * @param {string|null} iso
   * @returns {string}
   */
  function fmtRelative(iso) {
    if (!iso) return '';
    const diff = Math.ceil((new Date(iso) - Date.now()) / 86400000);
    if (diff < 0)   return `expirou ${-diff}d atrás`;
    if (diff === 0) return 'expira hoje';
    if (diff <= 30) return `expira em ${diff}d`;
    return fmtDate(iso);
  }

  /** Helper para setar value de campo pelo ID */
  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  }

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
    emitido:   { cls: 'badge-green', label: '● Emitido'   },
    pendente:  { cls: 'badge-blue',  label: '◎ Pendente'  },
    expirado:  { cls: 'badge-red',   label: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Expirado'  },
    cancelado: { cls: 'badge-gray',  label: '■ Cancelado' },
  };

  function stBadge(s) {
    const c = ST[s] || ST.pendente;
    return `<span class="badge ${c.cls}">${c.label}</span>`;
  }

  return { q, x, fmtDate, fmtDateLong, fmtRelative, setVal, toast, ST, stBadge };
})();
