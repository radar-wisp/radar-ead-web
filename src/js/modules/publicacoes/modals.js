/**
 * modals.js — Modais de Publicação (4 tabs) e Comunicado
 * Responsabilidade única: abrir/popular modais, tabs internas, seletores
 * de modo e visibilidade e montagem dos campos do formulário.
 */

/* global Storage, PubUtils, PubState */

var PubModals = (() => {
  'use strict';

  const x       = PubUtils.x;
  const fmtDate = PubUtils.fmtDate;

  /* ── Modal nova publicação ──────────────────────────────────── */
  function abrirModal() {
    PubState.setEditId(null); PubState.setModo('imediato'); PubState.setVis('todos');
    document.getElementById('mpub-titulo').textContent = 'Nova Publicação';
    document.getElementById('mpub-sub').textContent = '';
    _resetModal();
    tabModal(0, document.querySelector('#modal-publicacao .mc-tab'));
    document.getElementById('modal-publicacao').classList.add('open');
  }

  function abrirEdit(id) {
    const p = Storage.Publicacoes.obter(id); if (!p) return;
    PubState.setEditId(id);
    document.getElementById('mpub-titulo').textContent = 'Editar Publicação';
    document.getElementById('mpub-sub').textContent = `Criado em ${fmtDate(p.criadoEm)}`;
    _resetModal();
    const sv = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v || ''; };
    sv('mpub-tipo', p.tipo);
    sv('mpub-titulo-custom', p.titulo !== PubUtils.getTituloRef(p.tipo, p.refId) ? p.titulo : '');
    sv('mpub-resp', p.responsavel || 'Admin');
    sv('mpub-data-ini', p.dataAgendada || p.dataPublicacao ? (p.dataAgendada || p.dataPublicacao).slice(0, 16) : '');
    sv('mpub-data-exp', p.dataExpiracao ? p.dataExpiracao.slice(0, 16) : '');

    _loadRefOptions(p.tipo, p.refId);
    _loadCursoTurmaRel(p.cursoId, p.turmaId);

    // Modo
    const modoBtn = document.querySelector(`.mpub-mode-btn[data-mode="${p.status === 'agendado' ? 'agendado' : p.status === 'rascunho' ? 'rascunho' : 'imediato'}"]`);
    if (modoBtn) setModo(modoBtn);

    // Visibilidade
    const visBtn = document.querySelector(`.mpub-vis-btn[data-vis="${p.visibilidade || 'todos'}"]`);
    if (visBtn) setVis(visBtn, p.visRefId);

    _renderConfigPub(p);
    tabModal(0, document.querySelector('#modal-publicacao .mc-tab'));
    document.getElementById('modal-publicacao').classList.add('open');
  }

  function _resetModal() {
    ['mpub-tipo', 'mpub-ref', 'mpub-titulo-custom', 'mpub-data-ini', 'mpub-data-exp'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    document.getElementById('mpub-resp').value = 'Admin';
    PubState.setModo('imediato'); PubState.setVis('todos');
    document.querySelectorAll('.mpub-mode-btn').forEach(b => { b.style.background = 'var(--surface)'; b.style.color = 'var(--text3)'; });
    const im = document.querySelector('.mpub-mode-btn[data-mode="imediato"]');
    if (im) { im.style.background = 'var(--blue)'; im.style.color = '#fff'; }
    document.querySelectorAll('.mpub-vis-btn').forEach(b => { b.style.background = 'var(--surface)'; b.style.color = 'var(--text3)'; });
    const tod = document.querySelector('.mpub-vis-btn[data-vis="todos"]');
    if (tod) { tod.style.background = 'var(--blue)'; tod.style.color = '#fff'; }
    const vsr = document.getElementById('mpub-vis-sel-wrap'); if (vsr) vsr.style.display = 'none';
    const vti = document.getElementById('mpub-vis-todos-info'); if (vti) vti.style.display = 'block';
    document.getElementById('mpub-modo-info').textContent = 'O conteúdo será publicado imediatamente ao salvar.';
    _loadCursoTurmaRel();
    _renderConfigPub({});
    const refSel = document.getElementById('mpub-ref'); if (refSel) refSel.innerHTML = '<option value="">Selecione o tipo primeiro...</option>';
  }

  function _loadCursoTurmaRel(cursoId, turmaId) {
    const sC = document.getElementById('mpub-curso-rel');
    const sT = document.getElementById('mpub-turma-rel');
    if (sC) {
      const cur = Storage.Cursos.listar();
      sC.innerHTML = '<option value="">Nenhum</option>' +
        cur.map(c => `<option value="${x(c.id)}" ${c.id === cursoId ? 'selected' : ''}>${x(c.titulo)}</option>`).join('');
    }
    if (sT) {
      const tur = Storage.Turmas.listar();
      sT.innerHTML = '<option value="">Nenhuma</option>' +
        tur.map(t => `<option value="${x(t.id)}" ${t.id === turmaId ? 'selected' : ''}>${x(t.nome)}</option>`).join('');
    }
  }

  function _loadRefOptions(tipo, selectedId) {
    const tipoVal = tipo || document.getElementById('mpub-tipo')?.value;
    const sel = document.getElementById('mpub-ref'); if (!sel) return;
    let opts = [];
    if (tipoVal === 'curso')      opts = Storage.Cursos.listar().map(c => ({ id: c.id, nome: c.titulo }));
    if (tipoVal === 'material')   opts = Storage.Materiais.listar().map(m => ({ id: m.id, nome: m.nome }));
    if (tipoVal === 'avaliacao')  opts = Storage.Avaliacoes.listar().map(a => ({ id: a.id, nome: a.nome }));
    if (tipoVal === 'comunicado') opts = Storage.Comunicados.listar().map(c => ({ id: c.id, nome: c.titulo }));
    sel.innerHTML = '<option value="">Selecione...</option>' +
      opts.map(o => `<option value="${x(o.id)}" ${o.id === selectedId ? 'selected' : ''}>${x(o.nome)}</option>`).join('');
  }

  function _renderConfigPub(p) {
    const wrap = document.getElementById('mpub-config-body'); if (!wrap) return;
    const row = (id, lbl, desc, val) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px">${lbl}</div>
          <div style="font-size:11px;color:var(--text4)">${desc}</div>
        </div>
        <div id="${id}" class="toggle ${val ? 'on' : ''}"
          onclick="this.classList.toggle('on');this.querySelector('span').style.left=this.classList.contains('on')?'21px':'3px';this.style.background=this.classList.contains('on')?'var(--blue)':'var(--border2)'"
          style="position:relative;width:40px;height:22px;background:${val ? 'var(--blue)' : 'var(--border2)'};border-radius:11px;cursor:pointer;flex-shrink:0">
          <span style="position:absolute;top:3px;left:${val ? 21 : 3}px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></span>
        </div>
      </div>`;
    wrap.innerHTML =
      row('mpubcfg-auto',     'Liberação automática',       'Libera acesso ao publicar',                  p.liberarAuto !== false) +
      row('mpubcfg-ocultar',  'Ocultar após prazo',         'Torna invisível após data de expiração',     p.ocultarAposPrazo) +
      row('mpubcfg-bloquear', 'Bloquear após vencimento',   'Remove acesso quando expirar',               p.bloquearAposVencimento !== false) +
      row('mpubcfg-notif',    'Notificar usuários',         'Envia aviso ao liberar (futura integração)',  p.notificarUsuarios);
  }

  /* ── Selector de modo ───────────────────────────────────────── */
  function setModo(btn) {
    PubState.setModo(btn.dataset.mode);
    document.querySelectorAll('.mpub-mode-btn').forEach(b => { b.style.background = 'var(--surface)'; b.style.color = 'var(--text3)'; });
    btn.style.background = 'var(--blue)'; btn.style.color = '#fff';

    const info = document.getElementById('mpub-modo-info');
    const dataWrap = document.getElementById('mpub-data-ini-wrap');
    const modoAtual = PubState.getModo();
    if (modoAtual === 'imediato') {
      if (info) info.textContent = 'O conteúdo será publicado imediatamente ao salvar.';
      if (dataWrap) dataWrap.style.opacity = '.4';
    } else if (modoAtual === 'agendado') {
      if (info) info.textContent = 'Informe a data e hora de publicação desejada.';
      if (dataWrap) dataWrap.style.opacity = '1';
    } else {
      if (info) info.textContent = 'Será salvo como rascunho — não ficará visível.';
      if (dataWrap) dataWrap.style.opacity = '.4';
    }
  }

  /* ── Selector de visibilidade ───────────────────────────────── */
  function setVis(btn, selectedId) {
    PubState.setVis(btn.dataset.vis);
    document.querySelectorAll('.mpub-vis-btn').forEach(b => { b.style.background = 'var(--surface)'; b.style.color = 'var(--text3)'; });
    btn.style.background = 'var(--blue)'; btn.style.color = '#fff';

    const selWrap = document.getElementById('mpub-vis-sel-wrap');
    const todInfo = document.getElementById('mpub-vis-todos-info');
    const lbl     = document.getElementById('mpub-vis-lbl');
    const selRef  = document.getElementById('mpub-vis-ref');
    const visAtual = PubState.getVis();

    if (visAtual === 'todos') {
      if (selWrap) selWrap.style.display = 'none';
      if (todInfo) todInfo.style.display = 'block';
    } else {
      if (todInfo) todInfo.style.display = 'none';
      if (selWrap) selWrap.style.display = 'block';
      let opts = [], labelTxt = 'Selecione';
      if (visAtual === 'turma')       { opts = Storage.Turmas.listar().map(t => ({ id: t.id, nome: t.nome })); labelTxt = 'Turma'; }
      if (visAtual === 'setor')       { opts = Storage.Setores.listar().map(s => ({ id: s.id, nome: s.nome })); labelTxt = 'Setor'; }
      if (visAtual === 'equipe')      { opts = Storage.Equipes.listar().map(e => ({ id: e.id, nome: e.nome })); labelTxt = 'Equipe'; }
      if (visAtual === 'colaborador') { opts = Storage.Alunos.listar().filter(a => a.ativo).map(a => ({ id: a.id, nome: a.nome })); labelTxt = 'Colaborador'; }
      if (lbl) lbl.textContent = labelTxt + ' *';
      if (selRef) {
        selRef.innerHTML = '<option value="">Selecione...</option>' +
          opts.map(o => `<option value="${x(o.id)}" ${o.id === selectedId ? 'selected' : ''}>${x(o.nome)}</option>`).join('');
      }
    }
  }

  /* ── Tabs ───────────────────────────────────────────────────── */
  function tabModal(idx, btn) {
    document.querySelectorAll('#modal-publicacao .mc-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
    document.querySelectorAll('#modal-publicacao .mc-pane').forEach((p, i) => p.classList.toggle('active', i === idx));
  }

  /* ── Modal comunicado ───────────────────────────────────────── */
  function abrirComunicado(id) {
    PubState.setComEditId(id || null);
    const c = id ? Storage.Comunicados.obter(id) : null;
    document.getElementById('mcom-titulo').textContent = id ? 'Editar Comunicado' : 'Novo Comunicado';
    document.getElementById('mcom-sub').textContent = id ? `Criado em ${fmtDate(c?.criadoEm)}` : '';
    const sv = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v || ''; };
    sv('mcom-tit', c?.titulo); sv('mcom-msg', c?.mensagem);
    sv('mcom-prio', c?.prioridade || 'normal'); sv('mcom-resp', c?.responsavel || 'Admin');
    sv('mcom-exp', c?.dataExpiracao ? c.dataExpiracao.slice(0, 10) : '');
    document.getElementById('modal-comunicado').classList.add('open');
  }

  return {
    abrirModal, abrirEdit, tabModal, setModo, setVis,
    _loadRefOptions, abrirComunicado,
  };
})();
