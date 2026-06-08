/**
 * modals.js — Modais do módulo Turmas: criação/edição e dashboard.
 * Responsabilidade: abrir, popular, alternar abas e fechar modais.
 *
 * @module TurmasModals
 */

/* global Storage, TurmasState, TurmasUtils */
/* exported TurmasModals */

var TurmasModals = (() => {
  'use strict';

  const { el, setTxt, setVal, fmtDate, x, toast, selectPrompt } = TurmasUtils;

  // ── Helpers de modal ─────────────────────────────────────────

  function _open(id)  { el(id)?.classList.add('open'); }
  function _close(id) { el(id)?.classList.remove('open'); }

  // ── Select de cursos ─────────────────────────────────────────

  function _popularSelectCursos(selectedId) {
    const sel = el('mt-curso');
    if (!sel) return;
    sel.innerHTML =
      '<option value="">Selecione um curso...</option>' +
      Storage.Cursos.listar().map(c =>
        `<option value="${x(c.id)}" ${c.id === selectedId ? 'selected' : ''}>${x(c.titulo)}</option>`
      ).join('');
  }

  // ── Tabs ─────────────────────────────────────────────────────

  function tabModal(idx, btn) {
    document.querySelectorAll('.mc-tab').forEach((t, i) => {
      t.classList.toggle('active', i === idx);
    });
    document.querySelectorAll('#modal-turma .mc-pane').forEach((p, i) => {
      p.classList.toggle('active', i === idx);
    });
    if (idx === 1) TurmasModals.renderListaAlunos();
  }

  // ── Lista de alunos ──────────────────────────────────────────

  function renderListaAlunos(filtro) {
    const busca = (filtro || el('mt-aluno-busca')?.value || '').toLowerCase().trim();
    let alunos  = Storage.Alunos.listar().filter(a => a.ativo);

    if (busca) alunos = alunos.filter(a =>
      a.nome?.toLowerCase().includes(busca) ||
      a.email?.toLowerCase().includes(busca)
    );

    const wrap = el('mt-alunos-lista');
    if (!wrap) return;

    if (!alunos.length) {
      wrap.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text4);font-size:13px">Nenhum aluno encontrado</div>';
      _atualizarCount();
      return;
    }

    const sel = TurmasState.alunosSel;
    wrap.innerHTML = alunos.map(al => {
      const selecionado = sel.has(al.id);
      const setor  = al.setorId  ? Storage.Setores.obter(al.setorId)?.nome  || '' : '';
      const equipe = al.equipeId ? Storage.Equipes.obter(al.equipeId)?.nome || '' : '';
      const meta   = [setor, equipe].filter(Boolean).join(' · ');
      return `
        <label style="display:flex;align-items:center;gap:10px;padding:9px 12px;cursor:pointer;transition:background .1s;${selecionado ? 'background:var(--blue-light)' : ''}"
          onmouseover="this.style.background='var(--blue-light)'"
          onmouseout="this.style.background='${selecionado ? 'var(--blue-light)' : ''}'"
          onclick="Turmas._toggleAluno('${al.id}',this)">
          <input type="checkbox" ${selecionado ? 'checked' : ''} style="width:14px;height:14px;accent-color:var(--blue);cursor:pointer" onclick="event.stopPropagation()">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--blue-light);color:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;flex-shrink:0">
            ${(al.nome?.[0] || '?').toUpperCase()}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:500;color:var(--text)">${x(al.nome)}</div>
            <div style="font-size:11px;color:var(--text4)">${x(al.email)}${meta ? ` · ${x(meta)}` : ''}</div>
          </div>
        </label>`;
    }).join('');

    _atualizarCount();
  }

  function _atualizarCount() {
    const e = el('mt-alunos-count');
    if (e) e.textContent = TurmasState.alunosSel.size;
  }

  function _toggleAluno(id, label) {
    const sel = TurmasState.alunosSel;
    const chk = label.querySelector('input[type=checkbox]');
    if (sel.has(id)) {
      sel.delete(id);
      label.style.background = '';
      if (chk) chk.checked = false;
    } else {
      sel.add(id);
      label.style.background = 'var(--blue-light)';
      if (chk) chk.checked = true;
    }
    _atualizarCount();
  }

  // ── Seleções rápidas ─────────────────────────────────────────

  function selecionarPorSetor() {
    const setores = Storage.Setores.listar();
    if (!setores.length) { toast('Nenhum setor cadastrado.', 'i'); return; }
    selectPrompt('Selecionar por setor', setores, (setor) => {
      TurmasState.setorSel = setor.id;
      Storage.Alunos.porSetor(setor.id).forEach(a => TurmasState.alunosSel.add(a.id));
      renderListaAlunos();
      toast(`Alunos do setor "${setor.nome}" adicionados.`, 's');
    });
  }

  function selecionarPorEquipe() {
    const setorId = TurmasState.setorSel;
    if (!setorId) { toast('Selecione um setor primeiro em "Por setor".', 'i'); return; }
    const equipes = Storage.Equipes.listarPorSetor(setorId);
    if (!equipes.length) { toast('Nenhuma equipe vinculada ao setor selecionado.', 'i'); return; }
    selectPrompt('Selecionar por equipe', equipes, (equipe) => {
      Storage.Alunos.porEquipe(equipe.id).forEach(a => TurmasState.alunosSel.add(a.id));
      renderListaAlunos();
      toast(`Alunos da equipe "${equipe.nome}" adicionados.`, 's');
    });
  }

  function selecionarTodos() {
    Storage.Alunos.listar().filter(a => a.ativo).forEach(a => TurmasState.alunosSel.add(a.id));
    renderListaAlunos();
  }

  function limparAlunos() {
    TurmasState.alunosSel.clear();
    renderListaAlunos();
  }

  // ── Modal criação / edição ────────────────────────────────────

  function _resetFormulario() {
    ['mt-nome', 'mt-desc', 'mt-responsavel', 'mt-inicio', 'mt-fim'].forEach(id => setVal(id, ''));
    setVal('mt-limite',   '');
    setVal('mt-status',   'aberta');
  }

  function abrirModal() {
    TurmasState.editId = null;
    TurmasState.resetAlunos();
    setTxt('mt-titulo', 'Nova Turma');
    setTxt('mt-sub',    '');
    _resetFormulario();
    _popularSelectCursos();
    renderListaAlunos();
    tabModal(0, document.querySelector('.mc-tab'));
    _open('modal-turma');
  }

  function abrirEdit(id) {
    const t = Storage.Turmas.obter(id);
    if (!t) return;

    TurmasState.editId = id;
    TurmasState.setAlunos(t.alunos || []);

    setTxt('mt-titulo', 'Editar Turma');
    setTxt('mt-sub',    `Criada em ${fmtDate(t.criadoEm)}`);

    setVal('mt-nome',        t.nome        || '');
    setVal('mt-desc',        t.descricao   || '');
    setVal('mt-responsavel', t.responsavel || '');
    setVal('mt-limite',      t.limiteAlunos || 0);
    setVal('mt-status',      t.status      || 'aberta');
    setVal('mt-inicio',      t.dataInicio ? t.dataInicio.slice(0, 10) : '');
    setVal('mt-fim',         t.dataFim    ? t.dataFim.slice(0, 10)    : '');

    _popularSelectCursos(t.cursoId);
    renderListaAlunos();
    tabModal(0, document.querySelector('.mc-tab'));
    _open('modal-turma');
  }

  function abrirGerenciarAlunos(id) {
    abrirEdit(id);
    setTimeout(() => {
      const tabs = document.querySelectorAll('.mc-tab');
      if (tabs[1]) tabModal(1, tabs[1]);
    }, 50);
  }

  function fecharModal() { _close('modal-turma'); }

  // ── Modal dashboard ──────────────────────────────────────────

  function visualizar(id) {
    const t = Storage.Turmas.obter(id);
    if (!t) return;
    TurmasState.viewingId = id;

    const curso = t.cursoId ? Storage.Cursos.obter(t.cursoId) : null;
    const stats = Storage.Turmas.stats(id);
    const prog  = Storage.Turmas.progresso(id);

    setTxt('td-nome',        t.nome);
    setTxt('td-curso',       curso ? curso.titulo : '—');
    setTxt('td-total',       t.alunos?.length || 0);
    setTxt('td-pct',         prog + '%');
    setTxt('td-pct-label',   prog + '%');
    setTxt('td-concl',       stats.concluidos);
    setTxt('td-pend',        stats.pendentes);
    setTxt('td-encerramento',fmtDate(t.dataFim));

    const bar = el('td-prog-bar');
    if (bar) bar.style.width = prog + '%';

    const wrapper = el('td-participantes');
    if (wrapper) {
      if (!t.alunos?.length) {
        wrapper.innerHTML = '<div style="color:var(--text4);font-size:13px;padding:12px">Nenhum aluno vinculado</div>';
      } else {
        wrapper.innerHTML = t.alunos.map(alunoId => {
          const al   = Storage.Alunos.obter(alunoId);
          if (!al) return '';
          const pct  = t.cursoId ? Storage.Progresso.pctCurso(alunoId, t.cursoId) : 0;
          const done = t.cursoId ? Storage.Progresso.cursoConcluido(alunoId, t.cursoId) : false;
          return `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
              <div style="width:30px;height:30px;border-radius:50%;background:var(--blue-light);color:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;flex-shrink:0;border:1px solid var(--border)">
                ${(al.nome?.[0] || '?').toUpperCase()}
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:500;color:var(--text)">${x(al.nome)}</div>
                <div style="font-size:11px;color:var(--text4)">${x(al.email)}</div>
              </div>
              <div style="min-width:100px">
                <div class="gc-prog-wrap">
                  <div class="gc-prog-bar"><div class="gc-prog-fill" style="width:${pct}%"></div></div>
                  <span class="gc-prog-lbl">${pct}%</span>
                </div>
              </div>
              ${done ? `<span class="badge badge-green" style="flex-shrink:0">✓ Concluído</span>` : ''}
            </div>`;
        }).join('');
      }
    }

    _open('modal-turma-dash');
  }

  return {
    tabModal,
    abrirModal,
    abrirEdit,
    abrirGerenciarAlunos,
    fecharModal,
    visualizar,
    renderListaAlunos,
    selecionarPorSetor,
    selecionarPorEquipe,
    selecionarTodos,
    limparAlunos,
    _toggleAluno,
  };
})();
