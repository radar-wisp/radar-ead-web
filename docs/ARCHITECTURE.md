[ARCHITECTURE.md](https://github.com/user-attachments/files/27769767/ARCHITECTURE.md)
# Radar Internet — EAD Platform
## Documento de Arquitetura Técnica v1.0

> **Para:** Desenvolvedor responsável pela migração para backend
> **Objetivo:** Migração cirúrgica — apenas `storage.js` precisa ser reescrito
> **Stack atual:** HTML5 + CSS3 + JavaScript puro + localStorage → GitHub Pages
> **Stack destino:** React + TypeScript + Node.js + PostgreSQL (recomendado)

---

## 1. Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER (client)                        │
│                                                                 │
│   admin.html          aluno.html          index.html            │
│       │                    │                                    │
│       ▼                    ▼                                    │
│   admin.js            aluno.js                                  │
│       │                    │                                    │
│       └──────────┬──────────┘                                   │
│                  ▼                                              │
│         ┌──────────────────┐                                    │
│         │   storage.js     │  ← ÚNICO ARQUIVO A TROCAR         │
│         │   (contrato)     │                                    │
│         └────────┬─────────┘                                    │
│                  │                                              │
│     ┌────────────┴─────────────┐                               │
│     │ FASE 1 (atual)           │  FASE 2 (migração)            │
│     │ localStorage             │  fetch() → REST API           │
│     └──────────────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

**Princípio fundamental:** `admin.js` e `aluno.js` NUNCA acessam
`localStorage` diretamente. Toda persistência passa pelo `storage.js`.
Isso garante que a troca de backend não toca na camada de UI.

---

## 2. Modelo de Dados

### 2.1 Diagrama de Entidades

```
Setor     (1) ──── (N)  Equipe
Setor     (1) ──── (N)  Colaborador
Equipe    (1) ──── (N)  Colaborador

Curso     (1) ──── (N)  Modulo
Modulo    (1) ──── (N)  Aula
Curso     (1) ──── (N)  Material
Curso     (N) ──── (N)  Restricao  [tipo: setor | equipe | colaborador]

Colaborador (N) ── (N)  Aula       [via Progresso]
```

### 2.2 Interfaces TypeScript (contrato dos dados)

```typescript
interface Setor {
  id:        string;        // UUID
  nome:      string;        // "Tecnologia"
  cor:       string;        // "#0002da" hex
}

interface Equipe {
  id:        string;
  nome:      string;        // "Dev Frontend"
  setorId:   string;        // FK → Setor.id
}

interface Colaborador {
  id:        string;
  nome:      string;
  email:     string;        // lowercase, UNIQUE
  senha:     string;        // plain text agora → bcrypt na migração
  ativo:     boolean;
  setorId:   string | null;
  equipeId:  string | null;
  criadoEm:  string;        // ISO 8601
}

interface Curso {
  id:          string;
  titulo:      string;
  descricao:   string;
  carga:       number;      // horas totais
  status:      'rascunho' | 'revisao' | 'publicado' | 'arquivado';
  validadeAte: string | null;  // ISO 8601 | null = sem validade
  publicadoEm: string | null;
  criadoEm:    string;
}

interface Modulo {
  id:        string;
  cursoId:   string;
  titulo:    string;
  descricao: string;
  ordem:     number;        // 1-based, auto-incrementado
  criadoEm:  string;
}

interface Aula {
  id:        string;
  moduloId:  string;
  titulo:    string;
  tipo:      'video' | 'texto' | 'pdf' | 'link';
  conteudo:  string;        // URL ou HTML
  duracao:   number;        // minutos
  ordem:     number;        // 1-based, auto-incrementado
  criadoEm:  string;
}

interface Material {
  id:        string;
  cursoId:   string;
  nome:      string;        // "Apostila JS.pdf"
  tipo:      'pdf' | 'video' | 'doc' | 'outro';
  tamanho:   string;        // "2.4 MB" (display only)
  url:       string;        // S3/CDN URL na migração
  criadoEm:  string;
}

interface Restricao {
  cursoId:   string;
  tipo:      'setor' | 'equipe' | 'colaborador';
  refId:     string;        // FK para setor, equipe ou colaborador
  // PK composta: (cursoId, tipo, refId)
}

interface Progresso {
  alunoId:     string;
  aulaId:      string;
  concluidaEm: string;
  // PK composta: (alunoId, aulaId)
}

interface Sessao {
  tipo:   'admin' | 'aluno';
  id?:    string;           // somente aluno
  nome:   string;
  email:  string;
  inicio: string;
  // Na migração: substituir por JWT claims
}
```

---

## 3. Contrato Público do Storage

**REGRA:** Qualquer implementação de `storage.js` (localStorage, REST, GraphQL)
deve exportar exatamente este objeto. A UI não muda.

```typescript
window.Storage = {

  seed(): void                    // REMOVER na migração

  Sessao: {
    salvar(dados: Partial<Sessao>): void
    obter(): Sessao | null
    encerrar(): void
  }

  Admin: {
    auth(email: string, senha: string): boolean
  }

  Setores: {
    listar(): Setor[]
    obter(id: string): Setor | null
    criar(d: Omit<Setor,'id'>): Setor
    atualizar(id: string, d: Partial<Setor>): void
    excluir(id: string): void
  }

  Equipes: {
    listar(): Equipe[]
    listarPorSetor(setorId: string): Equipe[]
    obter(id: string): Equipe | null
    criar(d: Omit<Equipe,'id'>): Equipe
    atualizar(id: string, d: Partial<Equipe>): void
    excluir(id: string): void
  }

  Cursos: {
    listar(): Curso[]
    obter(id: string): Curso | null
    criar(d: Omit<Curso,'id'|'criadoEm'|'status'|'publicadoEm'>): Curso
    atualizar(id: string, d: Partial<Curso>): void
    excluir(id: string): void     // cascade: módulos, aulas, materiais, restrições
    publicar(id: string): void    // status='publicado', seta publicadoEm
    arquivar(id: string): void    // status='arquivado'
    duplicar(id: string): Curso   // clona curso + módulos + aulas
  }

  Modulos: {
    listar(): Modulo[]
    listarPorCurso(cursoId: string): Modulo[]  // ordenado por .ordem ASC
    obter(id: string): Modulo | null
    criar(d: Omit<Modulo,'id'|'criadoEm'|'ordem'>): Modulo
    atualizar(id: string, d: Partial<Modulo>): void
    excluir(id: string): void                  // cascade: aulas
  }

  Aulas: {
    listar(): Aula[]
    listarPorModulo(moduloId: string): Aula[]  // ordenado por .ordem ASC
    obter(id: string): Aula | null
    criar(d: Omit<Aula,'id'|'criadoEm'|'ordem'>): Aula
    atualizar(id: string, d: Partial<Aula>): void
    excluir(id: string): void
    totalPorCurso(cursoId: string): number
  }

  Alunos: {
    listar(): Colaborador[]
    obter(id: string): Colaborador | null
    porEmail(email: string): Colaborador | null
    porSetor(setorId: string): Colaborador[]
    porEquipe(equipeId: string): Colaborador[]
    criar(d: Omit<Colaborador,'id'|'criadoEm'|'ativo'>): Colaborador | null
    atualizar(id: string, d: Partial<Colaborador>): void
    auth(email: string, senha: string): Colaborador | null
  }

  Materiais: {
    listar(): Material[]
    listarPorCurso(cursoId: string): Material[]
    criar(d: Omit<Material,'id'|'criadoEm'>): Material
    excluir(id: string): void
  }

  Restricoes: {
    listar(): Restricao[]
    porCurso(cursoId: string): Restricao[]
    adicionar(d: Restricao): void              // idempotente
    remover(cursoId: string, tipo: string, refId: string): void
    limpar(cursoId: string): void
  }

  Progresso: {
    listar(): Progresso[]
    concluidas(alunoId: string): string[]      // array de aulaIds
    isConcluida(alunoId: string, aulaId: string): boolean
    marcar(alunoId: string, aulaId: string): void      // idempotente
    desmarcar(alunoId: string, aulaId: string): void
    pctCurso(alunoId: string, cursoId: string): number // 0-100
    cursoConcluido(alunoId: string, cursoId: string): boolean
  }
}
```

---

## 4. Mapeamento localStorage → REST API

### Exemplo de migração de um módulo

```javascript
// ── FASE 1: localStorage (atual) ──────────────────────────────
const Cursos = {
  listar: () => get(K.CURSOS),
  criar:  d  => { const n = {id: uid(), ...d}; /* ... */ return n; },
}

// ── FASE 2: REST API (migração) ───────────────────────────────
const BASE = 'https://api.radar.com.br';

const authHeaders = () => ({
  'Authorization': `Bearer ${getJWT()}`,
  'Content-Type': 'application/json',
});

const Cursos = {
  listar: async () => {
    const r = await fetch(`${BASE}/api/v1/cursos`, { headers: authHeaders() });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  criar: async d => {
    const r = await fetch(`${BASE}/api/v1/cursos`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(d),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  publicar: async id => {
    await fetch(`${BASE}/api/v1/cursos/${id}/publicar`, {
      method: 'POST',
      headers: authHeaders(),
    });
  },

  duplicar: async id => {
    const r = await fetch(`${BASE}/api/v1/cursos/${id}/duplicar`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return r.json();
  },
  // ... demais métodos seguem o mesmo padrão
}
```

### Tabela completa de endpoints

```
AUTH
  POST   /api/v1/auth/login              { email, senha, tipo }  → { token, user }
  POST   /api/v1/auth/logout
  GET    /api/v1/auth/me                 → Sessao

SETORES
  GET    /api/v1/setores                 → Setor[]
  POST   /api/v1/setores                 body: Setor  → Setor
  PUT    /api/v1/setores/:id             body: Partial<Setor>
  DELETE /api/v1/setores/:id

EQUIPES
  GET    /api/v1/equipes?setorId=        → Equipe[]
  POST   /api/v1/equipes                 → Equipe
  PUT    /api/v1/equipes/:id
  DELETE /api/v1/equipes/:id

COLABORADORES
  GET    /api/v1/colaboradores?setorId=&equipeId=  → Colaborador[]
  POST   /api/v1/colaboradores           → Colaborador | 409 (email dup.)
  PUT    /api/v1/colaboradores/:id
  DELETE /api/v1/colaboradores/:id

CURSOS
  GET    /api/v1/cursos                  → Curso[]
  POST   /api/v1/cursos                  → Curso
  PUT    /api/v1/cursos/:id
  DELETE /api/v1/cursos/:id              (cascade no banco)
  POST   /api/v1/cursos/:id/publicar
  POST   /api/v1/cursos/:id/arquivar
  POST   /api/v1/cursos/:id/duplicar     → Curso (novo)

M�DULOS
  GET    /api/v1/modulos?cursoId=        → Modulo[] (ordenado por ordem)
  POST   /api/v1/modulos                 → Modulo
  PUT    /api/v1/modulos/:id
  DELETE /api/v1/modulos/:id             (cascade: aulas)

AULAS
  GET    /api/v1/aulas?moduloId=         → Aula[] (ordenado por ordem)
  POST   /api/v1/aulas                   → Aula
  PUT    /api/v1/aulas/:id
  DELETE /api/v1/aulas/:id
  GET    /api/v1/aulas/total?cursoId=    → { total: number }

MATERIAIS
  GET    /api/v1/materiais?cursoId=      → Material[]
  POST   /api/v1/materiais               multipart/form-data → Material
  DELETE /api/v1/materiais/:id

RESTRIÇÕES
  GET    /api/v1/restricoes?cursoId=     → Restricao[]
  POST   /api/v1/restricoes              → 201 | 409 (duplicata ignorada)
  DELETE /api/v1/restricoes?cursoId=&tipo=&refId=

PROGRESSO
  GET    /api/v1/progresso?alunoId=      → Progresso[]
  POST   /api/v1/progresso               { alunoId, aulaId } → 201 (idempotente)
  DELETE /api/v1/progresso               { alunoId, aulaId }
  GET    /api/v1/progresso/pct?alunoId=&cursoId=  → { pct: number }
```

---

## 5. Schema PostgreSQL

```sql
-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Setores ─────────────────────────────────────────────────────
CREATE TABLE setores (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      VARCHAR(100) NOT NULL,
  cor       VARCHAR(7)   NOT NULL DEFAULT '#0002da',
  criado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Equipes ─────────────────────────────────────────────────────
CREATE TABLE equipes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setor_id  UUID REFERENCES setores(id) ON DELETE SET NULL,
  nome      VARCHAR(100) NOT NULL,
  criado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Colaboradores ───────────────────────────────────────────────
CREATE TABLE colaboradores (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        VARCHAR(200) NOT NULL,
  email       VARCHAR(200) NOT NULL UNIQUE,
  senha_hash  VARCHAR(255) NOT NULL,   -- bcrypt custo 12
  ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
  setor_id    UUID REFERENCES setores(id) ON DELETE SET NULL,
  equipe_id   UUID REFERENCES equipes(id) ON DELETE SET NULL,
  criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Admins ──────────────────────────────────────────────────────
CREATE TABLE admins (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(200) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  criado_em  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Cursos ──────────────────────────────────────────────────────
CREATE TABLE cursos (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo       VARCHAR(300) NOT NULL,
  descricao    TEXT,
  carga        INTEGER,                  -- horas
  status       VARCHAR(20)  NOT NULL DEFAULT 'rascunho'
                 CHECK (status IN ('rascunho','revisao','publicado','arquivado')),
  validade_ate TIMESTAMPTZ,
  publicado_em TIMESTAMPTZ,
  criado_em    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Módulos ─────────────────────────────────────────────────────
CREATE TABLE modulos (
  id        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id  UUID    NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  titulo    VARCHAR(300) NOT NULL,
  descricao TEXT,
  ordem     INTEGER      NOT NULL,
  criado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (curso_id, ordem)
);

-- ── Aulas ───────────────────────────────────────────────────────
CREATE TABLE aulas (
  id        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id UUID    NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  titulo    VARCHAR(300) NOT NULL,
  tipo      VARCHAR(10)  NOT NULL CHECK (tipo IN ('video','texto','pdf','link')),
  conteudo  TEXT,
  duracao   INTEGER,                     -- minutos
  ordem     INTEGER      NOT NULL,
  criado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (modulo_id, ordem)
);

-- ── Materiais ───────────────────────────────────────────────────
CREATE TABLE materiais (
  id        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id  UUID    NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  nome      VARCHAR(300) NOT NULL,
  tipo      VARCHAR(20),
  tamanho   VARCHAR(20),
  url       TEXT         NOT NULL,       -- S3 / CDN URL
  criado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Restrições de acesso ─────────────────────────────────────────
CREATE TABLE restricoes (
  curso_id  UUID        NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  tipo      VARCHAR(20) NOT NULL CHECK (tipo IN ('setor','equipe','colaborador')),
  ref_id    UUID        NOT NULL,
  PRIMARY KEY (curso_id, tipo, ref_id)   -- PK composta = sem duplicatas
);

-- ── Progresso ───────────────────────────────────────────────────
CREATE TABLE progresso (
  colaborador_id UUID        NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  aula_id        UUID        NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  concluida_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (colaborador_id, aula_id)  -- PK composta = sem duplicatas
);

-- ── Índices de performance ───────────────────────────────────────
CREATE INDEX idx_modulos_curso     ON modulos     (curso_id, ordem);
CREATE INDEX idx_aulas_modulo      ON aulas       (modulo_id, ordem);
CREATE INDEX idx_progresso_colab   ON progresso   (colaborador_id);
CREATE INDEX idx_progresso_aula    ON progresso   (aula_id);
CREATE INDEX idx_restricoes_curso  ON restricoes  (curso_id);
CREATE INDEX idx_colab_setor       ON colaboradores (setor_id);
CREATE INDEX idx_colab_equipe      ON colaboradores (equipe_id);
CREATE INDEX idx_materiais_curso   ON materiais   (curso_id);
```

---

## 6. Decisões de Segurança

| Item | Fase 1 (atual) | Fase 2 (produção) |
|------|---------------|-------------------|
| Senhas | Plain text | bcrypt, custo 12 |
| Autenticação | localStorage flag | JWT (7d) + refresh token |
| Autorização | Nenhuma | Middleware role: admin / aluno |
| Upload de arquivos | Simulado | AWS S3 ou Cloudflare R2 |
| CORS | N/A | Whitelist de origens |
| Rate limiting | Nenhum | 20 req/min em /auth/login |
| HTTPS | GitHub Pages (auto) | Obrigatório — sem exceções |
| SQL injection | N/A | Prepared statements via ORM |
| Secrets | N/A | Variáveis de ambiente (.env) |

---

## 7. Stacks Recomendadas para o Backend

### Opção A — Node.js (recomendado)
```
Runtime:    Node.js 20 LTS
Framework:  Fastify (performance) ou Express (familiaridade)
ORM:        Prisma (TypeScript nativo, migrations automáticas)
Auth:       jsonwebtoken + bcryptjs
Upload:     @aws-sdk/client-s3 + multer
Deploy:     Railway (zero-config) / Render / Fly.io
Banco:      PostgreSQL 16 (Supabase gratuito para começar)
```

### Opção B — PHP / Laravel
```
Framework:  Laravel 11
ORM:        Eloquent + migrations
Auth:       Laravel Sanctum (JWT)
Upload:     Laravel Storage + S3
Deploy:     Qualquer cPanel / VPS Ubuntu
Banco:      MySQL 8 ou PostgreSQL
```

### Opção C — Python / FastAPI
```
Framework:  FastAPI
ORM:        SQLAlchemy 2 + Alembic (migrations)
Auth:       python-jose + passlib[bcrypt]
Upload:     boto3 (S3)
Deploy:     Railway / Render
Banco:      PostgreSQL
```

---

## 8. Estrutura de Arquivos

```
radar-ead-web/
│
├── admin.html              ← Painel administrativo (NÃO MEXER)
├── aluno.html              ← Portal do aluno (NÃO MEXER)
├── index.html              ← Landing page (NÃO MEXER)
│
├── src/
│   ├── css/
│   │   └── style.css       ← Design system (NÃO MEXER)
│   └── js/
│       ├── storage.js      ← ⚠️  ÚNICO ARQUIVO A SUBSTITUIR
│       ├── admin.js        ← Lógica UI admin (NÃO MEXER)
│       └── aluno.js        ← Lógica UI aluno (NÃO MEXER)
│
└── docs/
    └── ARCHITECTURE.md     ← Este documento
```

---

## 9. Checklist de Migração

```
PRÉ-MIGRAÇÃO
[ ] Ler este documento completamente
[ ] Definir stack do backend (ver Seção 7)
[ ] Definir serviço de armazenamento de arquivos (S3, R2)
[ ] Definir provedor de deploy
[ ] Provisionar banco PostgreSQL

BACKEND
[ ] Executar schema SQL da Seção 5
[ ] Implementar autenticação JWT (admin + aluno)
[ ] Implementar todos os endpoints da Seção 4
[ ] Testar cada endpoint com Postman/Insomnia
[ ] Implementar upload de arquivos para S3/R2
[ ] Configurar CORS para o domínio do frontend

FRONTEND — storage.api.js
[ ] Criar storage.api.js seguindo o contrato da Seção 3
[ ] Todos os métodos retornam Promise (async/await)
[ ] Substituir storage.js por storage.api.js nos 3 HTMLs
[ ] Remover a chamada Storage.seed() do DOMContentLoaded

TESTES
[ ] Login admin → Dashboard → Criar curso → Publicar
[ ] Login aluno → Acessar curso → Concluir aula → Ver progresso
[ ] Upload de material → Download
[ ] Restrições de acesso por setor/equipe/colaborador
[ ] Expiração de sessão

SEGURANÇA
[ ] Senhas migradas com bcrypt (script de migração)
[ ] JWT com secret >= 32 caracteres
[ ] HTTPS ativo e forçado
[ ] Rate limiting no endpoint de login
[ ] CORS configurado

PÓS-MIGRAÇÃO
[ ] Remover função seed() do storage
[ ] Configurar backups automáticos do banco (diário)
[ ] Monitoramento de erros (Sentry)
[ ] Monitoramento de uptime
```

---

*Versão: 1.0.0*
*Projeto: Radar Internet — EAD Platform*
*Última atualização: gerado automaticamente*
