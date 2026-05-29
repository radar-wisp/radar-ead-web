/**
 * modals.js — Modal de criação/edição e editor de questões (Avaliações).
 * Responsabilidade: UI do modal, selects, toggles e edição de questões.
 *
 * @module AvalModals
 */

/* global Storage, AvalUtils, AvalState */

var AvalModals = (() => {
  'use strict';

  const _q       = AvalUtils.q;
  const _x       = AvalUtils.x;
  const _uid     = AvalUtils.uid;
  const _fmtDate = AvalUtils.fmtDate;
  const _setVal  = AvalUtils.setVal;

  function abrirModal() {
    AvalState.editId   = null;
    AvalState.questoes = [];

    const tituloEl = document.getElementById('mav-titulo');
    const subEl    = document.getElementById('mav-sub');
    if (tituloEl) tituloEl.textContent = 'Nova Avaliação';
    if (subEl)    subEl.textContent    = '';

    ['mav-nome', 'mav-desc'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    _setVal('mav-nota-min',  70);
    _setVal('mav-tempo',     0);
    _setVal('mav-tentativas', 1);
    _setVal('mav-status',    'rascunho');

    _popularSelectsCursoTurma();
    _renderConfigToggles({});
    renderQuestoes();
    tabModal(0, document.querySelector('#modal-avaliacao .mc-tab'));
    document.getElementById('modal-avaliacao')?.classList.add('open');
  }

  // ══════════════════════════════════════════════════════════════
  // MODAL DE EDIÇÃO
  // ══════════════════════════════════════════════════════════════

  function abrirEdit(id) {
    const av = Storage.Avaliacoes.obter(id);
    if (!av) return;

    AvalState.editId   = id;
    AvalState.questoes = Storage.Questoes.porAvaliacao(id).map(q => ({ ...q })); // cópia local

    const tituloEl = document.getElementById('mav-titulo');
    const subEl    = document.getElementById('mav-sub');
    if (tituloEl) tituloEl.textContent = 'Editar Avaliação';
    if (subEl)    subEl.textContent    = `Criada em ${_fmtDate(av.criadoEm)}`;

    _setVal('mav-nome',       av.nome);
    _setVal('mav-desc',       av.descricao);
    _setVal('mav-nota-min',   av.notaMinima  || 70);
    _setVal('mav-tempo',      av.tempoLimite || 0);
    _setVal('mav-tentativas', av.tentativas  || 1);
    _setVal('mav-status',     av.status      || 'rascunho');

    _popularSelectsCursoTurma(av.cursoId, av.moduloId, av.turmaId);
    _renderConfigToggles(av);
    renderQuestoes();
    tabModal(0, document.querySelector('#modal-avaliacao .mc-tab'));
    document.getElementById('modal-avaliacao')?.classList.add('open');
  }

  // ══════════════════════════════════════════════════════════════
  // SELECTS DE CURSO / TURMA / MÓDULO
  // ══════════════════════════════════════════════════════════════

  function _popularSelectsCursoTurma(cursoId, moduloId, turmaId) {
    const sCurso = document.getElementById('mav-curso');
    const sTurma = document.getElementById('mav-turma');

    if (sCurso) {
      sCurso.innerHTML =
        '<option value="">Sem curso</option>' +
        Storage.Cursos.listar().map(c =>
          `<option value="${_x(c.id)}" ${c.id === cursoId ? 'selected' : ''}>${_x(c.titulo)}</option>`
        ).join('');
      sCurso.onchange = _loadModulos;
    }
    if (sTurma) {
      sTurma.innerHTML =
        '<option value="">Todas as turmas</option>' +
        Storage.Turmas.listar().map(t =>
          `<option value="${_x(t.id)}" ${t.id === turmaId ? 'selected' : ''}>${_x(t.nome)}</option>`
        ).join('');
    }
    _loadModulos(cursoId, moduloId);
  }

  function _loadModulos(cursoId, selectedId) {
    const cId  = cursoId || document.getElementById('mav-curso')?.value;
    const sMod = document.getElementById('mav-modulo');
    if (!sMod) return;
    const mods = cId ? Storage.Modulos.listarPorCurso(cId) : [];
    sMod.innerHTML =
      '<option value="">Selecione um módulo...</option>' +
      mods.map(m =>
        `<option value="${_x(m.id)}" ${m.id === selectedId ? 'selected' : ''}>${_x(m.titulo)}</option>`
      ).join('');
  }

  // ══════════════════════════════════════════════════════════════
  // TOGGLES DE CONFIGURAÇÃO
  // ══════════════════════════════════════════════════════════════

  function _renderConfigToggles(av) {
    const wrap = document.getElementById('mav-config-toggles');
    if (!wrap) return;

    const row = (id, lbl, desc, val) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px">${lbl}</div>
          <div style="font-size:11px;color:var(--text4)">${desc}</div>
        </div>
        <div id="${id}" class="toggle ${val ? 'on' : ''}"
          onclick="this.classList.toggle('on');this.querySelector('span').style.left=this.classList.contains('on')?'21px':'3px';this.style.background=this.classList.contains('on')?'var(--blue)':'var(--border2)'"
          style="position:relative;width:40px;height:22px;background:${val ? 'var(--blue)' : 'var(--border2)'};border-radius:11px;cursor:pointer;transition:background .2s;flex-shrink:0">
          <span style="position:absolute;top:3px;left:${val ? 21 : 3}px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></span>
        </div>
      </div>`;

    wrap.innerHTML =
      row('mavcfg-imediato',  'Exibir resultado imediatamente', 'O aluno vê a nota ao terminar',                        av.resultadoImediato !== false) +
      row('mavcfg-aleatoria', 'Ordem aleatória de questões',    'Embaralha a ordem para cada tentativa',                av.ordemAleatoria) +
      row('mavcfg-correcao',  'Correção automática',            'Corrige automaticamente (exceto descritivas)',          av.correcaoAutomatica !== false);
  }

  // ══════════════════════════════════════════════════════════════
  // TABS DO MODAL
  // ══════════════════════════════════════════════════════════════

  function tabModal(idx, btn) {
    document.querySelectorAll('#modal-avaliacao .mc-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
    document.querySelectorAll('#modal-avaliacao .mc-pane').forEach((p, i) => p.classList.toggle('active', i === idx));
    if (idx === 2) renderQuestoes();
  }

  // ══════════════════════════════════════════════════════════════
  // EDITOR DE QUESTÕES
  // ══════════════════════════════════════════════════════════════

  /**
   * Adiciona uma nova questão ao estado local.
   * @param {'multipla'|'vf'|'unica'|'descritiva'} tipo
   */
  function addQuestao(tipo) {
    const nova = {
      _lid:        _uid(),
      avaliacaoId: AvalState.editId || '_novo_',
      tipo,
      pergunta:    '',
      alternativas: ['', '', '', ''],
      correta:     '0',
      pontos:      10,
      feedback:    '',
      categoria:   '',
      ordem:       AvalState.questoes.length + 1,
    };
    if (tipo === 'vf')        { nova.alternativas = ['Verdadeiro', 'Falso']; nova.correta = '0'; }
    if (tipo === 'descritiva') { nova.alternativas = []; nova.correta = ''; }

    AvalState.questoes.push(nova);
    renderQuestoes();

    // Scroll para a nova questão
    const lista = document.getElementById('mav-questoes-lista');
    if (lista) setTimeout(() => lista.scrollTop = lista.scrollHeight, 50);
  }

  /**
   * Re-renderiza a lista de questões no editor.
   */
  function renderQuestoes() {
    const lista = document.getElementById('mav-questoes-lista');
    const empty = document.getElementById('mav-questoes-empty');
    const cnt   = document.getElementById('mav-q-count');
    if (cnt) cnt.textContent = AvalState.questoes.length;

    if (!AvalState.questoes.length) {
      if (lista) lista.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    const TIPO_LABEL = {
      multipla:   'Múltipla escolha',
      vf:         'Verdadeiro/Falso',
      unica:      'Resposta única',
      descritiva: 'Descritiva',
    };

    lista.innerHTML = AvalState.questoes.map((q, idx) => {
      let altHtml = '';

      if (q.tipo === 'multipla' || q.tipo === 'unica') {
        const alts = q.alternativas.length ? q.alternativas : ['', '', '', ''];
        altHtml = `
          <div style="margin-top:10px">
            <div style="font-size:11px;font-weight:600;color:var(--text4);margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">Alternativas</div>
            ${alts.map((alt, ai) => `
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <input type="radio" name="correta_${idx}" value="${ai}"
                  ${String(q.correta) === String(ai) ? 'checked' : ''}
                  onchange="Aval._setCorreta(${idx},${ai})"
                  style="accent-color:var(--blue);flex-shrink:0" title="Marcar como correta">
                <input type="text" value="${_x(alt)}"
                  placeholder="Alternativa ${ai + 1}"
                  oninput="Aval._setAlt(${idx},${ai},this.value)"
                  style="flex:1;padding:6px 10px;border:1.5px solid var(--border2);border-radius:var(--radius-sm);font-size:12px;font-family:var(--font);outline:none">
              </div>`).join('')}
            <button onclick="Aval._addAlt(${idx})" class="btn btn-ghost btn-sm" style="margin-top:4px">+ Alternativa</button>
          </div>`;

      } else if (q.tipo === 'vf') {
        altHtml = `
          <div style="margin-top:10px;display:flex;gap:12px">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
              <input type="radio" name="correta_${idx}" value="0" ${String(q.correta) === '0' ? 'checked' : ''}
                onchange="Aval._setCorreta(${idx},'0')" style="accent-color:var(--blue)">
              <span style="font-size:13px">Verdadeiro</span>
            </label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
              <input type="radio" name="correta_${idx}" value="1" ${String(q.correta) === '1' ? 'checked' : ''}
                onchange="Aval._setCorreta(${idx},'1')" style="accent-color:var(--blue)">
              <span style="font-size:13px">Falso</span>
            </label>
          </div>`;

      } else {
        altHtml = `
          <div style="margin-top:8px;padding:8px 12px;background:var(--bg);border-radius:var(--radius-sm);font-size:12px;color:var(--text4)">
            Questão descritiva — correção manual necessária
          </div>`;
      }

      return `
        <div style="border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:14px;background:var(--surface)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="width:22px;height:22px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${idx + 1}</span>
              <span style="font-size:11px;font-weight:600;color:var(--text4);text-transform:uppercase;letter-spacing:.06em">${TIPO_LABEL[q.tipo]}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <label style="font-size:11px;color:var(--text4)">Pontos:</label>
              <input type="number" value="${q.pontos || 10}" min="1" max="100"
                oninput="Aval._setPontos(${idx},this.value)"
                style="width:55px;padding:4px 7px;border:1.5px solid var(--border2);border-radius:var(--radius-sm);font-size:12px;font-family:var(--font);outline:none;text-align:center">
              <button onclick="Aval._remQuestao(${idx})"
                style="background:none;border:none;cursor:pointer;color:var(--text4);padding:2px" title="Remover">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              </button>
            </div>
          </div>
          <textarea placeholder="Enunciado da questão *" rows="2"
            oninput="Aval._setPergunta(${idx},this.value)"
            style="width:100%;padding:8px 11px;border:1.5px solid var(--border2);border-radius:var(--radius-sm);font-size:13px;font-family:var(--font);resize:vertical;outline:none">${_x(q.pergunta)}</textarea>
          ${altHtml}
          <div style="margin-top:10px">
            <input type="text" value="${_x(q.feedback || '')}" placeholder="Feedback opcional (exibido após resposta)"
              oninput="Aval._setFeedback(${idx},this.value)"
              style="width:100%;padding:6px 10px;border:1.5px solid var(--border2);border-radius:var(--radius-sm);font-size:12px;font-family:var(--font);outline:none;color:var(--text3)">
          </div>
        </div>`;
    }).join('');
  }

  // ── Mutadores de questão (chamados pelo HTML inline) ──────────

  function _setPergunta(idx, v) { AvalState.questoes[idx].pergunta = v; }
  function _setPontos(idx, v)   { AvalState.questoes[idx].pontos   = parseInt(v) || 10; }
  function _setFeedback(idx, v) { AvalState.questoes[idx].feedback = v; }
  function _setCorreta(idx, v)  { AvalState.questoes[idx].correta  = String(v); }

  function _setAlt(idx, ai, v) {
    if (!AvalState.questoes[idx].alternativas) AvalState.questoes[idx].alternativas = [];
    AvalState.questoes[idx].alternativas[ai] = v;
  }

  function _addAlt(idx) {
    if (!AvalState.questoes[idx].alternativas) AvalState.questoes[idx].alternativas = [];
    AvalState.questoes[idx].alternativas.push('');
    renderQuestoes();
  }

  function _remQuestao(idx) {
    AvalState.questoes.splice(idx, 1);
    AvalState.questoes.forEach((q, i) => { q.ordem = i + 1; });
    renderQuestoes();
  }

  return {
    abrirModal, abrirEdit, tabModal, _loadModulos,
    addQuestao, renderQuestoes,
    _setPergunta, _setPontos, _setFeedback, _setCorreta,
    _setAlt, _addAlt, _remQuestao,
  };
})();
