/**
 * wizard.js — Wizard de criação/edição de cursos
 * Controlador do formulário multi-step (Wizard + Conteudo).
 * Carregado dentro do contexto do iframe (wizard.html).
 *
 * Dependências: window.Storage (storage.js)
 * API pública: window.Wizard, window.Conteudo
 */

// ══════════════════════════════════════════════════════════════
// WIZARD — Controlador completo do fluxo de cadastro
// ══════════════════════════════════════════════════════════════
var Wizard = (() => {

  let currentStep = 0;
  const TOTAL = 6;
  let _editId = null; // ID do curso em edição (null = novo curso)

  // Estado do formulário
  let state = {
    nome: '', categoria: '', formato: 'ead', carga: '', nivel: 'basico',
    descricao: '', capa: null, capaName: '',
    publico: [], publicoObs: '',
    visib: '',
    acessos: { setor: [], equipe: [], colab: [] },
    validade: '', dataInicio: '', prazo: '',
    modulos: [],   // [{ id, titulo, status, aulas:[{id,titulo,tipo,durMin,status}] }]
    materiais: [],
    config: {
      obrigatorio: false, certificado: false, avaliacao: false,
      notaMin: 70, progresso: false, ocultar: false, sequencial: false,
    },
    status: 'rascunho',
  };

  // ── Navegação ──────────────────────────────────────────────
  function updateStepperUI() {
    document.querySelectorAll('.step').forEach((el, i) => {
      el.classList.remove('active', 'done');
      if (i < currentStep) el.classList.add('done');
      else if (i === currentStep) el.classList.add('active');

      // Ícone check nas etapas concluídas
      const circle = el.querySelector('.step-circle');
      const num = el.querySelector('.step-num');
      if (i < currentStep) {
        circle.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
      } else {
        circle.innerHTML = `<span class="step-num">${i+1}</span>`;
      }
    });

    // Atualiza panes
    document.querySelectorAll('.step-pane').forEach((p, i) => {
      p.classList.toggle('active', i === currentStep);
    });

    // Botão anterior
    const btnPrev = document.getElementById('btn-prev');
    btnPrev.style.display = currentStep > 0 ? 'inline-flex' : 'none';

    // Botão próximo
    const btnNext = document.getElementById('btn-next');
    if (currentStep === TOTAL - 1) {
      btnNext.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg> Publicar Curso`;
      btnNext.classList.add('btn-primary');
    } else {
      btnNext.innerHTML = `Próximo <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
    }

    document.getElementById('step-indicator').textContent = `Etapa ${currentStep + 1} de ${TOTAL}`;

    // Re-renderizar componentes dinâmicos ao entrar no pane
    if (currentStep === 2) {
      // Chips de acesso e validade toggle
      ['setor','equipe','colab'].forEach(t => renderChips(t));
      _updateEquipeLock();
      const temVal = !!(state.dataInicio || state.validade || state.prazo);
      document.getElementById('tog-validade')?.classList.toggle('on', temVal);
      document.getElementById('val-toggle')?.classList.toggle('on', temVal);
      const fv = document.getElementById('validade-fields');
      if (fv) fv.style.display = temVal ? 'grid' : 'none';
    }
    if (currentStep === 3) { Conteudo._rebuildTipos(); Conteudo.render(); }
    if (currentStep === 4) {
      // Restaurar toggles de configuração
      const cfg = state.config || {};
      const tog = (id, v) => document.getElementById(id)?.classList.toggle('on', !!v);
      tog('tog-obrigatorio', cfg.obrigatorio);
      tog('tog-certificado', cfg.certificado);
      tog('tog-avaliacao',   cfg.avaliacao);
      tog('tog-progresso',   cfg.progresso);
      tog('tog-ocultar',     cfg.ocultar);
      tog('tog-sequencial',  cfg.sequencial);
      const nm = document.getElementById('nota-min-row');
      if (nm) nm.style.display = cfg.avaliacao ? 'flex' : 'none';
    }
    if (currentStep === 5) renderReview();
  }

  function next() {
    if (!validate(currentStep)) return;
    collectStep(currentStep);
    if (currentStep === TOTAL - 1) {
      publicar();
      return;
    }
    currentStep = Math.min(currentStep + 1, TOTAL - 1);
    updateStepperUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function prev() {
    collectStep(currentStep);
    currentStep = Math.max(currentStep - 1, 0);
    updateStepperUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function jumpTo(i) {
    if (i > currentStep) return; // só volta
    collectStep(currentStep);
    currentStep = i;
    updateStepperUI();
  }

  // ── Coleta de dados ────────────────────────────────────────
  function collectStep(step) {
    if (step === 0) {
      state.nome      = val('f-nome');
      state.categoria = val('f-categoria');
      state.formato   = val('f-formato');
      state.carga     = val('f-carga');
      state.nivel     = val('f-nivel');
      state.descricao = val('f-desc');
    }
    if (step === 1) {
      state.publico = [...document.querySelectorAll('#publico-tags .tag-chip.selected')]
        .map(el => el.dataset.val);
      state.publicoObs = val('f-publico-obs');
    }
    if (step === 2) {
      state.dataInicio = val('f-data-inicio');
      state.validade   = val('f-validade');
      state.prazo      = val('f-prazo');
    }
    if (step === 3) {
      // state.modulos já é gerenciado diretamente por Conteudo.*
    }
    if (step === 4) {
      state.config.obrigatorio = document.getElementById('tog-obrigatorio').classList.contains('on');
      state.config.certificado = document.getElementById('tog-certificado').classList.contains('on');
      state.config.avaliacao   = document.getElementById('tog-avaliacao').classList.contains('on');
      state.config.notaMin     = parseInt(val('f-nota-min')) || 70;
      state.config.progresso   = document.getElementById('tog-progresso').classList.contains('on');
      state.config.ocultar     = document.getElementById('tog-ocultar').classList.contains('on');
      state.config.sequencial  = document.getElementById('tog-sequencial').classList.contains('on');
    }
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  // ── Validação por etapa ────────────────────────────────────
  function validate(step) {
    // Remove erros anteriores
    document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
    document.querySelectorAll('.field-msg').forEach(el => el.remove());

    const markError = (id, msg) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.add('field-error');
      const hint = document.createElement('div');
      hint.className = 'field-msg';
      hint.textContent = msg;
      el.parentNode.appendChild(hint);
      el.focus();
    };

    const blockError = (id, msg) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.add('field-error');
      const hint = document.createElement('div');
      hint.className = 'field-msg';
      hint.textContent = msg;
      el.appendChild(hint);
    };

    if (step === 0) {
      const nome  = val('f-nome');
      const cat   = val('f-categoria');
      const carga = val('f-carga');
      let ok = true;
      if (!nome)                            { markError('f-nome',  'Informe o nome do curso.');    ok = false; }
      if (!cat)                             { markError('f-categoria','Selecione uma categoria.'); ok = false; }
      if (!val('f-formato'))                { markError('f-formato','Selecione o formato.');       ok = false; }
      if (!carga || isNaN(carga) || +carga < 1) { markError('f-carga','Informe a carga horária válida.'); ok = false; }
      if (!val('f-nivel'))                  { markError('f-nivel','Selecione o nível.');           ok = false; }
      if (!val('f-desc'))                   { markError('f-desc','Informe a descrição do curso.'); ok = false; }
      if (!state.capa)                      { blockError('f-capa-zone','Selecione a imagem/capa do curso.'); ok = false; }
      return ok;
    }

    if (step === 1) {
      if (!val('f-publico-obs')) { markError('f-publico-obs','Informe a observação sobre o público-alvo.'); return false; }
      return true;
    }

    if (step === 2) {
      if (state.visib !== 'todos' && state.visib !== 'restrito') {
        blockError('vis-group','Selecione a visibilidade do curso.');
        return false;
      }
      if (state.visib === 'restrito') {
        const total = (state.acessos.setor.length + state.acessos.equipe.length + state.acessos.colab.length);
        if (!total) { blockError('restricoes-panel','Defina ao menos uma restrição de acesso.'); return false; }
      }
      if (document.getElementById('tog-validade')?.classList.contains('on')) {
        const di = val('f-data-inicio'), df = val('f-validade'), pz = val('f-prazo');
        let ok = true;
        if (!di) { markError('f-data-inicio','Informe a data inicial.'); ok = false; }
        if (!df) { markError('f-validade','Informe a data final.'); ok = false; }
        else if (di && df < di) { markError('f-validade','A data final deve ser após a inicial.'); ok = false; }
        if (pz === '' || isNaN(pz) || +pz < 0) { markError('f-prazo','Informe o prazo (0 = sem prazo).'); ok = false; }
        if (!ok) return false;
      }
      return true;
    }

    if (step === 3) {
      const semAula = state.modulos.find(m => !m.aulas || !m.aulas.length);
      if (semAula) { alert(`O módulo "${semAula.titulo || 'sem título'}" precisa de ao menos uma aula.`); return false; }
      return true;
    }
    return true;
  }

  // ── Público-alvo: tags ─────────────────────────────────────
  function toggleTag(el) {
    el.classList.toggle('selected');
  }

  // ── Acesso: visibilidade ───────────────────────────────────
  function setVisib(tipo) {
    state.visib = tipo;
    const isRestrito = tipo === 'restrito';
    const rowTodos   = document.getElementById('vis-todos');
    const rowRestrito = document.getElementById('vis-restrito');
    rowTodos.classList.toggle('checked', !isRestrito);
    rowRestrito.classList.toggle('checked', isRestrito);
    document.getElementById('restricoes-panel').style.display = isRestrito ? 'block' : 'none';
  }

  // ── Dados para autocomplete ────────────────────────────────
  // Fontes reais:
  //  • setor  → Setores e Equipes (Storage.Setores)
  //  • equipe → Setores e Equipes (Storage.Equipes) — só do(s) setor(es) selecionado(s)
  //  • colab  → Alunos > Colaboradores cadastrados (Storage.Alunos)
  // ATENÇÃO: window.Storage é a Web Storage API nativa do browser e sempre existe.
  // Usar Storage (sem window.) resolve o var declarado em storage.js, mas só se
  // o módulo customizado estiver disponível (.Setores é o discriminador).
  function _EadStorage() { return (typeof Storage !== 'undefined' && Storage.Setores) ? Storage : null; }
  function _setores() { try { const s = _EadStorage(); return s ? s.Setores.listar() : []; } catch(e){ return []; } }
  function _equipes() { try { const s = _EadStorage(); return s ? s.Equipes.listar() : []; } catch(e){ return []; } }
  function _alunos()  {
    try {
      const s = _EadStorage();
      if (!s) return [];
      return s.Alunos.listar().filter(a => a.ativo === true || a.statusAcesso === 'ativo');
    } catch(e) { return []; }
  }
  function _selSetorIds()  { return _setores().filter(s => state.acessos.setor.includes(s.nome)).map(s => s.id); }

  function acOptions(tipo) {
    if (tipo === 'setor')  return _setores().map(s => s.nome).filter(Boolean).sort();
    if (tipo === 'equipe') {
      const ids = _selSetorIds();
      if (!ids.length) return []; // Equipe liberada só com setor vinculado
      return _equipes().filter(e => ids.includes(e.setorId)).map(e => e.nome).filter(Boolean).sort();
    }
    if (tipo === 'colab') {
      return _alunos().map(a => a.nome).filter(Boolean).sort();
    }
    return [];
  }

  // Mantém estado coerente: equipe exige setor; remove equipes órfãs.
  function _reconcileAccess() {
    const ids = _selSetorIds();
    const validEquipes = ids.length
      ? _equipes().filter(e => ids.includes(e.setorId)).map(e => e.nome)
      : [];
    state.acessos.equipe = state.acessos.equipe.filter(n => validEquipes.includes(n));
    _updateEquipeLock();
  }

  function _updateEquipeLock() {
    const hasSetor = state.acessos.setor.length > 0;
    const inp = document.getElementById('ac-equipe');
    const acc = document.getElementById('acc-equipe');
    if (inp) {
      inp.disabled = !hasSetor;
      inp.placeholder = hasSetor ? 'Buscar equipe...' : 'Selecione um setor primeiro';
    }
    if (acc) acc.style.opacity = hasSetor ? '' : '.55';
    if (!hasSetor) {
      const dd = document.getElementById('acd-equipe');
      if (dd) { dd.classList.remove('open'); dd.innerHTML = ''; }
    }
  }
  let _acFocused = {}; // índice focado por tipo

  // ── Accordion ──────────────────────────────────────────────
  function toggleAcc(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('open');
    if (el.classList.contains('open')) {
      const inp = el.querySelector('.ac-input');
      if (inp) setTimeout(() => { inp.focus(); acOpen(id.replace('acc-', '')); }, 50);
    }
  }

  // ── Autocomplete ───────────────────────────────────────────
  // Fecha todos os dropdowns ao clicar fora de qualquer acc-item
  document.addEventListener('click', e => {
    if (!e.target.closest('.acc-item'))
      document.querySelectorAll('.ac-dropdown.open').forEach(d => d.classList.remove('open'));
  });

  function acOpen(tipo) {
    acFilter(tipo, document.getElementById('ac-' + tipo)?.value || '');
  }

  function acFilter(tipo, q) {
    const dd = document.getElementById('acd-' + tipo);
    if (!dd) return;
    const opts = acOptions(tipo);
    const term = q.toLowerCase().trim();
    const filtered = opts.filter(o =>
      o.toLowerCase().includes(term) && !state.acessos[tipo].includes(o)
    );
    _acFocused[tipo] = -1;
    dd.innerHTML = filtered.length
      ? filtered.map((o, i) => {
          const hi = term ? o.replace(new RegExp(`(${term})`, 'gi'), '<span class="ac-match">$1</span>') : o;
          return `<div class="ac-opt" data-val="${escHtml(o)}" data-i="${i}" onmousedown="event.preventDefault();Wizard.acSelect('${tipo}','${escHtml(o)}')">${hi}</div>`;
        }).join('')
      : `<div class="ac-empty">Nenhum resultado</div>`;
    dd.classList.add('open');
  }

  function acSelect(tipo, nome) {
    if (!nome || state.acessos[tipo].includes(nome)) return;
    state.acessos[tipo].push(nome);
    if (tipo === 'setor') { _reconcileAccess(); renderChips('equipe'); }
    renderChips(tipo);
    const inp = document.getElementById('ac-' + tipo);
    if (inp) { inp.value = ''; inp.focus(); }
    acFilter(tipo, ''); // re-abre com lista atualizada
  }

  function acKey(e, tipo) {
    const dd = document.getElementById('acd-' + tipo);
    if (!dd || !dd.classList.contains('open')) return;
    const opts = dd.querySelectorAll('.ac-opt');
    if (!opts.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _acFocused[tipo] = Math.min((_acFocused[tipo] ?? -1) + 1, opts.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      _acFocused[tipo] = Math.max((_acFocused[tipo] ?? 0) - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = _acFocused[tipo] ?? -1;
      if (idx >= 0 && opts[idx]) acSelect(tipo, opts[idx].dataset.val);
      return;
    } else if (e.key === 'Escape') {
      dd.classList.remove('open'); return;
    }
    opts.forEach((o, i) => o.classList.toggle('focused', i === _acFocused[tipo]));
  }

  function removeAccess(tipo, nome) {
    state.acessos[tipo] = state.acessos[tipo].filter(n => n !== nome);
    if (tipo === 'setor') { _reconcileAccess(); renderChips('equipe'); }
    renderChips(tipo);
  }

  const CHIP_MAX = 4; // max chips visíveis antes de colapsar

  function renderChips(tipo) {
    const wrap = document.getElementById('chips-' + tipo);
    const cnt  = document.getElementById('cnt-' + tipo);
    if (!wrap) return;
    const lista = state.acessos[tipo];
    if (cnt) cnt.textContent = lista.length;

    const visible = lista.slice(0, CHIP_MAX);
    const overflow = lista.slice(CHIP_MAX);
    const expanded = wrap.dataset.expanded === '1';

    const shown = expanded ? lista : visible;
    wrap.innerHTML = shown.map(nome =>
      `<span class="chip-compact ${tipo}" title="${escHtml(nome)}">
        ${escHtml(nome.length > 18 ? nome.slice(0,16)+'…' : nome)}
        <button onclick="Wizard.removeAccess('${tipo}','${escHtml(nome)}')" title="Remover">×</button>
      </span>`
    ).join('');

    if (!expanded && overflow.length) {
      const more = document.createElement('button');
      more.className = 'chip-more';
      more.textContent = `+${overflow.length}`;
      more.onclick = () => { wrap.dataset.expanded = '1'; renderChips(tipo); };
      wrap.appendChild(more);
    }
    if (expanded && lista.length > CHIP_MAX) {
      const less = document.createElement('button');
      less.className = 'chip-more';
      less.textContent = 'Menos ▲';
      less.onclick = () => { wrap.dataset.expanded = '0'; renderChips(tipo); };
      wrap.appendChild(less);
    }
  }

  // Manter compatibilidade (collectStep usa state.acessos diretamente)
  function addAccess() {} // não usado mais

  // ── Validade — sem label wrapping input ───────────────────
  // ── Cancelar: volta para a Gestão de cursos ────────────────
  function cancelar() {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage('wizard:cancelar', '*');
    } else {
      window.location.href = 'admin.html';
    }
  }

  function toggleValidade() {
    const tog = document.getElementById('tog-validade');
    const row = document.getElementById('val-toggle');
    const fields = document.getElementById('validade-fields');
    const isOn = tog.classList.toggle('on');
    row.classList.toggle('on', isOn);
    fields.style.display = isOn ? 'grid' : 'none';
  }

  // ── Toggles ────────────────────────────────────────────────
  function toggleSwitch(el) {
    el.classList.toggle('on');
    if (el.id === 'tog-avaliacao') {
      document.getElementById('nota-min-row').style.display =
        el.classList.contains('on') ? 'flex' : 'none';
    }
  }

  // toggleCheck mantido para compatibilidade (não mais usado em validade)
  function toggleCheck(label) {
    label.classList.toggle('checked');
  }

  // ── Preview de capa ────────────────────────────────────────
  function previewCapa(input) {
    const file = input.files[0];
    if (!file) return;
    state.capaName = file.name;
    const reader = new FileReader();
    reader.onload = e => {
      const original = e.target.result;
      const preview = document.getElementById('f-capa-preview');
      if (preview) { preview.src = original; preview.style.display = 'block'; }
      // Redimensiona/comprime antes de armazenar para não estourar a quota do localStorage.
      _comprimirCapa(original, dataUrl => { state.capa = dataUrl; });
    };
    reader.readAsDataURL(file);
  }

  /**
   * Reduz a imagem para no máx. 800px de largura e re-codifica em JPEG (~0.8).
   * Em caso de falha, mantém a data URL original como fallback.
   * @param {string} dataUrl  data URL de origem
   * @param {(out:string)=>void} cb  recebe a data URL resultante
   */
  function _comprimirCapa(dataUrl, cb) {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const MAX_W = 800;
          const escala = img.width > MAX_W ? MAX_W / img.width : 1;
          const canvas = document.createElement('canvas');
          canvas.width  = Math.round(img.width  * escala);
          canvas.height = Math.round(img.height * escala);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          cb(canvas.toDataURL('image/jpeg', 0.8));
        } catch (err) {
          console.warn('[Wizard] Falha ao comprimir capa, usando original:', err);
          cb(dataUrl);
        }
      };
      img.onerror = () => cb(dataUrl);
      img.src = dataUrl;
    } catch (err) {
      console.warn('[Wizard] Compressão de capa indisponível, usando original:', err);
      cb(dataUrl);
    }
  }

  // ── Materiais ──────────────────────────────────────────────
  function addFiles(input) {
    Array.from(input.files).forEach(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      state.materiais.push({
        id: Date.now() + Math.random(),
        tipo: 'file',
        nome: file.name,
        ext,
        tamanho: formatBytes(file.size),
      });
    });
    renderMateriais();
    input.value = '';
  }

  function addLink() {
    const url  = document.getElementById('f-link-url').value.trim();
    const nome = document.getElementById('f-link-nome').value.trim();
    if (!url) { alert('Informe a URL do link.'); return; }
    state.materiais.push({ id: Date.now(), tipo: 'link', nome: nome || url, ext: 'link', tamanho: '' });
    document.getElementById('f-link-url').value = '';
    document.getElementById('f-link-nome').value = '';
    renderMateriais();
  }

  function addQuiz() {
    // Avaliação é única — controla visualmente, não via lista
    const btn  = document.getElementById('btn-add-quiz');
    const chip = document.getElementById('quiz-chip');
    if (btn)  btn.style.display  = 'none';
    if (chip) chip.style.display = 'flex';
    // Marca no state se ainda não há quiz
    if (!state.materiais.find(m => m.tipo === 'quiz')) {
      state.materiais.push({ id: 'quiz-' + Date.now(), tipo: 'quiz', nome: 'Avaliação do Curso', ext: 'quiz', tamanho: '' });
      renderMateriais();
    }
  }

  function removeQuiz() {
    state.materiais = state.materiais.filter(m => m.tipo !== 'quiz');
    const btn  = document.getElementById('btn-add-quiz');
    const chip = document.getElementById('quiz-chip');
    if (btn)  btn.style.display  = '';
    if (chip) chip.style.display = 'none';
    renderMateriais();
  }

  function removeMaterial(id) {
    const mat = state.materiais.find(m => String(m.id) === String(id));
    if (mat?.tipo === 'quiz') { removeQuiz(); return; }
    state.materiais = state.materiais.filter(m => String(m.id) !== String(id));
    renderMateriais();
  }

  function renderMateriais() {
    const list  = document.getElementById('file-list');
    const empty = document.getElementById('file-empty');
    const count = document.getElementById('mat-count');
    if (!list) return;

    const semQuiz = state.materiais.filter(m => m.tipo !== 'quiz');
    if (count) count.textContent = state.materiais.length;

    if (!semQuiz.length) {
      if (empty) { list.innerHTML = ''; list.appendChild(empty); empty.style.display = 'block'; }
      return;
    }
    if (empty) empty.style.display = 'none';
    const labelMap = { pdf:'PDF', mp4:'VID', webm:'VID', xlsx:'XLS', xls:'XLS',
                       doc:'DOC', docx:'DOC', pptx:'PPT', zip:'ZIP', link:'URL', quiz:'QUIZ' };
    list.innerHTML = semQuiz.map(m => {
      const label = labelMap[m.ext] || m.ext.toUpperCase();
      return `<div class="file-item">
        <div class="file-icon ${m.ext}">${label}</div>
        <div class="file-name">${escHtml(m.nome)}</div>
        <div class="file-size">${m.tamanho}</div>
        <button type="button" class="file-del" onclick="Wizard.removeMaterial('${m.id}')" title="Remover">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>`;
    }).join('');
  }

  // ── Revisão ────────────────────────────────────────────────
  function renderReview() {
    collectStep(currentStep);

    const cfg = state.config;
    const pub = state.publico.length ? state.publico.join(', ') : 'Não definido';

    const acessoItems = Object.entries(state.acessos)
      .flatMap(([tipo, lista]) => lista.map(n =>
        `<span class="access-tag ${tipo}" style="margin:2px">${n}</span>`
      )).join('') || '<span style="color:var(--text4);font-size:12px">Todos os colaboradores</span>';

    const matHtml = state.materiais.length
      ? state.materiais.map(m =>
          `<span style="font-size:12px;background:var(--bg);padding:2px 8px;border-radius:99px;border:1px solid var(--border);color:var(--text2);margin:2px;display:inline-block">${escHtml(m.nome)}</span>`
        ).join('')
      : '<span style="color:var(--text4);font-size:12px">Nenhum material</span>';

    const togStr = (v) => v
      ? '<span class="badge badge-green">Sim</span>'
      : '<span style="color:var(--text4);font-size:12px">Não</span>';

    document.getElementById('review-body').innerHTML = `

      <div class="review-section">
        <h3>Dados do Curso</h3>
        <div class="review-row"><div class="rv-label">Nome</div><div class="rv-val"><strong>${escHtml(state.nome) || '—'}</strong></div></div>
        <div class="review-row"><div class="rv-label">Categoria</div><div class="rv-val">${escHtml(state.categoria) || '—'}</div></div>
        <div class="review-row"><div class="rv-label">Formato</div><div class="rv-val">${(()=>{ const sel=document.getElementById('f-formato'); const opt=sel&&[...sel.options].find(o=>o.value===state.formato); return opt?escHtml(opt.text):escHtml(state.formato||'—'); })()}</div></div>
        <div class="review-row"><div class="rv-label">Carga horária</div><div class="rv-val">${state.carga ? state.carga + 'h' : '—'}</div></div>
        <div class="review-row"><div class="rv-label">Nível</div><div class="rv-val">${{basico:'Básico',intermediario:'Intermediário',avancado:'Avançado'}[state.nivel]}</div></div>
        <div class="review-row"><div class="rv-label">Descrição</div><div class="rv-val" style="color:var(--text3)">${escHtml(state.descricao) || '—'}</div></div>
        <div class="review-row"><div class="rv-label">Capa</div><div class="rv-val">${state.capaName ? `<span class="badge badge-green">${escHtml(state.capaName)}</span>` : '<span style="color:var(--text4);font-size:12px">Não definida</span>'}</div></div>
      </div>

      <div class="review-section">
        <h3>Público-alvo</h3>
        <div class="review-row"><div class="rv-label">Observação</div><div class="rv-val" style="color:var(--text3)">${escHtml(state.publicoObs)||'—'}</div></div>
      </div>

      <div class="review-section">
        <h3>Controle de Acesso</h3>
        <div class="review-row"><div class="rv-label">Visibilidade</div><div class="rv-val">${state.visib==='todos'?'Todos os colaboradores':'Acesso restrito'}</div></div>
        <div class="review-row"><div class="rv-label">Restrições</div><div class="rv-val"><div class="review-tags">${acessoItems}</div></div></div>
        <div class="review-row"><div class="rv-label">Validade</div><div class="rv-val">${state.validade ? new Date(state.validade).toLocaleDateString('pt-BR') : 'Sem validade'}</div></div>
        <div class="review-row"><div class="rv-label">Prazo de conclusão</div><div class="rv-val">${state.prazo ? state.prazo + ' dias' : 'Sem prazo'}</div></div>
      </div>

      <div class="review-section">
        <h3>Configurações</h3>
        <div class="review-row"><div class="rv-label">Obrigatório</div><div class="rv-val">${togStr(cfg.obrigatorio)}</div></div>
        <div class="review-row"><div class="rv-label">Certificado</div><div class="rv-val">${togStr(cfg.certificado)}</div></div>
        <div class="review-row"><div class="rv-label">Avaliação</div><div class="rv-val">${togStr(cfg.avaliacao)}${cfg.avaliacao?' — nota mínima: '+cfg.notaMin+'%':''}</div></div>
        <div class="review-row"><div class="rv-label">Progresso</div><div class="rv-val">${togStr(cfg.progresso)}</div></div>
        <div class="review-row"><div class="rv-label">Ocultar pós-conclusão</div><div class="rv-val">${togStr(cfg.ocultar)}</div></div>
        <div class="review-row"><div class="rv-label">Acesso sequencial</div><div class="rv-val">${togStr(cfg.sequencial)}</div></div>
      </div>`;
  }

  // ── Publicar ───────────────────────────────────────────────
  // ── Persiste curso no localStorage (mesmo schema do Storage.Cursos) ──
  function _buildCursoObj(statusOverride) {
    const agora = new Date().toISOString();
    const isPublicado = statusOverride === 'publicado';
    return {
      titulo:      state.nome,
      descricao:   state.descricao,
      categoria:   state.categoria,
      formato:     state.formato,
      carga:       parseInt(state.carga) || 0,
      nivel:       state.nivel,
      capa:        state.capa || null,
      capaName:    state.capaName || null,
      publico:     state.publico,
      publicoObs:  state.publicoObs,
      visib:       state.visib,
      acessos:     state.acessos,
      validadeAte:  state.validade   || null,
      dataInicio:   state.dataInicio || null,
      prazo:        state.prazo      || null,
      modulos:     state.modulos,
      materiais:   state.materiais,
      config:      state.config,
      status:      statusOverride,
      publicadoEm: isPublicado ? agora : null,
    };
  }

  /**
   * Explode state.modulos (estrutura aninhada do wizard) para ead_modulos + ead_aulas.
   * @param {string} cursoId
   * @param {Array}  modulos  — state.modulos do wizard
   */
  function _persistirModulosAulas(cursoId, modulos) {
    if (!modulos || !modulos.length) return;
    try {
      if (typeof Storage !== 'undefined' && Storage.Modulos) {
        // Remove módulos/aulas anteriores deste curso
        Storage.Modulos.listarPorCurso(cursoId).forEach(m => Storage.Modulos.excluir(m.id));
        modulos.forEach((mod, mi) => {
          const novoMod = Storage.Modulos.criar({
            cursoId, titulo: mod.titulo || `Módulo ${mi + 1}`,
            descricao: mod.descricao || '', ordem: mi + 1,
          });
          (mod.aulas || []).forEach((aula, ai) => {
            Storage.Aulas.criar({
              moduloId: novoMod.id,
              titulo:   aula.titulo || `Aula ${ai + 1}`,
              tipo:     aula.tipo   || 'video',
              conteudo: aula.conteudo || aula.url || '',
              duracao:  parseInt(aula.durMin) || 0,
              ordem:    ai + 1,
            });
          });
        });
      } else {
        // Fallback direto em localStorage
        const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const now   = () => new Date().toISOString();
        let mods  = JSON.parse(localStorage.getItem('ead_modulos') || '[]').filter(m => m.cursoId !== cursoId);
        let aulas = JSON.parse(localStorage.getItem('ead_aulas')   || '[]');
        const modIdsAntigos = JSON.parse(localStorage.getItem('ead_modulos') || '[]')
          .filter(m => m.cursoId === cursoId).map(m => m.id);
        aulas = aulas.filter(a => !modIdsAntigos.includes(a.moduloId));
        modulos.forEach((mod, mi) => {
          const mid = genId();
          mods.push({ id: mid, cursoId, titulo: mod.titulo || `Módulo ${mi+1}`, descricao: mod.descricao || '', ordem: mi+1, criadoEm: now() });
          (mod.aulas || []).forEach((aula, ai) => {
            aulas.push({ id: genId(), moduloId: mid, titulo: aula.titulo || `Aula ${ai+1}`, tipo: aula.tipo || 'video', conteudo: aula.conteudo || aula.url || '', duracao: parseInt(aula.durMin)||0, ordem: ai+1, criadoEm: now() });
          });
        });
        localStorage.setItem('ead_modulos', JSON.stringify(mods));
        localStorage.setItem('ead_aulas',   JSON.stringify(aulas));
      }
    } catch(e) { console.error('[Wizard] Erro ao persistir módulos/aulas:', e); }
  }

  /**
   * Persiste state.acessos em Storage.Restricoes (ead_restricoes).
   * Resolve IDs por nome para setores/equipes/colaboradores.
   * @param {string} cursoId
   * @param {'todos'|'restrito'} visib
   * @param {{ setor: string[], equipe: string[], colab: string[] }} acessos
   */
  function _persistirRestricoesAcesso(cursoId, visib, acessos) {
    try {
      const S = (typeof Storage !== 'undefined' && Storage.Restricoes) ? Storage : null;
      if (!S) return;
      // Limpa restrições anteriores deste curso
      S.Restricoes.limpar(cursoId);
      if (visib !== 'restrito') return; // sem restrição = acesso universal
      const setores  = S.Setores ? S.Setores.listar()  : [];
      const equipes  = S.Equipes ? S.Equipes.listar()  : [];
      const alunos   = S.Alunos  ? S.Alunos.listar()   : [];
      (acessos.setor  || []).forEach(nome => {
        const s = setores.find(x => x.nome === nome);
        if (s) S.Restricoes.adicionar({ cursoId, tipo: 'setor',       refId: s.id });
      });
      (acessos.equipe || []).forEach(nome => {
        const e = equipes.find(x => x.nome === nome);
        if (e) S.Restricoes.adicionar({ cursoId, tipo: 'equipe',      refId: e.id });
      });
      (acessos.colab  || []).forEach(nome => {
        const a = alunos.find(x => x.nome === nome || x.email === nome);
        if (a) S.Restricoes.adicionar({ cursoId, tipo: 'colaborador', refId: a.id });
      });
    } catch(e) { console.error('[Wizard] Erro ao persistir restrições:', e); }
  }

  function _persistirCurso(dadosCurso) {
    // Storage é declarado por storage.js (var Storage = ...) carregado antes deste script.
    // NÃO usar window.Storage — no browser, window.Storage é a Web Storage API nativa,
    // que sempre existe mas não tem .Cursos, causando fallback incorreto para localStorage direto.
    try {
      if (typeof Storage !== 'undefined' && Storage.Cursos) {
        const novo = Storage.Cursos.criar(dadosCurso);
        _persistirModulosAulas(novo.id, dadosCurso.modulos);
        _persistirRestricoesAcesso(novo.id, dadosCurso.visib, dadosCurso.acessos);
        console.log('[Wizard] Curso criado:', novo?.id, novo?.titulo);
      } else {
        console.warn('[Wizard] Storage.Cursos não disponível, escrita direta');
        const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        const novoId = genId();
        const lista = JSON.parse(localStorage.getItem('ead_cursos') || '[]');
        lista.push({ ...dadosCurso, id: novoId, criadoEm: new Date().toISOString() });
        localStorage.setItem('ead_cursos', JSON.stringify(lista));
        // NÃO setar ead_seeded_v2 — evita reset acidental dos dados pelo seed()
        _persistirModulosAulas(novoId, dadosCurso.modulos);
      }
    } catch(e) {
      console.error('[Wizard] Erro ao persistir:', e);
      try {
        const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        const novoId = genId();
        const lista = JSON.parse(localStorage.getItem('ead_cursos') || '[]');
        lista.push({ ...dadosCurso, id: novoId, criadoEm: new Date().toISOString() });
        localStorage.setItem('ead_cursos', JSON.stringify(lista));
        _persistirModulosAulas(novoId, dadosCurso.modulos);
      } catch(e2) { console.error('[Wizard] Fallback falhou:', e2); }
    }
    localStorage.removeItem('ead_draft_curso');
  }

  function publicar() {
    collectStep(currentStep);
    const dados = _buildCursoObj('publicado');
    if (_editId) {
      // Modo edição — atualizar curso existente
      try {
        if (typeof Storage !== 'undefined' && Storage.Cursos) {
          Storage.Cursos.atualizar(_editId, dados);
          _persistirModulosAulas(_editId, dados.modulos);
          _persistirRestricoesAcesso(_editId, dados.visib, dados.acessos);
        } else {
          const lista = JSON.parse(localStorage.getItem('ead_cursos') || '[]');
          const idx = lista.findIndex(c => c.id === _editId);
          if (idx >= 0) lista[idx] = { ...lista[idx], ...dados };
          localStorage.setItem('ead_cursos', JSON.stringify(lista));
          _persistirModulosAulas(_editId, dados.modulos);
        }
      } catch(e) { console.error('[Wizard] Erro ao atualizar:', e); }
    } else {
      _persistirCurso(dados);
    }
    localStorage.removeItem('ead_draft_curso');
    const titulo = document.getElementById('modal-sucesso-titulo');
    if (titulo) titulo.textContent = _editId ? 'Curso atualizado com sucesso!' : 'Curso publicado com sucesso!';
    document.getElementById('modal-nome-curso').textContent =
      `"${state.nome}" foi ${_editId ? 'atualizado' : 'publicado'} e já está disponível para os colaboradores.`;
    document.getElementById('modal-sucesso').classList.add('open');
  }

  // ── Rascunho ───────────────────────────────────────────────
  function saveDraft() {
    collectStep(currentStep);
    // Salva apenas o estado do wizard para retomada — NÃO cria entrada em ead_cursos
    try {
      localStorage.setItem('ead_draft_curso', JSON.stringify({ state, currentStep }));
    } catch(e) {}
    const statusEl = document.getElementById('autosave-status');
    if (statusEl) {
      statusEl.textContent = 'Rascunho salvo';
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    }
  }

  function loadDraft() {
    try {
      const d = JSON.parse(localStorage.getItem('ead_draft_curso'));
      if (!d) return;
      // Mostra banner não-bloqueante em vez de confirm()
      const banner = document.createElement('div');
      banner.id = 'draft-banner';
      banner.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;background:var(--blue-l);border:1.5px solid var(--blue-m);border-radius:var(--rl);padding:12px 16px;margin-bottom:16px;font-size:13px;color:var(--blue)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style="flex:1"><strong>Rascunho encontrado</strong> — você tem um cadastro não finalizado.</span>
          <button onclick="Wizard._applyDraft()" style="background:var(--blue);color:#fff;border:none;border-radius:var(--r);padding:5px 13px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font)">Continuar</button>
          <button onclick="Wizard._discardDraft()" style="background:none;border:none;font-size:12px;color:var(--blue);cursor:pointer;font-weight:500;font-family:var(--font)">Descartar</button>
        </div>`;
      const content = document.querySelector('.content');
      if (content) content.insertBefore(banner, content.firstChild);
      // Salva o draft para uso posterior
      _pendingDraft = d;
    } catch(e) {}
  }

  function restoreFields() {
    _populateSelects(); // garante que as opções existam antes de setar o valor salvo
    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
    // Dados gerais
    setVal('f-nome',       state.nome);
    setVal('f-categoria',  state.categoria);
    setVal('f-formato',    state.formato);
    setVal('f-carga',      state.carga);
    setVal('f-nivel',      state.nivel);
    setVal('f-desc',       state.descricao);
    setVal('f-publico-obs',state.publicoObs);

    // Validade
    setVal('f-data-inicio', state.dataInicio);
    setVal('f-validade',    state.validade);
    setVal('f-prazo',       state.prazo);
    const temValidade = !!(state.dataInicio || state.validade || state.prazo);
    const togVal   = document.getElementById('tog-validade');
    const rowVal   = document.getElementById('val-toggle');
    const fldVal   = document.getElementById('validade-fields');
    if (temValidade) {
      togVal?.classList.add('on');
      rowVal?.classList.add('on');
      if (fldVal) fldVal.style.display = 'grid';
    }

    // Capa
    if (state.capa) {
      const img = document.getElementById('f-capa-preview');
      if (img) { img.src = state.capa; img.style.display = 'block'; }
    }

    // Visibilidade + chips de acesso (accordion)
    setVisib(state.visib || 'todos');
    ['setor','equipe','colab'].forEach(t => renderChips(t));
    _updateEquipeLock();

    // Materiais — só renderiza se o elemento já existir no DOM
    // (pane-4 pode estar oculto; renderMateriais verifica internamente)
    renderMateriais();

    // Módulos — Conteudo.render() checa se o elemento existe
    if (typeof Conteudo !== 'undefined') Conteudo.render();

    // Configurações
    const tog = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle('on', !!val);
    };
    const cfg = state.config || {};
    tog('tog-obrigatorio', cfg.obrigatorio);
    tog('tog-certificado', cfg.certificado);
    tog('tog-avaliacao',   cfg.avaliacao);
    tog('tog-progresso',   cfg.progresso);
    tog('tog-ocultar',     cfg.ocultar);
    tog('tog-sequencial',  cfg.sequencial);
    setVal('f-nota-min', cfg.notaMin || 70);
    const notaRow = document.getElementById('nota-min-row');
    if (notaRow) notaRow.style.display = cfg.avaliacao ? 'flex' : 'none';

    // Quiz chip
    const temQuiz = state.materiais.some(m => m.tipo === 'quiz');
    const btnQuiz  = document.getElementById('btn-add-quiz');
    const chipQuiz = document.getElementById('quiz-chip');
    if (btnQuiz)  btnQuiz.style.display  = temQuiz ? 'none' : '';
    if (chipQuiz) chipQuiz.style.display = temQuiz ? 'flex' : 'none';
  }

  // ── Modal ──────────────────────────────────────────────────
  function fecharModal() {
    document.getElementById('modal-sucesso').classList.remove('open');
    if (window.parent && window.parent !== window) {
      window.parent.postMessage('wizard:concluido', '*');
    } else {
      window.location.href = 'admin.html';
    }
  }

  function irParaCurso() {
    if (window.parent && window.parent !== window) {
      // Dentro do drawer: fecha e pede ao admin para ir para cursos
      window.parent.postMessage('wizard:concluido', '*');
    } else {
      // Navegação direta: vai para admin e sinaliza aba cursos via hash
      window.location.href = 'admin.html#cursos';
    }
  }

  // ── Utils ──────────────────────────────────────────────────
  function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function formatBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
    return (b/1048576).toFixed(1) + ' MB';
  }

  // ── Init ───────────────────────────────────────────────────
  function _loadEditMode() {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    if (!editId) return;

    // Tentar via Storage object (pode ter sido sobrescrito pelo storage.js)
    // Fallback: ler diretamente do localStorage
    let c = null;
    try {
      if (typeof Storage !== 'undefined' && Storage.Cursos?.obter) {
        c = Storage.Cursos.obter(editId);
      }
    } catch(e) {}

    if (!c) {
      // Fallback direto
      try {
        const lista = JSON.parse(localStorage.getItem('ead_cursos') || '[]');
        c = lista.find(x => x.id === editId) || null;
      } catch(e) {}
    }

    if (!c) { console.warn('[Wizard] Curso não encontrado para edição:', editId); return; }

    _editId = editId;
    state.nome        = c.titulo        || '';
    state.categoria   = c.categoria     || '';
    state.formato     = c.formato       || 'ead';
    state.carga       = String(c.carga  || '');
    state.nivel       = c.nivel         || 'basico';
    state.descricao   = c.descricao     || '';
    state.capa        = c.capa          || null;
    state.capaName    = c.capaName      || null;
    state.publico     = c.publico       || [];
    state.publicoObs  = c.publicoObs    || '';
    state.visib       = c.visib         || 'todos';
    state.acessos     = c.acessos       || { setor:[], equipe:[], colab:[] };
    state.dataInicio  = c.dataInicio    || '';
    state.validade    = c.validadeAte   || '';
    state.prazo       = c.prazo         || '';
    state.modulos     = c.modulos       || [];
    state.materiais   = c.materiais     || [];
    state.config      = { ...state.config, ...(c.config || {}) };
    document.title = 'Editar Curso — Radar EAD';
    console.log('[Wizard] Modo edição:', editId, '|', state.nome, '| materiais:', state.materiais.length);
  }

  // ── Popula selects dinâmicos com dados das Configurações ──
  function _populateSelects() {
    const _e = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    // Categoria de curso (ead_cfg_cat_curso)
    const selCat = document.getElementById('f-categoria');
    if (selCat) {
      try {
        const raw = localStorage.getItem('ead_cfg_cat_curso');
        const lista = raw ? JSON.parse(raw) : [];
        const cats = Array.isArray(lista) && lista.length ? lista
          : [{ nome:'Técnica' },{ nome:'Comportamental' },{ nome:'Regulatória' },{ nome:'Liderança' }];
        const cur = selCat.value;
        selCat.innerHTML = '<option value="">Selecione...</option>' +
          cats.map(c => `<option value="${_e(c.nome)}"${c.nome===cur?' selected':''}>${_e(c.nome)}</option>`).join('');
      } catch(e) {}
    }
    // Formato de curso (ead_cfg_fmt_aula)
    const selFmt = document.getElementById('f-formato');
    if (selFmt) {
      try {
        const raw = localStorage.getItem('ead_cfg_fmt_aula');
        const lista = raw ? JSON.parse(raw) : [];
        const fmts = Array.isArray(lista) && lista.length ? lista
          : [{ nome:'EAD (Online)' },{ nome:'Híbrido' },{ nome:'Presencial' }];
        const cur = selFmt.value;
        selFmt.innerHTML = '<option value="">Selecione...</option>' +
          fmts.map(f => {
            const slug = f.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
            return `<option value="${_e(slug)}"${slug===cur||f.nome===cur?' selected':''}>${_e(f.nome)}</option>`;
          }).join('');
      } catch(e) {}
    }
  }

  function init() {
    try { if (typeof Storage !== 'undefined' && Storage.seed) Storage.seed(); } catch(e) {}
    _loadEditMode();
    _populateSelects();
    updateStepperUI();
    // rAF garante que o browser pintou o DOM antes de restaurar campos visuais
    requestAnimationFrame(() => {
      restoreFields();
    });
    if (!_editId) loadDraft();

    setInterval(() => {
      collectStep(currentStep);
      try { localStorage.setItem('ead_draft_curso', JSON.stringify({ state, currentStep })); } catch(e) {}
      const status = document.getElementById('autosave-status');
      if (status) { status.textContent = 'Salvo automaticamente'; setTimeout(() => { status.textContent = ''; }, 2000); }
    }, 30000);
  }

  // ══════════════════════════════════════════════════════════
  // CONTEÚDO — Módulos + Aulas com DnD inline
  // ══════════════════════════════════════════════════════════
  const Conteudo = (() => {
    const _uid = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2,5);

    // Ícones por tipo de aula
    const _svg = (p) => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
    const _DEFAULT_ICO = _svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>');

    // Carrega tipos de material de Configurações > Tipo de material (ead_cfg_tipo_mat)
    const _ICO_SVG = {
      pdf:   '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
      video: '<polygon points="5 3 19 12 5 21 5 3"/>',
      excel: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>',
      ppt:   '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
      link:  '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
      quiz:  '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
      word:  '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 13 10 18 12 14 14 18 15 13"/>',
      audio: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
      image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
      zip:   '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="11" x2="12" y2="11.5"/><line x1="12" y1="14" x2="12" y2="14.5"/>',
      live:  '<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>',
      text:  '<line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>',
    };
    // Paleta de cores por icone (acompanha Configurações > Tipo de material)
    const _ICO_COLOR = {
      video: { bg:'#dbeafe', color:'#1d4ed8' },
      pdf:   { bg:'#fee2e2', color:'#b91c1c' },
      word:  { bg:'#e0e7ff', color:'#4338ca' },
      excel: { bg:'#dcfce7', color:'#15803d' },
      ppt:   { bg:'#fff7ed', color:'#c2410c' },
      audio: { bg:'#fdf4ff', color:'#7e22ce' },
      link:  { bg:'#eff6ff', color:'#2563eb' },
      quiz:  { bg:'#f0fdf4', color:'#166534' },
      live:  { bg:'#fef2f2', color:'#dc2626' },
      image: { bg:'#f3e8ff', color:'#7c3aed' },
      text:  { bg:'#f8fafc', color:'#475569' },
      zip:   { bg:'#f1f5f9', color:'#475569' },
    };
    function _loadTiposAula() {
      try {
        const raw = localStorage.getItem('ead_cfg_tipo_mat');
        if (raw) {
          const lista = JSON.parse(raw);
          if (Array.isArray(lista) && lista.length) return lista;
        }
      } catch(e) {}
      return [
        { nome:'PDF',          icone:'pdf'   },
        { nome:'Vídeo',        icone:'video' },
        { nome:'Planilha',     icone:'excel' },
        { nome:'Apresentação', icone:'ppt'   },
        { nome:'Link Externo', icone:'link'  },
      ];
    }

    function _slugTipo(nome) { return nome.toLowerCase().replace(/[^a-z0-9]/g,'_'); }

    let _tiposAula = _loadTiposAula();
    let TIPO_LABEL = {};
    let TIPO_ICO   = {};
    let TIPO_COLOR = {};
    function _rebuildTipos() {
      _tiposAula = _loadTiposAula();
      TIPO_LABEL = {};
      TIPO_ICO   = {};
      TIPO_COLOR = {};
      _tiposAula.forEach(t => {
        const k = _slugTipo(t.nome);
        TIPO_LABEL[k] = t.nome;
        TIPO_ICO[k]   = _svg(_ICO_SVG[t.icone] || _ICO_SVG.pdf || '');
        TIPO_COLOR[k] = _ICO_COLOR[t.icone] || null;
      });
    }
    _rebuildTipos();

    const _icoOf = (t) => TIPO_ICO[t] || _DEFAULT_ICO;
    const _colorStyleOf = (t) => { const c = TIPO_COLOR[t]; return c ? ` style="background:${c.bg};color:${c.color}"` : ''; };

    // ── DnD state ──────────────────────────────────────────
    let _dragSrcModIdx  = null;
    let _dragSrcAulaIdx = null; // null = dragging módulo

    // ── Context menu ───────────────────────────────────────
    let _ctxClose = null;
    function openCtx(e, html) {
      e.preventDefault(); e.stopPropagation();
      const m = document.getElementById('cnt-ctx');
      if (!m) return;
      m.innerHTML = html;
      m.style.display = 'block';
      const vw = window.innerWidth, vh = window.innerHeight;
      const mw = 180, mh = m.offsetHeight || 200;
      let x = e.clientX, y = e.clientY;
      if (x + mw > vw - 8) x = vw - mw - 8;
      if (y + mh > vh - 8) y = vh - mh - 8;
      m.style.left = x + 'px'; m.style.top = y + 'px';
      m.classList.add('open');
      if (_ctxClose) document.removeEventListener('click', _ctxClose);
      _ctxClose = () => { m.classList.remove('open'); m.style.display='none'; };
      setTimeout(() => document.addEventListener('click', _ctxClose, { once:true }), 10);
    }
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const m = document.getElementById('cnt-ctx');
        if (m) { m.classList.remove('open'); m.style.display='none'; }
      }
    });

    // ── Helpers ────────────────────────────────────────────
    function _modulos() { return state.modulos; }

    function _totalDur() {
      let t = 0;
      _modulos().forEach(m => m.aulas.forEach(a => { t += (parseInt(a.durMin)||0); }));
      return t;
    }

    function _updateStats() {
      const mods  = _modulos().length;
      const aulas = _modulos().reduce((s,m) => s + m.aulas.length, 0);
      const dur   = _totalDur();
      const ms = document.getElementById('cst-mods');
      const as = document.getElementById('cst-aulas');
      const ds = document.getElementById('cst-dur');
      if (ms) ms.textContent = mods;
      if (as) as.textContent = aulas;
      if (ds) ds.textContent = dur >= 60 ? `${Math.floor(dur/60)}h${dur%60?String(dur%60).padStart(2,'0'):''}` : `${dur}min`;
    }

    // ── Render principal ───────────────────────────────────
    function render() {
      const list = document.getElementById('modulos-list');
      if (!list) return;
      const mods = _modulos();

      if (!mods.length) {
        list.innerHTML = `<div class="cnt-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <p>Nenhum módulo ainda. Clique em <strong>Novo módulo</strong> para começar.</p>
        </div>`;
        _updateStats();
        return;
      }

      list.innerHTML = mods.map((mod, mi) => {
        const aulaCount = mod.aulas.length;
        const modDur = mod.aulas.reduce((s,a) => s + (parseInt(a.durMin)||0), 0);
        const statusLabel = { publicado:'pub', rascunho:'rsc', oculto:'ocu' }[mod.status] || 'rsc';
        const statusText  = { publicado:'Publicado', rascunho:'Rascunho', oculto:'Oculto' }[mod.status] || 'Rascunho';
        const isCollapsed = mod.collapsed ? 'collapsed' : '';

        const aulasHtml = mod.aulas.map((aula, ai) => `
          <div class="aula-row" id="aula-${aula.id}"
            draggable="true"
            ondragstart="Conteudo._dndAulaStart(event,${mi},${ai})"
            ondragover="Conteudo._dndAulaOver(event,${mi},${ai})"
            ondragleave="Conteudo._dndAulaLeave(event)"
            ondrop="Conteudo._dndAulaDrop(event,${mi},${ai})">
            <span class="aula-drag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/><circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/></svg>
            </span>
            <span class="aula-type-ico"${_colorStyleOf(aula.tipo)} title="Alterar tipo (${TIPO_LABEL[aula.tipo]||aula.tipo})" onclick="Conteudo._ctxTipo(event,${mi},${ai})">${_icoOf(aula.tipo)}</span>
            <input class="aula-title-input" value="${escHtml(aula.titulo)}" placeholder="Título da aula..."
              oninput="Conteudo._editAulaTitulo(${mi},${ai},this.value)"
              onblur="Conteudo._editAulaTitulo(${mi},${ai},this.value)">
            <span class="aula-dur" onclick="Conteudo._editDur(event,${mi},${ai})" title="Duração">${aula.durMin ? aula.durMin+'min' : '—'}</span>
            <span class="aula-pub-dot ${aula.status==='publicado'?'pub':'rsc'}" title="${aula.status==='publicado'?'Publicado':'Rascunho'}"></span>
            <button type="button" class="aula-action-btn" title="Mais ações"
              onclick="Conteudo._ctxAula(event,${mi},${ai})">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>
            </button>
          </div>`).join('');

        return `<div class="mod-card ${isCollapsed}" id="mod-${mod.id}"
          draggable="true"
          ondragstart="Conteudo._dndModStart(event,${mi})"
          ondragover="Conteudo._dndModOver(event,${mi})"
          ondragleave="Conteudo._dndModLeave(event,${mi})"
          ondrop="Conteudo._dndModDrop(event,${mi})">
          <div class="mod-head">
            <span class="mod-drag-handle" title="Arrastar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/><circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/></svg>
            </span>
            <span class="mod-toggle" onclick="Conteudo.toggleMod(${mi})">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
            <input class="mod-title-input" value="${escHtml(mod.titulo)}" placeholder="Nome do módulo..."
              oninput="Conteudo._editModTitulo(${mi},this.value)"
              onblur="Conteudo._editModTitulo(${mi},this.value)">
            <span class="mod-badge ${statusLabel}">${statusText}</span>
            <span class="mod-meta">
              <span>${aulaCount} aula${aulaCount!==1?'s':''}</span>
              ${modDur ? `<span>· ${modDur}min</span>` : ''}
            </span>
            <button type="button" class="mod-actions-btn" onclick="Conteudo._ctxMod(event,${mi})" title="Ações do módulo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>
            </button>
          </div>
          <div class="mod-body">
            ${aulasHtml}
            <div id="type-picker-${mi}" class="type-picker">
              ${Object.entries(TIPO_LABEL).map(([k,v]) => `
                <div class="type-opt" onclick="Conteudo._addAulaComTipo(${mi},'${k}')">
                  <span class="type-opt-ico">${_icoOf(k)}</span>
                  <span>${v}</span>
                </div>`).join('')}
            </div>
            <button type="button" class="btn-add-aula" onclick="Conteudo._toggleTypePicker(${mi})">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Adicionar aula
            </button>
          </div>
        </div>`;
      }).join('');

      _updateStats();
    }

    // ── Módulos ────────────────────────────────────────────
    function addModulo() {
      state.modulos.push({
        id: _uid(), titulo: 'Novo Módulo', status: 'rascunho',
        collapsed: false,
        aulas: [{ id: _uid(), titulo: '', tipo: 'video', durMin: 0, status: 'rascunho' }],
      });
      render();
      // Focar no input do último módulo
      setTimeout(() => {
        const inputs = document.querySelectorAll('.mod-title-input');
        if (inputs.length) inputs[inputs.length-1].focus();
      }, 50);
    }

    function toggleMod(mi) {
      state.modulos[mi].collapsed = !state.modulos[mi].collapsed;
      const card = document.getElementById('mod-' + state.modulos[mi].id);
      if (card) card.classList.toggle('collapsed', state.modulos[mi].collapsed);
    }

    function _editModTitulo(mi, val) {
      if (state.modulos[mi]) state.modulos[mi].titulo = val;
    }

    function _ctxMod(e, mi) {
      const mod = state.modulos[mi];
      const isPublicado = mod.status === 'publicado';
      const isOculto    = mod.status === 'oculto';
      openCtx(e, `
        <button onclick="Conteudo._modStatus(${mi},'${isPublicado?'rascunho':'publicado'}')">
          ${isPublicado
            ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Despublicar'
            : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Publicar'}
        </button>
        <button onclick="Conteudo._modStatus(${mi},'${isOculto?'rascunho':'oculto'}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${isOculto?'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' :'<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'}</svg>
          ${isOculto ? 'Mostrar' : 'Ocultar'}
        </button>
        <button onclick="Conteudo._dupMod(${mi})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Duplicar
        </button>
        <button onclick="Conteudo.toggleMod(${mi})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          ${mod.collapsed ? 'Expandir' : 'Recolher'}
        </button>
        <hr class="ctx-sep">
        <button class="danger" onclick="Conteudo._delMod(${mi})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          Excluir módulo
        </button>`);
    }

    function _modStatus(mi, s) {
      state.modulos[mi].status = s; render();
    }
    function _dupMod(mi) {
      const m = JSON.parse(JSON.stringify(state.modulos[mi]));
      m.id = _uid(); m.titulo += ' (cópia)';
      m.aulas = m.aulas.map(a => ({ ...a, id: _uid() }));
      state.modulos.splice(mi + 1, 0, m); render();
    }
    function _delMod(mi) {
      if (!confirm(`Excluir módulo "${state.modulos[mi].titulo}" e todas as suas aulas?`)) return;
      state.modulos.splice(mi, 1); render();
    }

    // ── Aulas ──────────────────────────────────────────────
    function _toggleTypePicker(mi) {
      const p = document.getElementById('type-picker-' + mi);
      if (!p) return;
      // Fechar todos os outros
      document.querySelectorAll('.type-picker.open').forEach(el => {
        if (el !== p) el.classList.remove('open');
      });
      p.classList.toggle('open');
    }

    function _addAulaComTipo(mi, tipo) {
      state.modulos[mi].aulas.push({
        id: _uid(), titulo: '', tipo, durMin: 0, status: 'rascunho',
      });
      const p = document.getElementById('type-picker-' + mi);
      if (p) p.classList.remove('open');
      render();
      setTimeout(() => {
        const rows = document.querySelectorAll(`#mod-${state.modulos[mi].id} .aula-title-input`);
        if (rows.length) rows[rows.length-1].focus();
      }, 50);
    }

    // Altera o tipo da aula via clique no ícone de tipo
    function _setAulaTipo(mi, ai, tipo) {
      if (state.modulos[mi]?.aulas[ai]) { state.modulos[mi].aulas[ai].tipo = tipo; render(); }
    }
    function _ctxTipo(e, mi, ai) {
      const aula = state.modulos[mi]?.aulas[ai];
      if (!aula) return;
      const itens = Object.entries(TIPO_LABEL).map(([k, v]) =>
        `<button onclick="Conteudo._setAulaTipo(${mi},${ai},'${k}')">${_icoOf(k)} ${v}${k === aula.tipo ? ' <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>' : ''}</button>`
      ).join('');
      openCtx(e, `<div style="font-size:10px;font-weight:700;color:var(--text4);padding:4px 10px;text-transform:uppercase;letter-spacing:.06em">Tipo da aula</div>${itens}`);
    }

    function _editAulaTitulo(mi, ai, v) {
      if (state.modulos[mi]?.aulas[ai]) state.modulos[mi].aulas[ai].titulo = v;
    }

    function _editDur(e, mi, ai) {
      e.stopPropagation();
      const span = e.currentTarget;
      const cur  = state.modulos[mi]?.aulas[ai]?.durMin || '';
      const inp  = document.createElement('input');
      inp.className = 'dur-inline'; inp.type = 'number'; inp.min = 0;
      inp.value = cur; inp.placeholder = 'min';
      span.replaceWith(inp); inp.focus(); inp.select();
      const save = () => {
        const v = Math.max(0, parseInt(inp.value)||0);
        state.modulos[mi].aulas[ai].durMin = v;
        render();
      };
      inp.onblur   = save;
      inp.onkeydown = ev => { if (ev.key === 'Enter') inp.blur(); if (ev.key === 'Escape') render(); };
    }

    function _ctxAula(e, mi, ai) {
      const aula = state.modulos[mi]?.aulas[ai];
      if (!aula) return;
      const isPub = aula.status === 'publicado';

      // Opções de "mover para"
      const moverOpts = state.modulos
        .map((m, i) => i !== mi ? `<button onclick="Conteudo._moverAula(${mi},${ai},${i})">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          ${escHtml(m.titulo || 'Módulo ' + (i+1))}</button>` : '')
        .filter(Boolean).join('');

      openCtx(e, `
        <button onclick="Conteudo._aulaStatus(${mi},${ai},'${isPub?'rascunho':'publicado'}')">
          ${isPub
            ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Despublicar'
            : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Publicar'}
        </button>
        <button onclick="Conteudo._dupAula(${mi},${ai})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Duplicar
        </button>
        ${moverOpts ? `<hr class="ctx-sep"><div style="font-size:10px;font-weight:700;color:var(--text4);padding:4px 10px;text-transform:uppercase;letter-spacing:.06em">Mover para</div>${moverOpts}` : ''}
        <hr class="ctx-sep">
        <button class="danger" onclick="Conteudo._delAula(${mi},${ai})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          Excluir aula
        </button>`);
    }

    function _aulaStatus(mi, ai, s) {
      state.modulos[mi].aulas[ai].status = s; render();
    }
    function _dupAula(mi, ai) {
      const a = { ...state.modulos[mi].aulas[ai], id: _uid(), titulo: state.modulos[mi].aulas[ai].titulo + ' (cópia)' };
      state.modulos[mi].aulas.splice(ai + 1, 0, a); render();
    }
    function _delAula(mi, ai) {
      if (state.modulos[mi]?.aulas.length <= 1) {
        alert('Cada módulo precisa de ao menos uma aula. Exclua o módulo se necessário.');
        return;
      }
      state.modulos[mi].aulas.splice(ai, 1); render();
    }
    function _moverAula(fromMod, fromAula, toMod) {
      const [aula] = state.modulos[fromMod].aulas.splice(fromAula, 1);
      state.modulos[toMod].aulas.push(aula);
      state.modulos[toMod].collapsed = false;
      render();
    }

    // ── DnD Módulos ────────────────────────────────────────
    function _dndModStart(e, mi) {
      _dragSrcModIdx  = mi;
      _dragSrcAulaIdx = null;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => {
        const el = document.getElementById('mod-' + state.modulos[mi].id);
        if (el) el.classList.add('dragging');
      }, 0);
    }
    function _dndModOver(e, mi) {
      if (_dragSrcAulaIdx !== null) return; // é uma aula sendo arrastada
      if (mi === _dragSrcModIdx) return;
      e.preventDefault(); e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.mod-card.drag-over').forEach(el => el.classList.remove('drag-over'));
      const el = document.getElementById('mod-' + state.modulos[mi].id);
      if (el) el.classList.add('drag-over');
    }
    function _dndModLeave(e, mi) {
      const el = document.getElementById('mod-' + state.modulos[mi]?.id);
      if (el) el.classList.remove('drag-over');
    }
    function _dndModDrop(e, mi) {
      e.preventDefault();
      document.querySelectorAll('.mod-card.dragging,.mod-card.drag-over').forEach(el => {
        el.classList.remove('dragging','drag-over');
      });
      if (_dragSrcModIdx === null || _dragSrcModIdx === mi || _dragSrcAulaIdx !== null) return;
      const [mod] = state.modulos.splice(_dragSrcModIdx, 1);
      state.modulos.splice(mi, 0, mod);
      _dragSrcModIdx = null;
      render();
    }

    // ── DnD Aulas ──────────────────────────────────────────
    function _dndAulaStart(e, mi, ai) {
      _dragSrcModIdx  = mi;
      _dragSrcAulaIdx = ai;
      e.dataTransfer.effectAllowed = 'move';
      e.stopPropagation();
      setTimeout(() => {
        const el = document.getElementById('aula-' + state.modulos[mi].aulas[ai].id);
        if (el) el.classList.add('dragging');
      }, 0);
    }
    function _dndAulaOver(e, mi, ai) {
      if (_dragSrcAulaIdx === null) return;
      if (mi === _dragSrcModIdx && ai === _dragSrcAulaIdx) return;
      e.preventDefault(); e.stopPropagation();
      document.querySelectorAll('.aula-row.drag-over-top').forEach(el => el.classList.remove('drag-over-top'));
      const el = document.getElementById('aula-' + state.modulos[mi].aulas[ai].id);
      if (el) el.classList.add('drag-over-top');
    }
    function _dndAulaLeave(e) {
      document.querySelectorAll('.aula-row.drag-over-top').forEach(el => el.classList.remove('drag-over-top'));
    }
    function _dndAulaDrop(e, toMod, toAi) {
      e.preventDefault(); e.stopPropagation();
      document.querySelectorAll('.aula-row.dragging,.aula-row.drag-over-top').forEach(el => {
        el.classList.remove('dragging','drag-over-top');
      });
      if (_dragSrcAulaIdx === null) return;
      const fromMod = _dragSrcModIdx, fromAi = _dragSrcAulaIdx;
      _dragSrcModIdx = null; _dragSrcAulaIdx = null;
      if (fromMod === toMod && fromAi === toAi) return;
      const [aula] = state.modulos[fromMod].aulas.splice(fromAi, 1);
      const targetIdx = (fromMod === toMod && fromAi < toAi) ? toAi - 1 : toAi;
      state.modulos[toMod].aulas.splice(targetIdx, 0, aula);
      render();
    }

    // ── Init ───────────────────────────────────────────────
    function init() {
      // Se vier draft, re-renderiza
      render();
    }

    return {
      render, init, addModulo, toggleMod, _rebuildTipos,
      _editModTitulo, _ctxMod, _modStatus, _dupMod, _delMod,
      _toggleTypePicker, _addAulaComTipo, _setAulaTipo, _ctxTipo,
      _editAulaTitulo, _editDur,
      _ctxAula, _aulaStatus, _dupAula, _delAula, _moverAula,
      _dndModStart, _dndModOver, _dndModLeave, _dndModDrop,
      _dndAulaStart, _dndAulaOver, _dndAulaLeave, _dndAulaDrop,
    };
  })();

  // Expor Conteudo globalmente (onclicks no HTML referenciam Conteudo.*)
  window.Conteudo = Conteudo;

  // Variável interna — não depende de Wizard estar definido
  let _pendingDraft = null;

  function _applyDraft() {
    const d = _pendingDraft;
    if (!d) return;
    state = d.state;
    currentStep = Math.min(d.currentStep || 0, TOTAL - 1);
    restoreFields();
    updateStepperUI();
    const b = document.getElementById('draft-banner');
    if (b) b.remove();
    _pendingDraft = null;
  }

  function _discardDraft() {
    localStorage.removeItem('ead_draft_curso');
    _pendingDraft = null;
    const b = document.getElementById('draft-banner');
    if (b) b.remove();
  }

  return {
    next, prev, jumpTo, saveDraft, cancelar,
    toggleTag, setVisib, addAccess, removeAccess,
    toggleCheck, toggleSwitch, toggleValidade,
    toggleAcc, acFilter, acOpen, acKey, acSelect,
    renderChips,
    previewCapa,
    addFiles, addLink, addQuiz, removeQuiz, removeMaterial,
    fecharModal, irParaCurso, init,
    _applyDraft, _discardDraft,
    get _pendingDraft() { return _pendingDraft; },
    set _pendingDraft(v) { _pendingDraft = v; },
  };

})();

document.addEventListener('DOMContentLoaded', () => Wizard.init());
