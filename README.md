# 🎓 EAD Platform

Plataforma de ensino a distância 100% frontend — HTML, CSS e JavaScript puro, sem dependências, sem build step, sem Node.js.

**[▶ Ver demo ao vivo](https://seu-usuario.github.io/ead-platform)**

---

## Acesso rápido

| Portal | URL | Credenciais |
|--------|-----|-------------|
| 🎓 Landing | `/` | — |
| ⚙️ Admin | `/admin.html` | `admin@ead.com` / `admin123` |
| 📚 Aluno | `/aluno.html` | `ana@aluno.com` / `123456` |

> Os dados de exemplo são criados automaticamente no primeiro acesso.  
> Para resetar: F12 → Application → Local Storage → Clear All.

---

## Publicar no GitHub Pages (3 passos)

```bash
# 1. Clone ou baixe este repositório
git clone https://github.com/seu-usuario/ead-platform.git
cd ead-platform

# 2. Suba para o GitHub
git add .
git commit -m "feat: initial publish"
git push origin main

# 3. Ative o GitHub Pages
# Repositório → Settings → Pages → Source: Deploy from branch → main → / (root) → Save
```

Pronto. Em ~1 minuto o site estará em:  
`https://seu-usuario.github.io/ead-platform`

---

## Rodar localmente

Qualquer servidor estático funciona — escolha o mais fácil:

```bash
# Python (sem instalar nada)
python -m http.server 3000
# acesse http://localhost:3000

# Node.js
npx serve .
# acesse http://localhost:3000

# VS Code
# Instale "Live Server" → botão direito em index.html → Open with Live Server
```

> ⚠️ Não abra os arquivos diretamente com `file://` no navegador — alguns iframes de vídeo são bloqueados nesse contexto.

---

## Funcionalidades

**Painel Admin**
- Dashboard com estatísticas e progresso médio por curso
- CRUD de cursos, módulos e aulas (formulários em modal, sem mudança de página)
- Cadastro de alunos
- Relatório de progresso por aluno/curso

**Portal do Aluno**
- Login + auto-cadastro
- "Continuar de onde parou" — detecta automaticamente a próxima aula
- Player de aulas: vídeo (YouTube embed), texto, PDF e link externo
- Progresso por módulo e por curso em tempo real
- Certificado de conclusão automático ao atingir 100%

---

## Estrutura do projeto

```
ead-platform/
├── index.html          ← Landing page
├── admin.html          ← Painel administrativo
├── aluno.html          ← Portal do aluno
└── src/
    ├── css/
    │   └── style.css   ← Design system completo
    └── js/
        ├── storage.js  ← Camada de dados (localStorage)
        ├── admin.js    ← Lógica do painel admin
        └── aluno.js    ← Lógica do portal do aluno
```

---

## Stack

- HTML5 semântico
- CSS3 com variáveis (design system próprio)
- JavaScript ES6+ (padrão Module IIFE, sem frameworks)
- Persistência via `localStorage`
- Fontes: Plus Jakarta Sans + Inter (Google Fonts CDN)

---

## Roadmap

- [ ] Modo escuro
- [ ] Busca de cursos
- [ ] PWA / offline
- [ ] Integração Firebase / Supabase / PHP+MySQL

---

## Licença

MIT — uso livre para projetos pessoais e comerciais.
