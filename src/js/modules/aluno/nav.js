/**
 * nav.js — Roteamento interno do Portal do Aluno
 */

/* global Storage, AlunoState, AlunoPages */

var AlunoNav = (() => {
  'use strict';

  const _titles = {
    home: 'Início',
    cursos: 'Meus Cursos',
    player: 'Assistindo aula',
    perfil: 'Meu Perfil',
    certificados: 'Meus Certificados',
    configuracoes: 'Configurações',
  };

  function bind() {
    document.querySelectorAll('.nav-btn[data-pg]').forEach(btn =>
      btn.addEventListener('click', () => go(btn.dataset.pg))
    );
    document.getElementById('btnLogout').onclick = () => {
      Storage.Sessao.encerrar();
      location.reload();
    };
  }

  function go(pg, params = {}) {
    document.querySelectorAll('.nav-btn[data-pg]').forEach(b =>
      b.classList.toggle('active', b.dataset.pg === pg)
    );
    document.querySelectorAll('.page').forEach(el =>
      el.classList.toggle('active', el.id === 'pg-' + pg)
    );
    document.getElementById('topTitle').textContent = _titles[pg] || pg;

    if (pg === 'home')          AlunoPages.renderHome();
    if (pg === 'cursos')        AlunoPages.renderCursos();
    if (pg === 'player')        AlunoPages.renderPlayer(params);
    if (pg === 'perfil')        AlunoPages.renderPerfil();
    if (pg === 'certificados')  AlunoPages.renderCertificados();
    if (pg === 'configuracoes') AlunoPages.renderConfiguracoes();
  }

  return { bind, go };
})();
