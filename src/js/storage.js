/**
 * storage.js — Camada de dados EAD Corporativo
 * Modelo estendido: Equipes, Setores, Materiais, Restrições, Publicação
 * Para migrar ao backend: substituir cada método por fetch() equivalente.
 */

var Storage = (() => {
  const K = {
    CURSOS:      'ead_cursos',
    MODULOS:     'ead_modulos',
    AULAS:       'ead_aulas',
    ALUNOS:      'ead_alunos',
    PROGRESSO:   'ead_progresso',
    ADMIN:       'ead_admin',
    SESSAO:      'ead_sessao',
    EQUIPES:     'ead_equipes',
    SETORES:     'ead_setores',
    MATERIAIS:   'ead_materiais',
    RESTRICOES:  'ead_restricoes',
  };

  const get = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const now = () => new Date().toISOString();

  /* ── Seed ── */
  function seed() {
    if (localStorage.getItem('ead_seeded_v2')) return;

    set(K.ADMIN, { email: 'admin@ead.com', senha: 'admin123' });

    // Setores
    const s1=uid(), s2=uid(), s3=uid();
    set(K.SETORES, [
      { id:s1, nome:'Tecnologia', cor:'#2F45FF' },
      { id:s2, nome:'Comercial',  cor:'#16A34A' },
      { id:s3, nome:'Operações',  cor:'#D97706' },
    ]);

    // Equipes
    const e1=uid(), e2=uid();
    set(K.EQUIPES, [
      { id:e1, nome:'Dev Frontend', setorId:s1 },
      { id:e2, nome:'Vendas SP',    setorId:s2 },
    ]);

    // Colaboradores (alunos)
    const al1=uid(), al2=uid(), al3=uid();
    set(K.ALUNOS, [
      { id:al1, nome:'Ana Beatriz Costa',   email:'ana@radar.com',    senha:'123456', ativo:true, equipeId:e1, setorId:s1, criadoEm:now() },
      { id:al2, nome:'Carlos Eduardo Lima', email:'carlos@radar.com',  senha:'123456', ativo:true, equipeId:e1, setorId:s1, criadoEm:now() },
      { id:al3, nome:'Mariana Souza',       email:'mariana@radar.com', senha:'123456', ativo:true, equipeId:e2, setorId:s2, criadoEm:now() },
    ]);

    // Cursos
    const c1=uid(), c2=uid();
    set(K.CURSOS, [
      { id:c1, titulo:'Fundamentos de JavaScript', descricao:'Variaveis, funcoes, DOM e Promises.', emoji:'⚡', carga:40, status:'publicado', validadeAte:null, criadoEm:now() },
      { id:c2, titulo:'Atendimento ao Cliente',    descricao:'Tecnicas de comunicacao e vendas.', emoji:'🤝', carga:8,  status:'rascunho',   validadeAte:null, criadoEm:now() },
    ]);

    // Módulos
    const m1=uid(), m2=uid();
    set(K.MODULOS, [
      { id:m1, cursoId:c1, titulo:'Introducao', ordem:1 },
      { id:m2, cursoId:c1, titulo:'Logica',     ordem:2 },
    ]);

    // Aulas
    const a1=uid(), a2=uid();
    set(K.AULAS, [
      { id:a1, moduloId:m1, titulo:'O que e JavaScript?', tipo:'video', conteudo:'https://www.youtube.com/embed/W6NZfCO5SIk', duracao:15, ordem:1 },
      { id:a2, moduloId:m2, titulo:'Variaveis e tipos',   tipo:'video', conteudo:'https://www.youtube.com/embed/9WIJQDvt4Us', duracao:20, ordem:1 },
    ]);

    // Materiais
    set(K.MATERIAIS, [
      { id:uid(), cursoId:c1, nome:'Apostila JS.pdf', tipo:'pdf', tamanho:'2.4 MB', url:'#', criadoEm:now() },
    ]);

    // Restrições (quem pode ver cada curso)
    set(K.RESTRICOES, [
      { cursoId:c1, tipo:'setor',   refId:s1 },
      { cursoId:c2, tipo:'equipe',  refId:e2 },
    ]);

    // Progresso
    set(K.PROGRESSO, [
      { alunoId:al1, aulaId:a1, concluidaEm:now() },
    ]);

    localStorage.setItem('ead_seeded_v2', '1');
  }

  /* ── Sessão ── */
  const Sessao = {
    salvar:   d  => localStorage.setItem(K.SESSAO, JSON.stringify({ ...d, inicio: now() })),
    obter:    ()  => { try { return JSON.parse(localStorage.getItem(K.SESSAO)); } catch { return null; } },
    encerrar: ()  => localStorage.removeItem(K.SESSAO),
  };

  /* ── Admin ── */
  const Admin = {
    auth: (e, s) => { const a = JSON.parse(localStorage.getItem(K.ADMIN)||'{}'); return a.email===e && a.senha===s; },
  };

  /* ── Setores ── */
  const Setores = {
    listar:    ()     => get(K.SETORES),
    obter:     id     => get(K.SETORES).find(s=>s.id===id)||null,
    criar:     d      => { const l=get(K.SETORES), n={id:uid(),...d}; l.push(n); set(K.SETORES,l); return n; },
    atualizar: (id,d) => set(K.SETORES, get(K.SETORES).map(s=>s.id===id?{...s,...d}:s)),
    excluir:   id     => set(K.SETORES, get(K.SETORES).filter(s=>s.id!==id)),
  };

  /* ── Equipes ── */
  const Equipes = {
    listar:          ()       => get(K.EQUIPES),
    listarPorSetor:  setorId  => get(K.EQUIPES).filter(e=>e.setorId===setorId),
    obter:           id       => get(K.EQUIPES).find(e=>e.id===id)||null,
    criar:     d      => { const l=get(K.EQUIPES), n={id:uid(),...d}; l.push(n); set(K.EQUIPES,l); return n; },
    atualizar: (id,d) => set(K.EQUIPES, get(K.EQUIPES).map(e=>e.id===id?{...e,...d}:e)),
    excluir:   id     => set(K.EQUIPES, get(K.EQUIPES).filter(e=>e.id!==id)),
  };

  /* ── Cursos ── */
  const Cursos = {
    listar:    ()     => get(K.CURSOS),
    obter:     id     => get(K.CURSOS).find(c=>c.id===id)||null,
    criar:     d      => { const l=get(K.CURSOS), n={id:uid(),criadoEm:now(),status:'rascunho',...d}; l.push(n); set(K.CURSOS,l); return n; },
    atualizar: (id,d) => set(K.CURSOS, get(K.CURSOS).map(c=>c.id===id?{...c,...d}:c)),
    excluir:   id     => {
      set(K.CURSOS, get(K.CURSOS).filter(c=>c.id!==id));
      Modulos.listarPorCurso(id).forEach(m=>Modulos.excluir(m.id));
      set(K.MATERIAIS,  get(K.MATERIAIS).filter(m=>m.cursoId!==id));
      set(K.RESTRICOES, get(K.RESTRICOES).filter(r=>r.cursoId!==id));
    },
    publicar:  id     => set(K.CURSOS, get(K.CURSOS).map(c=>c.id===id?{...c,status:'publicado',publicadoEm:now()}:c)),
    arquivar:  id     => set(K.CURSOS, get(K.CURSOS).map(c=>c.id===id?{...c,status:'arquivado'}:c)),
    duplicar:  id     => {
      const orig = Cursos.obter(id);
      if (!orig) return null;
      const novo = Cursos.criar({ ...orig, id:undefined, titulo:'[Cópia] '+orig.titulo, status:'rascunho', criadoEm:undefined });
      Modulos.listarPorCurso(id).forEach(m => {
        const nm = Modulos.criar({ ...m, id:undefined, cursoId:novo.id });
        Aulas.listarPorModulo(m.id).forEach(a => Aulas.criar({ ...a, id:undefined, moduloId:nm.id }));
      });
      return novo;
    },
  };

  /* ── Módulos ── */
  const Modulos = {
    listar:          ()      => get(K.MODULOS),
    listarPorCurso:  cursoId => get(K.MODULOS).filter(m=>m.cursoId===cursoId).sort((a,b)=>a.ordem-b.ordem),
    obter:           id      => get(K.MODULOS).find(m=>m.id===id)||null,
    criar:     d      => { const l=get(K.MODULOS), ord=l.filter(m=>m.cursoId===d.cursoId).length+1; const n={id:uid(),ordem:ord,criadoEm:now(),...d}; l.push(n); set(K.MODULOS,l); return n; },
    atualizar: (id,d) => set(K.MODULOS, get(K.MODULOS).map(m=>m.id===id?{...m,...d}:m)),
    excluir:   id     => { set(K.MODULOS, get(K.MODULOS).filter(m=>m.id!==id)); Aulas.listarPorModulo(id).forEach(a=>Aulas.excluir(a.id)); },
  };

  /* ── Aulas ── */
  const Aulas = {
    listar:          ()      => get(K.AULAS),
    listarPorModulo: modId   => get(K.AULAS).filter(a=>a.moduloId===modId).sort((a,b)=>a.ordem-b.ordem),
    obter:           id      => get(K.AULAS).find(a=>a.id===id)||null,
    criar:     d      => { const l=get(K.AULAS), ord=l.filter(a=>a.moduloId===d.moduloId).length+1; const n={id:uid(),ordem:ord,criadoEm:now(),...d}; l.push(n); set(K.AULAS,l); return n; },
    atualizar: (id,d) => set(K.AULAS, get(K.AULAS).map(a=>a.id===id?{...a,...d}:a)),
    excluir:   id     => { set(K.AULAS, get(K.AULAS).filter(a=>a.id!==id)); set(K.PROGRESSO, get(K.PROGRESSO).filter(p=>p.aulaId!==id)); },
    totalPorCurso: cursoId => { const mids=Modulos.listarPorCurso(cursoId).map(m=>m.id); return get(K.AULAS).filter(a=>mids.includes(a.moduloId)).length; },
  };

  /* ── Alunos / Colaboradores ── */
  const Alunos = {
    listar:    ()      => get(K.ALUNOS),
    obter:     id      => get(K.ALUNOS).find(a=>a.id===id)||null,
    porEmail:  email   => get(K.ALUNOS).find(a=>a.email===email.toLowerCase())||null,
    porSetor:  setorId => get(K.ALUNOS).filter(a=>a.setorId===setorId),
    porEquipe: equipeId=> get(K.ALUNOS).filter(a=>a.equipeId===equipeId),
    criar:     d       => { if (Alunos.porEmail(d.email)) return null; const l=get(K.ALUNOS), n={id:uid(),criadoEm:now(),ativo:true,...d,email:d.email.toLowerCase()}; l.push(n); set(K.ALUNOS,l); return n; },
    atualizar: (id,d)  => set(K.ALUNOS, get(K.ALUNOS).map(a=>a.id===id?{...a,...d}:a)),
    auth:      (email, senha) => { const a=Alunos.porEmail(email); return a&&a.senha===senha&&a.ativo?a:null; },
  };

  /* ── Materiais ── */
  const Materiais = {
    listar:          ()      => get(K.MATERIAIS),
    listarPorCurso:  cursoId => get(K.MATERIAIS).filter(m=>m.cursoId===cursoId),
    criar:     d      => { const l=get(K.MATERIAIS), n={id:uid(),criadoEm:now(),...d}; l.push(n); set(K.MATERIAIS,l); return n; },
    excluir:   id     => set(K.MATERIAIS, get(K.MATERIAIS).filter(m=>m.id!==id)),
  };

  /* ── Restrições ── */
  const Restricoes = {
    listar:          ()      => get(K.RESTRICOES),
    porCurso:        cursoId => get(K.RESTRICOES).filter(r=>r.cursoId===cursoId),
    adicionar: d      => { const l=get(K.RESTRICOES); if(!l.find(r=>r.cursoId===d.cursoId&&r.tipo===d.tipo&&r.refId===d.refId)) { l.push(d); set(K.RESTRICOES,l); } },
    remover:   (cursoId,tipo,refId) => set(K.RESTRICOES, get(K.RESTRICOES).filter(r=>!(r.cursoId===cursoId&&r.tipo===tipo&&r.refId===refId))),
    limpar:    cursoId => set(K.RESTRICOES, get(K.RESTRICOES).filter(r=>r.cursoId!==cursoId)),
  };

  /* ── Progresso ── */
  const Progresso = {
    listar:         ()               => get(K.PROGRESSO),
    concluidas:     alunoId          => get(K.PROGRESSO).filter(p=>p.alunoId===alunoId).map(p=>p.aulaId),
    isConcluida:    (alunoId,aulaId) => !!get(K.PROGRESSO).find(p=>p.alunoId===alunoId&&p.aulaId===aulaId),
    marcar:         (alunoId,aulaId) => { const l=get(K.PROGRESSO); if(!l.find(p=>p.alunoId===alunoId&&p.aulaId===aulaId)){l.push({alunoId,aulaId,concluidaEm:now()});set(K.PROGRESSO,l);} },
    desmarcar:      (alunoId,aulaId) => set(K.PROGRESSO, get(K.PROGRESSO).filter(p=>!(p.alunoId===alunoId&&p.aulaId===aulaId))),
    pctCurso:       (alunoId,cursoId) => { const total=Aulas.totalPorCurso(cursoId); if(!total)return 0; const mids=Modulos.listarPorCurso(cursoId).map(m=>m.id); const ids=get(K.AULAS).filter(a=>mids.includes(a.moduloId)).map(a=>a.id); const ok=Progresso.concluidas(alunoId).filter(id=>ids.includes(id)).length; return Math.round((ok/total)*100); },
    cursoConcluido: (alunoId,cursoId) => Progresso.pctCurso(alunoId,cursoId)===100,
  };

  return { seed, Sessao, Admin, Setores, Equipes, Cursos, Modulos, Aulas, Alunos, Materiais, Restricoes, Progresso };
})();
