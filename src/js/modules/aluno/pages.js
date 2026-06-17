/**
 * pages.js — Renderização das páginas do Portal do Aluno
 * (home, cursos, perfil, configurações, certificados)
 */

/* global Storage, AlunoState, AlunoUtils, AlunoCards, AlunoPlayer, AlunoCertificados, AlunoAuth */

var AlunoPages = (() => {
  'use strict';

  const { x, toast, cursosAcessiveis } = AlunoUtils;

  /* ── HOME ─────────────────────────────────────── */

  function renderHome() {
    const me    = AlunoState.getMe();
    const cursos = cursosAcessiveis();
    const conc   = Storage.Progresso.concluidas(me.id);

    document.getElementById('hNome').textContent   = (me?.nome || '').split(' ')[0];
    document.getElementById('hCursos').textContent = cursos.length;
    document.getElementById('hAulas').textContent  = conc.length;
    document.getElementById('hConc').textContent   = cursos.filter(c =>
      Storage.Progresso.cursoConcluido(me.id, c.id)).length;

    /* Continuar de onde parou */
    const continueWrap = document.getElementById('h-continue');
    const proxima = _encontrarProximaAula(cursos);
    if (proxima) {
      continueWrap.style.display = '';
      continueWrap.innerHTML = `
        <div class="card">
          <div class="card-head">
            <div class="card-title"><div class="ct-icon">▶️</div> Continuar assistindo</div>
          </div>
          <div class="card-body" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
            ${proxima.curso.capa
              ? `<img src="${proxima.curso.capa}" alt="${x(proxima.curso.titulo)}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;flex-shrink:0">`
              : `<div class="cr-emoji" style="font-size:1.8rem;width:50px;height:50px">${proxima.curso.emoji || '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'}</div>`}
            <div style="flex:1;min-width:0">
              <div style="font-family:var(--font-j);font-weight:700;font-size:.9rem;margin-bottom:2px">${x(proxima.aula.titulo)}</div>
              <div style="font-size:.78rem;color:var(--t3);margin-bottom:8px">${x(proxima.curso.titulo)} · ${proxima.aula.tipo}</div>
              <div class="prog-row">
                <div class="prog-bar"><div class="prog-fill" style="width:${proxima.pct}%"></div></div>
                <span class="prog-pct">${proxima.pct}% do curso</span>
              </div>
            </div>
            <button class="btn btn-primary" onclick="Aluno.abrirAula('${proxima.curso.id}','${proxima.aula.id}')">
              ▶ Continuar
            </button>
          </div>
        </div>`;
    } else {
      continueWrap.style.display = 'none';
    }

    /* Grid de cursos em andamento */
    const grid = document.getElementById('h-cursos-grid');
    const progList = cursos
      .map(c => ({ c, pct: Storage.Progresso.pctCurso(me.id, c.id) }))
      .filter(({ pct }) => pct > 0 && pct < 100);

    if (!progList.length) {
      grid.innerHTML = `<div class="empty"><div class="empty-icon"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg></div>
        <h3>Nenhum curso em andamento</h3><p>Acesse <strong>Meus Cursos</strong> para começar um curso.</p></div>`;
      return;
    }
    grid.innerHTML = progList.map(({ c, pct }) => AlunoCards.courseCard(c, pct)).join('');
  }

  function _encontrarProximaAula(cursos) {
    const me   = AlunoState.getMe();
    const conc = Storage.Progresso.concluidas(me.id);

    for (const curso of cursos) {
      const pct = Storage.Progresso.pctCurso(me.id, curso.id);
      if (pct > 0 && pct < 100) {
        const modulos = Storage.Modulos.listarPorCurso(curso.id);
        const todas   = modulos.flatMap(m => Storage.Aulas.listarPorModulo(m.id));
        const prox    = todas.find(a => !conc.includes(a.id));
        if (prox) return { curso, aula: prox, pct };
      }
    }
    for (const curso of cursos) {
      const pct = Storage.Progresso.pctCurso(me.id, curso.id);
      if (pct === 0) {
        const modulos = Storage.Modulos.listarPorCurso(curso.id);
        const todas   = modulos.flatMap(m => Storage.Aulas.listarPorModulo(m.id));
        if (todas.length) return { curso, aula: todas[0], pct: 0 };
      }
    }
    return null;
  }

  /* ── CURSOS ────────────────────────────────────── */

  function renderCursos() {
    const me    = AlunoState.getMe();
    const cursos = cursosAcessiveis();
    const grid   = document.getElementById('cursos-grid');

    if (!cursos.length) {
      grid.innerHTML = `<div class="empty"><div class="empty-icon"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
        <h3>Sem cursos disponíveis</h3><p>Aguarde novos cursos serem publicados.</p></div>`;
      return;
    }
    grid.innerHTML = cursos
      .map(c => ({ c, pct: Storage.Progresso.pctCurso(me.id, c.id) }))
      .map(({ c, pct }) => AlunoCards.courseCard(c, pct))
      .join('');
  }

  /* ── PERFIL ────────────────────────────────────── */

  function renderPerfil() {
    const me = AlunoState.getMe();
    const dt = me.criadoEm
      ? new Date(me.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—';
    document.getElementById('piCadastro').textContent = dt;
    document.getElementById('piNome').textContent     = me.nome  || '—';
    document.getElementById('piEmail').textContent    = me.email || '—';
  }

  /* ── CERTIFICADOS ──────────────────────────────── */

  function renderCertificados() {
    AlunoCertificados.renderCertificados();
  }

  /* ── CONFIGURAÇÕES ─────────────────────────────── */

  function renderConfiguracoes() {
    const me = AlunoState.getMe();
    const partes    = (me.nome || '').split(' ');
    const nome      = partes[0] || '';
    const sobrenome = partes.slice(1).join(' ');

    document.getElementById('cfgNome').value      = nome;
    document.getElementById('cfgSobrenome').value = sobrenome;
    document.getElementById('cfgBio').value       = me.bio || '';
    _renderCfgAvatar();

    document.getElementById('cfgFotoInput').onchange = e => {
      const file = e.target.files[0]; if (!file) return;
      const r = new FileReader();
      r.onload = ev => {
        Storage.Alunos.atualizar(me.id, { foto: ev.target.result });
        AlunoState.setMe(Storage.Alunos.obter(me.id));
        _renderCfgAvatar();
        AlunoAuth.renderSidebarAvatar();
        toast('Foto atualizada!', 's');
      };
      r.readAsDataURL(file);
    };

    document.getElementById('cfgSalvar').onclick = () => {
      const n = document.getElementById('cfgNome').value.trim();
      const s = document.getElementById('cfgSobrenome').value.trim();
      const b = document.getElementById('cfgBio').value.trim();
      if (!n) { toast('Informe seu nome.', 'e'); return; }
      const nomeCompleto = s ? `${n} ${s}` : n;
      const me = AlunoState.getMe();
      Storage.Alunos.atualizar(me.id, { nome: nomeCompleto, bio: b });
      AlunoState.setMe(Storage.Alunos.obter(me.id));
      Storage.Sessao.salvar({ tipo: 'aluno', id: me.id, nome: me.nome, email: me.email });
      AlunoAuth.renderSidebarAvatar();
      toast('Perfil atualizado!', 's');
    };
  }

  function _renderCfgAvatar() {
    const me = AlunoState.getMe();
    const el = document.getElementById('cfgAvatarPreview');
    if (me.foto) {
      el.style.backgroundImage = `url(${me.foto})`;
      el.textContent = '';
    } else {
      el.style.backgroundImage = '';
      el.textContent = (me.nome || 'A').charAt(0).toUpperCase();
    }
  }

  return { renderHome, renderCursos, renderPerfil, renderCertificados, renderConfiguracoes };
})();
