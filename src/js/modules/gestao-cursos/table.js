/**
 * table.js — Tabela de cursos, filtros, menu dropdown de ações por linha
 * Responsabilidade única: renderização e interação com a tabela.
 */

/* global Storage, PortalMenu, Admin, CursosState, CursosUtils, EadUtils */

var CursosTable = (() => {
  'use strict';

  const _x       = CursosUtils.escapeHtml;
  const _fmtDate = CursosUtils.fmtDate;
  const SVGS     = CursosUtils.SVGS;

  // ── Filtro de categoria ─────────────────────────────────────────

  function popularFiltroCategoria() {
    const sel = document.querySelector('#gc-filtro-cat');
    if (!sel) return;
    const cats = [...new Set(Storage.Cursos.listar().map(c => c.categoria).filter(Boolean))].sort();
    sel.innerHTML =
      '<option value="">Todas as categorias</option>' +
      cats.map(c => `<option value="${_x(c)}">${_x(c)}</option>`).join('');
  }

  // ── Tabela ──────────────────────────────────────────────────────

  function render() {
    CursosState.clearCache();
    const agora = new Date();

    const busca   = (document.querySelector('#gc-search')?.value     || '').toLowerCase().trim();
    const fStatus = document.querySelector('#gc-filtro-status')?.value || '';
    const fCat    = document.querySelector('#gc-filtro-cat')?.value    || '';
    const fFmt    = document.querySelector('#gc-filtro-fmt')?.value    || '';
    const fData   = document.querySelector('#gc-filtro-data')?.value   || '';
    const ordem   = document.querySelector('#gc-order')?.value         || 'recente';

    let lista = Storage.Cursos.listar();

    if (busca)   lista = lista.filter(c =>
      c.titulo?.toLowerCase().includes(busca) ||
      c.categoria?.toLowerCase().includes(busca) ||
      c.descricao?.toLowerCase().includes(busca)
    );
    if (fCat)    lista = lista.filter(c => c.categoria === fCat);
    if (fFmt)    lista = lista.filter(c => (c.formato || 'ead') === fFmt);
    if (fData)   lista = lista.filter(c => c.publicadoEm && c.publicadoEm.slice(0, 10) >= fData);
    if (fStatus) lista = lista.filter(c => CursosUtils.resolveStatus(c) === fStatus);

    lista.sort((a, b) => {
      if (ordem === 'az')         return (a.titulo || '').localeCompare(b.titulo || '');
      if (ordem === 'za')         return (b.titulo || '').localeCompare(a.titulo || '');
      if (ordem === 'antigo')     return new Date(a.criadoEm) - new Date(b.criadoEm);
      if (ordem === 'carga-desc') return (b.carga || 0) - (a.carga || 0);
      return new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0);
    });

    const tbody   = document.querySelector('#gc-tbody');
    const empty   = document.querySelector('#gc-empty');
    const counter = document.querySelector('#gc-result-count');

    if (counter) counter.textContent = `${lista.length} ${lista.length === 1 ? 'curso' : 'cursos'}`;

    if (!lista.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    tbody.innerHTML = lista.map(c => _renderLinha(c, agora)).join('');
  }

  function _renderLinha(c, agora) {
    const status = CursosUtils.resolveStatus(c);
    const aulas  = Storage.Aulas.totalPorCurso(c.id);
    const mods   = Storage.Modulos.listarPorCurso(c.id).length;
    const rest   = Storage.Restricoes.porCurso(c.id);
    const libStr = rest.length ? `${rest.length} restrição(ões)` : 'Todos';
    const prog   = CursosUtils.calcProgresso(c.id);
    const sel    = CursosState.hasSel(c.id);

    const thumbStyle   = c.capa ? `background:url('${c.capa}') center/cover no-repeat` : 'background:var(--blue-light)';
    const thumbContent = c.capa ? '' : (c.titulo?.[0]?.toUpperCase() || '?');
    const valHtml      = _renderValidadeHtml(c, agora);
    const progHtml     = `
      <div class="gc-prog-wrap">
        <div class="gc-prog-bar"><div class="gc-prog-fill" style="width:${prog}%"></div></div>
        <span class="gc-prog-lbl">${prog}%</span>
      </div>`;

    return `<tr class="${sel ? 'selected' : ''}" id="row-${c.id}">
      <td style="padding:8px 10px">
        <input type="checkbox" class="row-check" ${sel ? 'checked' : ''}
          onchange="Cursos.toggleSel('${c.id}',this.checked)">
      </td>
      <td>
        <div class="gc-curso-cell">
          <div class="gc-thumb" style="${thumbStyle}">${thumbContent}</div>
          <div style="min-width:0">
            <div class="gc-titulo">${_x(c.titulo)}</div>
            <div class="gc-desc">${_x(c.descricao) || '—'}</div>
            ${valHtml}
          </div>
        </div>
      </td>
      <td style="font-size:12px;color:var(--text3)">${_x(c.categoria || '—')}</td>
      <td style="text-align:center;font-size:12px">${c.carga ? c.carga + 'h' : '—'}</td>
      <td style="text-align:center">
        <span style="font-size:12px;font-weight:600">${aulas}</span>
        <div style="font-size:10px;color:var(--text4)">${mods} mód.</div>
      </td>
      <td style="text-align:center;font-size:12px;color:var(--text3)">${libStr}</td>
      <td style="min-width:90px">${progHtml}</td>
      <td>${CursosUtils.statusBadge(status)}</td>
      <td style="font-size:11px;color:var(--text4)">${_fmtDate(c.publicadoEm)}</td>
      <td style="font-size:11px;color:var(--text4)">${_fmtDate(c.criadoEm)}</td>
      <td>
        <div class="gc-actions">
          <button class="gc-actions-btn" onclick="Cursos.toggleMenu(this)" title="Ações" data-menu-open="0">
            Ações ${SVGS.chev}
          </button>
        </div>
      </td>
    </tr>`;
  }

  function _renderValidadeHtml(c, agora) {
    if (!c.validadeAte) return `<div class="gc-validade">Sem validade</div>`;
    const d    = new Date(c.validadeAte);
    const diff = Math.ceil((d - agora) / 86400000);
    const cls  = diff < 0 ? 'expirado-txt' : diff < 15 ? 'vencendo' : '';
    const txt  = diff < 0
      ? `Expirou ${_fmtDate(c.validadeAte)}`
      : diff < 15 ? `Vence em ${diff}d` : _fmtDate(c.validadeAte);
    return `<div class="gc-validade ${cls}">${txt}</div>`;
  }

  // ── Menu dropdown (PortalMenu) ──────────────────────────────────

  function toggleMenu(btn) {
    const isOpen = btn.dataset.menuOpen === '1';
    closeMenus();
    if (isOpen) return;

    const id = btn.closest('tr')?.id?.replace('row-', '') || '';
    const c  = id ? Storage.Cursos.obter(id) : null;
    if (!c) return;

    const status = CursosUtils.resolveStatus(c);
    const html = `
      <button onclick="Cursos.visualizar('${c.id}');PortalMenu.close()">${SVGS.eye} Visualizar</button>
      <button onclick="Cursos.abrirEdit('${c.id}');PortalMenu.close()">${SVGS.edit} Editar</button>
      <button onclick="Cursos.duplicarCurso('${c.id}');PortalMenu.close()">${SVGS.copy} Duplicar</button>
      <hr class="sep">
      <button onclick="Admin.go('materiais');PortalMenu.close()">${SVGS.folder} Gerenciar materiais</button>
      <button onclick="Admin.goAcessos('${c.id}');PortalMenu.close()">${SVGS.lock} Gerenciar acessos</button>
      <hr class="sep">
      ${status !== 'publicado'
        ? `<button onclick="Cursos.publicarCurso('${c.id}');PortalMenu.close()">${SVGS.play} Publicar</button>`
        : `<button onclick="Cursos.despublicarCurso('${c.id}');PortalMenu.close()">${SVGS.pause} Despublicar</button>`
      }
      <button onclick="Cursos.arquivarCurso('${c.id}');PortalMenu.close()">${SVGS.arc} Arquivar</button>
      <hr class="sep">
      <button class="danger" onclick="Cursos.excluirCurso('${c.id}');PortalMenu.close()">${SVGS.trash} Excluir</button>`;

    btn.dataset.menuOpen = '1';
    PortalMenu.open(btn, html);

    const pm = document.getElementById('gc-portal-menu');
    if (pm) {
      const obs = new MutationObserver(() => {
        if (pm.style.display === 'none') { btn.dataset.menuOpen = '0'; obs.disconnect(); }
      });
      obs.observe(pm, { attributes: true, attributeFilter: ['style'] });
    }
  }

  function closeMenus() {
    if (typeof PortalMenu !== 'undefined') PortalMenu.close();
    document.querySelectorAll('[data-menu-open="1"]').forEach(b => { b.dataset.menuOpen = '0'; });
  }

  return { render, popularFiltroCategoria, toggleMenu, closeMenus };
})();
