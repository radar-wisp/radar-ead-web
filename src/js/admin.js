/**
 * admin.js — Painel Admin EAD (Refatorado)
 * Modal-driven • Mínimo de cliques • Dashboard profissional
 */
var Admin = (() => {

  /* ── estado ── */
  let curPage = 'dashboard';
  let editCtx  = {};   // { tipo, id }

  /* ════════════════════════════════════
     BOOT
  ════════════════════════════════════ */
  function boot() {
    const s = Storage.Sessao.obter();
    if (s?.tipo === 'admin') {
      go('dashboard');
      showShell();
    } else {
      showLogin();
    }
  }

  function showLogin() {
    document.getElementById('loginWrap').classList.add('active');
    document.getElementById('adminShell').classList.remove('active');
    document.getElementById('loginForm').onsubmit = doLogin;
  }

  function showShell() {
    document.getElementById('loginWrap').classList.remove('active');
    document.getElementById('adminShell').classList.add('active');
    bindNav();
    bindModals();
    updateDate();
  }

  function doLogin(e) {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const senha = e.target.senha.value;
    if (Storage.Admin.auth(email, senha)) {
      Storage.Sessao.salvar({ tipo: 'admin', email });
      showShell();
      go('dashboard');
    } else {
      const el = document.getElementById('loginErr');
      el.textContent = 'Credenciais inválidas.';
      el.classList.add('show');
    }
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

  function go(pg) {
    curPage = pg;
    editCtx = {};
    document.querySelectorAll('.nav-btn[data-pg]').forEach(b =>
      b.classList.toggle('active', b.dataset.pg === pg)
    );
    document.querySelectorAll('.page').forEach(el =>
      el.classList.toggle('active', el.id === 'pg-' + pg)
    );
    document.getElementById('topTitle').textContent = {
      dashboard:'Dashboard', cursos:'Cursos', conteudo:'Módulos & Aulas',
      alunos:'Alunos', progresso:'Progresso'
    }[pg] || pg;
    renders[pg]?.();
  }

  function updateDate() {
    const el = document.getElementById('topDate');
    if (el) el.textContent = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' });
  }

  /* ════════════════════════════════════
     RENDERS
  ════════════════════════════════════ */
  const renders = { dashboard, cursos, conteudo, alunos, progresso };

  /* ── Dashboard ── */
  function dashboard() {
    const allCursos  = Storage.Cursos.listar();
    const allAlunos  = Storage.Alunos.listar();
    const allAulas   = Storage.Aulas.listar();
    const allProg    = Storage.Progresso.listar();

    q('#dsh-ncursos').textContent  = allCursos.length;
    q('#dsh-nalunos').textContent  = allAlunos.length;
    q('#dsh-naulas').textContent   = allAulas.length;
    q('#dsh-nconc').textContent    = allProg.length;

    /* Cursos com progresso médio */
    const cursosBody = q('#dsh-cursos-body');
    if (!allCursos.length) {
      cursosBody.innerHTML = emptyRow(4, 'Nenhum curso ainda');
    } else {
      cursosBody.innerHTML = allCursos.slice(0, 6).map(c => {
        const mods  = Storage.Modulos.listarPorCurso(c.id).length;
        const aulas = Storage.Aulas.totalPorCurso(c.id);
        const pctList = allAlunos.map(a => Storage.Progresso.pctCurso(a.id, c.id));
        const avg  = pctList.length ? Math.round(pctList.reduce((s,v)=>s+v,0)/pctList.length) : 0;
        return `<tr>
          <td><div class="td-name">
            <strong>${c.emoji||'📚'} ${x(c.titulo)}</strong>
            <span>${mods} módulos · ${aulas} aulas${c.carga?' · '+c.carga+'h':''}</span>
          </div></td>
          <td>
            <div class="prog-row">
              <div class="prog-bar"><div class="prog-fill ${avg===100?'g':''}" style="width:${avg}%"></div></div>
              <span class="prog-pct">${avg}%</span>
            </div>
          </td>
          <td>${badge(avg===100?'Completo':avg>0?'Em andamento':'Não iniciado', avg===100?'green':avg>0?'amber':'gray')}</td>
        </tr>`;
      }).join('');
    }

    /* Alunos recentes */
    const alunosBody = q('#dsh-alunos-body');
    if (!allAlunos.length) {
      alunosBody.innerHTML = emptyRow(3, 'Nenhum aluno cadastrado');
    } else {
      alunosBody.innerHTML = allAlunos.slice(-5).reverse().map(a => {
        const conc = Storage.Progresso.concluidas(a.id).length;
        return `<tr>
          <td><div class="td-name">
            <strong>${x(a.nome)}</strong>
            <span>${x(a.email)}</span>
          </div></td>
          <td>${conc} aulas</td>
          <td>${badge(a.ativo?'Ativo':'Inativo',a.ativo?'green':'red')}</td>
        </tr>`;
      }).join('');
    }
  }

  /* ── Cursos ── */
  function cursos() {
    const lista = Storage.Cursos.listar();
    const body  = q('#cursos-list');

    if (!lista.length) {
      body.innerHTML = `<div class="empty"><div class="empty-icon">📭</div>
        <h3>Nenhum curso</h3><p>Clique em "Novo Curso" para começar</p></div>`;
      return;
    }

    body.innerHTML = lista.map(c => {
      const mods  = Storage.Modulos.listarPorCurso(c.id).length;
      const naulas = Storage.Aulas.totalPorCurso(c.id);
      return `<div class="curso-row">
        <div class="cr-emoji">${c.emoji||'📚'}</div>
        <div class="cr-info">
          <div class="cr-title">${x(c.titulo)}</div>
          <div class="cr-meta">${mods} módulos · ${naulas} aulas${c.carga?' · '+c.carga+'h':''}</div>
        </div>
        <div class="cr-actions">
          <button class="btn btn-soft btn-sm" onclick="Admin.openConteudo('${c.id}')">📂 Conteúdo</button>
          <button class="btn btn-ghost btn-sm" onclick="Admin.modalEditCurso('${c.id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="Admin.delCurso('${c.id}')">🗑️</button>
        </div>
      </div>`;
    }).join('');
  }

  function openConteudo(cursoId) {
    go('conteudo');
    setTimeout(() => {
      const sel = q('#ctCursoSel');
      if (sel) { sel.value = cursoId; sel.dispatchEvent(new Event('change')); }
    }, 50);
  };

  function modalEditCurso(id) {
    const c = id ? Storage.Cursos.obter(id) : null;
    editCtx = { tipo: 'curso', id };
    setModalTitle('modalCurso', id ? '✏️ Editar Curso' : '➕ Novo Curso');
    q('#fcTitulo').value    = c?.titulo    || '';
    q('#fcDesc').value      = c?.descricao || '';
    q('#fcEmoji').value     = c?.emoji     || '';
    q('#fcCarga').value     = c?.carga     || '';
    openModal('modalCurso');
  };

  function delCurso(id) {
    confirm2(
    'Excluir curso?',
    'Todos os módulos e aulas serão removidos permanentemente.',
    () => { Storage.Cursos.excluir(id); toast('Curso excluído', 'i'); cursos(); }
  );
  };

  /* ── Conteúdo (Módulos + Aulas em uma tela) ── */
  function conteudo() {
    const allCursos = Storage.Cursos.listar();
    const sel = q('#ctCursoSel');
    sel.innerHTML = '<option value="">— Selecione um curso —</option>'
      + allCursos.map(c => `<option value="${c.id}">${c.emoji||'📚'} ${x(c.titulo)}</option>`).join('');
    sel.onchange = () => renderConteudoDetalhe(sel.value);

    if (allCursos.length === 1) {
      sel.value = allCursos[0].id;
      renderConteudoDetalhe(sel.value);
    } else {
      q('#ct-detalhe').innerHTML = `<div class="empty"><div class="empty-icon">📂</div>
        <h3>Selecione um curso</h3><p>Escolha um curso acima para gerenciar seus módulos e aulas</p></div>`;
    }
  }

  function renderConteudoDetalhe(cursoId) {
    const wrap = q('#ct-detalhe');
    if (!cursoId) { wrap.innerHTML = ''; return; }

    const modulos = Storage.Modulos.listarPorCurso(cursoId);
    if (!modulos.length) {
      wrap.innerHTML = `<div class="empty"><div class="empty-icon">📂</div>
        <h3>Nenhum módulo</h3><p>Adicione o primeiro módulo para este curso</p></div>
        <div style="text-align:center;margin-top:12px">
          <button class="btn btn-primary" onclick="Admin.modalNovoModulo('${cursoId}')">➕ Novo Módulo</button>
        </div>`;
      return;
    }

    wrap.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
        <button class="btn btn-primary btn-sm" onclick="Admin.modalNovoModulo('${cursoId}')">➕ Módulo</button>
      </div>
      ${modulos.map(m => {
        const aulas = Storage.Aulas.listarPorModulo(m.id);
        return `
        <div class="card" style="margin-bottom:14px">
          <div class="card-head">
            <div class="card-title">
              <div class="ct-icon">📂</div>
              ${m.ordem}. ${x(m.titulo)}
            </div>
            <div class="btn-row">
              <button class="btn btn-ghost btn-sm" onclick="Admin.modalEditModulo('${m.id}')">✏️ Editar</button>
              <button class="btn btn-danger btn-sm" onclick="Admin.delModulo('${m.id}','${cursoId}')">🗑️</button>
              <button class="btn btn-soft btn-sm" onclick="Admin.modalNovaAula('${m.id}','${cursoId}')">➕ Aula</button>
            </div>
          </div>
          ${aulas.length ? `
          <div class="tbl-wrap">
            <table>
              <thead><tr><th>#</th><th>Aula</th><th>Tipo</th><th>Duração</th><th></th></tr></thead>
              <tbody>
                ${aulas.map(a => `<tr>
                  <td style="color:var(--t4);width:32px">${a.ordem}</td>
                  <td><div class="td-name"><strong>${x(a.titulo)}</strong></div></td>
                  <td>${badge(a.tipo, tipoBadge(a.tipo))}</td>
                  <td style="color:var(--t3);font-size:.78rem">${a.duracao?a.duracao+' min':'—'}</td>
                  <td><div class="td-actions">
                    <button class="btn btn-ghost btn-sm" onclick="Admin.modalEditAula('${a.id}','${cursoId}')">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="Admin.delAula('${a.id}','${m.id}','${cursoId}')">🗑️</button>
                  </div></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>` : `<div class="card-body" style="color:var(--t3);font-size:.82rem">
            Nenhuma aula — <a href="#" onclick="Admin.modalNovaAula('${m.id}','${cursoId}');return false">adicionar aula</a>
          </div>`}
        </div>`;
      }).join('')}`;
  }

  function modalNovoModulo(cursoId) {
    editCtx = { tipo: 'modulo', cursoId };
    setModalTitle('modalModulo', '➕ Novo Módulo');
    q('#fmTitulo').value = '';
    q('#fmDesc').value   = '';
    openModal('modalModulo');
  };

  function modalEditModulo(id) {
    const m = Storage.Modulos.obter(id);
    editCtx = { tipo: 'modulo', id, cursoId: m.cursoId };
    setModalTitle('modalModulo', '✏️ Editar Módulo');
    q('#fmTitulo').value = m.titulo;
    q('#fmDesc').value   = m.descricao || '';
    openModal('modalModulo');
  };

  function delModulo(id, cursoId) {
    confirm2(
    'Excluir módulo?', 'As aulas também serão removidas.',
    () => { Storage.Modulos.excluir(id); toast('Módulo excluído', 'i'); renderConteudoDetalhe(cursoId); }
  );
  };

  function modalNovaAula(moduloId, cursoId) {
    editCtx = { tipo: 'aula', moduloId, cursoId };
    setModalTitle('modalAula', '➕ Nova Aula');
    q('#faTitulo').value   = '';
    q('#faTipo').value     = 'video';
    q('#faConteudo').value = '';
    q('#faDuracao').value  = '';
    atualizarHintAula('video');
    openModal('modalAula');
  };

  function modalEditAula(id, cursoId) {
    const a = Storage.Aulas.obter(id);
    editCtx = { tipo: 'aula', id, moduloId: a.moduloId, cursoId };
    setModalTitle('modalAula', '✏️ Editar Aula');
    q('#faTitulo').value   = a.titulo;
    q('#faTipo').value     = a.tipo;
    q('#faConteudo').value = a.conteudo || '';
    q('#faDuracao').value  = a.duracao  || '';
    atualizarHintAula(a.tipo);
    openModal('modalAula');
  };

  function delAula(id, moduloId, cursoId) {
    confirm2(
    'Excluir aula?', 'O progresso relacionado também será removido.',
    () => { Storage.Aulas.excluir(id); toast('Aula excluída', 'i'); renderConteudoDetalhe(cursoId); }
  );
  };

  /* ── Alunos ── */
  function alunos() {
    const lista = Storage.Alunos.listar();
    const body  = q('#alunos-tbody');

    if (!lista.length) {
      body.innerHTML = emptyRow(5, 'Nenhum aluno cadastrado');
      return;
    }

    body.innerHTML = lista.map(a => {
      const conc = Storage.Progresso.concluidas(a.id).length;
      const cursosCurr = Storage.Cursos.listar();
      const cursosAtiv = cursosCurr.filter(c => Storage.Progresso.pctCurso(a.id,c.id) > 0).length;
      return `<tr>
        <td><div class="td-name"><strong>${x(a.nome)}</strong><span>${x(a.email)}</span></div></td>
        <td>${badge(a.ativo?'Ativo':'Inativo',a.ativo?'green':'red')}</td>
        <td>${cursosAtiv} cursos</td>
        <td>${conc} aulas</td>
        <td class="text-sm" style="color:var(--t3)">${fmtDate(a.criadoEm)}</td>
      </tr>`;
    }).join('');
  }

  /* ── Progresso ── */
  function progresso() {
    const allA  = Storage.Alunos.listar();
    const allC  = Storage.Cursos.listar();
    const body  = q('#prog-tbody');

    if (!allA.length || !allC.length) {
      body.innerHTML = emptyRow(4, 'Sem dados de progresso');
      return;
    }

    const rows = allA.flatMap(a =>
      allC.map(c => ({
        aluno: a, curso: c,
        pct: Storage.Progresso.pctCurso(a.id, c.id)
      }))
    ).sort((a,b) => b.pct - a.pct);

    body.innerHTML = rows.map(r => `<tr>
      <td><div class="td-name"><strong>${x(r.aluno.nome)}</strong><span>${x(r.aluno.email)}</span></div></td>
      <td>${r.curso.emoji||'📚'} ${x(r.curso.titulo)}</td>
      <td style="min-width:160px">
        <div class="prog-row">
          <div class="prog-bar"><div class="prog-fill ${r.pct===100?'g':''}" style="width:${r.pct}%"></div></div>
          <span class="prog-pct">${r.pct}%</span>
        </div>
      </td>
      <td>${badge(r.pct===100?'✅ Concluído':r.pct>0?r.pct+'%':'Não iniciado',r.pct===100?'green':r.pct>0?'amber':'gray')}</td>
    </tr>`).join('');
  }

  /* ════════════════════════════════════
     MODAIS — BIND
  ════════════════════════════════════ */
  function bindModals() {

    /* Fechar ao clicar fora */
    document.querySelectorAll('.modal-bg').forEach(bg =>
      bg.addEventListener('click', e => { if (e.target === bg) closeModals(); })
    );
    document.querySelectorAll('.modal-close').forEach(btn =>
      btn.addEventListener('click', closeModals)
    );

    /* Novo curso (btn header) */
    q('#btnNovoCurso').onclick = () => Admin.modalEditCurso(null);

    /* Novo aluno */
    q('#btnNovoAluno').onclick = () => openModal('modalAluno');

    /* Form: Curso */
    q('#formCurso').onsubmit = e => {
      e.preventDefault();
      const d = {
        titulo:    q('#fcTitulo').value.trim(),
        descricao: q('#fcDesc').value.trim(),
        emoji:     q('#fcEmoji').value.trim() || '📚',
        carga:     q('#fcCarga').value,
      };
      if (!d.titulo) return;
      if (editCtx.id) Storage.Cursos.atualizar(editCtx.id, d);
      else             Storage.Cursos.criar(d);
      toast(editCtx.id ? 'Curso atualizado!' : 'Curso criado!', 's');
      closeModals();
      cursos();
    };

    /* Form: Módulo */
    q('#formModulo').onsubmit = e => {
      e.preventDefault();
      const d = {
        cursoId:   editCtx.cursoId,
        titulo:    q('#fmTitulo').value.trim(),
        descricao: q('#fmDesc').value.trim(),
      };
      if (!d.titulo || !d.cursoId) return;
      if (editCtx.id) Storage.Modulos.atualizar(editCtx.id, d);
      else             Storage.Modulos.criar(d);
      toast(editCtx.id ? 'Módulo atualizado!' : 'Módulo criado!', 's');
      closeModals();
      renderConteudoDetalhe(editCtx.cursoId);
    };

    /* Form: Aula */
    q('#faTipo').onchange = e => atualizarHintAula(e.target.value);
    q('#formAula').onsubmit = e => {
      e.preventDefault();
      const d = {
        moduloId: editCtx.moduloId,
        titulo:   q('#faTitulo').value.trim(),
        tipo:     q('#faTipo').value,
        conteudo: q('#faConteudo').value.trim(),
        duracao:  q('#faDuracao').value,
      };
      if (!d.titulo || !d.moduloId) return;
      if (editCtx.id) Storage.Aulas.atualizar(editCtx.id, d);
      else             Storage.Aulas.criar(d);
      toast(editCtx.id ? 'Aula atualizada!' : 'Aula criada!', 's');
      closeModals();
      renderConteudoDetalhe(editCtx.cursoId);
    };

    /* Form: Aluno */
    q('#formAluno').onsubmit = e => {
      e.preventDefault();
      const d = {
        nome:  q('#faNome').value.trim(),
        email: q('#faEmail').value.trim(),
        senha: q('#faSenha').value,
      };
      const res = Storage.Alunos.criar(d);
      if (!res) { toast('E-mail já cadastrado!', 'e'); return; }
      toast('Aluno cadastrado!', 's');
      closeModals();
      q('#formAluno').reset();
      alunos();
    };

    /* Confirm modal */
    q('#confirmCancel').onclick = closeModals;
  }

  /* ════════════════════════════════════
     MODAL UTILS
  ════════════════════════════════════ */
  function openModal(id) {
    document.getElementById(id).classList.add('open');
  }
  function closeModals() {
    document.querySelectorAll('.modal-bg').forEach(el => el.classList.remove('open'));
  }
  function setModalTitle(modalId, title) {
    document.querySelector(`#${modalId} .modal-head h3`).textContent = title;
  }

  function confirm2(title, msg, cb) {
    q('#confirmTitle').textContent = title;
    q('#confirmMsg').textContent   = msg;
    openModal('confirmModal');
    q('#confirmOk').onclick = () => { closeModals(); cb(); };
  }

  /* ════════════════════════════════════
     HELPERS
  ════════════════════════════════════ */
  function atualizarHintAula(tipo) {
    const hints = {
      video: 'URL do YouTube (ex: https://youtube.com/embed/xxx)',
      texto: 'Conteúdo HTML da aula',
      pdf:   'URL do arquivo PDF',
      link:  'URL do material externo',
    };
    const label = q('#faConteudoLabel');
    const input = q('#faConteudo');
    if (label) label.textContent = hints[tipo] || 'Conteúdo';
    if (input) input.placeholder = hints[tipo] || '';
  }

  function q(sel) { return document.querySelector(sel); }

  function x(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  function badge(txt, tipo) {
    return `<span class="badge badge-${tipo}">${txt}</span>`;
  }

  function tipoBadge(t) {
    return { video:'amber', texto:'blue', pdf:'red', link:'green' }[t] || 'gray';
  }

  function emptyRow(cols, msg) {
    return `<tr><td colspan="${cols}" style="text-align:center;padding:28px;color:var(--t3)">${msg}</td></tr>`;
  }

  function toast(msg, tipo='i') {
    const stack = document.getElementById('toasts');
    const el    = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.innerHTML = `<span>${{s:'✅',e:'❌',i:'ℹ️'}[tipo]}</span><span>${msg}</span>`;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  return {
    boot,
    openConteudo,
    modalEditCurso, delCurso,
    modalNovoModulo, modalEditModulo, delModulo,
    modalNovaAula, modalEditAula, delAula,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  Storage.seed();
  Admin.boot();
});
