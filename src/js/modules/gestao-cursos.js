/**
 * @fileoverview gestao-cursos.js — Módulo: Gestão de Cursos
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO ISOLADO — Gestão de Cursos                               ║
 * ║                                                                  ║
 * ║  Responsabilidades:                                              ║
 * ║  • Renderização da tabela de cursos com filtros                  ║
 * ║  • Stats/indicadores do painel                                   ║
 * ║  • Ações individuais e em lote (publicar, arquivar, excluir)     ║
 * ║  • Modal de visualização rápida                                  ║
 * ║  • Drawer de edição (via CursoDrawer)                            ║
 * ║  • Exportação CSV                                                ║
 * ║  • Log de atividades recentes                                    ║
 * ║                                                                  ║
 * ║  Contrato de entrada (dependências externas):                    ║
 * ║  • window.Storage  — camada de dados (storage.js)                ║
 * ║  • window.PortalMenu — menu dropdown flutuante (admin.html)      ║
 * ║  • window.Admin.go — navegação entre páginas (admin.js)          ║
 * ║  • window.CursoDrawer — drawer iframe de edição (admin.html)     ║
 * ║                                                                  ║
 * ║  Contrato de saída (API pública exposta):                        ║
 * ║  • window.Cursos.init()                                          ║
 * ║  • window.Cursos.refresh()                                       ║
 * ║  • window.Cursos.renderTabela()                                  ║
 * ║  • window.Cursos.renderStats()                                   ║
 * ║  • window.Cursos.renderAtividades()                              ║
 * ║  • window.Cursos.toggleSel(id, checked)                          ║
 * ║  • window.Cursos.toggleSelAll(checkbox)                          ║
 * ║  • window.Cursos.publicarLote()                                  ║
 * ║  • window.Cursos.arquivarLote()                                  ║
 * ║  • window.Cursos.excluirLote()                                   ║
 * ║  • window.Cursos.publicarCurso(id)                               ║
 * ║  • window.Cursos.despublicarCurso(id)                            ║
 * ║  • window.Cursos.arquivarCurso(id)                               ║
 * ║  • window.Cursos.excluirCurso(id)                                ║
 * ║  • window.Cursos.duplicarCurso(id)                               ║
 * ║  • window.Cursos.visualizar(id)                                  ║
 * ║  • window.Cursos.abrirEdit(id)                                   ║
 * ║  • window.Cursos.toggleMenu(btn)                                 ║
 * ║  • window.Cursos.closeMenus()                                    ║
 * ║  • window.Cursos.exportar()                                      ║
 * ║                                                                  ║
 * ║  MIGRAÇÃO BACKEND: Apenas window.Storage precisa mudar.          ║
 * ║  Este módulo NÃO acessa localStorage diretamente.                ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * @module GestaoCursos
 * @version 1.0.0
 * @see docs/ARCHITECTURE.md
 */

/* global Storage, PortalMenu, Admin, CursoDrawer, IFT */

var Cursos = (() => {
  'use strict';

  // ── Estado interno do módulo ──────────────────────────────────
  let _selecionados = new Set();
  let _cursoEditId  = null;
  let _matEdit      = [];

  // ── Cache de progresso (por ciclo de renderização) ────────────
  let _progressCache = {};

  // ══════════════════════════════════════════════════════════════
  // UTILITÁRIOS INTERNOS (não expostos)
  // ══════════════════════════════════════════════════════════════

  /** Atalho para querySelector */
  function _q(sel) {
    return document.querySelector(sel);
  }

  /** Escapa HTML para evitar XSS */
  function _x(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Formata data ISO 8601 para pt-BR.
   * @param {string|null} iso
   * @returns {string}
   */
  function _fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
    });
  }

  /**
   * Formata bytes para exibição legível.
   * @param {number} b
   * @returns {string}
   */
  function _fmtBytes(b) {
    if (!b || isNaN(b)) return '—';
    if (b < 1024)    return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  /**
   * Exibe toast usando o container global #toasts.
   * @param {string} msg
   * @param {'s'|'e'|'i'} tipo  s=sucesso, e=erro, i=info
   */
  function _toast(msg, tipo = 'i') {
    const s = document.getElementById('toasts');
    if (!s) return;
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.innerHTML = `<span>${{ s: '✅', e: '❌', i: 'ℹ️' }[tipo] || 'ℹ️'}</span><span>${_x(msg)}</span>`;
    s.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  // ══════════════════════════════════════════════════════════════
  // STATUS — helpers de resolução e apresentação
  // ══════════════════════════════════════════════════════════════

  /**
   * Mapa de configuração visual por status.
   * @type {Record<string, {cls:string, label:string}>}
   */
  const STATUS_CFG = {
    publicado: { cls: 'badge-green', label: '● Publicado' },
    rascunho:  { cls: 'badge-gray',  label: '✎ Rascunho'  },
    revisao:   { cls: 'badge-blue',  label: '◎ Revisão'   },
    arquivado: { cls: 'badge-amber', label: '▣ Arquivado' },
    expirado:  { cls: 'badge-red',   label: '✕ Expirado'  },
  };

  /**
   * Resolve o status efetivo do curso, considerando expiração.
   * @param {object} curso
   * @returns {string}
   */
  function _resolveStatus(curso) {
    if (
      curso.status === 'publicado' &&
      curso.validadeAte &&
      new Date(curso.validadeAte) < new Date()
    ) {
      return 'expirado';
    }
    return curso.status || 'rascunho';
  }

  /**
   * Retorna HTML de badge de status.
   * @param {string} status
   * @returns {string}
   */
  function _statusBadge(status) {
    const cfg = STATUS_CFG[status] || STATUS_CFG.rascunho;
    return `<span class="badge ${cfg.cls}" style="white-space:nowrap">${cfg.label}</span>`;
  }

  // ══════════════════════════════════════════════════════════════
  // SVG HELPERS
  // ══════════════════════════════════════════════════════════════

  /**
   * Gera SVG inline padronizado.
   * @param {string} d  — conteúdo interno do SVG
   * @param {number} s  — tamanho (width e height)
   * @returns {string}
   */
  function _ico(d, s = 14) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${d}</svg>`;
  }

  /** Biblioteca de ícones usados pelo módulo */
  const SVGS = {
    eye:    _ico('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
    edit:   _ico('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
    copy:   _ico('<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
    folder: _ico('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
    lock:   _ico('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
    play:   _ico('<polygon points="5 3 19 12 5 21 5 3"/>'),
    pause:  _ico('<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'),
    arc:    _ico('<path d="M21 8v13H3V8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/>'),
    trash:  _ico('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>'),
    chev:   _ico('<polyline points="6 9 12 15 18 9"/>'),
    book:   _ico('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
    down:   _ico('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
  };

  // ══════════════════════════════════════════════════════════════
  // CÁLCULOS DE PROGRESSO
  // ══════════════════════════════════════════════════════════════

  /**
   * Calcula progresso médio (%) de todos os alunos ativos em um curso.
   * Resultado é cacheado por ciclo de renderização (_progressCache).
   * @param {string} cursoId
   * @returns {number} 0–100
   */
  function _calcProgresso(cursoId) {
    if (_progressCache[cursoId] !== undefined) return _progressCache[cursoId];

    const mids  = Storage.Modulos.listarPorCurso(cursoId).map(m => m.id);
    const aids  = Storage.Aulas.listar().filter(a => mids.includes(a.moduloId)).map(a => a.id);
    if (!aids.length) { _progressCache[cursoId] = 0; return 0; }

    const alunos = Storage.Alunos.listar().filter(a => a.ativo);
    if (!alunos.length) { _progressCache[cursoId] = 0; return 0; }

    let total = 0;
    alunos.forEach(al => {
      const done = Storage.Progresso.concluidas(al.id).filter(id => aids.includes(id)).length;
      total += Math.round((done / aids.length) * 100);
    });
    const resultado = Math.round(total / alunos.length);
    _progressCache[cursoId] = resultado;
    return resultado;
  }

  // ══════════════════════════════════════════════════════════════
  // STATS — Painel de indicadores
  // ══════════════════════════════════════════════════════════════

  /**
   * Renderiza os cards de estatísticas da página de cursos.
   * Lê somente de Storage.Cursos — sem efeitos colaterais.
   */
  function renderStats() {
    const wrap = document.getElementById('gc-stats');
    if (!wrap) return;

    const lista = Storage.Cursos.listar();
    const agora = new Date();

    const total      = lista.length;
    const publicados = lista.filter(c =>
      c.status === 'publicado' && !(c.validadeAte && new Date(c.validadeAte) < agora)
    ).length;
    const rascunhos  = lista.filter(c => (c.status || 'rascunho') === 'rascunho').length;
    const arquivados = lista.filter(c => c.status === 'arquivado').length;
    const expirados  = lista.filter(c =>
      c.status === 'publicado' && c.validadeAte && new Date(c.validadeAte) < agora
    ).length;

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

  // ══════════════════════════════════════════════════════════════
  // FILTRO DE CATEGORIA
  // ══════════════════════════════════════════════════════════════

  /**
   * Popula o <select> de categoria com os valores únicos dos cursos.
   */
  function _popularFiltroCategoria() {
    const sel = _q('#gc-filtro-cat');
    if (!sel) return;
    const cats = [
      ...new Set(Storage.Cursos.listar().map(c => c.categoria).filter(Boolean)),
    ].sort();
    sel.innerHTML =
      '<option value="">Todas as categorias</option>' +
      cats.map(c => `<option value="${_x(c)}">${_x(c)}</option>`).join('');
  }

  // ══════════════════════════════════════════════════════════════
  // TABELA PRINCIPAL
  // ══════════════════════════════════════════════════════════════

  /**
   * Lê filtros do DOM e (re)renderiza o tbody da tabela de cursos.
   * Função pura de leitura: não altera estado do Storage.
   */
  function renderTabela() {
    _progressCache = {}; // limpa cache do ciclo anterior
    const agora = new Date();

    // Lê filtros ativos
    const busca   = (_q('#gc-search')?.value     || '').toLowerCase().trim();
    const fStatus = _q('#gc-filtro-status')?.value || '';
    const fCat    = _q('#gc-filtro-cat')?.value    || '';
    const fFmt    = _q('#gc-filtro-fmt')?.value    || '';
    const fData   = _q('#gc-filtro-data')?.value   || '';
    const ordem   = _q('#gc-order')?.value         || 'recente';

    let lista = Storage.Cursos.listar();

    // Aplica filtros encadeados
    if (busca) {
      lista = lista.filter(c =>
        c.titulo?.toLowerCase().includes(busca) ||
        c.categoria?.toLowerCase().includes(busca) ||
        c.descricao?.toLowerCase().includes(busca)
      );
    }
    if (fCat)    lista = lista.filter(c => c.categoria === fCat);
    if (fFmt)    lista = lista.filter(c => (c.formato || 'ead') === fFmt);
    if (fData)   lista = lista.filter(c => c.publicadoEm && c.publicadoEm.slice(0, 10) >= fData);
    if (fStatus) lista = lista.filter(c => _resolveStatus(c) === fStatus);

    // Ordenação
    lista.sort((a, b) => {
      if (ordem === 'az')         return (a.titulo || '').localeCompare(b.titulo || '');
      if (ordem === 'za')         return (b.titulo || '').localeCompare(a.titulo || '');
      if (ordem === 'antigo')     return new Date(a.criadoEm) - new Date(b.criadoEm);
      if (ordem === 'carga-desc') return (b.carga || 0) - (a.carga || 0);
      return new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0); // recente (default)
    });

    // Referências DOM
    const tbody   = _q('#gc-tbody');
    const empty   = _q('#gc-empty');
    const counter = _q('#gc-result-count');

    if (counter) {
      counter.textContent = `${lista.length} ${lista.length === 1 ? 'curso' : 'cursos'}`;
    }

    if (!lista.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = lista.map(c => _renderLinha(c, agora)).join('');
  }

  /**
   * Gera o HTML de uma linha da tabela para um curso.
   * @param {object} c     — curso
   * @param {Date}   agora — instância de Date para comparação de validade
   * @returns {string} HTML da <tr>
   */
  function _renderLinha(c, agora) {
    const status = _resolveStatus(c);
    const aulas  = Storage.Aulas.totalPorCurso(c.id);
    const mods   = Storage.Modulos.listarPorCurso(c.id).length;
    const rest   = Storage.Restricoes.porCurso(c.id);
    const libStr = rest.length ? `${rest.length} restrição(ões)` : 'Todos';
    const prog   = _calcProgresso(c.id);
    const sel    = _selecionados.has(c.id);

    const thumbStyle   = c.capa
      ? `background:url('${c.capa}') center/cover no-repeat`
      : 'background:var(--blue-light)';
    const thumbContent = c.capa ? '' : (c.titulo?.[0]?.toUpperCase() || '?');

    const valHtml = _renderValidadeHtml(c, agora);
    const progHtml = `
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
      <td>${_statusBadge(status)}</td>
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

  /**
   * Gera HTML do indicador de validade de um curso.
   * @param {object} c     — curso
   * @param {Date}   agora
   * @returns {string}
   */
  function _renderValidadeHtml(c, agora) {
    if (!c.validadeAte) {
      return `<div class="gc-validade">Sem validade</div>`;
    }
    const d    = new Date(c.validadeAte);
    const diff = Math.ceil((d - agora) / 86400000);
    const cls  = diff < 0 ? 'expirado-txt' : diff < 15 ? 'vencendo' : '';
    const txt  = diff < 0
      ? `Expirou ${_fmtDate(c.validadeAte)}`
      : diff < 15
        ? `Vence em ${diff}d`
        : _fmtDate(c.validadeAte);
    return `<div class="gc-validade ${cls}">${txt}</div>`;
  }

  // ══════════════════════════════════════════════════════════════
  // MENU DROPDOWN (PortalMenu)
  // ══════════════════════════════════════════════════════════════

  /**
   * Abre o menu de ações de uma linha da tabela.
   * Usa PortalMenu para renderizar fora do clipping da tabela.
   * @param {HTMLElement} btn — botão "Ações" clicado
   */
  function toggleMenu(btn) {
    const isOpen = btn.dataset.menuOpen === '1';
    closeMenus();
    if (isOpen) return;

    const id = btn.closest('tr')?.id?.replace('row-', '') || '';
    const c  = id ? Storage.Cursos.obter(id) : null;
    if (!c) return;

    const status = _resolveStatus(c);

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

    // Observa fechamento via MutationObserver para limpar o estado
    const pm = document.getElementById('gc-portal-menu');
    if (pm) {
      const obs = new MutationObserver(() => {
        if (pm.style.display === 'none') {
          btn.dataset.menuOpen = '0';
          obs.disconnect();
        }
      });
      obs.observe(pm, { attributes: true, attributeFilter: ['style'] });
    }
  }

  /** Fecha todos os menus abertos */
  function closeMenus() {
    if (typeof PortalMenu !== 'undefined') PortalMenu.close();
    document.querySelectorAll('[data-menu-open="1"]').forEach(b => {
      b.dataset.menuOpen = '0';
    });
  }

  // ══════════════════════════════════════════════════════════════
  // SELEÇÃO EM LOTE
  // ══════════════════════════════════════════════════════════════

  /**
   * Alterna seleção de um curso individual.
   * @param {string}  id
   * @param {boolean} checked
   */
  function toggleSel(id, checked) {
    checked ? _selecionados.add(id) : _selecionados.delete(id);
    const row = document.getElementById('row-' + id);
    if (row) row.classList.toggle('selected', checked);
    _atualizarBotoesLote();
  }

  /**
   * Seleciona ou deseleciona todos os cursos visíveis.
   * @param {HTMLInputElement} checkbox
   */
  function toggleSelAll(checkbox) {
    Storage.Cursos.listar().forEach(c => {
      if (checkbox.checked) _selecionados.add(c.id);
      else _selecionados.delete(c.id);
    });
    document.querySelectorAll('.row-check').forEach(ch => {
      ch.checked = checkbox.checked;
    });
    document.querySelectorAll('#gc-tbody tr').forEach(r => {
      r.classList.toggle('selected', checkbox.checked);
    });
    _atualizarBotoesLote();
  }

  /**
   * Atualiza label e visibilidade do painel de ações em lote.
   */
  function _atualizarBotoesLote() {
    const n = _selecionados.size;
    const countEl = _q('#gc-sel-count');
    if (countEl) {
      countEl.textContent = `${n} curso${n !== 1 ? 's' : ''} selecionado${n !== 1 ? 's' : ''}`;
    }
    const loteRow = _q('#ift-lote-row');
    if (loteRow) loteRow.classList.toggle('show', n > 0);
  }

  // ══════════════════════════════════════════════════════════════
  // AÇÕES EM LOTE
  // ══════════════════════════════════════════════════════════════

  function publicarLote() {
    if (!_selecionados.size) return;
    if (!confirm(`Publicar ${_selecionados.size} curso(s)?`)) return;
    _selecionados.forEach(id => Storage.Cursos.publicar(id));
    _toast(`${_selecionados.size} curso(s) publicado(s)!`, 's');
    _selecionados.clear();
    refresh();
  }

  function arquivarLote() {
    if (!_selecionados.size) return;
    if (!confirm(`Arquivar ${_selecionados.size} curso(s)?`)) return;
    _selecionados.forEach(id => Storage.Cursos.arquivar(id));
    _toast(`${_selecionados.size} curso(s) arquivado(s).`, 'i');
    _selecionados.clear();
    refresh();
  }

  function excluirLote() {
    if (!_selecionados.size) return;
    if (!confirm(`Excluir permanentemente ${_selecionados.size} curso(s)?`)) return;
    _selecionados.forEach(id => Storage.Cursos.excluir(id));
    _toast(`${_selecionados.size} curso(s) excluído(s).`, 'i');
    _selecionados.clear();
    refresh();
  }

  // ══════════════════════════════════════════════════════════════
  // AÇÕES INDIVIDUAIS
  // ══════════════════════════════════════════════════════════════

  function publicarCurso(id) {
    Storage.Cursos.publicar(id);
    _toast('Curso publicado!', 's');
    _logAtividade({ tipo: 'publicou', cursoId: id });
    refresh();
  }

  function despublicarCurso(id) {
    Storage.Cursos.atualizar(id, { status: 'rascunho', publicadoEm: null });
    _toast('Curso despublicado.', 'i');
    refresh();
  }

  function arquivarCurso(id) {
    if (!confirm('Arquivar este curso?')) return;
    Storage.Cursos.arquivar(id);
    _toast('Curso arquivado.', 'i');
    _logAtividade({ tipo: 'arquivou', cursoId: id });
    refresh();
  }

  function excluirCurso(id) {
    if (!confirm('Excluir permanentemente este curso? Esta ação não pode ser desfeita.')) return;
    Storage.Cursos.excluir(id);
    _toast('Curso excluído.', 'i');
    refresh();
  }

  function duplicarCurso(id) {
    const novo = Storage.Cursos.duplicar(id);
    if (novo) {
      _toast('Curso duplicado!', 's');
      _logAtividade({ tipo: 'duplicou', cursoId: novo.id });
      refresh();
    }
  }

  // ══════════════════════════════════════════════════════════════
  // MODAL DE VISUALIZAÇÃO RÁPIDA
  // ══════════════════════════════════════════════════════════════

  /**
   * Abre o modal de visualização rápida de um curso.
   * Popula todos os campos sem alterar dados.
   * @param {string} id
   */
  function visualizar(id) {
    const c = Storage.Cursos.obter(id);
    if (!c) return;

    // Prioriza estrutura do wizard (c.modulos), fallback para Storage
    const modsArr = c.modulos?.length
      ? c.modulos
      : Storage.Modulos.listarPorCurso(id);
    const mods    = modsArr.length;
    const aulas   = c.modulos?.length
      ? c.modulos.reduce((s, m) => s + (m.aulas?.length || 0), 0)
      : Storage.Aulas.totalPorCurso(id);
    const mats    = (c.materiais?.filter(m => m.tipo !== 'quiz').length)
      || Storage.Materiais.listarPorCurso(id).length;
    const status  = _resolveStatus(c);
    const prog    = _calcProgresso(id);

    const modal = document.getElementById('modal-curso-view');
    if (!modal) return;

    // Thumbnail
    const thumb = modal.querySelector('#mcv-thumb');
    if (thumb) {
      if (c.capa) {
        thumb.style.background = `url('${c.capa}') center/cover no-repeat`;
        thumb.textContent = '';
      } else {
        thumb.style.background = 'var(--blue-l)';
        thumb.textContent = (c.titulo?.[0] || '?').toUpperCase();
      }
    }

    // Título e subtítulo
    const nivelMap = { basico: 'Básico', intermediario: 'Intermediário', avancado: 'Avançado' };
    _setEl(modal, '#mcv-titulo', c.titulo || '—', 'text');
    _setEl(modal, '#mcv-sub',
      [c.categoria, nivelMap[c.nivel]].filter(Boolean).join(' · ') || 'Sem categoria',
      'text'
    );

    // Badges de status e configurações
    const fmtLabel = { ead: 'EAD', hibrido: 'Híbrido', presencial: 'Presencial' };
    _setEl(modal, '#mcv-badges',
      _statusBadge(status) +
      `<span class="badge badge-blue">${fmtLabel[c.formato] || 'EAD'}</span>` +
      (c.config?.obrigatorio ? `<span class="badge badge-amber">Obrigatório</span>` : '') +
      (c.config?.certificado ? `<span class="badge badge-green">Certificado</span>` : ''),
      'html'
    );

    // Descrição
    _setEl(modal, '#mcv-desc', c.descricao || 'Sem descrição.', 'text');

    // Métricas numéricas
    const metric = (v, l, color = 'var(--text)') =>
      `<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 12px;text-align:center">
        <div style="font-size:18px;font-weight:700;color:${color}">${v}</div>
        <div style="font-size:10px;color:var(--text4);margin-top:2px">${l}</div>
      </div>`;
    _setEl(modal, '#mcv-metrics',
      metric(c.carga ? c.carga + 'h' : '—', 'Carga') +
      metric(mods,  'Módulos') +
      metric(aulas, 'Aulas') +
      metric(prog + '%', 'Progresso', prog > 0 ? 'var(--green-d,#15803d)' : 'var(--text)'),
      'html'
    );

    // Detalhes textuais
    const detail = (l, v) =>
      `<div style="font-size:12px"><span style="color:var(--text4)">${l}:</span> <span style="color:var(--text);font-weight:500">${v}</span></div>`;
    const valDesc = c.validadeAte
      ? (() => {
          const diff = Math.ceil((new Date(c.validadeAte) - new Date()) / 86400000);
          return diff < 0
            ? `<span style="color:var(--red)">Expirado em ${_fmtDate(c.validadeAte)}</span>`
            : `${_fmtDate(c.validadeAte)} (${diff}d)`;
        })()
      : 'Sem validade';
    const restricoes = Storage.Restricoes.porCurso(id);
    _setEl(modal, '#mcv-details',
      detail('Materiais',   mats) +
      detail('Acessos',     restricoes.length ? restricoes.length + ' restrição(ões)' : 'Todos') +
      detail('Validade',    valDesc) +
      detail('Prazo',       c.prazo ? c.prazo + ' dias' : '—') +
      detail('Criado em',   _fmtDate(c.criadoEm)) +
      detail('Publicado em',_fmtDate(c.publicadoEm)),
      'html'
    );

    // Chips de configurações ativas
    const cfg = c.config || {};
    const chips = [
      cfg.obrigatorio          && 'Obrigatório',
      cfg.certificado          && 'Certificado',
      cfg.avaliacao            && `Avaliação (mín. ${cfg.notaMin || 70}%)`,
      cfg.sequencial           && 'Sequencial',
      cfg.progresso            && 'Exibe progresso',
      cfg.ocultar              && 'Ocultar pós-conclusão',
    ].filter(Boolean);

    const cfgWrap = modal.querySelector('#mcv-config-wrap');
    if (cfgWrap) {
      if (chips.length) {
        _setEl(modal, '#mcv-config',
          chips.map(t =>
            `<span style="font-size:11px;background:var(--bg);border:1px solid var(--border);border-radius:99px;padding:3px 10px;color:var(--text3)">${t}</span>`
          ).join(''),
          'html'
        );
        cfgWrap.style.display = 'block';
      } else {
        cfgWrap.style.display = 'none';
      }
    }

    modal.classList.add('open');
  }

  /**
   * Helper para setar conteúdo de um elemento dentro de um container.
   * @param {Element} container
   * @param {string}  sel
   * @param {string}  valor
   * @param {'text'|'html'} modo
   */
  function _setEl(container, sel, valor, modo = 'text') {
    const el = container.querySelector(sel);
    if (!el) return;
    if (modo === 'html') el.innerHTML = valor;
    else el.textContent = valor;
  }

  // ══════════════════════════════════════════════════════════════
  // DRAWER DE EDIÇÃO (delega ao CursoDrawer)
  // ══════════════════════════════════════════════════════════════

  /**
   * Abre o drawer lateral de edição do curso.
   * Delega ao CursoDrawer que gerencia o iframe do wizard.
   * @param {string} id
   */
  function abrirEdit(id) {
    if (typeof CursoDrawer !== 'undefined') {
      CursoDrawer.abrir(id);
    } else {
      console.warn('[GestaoCursos] CursoDrawer não encontrado.');
    }
  }

  // ══════════════════════════════════════════════════════════════
  // LOG DE ATIVIDADES RECENTES
  // ══════════════════════════════════════════════════════════════

  /**
   * Persiste uma atividade via Storage.Atividades.
   * MIGRAÇÃO: Storage.Atividades.registrar substituirá por POST /api/v1/atividades
   * @param {{ tipo: string, cursoId?: string, materialNome?: string }} ev
   */
  function _logAtividade(ev) {
    Storage.Atividades.registrar(ev);
  }

  /**
   * Renderiza o feed de atividades recentes no elemento #gc-atividades.
   */
  function renderAtividades() {
    const wrap = document.getElementById('gc-atividades');
    if (!wrap) return;

    // Agrega atividades de múltiplas fontes
    const ativ = [];

    Storage.Atividades.listar().forEach(a => ativ.push(a));

    // Inclui criação/publicação de cursos como atividades implícitas
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

    const tipoLabel = {
      criou:    { label: 'Curso criado',        cls: 'badge-blue'  },
      publicou: { label: 'Curso publicado',     cls: 'badge-green' },
      arquivou: { label: 'Curso arquivado',     cls: 'badge-amber' },
      duplicou: { label: 'Curso duplicado',     cls: 'badge-gray'  },
      editou:   { label: 'Curso editado',       cls: 'badge-blue'  },
      material: { label: 'Material adicionado', cls: 'badge-blue'  },
    };

    wrap.innerHTML = top.map(a => {
      const curso = a.cursoId ? Storage.Cursos.obter(a.cursoId) : null;
      const cfg   = tipoLabel[a.tipo] || { label: a.tipo, cls: 'badge-gray' };
      const nome  = a.materialNome
        ? `${curso ? _x(curso.titulo) + ' — ' : ''}${_x(a.materialNome)}`
        : (curso ? _x(curso.titulo) : '—');
      const diff  = Math.floor((Date.now() - new Date(a.ts)) / 60000);
      const tempo = diff < 1 ? 'Agora'
        : diff < 60     ? `${diff}min`
        : diff < 1440   ? `${Math.floor(diff / 60)}h`
        : _fmtDate(a.ts);

      return `
        <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
          <span class="badge ${cfg.cls}" style="white-space:nowrap;flex-shrink:0">${cfg.label}</span>
          <span style="flex:1;font-size:12px;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${nome}</span>
          <span style="font-size:11px;color:var(--text4);flex-shrink:0">${tempo}</span>
        </div>`;
    }).join('') + '<div style="padding-top:2px"></div>';
  }

  // ══════════════════════════════════════════════════════════════
  // EXPORTAÇÃO CSV
  // ══════════════════════════════════════════════════════════════

  /**
   * Exporta a lista de cursos como CSV com BOM UTF-8.
   * Compatível com Excel pt-BR.
   */
  function exportar() {
    const lista = Storage.Cursos.listar();
    const rows  = [['ID', 'Título', 'Categoria', 'Formato', 'Carga (h)', 'Status', 'Publicado', 'Criado em']];

    lista.forEach(c => rows.push([
      c.id,
      c.titulo       || '',
      c.categoria    || '',
      c.formato      || 'ead',
      c.carga        || 0,
      _resolveStatus(c),
      c.publicadoEm  || '',
      c.criadoEm     || '',
    ]));

    const csv  = rows.map(r =>
      r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `cursos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ══════════════════════════════════════════════════════════════
  // REFRESH E SINCRONIZAÇÃO
  // ══════════════════════════════════════════════════════════════

  /**
   * Re-renderiza todos os componentes do módulo.
   * Também atualiza contadores do dashboard global.
   */
  function refresh() {
    renderStats();
    renderTabela();
    renderAtividades();
    _popularFiltroCategoria();
    _sincronizarDashboard();
  }

  /**
   * Atualiza os contadores do dashboard global, se visíveis.
   * Comunicação unidirecional: Cursos → Dashboard (via DOM).
   */
  function _sincronizarDashboard() {
    const _lista = Storage.Cursos.listar();
    const el = document.getElementById('ds-cursos');
    if (el) el.textContent = _lista.length;

    const ep = document.getElementById('ds-publicados');
    if (ep) ep.textContent = _lista.filter(c => c.status === 'publicado').length;
  }

  // ══════════════════════════════════════════════════════════════
  // PONTO DE ENTRADA
  // ══════════════════════════════════════════════════════════════

  /**
   * Inicializa o módulo. Chamado pelo Admin.go('cursos').
   * Configura estado inicial e renderiza todos os componentes.
   */
  function init() {
    _selecionados.clear();
    _atualizarBotoesLote();
    _popularFiltroCategoria();
    renderStats();
    renderTabela();
    renderAtividades();
    if (typeof IFT !== 'undefined') IFT.init();
  }

  // ══════════════════════════════════════════════════════════════
  // API PÚBLICA DO MÓDULO
  // ══════════════════════════════════════════════════════════════
  return {
    // Ciclo de vida
    init,
    refresh,

    // Renderização
    renderTabela,
    renderStats,
    renderAtividades,

    // Seleção
    toggleSel,
    toggleSelAll,

    // Ações em lote
    publicarLote,
    arquivarLote,
    excluirLote,

    // Ações individuais
    publicarCurso,
    despublicarCurso,
    arquivarCurso,
    excluirCurso,
    duplicarCurso,
    visualizar,
    abrirEdit,

    // Menu
    toggleMenu,
    closeMenus,

    // Utilitários
    exportar,
  };
})();
