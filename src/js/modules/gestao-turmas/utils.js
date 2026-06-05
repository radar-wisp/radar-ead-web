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
    let modal = el('modal-tm-select');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-bg';
      modal.id = 'modal-tm-select';
      modal.innerHTML =
        '<div class="modal" style="max-width:380px">' +
          '<div class="modal-head"><h3 id="tm-select-titulo"></h3>' +
            '<button class="modal-close" type="button" data-close>' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button></div>' +
          '<div class="modal-body"><select id="tm-select-opcoes" style="width:100%"></select></div>' +
          '<div class="modal-foot">' +
            '<button class="btn btn-ghost" type="button" data-close>Cancelar</button>' +
            '<button class="btn btn-primary" id="tm-select-ok" type="button">Confirmar</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal || ev.target.closest('[data-close]'))
          modal.classList.remove('open');
      });
    }
    const sel = el('tm-select-opcoes');
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
