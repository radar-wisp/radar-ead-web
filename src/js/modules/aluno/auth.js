/**
 * auth.js — Autenticação, sessão e shell do Portal do Aluno
 */

/* global Storage, AlunoState, AlunoUtils, AlunoNav */

var AlunoAuth = (() => {
  'use strict';

  const { toast, toggle } = AlunoUtils;

  function boot() {
    const s = Storage.Sessao.obter();
    if (s?.tipo === 'aluno') {
      AlunoState.setMe(Storage.Alunos.obter(s.id));
    }
    if (!AlunoState.getMe()) {
      const guest = Storage.Alunos.listar()[0] ||
        { id: 'guest', nome: 'Visitante', email: '', equipeId: null, setorId: null };
      AlunoState.setMe(guest);
      Storage.Sessao.salvar({ tipo: 'aluno', id: guest.id, nome: guest.nome, email: guest.email });
    }
    showShell();
  }

  function showLogin() {
    document.getElementById('loginWrap').classList.add('active');
    document.getElementById('alunoShell').classList.remove('active');
    _bindLogin();
  }

  function showShell() {
    document.getElementById('loginWrap').classList.remove('active');
    document.getElementById('alunoShell').classList.add('active');
    _renderSidebarAvatar();
    AlunoNav.bind();
    AlunoNav.go('home');
  }

  function _bindLogin() {
    const err = document.getElementById('loginErr');

    document.getElementById('loginForm').onsubmit = e => {
      e.preventDefault();
      const aluno = Storage.Alunos.auth(e.target.email.value.trim(), e.target.senha.value);
      if (aluno) {
        AlunoState.setMe(aluno);
        Storage.Sessao.salvar({ tipo: 'aluno', id: aluno.id, nome: aluno.nome, email: aluno.email });
        err.classList.remove('show');
        showShell();
      } else {
        err.textContent = 'E-mail ou senha inválidos.';
        err.classList.add('show');
      }
    };

    document.getElementById('btnParaCad').onclick  = () => toggle('loginForm', 'cadForm');
    document.getElementById('btnParaLogin').onclick = () => toggle('cadForm', 'loginForm');

    document.getElementById('cadForm').onsubmit = e => {
      e.preventDefault();
      const nome  = e.target.nome.value.trim();
      const email = e.target.email.value.trim();
      const senha = e.target.senha.value;
      const conf  = e.target.conf.value;
      if (senha !== conf) { err.textContent = 'Senhas não coincidem.'; err.classList.add('show'); return; }
      const aluno = Storage.Alunos.criar({ nome, email, senha });
      if (!aluno) { err.textContent = 'E-mail já cadastrado.'; err.classList.add('show'); return; }
      AlunoState.setMe(aluno);
      Storage.Sessao.salvar({ tipo: 'aluno', id: aluno.id, nome: aluno.nome, email: aluno.email });
      showShell();
    };
  }

  function _renderSidebarAvatar() {
    const me  = AlunoState.getMe();
    const ini = (me?.nome || 'A').charAt(0).toUpperCase();
    const av  = document.getElementById('sideAvatar');
    av.textContent = ini;
    document.getElementById('sideName').textContent = (me?.nome || '').split(' ')[0];
    if (me?.foto) {
      av.style.backgroundImage = `url(${me.foto})`;
      av.style.backgroundSize  = 'cover';
      av.textContent = '';
    } else {
      av.style.backgroundImage = '';
    }
  }

  return { boot, showLogin, showShell, renderSidebarAvatar: _renderSidebarAvatar };
})();
