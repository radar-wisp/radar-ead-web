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
    el.innerHTML = `<span>${{ s: '✅', e: '❌', i: 'ℹ️' }[tipo] || 'ℹ️'}</span><span>${x(msg)}</span>`;
    s.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  const ST = {
    rascunho:  { cls: 'badge-gray',  label: '✎ Rascunho'  },
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
