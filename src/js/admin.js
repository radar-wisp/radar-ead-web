/**
 * admin.js — Painel Admin Corporativo EAD
 * Módulos: Dashboard · Cursos · Materiais · Acessos · Colaboradores · Publicação
 */

var Admin = (() => {

  let pg = 'dashboard';
  let modal = { id: null, ctx: {} };

  /* ══════════════════════════════════
     BOOT
  ══════════════════════════════════ */
  function boot() {
    const s = Storage.Sessao.obter();
    if (s && s.tipo === 'admin') {
      showApp();
    } else {
      q('#loginWrap').classList.add('active');
      q('#loginForm').onsubmit = doLogin;
    }
  }

  function doLogin(e) {
    e.preventDefault();
    const em = e.target.email.value.trim();
    const pw = e.target.senha.value;
    const err = q('#loginErr');
    if (Storage.Admin.auth(em, pw)) {
      Storage.Sessao.salvar({ tipo:'admin', email:em });
      err.classList.remove('show');
      showApp();
    } else {
      err.textContent = 'Credenciais inválidas.';
      err.classList.add('show');
    }
  }

  function showApp() {
    q('#loginWrap').classList.remove('active');
    q('#appWrap').classList.add('active');
    bindNav();
    bindModals();
    go('dashboard');
  }

  /* ══════════════════════════════════
     NAV
  ══════════════════════════════════ */
  function bindNav() {
    document.querySelectorAll('[data-pg]').forEach(el =>
      el.addEventListener('click', () => go(el.dataset.pg))
    );
    q('#btnLogout').onclick = () => { Storage.Sessao.encerrar(); location.reload(); };
  }

  function go(p) {
    pg = p;
    document.querySelectorAll('[data-pg]').forEach(el =>
      el.classList.toggle('active', el.dataset.pg === p)
    );
    document.querySelectorAll('.pg').forEach(el =>
      el.classList.toggle('active', el.id === 'pg-' + p)
    );
    const titles = {
      dashboard:'Dashboard', cursos:'Gestão de Cursos',
      materiais:'Materiais de Apoio', acessos:'Controle de Acessos',
      colaboradores:'Colaboradores', publicacao:'Publicação',
    };
    q('#topTitle').textContent = titles[p] || p;
    renders[p]?.();
  }

  const renders = { dashboard, cursos, materiais, acessos, colaboradores, publicacao };

  /* ══════════════════════════════════
     DASHBOARD
  ══════════════════════════════════ */
  function dashboard() {
    const allCursos = Storage.Cursos.listar();
    const allAlunos = Storage.Alunos.listar();
    const allProg   = Storage.Progresso.listar();
    const publicados = allCursos.filter(c=>c.status==='publicado').length;

    q('#ds-cursos').textContent    = allCursos.length;
    q('#ds-publicados').textContent = publicados;
    q('#ds-colab').textContent     = allAlunos.length;
    q('#ds-concl').textContent     = allProg.length;

    // Cursos recentes
    const tbody = q('#ds-cursos-body');
    if (!allCursos.length) { tbody.innerHTML = tdEmpty(4, 'Nenhum curso'); return; }
    tbody.innerHTML = allCursos.slice(0,6).map(c => {
      const totalAulas = Storage.Aulas.totalPorCurso(c.id);
      const concluidos = allProg.filter(p => {
        const mids = Storage.Modulos.listarPorCurso(c.id).map(m=>m.id);
        const aids = Storage.Aulas.listar().filter(a=>mids.includes(a.moduloId)).map(a=>a.id);
        return aids.includes(p.aulaId);
      }).length;
      return `<tr>
        <td><span style="font-size:1.1rem">${c.emoji||'📚'}</span> <strong>${x(c.titulo)}</strong></td>
        <td>${totalAulas} aulas</td>
        <td>${statusBadge(c.status)}</td>
        <td><button class="btn btn-sm btn-ghost" onclick="Admin.goEdit('${c.id}')">Editar →</button></td>
      </tr>`;
    }).join('');
  }

  function goEdit(cursoId) {
    go('cursos');
    setTimeout(() => openModalCurso(cursoId), 100);
  }

  /* ══════════════════════════════════
     GESTÃO DE CURSOS
  ══════════════════════════════════ */
  function cursos() {
    renderCursosList();
  }

  function renderCursosList() {
    const lista = Storage.Cursos.listar();
    const wrap  = q('#cursos-list');

    if (!lista.length) {
      wrap.innerHTML = `<div class="empty"><div class="ei">📭</div><p>Nenhum curso. Crie o primeiro!</p></div>`;
      return;
    }

    wrap.innerHTML = lista.map(c => {
      const mods  = Storage.Modulos.listarPorCurso(c.id).length;
      const aulas = Storage.Aulas.totalPorCurso(c.id);
      const mats  = Storage.Materiais.listarPorCurso(c.id).length;
      const rest  = Storage.Restricoes.porCurso(c.id).length;
      return `
      <div class="curso-card">
        <div class="curso-card-left">
          <div class="curso-emoji">${c.emoji||'📚'}</div>
          <div class="curso-info">
            <div class="curso-titulo">${x(c.titulo)}</div>
            <div class="curso-meta">${mods} módulos · ${aulas} aulas · ${mats} materiais · ${c.carga||0}h${c.validadeAte?' · válido até '+fmtDate(c.validadeAte):''}</div>
          </div>
        </div>
        <div class="curso-card-right">
          ${statusBadge(c.status)}
          ${rest ? `<span class="badge badge-blue">${rest} restrição(ões)</span>` : ''}
          <button class="btn btn-sm btn-ghost" onclick="Admin.openModalCurso('${c.id}')">✏️ Editar</button>
          <button class="btn btn-sm btn-soft" onclick="Admin.duplicarCurso('${c.id}')" title="Duplicar">⧉</button>
          <button class="btn btn-sm btn-danger" onclick="Admin.excluirCurso('${c.id}')">🗑️</button>
        </div>
      </div>`;
    }).join('');
  }

  function openModalCurso(id) {
    const c = id ? Storage.Cursos.obter(id) : null;
    modal.ctx = { cursoId: id };

    q('#mc-titulo').value    = c?.titulo    || '';
    q('#mc-desc').value      = c?.descricao || '';
    q('#mc-emoji').value     = c?.emoji     || '';
    q('#mc-carga').value     = c?.carga     || '';
    q('#mc-validade').value  = c?.validadeAte ? c.validadeAte.split('T')[0] : '';
    q('#mc-form-title').textContent = id ? 'Editar Curso' : 'Novo Curso';

    // Carrega módulos/aulas
    renderModulosEditor(id);
    openModal('modal-curso');
  }

  function renderModulosEditor(cursoId) {
    const wrap = q('#mc-modulos');
    if (!cursoId) { wrap.innerHTML = '<p style="color:var(--t3);font-size:.82rem">Salve o curso primeiro para adicionar módulos.</p>'; return; }

    const modulos = Storage.Modulos.listarPorCurso(cursoId);
    wrap.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <strong style="font-size:.85rem">Módulos e Aulas</strong>
        <button class="btn btn-sm btn-soft" onclick="Admin.addModulo('${cursoId}')">+ Módulo</button>
      </div>
      ${modulos.length ? modulos.map(m => {
        const aulas = Storage.Aulas.listarPorModulo(m.id);
        return `
        <div class="mod-bloco">
          <div class="mod-header">
            <span>${m.ordem}. ${x(m.titulo)}</span>
            <div style="display:flex;gap:6px">
              <button class="btn btn-sm btn-soft" onclick="Admin.addAula('${m.id}','${cursoId}')">+ Aula</button>
              <button class="btn btn-sm btn-danger" onclick="Admin.delModulo('${m.id}','${cursoId}')">🗑️</button>
            </div>
          </div>
          ${aulas.map(a => `
            <div class="aula-row">
              <span class="badge ${tipoBadge(a.tipo)}">${a.tipo}</span>
              <span>${x(a.titulo)}</span>
              <span style="color:var(--t3);font-size:.76rem;margin-left:auto">${a.duracao||0}min</span>
              <button class="btn btn-sm btn-danger" onclick="Admin.delAula('${a.id}','${m.id}','${cursoId}')">🗑️</button>
            </div>`).join('')}
        </div>`;
      }).join('') : '<p style="color:var(--t3);font-size:.82rem">Nenhum módulo ainda.</p>'}`;
  }

  function addModulo(cursoId) {
    const titulo = prompt('Nome do módulo:');
    if (!titulo) return;
    Storage.Modulos.criar({ cursoId, titulo });
    renderModulosEditor(cursoId);
  }

  function addAula(moduloId, cursoId) {
    const titulo = prompt('Título da aula:');
    if (!titulo) return;
    const tipo = prompt('Tipo (video/texto/pdf/link):', 'video') || 'video';
    const url  = prompt('URL ou conteúdo:') || '';
    const dur  = parseInt(prompt('Duração em minutos:', '10')) || 10;
    Storage.Aulas.criar({ moduloId, titulo, tipo, conteudo: url, duracao: dur });
    renderModulosEditor(cursoId);
  }

  function delModulo(moduloId, cursoId) {
    if (!confirm('Excluir módulo e suas aulas?')) return;
    Storage.Modulos.excluir(moduloId);
    renderModulosEditor(cursoId);
  }

  function delAula(aulaId, moduloId, cursoId) {
    Storage.Aulas.excluir(aulaId);
    renderModulosEditor(cursoId);
  }

  function duplicarCurso(id) {
    const novo = Storage.Cursos.duplicar(id);
    if (novo) { toast('Curso duplicado!', 's'); renderCursosList(); }
  }

  function excluirCurso(id) {
    if (!confirm('Excluir curso permanentemente?')) return;
    Storage.Cursos.excluir(id);
    toast('Curso excluído.', 'i');
    renderCursosList();
  }

  /* ══════════════════════════════════
     MATERIAIS DE APOIO
  ══════════════════════════════════ */
  function materiais() {
    const cursos = Storage.Cursos.listar();
    const sel    = q('#mat-curso-sel');
    sel.innerHTML = '<option value="">Todos os cursos</option>'
      + cursos.map(c => `<option value="${c.id}">${x(c.titulo)}</option>`).join('');
    sel.onchange = () => renderMateriais(sel.value);
    renderMateriais('');

    q('#mat-upload-btn').onclick = () => {
      const cursoId = sel.value;
      if (!cursoId) { toast('Selecione um curso primeiro', 'e'); return; }
      q('#mat-file-input').click();
    };

    q('#mat-file-input').onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const cursoId = sel.value;
      Storage.Materiais.criar({
        cursoId,
        nome: file.name,
        tipo: file.type.includes('pdf') ? 'pdf' : file.type.includes('video') ? 'video' : 'doc',
        tamanho: formatBytes(file.size),
        url: '#simulado',
      });
      toast(`"${file.name}" adicionado!`, 's');
      renderMateriais(cursoId);
      e.target.value = '';
    };
  }

  function renderMateriais(cursoId) {
    const lista = cursoId
      ? Storage.Materiais.listarPorCurso(cursoId)
      : Storage.Materiais.listar();
    const wrap = q('#mat-lista');

    if (!lista.length) {
      wrap.innerHTML = `<div class="empty"><div class="ei">📁</div><p>Nenhum material. Faça upload acima.</p></div>`;
      return;
    }

    const cursos = Storage.Cursos.listar();
    wrap.innerHTML = `<table><thead><tr><th>Nome</th><th>Curso</th><th>Tipo</th><th>Tamanho</th><th>Adicionado</th><th></th></tr></thead><tbody>
      ${lista.map(m => {
        const c = cursos.find(c=>c.id===m.cursoId);
        return `<tr>
          <td><strong>${x(m.nome)}</strong></td>
          <td>${x(c?.titulo||'—')}</td>
          <td>${badge(m.tipo,'badge-blue')}</td>
          <td style="color:var(--t3)">${m.tamanho||'—'}</td>
          <td style="color:var(--t3)">${fmtDate(m.criadoEm)}</td>
          <td><button class="btn btn-sm btn-danger" onclick="Admin.delMaterial('${m.id}')">🗑️</button></td>
        </tr>`;
      }).join('')}
    </tbody></table>`;
  }

  function delMaterial(id) {
    Storage.Materiais.excluir(id);
    const sel = q('#mat-curso-sel');
    renderMateriais(sel.value);
    toast('Material removido.', 'i');
  }

  /* ══════════════════════════════════
     CONTROLE DE ACESSOS
  ══════════════════════════════════ */
  function acessos() {
    const cursos  = Storage.Cursos.listar();
    const sel     = q('#ac-curso-sel');
    sel.innerHTML = '<option value="">Selecione um curso</option>'
      + cursos.map(c => `<option value="${c.id}">${x(c.titulo)}</option>`).join('');
    sel.onchange  = () => renderAcessos(sel.value);
    renderAcessos('');
  }

  function renderAcessos(cursoId) {
    const wrap = q('#ac-restricoes');
    if (!cursoId) { wrap.innerHTML = '<p style="color:var(--t3);font-size:.85rem">Selecione um curso acima.</p>'; return; }

    const restricoes = Storage.Restricoes.porCurso(cursoId);
    const setores    = Storage.Setores.listar();
    const equipes    = Storage.Equipes.listar();
    const alunos     = Storage.Alunos.listar();

    const getNome = (tipo, refId) => {
      if (tipo==='setor')       return setores.find(s=>s.id===refId)?.nome || refId;
      if (tipo==='equipe')      return equipes.find(e=>e.id===refId)?.nome || refId;
      if (tipo==='colaborador') return alunos.find(a=>a.id===refId)?.nome  || refId;
      return refId;
    };

    wrap.innerHTML = `
      <div class="ac-header">
        <span style="font-size:.85rem;font-weight:600">Restrições ativas</span>
        <div style="display:flex;gap:8px">
          <select id="ac-tipo" class="sel-sm">
            <option value="setor">Por Setor</option>
            <option value="equipe">Por Equipe</option>
            <option value="colaborador">Por Colaborador</option>
          </select>
          <select id="ac-ref" class="sel-sm"><option value="">Selecione</option></select>
          <button class="btn btn-sm btn-primary" onclick="Admin.addRestricao('${cursoId}')">+ Adicionar</button>
        </div>
      </div>
      ${restricoes.length ? `
        <div class="restricoes-lista">
          ${restricoes.map(r => `
            <div class="restricao-tag">
              <span class="badge ${r.tipo==='setor'?'badge-blue':r.tipo==='equipe'?'badge-green':'badge-amber'}">${r.tipo}</span>
              ${x(getNome(r.tipo, r.refId))}
              <button onclick="Admin.remRestricao('${cursoId}','${r.tipo}','${r.refId}')" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:.9rem;padding:0 4px">×</button>
            </div>`).join('')}
        </div>` : '<p style="color:var(--t3);font-size:.82rem;margin-top:8px">Sem restrições — curso visível para todos.</p>'}`;

    // Atualiza o select de referência ao mudar o tipo
    const tipoSel = q('#ac-tipo');
    const refSel  = q('#ac-ref');

    const atualizaRefSel = () => {
      const tipo = tipoSel.value;
      const opts = tipo==='setor' ? setores
                 : tipo==='equipe' ? equipes
                 : alunos;
      refSel.innerHTML = '<option value="">Selecione</option>'
        + opts.map(o => `<option value="${o.id}">${x(o.nome)}</option>`).join('');
    };
    tipoSel.onchange = atualizaRefSel;
    atualizaRefSel();
  }

  function addRestricao(cursoId) {
    const tipo  = q('#ac-tipo').value;
    const refId = q('#ac-ref').value;
    if (!refId) { toast('Selecione um item', 'e'); return; }
    Storage.Restricoes.adicionar({ cursoId, tipo, refId });
    toast('Restrição adicionada!', 's');
    renderAcessos(cursoId);
  }

  function remRestricao(cursoId, tipo, refId) {
    Storage.Restricoes.remover(cursoId, tipo, refId);
    renderAcessos(cursoId);
  }

  /* ══════════════════════════════════
     COLABORADORES
  ══════════════════════════════════ */
  function colaboradores() {
    renderColabList();
    renderSetoresEquipes();

    q('#btn-novo-colab').onclick = () => openModal('modal-colab');
    q('#btn-novo-setor').onclick = () => {
      const nome = prompt('Nome do setor:');
      if (!nome) return;
      const cor = prompt('Cor hex (ex: #2F45FF):', '#2F45FF') || '#2F45FF';
      Storage.Setores.criar({ nome, cor });
      renderSetoresEquipes();
      toast('Setor criado!', 's');
    };
    q('#btn-nova-equipe').onclick = () => {
      const setores = Storage.Setores.listar();
      if (!setores.length) { toast('Crie um setor primeiro', 'e'); return; }
      const nome = prompt('Nome da equipe:');
      if (!nome) return;
      const setorId = prompt('ID do setor (veja a lista):') || setores[0].id;
      Storage.Equipes.criar({ nome, setorId });
      renderSetoresEquipes();
      toast('Equipe criada!', 's');
    };
  }

  function renderColabList() {
    const lista   = Storage.Alunos.listar();
    const setores = Storage.Setores.listar();
    const equipes = Storage.Equipes.listar();
    const tbody   = q('#colab-tbody');

    if (!lista.length) { tbody.innerHTML = tdEmpty(6,'Nenhum colaborador'); return; }

    tbody.innerHTML = lista.map(a => {
      const setor  = setores.find(s=>s.id===a.setorId);
      const equipe = equipes.find(e=>e.id===a.equipeId);
      const prog   = Storage.Progresso.listar().filter(p=>p.alunoId===a.id).length;
      return `<tr>
        <td><strong>${x(a.nome)}</strong><br><span style="color:var(--t3);font-size:.76rem">${x(a.email)}</span></td>
        <td>${setor  ? `<span class="badge badge-blue">${x(setor.nome)}</span>`  : '—'}</td>
        <td>${equipe ? `<span class="badge badge-green">${x(equipe.nome)}</span>` : '—'}</td>
        <td>${badge(a.ativo?'Ativo':'Inativo', a.ativo?'badge-green':'badge-red')}</td>
        <td>${prog} aulas</td>
        <td>
          <button class="btn btn-sm btn-ghost" onclick="Admin.toggleColab('${a.id}',${!a.ativo})">${a.ativo?'Desativar':'Ativar'}</button>
        </td>
      </tr>`;
    }).join('');
  }

  function renderSetoresEquipes() {
    const setores = Storage.Setores.listar();
    const equipes = Storage.Equipes.listar();
    const wrap    = q('#setores-equipes');

    wrap.innerHTML = setores.length ? setores.map(s => {
      const eqs = equipes.filter(e=>e.setorId===s.id);
      const colab= Storage.Alunos.porSetor(s.id).length;
      return `
      <div class="setor-card">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <div style="width:10px;height:10px;border-radius:50%;background:${s.cor||'#2F45FF'}"></div>
          <strong style="font-size:.9rem">${x(s.nome)}</strong>
          <span style="color:var(--t3);font-size:.78rem;margin-left:auto">${colab} colaboradores</span>
          <button class="btn btn-sm btn-danger" onclick="Admin.delSetor('${s.id}')">🗑️</button>
        </div>
        ${eqs.map(e => `
          <div class="equipe-row">
            <span>👥 ${x(e.nome)}</span>
            <span style="color:var(--t3);font-size:.76rem">${Storage.Alunos.porEquipe(e.id).length} membros</span>
            <button class="btn btn-sm btn-danger" onclick="Admin.delEquipe('${e.id}')">🗑️</button>
          </div>`).join('')}
        ${!eqs.length ? '<p style="color:var(--t3);font-size:.78rem;padding:4px 0">Sem equipes neste setor</p>' : ''}
      </div>`;
    }).join('') : '<p style="color:var(--t3);font-size:.85rem">Nenhum setor cadastrado.</p>';
  }

  function toggleColab(id, ativo) {
    Storage.Alunos.atualizar(id, { ativo });
    toast(ativo ? 'Colaborador ativado.' : 'Colaborador desativado.', 'i');
    renderColabList();
  }

  function delSetor(id) {
    if (!confirm('Excluir setor?')) return;
    Storage.Setores.excluir(id);
    renderSetoresEquipes();
  }

  function delEquipe(id) {
    if (!confirm('Excluir equipe?')) return;
    Storage.Equipes.excluir(id);
    renderSetoresEquipes();
  }

  /* ══════════════════════════════════
     PUBLICAÇÃO
  ══════════════════════════════════ */
  function publicacao() {
    const cursos = Storage.Cursos.listar();
    const wrap   = q('#pub-lista');

    wrap.innerHTML = cursos.length ? cursos.map(c => {
      const aulas   = Storage.Aulas.totalPorCurso(c.id);
      const mods    = Storage.Modulos.listarPorCurso(c.id).length;
      const rest    = Storage.Restricoes.porCurso(c.id).length;
      const valido  = c.validadeAte ? new Date(c.validadeAte) > new Date() : true;
      const pronto  = aulas > 0 && mods > 0;

      return `
      <div class="pub-card">
        <div class="pub-card-left">
          <div style="font-size:1.6rem">${c.emoji||'📚'}</div>
          <div>
            <div style="font-weight:600;font-size:.92rem">${x(c.titulo)}</div>
            <div style="color:var(--t3);font-size:.78rem;margin-top:2px">
              ${mods} módulos · ${aulas} aulas · ${rest ? rest+' restrição(ões)' : 'Acesso livre'}
              ${c.validadeAte ? ` · Validade: ${fmtDate(c.validadeAte)}` : ''}
            </div>
          </div>
        </div>
        <div class="pub-card-right">
          ${statusBadge(c.status)}
          ${!valido ? '<span class="badge badge-red">Expirado</span>' : ''}
          ${!pronto && c.status==='rascunho' ? '<span class="badge badge-amber">Sem conteúdo</span>' : ''}
          ${c.status === 'rascunho' ?
            `<button class="btn btn-sm btn-primary" onclick="Admin.publicar('${c.id}')" ${!pronto?'disabled title="Adicione módulos e aulas primeiro"':''}>
              ▶ Publicar
            </button>` :
            c.status === 'publicado' ?
            `<button class="btn btn-sm btn-ghost" onclick="Admin.arquivar('${c.id}')">⏸ Arquivar</button>
             <button class="btn btn-sm btn-soft"  onclick="Admin.publicar('${c.id}')">↺ Republicar</button>` :
            `<button class="btn btn-sm btn-primary" onclick="Admin.publicar('${c.id}')">▶ Reativar</button>`
          }
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm btn-ghost" onclick="Admin.openValidade('${c.id}')">📅 Validade</button>
            <button class="btn btn-sm btn-ghost" onclick="Admin.duplicarCurso('${c.id}')">⧉ Duplicar</button>
          </div>
        </div>
      </div>`;
    }).join('') : `<div class="empty"><div class="ei">📭</div><p>Nenhum curso cadastrado.</p></div>`;
  }

  function publicar(id) {
    Storage.Cursos.publicar(id);
    toast('Curso publicado!', 's');
    publicacao();
  }

  function arquivar(id) {
    Storage.Cursos.arquivar(id);
    toast('Curso arquivado.', 'i');
    publicacao();
  }

  function openValidade(cursoId) {
    const c   = Storage.Cursos.obter(cursoId);
    const val = prompt('Data de validade (AAAA-MM-DD):', c?.validadeAte ? c.validadeAte.split('T')[0] : '');
    if (val === null) return;
    Storage.Cursos.atualizar(cursoId, { validadeAte: val ? new Date(val).toISOString() : null });
    toast('Validade atualizada!', 's');
    publicacao();
  }

  /* ══════════════════════════════════
     MODAIS
  ══════════════════════════════════ */
  function bindModals() {
    // Fecha ao clicar fora
    document.querySelectorAll('.modal-bg').forEach(bg =>
      bg.addEventListener('click', e => { if (e.target === bg) closeModals(); })
    );
    document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', closeModals));

    // Form Curso
    q('#mc-form').onsubmit = e => {
      e.preventDefault();
      const d = {
        titulo:     q('#mc-titulo').value.trim(),
        descricao:  q('#mc-desc').value.trim(),
        emoji:      q('#mc-emoji').value.trim() || '📚',
        carga:      parseInt(q('#mc-carga').value) || 0,
        validadeAte: q('#mc-validade').value ? new Date(q('#mc-validade').value).toISOString() : null,
      };
      if (!d.titulo) return;
      if (modal.ctx.cursoId) {
        Storage.Cursos.atualizar(modal.ctx.cursoId, d);
        toast('Curso atualizado!', 's');
      } else {
        const novo = Storage.Cursos.criar(d);
        modal.ctx.cursoId = novo.id;
        renderModulosEditor(novo.id);
        toast('Curso criado!', 's');
      }
      renderCursosList();
    };

    // Form Colaborador
    q('#colab-form').onsubmit = e => {
      e.preventDefault();
      const setores = Storage.Setores.listar();
      const equipes = Storage.Equipes.listar();
      const setorId = q('#colab-setor').value;
      const equipeId= q('#colab-equipe').value;
      const d = {
        nome:     q('#colab-nome').value.trim(),
        email:    q('#colab-email').value.trim(),
        senha:    q('#colab-senha').value,
        setorId:  setorId  || null,
        equipeId: equipeId || null,
      };
      const res = Storage.Alunos.criar(d);
      if (!res) { toast('E-mail já cadastrado!', 'e'); return; }
      toast('Colaborador cadastrado!', 's');
      closeModals();
      e.target.reset();
      renderColabList();
    };

    // Preenche selects do modal colab
    q('#modal-colab').addEventListener('transitionend', () => {});
    document.getElementById('modal-colab').addEventListener('click', function handler() {
      // remove listener após primeiro click
    });
  }

  function openModal(id) {
    // Preenche selects dinâmicos antes de abrir
    if (id === 'modal-colab') {
      const setores = Storage.Setores.listar();
      const equipes = Storage.Equipes.listar();
      q('#colab-setor').innerHTML  = '<option value="">— Setor —</option>'  + setores.map(s=>`<option value="${s.id}">${x(s.nome)}</option>`).join('');
      q('#colab-equipe').innerHTML = '<option value="">— Equipe —</option>' + equipes.map(e=>`<option value="${e.id}">${x(e.nome)}</option>`).join('');
    }
    document.getElementById(id).classList.add('open');
  }

  function closeModals() {
    document.querySelectorAll('.modal-bg').forEach(el => el.classList.remove('open'));
  }

  /* ══════════════════════════════════
     HELPERS
  ══════════════════════════════════ */
  function q(sel) { return document.querySelector(sel); }

  function x(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  function formatBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
    return (b/1048576).toFixed(1) + ' MB';
  }

  function badge(txt, cls) { return `<span class="badge ${cls}">${txt}</span>`; }

  function statusBadge(status) {
    const map = { publicado:'badge-green', rascunho:'badge-amber', arquivado:'badge-gray' };
    const labels = { publicado:'✅ Publicado', rascunho:'✏️ Rascunho', arquivado:'📦 Arquivado' };
    return badge(labels[status]||status, map[status]||'badge-gray');
  }

  function tipoBadge(tipo) {
    return { video:'badge-amber', texto:'badge-blue', pdf:'badge-red', link:'badge-green' }[tipo]||'badge-gray';
  }

  function tdEmpty(cols, msg) {
    return `<tr><td colspan="${cols}" style="text-align:center;padding:28px;color:var(--t3)">${msg}</td></tr>`;
  }

  function toast(msg, tipo='i') {
    const stack = document.getElementById('toasts');
    const el    = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.innerHTML = `<span>${{s:'✅',e:'❌',i:'ℹ️'}[tipo]||'ℹ️'}</span><span>${msg}</span>`;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  return {
    boot, go, goEdit,
    openModalCurso, addModulo, addAula, delModulo, delAula,
    duplicarCurso, excluirCurso,
    delMaterial,
    addRestricao, remRestricao,
    toggleColab, delSetor, delEquipe,
    publicar, arquivar, openValidade,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  Storage.seed();
  Admin.boot();
});
