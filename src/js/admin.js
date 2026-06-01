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
      'setores-equipes': 'Setores e Equipes',
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
    'setores-equipes': () => { if (typeof SetoresEquipesMod !== 'undefined') SetoresEquipesMod.init(); },
    // Módulos futuros — stub que mostra "em breve"
    turmas:         () => { if (typeof Turmas !== 'undefined') Turmas.init(); else emBreve('Turmas'); },
    avaliacoes:     () => { if (typeof Aval !== 'undefined') Aval.init(); else emBreve('Avaliações'); },
    relatorios:     () => emBreve('Relatórios'),
    certificados:   () => { if (typeof CertMod !== 'undefined') CertMod.init(); else emBreve('Certificados'); },
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
    if (!progs.length) { wrap.innerHTML = '<div style="color:var(--text3);font-size:.82rem;padding:8px 0">Nenhuma atividade ainda.</div>'; }
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
    if (!cursoId) { wrap.innerHTML = '<p style="color:var(--text3);font-size:.82rem">Salve o curso primeiro.</p>'; return; }
    const modulos = Storage.Modulos.listarPorCurso(cursoId);
    wrap.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><strong style="font-size:.85rem">Módulos e Aulas</strong><button class="btn btn-sm btn-soft" onclick="Admin.addModulo('${cursoId}')">+ Módulo</button></div>
      ${modulos.length ? modulos.map(m => {
        const aulas = Storage.Aulas.listarPorModulo(m.id);
        return `<div class="mod-bloco"><div class="mod-header"><span>${m.ordem}. ${x(m.titulo)}</span><div style="display:flex;gap:6px"><button class="btn btn-sm btn-soft" onclick="Admin.addAula('${m.id}','${cursoId}')">+ Aula</button><button class="btn btn-sm btn-danger" onclick="Admin.delModulo('${m.id}','${cursoId}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>️</button></div></div>
          ${aulas.map(a=>`<div class="aula-row"><span class="badge ${tipoBadge(a.tipo)}">${a.tipo}</span><span>${x(a.titulo)}</span><span style="color:var(--text3);font-size:.76rem;margin-left:auto">${a.duracao||0}min</span><button class="btn btn-sm btn-danger" onclick="Admin.delAula('${a.id}','${m.id}','${cursoId}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>️</button></div>`).join('')}
        </div>`;
      }).join('') : '<p style="color:var(--text3);font-size:.82rem">Nenhum módulo.</p>'}`;
  }

  function addModulo(cursoId) { const t=prompt('Nome do módulo:'); if(!t)return; Storage.Modulos.criar({cursoId,titulo:t}); renderModulosEditor(cursoId); }
  function addAula(moduloId,cursoId) { const t=prompt('Título da aula:'); if(!t)return; const tipo=prompt('Tipo (video/texto/pdf/link):','video')||'video'; const url=prompt('URL:')||''; const dur=parseInt(prompt('Duração (min):','10'))||10; Storage.Aulas.criar({moduloId,titulo:t,tipo,conteudo:url,duracao:dur}); renderModulosEditor(cursoId); }
  function delModulo(mId,cId) { if(!confirm('Excluir módulo?'))return; Storage.Modulos.excluir(mId); renderModulosEditor(cId); }
  function delAula(aId,mId,cId) { Storage.Aulas.excluir(aId); renderModulosEditor(cId); }
  function duplicarCurso(id) { if(typeof Cursos!=='undefined'){Cursos.duplicarCurso(id);} else {const n=Storage.Cursos.duplicar(id);if(n){toast('Curso duplicado!','s');renders[pg]?.();}} }
  function excluirCurso(id) { if(typeof Cursos!=='undefined'){Cursos.excluirCurso(id);} else {if(!confirm('Excluir permanentemente?'))return;Storage.Cursos.excluir(id);toast('Excluído.','i');renders[pg]?.();} }

  /* ── Materiais ── */
  function materiais() {
    if (typeof MatMod !== 'undefined') MatMod.init();
  }


  /* ── Acessos ── */
  function acessos() {
    if (typeof AcessosMod !== 'undefined') AcessosMod.init();
  }

  function addRestricao(cId){ if(typeof AcessosMod!=='undefined') AcessosMod.addRestricao(cId); }
  function remRestricao(cId,tipo,refId){ if(typeof AcessosMod!=='undefined') AcessosMod.remRestricao(cId,tipo,refId); }

  /* ── Colaboradores ── */
  function colaboradores() {
    if (typeof AlunosMod !== 'undefined') AlunosMod.init(); else { renderColabList(); renderSetoresEquipes(); q('#btn-novo-colab').onclick=()=>openModal('modal-colab'); }
  }
  function renderColabList() { if (typeof AlunosMod !== 'undefined') AlunosMod.renderColabList(); }
  function renderSetoresEquipes() { if (typeof AlunosMod !== 'undefined') AlunosMod.renderSetoresEquipes(); }
  function toggleColab(id,ativo){ if (typeof AlunosMod !== 'undefined') AlunosMod.toggleColab(id,ativo); else { Storage.Alunos.atualizar(id,{ativo}); toast(ativo?'Ativado.':'Desativado.','i'); } }
  function delSetor(id){ if(!confirm('Excluir setor?'))return; Storage.Setores.excluir(id); renderSetoresEquipes(); }
  function delEquipe(id){ if(!confirm('Excluir equipe?'))return; Storage.Equipes.excluir(id); renderSetoresEquipes(); }

  /* ── Publicação ── */
  function publicacao() {
    if (typeof PubMod !== 'undefined') PubMod.init();
  }
  function publicar(id){ if(typeof PubMod!=='undefined') PubMod.publicar_legado(id); else {Storage.Cursos.publicar(id); toast('Publicado!','s'); renders[pg]?.();} }
  function arquivar(id){ if(typeof PubMod!=='undefined') PubMod.arquivar_legado(id); else {Storage.Cursos.arquivar(id); toast('Arquivado.','i'); renders[pg]?.();} }
  function openValidade(cId){ if(typeof PubMod!=='undefined') PubMod.openValidade_legado(cId); else {const c=Storage.Cursos.obter(cId),v=prompt('Data:',c?.validadeAte?c.validadeAte.split('T')[0]:'');if(v===null)return;Storage.Cursos.atualizar(cId,{validadeAte:v?new Date(v).toISOString():null});toast('Validade atualizada!','s');renders[pg]?.();} }

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
  function badge(txt,cls){ return`<span class="badge ${cls}">${txt}</span>`; }
  function tipoBadge(tipo){ return{video:'badge-amber',texto:'badge-blue',pdf:'badge-red',link:'badge-green'}[tipo]||'badge-gray'; }
  function toast(msg,tipo='i'){ const s=document.getElementById('toasts'),el=document.createElement('div');el.className=`toast ${tipo}`;el.innerHTML=`<span>${{s:'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>',e:'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',i:'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'}[tipo]||'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'}</span><span>${msg}</span>`;s.appendChild(el);setTimeout(()=>el.remove(),3000); }

  function delMaterial(id) {
    if (typeof MatMod !== 'undefined') {
      MatMod.excluir(id);
    } else {
      Storage.Materiais.excluir(id);
      toast('Material removido.', 'i');
    }
  }

    return { boot, go, goEdit, goAcessos, _toggleMenu, _closeMenus, openModalCurso, addModulo, addAula, delModulo, delAula, duplicarCurso, excluirCurso, delMaterial, addRestricao, remRestricao, toggleColab, delSetor, delEquipe, publicar, arquivar, openValidade };
})();

document.addEventListener('DOMContentLoaded', () => { Storage.seed(); Admin.boot(); });
