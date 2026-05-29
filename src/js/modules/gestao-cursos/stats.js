/**
 * stats.js — Cards de estatísticas, feed de atividades e dashboard global
 * Responsabilidade única: renderizar indicadores e histórico de atividades.
 */

/* global Storage, CursosUtils, EadUtils */

var CursosStats = (() => {
  'use strict';

  const _x       = CursosUtils.escapeHtml;
  const _fmtDate = CursosUtils.fmtDate;
  const SVGS     = CursosUtils.SVGS;

  // ── Stats ───────────────────────────────────────────────────────

  function renderStats() {
    const wrap = document.getElementById('gc-stats');
    if (!wrap) return;

    const lista = Storage.Cursos.listar();
    const agora = new Date();
    const total      = lista.length;
    const publicados = lista.filter(c => c.status === 'publicado' && !(c.validadeAte && new Date(c.validadeAte) < agora)).length;
    const rascunhos  = lista.filter(c => (c.status || 'rascunho') === 'rascunho').length;
    const arquivados = lista.filter(c => c.status === 'arquivado').length;
    const expirados  = lista.filter(c => c.status === 'publicado' && c.validadeAte && new Date(c.validadeAte) < agora).length;

    const card = (label, val, sub, valClass = '') => `
      <div class="stat">
        <div class="stat-top">
          <div>
            <div class="stat-lbl">${label}</div>
            <div class="stat-val ${valClass}">${val}</div>
          </div>
          <div class="stat-ico">${SVGS.book}</div>
        </div>
        <div class="stat-sub">${sub}</div>
      </div>`;

    wrap.innerHTML =
      card('Total de Cursos', total,      'cadastrados',    '') +
      card('Publicados',      publicados,  'disponíveis',   'blue') +
      card('Rascunho',        rascunhos,   'em edição',     '') +
      card('Arquivados',      arquivados,  'desativados',   '') +
      card('Expirados',       expirados,   'fora do prazo', expirados > 0 ? 'red' : '');
  }

  // ── Atividades ──────────────────────────────────────────────────

  const _TIPO_LABEL = {
    criou:    { label: 'Curso criado',        cls: 'badge-blue'  },
    publicou: { label: 'Curso publicado',     cls: 'badge-green' },
    arquivou: { label: 'Curso arquivado',     cls: 'badge-amber' },
    duplicou: { label: 'Curso duplicado',     cls: 'badge-gray'  },
    editou:   { label: 'Curso editado',       cls: 'badge-blue'  },
    material: { label: 'Material adicionado', cls: 'badge-blue'  },
  };

  function renderAtividades() {
    const wrap = document.getElementById('gc-atividades');
    if (!wrap) return;

    const ativ = [];
    Storage.Atividades.listar().forEach(a => ativ.push(a));
    Storage.Cursos.listar().forEach(c => {
      if (c.criadoEm)    ativ.push({ tipo: 'criou',    cursoId: c.id, ts: c.criadoEm });
      if (c.publicadoEm) ativ.push({ tipo: 'publicou', cursoId: c.id, ts: c.publicadoEm });
    });
    Storage.Materiais.listar().forEach(m => {
      if (m.criadoEm) ativ.push({ tipo: 'material', cursoId: m.cursoId, materialNome: m.nome, ts: m.criadoEm });
    });

    ativ.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    const top = ativ.slice(0, 10);

    if (!top.length) {
      wrap.innerHTML = '<div style="color:var(--text4);font-size:13px">Nenhuma atividade registrada.</div>';
      return;
    }

    wrap.innerHTML = top.map(a => {
      const curso = a.cursoId ? Storage.Cursos.obter(a.cursoId) : null;
      const cfg   = _TIPO_LABEL[a.tipo] || { label: a.tipo, cls: 'badge-gray' };
      const nome  = a.materialNome
        ? `${curso ? _x(curso.titulo) + ' — ' : ''}${_x(a.materialNome)}`
        : (curso ? _x(curso.titulo) : '—');
      const diff  = Math.floor((Date.now() - new Date(a.ts)) / 60000);
      const tempo = diff < 1 ? 'Agora' : diff < 60 ? `${diff}min` : diff < 1440 ? `${Math.floor(diff / 60)}h` : _fmtDate(a.ts);

      return `
        <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
          <span class="badge ${cfg.cls}" style="white-space:nowrap;flex-shrink:0">${cfg.label}</span>
          <span style="flex:1;font-size:12px;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${nome}</span>
          <span style="font-size:11px;color:var(--text4);flex-shrink:0">${tempo}</span>
        </div>`;
    }).join('') + '<div style="padding-top:2px"></div>';
  }

  // ── Dashboard global ────────────────────────────────────────────

  function sincronizarDashboard() {
    const lista = Storage.Cursos.listar();
    const el = document.getElementById('ds-cursos');
    if (el) el.textContent = lista.length;
    const ep = document.getElementById('ds-publicados');
    if (ep) ep.textContent = lista.filter(c => c.status === 'publicado').length;
  }

  return { renderStats, renderAtividades, sincronizarDashboard };
})();
