/**
 * player.js — Player de aula e índice lateral do curso
 */

/* global Storage, AlunoState, AlunoUtils, AlunoNav, AlunoCertificados */

var AlunoPlayer = (() => {
  'use strict';

  const { ICON_CHECK, x, toast, toEmbed, tipoLabel } = AlunoUtils;

  function renderPlayer({ cursoId, aulaId } = {}) {
    const cur = AlunoState.getCur();
    if (cursoId) AlunoState.setCur({ cursoId });
    if (aulaId)  AlunoState.setCur({ aulaId });

    const state = AlunoState.getCur();
    if (!state.cursoId) return;

    const me     = AlunoState.getMe();
    const curso  = Storage.Cursos.obter(state.cursoId);
    const aula   = state.aulaId ? Storage.Aulas.obter(state.aulaId) : null;
    const modulos = Storage.Modulos.listarPorCurso(state.cursoId);
    const todas  = modulos.flatMap(m => Storage.Aulas.listarPorModulo(m.id));
    const idx    = todas.findIndex(a => a.id === state.aulaId);
    const pct    = Storage.Progresso.pctCurso(me.id, state.cursoId);
    const conc   = Storage.Progresso.isConcluida(me.id, state.aulaId || '');

    document.getElementById('playerCursoNome').textContent = curso?.titulo || '';
    document.getElementById('playerTopPct').textContent    = pct + '%';
    document.getElementById('playerTopFill').style.width   = pct + '%';
    document.getElementById('playerTopFill').className     = 'prog-fill' + (pct === 100 ? ' g' : '');

    document.getElementById('btnVoltarPlayer').onclick = () => AlunoNav.go('cursos');

    _renderConteudo(aula, conc);
    _renderIndice(modulos, state.aulaId);

    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    btnPrev.disabled = idx <= 0;
    btnNext.disabled = idx >= todas.length - 1 || idx < 0;
    btnPrev.onclick  = () => { if (idx > 0)               selAula(todas[idx - 1].id); };
    btnNext.onclick  = () => { if (idx < todas.length - 1) selAula(todas[idx + 1].id); };
  }

  function _renderConteudo(aula, isConc) {
    const screen = document.getElementById('playerScreen');
    const title  = document.getElementById('playerAulaTitulo');
    const meta   = document.getElementById('playerAulaMeta');
    const btn    = document.getElementById('btnConcluir');

    if (!aula) {
      screen.innerHTML = `<div style="color:#8896A9;text-align:center;padding:60px">
        <div style="font-size:3rem;margin-bottom:12px">▶️</div>
        <p>Selecione uma aula no índice</p></div>`;
      title.textContent = '—';
      meta.textContent  = '';
      return;
    }

    title.textContent = aula.titulo;
    meta.textContent  = `${tipoLabel(aula.tipo)}${aula.duracao ? ' · ' + aula.duracao + ' min' : ''}`;

    switch (aula.tipo) {
      case 'video': {
        const url = toEmbed(aula.conteudo);
        screen.innerHTML = url
          ? `<iframe src="${url}" style="width:100%;height:325px;border:none;display:block"
              allowfullscreen allow="accelerometer;autoplay;encrypted-media;picture-in-picture"></iframe>`
          : `<div style="color:#8896A9;padding:60px;text-align:center">URL inválida ou não configurada</div>`;
        break;
      }
      case 'texto':
        screen.innerHTML = `<div class="player-text-body">${aula.conteudo || '<p>Sem conteúdo.</p>'}</div>`;
        break;
      case 'pdf':
        screen.innerHTML = aula.conteudo
          ? `<iframe src="${x(aula.conteudo)}" style="width:100%;height:380px;border:none;display:block"></iframe>`
          : `<div style="color:#8896A9;padding:60px;text-align:center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF não configurado</div>`;
        break;
      case 'link':
        screen.innerHTML = `<div style="text-align:center;padding:70px 30px">
          <div style="font-size:2.5rem;margin-bottom:14px"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>
          <p style="color:#8896A9;margin-bottom:20px;font-size:.88rem">Material em site externo</p>
          <a href="${x(aula.conteudo || '#')}" target="_blank" rel="noopener" class="btn btn-primary btn-lg">
            Abrir material ↗
          </a></div>`;
        break;
      default:
        screen.innerHTML = `<div style="color:#8896A9;padding:60px;text-align:center">Tipo não suportado</div>`;
    }

    btn.className = `btn ${isConc ? 'btn-success' : 'btn-primary'}`;
    btn.innerHTML = `<span class="btn-icon">${ICON_CHECK}</span> ${isConc ? 'Concluída' : 'Marcar como concluída'}`;
    btn.onclick   = () => _toggleConc(aula.id);
  }

  function _toggleConc(aulaId) {
    const me  = AlunoState.getMe();
    const cur = AlunoState.getCur();
    const era = Storage.Progresso.isConcluida(me.id, aulaId);
    if (era) {
      Storage.Progresso.desmarcar(me.id, aulaId);
      toast('Desmarcada.', 'i');
    } else {
      Storage.Progresso.marcar(me.id, aulaId);
      toast('Aula concluída!', 's');
      if (Storage.Progresso.cursoConcluido(me.id, cur.cursoId)) {
        setTimeout(AlunoCertificados.mostrarCertificado, 700);
      }
    }
    renderPlayer({});
  }

  function _renderIndice(modulos, aulaAtualId) {
    const me   = AlunoState.getMe();
    const cur  = AlunoState.getCur();
    const wrap = document.getElementById('ci-body');
    const pct  = Storage.Progresso.pctCurso(me.id, cur.cursoId);
    const concs = Storage.Progresso.concluidas(me.id);

    document.getElementById('ci-pct-fill').style.width = pct + '%';
    document.getElementById('ci-pct-num').textContent  = pct + '%';

    wrap.innerHTML = modulos.map(m => {
      const aulas   = Storage.Aulas.listarPorModulo(m.id);
      const modConc = aulas.filter(a => concs.includes(a.id)).length;
      return `
      <div class="ci-mod-head">
        <span>${m.ordem}. ${x(m.titulo)}</span>
        <span style="font-weight:400;color:var(--t4)">${modConc}/${aulas.length}</span>
      </div>
      ${aulas.map(a => {
        const done   = concs.includes(a.id);
        const active = a.id === aulaAtualId;
        return `<div class="ci-aula ${active ? 'active' : ''} ${done ? 'done' : ''}"
          onclick="Aluno.selAula('${a.id}')">
          <div class="ci-dot">${done ? '<span class="ci-done-icon"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>' : ''}</div>
          <div class="ci-aula-name">${x(a.titulo)}</div>
          ${a.duracao ? `<div class="ci-aula-dur">${a.duracao}m</div>` : ''}
        </div>`;
      }).join('')}`;
    }).join('');
  }

  function selAula(aulaId) {
    AlunoState.setCur({ aulaId });
    renderPlayer({ aulaId });
  }

  function iniciarCurso(cursoId) {
    const modulos = Storage.Modulos.listarPorCurso(cursoId);
    if (!modulos.length) { toast('Este curso não tem conteúdo ainda.', 'i'); return; }
    const todas = modulos.flatMap(m => Storage.Aulas.listarPorModulo(m.id));
    if (!todas.length) { toast('Nenhuma aula cadastrada.', 'i'); return; }
    const me   = AlunoState.getMe();
    const conc = Storage.Progresso.concluidas(me.id);
    const prox = todas.find(a => !conc.includes(a.id)) || todas[0];
    abrirAula(cursoId, prox.id);
  }

  function abrirAula(cursoId, aulaId) {
    AlunoState.setCur({ cursoId, aulaId });
    AlunoNav.go('player', { cursoId, aulaId });
  }

  return { renderPlayer, selAula, iniciarCurso, abrirAula };
})();
