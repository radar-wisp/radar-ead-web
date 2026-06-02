/**
 * stats.js — Cards de métricas, indicadores e painéis laterais
 * Responsabilidade única: renderizar estatísticas e listas de apoio
 * (aguardando publicação, próximos vencimentos, comunicados ativos).
 */

/* global Storage, PubUtils */

var PubStats = (() => {
  'use strict';

  const x        = PubUtils.x;
  const fmtDate  = PubUtils.fmtDate;
  const PRIO_CFG = PubUtils.PRIO_CFG;

  /* ── Stats ──────────────────────────────────────────────────── */
  function renderStats() {
    const st = Storage.Publicacoes.stats();
    const card = (lbl, val, sub, cls = '') => `
      <div class="stat">
        <div class="stat-top">
          <div><div class="stat-lbl">${lbl}</div><div class="stat-val ${cls}">${val}</div></div>
          <div class="stat-ico"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg></div>
        </div>
        <div class="stat-sub">${sub}</div>
      </div>`;
    const wrap = document.getElementById('pub-stats');
    if (wrap) wrap.innerHTML =
      card('Publicações Ativas',  st.ativas,     'disponíveis',        'blue') +
      card('Agendadas',           st.agendadas,  'aguardando data',    st.agendadas > 0 ? 'blue' : '') +
      card('Rascunhos',           st.rascunhos,  'em edição') +
      card('Expiradas',           st.expiradas,  'vencidas',           st.expiradas > 0 ? 'red' : '') +
      card('Vencendo em 7d',      st.vencendo7,  'atenção necessária', st.vencendo7 > 0 ? 'amber' : '');
  }

  function popularFiltroCurso() {
    const sel = document.getElementById('pub-filtro-curso'); if (!sel) return;
    const cur = Storage.Cursos.listar();
    sel.innerHTML = '<option value="">Curso</option>' +
      cur.map(c => `<option value="${x(c.id)}">${x(c.titulo)}</option>`).join('');
  }

  /* ── Painéis laterais ───────────────────────────────────────── */
  function renderAguardando() {
    const wrap = document.getElementById('pub-aguardando'); if (!wrap) return;
    const agend = Storage.Publicacoes.listar().filter(p => p.status === 'agendado')
      .sort((a, b) => new Date(a.dataAgendada) - new Date(b.dataAgendada)).slice(0, 5);
    const rascs = Storage.Publicacoes.listar().filter(p => p.status === 'rascunho').slice(0, 3);
    const items = [...agend, ...rascs];
    if (!items.length) { wrap.innerHTML = '<div style="font-size:12px;color:var(--text4)">Nenhum conteúdo aguardando.</div>'; return; }
    wrap.innerHTML = items.map(p => `
      <div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)">
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x(p.titulo || '—')}</div>
          <div style="font-size:10px;color:var(--text4)">${p.status === 'agendado' ? fmtDate(p.dataAgendada) : 'Rascunho'}</div>
        </div>
        <button onclick="PubMod.publicar('${p.id}')"
          style="background:var(--blue);color:#fff;border:none;border-radius:var(--radius-sm);padding:3px 8px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap">
          Publicar
        </button>
      </div>`).join('');
  }

  function renderVencimentos() {
    const wrap = document.getElementById('pub-vencimentos'); if (!wrap) return;
    const agora = new Date(); const em7 = new Date(); em7.setDate(em7.getDate() + 7);
    const prox = Storage.Publicacoes.listar()
      .filter(p => p.status === 'publicado' && p.dataExpiracao &&
        new Date(p.dataExpiracao) > agora && new Date(p.dataExpiracao) <= em7)
      .sort((a, b) => new Date(a.dataExpiracao) - new Date(b.dataExpiracao)).slice(0, 5);
    if (!prox.length) { wrap.innerHTML = '<div style="font-size:12px;color:var(--text4)">Nenhum vencimento nos próximos 7 dias.</div>'; return; }
    wrap.innerHTML = prox.map(p => {
      const diff = Math.ceil((new Date(p.dataExpiracao) - agora) / 86400000);
      const cor = diff <= 1 ? 'var(--red)' : diff <= 3 ? 'var(--amber)' : 'var(--text4)';
      return `
        <div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)">
          <div style="width:6px;height:6px;border-radius:50%;background:${cor};margin-top:4px;flex-shrink:0"></div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x(p.titulo || '—')}</div>
            <div style="font-size:10px;color:${cor}">${diff === 1 ? 'amanhã' : diff + ' dias'}</div>
          </div>
        </div>`;
    }).join('');
  }

  function renderComunicadosLista() {
    const wrap = document.getElementById('pub-comunicados-lista'); if (!wrap) return;
    const ativos = Storage.Comunicados.listar().filter(c => c.status === 'publicado').slice(0, 4);
    if (!ativos.length) { wrap.innerHTML = '<div style="font-size:12px;color:var(--text4)">Nenhum comunicado ativo.</div>'; return; }
    wrap.innerHTML = ativos.map(c => {
      const cfg = PRIO_CFG[c.prioridade] || PRIO_CFG.normal;
      return `
        <div style="padding:7px 0;border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
            <span class="badge ${cfg.cls}" style="font-size:9px">${cfg.label}</span>
            <div style="font-size:12px;font-weight:500;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x(c.titulo)}</div>
          </div>
          <div style="font-size:11px;color:var(--text4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x(c.mensagem)}</div>
        </div>`;
    }).join('');
  }

  return { renderStats, popularFiltroCurso, renderAguardando, renderVencimentos, renderComunicadosLista };
})();
