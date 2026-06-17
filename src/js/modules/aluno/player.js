/**
 * player.js — Player de aula e índice lateral do curso
 *
 * Funcionalidades:
 *  • Índice em accordion (módulos expandir/recolher)
 *  • Materiais filtrados pela aula atual
 *  • Acesso sequencial (config.sequencial no curso)
 *  • Bloqueio por material obrigatório (config.necessarioAntesDaProxima)
 *  • Compatibilidade de embed: YouTube, Vimeo, Drive, Loom, Panda, MP4
 */

/* global Storage, AlunoState, AlunoUtils, AlunoNav, AlunoCertificados */

var AlunoPlayer = (() => {
  'use strict';

  const { ICON_CHECK, x, toast, toEmbed, tipoLabel } = AlunoUtils;

  // Controla quais módulos estão expandidos no índice (por moduloId)
  const _expandidos = new Set();

  function renderPlayer({ cursoId, aulaId } = {}) {
    if (cursoId) AlunoState.setCur({ cursoId });
    if (aulaId)  AlunoState.setCur({ aulaId });

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

    document.getElementById('playerCursoNome').textContent = curso?.titulo || '';
    document.getElementById('playerTopPct').textContent    = pct + '%';
    document.getElementById('playerTopFill').style.width   = pct + '%';
    document.getElementById('playerTopFill').className     = 'prog-fill' + (pct === 100 ? ' g' : '');

    document.getElementById('btnVoltarPlayer').onclick = () => AlunoNav.go('cursos');

    _renderConteudo(aula, conc);
    _renderIndice(modulos, state.aulaId);
    _renderMateriais(state.cursoId, state.aulaId);

    const sequencial = !!(curso?.config?.sequencial);
    const btnPrev    = document.getElementById('btnPrev');
    const btnNext    = document.getElementById('btnNext');

    btnPrev.disabled = idx <= 0;
    btnNext.disabled = idx >= todas.length - 1 || idx < 0;

    btnPrev.onclick = () => {
      if (idx <= 0) return;
      selAula(todas[idx - 1].id);
    };

    btnNext.onclick = () => {
      if (idx >= todas.length - 1) return;
      // Verificar material obrigatório antes de avançar
      if (_temMaterialObrigatorioNaoVisto(state.cursoId, state.aulaId)) {
        toast('Acesse o material obrigatório antes de avançar.', 'i');
        return;
      }
      // Verificar acesso sequencial
      if (sequencial && state.aulaId && !Storage.Progresso.isConcluida(me.id, state.aulaId)) {
        toast('Conclua esta aula antes de avançar.', 'i');
        return;
      }
      selAula(todas[idx + 1].id);
    };
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
    // Considera "visto" se estiver salvo em progresso de materiais
    const vistos = Storage.Progresso.materiaisVistos
      ? Storage.Progresso.materiaisVistos(me.id)
      : [];
    return mats.some(m => !vistos.includes(m.id));
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
        const embedUrl = toEmbed(aula.conteudo);
        // MP4 direto → usar <video>; demais → iframe
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

  /**
   * Renderiza o índice lateral com módulos em accordion (expandir/recolher).
   * O módulo da aula ativa é expandido automaticamente.
   */
  function _renderIndice(modulos, aulaAtualId) {
    const me   = AlunoState.getMe();
    const cur  = AlunoState.getCur();
    const wrap = document.getElementById('ci-body');
    const pct  = Storage.Progresso.pctCurso(me.id, cur.cursoId);
    const concs = Storage.Progresso.concluidas(me.id);

    document.getElementById('ci-pct-fill').style.width = pct + '%';
    document.getElementById('ci-pct-num').textContent  = pct + '%';

    // Expandir automaticamente o módulo que contém a aula ativa
    if (aulaAtualId) {
      modulos.forEach(m => {
        const aulas = Storage.Aulas.listarPorModulo(m.id);
        if (aulas.some(a => a.id === aulaAtualId)) _expandidos.add(m.id);
      });
    }
    // Se nenhum módulo expandido ainda, expande o primeiro
    if (_expandidos.size === 0 && modulos.length > 0) {
      _expandidos.add(modulos[0].id);
    }

    wrap.innerHTML = modulos.map(m => {
      const aulas    = Storage.Aulas.listarPorModulo(m.id);
      const modConc  = aulas.filter(a => concs.includes(a.id)).length;
      const expanded = _expandidos.has(m.id);
      const chevron  = expanded
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

      return `
      <div class="ci-mod-head ci-mod-toggle" onclick="Aluno.toggleModulo('${m.id}')" style="cursor:pointer;user-select:none">
        <span style="flex:1;min-width:0">${m.ordem}. ${x(m.titulo)}</span>
        <span style="font-weight:400;color:var(--t4);margin-right:6px">${modConc}/${aulas.length}</span>
        <span style="color:var(--t3);flex-shrink:0">${chevron}</span>
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
  }

  /**
   * Renderiza materiais de apoio filtrando apenas os da aula atual.
   */
  function _renderMateriais(cursoId, aulaId) {
    const wrap = document.getElementById('playerMateriais');
    const list = document.getElementById('playerMateriaisList');
    if (!wrap || !list) return;

    const me   = AlunoState.getMe();
    // Verifica se o aluno já foi aprovado na avaliação do curso (para materiais com avaliacaoObrigatoria)
    const avaliacoes = Storage.Avaliacoes
      ? Storage.Avaliacoes.porCurso(cursoId).filter(a => a.status === 'publicada')
      : [];
    const aprovadoNaAvaliacao = avaliacoes.length === 0 || avaliacoes.some(av => {
      const respostas = Storage.Respostas ? Storage.Respostas.porAluno(me.id, av.id) : [];
      return respostas.some(r => r.aprovado);
    });

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
    const cur    = AlunoState.getCur();
    const me     = AlunoState.getMe();
    const curso  = Storage.Cursos.obter(cur.cursoId);
    const sequencial = !!(curso?.config?.sequencial);

    if (sequencial && aulaId) {
      const modulos = Storage.Modulos.listarPorCurso(cur.cursoId);
      const todas   = modulos.flatMap(m => Storage.Aulas.listarPorModulo(m.id));
      const idxDest = todas.findIndex(a => a.id === aulaId);
      const concs   = Storage.Progresso.concluidas(me.id);
      // Bloqueia acesso a aula que ainda não foi liberada sequencialmente
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

  /** Alterna expand/collapse de um módulo no índice */
  function toggleModulo(moduloId) {
    if (_expandidos.has(moduloId)) {
      _expandidos.delete(moduloId);
    } else {
      _expandidos.add(moduloId);
    }
    const body = document.getElementById(`ci-mod-${moduloId}`);
    if (body) body.style.display = _expandidos.has(moduloId) ? 'block' : 'none';
    // Atualiza o chevron re-renderizando só o índice
    const cur     = AlunoState.getCur();
    const modulos = Storage.Modulos.listarPorCurso(cur.cursoId);
    _renderIndice(modulos, cur.aulaId);
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

  return { renderPlayer, selAula, toggleModulo, iniciarCurso, abrirAula };
})();
