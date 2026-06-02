/**
 * utils.js — Helpers, formatadores, configs de status/tipo/prioridade e badges
 * Responsabilidade única: funções reutilizáveis sem efeitos colaterais de UI.
 */

/* global Storage */

var PubUtils = (() => {
  'use strict';

  const q = s => document.querySelector(s);
  const x = s => s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
  function fmtRelative(iso) {
    if (!iso) return '';
    const diff = Math.ceil((new Date(iso) - Date.now()) / 86400000);
    if (diff < 0)   return `expirou ${-diff}d atrás`;
    if (diff === 0) return 'expira hoje';
    if (diff <= 7)  return `expira em ${diff}d`;
    return fmtDate(iso);
  }

  /* ── Status ─────────────────────────────────────────────────── */
  const ST = {
    publicado: { cls: 'badge-green', label: '● Publicado' },
    agendado:  { cls: 'badge-blue',  label: '◎ Agendado'  },
    rascunho:  { cls: 'badge-gray',  label: '✎ Rascunho'  },
    expirado:  { cls: 'badge-red',   label: '✕ Expirado'  },
    arquivado: { cls: 'badge-amber', label: '▣ Arquivado' },
  };
  function stBadge(s) {
    const c = ST[s] || ST.rascunho;
    return `<span class="badge ${c.cls}">${c.label}</span>`;
  }

  /* ── Tipo ───────────────────────────────────────────────────── */
  const TIPO_CFG = {
    curso:      { cls: 'badge-blue',   label: 'Curso',      cor: '#dbeafe' },
    material:   { cls: 'badge-green',  label: 'Material',   cor: '#d1fae5' },
    avaliacao:  { cls: 'badge-amber',  label: 'Avaliação',  cor: '#fef3c7' },
    comunicado: { cls: 'badge-purple', label: 'Comunicado', cor: '#ede9fe' },
  };
  function tipoBadge(t) {
    const c = TIPO_CFG[t] || { cls: 'badge-gray', label: t };
    return `<span class="badge ${c.cls}">${c.label}</span>`;
  }

  /* ── Prioridade ─────────────────────────────────────────────── */
  const PRIO_CFG = {
    normal:     { cls: 'badge-gray',  label: 'Normal'     },
    importante: { cls: 'badge-amber', label: 'Importante' },
    urgente:    { cls: 'badge-red',   label: 'Urgente'    },
  };

  /* ── Chips IFT (filtro de status) ───────────────────────────── */
  const CHIP_CLS = { '': '', publicado: 'active-pub', agendado: 'active-rev', rascunho: 'active-ras', expirado: 'active-exp', arquivado: 'active-arq' };

  /* ── Título de referência por tipo ──────────────────────────── */
  function getTituloRef(tipo, refId) {
    if (!refId) return '';
    if (tipo === 'curso')      { const c = Storage.Cursos.obter(refId);      return c?.titulo || ''; }
    if (tipo === 'material')   { const m = Storage.Materiais.obter(refId);   return m?.nome   || ''; }
    if (tipo === 'avaliacao')  { const a = Storage.Avaliacoes.obter(refId);  return a?.nome   || ''; }
    if (tipo === 'comunicado') { const c = Storage.Comunicados.obter(refId); return c?.titulo || ''; }
    return '';
  }

  /* ── Toast ──────────────────────────────────────────────────── */
  function toast(msg, tipo = 'i') {
    const s = document.getElementById('toasts'); if (!s) return;
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.innerHTML = `<span>${{ s: '✅', e: '❌', i: 'ℹ️' }[tipo] || 'ℹ️'}</span><span>${msg}</span>`;
    s.appendChild(el); setTimeout(() => el.remove(), 3500);
  }

  return {
    q, x, escapeHtml: x,
    fmtDate, fmtRelative,
    ST, stBadge,
    TIPO_CFG, tipoBadge,
    PRIO_CFG, CHIP_CLS,
    getTituloRef, toast,
  };
})();
