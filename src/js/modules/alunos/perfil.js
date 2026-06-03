/**
 * perfil.js — Modal de perfil do aluno (visualização + tabs + bloquear)
 * Responsabilidade: renderizar o perfil completo, tabs e ação de bloquear.
 */

/* global EadUtils, Storage, AlunosState, AlunosTable */
/* exported AlunosPerfil */

var AlunosPerfil = (() => {
  'use strict';

  const _x          = EadUtils.escapeHtml;
  const _fmtDate    = EadUtils.fmtDate;
  const _fmtRelative = EadUtils.fmtRelative;
  const _toast      = EadUtils.toast;

  // ── Abrir perfil ─────────────────────────────────────────────

  function verPerfil(id) {
    const al = Storage.Alunos.obter(id);
    if (!al) return;
    AlunosState.perfilId = id;

    const setor  = al.setorId  ? Storage.Setores.listar().find(s => s.id === al.setorId)  : null;
    const equipe = al.equipeId ? Storage.Equipes.listar().find(e => e.id === al.equipeId) : null;
    const prog   = AlunosTable.progGeral(id);
    const cursos = AlunosTable.cursosDoAluno(id);
    const concl  = cursos.filter(c => Storage.Progresso.cursoConcluido?.(id, c.id)).length;

    // Header
    const av = document.getElementById('pa-avatar');
    if (av) av.textContent = (al.nome?.[0] || '?').toUpperCase();
    _setText('pa-nome',  al.nome);
    _setText('pa-cargo', [al.cargo, setor?.nome].filter(Boolean).join(' · ') || 'Sem cargo');
    _setText('pa-ncursos', cursos.length);
    _setText('pa-prog',    prog + '%');
    _setText('pa-concl',   concl);

    const badge = document.getElementById('pa-status-badge');
    if (badge) badge.innerHTML = AlunosTable.stBadge(al);

    const blqBtn = document.getElementById('pa-btn-bloquear');
    if (blqBtn) blqBtn.textContent = al.ativo ? 'Bloquear' : 'Ativar';

    // Pane 0: Informações
    document.getElementById('pa-info-body').innerHTML = _renderInfo(al);
    document.getElementById('pa-org-body').innerHTML  = _renderOrg(al, setor, equipe);

    const progBar = document.getElementById('pa-prog-bar');
    const progLbl = document.getElementById('pa-prog-lbl');
    if (progBar) progBar.style.width = prog + '%';
    if (progLbl) progLbl.textContent = prog + '%';

    // Pane 1: Cursos
    document.getElementById('pa-cursos-body').innerHTML = _renderCursos(id, cursos);

    // Pane 2: Histórico
    document.getElementById('pa-historico-body').innerHTML = _renderHistorico(id);

    // Pane 3: Turmas
    const turmasBody = document.getElementById('pa-turmas-body');
    if (turmasBody) turmasBody.innerHTML = _renderTurmas(id);

    tabPerfil(0);
    document.getElementById('modal-perfil-aluno')?.classList.add('open');
  }

  function _setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? '';
  }

  // ── Renderização de panes ────────────────────────────────────

  function _renderInfo(al) {
    const rows = [
      ['E-mail',       al.email],
      ['Matrícula',    al.matricula],
      ['Cargo',        al.cargo],
      ['Unidade',      al.unidade],
      ['Último acesso', _fmtRelative(al.ultimoAcesso)],
      ['Cadastrado em', _fmtDate(al.criadoEm)],
    ];
    return rows.map(([lbl, val]) => val
      ? `<div style="margin-bottom:10px">
           <div style="font-size:10px;color:var(--text4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">${lbl}</div>
           <div style="font-size:13px;color:var(--text)">${_x(String(val))}</div>
         </div>`
      : ''
    ).join('');
  }

  function _renderOrg(al, setor, equipe) {
    const rows = [
      ['Setor',  setor?.nome],
      ['Equipe', equipe?.nome],
    ];
    return rows.map(([lbl, val]) => val
      ? `<div style="margin-bottom:10px">
           <div style="font-size:10px;color:var(--text4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">${lbl}</div>
           <div style="font-size:13px;color:var(--text)">${_x(val)}</div>
         </div>`
      : ''
    ).join('') || '<div style="color:var(--text4);font-size:12px">Sem organização definida.</div>';
  }

  function _renderCursos(alunoId, cursos) {
    if (!cursos.length) return '<p style="color:var(--text4);font-size:13px">Nenhum curso disponível.</p>';
    return cursos.map(c => {
      const pct     = Storage.Progresso.pctCurso(alunoId, c.id);
      const concluido = Storage.Progresso.cursoConcluido?.(alunoId, c.id);
      return `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:var(--text)">${_x(c.titulo)}</div>
            <div style="height:4px;background:var(--border);border-radius:2px;margin-top:6px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${concluido ? 'var(--green)' : 'var(--blue)'};border-radius:2px"></div>
            </div>
          </div>
          <span style="font-size:12px;font-weight:600;color:${concluido ? 'var(--green)' : 'var(--blue)'};flex-shrink:0">${pct}%</span>
        </div>`;
    }).join('');
  }

  function _renderHistorico(alunoId) {
    const progs = Storage.Progresso.listar?.()
      ?.filter(p => p.alunoId === alunoId)
      ?.sort((a, b) => new Date(b.concluidaEm || 0) - new Date(a.concluidaEm || 0))
      ?.slice(0, 20) || [];
    if (!progs.length) return '<p style="color:var(--text4);font-size:13px">Nenhuma atividade registrada.</p>';
    const aulas = Storage.Aulas?.listar() || [];
    return progs.map(p => {
      const aula = aulas.find(a => a.id === p.aulaId);
      return `
        <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);font-size:12px">
          <div style="flex:1;color:var(--text2)">${_x(aula?.titulo || p.aulaId)}</div>
          <div style="color:var(--text4);flex-shrink:0">${_fmtRelative(p.concluidaEm)}</div>
        </div>`;
    }).join('');
  }

  function _renderTurmas(alunoId) {
    const turmas = (Storage.Turmas.listar() || [])
      .filter(t => (t.alunos || []).includes(alunoId));
    if (!turmas.length) {
      return '<p style="color:var(--text4);font-size:13px">Aluno não vinculado a nenhuma turma.</p>';
    }
    const cursos = Storage.Cursos.listar();
    return turmas.map(t => {
      const curso = cursos.find(c => c.id === t.cursoId);
      return `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:var(--text)">${_x(t.nome)}</div>
            <div style="font-size:11px;color:var(--text4)">${_x(curso?.titulo || 'Sem curso vinculado')}</div>
          </div>
          <button class="btn btn-ghost btn-sm" style="flex-shrink:0;color:var(--red)"
            onclick="AlunosMod.desvincularTurma('${_x(t.id)}')">Desvincular</button>
        </div>`;
    }).join('');
  }

  // ── Tabs ─────────────────────────────────────────────────────

  function tabPerfil(idx, btn) {
    document.querySelectorAll('#modal-perfil-aluno .mc-tab')
      .forEach((t, i) => t.classList.toggle('active', i === idx));
    ['pa-pane-0', 'pa-pane-1', 'pa-pane-2', 'pa-pane-3'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.style.display = i === idx ? '' : 'none';
    });
  }

  // ── Desvincular turma ─────────────────────────────────────────

  function desvincularTurma(turmaId) {
    const alunoId = AlunosState.perfilId;
    if (!alunoId || !turmaId) return;
    const t = Storage.Turmas.obter(turmaId);
    if (!confirm(`Desvincular aluno da turma "${t?.nome || ''}"?`)) return;

    Storage.Turmas.removerAluno(turmaId, alunoId);
    _toast('Aluno desvinculado da turma.', 'i');

    // Atualiza aba Turmas, contagem de cursos do header e aba Cursos
    const turmasBody = document.getElementById('pa-turmas-body');
    if (turmasBody) turmasBody.innerHTML = _renderTurmas(alunoId);

    const cursos = AlunosTable.cursosDoAluno(alunoId);
    _setText('pa-ncursos', cursos.length);
    const cursosBody = document.getElementById('pa-cursos-body');
    if (cursosBody) cursosBody.innerHTML = _renderCursos(alunoId, cursos);

    // Reflete na tabela principal (coluna "Cursos")
    AlunosTable.render();
  }

  // ── Ações do perfil ───────────────────────────────────────────

  function resetarSenhaModal() {
    const id  = AlunosState.perfilId;
    const nova = prompt('Nova senha:');
    if (!nova || !id) return;
    Storage.Alunos.atualizar(id, { senha: nova });
    _toast('Senha redefinida.', 's');
  }

  function alternarBloqueio() {
    const id = AlunosState.perfilId;
    const al = id ? Storage.Alunos.obter(id) : null;
    if (!al) return;
    const novoAtivo = !al.ativo;
    Storage.Alunos.atualizar(id, {
      ativo: novoAtivo,
      statusAcesso: novoAtivo ? 'ativo' : 'bloqueado',
    });
    const btn = document.getElementById('pa-btn-bloquear');
    if (btn) btn.textContent = novoAtivo ? 'Bloquear' : 'Ativar';
    _toast(novoAtivo ? 'Aluno ativado.' : 'Aluno bloqueado.', 'i');
  }

  return { verPerfil, tabPerfil, resetarSenhaModal, alternarBloqueio, desvincularTurma };
})();
