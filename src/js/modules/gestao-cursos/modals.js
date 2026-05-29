/**
 * modals.js — Modal de visualização rápida de curso
 * Responsabilidade única: popular e abrir/fechar #modal-curso-view.
 */

/* global Storage, CursosUtils, EadUtils */

var CursosModals = (() => {
  'use strict';

  const _x       = CursosUtils.escapeHtml;
  const _fmtDate = CursosUtils.fmtDate;

  function _setEl(container, sel, valor, modo = 'text') {
    const el = container.querySelector(sel);
    if (!el) return;
    if (modo === 'html') el.innerHTML = valor;
    else el.textContent = valor;
  }

  function visualizar(id) {
    const c = Storage.Cursos.obter(id);
    if (!c) return;

    const modsArr = c.modulos?.length ? c.modulos : Storage.Modulos.listarPorCurso(id);
    const mods    = modsArr.length;
    const aulas   = c.modulos?.length
      ? c.modulos.reduce((s, m) => s + (m.aulas?.length || 0), 0)
      : Storage.Aulas.totalPorCurso(id);
    const mats    = (c.materiais?.filter(m => m.tipo !== 'quiz').length) || Storage.Materiais.listarPorCurso(id).length;
    const status  = CursosUtils.resolveStatus(c);
    const prog    = CursosUtils.calcProgresso(id);

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

    const nivelMap = { basico: 'Básico', intermediario: 'Intermediário', avancado: 'Avançado' };
    _setEl(modal, '#mcv-titulo', c.titulo || '—', 'text');
    _setEl(modal, '#mcv-sub', [c.categoria, nivelMap[c.nivel]].filter(Boolean).join(' · ') || 'Sem categoria', 'text');

    const fmtLabel = { ead: 'EAD', hibrido: 'Híbrido', presencial: 'Presencial' };
    _setEl(modal, '#mcv-badges',
      CursosUtils.statusBadge(status) +
      `<span class="badge badge-blue">${fmtLabel[c.formato] || 'EAD'}</span>` +
      (c.config?.obrigatorio ? `<span class="badge badge-amber">Obrigatório</span>` : '') +
      (c.config?.certificado ? `<span class="badge badge-green">Certificado</span>` : ''),
      'html'
    );

    _setEl(modal, '#mcv-desc', c.descricao || 'Sem descrição.', 'text');

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
      detail('Materiais',    mats) +
      detail('Acessos',      restricoes.length ? restricoes.length + ' restrição(ões)' : 'Todos') +
      detail('Validade',     valDesc) +
      detail('Prazo',        c.prazo ? c.prazo + ' dias' : '—') +
      detail('Criado em',    _fmtDate(c.criadoEm)) +
      detail('Publicado em', _fmtDate(c.publicadoEm)),
      'html'
    );

    const cfg   = c.config || {};
    const chips = [
      cfg.obrigatorio && 'Obrigatório',
      cfg.certificado && 'Certificado',
      cfg.avaliacao   && `Avaliação (mín. ${cfg.notaMin || 70}%)`,
      cfg.sequencial  && 'Sequencial',
      cfg.progresso   && 'Exibe progresso',
      cfg.ocultar     && 'Ocultar pós-conclusão',
    ].filter(Boolean);

    const cfgWrap = modal.querySelector('#mcv-config-wrap');
    if (cfgWrap) {
      if (chips.length) {
        _setEl(modal, '#mcv-config',
          chips.map(t => `<span style="font-size:11px;background:var(--bg);border:1px solid var(--border);border-radius:99px;padding:3px 10px;color:var(--text3)">${t}</span>`).join(''),
          'html'
        );
        cfgWrap.style.display = 'block';
      } else {
        cfgWrap.style.display = 'none';
      }
    }

    modal.classList.add('open');
  }

  return { visualizar };
})();
