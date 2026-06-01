/**
 * utils.js — Helpers e configuração visual do Controle de Acessos (AcUtils).
 * Responsabilidade: querySelector, escape, formatação de datas/validade,
 * setters de campo/toggle, toast, mapas de status/tipo, resolução do status
 * efetivo e nome do alvo. Usa Storage apenas para resolver nomes.
 *
 * @module AcUtils
 */

/* global Storage */

var AcUtils = (() => {
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
   * Formata a data de expiração de forma relativa ao momento atual.
   * @param {string|null} iso
   * @returns {string}
   */
  function fmtExpira(iso) {
    if (!iso) return '—';
    const diff = Math.ceil((new Date(iso) - Date.now()) / 86400000);
    if (diff < 0)   return `Expirou ${-diff}d atrás`;
    if (diff === 0) return 'Expira hoje';
    if (diff <= 7)  return `Expira em ${diff}d`;
    return fmtDate(iso);
  }

  /** Helper para setar value de campo pelo ID */
  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  }

  /**
   * Controla visualmente um toggle on/off.
   * @param {string}  id
   * @param {boolean} on
   */
  function setToggle(id, on) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('on', !!on);
    const span = el.querySelector('span');
    if (span) span.style.left = on ? '21px' : '3px';
    el.style.background = on ? 'var(--blue)' : 'var(--border2)';
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

  // ── Configuração visual de status e tipo ──────────────────────

  const ST = {
    ativo:     { cls: 'badge-green', label: '● Ativo'     },
    expirado:  { cls: 'badge-red',   label: '✕ Expirado'  },
    bloqueado: { cls: 'badge-amber', label: '■ Bloqueado' },
    pendente:  { cls: 'badge-blue',  label: '◎ Pendente'  },
  };

  const TIPO_LABEL = {
    colaborador: 'Individual',
    equipe:      'Equipe',
    setor:       'Setor',
    global:      'Global',
  };

  const TIPO_BADGE = {
    colaborador: 'badge-amber',
    equipe:      'badge-green',
    setor:       'badge-blue',
    global:      'badge-purple',
  };

  /**
   * Resolve o status efetivo da restrição considerando expiração.
   * @param {object} r — restrição
   * @returns {string}
   */
  function resolveStatus(r) {
    let st = r.statusAcesso || 'ativo';
    if (st === 'ativo' && r.dataExpira && new Date(r.dataExpira) < new Date()) {
      st = 'expirado';
    }
    return st;
  }

  function stBadge(r) {
    const st = resolveStatus(r);
    const c  = ST[st] || ST.ativo;
    return `<span class="badge ${c.cls}">${c.label}</span>`;
  }

  /**
   * Resolve o nome exibível do alvo de um acesso (aluno, setor ou equipe).
   * @param {string} tipo
   * @param {string} refId
   * @returns {string}
   */
  function nomeAlvo(tipo, refId) {
    if (tipo === 'setor')  return Storage.Setores.obter(refId)?.nome || refId;
    if (tipo === 'equipe') return Storage.Equipes.obter(refId)?.nome || refId;
    const al = Storage.Alunos.obter(refId);
    return al ? al.nome : refId;
  }

  return {
    q, x, fmtDate, fmtExpira, setVal, setToggle, toast,
    ST, TIPO_LABEL, TIPO_BADGE, resolveStatus, stBadge, nomeAlvo,
  };
})();
