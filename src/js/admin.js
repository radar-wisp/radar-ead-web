/**
 * admin.js — Painel Admin Corporativo EAD
 * Refatorado: Dashboard profissional · Badges corretos · Pendências
 * Busca global · Menu de ações por curso · Últimas atividades
 */

var Admin = (() => {

  let pg = 'dashboard';
  let modal = { id: null, ctx: {} };

  function boot() {
    const s = Storage.Sessao.obter();
    if (s && s.tipo === 'admin') { showApp(); }
    else { q('#loginWrap').classList.add('active'); q('#loginForm').onsubmit = doLogin; }
  }

  function doLogin(e) {
    e.preventDefault();
    const em = e.target.email.value.trim(), pw = e.target.senha.value, err = q('#loginErr');
    if (Storage.Admin.auth(em, pw)) {
      Storage.Sessao.salvar({ tipo:'admin', email:em }); err.classList.remove('show'); showApp();
    } else { err.textContent = 'Credenciais inválidas.'; err.classList.add('show'); }
  }

  function showApp() {
    q('#loginWrap').classList.remove('active');
    q('#appWrap').classList.add('active');
    bindNav(); bindModals(); go('dashboard');
    if (typeof SidebarNav !== 'undefined') SidebarNav.restorePrefs();
  }

  function bindNav() {
    document.querySelectorAll('[data-pg]').forEach(el => el.addEventListener('click', () => go(el.dataset.pg)));
    q('#btnLogout').onclick = () => { Storage.Sessao.encerrar(); location.reload(); };
  }

  function go(p) {
    pg = p;
    document.querySelectorAll('[data-pg]').forEach(el => el.classList.toggle('active', el.dataset.pg === p));
    document.querySelectorAll('.pg').forEach(el => el.classList.toggle('active', el.id === 'pg-' + p));
    const titles = {
      dashboard:      'Dashboard',
      cursos:         'Gestão de Cursos',
      turmas:         'Turmas',
      materiais:      'Materiais de Apoio',
      avaliacoes:     'Avaliações',
      colaboradores:  'Alunos',
      acessos:        'Controle de Acessos',
      relatorios:     'Relatórios',
      certificados:   'Certificados',
      configuracoes:  'Configurações',
      publicacao:     'Publicação',
    };
    q('#topTitle').textContent = titles[p] || p;
    renders[p]?.();
  }

  const renders = {
    dashboard, cursos, materiais, acessos, colaboradores, publicacao,
    // Módulos futuros — stub que mostra "em breve"
    turmas:         () => { if (typeof Turmas !== 'undefined') Turmas.init(); else emBreve('Turmas'); },
    avaliacoes:     () => emBreve('Avaliações'),
    relatorios:     () => emBreve('Relatórios'),
    certificados:   () => emBreve('Certificados'),
    configuracoes:  () => emBreve('Configurações'),
  };

  function emBreve(nome) {
    const pg = document.getElementById('pg-dashboard');
    // Reutiliza a área de conteúdo genérica
    document.querySelectorAll('.pg').forEach(el => el.classList.remove('active'));
    let holder = document.getElementById('pg-em-breve');
    if (!holder) {
      holder = document.createElement('div');
      holder.id = 'pg-em-breve';
      holder.className = 'pg active';
      document.querySelector('.content').appendChild(holder);
    }
    holder.classList.add('active');
    holder.innerHTML = `
      <div class="ph"><div><h2>${nome}</h2><p>Módulo em desenvolvimento</p></div></div>
      <div style="text-align:center;padding:60px 20px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow)">
        <div style="width:56px;height:56px;background:var(--blue-light);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div style="font-size:16px;font-weight:600;color:var(--text);margin-bottom:8px">${nome}</div>
        <div style="font-size:13px;color:var(--text3);max-width:320px;margin:0 auto;line-height:1.6">
          Este módulo está em desenvolvimento e estará disponível em breve.
        </div>
      </div>`;
  }


  /* ── Dashboard ── */
  function dashboard() {
    const allCursos = Storage.Cursos.listar();
    const allAlunos = Storage.Alunos.listar();
    const allProg   = Storage.Progresso.listar();
    const agora     = new Date();
    const publicados = allCursos.filter(c => (c.status||'rascunho') === 'publicado').length;

    q('#ds-cursos').textContent     = allCursos.length;
    q('#ds-publicados').textContent = publicados;
    q('#ds-colab').textContent      = allAlunos.length;
    q('#ds-concl').textContent      = allProg.length;

    /* pendências */
    const expirados   = allCursos.filter(c => c.validadeAte && new Date(c.validadeAte) < agora && (c.status||'rascunho') === 'publicado');
    const semConteudo = allCursos.filter(c => (c.status||'rascunho') === 'publicado' && Storage.Aulas.totalPorCurso(c.id) === 0);
    const revisao     = allCursos.filter(c => (c.status||'rascunho') === 'revisao');
    const pends = [
      ...expirados.map(c  => ({ tipo:'expired', label:'Validade expirada',      curso:c, acao:'Arquivar', fn:`Admin.arquivar('${c.id}')` })),
      ...semConteudo.map(c => ({ tipo:'empty',   label:'Publicado sem conteúdo', curso:c, acao:'Editar',   fn:`Admin.goEdit('${c.id}')` })),
      ...revisao.map(c     => ({ tipo:'review',  label:'Aguardando revisão',     curso:c, acao:'Publicar', fn:`Admin.publicar('${c.id}')` })),
    ];
    q('#ds-pendencias').innerHTML = pends.length
      ? pends.map(p => `<div class="pend-item pend-${p.tipo}"><div class="pend-left"><span class="pend-dot"></span><div><div class="pend-titulo">${x(p.curso.titulo)}</div><div class="pend-label">${p.label}</div></div></div><button class="btn btn-sm btn-ghost" onclick="${p.fn}">${p.acao}</button></div>`).join('')
      : `<div class="pend-ok"><span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg></span> Tudo em ordem! Nenhuma pendência.</div>`;


    /* atividades */
    const wrap   = q('#ds-atividades');
    const progs  = Storage.Progresso.listar().slice(-6).reverse();
    const alunos = Storage.Alunos.listar();
    const aulas  = Storage.Aulas.listar();
    const cursos = Storage.Cursos.listar();
    if (!progs.length) { wrap.innerHTML = '<div style="color:var(--t3);font-size:.82rem;padding:8px 0">Nenhuma atividade ainda.</div>'; }
    else wrap.innerHTML = progs.map(p => {
      const al  = alunos.find(a => a.id === p.alunoId);
      const au  = aulas.find(a  => a.id === p.aulaId);
      const mod = au ? Storage.Modulos.listar().find(m => m.id === au.moduloId) : null;
      const cur = mod ? cursos.find(c => c.id === mod.cursoId) : null;
      return `<div class="ativ-item"><div class="ativ-avatar">${(al?.nome||'?').charAt(0).toUpperCase()}</div><div class="ativ-info"><div class="ativ-titulo"><strong>${x(al?.nome||'Colaborador')}</strong> concluiu uma aula</div><div class="ativ-sub">${x(au?.titulo||'—')}${cur?' · '+x(cur.titulo):''}</div></div><div class="ativ-time">${fmtDateShort(p.concluidaEm)}</div></div>`;
    }).join('');
  }

  function _toggleMenu(btn) {
    const menu = btn.nextElementSibling, isOpen = menu.classList.contains('open');
    _closeMenus();
    if (!isOpen) { menu.classList.add('open'); setTimeout(() => document.addEventListener('click', _closeMenus, { once:true }), 10); }
  }
  function _closeMenus() { document.querySelectorAll('.action-menu.open').forEach(m => m.classList.remove('open')); }
  function goAcessos(cursoId) { go('acessos'); setTimeout(() => { const sel=q('#ac-curso-sel'); if(sel){sel.value=cursoId;sel.dispatchEvent(new Event('change'));} }, 100); }
  function goEdit(cursoId)    { go('cursos'); setTimeout(() => openModalCurso(cursoId), 100); }

  /* ── Gestão de Cursos ── */
  function cursos() {
    // Delegado ao módulo Cursos
    if (typeof Cursos !== 'undefined') Cursos.init();
  }


  function openModalCurso(id) {
    const c = id ? Storage.Cursos.obter(id) : null;
    modal.ctx = { cursoId: id };
    q('#mc-titulo').value   = c?.titulo    || '';
    q('#mc-desc').value     = c?.descricao || '';
    q('#mc-emoji').value    = c?.emoji     || '';
    q('#mc-carga').value    = c?.carga     || '';
    q('#mc-status').value   = c?.status    || 'rascunho';
    q('#mc-validade').value = c?.validadeAte ? c.validadeAte.split('T')[0] : '';
    q('#mc-form-title').textContent = id ? 'Editar Curso' : 'Novo Curso';
    renderModulosEditor(id);
    openModal('modal-curso');
  }

  function renderModulosEditor(cursoId) {
    const wrap = q('#mc-modulos');
    if (!cursoId) { wrap.innerHTML = '<p style="color:var(--t3);font-size:.82rem">Salve o curso primeiro.</p>'; return; }
    const modulos = Storage.Modulos.listarPorCurso(cursoId);
    wrap.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><strong style="font-size:.85rem">Módulos e Aulas</strong><button class="btn btn-sm btn-soft" onclick="Admin.addModulo('${cursoId}')">+ Módulo</button></div>
      ${modulos.length ? modulos.map(m => {
        const aulas = Storage.Aulas.listarPorModulo(m.id);
        return `<div class="mod-bloco"><div class="mod-header"><span>${m.ordem}. ${x(m.titulo)}</span><div style="display:flex;gap:6px"><button class="btn btn-sm btn-soft" onclick="Admin.addAula('${m.id}','${cursoId}')">+ Aula</button><button class="btn btn-sm btn-danger" onclick="Admin.delModulo('${m.id}','${cursoId}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>️</button></div></div>
          ${aulas.map(a=>`<div class="aula-row"><span class="badge ${tipoBadge(a.tipo)}">${a.tipo}</span><span>${x(a.titulo)}</span><span style="color:var(--t3);font-size:.76rem;margin-left:auto">${a.duracao||0}min</span><button class="btn btn-sm btn-danger" onclick="Admin.delAula('${a.id}','${m.id}','${cursoId}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>️</button></div>`).join('')}
        </div>`;
      }).join('') : '<p style="color:var(--t3);font-size:.82rem">Nenhum módulo.</p>'}`;
  }

  function addModulo(cursoId) { const t=prompt('Nome do módulo:'); if(!t)return; Storage.Modulos.criar({cursoId,titulo:t}); renderModulosEditor(cursoId); }
  function addAula(moduloId,cursoId) { const t=prompt('Título da aula:'); if(!t)return; const tipo=prompt('Tipo (video/texto/pdf/link):','video')||'video'; const url=prompt('URL:')||''; const dur=parseInt(prompt('Duração (min):','10'))||10; Storage.Aulas.criar({moduloId,titulo:t,tipo,conteudo:url,duracao:dur}); renderModulosEditor(cursoId); }
  function delModulo(mId,cId) { if(!confirm('Excluir módulo?'))return; Storage.Modulos.excluir(mId); renderModulosEditor(cId); }
  function delAula(aId,mId,cId) { Storage.Aulas.excluir(aId); renderModulosEditor(cId); }
  function duplicarCurso(id) { if(typeof Cursos!=='undefined'){Cursos.duplicarCurso(id);} else {const n=Storage.Cursos.duplicar(id);if(n){toast('Curso duplicado!','s');renders[pg]?.();}} }
  function excluirCurso(id) { if(typeof Cursos!=='undefined'){Cursos.excluirCurso(id);} else {if(!confirm('Excluir permanentemente?'))return;Storage.Cursos.excluir(id);toast('Excluído.','i');renders[pg]?.();} }

  /* ── Materiais ── */
  function materiais() {
    const cursos=Storage.Cursos.listar(), sel=q('#mat-curso-sel');
    sel.innerHTML='<option value="">Todos os cursos</option>'+cursos.map(c=>`<option value="${c.id}">${x(c.titulo)}</option>`).join('');
    sel.onchange=()=>renderMateriais(sel.value); renderMateriais('');
    q('#mat-upload-btn').onclick=()=>{ if(!sel.value){toast('Selecione um curso','e');return;} q('#mat-file-input').click(); };
    q('#mat-file-input').onchange=e=>{ const f=e.target.files[0]; if(!f)return; Storage.Materiais.criar({cursoId:sel.value,nome:f.name,tipo:f.type.includes('pdf')?'pdf':f.type.includes('video')?'video':'doc',tamanho:formatBytes(f.size),url:'#simulado'}); toast(`"${f.name}" adicionado!`,'s'); renderMateriais(sel.value); e.target.value=''; };
  }
  function renderMateriais(cursoId) {
    const lista=cursoId?Storage.Materiais.listarPorCurso(cursoId):Storage.Materiais.listar(), wrap=q('#mat-lista'), cursos=Storage.Cursos.listar();
    if(!lista.length){wrap.innerHTML=`<div class="empty"><div class="ei"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div><p>Nenhum material.</p></div>`;return;}
    wrap.innerHTML=`<table><thead><tr><th>Nome</th><th>Curso</th><th>Tipo</th><th>Tamanho</th><th>Adicionado</th><th></th></tr></thead><tbody>${lista.map(m=>{const c=cursos.find(c=>c.id===m.cursoId);return`<tr><td><strong>${x(m.nome)}</strong></td><td>${x(c?.titulo||'—')}</td><td>${badge(m.tipo,'badge-blue')}</td><td style="color:var(--t3)">${m.tamanho||'—'}</td><td style="color:var(--t3)">${fmtDate(m.criadoEm)}</td><td><button class="btn btn-sm btn-danger" onclick="Admin.delMaterial('${m.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>️</button></td></tr>`;}).join('')}</tbody></table>`;
  }
  function delMaterial(id) { Storage.Materiais.excluir(id); renderMateriais(q('#mat-curso-sel')?.value||''); toast('Material removido.','i'); }

  /* ── Acessos ── */
  function acessos() {
    const cursos=Storage.Cursos.listar(), sel=q('#ac-curso-sel');
    sel.innerHTML='<option value="">Selecione um curso</option>'+cursos.map(c=>`<option value="${c.id}">${x(c.titulo)}</option>`).join('');
    sel.onchange=()=>renderAcessos(sel.value); renderAcessos('');
  }
  function renderAcessos(cursoId) {
    const wrap=q('#ac-restricoes');
    if(!cursoId){wrap.innerHTML='<p style="color:var(--t3);font-size:.85rem">Selecione um curso acima.</p>';return;}
    const rest=Storage.Restricoes.porCurso(cursoId), set=Storage.Setores.listar(), eq=Storage.Equipes.listar(), al=Storage.Alunos.listar();
    const getNome=(tipo,id)=>tipo==='setor'?set.find(s=>s.id===id)?.nome:tipo==='equipe'?eq.find(e=>e.id===id)?.nome:al.find(a=>a.id===id)?.nome||id;
    wrap.innerHTML=`<div class="ac-header"><span style="font-size:.85rem;font-weight:600">Restrições ativas</span><div style="display:flex;gap:8px"><select id="ac-tipo" class="sel-sm"><option value="setor">Por Setor</option><option value="equipe">Por Equipe</option><option value="colaborador">Por Colaborador</option></select><select id="ac-ref" class="sel-sm"><option value="">Selecione</option></select><button class="btn btn-sm btn-primary" onclick="Admin.addRestricao('${cursoId}')">+ Adicionar</button></div></div>
      ${rest.length?`<div class="restricoes-lista">${rest.map(r=>`<div class="restricao-tag"><span class="badge ${r.tipo==='setor'?'badge-blue':r.tipo==='equipe'?'badge-green':'badge-amber'}">${r.tipo}</span>${x(getNome(r.tipo,r.refId))}<button onclick="Admin.remRestricao('${cursoId}','${r.tipo}','${r.refId}')" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:.9rem;padding:0 4px">×</button></div>`).join('')}</div>`:'<p style="color:var(--t3);font-size:.82rem;margin-top:8px">Sem restrições — curso visível para todos.</p>'}`;
    const ts=q('#ac-tipo'), rs=q('#ac-ref');
    const upd=()=>{ const opts=ts.value==='setor'?set:ts.value==='equipe'?eq:al; rs.innerHTML='<option value="">Selecione</option>'+opts.map(o=>`<option value="${o.id}">${x(o.nome)}</option>`).join(''); };
    ts.onchange=upd; upd();
  }
  function addRestricao(cId){ const tipo=q('#ac-tipo').value, refId=q('#ac-ref').value; if(!refId){toast('Selecione um item','e');return;} Storage.Restricoes.adicionar({cursoId:cId,tipo,refId}); toast('Restrição adicionada!','s'); renderAcessos(cId); }
  function remRestricao(cId,tipo,refId){ Storage.Restricoes.remover(cId,tipo,refId); renderAcessos(cId); }

  /* ── Colaboradores ── */
  function colaboradores() {
    renderColabList(); renderSetoresEquipes();
    q('#btn-novo-colab').onclick=()=>openModal('modal-colab');
    q('#btn-novo-setor').onclick=()=>{ const n=prompt('Nome do setor:'); if(!n)return; const cor=prompt('Cor hex:','#2F45FF')||'#2F45FF'; Storage.Setores.criar({nome:n,cor}); renderSetoresEquipes(); toast('Setor criado!','s'); };
    q('#btn-nova-equipe').onclick=()=>{ const set=Storage.Setores.listar(); if(!set.length){toast('Crie um setor primeiro','e');return;} const n=prompt('Nome da equipe:'); if(!n)return; const sId=prompt('ID do setor:')||set[0].id; Storage.Equipes.criar({nome:n,setorId:sId}); renderSetoresEquipes(); toast('Equipe criada!','s'); };
  }
  function renderColabList() {
    const lista=Storage.Alunos.listar(), set=Storage.Setores.listar(), eq=Storage.Equipes.listar(), tbody=q('#colab-tbody');
    if(!lista.length){tbody.innerHTML=tdEmpty(6,'Nenhum colaborador');return;}
    tbody.innerHTML=lista.map(a=>{const s=set.find(s=>s.id===a.setorId),e=eq.find(e=>e.id===a.equipeId),p=Storage.Progresso.listar().filter(p=>p.alunoId===a.id).length;return`<tr><td><strong>${x(a.nome)}</strong><br><span style="color:var(--t3);font-size:.76rem">${x(a.email)}</span></td><td>${s?`<span class="badge badge-blue">${x(s.nome)}</span>`:'—'}</td><td>${e?`<span class="badge badge-green">${x(e.nome)}</span>`:'—'}</td><td>${badge(a.ativo?'Ativo':'Inativo',a.ativo?'badge-green':'badge-red')}</td><td>${p} aulas</td><td><button class="btn btn-sm btn-ghost" onclick="Admin.toggleColab('${a.id}',${!a.ativo})">${a.ativo?'Desativar':'Ativar'}</button></td></tr>`;}).join('');
  }
  function renderSetoresEquipes() {
    const set=Storage.Setores.listar(), eq=Storage.Equipes.listar(), wrap=q('#setores-equipes');
    wrap.innerHTML=set.length?set.map(s=>{const eqs=eq.filter(e=>e.setorId===s.id),c=Storage.Alunos.porSetor(s.id).length;return`<div class="setor-card"><div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="width:10px;height:10px;border-radius:50%;background:${s.cor||'#2F45FF'}"></div><strong style="font-size:.9rem">${x(s.nome)}</strong><span style="color:var(--t3);font-size:.78rem;margin-left:auto">${c} colaboradores</span><button class="btn btn-sm btn-danger" onclick="Admin.delSetor('${s.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>️</button></div>${eqs.map(e=>`<div class="equipe-row"><span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> ${x(e.nome)}</span><span style="color:var(--t3);font-size:.76rem">${Storage.Alunos.porEquipe(e.id).length} membros</span><button class="btn btn-sm btn-danger" onclick="Admin.delEquipe('${e.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>️</button></div>`).join('')}${!eqs.length?'<p style="color:var(--t3);font-size:.78rem;padding:4px 0">Sem equipes</p>':''}</div>`;}).join(''):'<p style="color:var(--t3);font-size:.85rem">Nenhum setor cadastrado.</p>';
  }
  function toggleColab(id,ativo){ Storage.Alunos.atualizar(id,{ativo}); toast(ativo?'Ativado.':'Desativado.','i'); renderColabList(); }
  function delSetor(id){ if(!confirm('Excluir setor?'))return; Storage.Setores.excluir(id); renderSetoresEquipes(); }
  function delEquipe(id){ if(!confirm('Excluir equipe?'))return; Storage.Equipes.excluir(id); renderSetoresEquipes(); }

  /* ── Publicação ── */
  function publicacao() {
    const cursos=Storage.Cursos.listar(), wrap=q('#pub-lista'), agora=new Date();
    wrap.innerHTML=cursos.length?cursos.map(c=>{const aulas=Storage.Aulas.totalPorCurso(c.id),mods=Storage.Modulos.listarPorCurso(c.id).length,rest=Storage.Restricoes.porCurso(c.id).length,status=c.status||'rascunho',exp=c.validadeAte&&new Date(c.validadeAte)<agora,pronto=aulas>0&&mods>0;return`<div class="pub-card"><div class="pub-card-left"><div style="font-size:1.6rem">${c.emoji||'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'}</div><div><div style="font-weight:600;font-size:.92rem">${x(c.titulo)}</div><div style="color:var(--t3);font-size:.78rem;margin-top:2px">${mods} módulos · ${aulas} aulas · ${rest?rest+' restrição(ões)':'Acesso livre'}${c.validadeAte?' · Validade: '+fmtDate(c.validadeAte):''}</div></div></div><div class="pub-card-right">${statusBadge(status)}${exp?'<span class="badge badge-red">Expirado</span>':''}${!pronto&&status==='rascunho'?'<span class="badge badge-amber">Sem conteúdo</span>':''}${status==='rascunho'?`<button class="btn btn-sm btn-primary" onclick="Admin.publicar('${c.id}')" ${!pronto?'disabled':''}><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polygon points="5 3 19 12 5 21 5 3"/></svg> Publicar</button>`:status==='publicado'?`<button class="btn btn-sm btn-ghost" onclick="Admin.arquivar('${c.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Arquivar</button><button class="btn btn-sm btn-soft" onclick="Admin.publicar('${c.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3.04"/></svg> Republicar</button>`:`<button class="btn btn-sm btn-primary" onclick="Admin.publicar('${c.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polygon points="5 3 19 12 5 21 5 3"/></svg> Reativar</button>`}<button class="btn btn-sm btn-ghost" onclick="Admin.openValidade('${c.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Validade</button><button class="btn btn-sm btn-ghost" onclick="Admin.duplicarCurso('${c.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Duplicar</button></div></div>`;}).join(''):`<div class="empty"><div class="ei"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="M16 19h6"/><path d="M19 16v6"/></svg></div><p>Nenhum curso cadastrado.</p></div>`;
  }
  function publicar(id){ Storage.Cursos.publicar(id); toast('Publicado!','s'); renders[pg]?.(); }
  function arquivar(id){ Storage.Cursos.arquivar(id); toast('Arquivado.','i'); renders[pg]?.(); }
  function openValidade(cId){ const c=Storage.Cursos.obter(cId),v=prompt('Data de validade (AAAA-MM-DD):',c?.validadeAte?c.validadeAte.split('T')[0]:''); if(v===null)return; Storage.Cursos.atualizar(cId,{validadeAte:v?new Date(v).toISOString():null}); toast('Validade atualizada!','s'); renders[pg]?.(); }

  /* ── Modais ── */
  function bindModals() {
    document.querySelectorAll('.modal-bg').forEach(bg=>bg.addEventListener('click',e=>{if(e.target===bg)closeModals();}));
    document.querySelectorAll('.modal-close').forEach(b=>b.addEventListener('click',closeModals));
    q('#mc-form').onsubmit=e=>{e.preventDefault();const d={titulo:q('#mc-titulo').value.trim(),descricao:q('#mc-desc').value.trim(),emoji:q('#mc-emoji').value.trim()||'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',carga:parseInt(q('#mc-carga').value)||0,status:q('#mc-status').value||'rascunho',validadeAte:q('#mc-validade').value?new Date(q('#mc-validade').value).toISOString():null};if(!d.titulo)return;if(modal.ctx.cursoId){Storage.Cursos.atualizar(modal.ctx.cursoId,d);toast('Atualizado!','s');}else{const n=Storage.Cursos.criar(d);modal.ctx.cursoId=n.id;renderModulosEditor(n.id);toast('Criado!','s');}renderCursosList();};
    q('#colab-form').onsubmit=e=>{e.preventDefault();const d={nome:q('#colab-nome').value.trim(),email:q('#colab-email').value.trim(),senha:q('#colab-senha').value,setorId:q('#colab-setor').value||null,equipeId:q('#colab-equipe').value||null};const r=Storage.Alunos.criar(d);if(!r){toast('E-mail já cadastrado!','e');return;}toast('Colaborador cadastrado!','s');closeModals();e.target.reset();renderColabList();};
  }
  function openModal(id){ if(id==='modal-colab'){const s=Storage.Setores.listar(),e=Storage.Equipes.listar();q('#colab-setor').innerHTML='<option value="">— Setor —</option>'+s.map(s=>`<option value="${s.id}">${x(s.nome)}</option>`).join('');q('#colab-equipe').innerHTML='<option value="">— Equipe —</option>'+e.map(e=>`<option value="${e.id}">${x(e.nome)}</option>`).join('');} document.getElementById(id).classList.add('open'); }
  function closeModals(){ document.querySelectorAll('.modal-bg').forEach(el=>el.classList.remove('open')); }

  /* ── Helpers ── */
  function q(sel){ return document.querySelector(sel); }
  function x(s){ if(!s)return''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function fmtDate(iso){ if(!iso)return'—'; return new Date(iso).toLocaleDateString('pt-BR'); }
  function fmtDateShort(iso){ if(!iso)return'—'; const d=new Date(iso),diff=Math.floor((Date.now()-d)/60000); if(diff<1)return'Agora'; if(diff<60)return diff+'min'; if(diff<1440)return Math.floor(diff/60)+'h'; return d.toLocaleDateString('pt-BR',{day:'numeric',month:'short'}); }
  function formatBytes(b){ if(b<1024)return b+' B'; if(b<1048576)return(b/1024).toFixed(1)+' KB'; return(b/1048576).toFixed(1)+' MB'; }
  function badge(txt,cls){ return`<span class="badge ${cls}">${txt}</span>`; }
  function statusBadge(status){
    const cfg={publicado:{cls:'badge-green',label:'<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:currentColor;flex-shrink:0"></span> Publicado'},rascunho:{cls:'badge-amber',label:' Rascunho'},revisao:{cls:'badge-blue',label:'<span style="display:inline-block;width:7px;height:7px;border-radius:50%;border:1.5px solid currentColor;flex-shrink:0"></span> Revisão'},arquivado:{cls:'badge-gray',label:'<span style="display:inline-block;width:7px;height:7px;border-radius:1px;background:currentColor;opacity:.6;flex-shrink:0"></span> Arquivado'},expirado:{cls:'badge-red',label:'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Expirado'}};
    const s=cfg[status]||{cls:'badge-gray',label:status||'Indefinido'};
    return badge(s.label,s.cls);
  }
  function tipoBadge(tipo){ return{video:'badge-amber',texto:'badge-blue',pdf:'badge-red',link:'badge-green'}[tipo]||'badge-gray'; }
  function tdEmpty(cols,msg){ return`<tr><td colspan="${cols}" style="text-align:center;padding:28px;color:var(--t3)">${msg}</td></tr>`; }
  function toast(msg,tipo='i'){ const s=document.getElementById('toasts'),el=document.createElement('div');el.className=`toast ${tipo}`;el.innerHTML=`<span>${{s:'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>',e:'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',i:'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'}[tipo]||'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'}</span><span>${msg}</span>`;s.appendChild(el);setTimeout(()=>el.remove(),3000); }

  return { boot, go, goEdit, goAcessos, _toggleMenu, _closeMenus, openModalCurso, addModulo, addAula, delModulo, delAula, duplicarCurso, excluirCurso, delMaterial, addRestricao, remRestricao, toggleColab, delSetor, delEquipe, publicar, arquivar, openValidade };
})();

document.addEventListener('DOMContentLoaded', () => { Storage.seed(); Admin.boot(); });
