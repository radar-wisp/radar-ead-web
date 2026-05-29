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
    el.innerHTML = `<span>${{ s: '✅', e: '❌', i: 'ℹ️' }[tipo] || 'ℹ️'}</span><span>${x(msg)}</span>`;
    s.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  const ST = {
    emitido:   { cls: 'badge-green', label: '● Emitido'   },
    pendente:  { cls: 'badge-blue',  label: '◎ Pendente'  },
    expirado:  { cls: 'badge-red',   label: '✕ Expirado'  },
    cancelado: { cls: 'badge-gray',  label: '■ Cancelado' },
  };

  function stBadge(s) {
    const c = ST[s] || ST.pendente;
    return `<span class="badge ${c.cls}">${c.label}</span>`;
  }

  return { q, x, fmtDate, fmtDateLong, fmtRelative, setVal, toast, ST, stBadge };
})();
