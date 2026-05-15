/**
 * @fileoverview storage.js — Camada de dados EAD Corporativo
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  ATENÇÃO AO DESENVOLVEDOR QUE VAI MIGRAR PARA BACKEND           ║
 * ║                                                                  ║
 * ║  Este é o ÚNICO arquivo que precisa ser substituído.             ║
 * ║  admin.js e aluno.js NÃO MUDAM.                                 ║
 * ║                                                                  ║
 * ║  Passos:                                                         ║
 * ║  1. Crie storage.api.js com fetch() seguindo os JSDoc abaixo    ║
 * ║  2. Torne todos os métodos async (retornam Promise)              ║
 * ║  3. Substitua storage.js por storage.api.js nos três HTMLs       ║
 * ║  4. Leia docs/ARCHITECTURE.md para schema SQL, endpoints e       ║
 * ║     checklist completo de migração                               ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * @module Storage
 * @version 1.0.0
 * @see docs/ARCHITECTURE.md
 */

var Storage = (() => {

  // ── Chaves localStorage (mapeiam 1:1 com tabelas do banco) ────────
  const K = {
    CURSOS:     'ead_cursos',      // → tabela: cursos
    MODULOS:    'ead_modulos',     // → tabela: modulos
    AULAS:      'ead_aulas',       // → tabela: aulas
    ALUNOS:     'ead_alunos',      // → tabela: colaboradores
    PROGRESSO:  'ead_progresso',   // → tabela: progresso
    ADMIN:      'ead_admin',       // → tabela: admins (ou variável de ambiente)
    SESSAO:     'ead_sessao',      // → JWT em httpOnly cookie na migração
    EQUIPES:    'ead_equipes',     // → tabela: equipes
    SETORES:    'ead_setores',     // → tabela: setores
    MATERIAIS:  'ead_materiais',   // → tabela: materiais
    RESTRICOES: 'ead_restricoes',  // → tabela: restricoes (PK composta)
    TURMAS:     'ead_turmas',      // → tabela: turmas
  };

  // ── Helpers internos (não expostos) ──────────────────────────────
  const get = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const now = () => new Date().toISOString();

  // ── SEED ─────────────────────────────────────────────────────────
  // Inicializa dados de demonstração.
  // MIGRAÇÃO: remover completamente. Substituir por script SQL de seed.
  function seed() {
    if (localStorage.getItem('ead_seeded_v2')) return;

    set(K.ADMIN, { email: 'admin@ead.com', senha: 'admin123' });

    const s1 = uid(), s2 = uid(), s3 = uid();
    set(K.SETORES, [
      { id: s1, nome: 'Tecnologia', cor: '#0002da' },
      { id: s2, nome: 'Comercial',  cor: '#08c49c' },
      { id: s3, nome: 'Operacoes',  cor: '#f59e0b' },
    ]);

    const e1 = uid(), e2 = uid();
    set(K.EQUIPES, [
      { id: e1, nome: 'Dev Frontend', setorId: s1 },
      { id: e2, nome: 'Vendas SP',    setorId: s2 },
    ]);

    // MIGRAÇÃO: senhas → bcrypt custo 12. NUNCA plain text em produção.
    const al1 = uid(), al2 = uid(), al3 = uid();
    set(K.ALUNOS, [
      { id: al1, nome: 'Ana Beatriz Costa',   email: 'ana@radar.com',    senha: '123456', ativo: true, equipeId: e1, setorId: s1, criadoEm: now() },
      { id: al2, nome: 'Carlos Eduardo Lima', email: 'carlos@radar.com',  senha: '123456', ativo: true, equipeId: e1, setorId: s1, criadoEm: now() },
      { id: al3, nome: 'Mariana Souza',       email: 'mariana@radar.com', senha: '123456', ativo: true, equipeId: e2, setorId: s2, criadoEm: now() },
    ]);

    const c1 = uid(), c2 = uid();
    set(K.CURSOS, [
      { id: c1, titulo: 'Fundamentos de JavaScript', descricao: 'Variaveis, funcoes, DOM e Promises.', carga: 40, status: 'publicado', validadeAte: null, publicadoEm: now(), criadoEm: now() },
      { id: c2, titulo: 'Atendimento ao Cliente',    descricao: 'Tecnicas de comunicacao e vendas.',   carga: 8,  status: 'rascunho',  validadeAte: null, publicadoEm: null,  criadoEm: now() },
    ]);

    const m1 = uid(), m2 = uid();
    set(K.MODULOS, [
      { id: m1, cursoId: c1, titulo: 'Introducao', descricao: '', ordem: 1, criadoEm: now() },
      { id: m2, cursoId: c1, titulo: 'Logica',     descricao: '', ordem: 2, criadoEm: now() },
    ]);

    const a1 = uid(), a2 = uid();
    set(K.AULAS, [
      { id: a1, moduloId: m1, titulo: 'O que e JavaScript?', tipo: 'video', conteudo: 'https://www.youtube.com/embed/W6NZfCO5SIk', duracao: 15, ordem: 1, criadoEm: now() },
      { id: a2, moduloId: m2, titulo: 'Variaveis e tipos',   tipo: 'video', conteudo: 'https://www.youtube.com/embed/9WIJQDvt4Us', duracao: 20, ordem: 1, criadoEm: now() },
    ]);

    // MIGRAÇÃO: url aponta para S3/CDN. Upload via multipart/form-data.
    set(K.MATERIAIS, [
      { id: uid(), cursoId: c1, nome: 'Apostila JS.pdf', tipo: 'pdf', tamanho: '2.4 MB', url: '#simulado', criadoEm: now() },
    ]);

    set(K.RESTRICOES, [
      { cursoId: c1, tipo: 'setor',  refId: s1 },
      { cursoId: c2, tipo: 'equipe', refId: e2 },
    ]);

    set(K.PROGRESSO, [
      { alunoId: al1, aulaId: a1, concluidaEm: now() },
    ]);


    // Turmas de demonstração
    const t1 = uid(), t2 = uid();
    const c1list = JSON.parse(localStorage.getItem('ead_cursos') || '[]');
    const c1id = c1list[0]?.id || '';
    set('ead_turmas', [
      {
        id: t1, nome: 'Turma Janeiro 2025', cursoId: c1id, descricao: 'Turma de início do ano',
        responsavel: 'Administrador', dataInicio: '2025-01-15T00:00:00.000Z',
        dataFim: '2025-03-15T00:00:00.000Z', limiteAlunos: 20,
        status: 'em_andamento', alunos: [],
        config: { acessoAutomatico: true, prazoConclucaoDias: 60, bloquearAposEncerramento: true, permitirEntradaAposInicio: true },
        criadoEm: now(),
      },
      {
        id: t2, nome: 'Turma Fevereiro 2025', cursoId: c1id, descricao: 'Segunda turma do trimestre',
        responsavel: 'Administrador', dataInicio: '2025-02-01T00:00:00.000Z',
        dataFim: '2025-04-01T00:00:00.000Z', limiteAlunos: 0,
        status: 'aberta', alunos: [],
        config: { acessoAutomatico: false, prazoConclucaoDias: 0, bloquearAposEncerramento: true, permitirEntradaAposInicio: false },
        criadoEm: now(),
      },
    ]);

        localStorage.setItem('ead_seeded_v2', '1');
  }

  // ════════════════════════════════════════════════════════════════
  // SESSAO
  // MIGRAÇÃO: salvar() → grava JWT em httpOnly cookie
  //           obter()  → decodifica claims do JWT
  //           encerrar() → POST /api/v1/auth/logout
  // ════════════════════════════════════════════════════════════════
  const Sessao = {
    /**
     * Persiste sessão do usuário autenticado.
     * @param {{ tipo: 'admin'|'aluno', id?: string, nome: string, email: string }} dados
     */
    salvar: dados => localStorage.setItem(K.SESSAO, JSON.stringify({ ...dados, inicio: now() })),

    /**
     * Retorna sessão ativa ou null.
     * @returns {{ tipo: string, id?: string, nome: string, email: string, inicio: string }|null}
     */
    obter: () => { try { return JSON.parse(localStorage.getItem(K.SESSAO)); } catch { return null; } },

    /** Encerra sessão. */
    encerrar: () => localStorage.removeItem(K.SESSAO),
  };

  // ════════════════════════════════════════════════════════════════
  // ADMIN AUTH
  // MIGRAÇÃO: POST /api/v1/auth/login { email, senha, tipo:'admin' }
  //           Verificar bcrypt.compare(senha, hash)
  //           Retornar JWT com role:'admin'
  // ════════════════════════════════════════════════════════════════
  const Admin = {
    /**
     * Autentica administrador.
     * @param {string} email
     * @param {string} senha
     * @returns {boolean}
     */
    auth: (email, senha) => {
      const a = JSON.parse(localStorage.getItem(K.ADMIN) || '{}');
      return a.email === email && a.senha === senha;
    },
  };

  // ════════════════════════════════════════════════════════════════
  // SETORES
  // MIGRAÇÃO: GET/POST/PUT/DELETE /api/v1/setores
  // ════════════════════════════════════════════════════════════════
  const Setores = {
    /** @returns {Array<{id:string, nome:string, cor:string}>} */
    listar: () => get(K.SETORES),

    /** @param {string} id @returns {{id,nome,cor}|null} */
    obter: id => get(K.SETORES).find(s => s.id === id) || null,

    /** @param {{nome:string, cor:string}} d @returns {{id,nome,cor}} */
    criar: d => { const l = get(K.SETORES), n = { id: uid(), ...d }; l.push(n); set(K.SETORES, l); return n; },

    /** @param {string} id @param {object} d */
    atualizar: (id, d) => set(K.SETORES, get(K.SETORES).map(s => s.id === id ? { ...s, ...d } : s)),

    /** @param {string} id */
    excluir: id => set(K.SETORES, get(K.SETORES).filter(s => s.id !== id)),
  };

  // ════════════════════════════════════════════════════════════════
  // EQUIPES
  // MIGRAÇÃO: GET/POST/PUT/DELETE /api/v1/equipes?setorId=
  // ════════════════════════════════════════════════════════════════
  const Equipes = {
    /** @returns {Array<{id,nome,setorId}>} */
    listar: () => get(K.EQUIPES),

    /** @param {string} setorId @returns {Array<{id,nome,setorId}>} */
    listarPorSetor: setorId => get(K.EQUIPES).filter(e => e.setorId === setorId),

    /** @param {string} id @returns {{id,nome,setorId}|null} */
    obter: id => get(K.EQUIPES).find(e => e.id === id) || null,

    /** @param {{nome:string, setorId:string}} d @returns {{id,nome,setorId}} */
    criar: d => { const l = get(K.EQUIPES), n = { id: uid(), ...d }; l.push(n); set(K.EQUIPES, l); return n; },

    /** @param {string} id @param {object} d */
    atualizar: (id, d) => set(K.EQUIPES, get(K.EQUIPES).map(e => e.id === id ? { ...e, ...d } : e)),

    /** @param {string} id */
    excluir: id => set(K.EQUIPES, get(K.EQUIPES).filter(e => e.id !== id)),
  };

  // ════════════════════════════════════════════════════════════════
  // CURSOS
  // MIGRAÇÃO:
  //   GET    /api/v1/cursos
  //   POST   /api/v1/cursos
  //   PUT    /api/v1/cursos/:id
  //   DELETE /api/v1/cursos/:id          (cascade no banco)
  //   POST   /api/v1/cursos/:id/publicar
  //   POST   /api/v1/cursos/:id/arquivar
  //   POST   /api/v1/cursos/:id/duplicar (transação no banco)
  // ════════════════════════════════════════════════════════════════
  const Cursos = {
    /** @returns {Array<Curso>} */
    listar: () => get(K.CURSOS),

    /** @param {string} id @returns {Curso|null} */
    obter: id => get(K.CURSOS).find(c => c.id === id) || null,

    /**
     * @param {Omit<Curso,'id'|'criadoEm'|'status'|'publicadoEm'>} d
     * @returns {Curso}
     */
    criar: d => {
      const l = get(K.CURSOS);
      const n = { id: uid(), criadoEm: now(), status: 'rascunho', publicadoEm: null, ...d };
      l.push(n); set(K.CURSOS, l); return n;
    },

    /** @param {string} id @param {Partial<Curso>} d */
    atualizar: (id, d) => set(K.CURSOS, get(K.CURSOS).map(c => c.id === id ? { ...c, ...d } : c)),

    /**
     * Remove curso + cascade: módulos, aulas, materiais, restrições.
     * MIGRAÇÃO: ON DELETE CASCADE no banco cuida disso automaticamente.
     * @param {string} id
     */
    excluir: id => {
      set(K.CURSOS, get(K.CURSOS).filter(c => c.id !== id));
      Modulos.listarPorCurso(id).forEach(m => Modulos.excluir(m.id));
      set(K.MATERIAIS,  get(K.MATERIAIS).filter(m => m.cursoId !== id));
      set(K.RESTRICOES, get(K.RESTRICOES).filter(r => r.cursoId !== id));
    },

    /** Define status='publicado' e seta publicadoEm. @param {string} id */
    publicar: id => set(K.CURSOS, get(K.CURSOS).map(c =>
      c.id === id ? { ...c, status: 'publicado', publicadoEm: now() } : c
    )),

    /** Define status='arquivado'. @param {string} id */
    arquivar: id => set(K.CURSOS, get(K.CURSOS).map(c =>
      c.id === id ? { ...c, status: 'arquivado' } : c
    )),

    /**
     * Duplica curso completo (curso + módulos + aulas). Novo = 'rascunho'.
     * MIGRAÇÃO: implementar como transação atômica no banco.
     * @param {string} id @returns {Curso|null}
     */
    duplicar: id => {
      const orig = Cursos.obter(id);
      if (!orig) return null;
      const novo = Cursos.criar({ ...orig, id: undefined, titulo: '[Cópia] ' + orig.titulo, criadoEm: undefined });
      Modulos.listarPorCurso(id).forEach(m => {
        const nm = Modulos.criar({ ...m, id: undefined, cursoId: novo.id });
        Aulas.listarPorModulo(m.id).forEach(a => Aulas.criar({ ...a, id: undefined, moduloId: nm.id }));
      });
      return novo;
    },
  };

  // ════════════════════════════════════════════════════════════════
  // MODULOS
  // MIGRAÇÃO: GET/POST/PUT/DELETE /api/v1/modulos?cursoId=
  // ════════════════════════════════════════════════════════════════
  const Modulos = {
    /** @returns {Array<Modulo>} */
    listar: () => get(K.MODULOS),

    /** Ordenado por .ordem ASC. @param {string} cursoId @returns {Array<Modulo>} */
    listarPorCurso: cursoId =>
      get(K.MODULOS).filter(m => m.cursoId === cursoId).sort((a, b) => a.ordem - b.ordem),

    /** @param {string} id @returns {Modulo|null} */
    obter: id => get(K.MODULOS).find(m => m.id === id) || null,

    /**
     * Ordem auto-incrementada dentro do curso.
     * @param {{cursoId:string, titulo:string, descricao?:string}} d
     * @returns {Modulo}
     */
    criar: d => {
      const l = get(K.MODULOS);
      const ordem = l.filter(m => m.cursoId === d.cursoId).length + 1;
      const n = { id: uid(), ordem, criadoEm: now(), descricao: '', ...d };
      l.push(n); set(K.MODULOS, l); return n;
    },

    /** @param {string} id @param {Partial<Modulo>} d */
    atualizar: (id, d) => set(K.MODULOS, get(K.MODULOS).map(m => m.id === id ? { ...m, ...d } : m)),

    /**
     * Remove módulo + cascade nas aulas.
     * @param {string} id
     */
    excluir: id => {
      set(K.MODULOS, get(K.MODULOS).filter(m => m.id !== id));
      Aulas.listarPorModulo(id).forEach(a => Aulas.excluir(a.id));
    },
  };

  // ════════════════════════════════════════════════════════════════
  // AULAS
  // MIGRAÇÃO: GET/POST/PUT/DELETE /api/v1/aulas?moduloId=
  // ════════════════════════════════════════════════════════════════
  const Aulas = {
    /** @returns {Array<Aula>} */
    listar: () => get(K.AULAS),

    /** Ordenado por .ordem ASC. @param {string} moduloId @returns {Array<Aula>} */
    listarPorModulo: moduloId =>
      get(K.AULAS).filter(a => a.moduloId === moduloId).sort((a, b) => a.ordem - b.ordem),

    /** @param {string} id @returns {Aula|null} */
    obter: id => get(K.AULAS).find(a => a.id === id) || null,

    /**
     * Ordem auto-incrementada dentro do módulo.
     * @param {{moduloId:string, titulo:string, tipo:string, conteudo:string, duracao:number}} d
     * @returns {Aula}
     */
    criar: d => {
      const l = get(K.AULAS);
      const ordem = l.filter(a => a.moduloId === d.moduloId).length + 1;
      const n = { id: uid(), ordem, criadoEm: now(), ...d };
      l.push(n); set(K.AULAS, l); return n;
    },

    /** @param {string} id @param {Partial<Aula>} d */
    atualizar: (id, d) => set(K.AULAS, get(K.AULAS).map(a => a.id === id ? { ...a, ...d } : a)),

    /**
     * Remove aula + limpa progresso associado.
     * @param {string} id
     */
    excluir: id => {
      set(K.AULAS,     get(K.AULAS).filter(a => a.id !== id));
      set(K.PROGRESSO, get(K.PROGRESSO).filter(p => p.aulaId !== id));
    },

    /**
     * Total de aulas em um curso (soma todos os módulos).
     * MIGRAÇÃO: SELECT COUNT(*) FROM aulas
     *   JOIN modulos ON aulas.modulo_id = modulos.id
     *   WHERE modulos.curso_id = $1
     * @param {string} cursoId @returns {number}
     */
    totalPorCurso: cursoId => {
      const mids = Modulos.listarPorCurso(cursoId).map(m => m.id);
      return get(K.AULAS).filter(a => mids.includes(a.moduloId)).length;
    },
  };

  // ════════════════════════════════════════════════════════════════
  // ALUNOS (Colaboradores)
  // MIGRAÇÃO:
  //   GET    /api/v1/colaboradores?setorId=&equipeId=
  //   POST   /api/v1/colaboradores
  //   PUT    /api/v1/colaboradores/:id
  //   POST   /api/v1/auth/login { email, senha, tipo:'aluno' }
  //          → bcrypt.compare() + retorna JWT
  // ════════════════════════════════════════════════════════════════
  const Alunos = {
    /** @returns {Array<Colaborador>} */
    listar: () => get(K.ALUNOS),

    /** @param {string} id @returns {Colaborador|null} */
    obter: id => get(K.ALUNOS).find(a => a.id === id) || null,

    /** @param {string} email @returns {Colaborador|null} */
    porEmail: email => get(K.ALUNOS).find(a => a.email === email.toLowerCase()) || null,

    /** @param {string} setorId @returns {Array<Colaborador>} */
    porSetor: setorId => get(K.ALUNOS).filter(a => a.setorId === setorId),

    /** @param {string} equipeId @returns {Array<Colaborador>} */
    porEquipe: equipeId => get(K.ALUNOS).filter(a => a.equipeId === equipeId),

    /**
     * Cria colaborador. Retorna null se email já existe (email é UNIQUE).
     * MIGRAÇÃO: tratar erro 409 Conflict do banco.
     * @param {{nome,email,senha,setorId?,equipeId?}} d
     * @returns {Colaborador|null}
     */
    criar: d => {
      if (Alunos.porEmail(d.email)) return null;
      const l = get(K.ALUNOS);
      const n = { id: uid(), criadoEm: now(), ativo: true, ...d, email: d.email.toLowerCase() };
      l.push(n); set(K.ALUNOS, l); return n;
    },

    /** @param {string} id @param {Partial<Colaborador>} d */
    atualizar: (id, d) => set(K.ALUNOS, get(K.ALUNOS).map(a => a.id === id ? { ...a, ...d } : a)),

    /**
     * Autentica colaborador. Null = credenciais inválidas ou conta inativa.
     * MIGRAÇÃO: bcrypt.compare(senha, colaborador.senha_hash)
     *           NUNCA comparar plain text em produção.
     * @param {string} email @param {string} senha
     * @returns {Colaborador|null}
     */
    auth: (email, senha) => {
      const a = Alunos.porEmail(email);
      return a && a.senha === senha && a.ativo ? a : null;
    },
  };

  // ════════════════════════════════════════════════════════════════
  // MATERIAIS
  // MIGRAÇÃO:
  //   GET    /api/v1/materiais?cursoId=
  //   POST   /api/v1/materiais  (multipart/form-data → upload S3/R2)
  //   DELETE /api/v1/materiais/:id  (+ excluir objeto do S3)
  // ════════════════════════════════════════════════════════════════
  const Materiais = {
    /** @returns {Array<Material>} */
    listar: () => get(K.MATERIAIS),

    /** @param {string} cursoId @returns {Array<Material>} */
    listarPorCurso: cursoId => get(K.MATERIAIS).filter(m => m.cursoId === cursoId),

    /** @param {{cursoId,nome,tipo,tamanho,url}} d @returns {Material} */
    criar: d => {
      const l = get(K.MATERIAIS), n = { id: uid(), criadoEm: now(), ...d };
      l.push(n); set(K.MATERIAIS, l); return n;
    },

    /** @param {string} id */
    excluir: id => set(K.MATERIAIS, get(K.MATERIAIS).filter(m => m.id !== id)),
  };

  // ════════════════════════════════════════════════════════════════
  // RESTRICOES DE ACESSO
  //
  // Regra: sem restrições = curso público para todos os colaboradores.
  //        com restrições = visível apenas para os grupos listados.
  //
  // MIGRAÇÃO:
  //   GET    /api/v1/restricoes?cursoId=
  //   POST   /api/v1/restricoes  { cursoId, tipo, refId }
  //   DELETE /api/v1/restricoes?cursoId=&tipo=&refId=
  //   PK composta no banco: (curso_id, tipo, ref_id) → sem duplicatas
  // ════════════════════════════════════════════════════════════════
  const Restricoes = {
    /** @returns {Array<Restricao>} */
    listar: () => get(K.RESTRICOES),

    /** @param {string} cursoId @returns {Array<Restricao>} */
    porCurso: cursoId => get(K.RESTRICOES).filter(r => r.cursoId === cursoId),

    /**
     * Adiciona restrição. Idempotente — não duplica.
     * MIGRAÇÃO: INSERT OR IGNORE / ON CONFLICT DO NOTHING
     * @param {{cursoId:string, tipo:string, refId:string}} d
     */
    adicionar: d => {
      const l = get(K.RESTRICOES);
      if (!l.find(r => r.cursoId === d.cursoId && r.tipo === d.tipo && r.refId === d.refId)) {
        l.push(d); set(K.RESTRICOES, l);
      }
    },

    /**
     * Remove restrição específica.
     * @param {string} cursoId @param {string} tipo @param {string} refId
     */
    remover: (cursoId, tipo, refId) => set(K.RESTRICOES,
      get(K.RESTRICOES).filter(r => !(r.cursoId === cursoId && r.tipo === tipo && r.refId === refId))
    ),

    /** Remove TODAS as restrições de um curso. @param {string} cursoId */
    limpar: cursoId => set(K.RESTRICOES, get(K.RESTRICOES).filter(r => r.cursoId !== cursoId)),
  };

  // ════════════════════════════════════════════════════════════════
  // PROGRESSO
  //
  // PK composta: (alunoId, aulaId) — sem duplicatas.
  //
  // MIGRAÇÃO:
  //   GET    /api/v1/progresso?alunoId=
  //   POST   /api/v1/progresso  { alunoId, aulaId }  (INSERT OR IGNORE)
  //   DELETE /api/v1/progresso  { alunoId, aulaId }
  //   GET    /api/v1/progresso/pct?alunoId=&cursoId=
  // ════════════════════════════════════════════════════════════════
  const Progresso = {
    /** @returns {Array<{alunoId,aulaId,concluidaEm}>} */
    listar: () => get(K.PROGRESSO),

    /**
     * IDs de aulas concluídas por um colaborador.
     * @param {string} alunoId @returns {string[]}
     */
    concluidas: alunoId => get(K.PROGRESSO).filter(p => p.alunoId === alunoId).map(p => p.aulaId),

    /** @param {string} alunoId @param {string} aulaId @returns {boolean} */
    isConcluida: (alunoId, aulaId) =>
      !!get(K.PROGRESSO).find(p => p.alunoId === alunoId && p.aulaId === aulaId),

    /**
     * Marca aula como concluída. Idempotente.
     * @param {string} alunoId @param {string} aulaId
     */
    marcar: (alunoId, aulaId) => {
      const l = get(K.PROGRESSO);
      if (!l.find(p => p.alunoId === alunoId && p.aulaId === aulaId)) {
        l.push({ alunoId, aulaId, concluidaEm: now() });
        set(K.PROGRESSO, l);
      }
    },

    /** @param {string} alunoId @param {string} aulaId */
    desmarcar: (alunoId, aulaId) => set(K.PROGRESSO,
      get(K.PROGRESSO).filter(p => !(p.alunoId === alunoId && p.aulaId === aulaId))
    ),

    /**
     * % de conclusão de um curso por um colaborador (0-100).
     * MIGRAÇÃO: query SQL com COUNT + subquery é mais eficiente.
     * @param {string} alunoId @param {string} cursoId @returns {number}
     */
    pctCurso: (alunoId, cursoId) => {
      const total = Aulas.totalPorCurso(cursoId);
      if (!total) return 0;
      const mids   = Modulos.listarPorCurso(cursoId).map(m => m.id);
      const aulaIds = get(K.AULAS).filter(a => mids.includes(a.moduloId)).map(a => a.id);
      const ok      = Progresso.concluidas(alunoId).filter(id => aulaIds.includes(id)).length;
      return Math.round((ok / total) * 100);
    },

    /** @param {string} alunoId @param {string} cursoId @returns {boolean} */
    cursoConcluido: (alunoId, cursoId) => Progresso.pctCurso(alunoId, cursoId) === 100,
  };


  // ════════════════════════════════════════════════════════════════
  // TURMAS
  // Conceito: Turma = grupo de alunos realizando um curso em período definido
  // MIGRAÇÃO:
  //   GET    /api/v1/turmas?cursoId=&status=
  //   POST   /api/v1/turmas
  //   PUT    /api/v1/turmas/:id
  //   DELETE /api/v1/turmas/:id
  //   POST   /api/v1/turmas/:id/encerrar
  //   POST   /api/v1/turmas/:id/alunos    { alunoId }
  //   DELETE /api/v1/turmas/:id/alunos/:alunoId
  // ════════════════════════════════════════════════════════════════

  /**
   * @typedef {Object} Turma
   * @property {string}   id
   * @property {string}   nome
   * @property {string}   cursoId        FK → Curso.id
   * @property {string}   descricao
   * @property {string}   responsavel    nome livre ou colaboradorId futuro
   * @property {string}   dataInicio     ISO 8601
   * @property {string}   dataFim        ISO 8601
   * @property {number}   limiteAlunos   0 = ilimitado
   * @property {'aberta'|'em_andamento'|'encerrada'|'cancelada'} status
   * @property {string[]} alunos         array de colaboradorIds
   * @property {Object}   config
   * @property {boolean}  config.acessoAutomatico
   * @property {number}   config.prazoConclucaoDias  0 = sem prazo
   * @property {boolean}  config.bloquearAposEncerramento
   * @property {boolean}  config.permitirEntradaAposInicio
   * @property {string}   criadoEm
   */

  const Turmas = {
    /** @returns {Turma[]} */
    listar: () => get(K.TURMAS),

    /** @param {string} id @returns {Turma|null} */
    obter: id => get(K.TURMAS).find(t => t.id === id) || null,

    /** @param {string} cursoId @returns {Turma[]} */
    porCurso: cursoId => get(K.TURMAS).filter(t => t.cursoId === cursoId),

    /** @param {string} status @returns {Turma[]} */
    porStatus: status => get(K.TURMAS).filter(t => t.status === status),

    /**
     * @param {Omit<Turma,'id'|'criadoEm'|'alunos'>} dados
     * @returns {Turma}
     */
    criar: dados => {
      const lista = get(K.TURMAS);
      const nova = {
        id: uid(), criadoEm: now(), alunos: [],
        status: 'aberta', limiteAlunos: 0,
        config: {
          acessoAutomatico: true,
          prazoConclucaoDias: 0,
          bloquearAposEncerramento: true,
          permitirEntradaAposInicio: true,
        },
        ...dados,
      };
      lista.push(nova);
      set(K.TURMAS, lista);
      return nova;
    },

    /** @param {string} id @param {Partial<Turma>} dados */
    atualizar: (id, dados) =>
      set(K.TURMAS, get(K.TURMAS).map(t => t.id === id ? { ...t, ...dados } : t)),

    /** @param {string} id */
    excluir: id => set(K.TURMAS, get(K.TURMAS).filter(t => t.id !== id)),

    /** Muda status para 'encerrada'. @param {string} id */
    encerrar: id =>
      set(K.TURMAS, get(K.TURMAS).map(t =>
        t.id === id ? { ...t, status: 'encerrada', dataFim: now() } : t
      )),

    /**
     * Adiciona aluno à turma. Idempotente.
     * @param {string} turmaId @param {string} alunoId
     * @returns {boolean} false se limite atingido
     */
    adicionarAluno: (turmaId, alunoId) => {
      const lista = get(K.TURMAS);
      const t = lista.find(x => x.id === turmaId);
      if (!t) return false;
      if (t.limiteAlunos > 0 && t.alunos.length >= t.limiteAlunos) return false;
      if (!t.alunos.includes(alunoId)) t.alunos.push(alunoId);
      set(K.TURMAS, lista);
      return true;
    },

    /** @param {string} turmaId @param {string} alunoId */
    removerAluno: (turmaId, alunoId) => {
      const lista = get(K.TURMAS);
      const t = lista.find(x => x.id === turmaId);
      if (t) { t.alunos = t.alunos.filter(id => id !== alunoId); set(K.TURMAS, lista); }
    },

    /** @param {string} turmaId @param {string[]} alunoIds */
    adicionarAlunos: (turmaId, alunoIds) => {
      const lista = get(K.TURMAS);
      const t = lista.find(x => x.id === turmaId);
      if (!t) return;
      alunoIds.forEach(id => { if (!t.alunos.includes(id)) t.alunos.push(id); });
      set(K.TURMAS, lista);
    },

    /** Limpa todos os alunos da turma. @param {string} turmaId */
    limparAlunos: turmaId => {
      const lista = get(K.TURMAS);
      const t = lista.find(x => x.id === turmaId);
      if (t) { t.alunos = []; set(K.TURMAS, lista); }
    },

    /**
     * Calcula progresso médio da turma no curso vinculado.
     * @param {string} turmaId @returns {number} 0-100
     */
    progresso: turmaId => {
      const t = get(K.TURMAS).find(x => x.id === turmaId);
      if (!t || !t.alunos.length) return 0;
      const total = t.alunos.reduce((acc, alunoId) => {
        return acc + Progresso.pctCurso(alunoId, t.cursoId);
      }, 0);
      return Math.round(total / t.alunos.length);
    },

    /**
     * @param {string} turmaId
     * @returns {{ concluidos: number, pendentes: number, pct: number }}
     */
    stats: turmaId => {
      const t = get(K.TURMAS).find(x => x.id === turmaId);
      if (!t) return { concluidos: 0, pendentes: 0, pct: 0 };
      const concluidos = t.alunos.filter(id =>
        Progresso.cursoConcluido(id, t.cursoId)
      ).length;
      return {
        concluidos,
        pendentes: t.alunos.length - concluidos,
        pct: t.alunos.length ? Math.round((concluidos / t.alunos.length) * 100) : 0,
      };
    },
  };

  // ── API PÚBLICA ───────────────────────────────────────────────────
  // Contrato imutável. admin.js e aluno.js dependem exatamente disto.
  // Qualquer implementação (localStorage, REST, GraphQL) deve
  // exportar este objeto com estes métodos e assinaturas.
  return {
    seed,        // ← REMOVER na migração para backend
    Sessao,
    Admin,
    Setores,
    Equipes,
    Cursos,
    Modulos,
    Aulas,
    Alunos,
    Materiais,
    Restricoes,
    Turmas,
    Progresso,
  };

})();
