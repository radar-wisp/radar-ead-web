/**
 * validators.js — Validação dos campos do modal Novo/Editar Aluno
 * Responsabilidade: regras por etapa + erros inline no DOM.
 */

/* global AlunosState */
/* exported AlunosValidators */

var AlunosValidators = (() => {
  'use strict';

  // ── Erros inline ─────────────────────────────────────────────

  function highlightError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = 'var(--red)';
    const prev = el.parentNode.querySelector('.mal-field-error');
    if (prev) prev.remove();
    const err = document.createElement('div');
    err.className  = 'mal-field-error';
    err.textContent = msg;
    el.insertAdjacentElement('afterend', err);
    el.focus();
    const clean = () => {
      el.style.borderColor = '';
      err.remove();
      el.removeEventListener('input',  clean);
      el.removeEventListener('change', clean);
    };
    el.addEventListener('input',  clean, { once: true });
    el.addEventListener('change', clean, { once: true });
  }

  function clearErrors() {
    document.querySelectorAll('#modal-aluno .mal-field-error').forEach(e => e.remove());
    document.querySelectorAll('#modal-aluno input, #modal-aluno select')
      .forEach(e => { e.style.borderColor = ''; });
  }

  // ── Regras por etapa ─────────────────────────────────────────

  const steps = [
    // Etapa 0: Dados Pessoais
    () => {
      const nome  = document.getElementById('mal-nome')?.value.trim();
      const email = document.getElementById('mal-email')?.value.trim();
      const cargo = document.getElementById('mal-cargo')?.value.trim();
      if (!nome)  { highlightError('mal-nome',  'Informe o nome completo.'); return false; }
      if (!email) { highlightError('mal-email', 'Informe o e-mail.');        return false; }
      if (!cargo) { highlightError('mal-cargo', 'Informe o cargo.');         return false; }
      return true;
    },
    // Etapa 1: Organização
    () => {
      const setor   = document.getElementById('mal-setor')?.value;
      const equipe  = document.getElementById('mal-equipe')?.value;
      const unidade = document.getElementById('mal-unidade')?.value.trim();
      if (!setor)   { highlightError('mal-setor',   'Selecione um setor.');      return false; }
      if (!equipe)  { highlightError('mal-equipe',  'Selecione uma equipe.');    return false; }
      if (!unidade) { highlightError('mal-unidade', 'Informe a unidade/filial.'); return false; }
      return true;
    },
    // Etapa 2: Acesso
    () => {
      const senha = document.getElementById('mal-senha')?.value.trim();
      if (!senha) { highlightError('mal-senha', 'Informe a senha inicial.'); return false; }
      return true;
    },
  ];

  function validateStep(idx) { return steps[idx]?.() ?? true; }

  function validateAll() {
    return steps[0]() && steps[1]() && steps[2]();
  }

  return { highlightError, clearErrors, validateStep, validateAll };
})();
