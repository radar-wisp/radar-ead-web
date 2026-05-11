/**
 * storage.js — Camada de dados EAD
 * Abstração sobre localStorage. Substituir por fetch() para migrar ao backend.
 */

const Storage = (() => {
  const K = {
    CURSOS:    'ead_cursos',
    MODULOS:   'ead_modulos',
    AULAS:     'ead_aulas',
    ALUNOS:    'ead_alunos',
    PROGRESSO: 'ead_progresso',
    ADMIN:     'ead_admin',
    SESSAO:    'ead_sessao',
  };

  /* ── helpers ── */
  const get  = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
  const set  = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const now  = () => new Date().toISOString();

  /* ── seed com dados mockados ── */
  function seed() {
    if (localStorage.getItem('ead_seeded')) return;

    set(K.ADMIN, { email: 'admin@ead.com', senha: 'admin123' });

    const c1 = uid(), c2 = uid();
    set(K.CURSOS, [
      { id: c1, titulo: 'Fundamentos de JavaScript', descricao: 'Do zero ao avançado em JS moderno. Aprenda variáveis, funções, DOM, Promises e muito mais.', emoji: '⚡', carga: 40, criadoEm: now() },
      { id: c2, titulo: 'UI/UX Design Essencial',    descricao: 'Princípios de design, Figma, tipografia, cor e prototipagem para interfaces modernas.', emoji: '🎨', carga: 24, criadoEm: now() },
    ]);

    const m1 = uid(), m2 = uid(), m3 = uid(), m4 = uid();
    set(K.MODULOS, [
      { id: m1, cursoId: c1, titulo: 'Introdução e Setup',   ordem: 1 },
      { id: m2, cursoId: c1, titulo: 'Lógica e Estruturas',  ordem: 2 },
      { id: m3, cursoId: c2, titulo: 'Fundamentos de Design',ordem: 1 },
      { id: m4, cursoId: c2, titulo: 'Ferramentas Modernas', ordem: 2 },
    ]);

    const a1=uid(),a2=uid(),a3=uid(),a4=uid(),a5=uid(),a6=uid(),a7=uid(),a8=uid();
    set(K.AULAS, [
      {id:a1,moduloId:m1,titulo:'O que e JavaScript?',tipo:'video',conteudo:'https://www.youtube.com/embed/W6NZfCO5SIk',duracao:15,ordem:1},
      {id:a2,moduloId:m1,titulo:'Configurando o ambiente',tipo:'video',conteudo:'https://www.youtube.com/embed/i0MuaVA0cD4',duracao:10,ordem:2},
      {id:a3,moduloId:m2,titulo:'Variaveis: var, let e const',tipo:'video',conteudo:'https://www.youtube.com/embed/9WIJQDvt4Us',duracao:20,ordem:1},
      {id:a4,moduloId:m2,titulo:'Funcoes e Arrow Functions',tipo:'video',conteudo:'https://www.youtube.com/embed/FVmAZAbEHuo',duracao:18,ordem:2},
      {id:a5,moduloId:m3,titulo:'Os 10 principios de Dieter Rams',tipo:'video',conteudo:'https://www.youtube.com/embed/qclHMGBEsKM',duracao:12,ordem:1},
      {id:a6,moduloId:m3,titulo:'Teoria das cores na pratica',tipo:'video',conteudo:'https://www.youtube.com/embed/4GXcNEMoNpo',duracao:14,ordem:2},
      {id:a7,moduloId:m4,titulo:'Introducao ao Figma',tipo:'link',conteudo:'https://www.figma.com/resources/learn-design/',duracao:20,ordem:1},
      {id:a8,moduloId:m4,titulo:'Prototipagem interativa',tipo:'video',conteudo:'https://www.youtube.com/embed/A2_HzVqmRoI',duracao:16,ordem:2},
    ]);

    const al1=uid(), al2=uid();
    set(K.ALUNOS, [
      { id:al1, nome:'Ana Beatriz Costa',   email:'ana@aluno.com',   senha:'123456', ativo:true, criadoEm:now() },
      { id:al2, nome:'Carlos Eduardo Lima', email:'carlos@aluno.com', senha:'123456', ativo:true, criadoEm:now() },
    ]);

    // Ana concluiu as duas primeiras aulas de JS
    set(K.PROGRESSO, [
      { alunoId:al1, aulaId:a1, concluidaEm:now() },
      { alunoId:al1, aulaId:a2, concluidaEm:now() },
      { alunoId:al2, aulaId:a1, concluidaEm:now() },
    ]);

    localStorage.setItem('ead_seeded', '1');
  }

  /* ── Sessão ── */
  const Sessao = {
    salvar: d => localStorage.setItem(K.SESSAO, JSON.stringify({ ...d, inicio: now() })),
    obter:  ()  => { try { return JSON.parse(localStorage.getItem(K.SESSAO)); } catch { return null; } },
    encerrar: () => localStorage.removeItem(K.SESSAO),
  };

  /* ── Admin ── */
  const Admin = {
    auth: (e, s) => { const a = JSON.parse(localStorage.getItem(K.ADMIN)||'{}'); return a.email===e && a.senha===s; },
  };

  /* ── Cursos ── */
  const Cursos = {
    listar:  ()   => get(K.CURSOS),
    obter:   id   => get(K.CURSOS).find(c => c.id === id) || null,
    criar:   d    => { const l=get(K.CURSOS), n={id:uid(),criadoEm:now(),...d}; l.push(n); set(K.CURSOS,l); return n; },
    atualizar:(id,d)=> set(K.CURSOS, get(K.CURSOS).map(c=>c.id===id?{...c,...d}:c)),
    excluir: id   => {
      set(K.CURSOS, get(K.CURSOS).filter(c=>c.id!==id));
      Modulos.listarPorCurso(id).forEach(m=>Modulos.excluir(m.id));
    },
  };

  /* ── Módulos ── */
  const Modulos = {
    listar:         ()      => get(K.MODULOS),
    listarPorCurso: cursoId => get(K.MODULOS).filter(m=>m.cursoId===cursoId).sort((a,b)=>a.ordem-b.ordem),
    obter:          id      => get(K.MODULOS).find(m=>m.id===id)||null,
    criar: d => {
      const l=get(K.MODULOS), ord=l.filter(m=>m.cursoId===d.cursoId).length+1;
      const n={id:uid(),ordem:ord,criadoEm:now(),...d}; l.push(n); set(K.MODULOS,l); return n;
    },
    atualizar:(id,d)=> set(K.MODULOS, get(K.MODULOS).map(m=>m.id===id?{...m,...d}:m)),
    excluir: id => {
      set(K.MODULOS, get(K.MODULOS).filter(m=>m.id!==id));
      Aulas.listarPorModulo(id).forEach(a=>Aulas.excluir(a.id));
    },
  };

  /* ── Aulas ── */
  const Aulas = {
    listar:         ()       => get(K.AULAS),
    listarPorModulo: modId   => get(K.AULAS).filter(a=>a.moduloId===modId).sort((a,b)=>a.ordem-b.ordem),
    obter:          id       => get(K.AULAS).find(a=>a.id===id)||null,
    criar: d => {
      const l=get(K.AULAS), ord=l.filter(a=>a.moduloId===d.moduloId).length+1;
      const n={id:uid(),ordem:ord,criadoEm:now(),...d}; l.push(n); set(K.AULAS,l); return n;
    },
    atualizar:(id,d)=> set(K.AULAS, get(K.AULAS).map(a=>a.id===id?{...a,...d}:a)),
    excluir: id => {
      set(K.AULAS, get(K.AULAS).filter(a=>a.id!==id));
      set(K.PROGRESSO, get(K.PROGRESSO).filter(p=>p.aulaId!==id));
    },
    totalPorCurso: cursoId => {
      const mids = Modulos.listarPorCurso(cursoId).map(m=>m.id);
      return get(K.AULAS).filter(a=>mids.includes(a.moduloId)).length;
    },
  };

  /* ── Alunos ── */
  const Alunos = {
    listar:        ()    => get(K.ALUNOS),
    obter:         id    => get(K.ALUNOS).find(a=>a.id===id)||null,
    porEmail:      email => get(K.ALUNOS).find(a=>a.email===email.toLowerCase())||null,
    criar: d => {
      if (Alunos.porEmail(d.email)) return null;
      const l=get(K.ALUNOS), n={id:uid(),criadoEm:now(),ativo:true,...d,email:d.email.toLowerCase()};
      l.push(n); set(K.ALUNOS,l); return n;
    },
    auth: (email, senha) => {
      const a = Alunos.porEmail(email);
      return a && a.senha===senha && a.ativo ? a : null;
    },
  };

  /* ── Progresso ── */
  const Progresso = {
    listar:      ()             => get(K.PROGRESSO),
    concluidas:  alunoId        => get(K.PROGRESSO).filter(p=>p.alunoId===alunoId).map(p=>p.aulaId),
    isConcluida: (alunoId,aulaId) => !!get(K.PROGRESSO).find(p=>p.alunoId===alunoId&&p.aulaId===aulaId),
    marcar: (alunoId, aulaId) => {
      const l=get(K.PROGRESSO);
      if (!l.find(p=>p.alunoId===alunoId&&p.aulaId===aulaId)) {
        l.push({alunoId,aulaId,concluidaEm:now()}); set(K.PROGRESSO,l);
      }
    },
    desmarcar: (alunoId, aulaId) => set(K.PROGRESSO, get(K.PROGRESSO).filter(p=>!(p.alunoId===alunoId&&p.aulaId===aulaId))),
    pctCurso: (alunoId, cursoId) => {
      const total = Aulas.totalPorCurso(cursoId);
      if (!total) return 0;
      const mids = Modulos.listarPorCurso(cursoId).map(m=>m.id);
      const ids  = get(K.AULAS).filter(a=>mids.includes(a.moduloId)).map(a=>a.id);
      const ok   = Progresso.concluidas(alunoId).filter(id=>ids.includes(id)).length;
      return Math.round((ok/total)*100);
    },
    cursoConcluido: (alunoId, cursoId) => Progresso.pctCurso(alunoId, cursoId) === 100,
  };

  return { seed, Sessao, Admin, Cursos, Modulos, Aulas, Alunos, Progresso };
})();
