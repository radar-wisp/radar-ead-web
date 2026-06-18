/**
 * player.js — Player de aula e índice lateral do curso
 *
 * Funcionalidades:
 *  • Índice em accordion (módulos sempre recolhidos; expande/recolhe só com clique manual)
 *  • Avaliação vinculada aparece no final do índice após todos os módulos
 *  • Avaliação abre em overlay dedicado (aval-bg), sem interferir no player
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

  // Módulos expandidos no índice — inicia vazio (todos recolhidos)
  const _expandidos = new Set();

  // ─────────────────────────────────────────────────────────
  // PLAYER PRINCIPAL
  // ─────────────────────────────────────────────────────────

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
    const avalCurso = Storage.Avaliacoes
      ? Storage.Avaliacoes.porCurso(state.cursoId).find(a => a.status === 'publicada') || null
      : null;

    document.getElementById('playerCursoNome').textContent = curso?.titulo || '';
    document.getElementById('playerTopPct').textContent    = pct + '%';
    document.getElementById('playerTopFill').style.width   = pct + '%';
    document.getElementById('playerTopFill').className     = 'prog-fill' + (pct === 100 ? ' g' : '');
    document.getElementById('btnVoltarPlayer').onclick     = () => AlunoNav.go('cursos');

    _renderConteudo(aula, conc, curso, me);
    _renderIndice(modulos, state.aulaId, avalCurso, me, state.cursoId);
    _renderMateriais(state.cursoId, state.aulaId);

    const sequencial = !!(curso?.config?.sequencial);
    const btnPrev    = document.getElementById('btnPrev');
    const btnNext    = document.getElementById('btnNext');

    btnPrev.disabled = idx <= 0;
    // Na última aula com avaliação, "próximo" abre a avaliação; sem avaliação, desabilita
    btnNext.disabled = idx < 0 || (idx >= todas.length - 1 && !avalCurso);

    btnPrev.onclick = () => {
      if (idx <= 0) return;
      selAula(todas[idx - 1].id);
    };

    btnNext.onclick = () => {
      if (idx < 0) return;
      if (_temMaterialObrigatorioNaoVisto(state.cursoId, state.aulaId)) {
        toast('Acesse o material obrigatório antes de avançar.', 'i'); return;
      }
      if (sequencial && state.aulaId && !Storage.Progresso.isConcluida(me.id, state.aulaId)) {
        toast('Conclua esta aula antes de avançar.', 'i'); return;
      }
      if (idx === todas.length - 1 && avalCurso) {
        abrirAvaliacao(); return;
      }
      if (idx < todas.length - 1) selAula(todas[idx + 1].id);
    };
  }

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
      ? Storage.Progresso.materiaisVistos(me.id) : [];
    return mats.some(m => !vistos.includes(m.id));
  }

  /**
   * Verifica se o aluno atingiu a nota mínima na avaliação do curso.
   * Retorna true se não há avaliação obrigatória ou se já aprovado.
   */
  function _aprovadoNaAvaliacao(me, cursoId, curso) {
    if (!curso?.config?.avaliacao) return true;
    const avs = Storage.Avaliacoes
      ? Storage.Avaliacoes.porCurso(cursoId).filter(a => a.status === 'publicada') : [];
    if (!avs.length) return true;
    const notaMin = curso.config.notaMin ?? 70;
    return avs.some(av => {
      const resps = Storage.Respostas ? Storage.Respostas.porAluno(me.id, av.id) : [];
      return resps.some(r => r.nota >= notaMin);
    });
  }

  function _renderConteudo(aula, isConc, curso, me) {
    const screen = document.getElementById('playerScreen');
    const title  = document.getElementById('playerAulaTitulo');
    const meta   = document.getElementById('playerAulaMeta');
    const btn    = document.getElementById('btnConcluir');

    if (!aula) {
      screen.innerHTML = `<div style="color:#8896A9;text-align:center;padding:60px">
        <div style="font-size:3rem;margin-bottom:12px">▶️</div>
        <p>Selecione uma aula no índice</p></div>`;
      title.textContent = '—'; meta.textContent = ''; btn.style.display = 'none';
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
          : `<div style="color:#8896A9;padding:60px;text-align:center">PDF não configurado</div>`;
        break;
      case 'link':
        screen.innerHTML = `<div style="text-align:center;padding:70px 30px">
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

  function _toggleConc(aulaId, curso, me) {
    const cur = AlunoState.getCur();
    const era = Storage.Progresso.isConcluida(me.id, aulaId);
    if (era) {
      Storage.Progresso.desmarcar(me.id, aulaId);
      toast('Desmarcada.', 'i');
    } else {
      Storage.Progresso.marcar(me.id, aulaId);
      toast('Aula concluída!', 's');
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
   * Renderiza o índice lateral com accordion.
   * Todos os módulos iniciam RECOLHIDOS. Expande/recolhe SOMENTE com clique manual.
   * Avaliação publicada aparece como item fixo no final.
   */
  function _renderIndice(modulos, aulaAtualId, avalCurso, me, cursoId) {
    const wrap  = document.getElementById('ci-body');
    const pct   = Storage.Progresso.pctCurso(me.id, cursoId);
    const concs = Storage.Progresso.concluidas(me.id);

    document.getElementById('ci-pct-fill').style.width = pct + '%';
    document.getElementById('ci-pct-num').textContent  = pct + '%';

    const CHV_DOWN = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
    const CHV_UP   = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';

    let html = modulos.map(m => {
      const aulas   = Storage.Aulas.listarPorModulo(m.id);
      const modConc = aulas.filter(a => concs.includes(a.id)).length;
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

    // Item de avaliação fixo no final
    if (avalCurso) {
      const resps      = Storage.Respostas ? Storage.Respostas.porAluno(me.id, avalCurso.id) : [];
      const melhor     = resps.length ? Math.max(...resps.map(r => r.nota)) : null;
      const notaMin    = avalCurso.notaMinima ?? 70;
      const aprovado   = melhor !== null && melhor >= notaMin;
      const respondeu  = resps.length > 0;
      const AVAL_ICON  = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>';
      const statusLbl  = aprovado ? `<span style="font-size:.68rem;color:var(--green)">✓ ${melhor}%</span>`
                       : respondeu ? `<span style="font-size:.68rem;color:var(--red)">${melhor}%</span>` : '';
      html += `
      <div class="ci-mod-head" style="border-top:2px solid var(--border);background:var(--bg)">
        <span style="flex:1;min-width:0;color:var(--t2)">Avaliação</span>
      </div>
      <div class="ci-aula ${aprovado ? 'done' : ''}" onclick="Aluno.abrirAvaliacao()" style="gap:8px">
        <div class="ci-dot" style="color:${aprovado ? '' : 'var(--blue)'}">
          ${aprovado
            ? '<span class="ci-done-icon"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>'
            : AVAL_ICON}
        </div>
        <div class="ci-aula-name">${x(avalCurso.nome)}</div>
        ${statusLbl}
      </div>`;
    }

    wrap.innerHTML = html;
  }

  function _renderMateriais(cursoId, aulaId) {
    const wrap = document.getElementById('playerMateriais');
    const list = document.getElementById('playerMateriaisList');
    if (!wrap || !list) return;

    const me    = AlunoState.getMe();
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
        ? `onclick="event.preventDefault();EadUtils.toast('Conclua a avaliação do curso para acessar este material.','i')" style="cursor:not-allowed;opacity:.6"` : '';
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

  // ─────────────────────────────────────────────────────────
  // OVERLAY DE AVALIAÇÃO
  // ─────────────────────────────────────────────────────────

  function abrirAvaliacao() {
    const cur = AlunoState.getCur();
    const av  = Storage.Avaliacoes
      ? Storage.Avaliacoes.porCurso(cur.cursoId).find(a => a.status === 'publicada')
      : null;
    if (!av) { toast('Nenhuma avaliação disponível.', 'i'); return; }

    const me    = AlunoState.getMe();
    const curso = Storage.Cursos.obter(cur.cursoId);
    const bg    = document.getElementById('avalBg');
    const titulo = document.getElementById('avalTitulo');
    const meta   = document.getElementById('avalMeta');
    const footer = document.getElementById('avalFooter');

    titulo.textContent = av.nome;
    document.getElementById('btnFecharAval').onclick = fecharAvaliacao;

    _renderBodyAvaliacao(av, me, curso);

    footer.innerHTML = '';
    bg.classList.add('open');
  }

  function fecharAvaliacao() {
    document.getElementById('avalBg').classList.remove('open');
    // Atualiza índice para refletir novo estado da avaliação
    const cur     = AlunoState.getCur();
    const me      = AlunoState.getMe();
    const curso   = Storage.Cursos.obter(cur.cursoId);
    const modulos = Storage.Modulos.listarPorCurso(cur.cursoId);
    const avalCurso = Storage.Avaliacoes
      ? Storage.Avaliacoes.porCurso(cur.cursoId).find(a => a.status === 'publicada') || null : null;
    _renderIndice(modulos, cur.aulaId, avalCurso, me, cur.cursoId);
  }

  function _renderBodyAvaliacao(av, me, curso) {
    const body    = document.getElementById('avalBody');
    const meta    = document.getElementById('avalMeta');
    const footer  = document.getElementById('avalFooter');
    const questoes = Storage.Questoes.porAvaliacao(av.id);
    const resps    = Storage.Respostas ? Storage.Respostas.porAluno(me.id, av.id) : [];
    const melhor   = resps.length ? Math.max(...resps.map(r => r.nota)) : null;
    const notaMin  = av.notaMinima ?? curso?.config?.notaMin ?? 70;
    const aprovado = melhor !== null && melhor >= notaMin;
    const tentativas = resps.length;
    const maxTent    = av.tentativas || 0;
    const podeNovaTentativa = !maxTent || tentativas < maxTent;

    meta.textContent = `${questoes.length} questão(ões) · nota mínima ${notaMin}%${maxTent ? ' · ' + maxTent + ' tentativa(s)' : ''}`;

    // Se já respondeu e não pode mais tentar → mostra resultado final
    if (tentativas > 0 && !podeNovaTentativa) {
      _renderResultado(body, footer, melhor, aprovado, notaMin, me, curso, av, questoes, resps[resps.length - 1]);
      return;
    }

    if (!questoes.length) {
      body.innerHTML = `<p style="color:var(--t3);text-align:center;padding:40px 0">Esta avaliação não tem questões cadastradas.</p>`;
      footer.innerHTML = '';
      return;
    }

    // Banner de tentativa anterior
    let bannerHtml = '';
    if (tentativas > 0) {
      bannerHtml = `<div class="aval-prev-banner">
        Melhor nota anterior: <strong>${melhor}%</strong> · ${aprovado ? '✓ Aprovado' : 'Reprovado'}
        · Tentativa ${tentativas + 1}${maxTent ? ' de ' + maxTent : ''}
      </div>`;
    }

    // Formulário de questões
    const formsHtml = questoes.map((q, i) => {
      let inputsHtml = '';
      if (q.tipo === 'multipla' || q.tipo === 'unica') {
        inputsHtml = (q.alternativas || []).map((alt, ai) =>
          `<label class="aval-alt" onclick="this.classList.toggle('selected',true);this.closest('.aval-questao').querySelectorAll('.aval-alt').forEach(l=>l!==this&&l.classList.remove('selected'))">
            <input type="radio" name="q_${q.id}" value="${ai}"> ${x(alt)}
          </label>`
        ).join('');
      } else if (q.tipo === 'vf') {
        const opts = q.alternativas?.length ? q.alternativas : ['Verdadeiro', 'Falso'];
        inputsHtml = opts.map((opt, oi) =>
          `<label class="aval-alt" onclick="this.classList.toggle('selected',true);this.closest('.aval-questao').querySelectorAll('.aval-alt').forEach(l=>l!==this&&l.classList.remove('selected'))">
            <input type="radio" name="q_${q.id}" value="${oi}"> ${x(opt)}
          </label>`
        ).join('');
      } else if (q.tipo === 'descritiva') {
        inputsHtml = `<textarea id="desc_${q.id}" rows="3" placeholder="Sua resposta..."
          style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid var(--border);border-radius:var(--radius);font-size:.82rem;color:var(--t1);background:var(--surface);resize:vertical"></textarea>`;
      }
      return `<div class="aval-questao">
        <div class="aval-enunciado">${i + 1}. ${x(q.pergunta)}</div>
        ${inputsHtml}
      </div>`;
    }).join('');

    body.innerHTML = bannerHtml + formsHtml;

    footer.innerHTML = `<button class="btn btn-primary" style="width:100%" onclick="Aluno._submeterAvaliacao()">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><polyline points="20 6 9 17 4 12"/></svg>Enviar respostas
    </button>`;
  }

  function _renderResultado(body, footer, nota, aprovado, notaMin, me, curso, av, questoes, ultimaResp) {
    const cor = aprovado ? 'var(--green)' : 'var(--red,#e53e3e)';

    // Gabarito por questão
    let gabaritoHtml = '';
    if (ultimaResp?.respostas && questoes.length) {
      gabaritoHtml = `<div style="margin-top:24px;border-top:1px solid var(--border);padding-top:16px">
        <div style="font-size:.78rem;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">Gabarito</div>`;
      questoes.forEach((q, i) => {
        if (q.tipo === 'descritiva') return;
        const respAluno = String(ultimaResp.respostas[q.id] ?? '');
        const correta   = String(q.correta);
        const acertou   = respAluno === correta;
        const alts      = q.tipo === 'vf'
          ? (q.alternativas?.length ? q.alternativas : ['Verdadeiro', 'Falso'])
          : (q.alternativas || []);
        const nomeResp  = alts[parseInt(respAluno)] ?? `Opção ${respAluno}`;
        const nomeCorr  = alts[parseInt(correta)]   ?? `Opção ${correta}`;
        gabaritoHtml += `<div style="margin-bottom:14px">
          <div style="font-size:.82rem;font-weight:600;color:var(--t1);margin-bottom:6px">${i + 1}. ${x(q.pergunta)}</div>
          <div style="font-size:.78rem;padding:5px 10px;border-radius:var(--radius);margin-bottom:3px;
            background:${acertou ? '#f0fdf4' : '#fff5f5'};color:${acertou ? 'var(--green)' : 'var(--red,#e53e3e)'};
            border:1px solid ${acertou ? 'var(--green)' : 'var(--red,#e53e3e)'}">
            ${acertou ? '✓' : '✗'} Sua resposta: ${x(nomeResp)}
          </div>
          ${!acertou ? `<div style="font-size:.78rem;padding:5px 10px;border-radius:var(--radius);
            background:#f0fdf4;color:var(--green);border:1px solid var(--green)">
            ✓ Correta: ${x(nomeCorr)}
          </div>` : ''}
        </div>`;
      });
      gabaritoHtml += `</div>`;
    }

    body.innerHTML = `<div class="aval-resultado">
      <div class="aval-nota-num" style="color:${cor}">${nota}%</div>
      <div class="aval-nota-lbl" style="color:${cor}">${aprovado ? '✓ Aprovado!' : '✗ Reprovado'}</div>
      <div class="aval-nota-min">Nota mínima: ${notaMin}%</div>
      ${aprovado
        ? `<button class="btn btn-success" onclick="Aluno._emitirCertificadoComNota()">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>Ver certificado
           </button>`
        : `<div style="font-size:.82rem;color:var(--t3)">Revise o conteúdo e tente novamente.</div>`
      }
    </div>${gabaritoHtml}`;
    footer.innerHTML = '';
  }

  /** Submete o formulário de avaliação do overlay */
  function _submeterAvaliacao() {
    const cur = AlunoState.getCur();
    const me  = AlunoState.getMe();
    const av  = Storage.Avaliacoes
      ? Storage.Avaliacoes.porCurso(cur.cursoId).find(a => a.status === 'publicada')
      : null;
    if (!av) return;

    const questoes  = Storage.Questoes.porAvaliacao(av.id);
    const respostas = {};
    let faltando    = false;

    questoes.forEach(q => {
      if (q.tipo === 'descritiva') {
        const ta = document.getElementById(`desc_${q.id}`);
        respostas[q.id] = ta ? ta.value.trim() : '';
      } else {
        const sel = document.querySelector(`input[name="q_${q.id}"]:checked`);
        if (!sel) { faltando = true; }
        else respostas[q.id] = sel.value; // string para bater com String(q.correta)
      }
    });

    if (faltando) { toast('Responda todas as questões antes de enviar.', 'i'); return; }

    const resp  = Storage.Respostas.registrar(av.id, me.id, respostas, 0);
    const curso = Storage.Cursos.obter(cur.cursoId);
    toast(resp.aprovado ? 'Aprovado! 🎉' : 'Respostas enviadas.', resp.aprovado ? 's' : 'i');

    // Re-renderiza o body com resultado
    const body   = document.getElementById('avalBody');
    const footer = document.getElementById('avalFooter');
    const notaMin = av.notaMinima ?? curso?.config?.notaMin ?? 70;
    _renderResultado(body, footer, resp.nota, resp.aprovado, notaMin, me, curso, av,
      questoes, resp);

    // Atualiza índice
    const modulos   = Storage.Modulos.listarPorCurso(cur.cursoId);
    const avalCurso = Storage.Avaliacoes
      ? Storage.Avaliacoes.porCurso(cur.cursoId).find(a => a.status === 'publicada') || null : null;
    _renderIndice(modulos, cur.aulaId, avalCurso, me, cur.cursoId);
  }

  /** Emite certificado após aprovação */
  function _emitirCertificadoComNota() {
    const cur   = AlunoState.getCur();
    const me    = AlunoState.getMe();
    const curso = Storage.Cursos.obter(cur.cursoId);
    if (_aprovadoNaAvaliacao(me, cur.cursoId, curso)) {
      fecharAvaliacao();
      setTimeout(AlunoCertificados.mostrarCertificado, 200);
    }
  }

  // ─────────────────────────────────────────────────────────
  // ACCORDION & NAVEGAÇÃO
  // ─────────────────────────────────────────────────────────

  function selAula(aulaId) {
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
          toast('Conclua as aulas anteriores para desbloquear esta.', 'i'); return;
        }
      }
    }
    AlunoState.setCur({ aulaId });
    renderPlayer({ aulaId });
  }

  /** Alterna expand/collapse de um módulo — SOMENTE via clique manual */
  function toggleModulo(moduloId) {
    if (_expandidos.has(moduloId)) _expandidos.delete(moduloId);
    else _expandidos.add(moduloId);

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
    AlunoState.setCur({ cursoId, aulaId });
    AlunoNav.go('player', { cursoId, aulaId });
  }

  return {
    renderPlayer, selAula, toggleModulo, iniciarCurso, abrirAula,
    abrirAvaliacao, fecharAvaliacao,
    _submeterAvaliacao, _emitirCertificadoComNota,
  };
})();
