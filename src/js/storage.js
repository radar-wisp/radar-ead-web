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
    CERTIFICADOS: 'ead_certificados', // → tabela: certificados
    MODELOS_CERT: 'ead_modelos_cert',  // → tabela: modelos_certificado
    LOG_ACESSOS: 'ead_log_acessos', // → tabela: log_acessos
    AVALIACOES: 'ead_avaliacoes', // → tabela: avaliacoes
    QUESTOES:   'ead_questoes',   // → tabela: questoes
    RESPOSTAS:  'ead_respostas',  // → tabela: respostas_aluno
    ATIVIDADES: 'ead_atividades', // → tabela: atividades_log
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
  /**
   * @typedef {Object} Colaborador
   * @property {string}   id
   * @property {string}   nome
   * @property {string}   email         lowercase, UNIQUE
   * @property {string}   senha         plain text → bcrypt na migração
   * @property {string}   matricula
   * @property {string}   telefone
   * @property {string}   cargo
   * @property {string}   unidade
   * @property {string}   setorId       FK → Setor.id
   * @property {string}   equipeId      FK → Equipe.id
   * @property {boolean}  ativo
   * @property {'ativo'|'bloqueado'|'inativo'|'pendente'} statusAcesso
   * @property {boolean}  primeiroAcesso
   * @property {string}   ultimoAcesso  ISO 8601
   * @property {string}   criadoEm     ISO 8601
   */

  const Alunos = {
    /** @returns {Colaborador[]} */
    listar: () => get(K.ALUNOS),

    /** @param {string} id @returns {Colaborador|null} */
    obter: id => get(K.ALUNOS).find(a => a.id === id) || null,

    /** @param {string} email @returns {Colaborador|null} */
    porEmail: email => get(K.ALUNOS).find(a => a.email === email.toLowerCase()) || null,

    /** @param {string} setorId @returns {Colaborador[]} */
    porSetor: setorId => get(K.ALUNOS).filter(a => a.setorId === setorId),

    /** @param {string} equipeId @returns {Colaborador[]} */
    porEquipe: equipeId => get(K.ALUNOS).filter(a => a.equipeId === equipeId),

    /**
     * Cria colaborador. Retorna null se email já existe.
     * @param {{nome,email,senha,setorId?,equipeId?,matricula?,cargo?,telefone?,unidade?}} d
     * @returns {Colaborador|null}
     */
    criar: d => {
      if (Alunos.porEmail(d.email)) return null;
      const l = get(K.ALUNOS);
      const n = {
        id: uid(), criadoEm: now(),
        ativo: true, statusAcesso: 'ativo',
        primeiroAcesso: true, ultimoAcesso: null,
        matricula: '', telefone: '', cargo: '', unidade: '',
        ...d,
        email: d.email.toLowerCase(),
      };
      l.push(n); set(K.ALUNOS, l); return n;
    },

    /** @param {string} id @param {Partial<Colaborador>} d */
    atualizar: (id, d) => set(K.ALUNOS, get(K.ALUNOS).map(a => a.id === id ? { ...a, ...d } : a)),

    /** Bloqueia aluno. @param {string} id */
    bloquear: id => set(K.ALUNOS, get(K.ALUNOS).map(a =>
      a.id === id ? { ...a, ativo: false, statusAcesso: 'bloqueado' } : a
    )),

    /** Ativa aluno. @param {string} id */
    ativar: id => set(K.ALUNOS, get(K.ALUNOS).map(a =>
      a.id === id ? { ...a, ativo: true, statusAcesso: 'ativo' } : a
    )),

    /** Reseta senha para '123456' (ambiente demo). @param {string} id */
    resetarSenha: id => set(K.ALUNOS, get(K.ALUNOS).map(a =>
      a.id === id ? { ...a, senha: '123456', primeiroAcesso: true } : a
    )),

    /** Registra último acesso. @param {string} id */
    registrarAcesso: id => set(K.ALUNOS, get(K.ALUNOS).map(a =>
      a.id === id ? { ...a, ultimoAcesso: now() } : a
    )),

    /**
     * Remove aluno permanentemente.
     * TODO MIGRAÇÃO: substituir por DELETE /api/v1/alunos/:id
     * @param {string} id
     */
    excluir: id => set(K.ALUNOS, get(K.ALUNOS).filter(a => a.id !== id)),

    /**
     * Stats globais de alunos.
     * @returns {{ total, ativos, bloqueados, inativos, pendentes, cursosAtivos, certificados }}
     */
    stats: () => {
      const lista = get(K.ALUNOS);
      return {
        total:       lista.length,
        ativos:      lista.filter(a => a.statusAcesso === 'ativo' || (a.ativo && !a.statusAcesso)).length,
        bloqueados:  lista.filter(a => a.statusAcesso === 'bloqueado' || (!a.ativo && a.statusAcesso !== 'inativo')).length,
        inativos:    lista.filter(a => a.statusAcesso === 'inativo').length,
        pendentes:   lista.filter(a => a.statusAcesso === 'pendente').length,
      };
    },

    /**
     * Autentica. Null = inválido ou inativo.
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

    /** @param {string} id @returns {Material|null} */
    obter: id => get(K.MATERIAIS).find(m => m.id === id) || null,

    /** @param {{cursoId,nome,tipo,tamanho,url}} d @returns {Material} */
    criar: d => {
      const l = get(K.MATERIAIS), n = { id: uid(), criadoEm: now(), status: 'ativo', ...d };
      l.push(n); set(K.MATERIAIS, l); return n;
    },

    /** @param {string} id @param {Partial<Material>} d */
    atualizar: (id, d) => set(K.MATERIAIS, get(K.MATERIAIS).map(m => m.id === id ? { ...m, ...d } : m)),

    /** @param {string} id */
    arquivar: id => set(K.MATERIAIS, get(K.MATERIAIS).map(m => m.id === id ? { ...m, status: 'arquivado' } : m)),

    /**
     * Vincula material a um curso adicional (cursosVinc[]).
     * @param {string} id @param {string} cursoId
     */
    vincular: (id, cursoId) => {
      const lista = get(K.MATERIAIS);
      const idx = lista.findIndex(m => m.id === id);
      if (idx === -1) return;
      const vinc = lista[idx].cursosVinc || [];
      if (!vinc.includes(cursoId)) vinc.push(cursoId);
      lista[idx] = { ...lista[idx], cursosVinc: vinc };
      set(K.MATERIAIS, lista);
    },

    /** @param {string} id */
    excluir: id => set(K.MATERIAIS, get(K.MATERIAIS).filter(m => m.id !== id)),

    /** @returns {{ total, pdf, video, ativos, arquivados }} */
    stats: () => {
      const lista = get(K.MATERIAIS);
      return {
        total:      lista.length,
        pdf:        lista.filter(m => m.tipo === 'pdf').length,
        video:      lista.filter(m => m.tipo === 'video').length,
        ativos:     lista.filter(m => (m.status || 'ativo') === 'ativo').length,
        arquivados: lista.filter(m => m.status === 'arquivado').length,
      };
    },
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
  /**
   * @typedef {Object} Restricao
   * @property {string} cursoId
   * @property {'setor'|'equipe'|'colaborador'} tipo
   * @property {string} refId
   * @property {string} dataInicio   ISO 8601 (opcional)
   * @property {string} dataExpira   ISO 8601 (opcional)
   * @property {number} prazo        dias para conclusão (0 = sem prazo)
   * @property {boolean} obrigatorio
   * @property {boolean} renovacaoAuto
   * @property {'ativo'|'expirado'|'bloqueado'|'pendente'} statusAcesso
   * @property {string} responsavel  nome de quem liberou
   * @property {string} criadoEm
   */

  const Restricoes = {
    /** @returns {Restricao[]} */
    listar: () => get(K.RESTRICOES),

    /** @param {string} cursoId @returns {Restricao[]} */
    porCurso: cursoId => get(K.RESTRICOES).filter(r => r.cursoId === cursoId),

    /** @param {string} refId @returns {Restricao[]} */
    porRef: refId => get(K.RESTRICOES).filter(r => r.refId === refId),

    /**
     * Adiciona restrição. Idempotente — não duplica.
     * MIGRAÇÃO: INSERT OR IGNORE / ON CONFLICT DO NOTHING
     * @param {{cursoId, tipo, refId, dataInicio?, dataExpira?, prazo?, obrigatorio?, renovacaoAuto?, responsavel?}} d
     */
    adicionar: d => {
      const lista = get(K.RESTRICOES);
      const idx = lista.findIndex(r =>
        r.cursoId === d.cursoId && r.tipo === d.tipo && r.refId === d.refId
      );
      const reg = {
        cursoId: d.cursoId, tipo: d.tipo, refId: d.refId,
        dataInicio:   d.dataInicio   || null,
        dataExpira:   d.dataExpira   || null,
        prazo:        d.prazo        || 0,
        obrigatorio:  d.obrigatorio  || false,
        renovacaoAuto:d.renovacaoAuto|| false,
        statusAcesso: d.statusAcesso || 'ativo',
        responsavel:  d.responsavel  || 'Admin',
        criadoEm:     d.criadoEm     || now(),
      };
      if (idx === -1) lista.push(reg);
      else lista[idx] = { ...lista[idx], ...reg };
      set(K.RESTRICOES, lista);
    },

    /** Atualiza campos de uma restrição existente. */
    atualizar: (cursoId, tipo, refId, dados) => {
      const lista = get(K.RESTRICOES);
      const idx = lista.findIndex(r => r.cursoId === cursoId && r.tipo === tipo && r.refId === refId);
      if (idx !== -1) { lista[idx] = { ...lista[idx], ...dados }; set(K.RESTRICOES, lista); }
    },

    /** @param {string} cursoId @param {string} tipo @param {string} refId */
    remover: (cursoId, tipo, refId) =>
      set(K.RESTRICOES, get(K.RESTRICOES).filter(r =>
        !(r.cursoId === cursoId && r.tipo === tipo && r.refId === refId)
      )),

    /** Remove TODAS as restrições de um curso. */
    limpar: cursoId =>
      set(K.RESTRICOES, get(K.RESTRICOES).filter(r => r.cursoId !== cursoId)),

    /** Verifica e atualiza status expirados. */
    sincronizarStatus: () => {
      const agora = new Date();
      const lista = get(K.RESTRICOES).map(r => {
        if (r.dataExpira && new Date(r.dataExpira) < agora && r.statusAcesso === 'ativo') {
          return { ...r, statusAcesso: 'expirado' };
        }
        return r;
      });
      set(K.RESTRICOES, lista);
    },

    /** Stats globais de acessos. */
    stats: () => {
      const lista = get(K.RESTRICOES);
      const agora = new Date();
      return {
        total:    lista.length,
        ativos:   lista.filter(r => r.statusAcesso === 'ativo' || !r.statusAcesso).length,
        expirados:lista.filter(r => r.statusAcesso === 'expirado' ||
          (r.dataExpira && new Date(r.dataExpira) < agora)).length,
        bloqueados:lista.filter(r => r.statusAcesso === 'bloqueado').length,
        pendentes: lista.filter(r => r.statusAcesso === 'pendente').length,
        cursos:   [...new Set(lista.map(r => r.cursoId))].length,
      };
    },
  };

  /* ── Log de Acessos ──────────────────────────────────────────
     Histórico de liberações, revogações e bloqueios.
     MIGRAÇÃO: tabela log_acessos (append-only, nunca editar)
  ────────────────────────────────────────────────────────────── */
  const LogAcessos = {
    listar: () => get(K.LOG_ACESSOS),

    /**
     * @param {{ acao, cursoId?, alunoId?, tipo?, refId?, responsavel?, obs? }} d
     */
    registrar: d => {
      const lista = get(K.LOG_ACESSOS);
      lista.unshift({ id: uid(), ts: now(), ...d });
      set(K.LOG_ACESSOS, lista.slice(0, 200)); // mantém últimos 200
    },

    /** @param {string} cursoId @returns {Object[]} */
    porCurso: cursoId => get(K.LOG_ACESSOS).filter(l => l.cursoId === cursoId),

    /** @param {string} alunoId @returns {Object[]} */
    porAluno: alunoId => get(K.LOG_ACESSOS).filter(l => l.alunoId === alunoId),
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


  // ════════════════════════════════════════════════════════════════
  // AVALIAÇÕES — Módulo completo
  // Tabelas: avaliacoes, questoes, respostas_aluno
  // MIGRAÇÃO: GET/POST/PUT/DELETE /api/v1/avaliacoes
  // ════════════════════════════════════════════════════════════════

  /**
   * @typedef {Object} Avaliacao
   * @property {string}   id
   * @property {string}   nome
   * @property {string}   descricao
   * @property {string}   cursoId        FK → Curso.id
   * @property {string}   moduloId       FK → Modulo.id (opcional)
   * @property {string}   turmaId        FK → Turma.id  (opcional)
   * @property {number}   notaMinima     0-100
   * @property {number}   tempoLimite    minutos (0 = sem limite)
   * @property {number}   tentativas     0 = ilimitado
   * @property {boolean}  resultadoImediato
   * @property {boolean}  ordemAleatoria
   * @property {boolean}  correcaoAutomatica
   * @property {'rascunho'|'publicada'|'encerrada'|'arquivada'} status
   * @property {string}   criadoEm
   */

  /**
   * @typedef {Object} Questao
   * @property {string}   id
   * @property {string}   avaliacaoId    FK → Avaliacao.id
   * @property {'multipla'|'vf'|'unica'|'descritiva'} tipo
   * @property {string}   pergunta
   * @property {string[]} alternativas   apenas para multipla/unica
   * @property {string}   correta        índice (string) ou 'V'/'F'
   * @property {number}   pontos
   * @property {string}   feedback
   * @property {string}   categoria
   * @property {number}   ordem
   */

  /**
   * @typedef {Object} RespostaAluno
   * @property {string}   id
   * @property {string}   avaliacaoId
   * @property {string}   alunoId
   * @property {Object}   respostas      { questaoId: resposta }
   * @property {number}   nota           0-100
   * @property {boolean}  aprovado
   * @property {number}   tentativa      número da tentativa (1-based)
   * @property {number}   tempoUsado     segundos
   * @property {string}   iniciadoEm
   * @property {string}   concluidoEm
   */

  const Avaliacoes = {
    /** @returns {Avaliacao[]} */
    listar: () => get(K.AVALIACOES),

    /** @param {string} id @returns {Avaliacao|null} */
    obter: id => get(K.AVALIACOES).find(a => a.id === id) || null,

    /** @param {string} cursoId @returns {Avaliacao[]} */
    porCurso: cursoId => get(K.AVALIACOES).filter(a => a.cursoId === cursoId),

    /**
     * @param {Omit<Avaliacao,'id'|'criadoEm'|'status'>} d
     * @returns {Avaliacao}
     */
    criar: d => {
      const lista = get(K.AVALIACOES);
      const nova = {
        id: uid(), criadoEm: now(), status: 'rascunho',
        notaMinima: 70, tempoLimite: 0, tentativas: 1,
        resultadoImediato: true, ordemAleatoria: false, correcaoAutomatica: true,
        ...d,
      };
      lista.push(nova); set(K.AVALIACOES, lista); return nova;
    },

    /** @param {string} id @param {Partial<Avaliacao>} d */
    atualizar: (id, d) =>
      set(K.AVALIACOES, get(K.AVALIACOES).map(a => a.id === id ? { ...a, ...d } : a)),

    /** @param {string} id */
    excluir: id => {
      set(K.AVALIACOES, get(K.AVALIACOES).filter(a => a.id !== id));
      set(K.QUESTOES,   get(K.QUESTOES).filter(q => q.avaliacaoId !== id));
      set(K.RESPOSTAS,  get(K.RESPOSTAS).filter(r => r.avaliacaoId !== id));
    },

    publicar:  id => set(K.AVALIACOES, get(K.AVALIACOES).map(a => a.id === id ? { ...a, status: 'publicada'  } : a)),
    encerrar:  id => set(K.AVALIACOES, get(K.AVALIACOES).map(a => a.id === id ? { ...a, status: 'encerrada'  } : a)),
    arquivar:  id => set(K.AVALIACOES, get(K.AVALIACOES).map(a => a.id === id ? { ...a, status: 'arquivada'  } : a)),

    /**
     * Duplica avaliação + questões. Nova fica como rascunho.
     * @param {string} id @returns {Avaliacao}
     */
    duplicar: id => {
      const orig = Avaliacoes.obter(id);
      if (!orig) return null;
      const nova = Avaliacoes.criar({ ...orig, id: undefined, nome: '[Cópia] ' + orig.nome, criadoEm: undefined });
      Questoes.porAvaliacao(id).forEach(q =>
        Questoes.criar({ ...q, id: undefined, avaliacaoId: nova.id })
      );
      return nova;
    },

    /** Stats globais @returns {Object} */
    stats: () => {
      const lista = get(K.AVALIACOES);
      const respostas = get(K.RESPOSTAS);
      const notas = respostas.map(r => r.nota).filter(n => n != null);
      return {
        total:      lista.length,
        publicadas: lista.filter(a => a.status === 'publicada').length,
        rascunhos:  lista.filter(a => a.status === 'rascunho').length,
        encerradas: lista.filter(a => a.status === 'encerrada').length,
        media:      notas.length ? Math.round(notas.reduce((s,n)=>s+n,0)/notas.length) : 0,
        aprovados:  respostas.filter(r => r.aprovado).length,
        total_resp: respostas.length,
        taxa:       respostas.length ? Math.round(respostas.filter(r=>r.aprovado).length/respostas.length*100) : 0,
      };
    },
  };

  const Questoes = {
    /** @returns {Questao[]} */
    listar: () => get(K.QUESTOES),

    /** @param {string} id @returns {Questao|null} */
    obter: id => get(K.QUESTOES).find(q => q.id === id) || null,

    /** @param {string} avaliacaoId @returns {Questao[]} ordenado por ordem */
    porAvaliacao: avaliacaoId =>
      get(K.QUESTOES).filter(q => q.avaliacaoId === avaliacaoId).sort((a,b) => a.ordem - b.ordem),

    /** @param {Omit<Questao,'id'>} d @returns {Questao} */
    criar: d => {
      const lista = get(K.QUESTOES);
      const ordem = lista.filter(q => q.avaliacaoId === d.avaliacaoId).length + 1;
      const nova = { id: uid(), ordem, pontos: 10, feedback: '', categoria: '', alternativas: [], ...d };
      lista.push(nova); set(K.QUESTOES, lista); return nova;
    },

    /** @param {string} id @param {Partial<Questao>} d */
    atualizar: (id, d) =>
      set(K.QUESTOES, get(K.QUESTOES).map(q => q.id === id ? { ...q, ...d } : q)),

    /** @param {string} id */
    excluir: id => set(K.QUESTOES, get(K.QUESTOES).filter(q => q.id !== id)),
  };

  const Respostas = {
    /** @returns {RespostaAluno[]} */
    listar: () => get(K.RESPOSTAS),

    /** @param {string} avaliacaoId @returns {RespostaAluno[]} */
    porAvaliacao: avaliacaoId => get(K.RESPOSTAS).filter(r => r.avaliacaoId === avaliacaoId),

    /** @param {string} alunoId @param {string} avaliacaoId @returns {RespostaAluno[]} */
    porAluno: (alunoId, avaliacaoId) =>
      get(K.RESPOSTAS).filter(r => r.alunoId === alunoId && r.avaliacaoId === avaliacaoId),

    /** Quantas tentativas o aluno já fez. @param {string} alunoId @param {string} avaliacaoId @returns {number} */
    tentativas: (alunoId, avaliacaoId) =>
      get(K.RESPOSTAS).filter(r => r.alunoId === alunoId && r.avaliacaoId === avaliacaoId).length,

    /**
     * Registra resposta e calcula nota automaticamente.
     * @param {string} avaliacaoId @param {string} alunoId @param {Object} respostas
     * @returns {RespostaAluno}
     */
    registrar: (avaliacaoId, alunoId, respostas, tempoUsado = 0) => {
      const av      = Avaliacoes.obter(avaliacaoId);
      const questoes = Questoes.porAvaliacao(avaliacaoId);
      const tentativa = Respostas.tentativas(alunoId, avaliacaoId) + 1;

      // Calcula nota
      let pontos = 0, total = 0;
      questoes.forEach(q => {
        total += q.pontos;
        if (q.tipo !== 'descritiva' && respostas[q.id] !== undefined) {
          if (String(respostas[q.id]) === String(q.correta)) pontos += q.pontos;
        }
      });
      const nota = total > 0 ? Math.round((pontos / total) * 100) : 0;

      const resp = {
        id: uid(), avaliacaoId, alunoId, respostas,
        nota, aprovado: nota >= (av?.notaMinima || 70),
        tentativa, tempoUsado,
        iniciadoEm: now(), concluidoEm: now(),
      };
      const lista = get(K.RESPOSTAS);
      lista.push(resp); set(K.RESPOSTAS, lista);
      return resp;
    },

    /** Stats de uma avaliação @param {string} avaliacaoId */
    statsAvaliacao: avaliacaoId => {
      const lista = get(K.RESPOSTAS).filter(r => r.avaliacaoId === avaliacaoId);
      const notas = lista.map(r => r.nota);
      const av = Avaliacoes.obter(avaliacaoId);
      const aprovados = lista.filter(r => r.aprovado).length;
      return {
        participantes: [...new Set(lista.map(r => r.alunoId))].length,
        tentativas:    lista.length,
        aprovados,
        reprovados:    lista.length - aprovados,
        media:         notas.length ? Math.round(notas.reduce((s,n)=>s+n,0)/notas.length) : 0,
        taxa:          lista.length ? Math.round(aprovados/lista.length*100) : 0,
      };
    },
  };


  // ════════════════════════════════════════════════════════════════
  // CERTIFICADOS
  // MIGRAÇÃO: GET/POST/PUT/DELETE /api/v1/certificados
  //           GET /api/v1/certificados/validar/:codigo
  // ════════════════════════════════════════════════════════════════

  /**
   * @typedef {Object} Certificado
   * @property {string}  id
   * @property {string}  codigo          único, para validação pública
   * @property {string}  alunoId         FK → Colaborador.id
   * @property {string}  cursoId         FK → Curso.id
   * @property {string}  turmaId         FK → Turma.id (opcional)
   * @property {string}  modeloId        FK → ModeloCert.id
   * @property {number}  cargaHoraria
   * @property {number}  nota            0-100 (da avaliação, se houver)
   * @property {string}  dataConclucao   ISO 8601
   * @property {string}  dataEmissao     ISO 8601
   * @property {string}  dataValidade    ISO 8601 (null = sem validade)
   * @property {'emitido'|'pendente'|'expirado'|'cancelado'} status
   * @property {string}  responsavel
   * @property {string}  obs
   * @property {string}  criadoEm
   */

  /**
   * @typedef {Object} ModeloCert
   * @property {string}  id
   * @property {string}  nome
   * @property {string}  corPrimaria     hex
   * @property {string}  logoTexto       texto do logo (ex: "Radar Internet")
   * @property {string}  subtitulo       ex: "Plataforma EAD"
   * @property {string}  assinatura1     nome do assinante 1
   * @property {string}  cargo1
   * @property {string}  assinatura2     nome do assinante 2
   * @property {string}  cargo2
   * @property {string}  textoRodape
   * @property {boolean} ativo
   * @property {string}  criadoEm
   */

  const Certificados = {
    /** @returns {Certificado[]} */
    listar: () => get(K.CERTIFICADOS),

    /** @param {string} id @returns {Certificado|null} */
    obter: id => get(K.CERTIFICADOS).find(c => c.id === id) || null,

    /** @param {string} codigo @returns {Certificado|null} */
    porCodigo: codigo => get(K.CERTIFICADOS).find(c => c.codigo === codigo) || null,

    /** @param {string} alunoId @returns {Certificado[]} */
    porAluno: alunoId => get(K.CERTIFICADOS).filter(c => c.alunoId === alunoId),

    /** @param {string} cursoId @returns {Certificado[]} */
    porCurso: cursoId => get(K.CERTIFICADOS).filter(c => c.cursoId === cursoId),

    /** Gera código único alfanumérico. */
    _gerarCodigo: () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let cod = 'CERT-';
      for (let i = 0; i < 12; i++) {
        if (i === 4 || i === 8) cod += '-';
        cod += chars[Math.floor(Math.random() * chars.length)];
      }
      return cod;
    },

    /**
     * Emite um certificado. Verifica se já existe (idempotente).
     * @param {Omit<Certificado,'id'|'codigo'|'criadoEm'|'status'>} d
     * @returns {Certificado}
     */
    emitir: d => {
      // Verifica duplicata
      const exist = get(K.CERTIFICADOS).find(c =>
        c.alunoId === d.alunoId && c.cursoId === d.cursoId &&
        c.status !== 'cancelado'
      );
      if (exist) return exist;

      const lista = get(K.CERTIFICADOS);
      const cert = {
        id: uid(), codigo: Certificados._gerarCodigo(), criadoEm: now(),
        status: 'emitido', dataEmissao: now(),
        nota: 0, obs: '', responsavel: 'Admin',
        modeloId: Certificados.modeloPadrao()?.id || '',
        ...d,
      };
      lista.push(cert); set(K.CERTIFICADOS, lista); return cert;
    },

    /** Emite certificados em lote para todos os alunos elegíveis de um curso. */
    emitirLote: (cursoId, config) => {
      const curso  = Cursos.obter(cursoId); if (!curso) return [];
      const alunos = Alunos.listar().filter(a => a.ativo);
      const emitidos = [];
      alunos.forEach(al => {
        const pct = Progresso.pctCurso(al.id, cursoId);
        if (pct < (config?.progressoMinimo || 100)) return;
        // Verifica nota mínima se exigido
        if (config?.notaMinima) {
          const avs = Avaliacoes.porCurso(cursoId);
          if (avs.length) {
            const melhorNota = avs.reduce((max, av) => {
              const resps = Respostas.porAluno(al.id, av.id);
              const nota  = resps.length ? Math.max(...resps.map(r => r.nota)) : 0;
              return Math.max(max, nota);
            }, 0);
            if (melhorNota < config.notaMinima) return;
          }
        }
        const cert = Certificados.emitir({
          alunoId: al.id, cursoId,
          cargaHoraria: curso.carga || 0,
          dataConclucao: now(),
          dataValidade: config?.validadeDias
            ? new Date(Date.now() + config.validadeDias * 86400000).toISOString()
            : null,
          responsavel: config?.responsavel || 'Admin',
          ...(config?.modeloId && { modeloId: config.modeloId }),
        });
        emitidos.push(cert);
      });
      return emitidos;
    },

    /** @param {string} id @param {Partial<Certificado>} d */
    atualizar: (id, d) =>
      set(K.CERTIFICADOS, get(K.CERTIFICADOS).map(c => c.id === id ? { ...c, ...d } : c)),

    /** Reemite: gera novo código, atualiza data. @param {string} id @returns {Certificado} */
    reemitir: id => {
      const lista = get(K.CERTIFICADOS);
      const c = lista.find(x => x.id === id); if (!c) return null;
      c.codigo = Certificados._gerarCodigo();
      c.dataEmissao = now(); c.status = 'emitido';
      set(K.CERTIFICADOS, lista); return c;
    },

    cancelar: id => set(K.CERTIFICADOS, get(K.CERTIFICADOS).map(c =>
      c.id === id ? { ...c, status: 'cancelado' } : c
    )),

    excluir: id => set(K.CERTIFICADOS, get(K.CERTIFICADOS).filter(c => c.id !== id)),

    /** Verifica expirados e atualiza status. */
    sincronizar: () => {
      const agora = new Date();
      set(K.CERTIFICADOS, get(K.CERTIFICADOS).map(c => {
        if (c.status === 'emitido' && c.dataValidade && new Date(c.dataValidade) < agora)
          return { ...c, status: 'expirado' };
        return c;
      }));
    },

    /** Stats globais. */
    stats: () => {
      Certificados.sincronizar();
      const lista = get(K.CERTIFICADOS);
      const agora = new Date(); const em30 = new Date(); em30.setDate(em30.getDate()+30);
      return {
        total:     lista.length,
        emitidos:  lista.filter(c => c.status === 'emitido').length,
        pendentes: lista.filter(c => c.status === 'pendente').length,
        expirados: lista.filter(c => c.status === 'expirado').length,
        cancelados:lista.filter(c => c.status === 'cancelado').length,
        vencendo:  lista.filter(c =>
          c.status === 'emitido' && c.dataValidade &&
          new Date(c.dataValidade) > agora && new Date(c.dataValidade) <= em30
        ).length,
      };
    },

    /** Conta certificados elegíveis ainda não emitidos. */
    pendentesElegivel: () => {
      const cursos  = Cursos.listar().filter(c => c.status === 'publicado');
      const emitidos = new Set(
        get(K.CERTIFICADOS).filter(c => c.status !== 'cancelado')
          .map(c => `${c.alunoId}:${c.cursoId}`)
      );
      let pendentes = 0;
      Alunos.listar().filter(a => a.ativo).forEach(al => {
        cursos.forEach(cu => {
          if (Progresso.pctCurso(al.id, cu.id) === 100 && !emitidos.has(`${al.id}:${cu.id}`))
            pendentes++;
        });
      });
      return pendentes;
    },

    /* ── Modelos de Certificado ── */
    modeloPadrao: () => {
      const lista = get(K.MODELOS_CERT);
      return lista.find(m => m.ativo) || lista[0] || null;
    },

    listarModelos: () => get(K.MODELOS_CERT),

    criarModelo: d => {
      const lista = get(K.MODELOS_CERT);
      const m = {
        id: uid(), criadoEm: now(), ativo: true,
        corPrimaria: '#0002da', logoTexto: 'Radar Internet', subtitulo: 'Plataforma EAD',
        assinatura1: 'Diretor(a) de Operações', cargo1: 'Assinatura 1',
        assinatura2: 'Coordenador(a) de T&D',  cargo2: 'Assinatura 2',
        textoRodape: 'Este certificado atesta a conclusão do curso conforme registros da plataforma.',
        ...d,
      };
      lista.push(m); set(K.MODELOS_CERT, lista); return m;
    },

    atualizarModelo: (id, d) =>
      set(K.MODELOS_CERT, get(K.MODELOS_CERT).map(m => m.id === id ? { ...m, ...d } : m)),

    excluirModelo: id =>
      set(K.MODELOS_CERT, get(K.MODELOS_CERT).filter(m => m.id !== id)),
  };


  // ── ATIVIDADES ────────────────────────────────────────────────────
  // MIGRAÇÃO: substituir por POST/GET /api/v1/atividades
  const MAX_ATIVIDADES = 50;

  const Atividades = {
    registrar: ev => {
      try {
        const lista = get(K.ATIVIDADES);
        lista.unshift({ ...ev, ts: now() });
        set(K.ATIVIDADES, lista.slice(0, MAX_ATIVIDADES));
      } catch (e) {
        console.warn('[Storage.Atividades] Falha ao registrar:', e);
      }
    },

    listar: () => { try { return get(K.ATIVIDADES); } catch { return []; } },
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
    LogAcessos,
    Certificados,
    Turmas,
    Avaliacoes,
    Questoes,
    Respostas,
    Progresso,
    Atividades,
  };

})();
