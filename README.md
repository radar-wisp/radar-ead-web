Plataforma de ensino a distância 100% frontend — HTML, CSS e JavaScript puro, sem dependências, sem build step, sem Node.js.

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

## Stack

- HTML5 semântico
- CSS3 com variáveis (design system próprio)
- JavaScript ES6+ (padrão Module IIFE, sem frameworks)
- Persistência via `localStorage`
- Fontes: Plus Jakarta Sans + Inter (Google Fonts CDN)

## Licença

MIT — uso livre para projetos pessoais e comerciais.
