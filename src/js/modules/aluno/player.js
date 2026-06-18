/**
 * player.js — Player de aula e índice lateral do curso
 *
 * Funcionalidades:
 *  • Índice em accordion (módulos sempre recolhidos; expande/recolhe só com clique manual)
 *  • Avaliação vinculada aparece no final do índice após todos os módulos
 *  • Certificado bloqueado até atingir nota mínima da avaliação (quando config.avaliacao=true)
 *  • Materiais filtrados pela aula atual
 *  • Acesso sequencial (config.sequencial no curso)
 *  • Bloqueio por material obrigatório (config.necessarioAntesDaProxima)
 *  • Bloqueio de material por avaliação obrigatória (config.avaliacaoObrigatoria)
 *  • Compatibilidade de embed: YouTube, Vimeo, Drive, Loom, Panda, MP4
 */

/* global Storage, AlunoState, AlunoUtils, AlunoNav, AlunoCertificados */

var AlunoPlayer = (() => {
  'use strict';

  const { ICON_CHECK, x, toast, toEmbed, tipoLabel } = AlunoUtils;

  // Controla quais módulos estão expandidos — inicia vazio (todos recolhidos)
  const _expandidos = new Set();

  // ID da avaliação sendo exibida no player (null = nenhuma)
  let _aulaAvalId = null;

  function renderPlayer({ cursoId, aulaId } = {}) {
    if (cursoId) AlunoState.setCur({ cursoId });
    if (aulaId !== undefined) AlunoState.setCur({ aulaId });

    const state = AlunoState.getCur();
    if (!state.cursoId) return;

    const me      = AlunoState.getMe();
    const curso   = Storage.Cursos.obter(state.cursoId);
    const aula    = state.aulaId ? Storage.Aulas.obter(state.aulaId) : null;
    const modulos = Storage.Modulos.listarPorCurso(state.cursoId);
    const todas   = modulos.flatMap(m => Storage.Aulas.listarPorModulo(m.id));
    const idx     = todas.findIndex(a => a.id === state.aulaId);
    const pct     = Storage.Progresso.pctCurso(me.id, state.cursoId);
    const conc    = Storage.Progresso.isConcluida(me.id, state.aulaId || '');

    // Avaliação publicada vinculada ao curso (a primeira encontrada)
    const avalCurso = Storage.Avaliacoes
      ? Storage.Avaliacoes.porCurso(state.cursoId).find(a => a.status === 'publicada') || null
      : null;

    document.getElementById('playerCursoNome').textContent = curso?.titulo || '';
    document.getElementById('playerTopPct').textContent    = pct + '%';
    document.getElementById('playerTopFill').style.width   = pct + '%';
    document.getElementById('playerTopFill').className     = 'prog-fill' + (pct === 100 ? ' g' : '');

    document.getElementById('btnVoltarPlayer').onclick = () => AlunoNav.go('cursos');

    // Renderiza conteúdo: aula normal ou tela de avaliação
    if (_aulaAvalId && state.aulaId === '__avaliacao__') {
      _renderAvaliacao(avalCurso, me, state.cursoId, curso);
    } else {
      _renderConteudo(aula, conc, curso, me, todas, idx, avalCurso);
    }

    _renderIndice(modulos, state.aulaId, avalCurso, me, state.cursoId);
    _renderMateriais(state.cursoId, state.aulaId);

    const sequencial = !!(curso?.config?.sequencial);
    const btnPrev    = document.getElementById('btnPrev');
    const btnNext    = document.getElementById('btnNext');

    // Na avaliação, Próximo está desabilitado; Anterior volta à última aula
    const naAvaliacao = state.aulaId === '__avaliacao__';
    btnPrev.disabled  = naAvaliacao ? false : idx <= 0;
    btnNext.disabled  = naAvaliacao ? true  : (idx >= todas.length - 1 || idx < 0);

    btnPrev.onclick = () => {
      if (naAvaliacao) {
        AlunoState.setCur({ aulaId: todas[todas.length - 1]?.id || null });
        _aulaAvalId = null;
        renderPlayer({});
        return;
      }
      if (idx <= 0) return;
      selAula(todas[idx - 1].id);
    };

    btnNext.onclick = () => {
      if (naAvaliacao || idx >= todas.length - 1) return;
      if (_temMaterialObrigatorioNaoVisto(state.cursoId, state.aulaId)) {
        toast('Acesse o material obrigatório antes de avançar.', 'i');
        return;
      }
      if (sequencial && state.aulaId && !Storage.Progresso.isConcluida(me.id, state.aulaId)) {
        toast('Conclua esta aula antes de avançar.', 'i');
        return;
      }
      // Última aula → avança para avaliação (se houver)
      if (idx === todas.length - 1 && avalCurso) {
        _irParaAvaliacao(avalCurso);
        return;
      }
      selAula(todas[idx + 1].id);
    };
  }

  /** Vai para a tela de avaliação do curso */
  function _irParaAvaliacao(av) {
    _aulaAvalId = av.id;
    AlunoState.setCur({ aulaId: '__avaliacao__' });
    renderPlayer({});
  }

  /**
   * Verifica se há algum material com necessarioAntesDaProxima vinculado
   * à aula atual que ainda não foi marcado como visualizado.
   */
  function _temMaterialObrigatorioNaoVisto(cursoId, aulaId) {
    if (!aulaId) return false;
    const me   = AlunoState.getMe();
    const mats = Storage.Materiais.listar().filter(m =>
      (m.status || 'ativo') === 'ativo' &&
      m.aulaId === aulaId &&
      m.config?.necessarioAntesDaProxima === true
    );
    if (!mats.length) return false;
    const vistos = Storage.Progresso.materiaisVistos
      ? Storage.Progresso.materiaisVistos(me.id)
      : [];
    return mats.some(m => !vistos.includes(m.id));
  }

  /**
   * Verifica se o aluno atingiu a nota mínima na avaliação do curso.
   * Retorna true se não há avaliação obrigatória ou se já foi aprovado.
   */
  function _aprovadoNaAvaliacao(me, cursoId, curso) {
    if (!curso?.config?.avaliacao) return true; // avaliação não exigida
    const avs = Storage.Avaliacoes
      ? Storage.Avaliacoes.porCurso(cursoId).filter(a => a.status === 'publicada')
      : [];
    if (!avs.length) return true; // sem avaliação publicada → libera
    const notaMin = curso.config.notaMin ?? 70;
    return avs.some(av => {
      const resps = Storage.Respostas ? Storage.Respostas.porAluno(me.id, av.id) : [];
      return resps.some(r => r.nota >= notaMin);
    });
  }

  function _renderConteudo(aula, isConc, curso, me, todas, idx, avalCurso) {
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
      btn.style.display = 'none';
      return;
    }
    btn.style.display = '';

    title.textContent = aula.titulo;
    meta.textContent  = `${tipoLabel(aula.tipo)}${aula.duracao ? ' · ' + aula.duracao + ' min' : ''}`;

    switch (aula.tipo) {
      case 'video': {
        const embedUrl = toEmbed(aula.conteudo);
        if (embedUrl && /\.mp4(\?|$)/i.test(embedUrl)) {
          screen.innerHTML = `<video src="${x(embedUrl)}" controls
            style="width:100%;height:325px;display:block;background:#000">
            Seu navegador não suporta reprodução de vídeo.</video>`;
        } else if (embedUrl) {
          screen.innerHTML = `<iframe src="${embedUrl}"
            style="width:100%;height:325px;border:none;display:block"
            allowfullscreen allow="accelerometer;autoplay;encrypted-media;picture-in-picture"></iframe>`;
        } else {
          screen.innerHTML = `<div style="color:#8896A9;padding:60px;text-align:center">URL inválida ou não configurada</div>`;
        }
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
    btn.onclick   = () => _toggleConc(aula.id, curso, me);
  }

  /** Renderiza a tela de avaliação do curso no player */
  function _renderAvaliacao(av, me, cursoId, curso) {
    const screen = document.getElementById('playerScreen');
    const title  = document.getElementById('playerAulaTitulo');
    const meta   = document.getElementById('playerAulaMeta');
    const btn    = document.getElementById('btnConcluir');

    title.textContent = av ? av.nome : 'Avaliação do Curso';
    meta.textContent  = av
      ? `${av.questoes?.length || Storage.Questoes.porAvaliacao(av.id).length} questões · nota mín. ${av.notaMinima ?? curso?.config?.notaMin ?? 70}%`
      : '';
    btn.style.display = 'none';

    if (!av) {
      screen.innerHTML = `<div style="color:#8896A9;padding:60px;text-align:center">Avaliação não disponível.</div>`;
      return;
    }

    const respostas = Storage.Respostas ? Storage.Respostas.porAluno(me.id, av.id) : [];
    const melhor    = respostas.length ? Math.max(...respostas.map(r => r.nota)) : null;
    const aprovado  = melhor !== null && melhor >= (av.notaMinima ?? curso?.config?.notaMin ?? 70);
    const tentativas = respostas.length;
    const maxTent    = av.tentativas || 0; // 0 = ilimitado

    const podeResponder = !maxTent || tentativas < maxTent;
    const questoes = Storage.Questoes.porAvaliacao(av.id);

    if (!questoes.length) {
      screen.innerHTML = `<div style="color:#8896A9;padding:60px;text-align:center">Esta avaliação ainda não tem questões cadastradas.</div>`;
      return;
    }

    // Se já respondeu, mostra resultado; senão mostra formulário
    if (tentativas > 0 && !podeResponder) {
      _renderResultadoAvaliacao(screen, melhor, aprovado, av, curso, me, cursoId);
      return;
    }

    // Formulário de questões
    let html = `<div style="padding:16px 20px;overflow-y:auto;max-height:360px">`;
    if (tentativas > 0) {
      html += `<div style="margin-bottom:14px;padding:10px 14px;background:var(--blue-soft);border-radius:var(--radius);font-size:.82rem;color:var(--blue)">
        Melhor nota anterior: <strong>${melhor}%</strong> · ${aprovado ? '✓ Aprovado' : 'Reprovado'} · Tentativa ${tentativas + 1}${maxTent ? ' de ' + maxTent : ''}
      </div>`;
    }
    questoes.forEach((q, i) => {
      html += `<div style="margin-bottom:18px">
        <div style="font-size:.85rem;font-weight:600;color:var(--t1);margin-bottom:8px">${i + 1}. ${x(q.pergunta)}</div>`;
      if (q.tipo === 'multipla' || q.tipo === 'alternativa') {
        (q.alternativas || []).forEach((alt, ai) => {
          html += `<label style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:var(--radius);cursor:pointer;font-size:.82rem;color:var(--t2);margin-bottom:4px;border:1px solid transparent;transition:border-color .15s"
            onmouseover="this.style.borderColor='var(--border-d)'" onmouseout="this.style.borderColor='transparent'">
            <input type="radio" name="q_${q.id}" value="${ai}" style="accent-color:var(--blue)"> ${x(alt)}
          </label>`;
        });
      } else if (q.tipo === 'verdadeiro_falso') {
        ['Verdadeiro', 'Falso'].forEach((opt, oi) => {
          html += `<label style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:var(--radius);cursor:pointer;font-size:.82rem;color:var(--t2);margin-bottom:4px;border:1px solid transparent">
            <input type="radio" name="q_${q.id}" value="${oi}" style="accent-color:var(--blue)"> ${opt}
          </label>`;
        });
      }
      html += `</div>`;
    });
    html += `<button class="btn btn-primary" style="width:100%;margin-top:6px" onclick="Aluno._submeterAvaliacao()">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><polyline points="20 6 9 17 4 12"/></svg>Enviar respostas
    </button></div>`;
    screen.innerHTML = html;
  }

  function _renderResultadoAvaliacao(screen, nota, aprovado, av, curso, me, cursoId) {
    const notaMin = av.notaMinima ?? curso?.config?.notaMin ?? 70;
    const cor     = aprovado ? 'var(--green)' : 'var(--red)';
    screen.innerHTML = `<div style="text-align:center;padding:50px 30px">
      <div style="font-size:3.5rem;font-weight:800;color:${cor};margin-bottom:8px">${nota}%</div>
      <div style="font-size:1rem;font-weight:600;color:${cor};margin-bottom:6px">${aprovado ? '✓ Aprovado!' : '✗ Reprovado'}</div>
      <div style="font-size:.82rem;color:var(--t3);margin-bottom:24px">Nota mínima: ${notaMin}%</div>
      ${aprovado
        ? `<button class="btn btn-success" onclick="Aluno._emitirCertificadoComNota()">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>Ver certificado
           </button>`
        : `<div style="font-size:.82rem;color:var(--t4)">Revise o conteúdo e tente novamente.</div>`
      }
    </div>`;
  }

  /** Submete o formulário de avaliação exibido no player */
  function _submeterAvaliacao() {
    const cur    = AlunoState.getCur();
    const me     = AlunoState.getMe();
    const curso  = Storage.Cursos.obter(cur.cursoId);
    const av     = Storage.Avaliacoes
      ? Storage.Avaliacoes.porCurso(cur.cursoId).find(a => a.status === 'publicada')
      : null;
    if (!av) return;

    const questoes = Storage.Questoes.porAvaliacao(av.id);
    const respostas = {};
    let respondeu = true;
    questoes.forEach(q => {
      const sel = document.querySelector(`input[name="q_${q.id}"]:checked`);
      if (!sel) { respondeu = false; }
      else respostas[q.id] = parseInt(sel.value);
    });

    if (!respondeu) { toast('Responda todas as questões antes de enviar.', 'i'); return; }

    Storage.Respostas.registrar(av.id, me.id, respostas, 0);
    toast('Respostas enviadas!', 's');
    renderPlayer({});
  }

  /** Emite certificado após aprovação — chamado pelo botão na tela de resultado */
  function _emitirCertificadoComNota() {
    const cur   = AlunoState.getCur();
    const me    = AlunoState.getMe();
    const curso = Storage.Cursos.obter(cur.cursoId);
    if (_aprovadoNaAvaliacao(me, cur.cursoId, curso)) {
      AlunoCertificados.mostrarCertificado();
    }
  }

  function _toggleConc(aulaId, curso, me) {
    const cur = AlunoState.getCur();
    const era = Storage.Progresso.isConcluida(me.id, aulaId);
    if (era) {
      Storage.Progresso.desmarcar(me.id, aulaId);
      toast('Desmarcada.', 'i');
    } else {
      Storage.Progresso.marcar(me.id, aulaId);
      toast('Aula concluída!', 's');
      // Só emite certificado automaticamente se não houver avaliação obrigatória pendente
      if (Storage.Progresso.cursoConcluido(me.id, cur.cursoId)) {
        if (_aprovadoNaAvaliacao(me, cur.cursoId, curso)) {
          setTimeout(AlunoCertificados.mostrarCertificado, 700);
        } else if (curso?.config?.avaliacao) {
          toast('Conteúdo concluído! Faça a avaliação para emitir o certificado.', 'i');
        }
      }
    }
    renderPlayer({});
  }

  /**
   * Renderiza o índice lateral com módulos em accordion.
   * Todos iniciam RECOLHIDOS. Expande/recolhe SOMENTE com clique manual.
   * Ao final, exibe o item de avaliação (se o curso tiver avaliação publicada).
   */
  function _renderIndice(modulos, aulaAtualId, avalCurso, me, cursoId) {
    const wrap  = document.getElementById('ci-body');
    const pct   = Storage.Progresso.pctCurso(me.id, cursoId);
    const concs = Storage.Progresso.concluidas(me.id);

    document.getElementById('ci-pct-fill').style.width = pct + '%';
    document.getElementById('ci-pct-num').textContent  = pct + '%';

    const naAvaliacao = aulaAtualId === '__avaliacao__';

    const CHV_DOWN = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
    const CHV_UP   = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';

    let html = modulos.map(m => {
      const aulas    = Storage.Aulas.listarPorModulo(m.id);
      const modConc  = aulas.filter(a => concs.includes(a.id)).length;
      const expanded = _expandidos.has(m.id);

      return `
      <div class="ci-mod-head ci-mod-toggle" onclick="Aluno.toggleModulo('${m.id}')" style="cursor:pointer;user-select:none">
        <span style="flex:1;min-width:0">${m.ordem}. ${x(m.titulo)}</span>
        <span style="font-weight:400;color:var(--t4);margin-right:6px">${modConc}/${aulas.length}</span>
        <span style="color:var(--t3);flex-shrink:0">${expanded ? CHV_UP : CHV_DOWN}</span>
      </div>
      <div class="ci-mod-body" id="ci-mod-${m.id}" style="display:${expanded ? 'block' : 'none'}">
        ${aulas.map(a => {
          const done   = concs.includes(a.id);
          const active = a.id === aulaAtualId;
          return `<div class="ci-aula ${active ? 'active' : ''} ${done ? 'done' : ''}"
            onclick="Aluno.selAula('${a.id}')">
            <div class="ci-dot">${done ? '<span class="ci-done-icon"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>' : ''}</div>
            <div class="ci-aula-name">${x(a.titulo)}</div>
            ${a.duracao ? `<div class="ci-aula-dur">${a.duracao}m</div>` : ''}
          </div>`;
        }).join('')}
      </div>`;
    }).join('');

    // Item de avaliação no final do índice
    if (avalCurso) {
      const respostas   = Storage.Respostas ? Storage.Respostas.porAluno(me.id, avalCurso.id) : [];
      const melhor      = respostas.length ? Math.max(...respostas.map(r => r.nota)) : null;
      const notaMin     = avalCurso.notaMinima ?? 70;
      const aprovadoAv  = melhor !== null && melhor >= notaMin;
      const respondeu   = respostas.length > 0;
      const avalIcon    = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>';
      const stateLbl    = aprovadoAv ? `<span style="font-size:.68rem;color:var(--green)">✓ ${melhor}%</span>`
                        : respondeu  ? `<span style="font-size:.68rem;color:var(--red)">${melhor}%</span>`
                        : '';
      html += `
      <div class="ci-mod-head" style="border-top:2px solid var(--border);background:var(--bg)">
        <span style="flex:1;min-width:0;color:var(--t2)">Avaliação</span>
      </div>
      <div class="ci-aula ${naAvaliacao ? 'active' : ''} ${aprovadoAv ? 'done' : ''}"
        onclick="Aluno.irParaAvaliacao()" style="gap:8px">
        <div class="ci-dot" style="color:${aprovadoAv ? '' : 'var(--blue)'}">
          ${aprovadoAv ? '<span class="ci-done-icon"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>' : avalIcon}
        </div>
        <div class="ci-aula-name">${x(avalCurso.nome)}</div>
        ${stateLbl}
      </div>`;
    }

    wrap.innerHTML = html;
  }

  /**
   * Renderiza materiais de apoio filtrando apenas os da aula atual.
   */
  function _renderMateriais(cursoId, aulaId) {
    const wrap = document.getElementById('playerMateriais');
    const list = document.getElementById('playerMateriaisList');
    if (!wrap || !list) return;

    if (aulaId === '__avaliacao__') { wrap.style.display = 'none'; return; }

    const me   = AlunoState.getMe();
    const curso = Storage.Cursos.obter(cursoId);
    const aprovadoNaAvaliacao = _aprovadoNaAvaliacao(me, cursoId, curso);

    const mats = Storage.Materiais.listar().filter(m =>
      (m.status || 'ativo') === 'ativo' &&
      (m.cursoId === cursoId || (m.cursosVinc || []).includes(cursoId)) &&
      (!m.aulaId || m.aulaId === aulaId)
    );

    if (!mats.length) { wrap.style.display = 'none'; return; }
    wrap.style.display = '';

    const TIPO_ICON = {
      pdf:    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
      video:  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
      link:   '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
      imagem: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    };
    const defaultIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>';
    const lockIcon    = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

    list.innerHTML = mats.map(m => {
      const icon      = TIPO_ICON[m.tipo] || defaultIcon;
      const bloqueado = m.config?.avaliacaoObrigatoria && !aprovadoNaAvaliacao;
      const hasUrl    = m.url && m.url !== '#simulado';
      const canDown   = m.config?.permitirDownload !== false;
      const action    = bloqueado ? '' : (
        m.tipo === 'link'
          ? (hasUrl ? `href="${x(m.url)}" target="_blank" rel="noopener"` : '')
          : (hasUrl && canDown ? `href="${x(m.url)}" download="${x(m.nome)}"` : '')
      );
      const tag = action ? 'a' : 'div';
      const bloqClick = bloqueado
        ? `onclick="event.preventDefault();EadUtils.toast('Conclua a avaliação do curso para acessar este material.','i')" style="cursor:not-allowed;opacity:.6"`
        : '';
      return `<${tag} ${action} ${bloqClick} style="display:flex;align-items:center;gap:10px;padding:9px 12px;
        border:1px solid var(--border);border-radius:var(--radius);margin-bottom:6px;
        background:var(--surface);text-decoration:none;color:var(--t1);
        ${!bloqueado && action ? 'cursor:pointer;' : ''}transition:background var(--trans)"
        ${!bloqueado && action ? 'onmouseover="this.style.background=\'var(--blue-soft)\'" onmouseout="this.style.background=\'var(--surface)\'"' : ''}>
        <span style="color:${bloqueado ? 'var(--t4)' : 'var(--blue)'};display:flex;flex-shrink:0">${bloqueado ? lockIcon : icon}</span>
        <span style="flex:1;min-width:0;font-size:.82rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${x(m.nome)}</span>
        ${m.tamanho ? `<span style="font-size:.72rem;color:var(--t4);flex-shrink:0">${x(m.tamanho)}</span>` : ''}
        ${bloqueado ? `<span style="font-size:.68rem;color:var(--t4);flex-shrink:0">Avaliação pendente</span>` : ''}
        ${!bloqueado && action ? `<span style="color:var(--blue);flex-shrink:0;display:flex"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>` : ''}
      </${tag}>`;
    }).join('');
  }

  function selAula(aulaId) {
    _aulaAvalId = null;
    const cur    = AlunoState.getCur();
    const me     = AlunoState.getMe();
    const curso  = Storage.Cursos.obter(cur.cursoId);
    const sequencial = !!(curso?.config?.sequencial);

    if (sequencial && aulaId) {
      const modulos = Storage.Modulos.listarPorCurso(cur.cursoId);
      const todas   = modulos.flatMap(m => Storage.Aulas.listarPorModulo(m.id));
      const idxDest = todas.findIndex(a => a.id === aulaId);
      const concs   = Storage.Progresso.concluidas(me.id);
      for (let i = 0; i < idxDest; i++) {
        if (!concs.includes(todas[i].id)) {
          toast('Conclua as aulas anteriores para desbloquear esta.', 'i');
          return;
        }
      }
    }

    AlunoState.setCur({ aulaId });
    renderPlayer({ aulaId });
  }

  /** Navega para a tela de avaliação do curso pelo índice */
  function irParaAvaliacao() {
    const cur      = AlunoState.getCur();
    const avalCurso = Storage.Avaliacoes
      ? Storage.Avaliacoes.porCurso(cur.cursoId).find(a => a.status === 'publicada')
      : null;
    if (!avalCurso) { toast('Nenhuma avaliação disponível.', 'i'); return; }
    _irParaAvaliacao(avalCurso);
  }

  /** Alterna expand/collapse de um módulo no índice (SOMENTE clique manual) */
  function toggleModulo(moduloId) {
    if (_expandidos.has(moduloId)) {
      _expandidos.delete(moduloId);
    } else {
      _expandidos.add(moduloId);
    }
    // Atualiza só o bloco deste módulo sem re-renderizar tudo
    const body = document.getElementById(`ci-mod-${moduloId}`);
    const head = body?.previousElementSibling;
    if (body) body.style.display = _expandidos.has(moduloId) ? 'block' : 'none';
    if (head) {
      const chevSpan = head.querySelector('span:last-child');
      if (chevSpan) {
        const CHV_DOWN = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
        const CHV_UP   = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
        chevSpan.innerHTML = _expandidos.has(moduloId) ? CHV_UP : CHV_DOWN;
      }
    }
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
    _expandidos.clear();
    _aulaAvalId = null;
    AlunoState.setCur({ cursoId, aulaId });
    AlunoNav.go('player', { cursoId, aulaId });
  }

  return {
    renderPlayer, selAula, toggleModulo, iniciarCurso, abrirAula,
    irParaAvaliacao, _submeterAvaliacao, _emitirCertificadoComNota,
  };
})();
