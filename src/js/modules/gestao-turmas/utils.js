/**
 * utils.js — Utilitários e diálogos internos do módulo Turmas.
 * Responsabilidade: helpers de DOM, formatação e modais de confirmação/seleção.
 *
 * @module TurmasUtils
 */

/* global EadUtils */
/* exported TurmasUtils */

var TurmasUtils = (() => {
  'use strict';

  const _x     = EadUtils.escapeHtml;
  const _toast = EadUtils.toast;

  // ── DOM ──────────────────────────────────────────────────────

  function q(sel)      { return document.querySelector(sel); }
  function el(id)      { return document.getElementById(id); }
  function setTxt(id, v) { const e = el(id); if (e) e.textContent = v; }
  function setVal(id, v) { const e = el(id); if (e) e.value = v ?? ''; }

  // ── Formatação ───────────────────────────────────────────────

  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
    });
  }

  // ── Modal de confirmação (#modal-tm-confirm) ─────────────────

  /**
   * @param {string}   titulo
   * @param {string}   msg
   * @param {string}   labelOk
   * @param {'danger'|'primary'} tipoBotao
   * @param {Function} onOk
   */
  function confirm(titulo, msg, labelOk, tipoBotao, onOk) {
    const modal = el('modal-tm-confirm');
    if (!modal) { if (window.confirm(msg)) onOk(); return; }

    setTxt('tm-confirm-titulo', titulo);
    setTxt('tm-confirm-msg',    msg);

    const btnOk = el('tm-confirm-ok');
    btnOk.textContent = labelOk;
    btnOk.className   = `btn btn-${tipoBotao}`;
    btnOk.replaceWith(btnOk.cloneNode(true));

    el('tm-confirm-ok').addEventListener('click', () => {
      modal.classList.remove('open');
      onOk();
    });
    modal.classList.add('open');
  }

  // ── Modal de seleção (#modal-tm-select) ──────────────────────

  /**
   * @param {string}   titulo
   * @param {Array<{id:string,nome:string}>} opcoes
   * @param {Function} onOk
   */
  function selectPrompt(titulo, opcoes, onOk) {
    const modal = el('modal-tm-select');
    const sel   = el('tm-select-opcoes');
    if (!modal || !sel) return;

    setTxt('tm-select-titulo', titulo);
    sel.innerHTML = opcoes.map(o =>
      `<option value="${_x(o.id)}">${_x(o.nome)}</option>`
    ).join('');

    const btnOk = el('tm-select-ok');
    btnOk.replaceWith(btnOk.cloneNode(true));
    el('tm-select-ok').addEventListener('click', () => {
      const escolhido = opcoes.find(o => o.id === sel.value);
      if (!escolhido) return;
      modal.classList.remove('open');
      onOk(escolhido);
    });
    modal.classList.add('open');
  }

  return { q, el, setTxt, setVal, fmtDate, confirm, selectPrompt, toast: _toast, x: _x };
})();
