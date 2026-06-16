/**
 * aluno.js — Portal do Aluno EAD (Refatorado)
 * Continuação automática · Progresso visual · Certificado
 */
var Aluno = (() => {

  let me = null; // aluno logado
  let cur = { cursoId: null, aulaId: null };
  const ICON_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

  /* ════════════════════════════════════
     BOOT
  ════════════════════════════════════ */
  function boot() {
    const s = Storage.Sessao.obter();
    if (s?.tipo === 'aluno') {
      me = Storage.Alunos.obter(s.id);
    }
    if (!me) {
      // Acesso livre: usa o primeiro aluno ativo sem exigir login
      me = Storage.Alunos.listar()[0] || { id: 'guest', nome: 'Visitante', email: '', equipeId: null, setorId: null };
      Storage.Sessao.salvar({ tipo: 'aluno', id: me.id, nome: me.nome, email: me.email });
    }
    showShell();
  }

  function showLogin() {
    document.getElementById('loginWrap').classList.add('active');
    document.getElementById('alunoShell').classList.remove('active');
    bindLogin();
  }

  function showShell() {
    document.getElementById('loginWrap').classList.remove('active');
    document.getElementById('alunoShell').classList.add('active');
    const ini = (me?.nome||'A').charAt(0).toUpperCase();
    document.getElementById('sideAvatar').textContent = ini;
    document.getElementById('sideName').textContent   = (me?.nome||'').split(' ')[0];
    bindNav();
    go('home');
  }

  /* ════════════════════════════════════
     LOGIN / CADASTRO
  ════════════════════════════════════ */
  function bindLogin() {
    const err = document.getElementById('loginErr');

    document.getElementById('loginForm').onsubmit = e => {
      e.preventDefault();
      const aluno = Storage.Alunos.auth(e.target.email.value.trim(), e.target.senha.value);
      if (aluno) {
        me = aluno;
        Storage.Sessao.salvar({ tipo:'aluno', id:aluno.id, nome:aluno.nome, email:aluno.email });
        err.classList.remove('show');
        showShell();
      } else {
        err.textContent = 'E-mail ou senha inválidos.';
        err.classList.add('show');
      }
    };

    document.getElementById('btnParaCad').onclick = () => toggle('loginForm','cadForm');
    document.getElementById('btnParaLogin').onclick = () => toggle('cadForm','loginForm');

    document.getElementById('cadForm').onsubmit = e => {
      e.preventDefault();
      const nome  = e.target.nome.value.trim();
      const email = e.target.email.value.trim();
      const senha = e.target.senha.value;
      const conf  = e.target.conf.value;
      if (senha !== conf) { err.textContent='Senhas não coincidem.'; err.classList.add('show'); return; }
      const aluno = Storage.Alunos.criar({ nome, email, senha });
      if (!aluno) { err.textContent='E-mail já cadastrado.'; err.classList.add('show'); return; }
      me = aluno;
      Storage.Sessao.salvar({ tipo:'aluno', id:aluno.id, nome:aluno.nome, email:aluno.email });
      showShell();
    };
  }

  function toggle(hideId, showId) {
    document.getElementById(hideId).style.display = 'none';
    document.getElementById(showId).style.display = 'block';
    document.getElementById('loginErr').classList.remove('show');
  }

  /* ════════════════════════════════════
     NAV
  ════════════════════════════════════ */
  function bindNav() {
    document.querySelectorAll('.nav-btn[data-pg]').forEach(btn =>
      btn.addEventListener('click', () => go(btn.dataset.pg))
    );
    document.getElementById('btnLogout').onclick = () => {
      Storage.Sessao.encerrar(); location.reload();
    };
  }

  function go(pg, params = {}) {
    document.querySelectorAll('.nav-btn[data-pg]').forEach(b =>
      b.classList.toggle('active', b.dataset.pg === pg)
    );
    document.querySelectorAll('.page').forEach(el =>
      el.classList.toggle('active', el.id === 'pg-' + pg)
    );
    document.getElementById('topTitle').textContent = {
      home:'Início', cursos:'Meus Cursos', player:'Assistindo aula'
    }[pg] || pg;

    if (pg === 'home')   renderHome();
    if (pg === 'cursos') renderCursos();
    if (pg === 'player') renderPlayer(params);
  }

  /* ════════════════════════════════════
     HOME
  ════════════════════════════════════ */
  function renderHome() {
    const todos  = Storage.Cursos.listar().filter(c => c.status === 'publicado');
    const restricoes = Storage.Restricoes.listar();
    const cursos = todos.filter(c => {
      const restr = restricoes.filter(r => r.cursoId === c.id);
      if (!restr.length) return true;
      return restr.some(r => {
        if (r.tipo === 'colaborador') return r.refId === me.id;
        if (r.tipo === 'equipe')     return r.refId === me.equipeId;
        if (r.tipo === 'setor')      return r.refId === me.setorId;
        return false;
      });
    });
    const conc   = Storage.Progresso.concluidas(me.id);

    document.getElementById('hNome').textContent = (me?.nome||'').split(' ')[0];
    document.getElementById('hCursos').textContent = cursos.length;
    document.getElementById('hAulas').textContent  = conc.length;
    document.getElementById('hConc').textContent   = cursos.filter(c =>
      Storage.Progresso.cursoConcluido(me.id, c.id)).length;

    /* Continuar de onde parou */
    const continueWrap = document.getElementById('h-continue');
    const proxima = encontrarProximaAula();
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
              : `<div class="cr-emoji" style="font-size:1.8rem;width:50px;height:50px">${proxima.curso.emoji||'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'}</div>`}
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

    /* Grid de cursos */
    const grid = document.getElementById('h-cursos-grid');
    if (!cursos.length) {
      grid.innerHTML = `<div class="empty"><div class="empty-icon"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg></div>
        <h3>Nenhum curso disponível</h3><p>O admin ainda não publicou cursos.</p></div>`;
      return;
    }
    const progList = cursos.map(c => ({ c, pct: Storage.Progresso.pctCurso(me.id, c.id) }));
    grid.innerHTML = progList.map(({ c, pct }) => courseCard(c, pct)).join('');
  }

  function encontrarProximaAula() {
    const todos  = Storage.Cursos.listar().filter(c => c.status === 'publicado');
    const restricoes = Storage.Restricoes.listar();
    const cursos = todos.filter(c => {
      const restr = restricoes.filter(r => r.cursoId === c.id);
      if (!restr.length) return true;
      return restr.some(r => {
        if (r.tipo === 'colaborador') return r.refId === me.id;
        if (r.tipo === 'equipe')     return r.refId === me.equipeId;
        if (r.tipo === 'setor')      return r.refId === me.setorId;
        return false;
      });
    });
    const conc   = Storage.Progresso.concluidas(me.id);

    // primeiro curso em andamento (pct > 0 e < 100)
    for (const curso of cursos) {
      const pct = Storage.Progresso.pctCurso(me.id, curso.id);
      if (pct > 0 && pct < 100) {
        const modulos = Storage.Modulos.listarPorCurso(curso.id);
        const todas   = modulos.flatMap(m => Storage.Aulas.listarPorModulo(m.id));
        const prox    = todas.find(a => !conc.includes(a.id));
        if (prox) return { curso, aula: prox, pct };
      }
    }
    // nenhum em andamento — retorna primeira aula não iniciada
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

  /* ════════════════════════════════════
     LISTA DE CURSOS
  ════════════════════════════════════ */
  function renderCursos() {
    const todos   = Storage.Cursos.listar().filter(c => c.status === 'publicado');
    const restricoes = Storage.Restricoes.listar();
    const cursos = todos.filter(c => {
      const restr = restricoes.filter(r => r.cursoId === c.id);
      if (!restr.length) return true;
      return restr.some(r => {
        if (r.tipo === 'colaborador') return r.refId === me.id;
        if (r.tipo === 'equipe')     return r.refId === me.equipeId;
        if (r.tipo === 'setor')      return r.refId === me.setorId;
        return false;
      });
    });
    const grid   = document.getElementById('cursos-grid');
    if (!cursos.length) {
      grid.innerHTML = `<div class="empty"><div class="empty-icon"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
        <h3>Sem cursos disponíveis</h3><p>Aguarde novos cursos serem publicados.</p></div>`;
      return;
    }
    grid.innerHTML = cursos
      .map(c => ({ c, pct: Storage.Progresso.pctCurso(me.id, c.id) }))
      .map(({ c, pct }) => courseCard(c, pct))
      .join('');
  }

  function courseCard(c, pct) {
    const mods  = Storage.Modulos.listarPorCurso(c.id).length;
    const total = Storage.Aulas.totalPorCurso(c.id);
    const done  = pct === 100;
    const thumb = c.capa
      ? `<img src="${c.capa}" alt="${x(c.titulo)}" style="width:100%;height:100%;object-fit:cover;display:block">`
      : `<span style="font-size:2.8rem">${c.emoji||'<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'}</span>`;
    return `
    <div class="course-card ${pct>0&&!done?'active-card':''}" onclick="Aluno.iniciarCurso('${c.id}')">
      <div class="cc-thumb">
        ${thumb}
        ${pct > 0 ? `<div class="cc-pct-badge ${done?'done':''}">${done?'<span class=\"badge-check\"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span> Concluído':pct+'%'}</div>` : ''}
      </div>
      <div class="cc-body">
        <div class="cc-title">${x(c.titulo)}</div>
        <div class="cc-desc">${x(c.descricao||'')}</div>
        <div class="cc-meta">
          <span class="badge badge-gray">${mods} módulos</span>
          <span class="badge badge-gray">${total} aulas</span>
          ${c.carga?`<span class="badge badge-gray">⏱ ${c.carga}h</span>`:''}
        </div>
        <div class="cc-prog-row">
          <div class="prog-bar cc-prog-row-bar" style="flex:1;height:4px">
            <div class="prog-fill ${done?'g':''}" style="width:${pct}%"></div>
          </div>
          <span class="cc-prog-pct">${pct}%</span>
        </div>
      </div>
    </div>`;
  }

  function iniciarCurso(cursoId) {
    const modulos = Storage.Modulos.listarPorCurso(cursoId);
    if (!modulos.length) { toast('Este curso não tem conteúdo ainda.', 'i'); return; }
    const todas = modulos.flatMap(m => Storage.Aulas.listarPorModulo(m.id));
    if (!todas.length) { toast('Nenhuma aula cadastrada.', 'i'); return; }
    const conc = Storage.Progresso.concluidas(me.id);
    const prox = todas.find(a => !conc.includes(a.id)) || todas[0];
    Aluno.abrirAula(cursoId, prox.id);
  };

  function abrirAula(cursoId, aulaId) {
    cur = { cursoId, aulaId };
    go('player', { cursoId, aulaId });
  };

  /* ════════════════════════════════════
     PLAYER
  ════════════════════════════════════ */
  function renderPlayer({ cursoId, aulaId } = {}) {
    if (cursoId) cur.cursoId = cursoId;
    if (aulaId)  cur.aulaId  = aulaId;
    if (!cur.cursoId) return;

    const curso   = Storage.Cursos.obter(cur.cursoId);
    const aula    = cur.aulaId ? Storage.Aulas.obter(cur.aulaId) : null;
    const modulos = Storage.Modulos.listarPorCurso(cur.cursoId);
    const todas   = modulos.flatMap(m => Storage.Aulas.listarPorModulo(m.id));
    const idx     = todas.findIndex(a => a.id === cur.aulaId);
    const pct     = Storage.Progresso.pctCurso(me.id, cur.cursoId);
    const conc    = Storage.Progresso.isConcluida(me.id, cur.aulaId||'');

    /* Cabeçalho */
    document.getElementById('playerCursoNome').textContent = curso?.titulo || '';
    document.getElementById('playerTopPct').textContent   = pct + '%';
    document.getElementById('playerTopFill').style.width  = pct + '%';
    document.getElementById('playerTopFill').className    = 'prog-fill' + (pct===100?' g':'');

    /* Botão voltar */
    document.getElementById('btnVoltarPlayer').onclick = () => go('cursos');

    /* Conteúdo */
    renderConteudo(aula, conc);

    /* Índice lateral */
    renderIndice(modulos, cur.aulaId);

    /* Navegação */
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    btnPrev.disabled = idx <= 0;
    btnNext.disabled = idx >= todas.length - 1 || idx < 0;
    btnPrev.onclick  = () => { if (idx>0)              selAula(todas[idx-1].id); };
    btnNext.onclick  = () => { if (idx<todas.length-1) selAula(todas[idx+1].id); };
  }

  function renderConteudo(aula, isConc) {
    const screen = document.getElementById('playerScreen');
    const title  = document.getElementById('playerAulaTitulo');
    const meta   = document.getElementById('playerAulaMeta');
    const btn    = document.getElementById('btnConcluir');

    if (!aula) {
      screen.innerHTML = `<div style="color:#8896A9;text-align:center;padding:60px">
        <div style="font-size:3rem;margin-bottom:12px">▶️</div>
        <p>Selecione uma aula no índice</p></div>`;
      title.textContent = '—'; meta.textContent = '';
      return;
    }

    title.textContent = aula.titulo;
    meta.textContent  = `${tipoLabel(aula.tipo)}${aula.duracao?' · '+aula.duracao+' min':''}`;

    switch (aula.tipo) {
      case 'video': {
        const url = toEmbed(aula.conteudo);
        screen.innerHTML = url
          ? `<iframe src="${url}" style="width:100%;height:325px;border:none;display:block"
              allowfullscreen allow="accelerometer;autoplay;encrypted-media;picture-in-picture"></iframe>`
          : `<div style="color:#8896A9;padding:60px;text-align:center">URL inválida ou não configurada</div>`;
        break;
      }
      case 'texto':
        screen.innerHTML = `<div class="player-text-body">${aula.conteudo||'<p>Sem conteúdo.</p>'}</div>`;
        break;
      case 'pdf':
        screen.innerHTML = aula.conteudo
          ? `<iframe src="${x(aula.conteudo)}" style="width:100%;height:380px;border:none;display:block"></iframe>`
          : `<div style="color:#8896A9;padding:60px;text-align:center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF não configurado</div>`;
        break;
      case 'link':
        screen.innerHTML = `<div style="text-align:center;padding:70px 30px">
          <div style="font-size:2.5rem;margin-bottom:14px"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>
          <p style="color:#8896A9;margin-bottom:20px;font-size:.88rem">Material em site externo</p>
          <a href="${x(aula.conteudo||'#')}" target="_blank" rel="noopener" class="btn btn-primary btn-lg">
            Abrir material ↗
          </a></div>`;
        break;
      default:
        screen.innerHTML = `<div style="color:#8896A9;padding:60px;text-align:center">Tipo não suportado</div>`;
    }

    btn.className = `btn ${isConc ? 'btn-success' : 'btn-primary'}`;
    btn.innerHTML = `<span class="btn-icon">${ICON_CHECK}</span> ${isConc ? 'Concluída' : 'Marcar como concluída'}`;
    btn.className   = `btn ${isConc ? 'btn-success' : 'btn-primary'}`;
    btn.onclick     = () => toggleConc(aula.id);
  }

  function toggleConc(aulaId) {
    const era = Storage.Progresso.isConcluida(me.id, aulaId);
    if (era) {
      Storage.Progresso.desmarcar(me.id, aulaId);
      toast('Desmarcada.', 'i');
    } else {
      Storage.Progresso.marcar(me.id, aulaId);
      toast('Aula concluída!', 's');
      if (Storage.Progresso.cursoConcluido(me.id, cur.cursoId)) {
        setTimeout(mostrarCertificado, 700);
      }
    }
    renderPlayer({});
  }

  function renderIndice(modulos, aulaAtualId) {
    const wrap = document.getElementById('ci-body');
    const pct  = Storage.Progresso.pctCurso(me.id, cur.cursoId);
    const concs = Storage.Progresso.concluidas(me.id);

    document.getElementById('ci-pct-fill').style.width = pct + '%';
    document.getElementById('ci-pct-num').textContent  = pct + '%';

    wrap.innerHTML = modulos.map(m => {
      const aulas = Storage.Aulas.listarPorModulo(m.id);
      const modConc = aulas.filter(a => concs.includes(a.id)).length;
      return `
      <div class="ci-mod-head">
        <span>${m.ordem}. ${x(m.titulo)}</span>
        <span style="font-weight:400;color:var(--t4)">${modConc}/${aulas.length}</span>
      </div>
      ${aulas.map(a => {
        const done   = concs.includes(a.id);
        const active = a.id === aulaAtualId;
        return `<div class="ci-aula ${active?'active':''} ${done?'done':''}"
          onclick="Aluno.selAula('${a.id}')">
          <div class="ci-dot">${done?'<span class=\"ci-done-icon\"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>':''}</div>
          <div class="ci-aula-name">${x(a.titulo)}</div>
          ${a.duracao?`<div class="ci-aula-dur">${a.duracao}m</div>`:''}
        </div>`;
      }).join('')}`;
    }).join('');
  }

  
  function selAula(aulaId) {
    cur.aulaId = aulaId;
    renderPlayer({ aulaId });
  }

  /* ════════════════════════════════════
     CERTIFICADO
  ════════════════════════════════════ */
  function mostrarCertificado() {
    const curso = Storage.Cursos.obter(cur.cursoId);
    const cert  = Storage.Certificados.emitir({
      alunoId: me.id, cursoId: cur.cursoId,
      cargaHoraria: curso?.carga || 0,
      dataConclucao: new Date().toISOString(),
      dataValidade: null,
      responsavel: 'Sistema',
    });
    document.getElementById('certNome').textContent   = me?.nome || '—';
    document.getElementById('certCurso').textContent  = curso?.titulo || '—';
    document.getElementById('certData').textContent   =
      new Date().toLocaleDateString('pt-BR', { day:'numeric', month:'long', year:'numeric' });
    const codigoEl = document.getElementById('certCodigo');
    if (codigoEl) codigoEl.textContent = cert?.codigo || '';
    document.getElementById('certBg').classList.add('open');
    document.getElementById('btnFecharCert').onclick   = () => document.getElementById('certBg').classList.remove('open');
    document.getElementById('btnImprimirCert').onclick = () => window.print();
  }

  /* global EadUtils */

  // Aliases locais para EadUtils
  const x         = EadUtils.escapeHtml;
  const toast     = EadUtils.toast;
  const toEmbed   = EadUtils.toEmbed;
  const tipoLabel = EadUtils.tipoLabel;


  return {
    boot,
    iniciarCurso,
    abrirAula,
    selAula,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  Storage.seed();
  Aluno.boot();
});
