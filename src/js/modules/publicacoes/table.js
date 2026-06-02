/**
 * table.js — Listagem de publicações, filtros visuais (chips/badge) e menu de ações
 * Responsabilidade única: renderização e interação da tabela e dos filtros.
 */

/* global Storage, PubUtils */

var PubTable = (() => {
  'use strict';

  const q           = PubUtils.q;
  const x           = PubUtils.x;
  const fmtDate     = PubUtils.fmtDate;
  const fmtRelative = PubUtils.fmtRelative;
  const stBadge     = PubUtils.stBadge;
  const tipoBadge   = PubUtils.tipoBadge;
  const CHIP_CLS    = PubUtils.CHIP_CLS;

  /* ── Filtros visuais ────────────────────────────────────────── */
  function setStatus(btn, value) {
    document.querySelectorAll('.ift-chip[data-pbst]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
    });
    if (value && CHIP_CLS[value]) btn.classList.add(CHIP_CLS[value]);
    const sel = document.getElementById('pub-filtro-status');
    if (sel) sel.value = value;
    renderTabela(); _badge();
  }

  function resetFiltros() {
    ['pub-busca', 'pub-filtro-status', 'pub-filtro-tipo', 'pub-filtro-curso', 'pub-filtro-data'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    const ord = document.getElementById('pub-order'); if (ord) ord.value = 'recente';
    document.querySelectorAll('.ift-chip[data-pbst]').forEach(c => {
      Object.values(CHIP_CLS).forEach(cls => { if (cls) c.classList.remove(cls); });
    });
    renderTabela(); _badge();
  }

  function _badge() {
    const b = document.getElementById('pub-badge'); if (!b) return;
    let n = 0;
    ['pub-busca', 'pub-filtro-status', 'pub-filtro-tipo', 'pub-filtro-curso', 'pub-filtro-data']
      .forEach(id => { if (document.getElementById(id)?.value?.trim()) n++; });
    b.textContent = n; b.classList.toggle('show', n > 0);
  }

  /* ── Tabela ─────────────────────────────────────────────────── */
  function renderTabela() {
    const busca   = (q('#pub-busca')?.value || '').toLowerCase().trim();
    const fStatus = q('#pub-filtro-status')?.value || '';
    const fTipo   = q('#pub-filtro-tipo')?.value   || '';
    const fCurso  = q('#pub-filtro-curso')?.value  || '';
    const fData   = q('#pub-filtro-data')?.value   || '';
    const ordem   = q('#pub-order')?.value          || 'recente';

    let lista = Storage.Publicacoes.listar();
    if (fStatus) lista = lista.filter(p => p.status === fStatus);
    if (fTipo)   lista = lista.filter(p => p.tipo === fTipo);
    if (fCurso)  lista = lista.filter(p => p.cursoId === fCurso || p.refId === fCurso);
    if (fData)   lista = lista.filter(p => p.dataPublicacao && p.dataPublicacao.slice(0, 10) >= fData);
    if (busca)   lista = lista.filter(p =>
      p.titulo?.toLowerCase().includes(busca) || p.responsavel?.toLowerCase().includes(busca));

    lista.sort((a, b) => {
      if (ordem === 'az')     return (a.titulo || '').localeCompare(b.titulo || '');
      if (ordem === 'antigo') return new Date(a.criadoEm) - new Date(b.criadoEm);
      return new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0);
    });

    const tbody = q('#pub-tbody'), empty = q('#pub-empty'), count = q('#pub-count');
    if (count) count.textContent = `${lista.length} publicação(ões)`;
    if (!lista.length) { if (tbody) tbody.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = lista.map(p => {
      const agora = new Date();
      const expDiff = p.dataExpiracao ? Math.ceil((new Date(p.dataExpiracao) - agora) / 86400000) : null;
      const expCls  = expDiff !== null && expDiff < 0 ? 'expirado-txt' : expDiff !== null && expDiff <= 7 ? 'vencendo' : '';
      const VIS_LABELS = { todos: 'Todos', turma: 'Turma', setor: 'Setor', equipe: 'Equipe', colaborador: 'Individual' };

      return `<tr>
        <td>
          <div style="font-weight:600;font-size:13px;color:var(--text);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x(p.titulo || '—')}</div>
          ${p.dataAgendada && p.status === 'agendado' ? `<div style="font-size:11px;color:var(--blue)">Agendado para ${fmtDate(p.dataAgendada)}</div>` : ''}
        </td>
        <td>${tipoBadge(p.tipo)}</td>
        <td style="font-size:12px;color:var(--text3)">${VIS_LABELS[p.visibilidade] || 'Todos'}</td>
        <td style="font-size:11px;color:var(--text4)">${fmtDate(p.dataPublicacao)}</td>
        <td>
          <div class="gc-validade ${expCls}" style="font-size:12px">
            ${p.dataExpiracao ? fmtRelative(p.dataExpiracao) : '<span style="color:var(--text4)">Sem validade</span>'}
          </div>
        </td>
        <td>${stBadge(p.status)}</td>
        <td style="font-size:12px;color:var(--text4)">${x(p.responsavel || 'Admin')}</td>
        <td>
          <div class="gc-actions">
            <button class="gc-actions-btn" onclick="PubMod._menu(this)">
              Ações <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="gc-menu">
              <button onclick="PubMod.abrirEdit('${p.id}');PubMod._cm()">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar
              </button>
              ${p.status !== 'publicado'
                ? `<button onclick="PubMod.publicar('${p.id}');PubMod._cm()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Publicar agora
                  </button>`
                : `<button onclick="PubMod.despublicar('${p.id}');PubMod._cm()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    Despublicar
                  </button>`}
              <hr class="sep">
              <button onclick="PubMod.arquivar('${p.id}');PubMod._cm()">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><rect x="1" y="3" width="22" height="5" rx="1"/></svg>
                Arquivar
              </button>
              <button class="danger" onclick="PubMod.excluir('${p.id}');PubMod._cm()">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                Excluir
              </button>
            </div>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  /* ── Menu dropdown por linha ────────────────────────────────── */
  function _menu(btn) {
    const m = btn.nextElementSibling, isOpen = m.classList.contains('open');
    _cm();
    if (!isOpen) { m.classList.add('open'); setTimeout(() => document.addEventListener('click', _cm, { once: true }), 10); }
  }
  function _cm() { document.querySelectorAll('.gc-menu.open').forEach(m => m.classList.remove('open')); }

  return { renderTabela, setStatus, resetFiltros, _menu, _cm };
})();
