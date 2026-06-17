/**
 * utils.js — SVGs reutilizáveis, lógica de status e cálculo de progresso
 * Responsabilidade única: helpers visuais e de dados sem efeitos colaterais.
 */

/* global EadUtils, Storage, CursosState */

var CursosUtils = (() => {
  'use strict';

  // Delegação para EadUtils — sem reimplementação
  const _x       = EadUtils.escapeHtml;
  const fmtDate  = EadUtils.fmtDate;
  const fmtBytes = (b) => {
    if (!b || isNaN(b)) return '—';
    if (b < 1024)    return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  };

  // ── SVG helper ─────────────────────────────────────────────────
  function ico(d, s = 14) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${d}</svg>`;
  }

  const SVGS = {
    eye:    ico('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
    edit:   ico('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
    copy:   ico('<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
    folder: ico('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
    lock:   ico('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
    play:   ico('<polygon points="5 3 19 12 5 21 5 3"/>'),
    pause:  ico('<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'),
    arc:    ico('<path d="M21 8v13H3V8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/>'),
    trash:  ico('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>'),
    chev:   ico('<polyline points="6 9 12 15 18 9"/>'),
    book:   ico('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
    down:   ico('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
  };

  // ── Status ─────────────────────────────────────────────────────
  const STATUS_CFG = {
    publicado: { cls: 'badge-green', label: '● Publicado' },
    rascunho:  { cls: 'badge-gray',  label: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Rascunho'  },
    revisao:   { cls: 'badge-blue',  label: '◎ Revisão'   },
    arquivado: { cls: 'badge-amber', label: '▣ Arquivado' },
    expirado:  { cls: 'badge-red',   label: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Expirado'  },
  };

  function resolveStatus(curso) {
    if (curso.status === 'publicado' && curso.validadeAte && new Date(curso.validadeAte) < new Date()) {
      return 'expirado';
    }
    return curso.status || 'rascunho';
  }

  function statusBadge(status) {
    const cfg = STATUS_CFG[status] || STATUS_CFG.rascunho;
    return `<span class="badge ${cfg.cls}" style="white-space:nowrap">${cfg.label}</span>`;
  }

  // ── Progresso ──────────────────────────────────────────────────
  /**
   * Calcula progresso médio (%) com cache por ciclo de renderização.
   * @param {string} cursoId
   * @returns {number}
   */
  function calcProgresso(cursoId) {
    const cached = CursosState.getCache(cursoId);
    if (cached !== undefined) return cached;

    const mids  = Storage.Modulos.listarPorCurso(cursoId).map(m => m.id);
    const aids  = Storage.Aulas.listar().filter(a => mids.includes(a.moduloId)).map(a => a.id);
    if (!aids.length) { CursosState.setCache(cursoId, 0); return 0; }

    const alunos = Storage.Alunos.listar().filter(a => a.ativo);
    if (!alunos.length) { CursosState.setCache(cursoId, 0); return 0; }

    let total = 0;
    alunos.forEach(al => {
      const done = Storage.Progresso.concluidas(al.id).filter(id => aids.includes(id)).length;
      total += Math.round((done / aids.length) * 100);
    });
    const resultado = Math.round(total / alunos.length);
    CursosState.setCache(cursoId, resultado);
    return resultado;
  }

  return { ico, SVGS, STATUS_CFG, resolveStatus, statusBadge, calcProgresso, fmtDate, fmtBytes, escapeHtml: _x };
})();
