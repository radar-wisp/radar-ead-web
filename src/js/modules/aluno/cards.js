/**
 * cards.js — Componentes de card de curso
 */

/* global Storage, AlunoUtils */

var AlunoCards = (() => {
  'use strict';

  const { x } = AlunoUtils;

  function courseCard(c, pct) {
    const mods  = Storage.Modulos.listarPorCurso(c.id).length;
    const total = Storage.Aulas.totalPorCurso(c.id);
    const done  = pct === 100;
    const thumb = c.capa
      ? `<img src="${c.capa}" alt="${x(c.titulo)}" style="width:100%;height:100%;object-fit:cover;display:block">`
      : `<span style="font-size:2.8rem">${c.emoji || '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'}</span>`;

    return `
    <div class="course-card ${pct > 0 && !done ? 'active-card' : ''}" onclick="Aluno.iniciarCurso('${c.id}')">
      <div class="cc-thumb">
        ${thumb}
        ${pct > 0 ? `<div class="cc-pct-badge ${done ? 'done' : ''}">${done ? '<span class="badge-check"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span> Concluído' : pct + '%'}</div>` : ''}
      </div>
      <div class="cc-body">
        <div class="cc-title">${x(c.titulo)}</div>
        <div class="cc-desc">${x(c.descricao || '')}</div>
        <div class="cc-meta">
          <span class="badge badge-gray">${mods} módulos</span>
          <span class="badge badge-gray">${total} aulas</span>
          ${c.carga ? `<span class="badge badge-gray">⏱ ${c.carga}h</span>` : ''}
        </div>
        <div class="cc-prog-row">
          <div class="prog-bar cc-prog-row-bar" style="flex:1;height:4px">
            <div class="prog-fill ${done ? 'g' : ''}" style="width:${pct}%"></div>
          </div>
          <span class="cc-prog-pct">${pct}%</span>
        </div>
      </div>
    </div>`;
  }

  return { courseCard };
})();
