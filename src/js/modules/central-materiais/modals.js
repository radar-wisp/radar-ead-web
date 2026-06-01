/**
 * modals.js — Modais de material da Central de Materiais (MatModals).
 * Responsabilidade: visualizador inline, vínculo a curso, modal de
 * criação/edição (selects, módulos, toggles), upload (arquivo/link/drag),
 * persistência (salvar) e navegação por abas do modal.
 * Estado de edição vive aqui (privado). Refresh delega a MatMod.
 *
 * @module MatModals
 */

/* global Storage, MatUtils, MatMod */

var MatModals = (() => {
  'use strict';

  const _x        = MatUtils.x;
  const _fmtDate  = MatUtils.fmtDate;
  const _fmtBytes = MatUtils.fmtBytes;
  const _toast    = MatUtils.toast;
  const TIPO_CFG  = MatUtils.TIPO_CFG;

  // ── Estado interno do fluxo de modal ──────────────────────────
  let _editId     = null;    // ID do material sendo editado (null = novo)
  let _uploadMode = 'file';  // 'file' | 'link'
  let _fileAtual  = null;    // { nome, tamanho, tipo, url } — arquivo selecionado
  let _vincularId = null;    // ID do material sendo vinculado a curso

  // ── Visualizador inline ───────────────────────────────────────

  /**
   * Abre o modal visualizador com o conteúdo apropriado para o tipo.
   * @param {string} id
   */
  function visualizar(id) {
    const m = Storage.Materiais.obter(id);
    if (!m) return;

    const nomeEl = document.getElementById('viewer-nome');
    const metaEl = document.getElementById('viewer-meta');
    const dlBtn  = document.getElementById('viewer-dl-btn');
    const body   = document.getElementById('viewer-body');

    if (nomeEl) nomeEl.textContent = m.nome || '—';
    if (metaEl) metaEl.textContent = [
      TIPO_CFG[m.tipo]?.label,
      m.tamanho,
      _fmtDate(m.criadoEm),
    ].filter(Boolean).join(' · ');

    if (dlBtn) dlBtn.style.display = m.config?.permitirDownload !== false ? '' : 'none';

    if (body) {
      body.innerHTML = _renderViewer(m);
    }

    document.getElementById('modal-viewer')?.classList.add('open');
  }

  /**
   * Gera o HTML do conteúdo do visualizador conforme o tipo do material.
   * @param {object} m — material
   * @returns {string}
   */
  function _renderViewer(m) {
    const temUrl = m.url && m.url !== '#simulado';
    const tipoCfg = TIPO_CFG[m.tipo] || TIPO_CFG.outro;

    if (m.tipo === 'video' && temUrl) {
      return `<video controls style="max-width:100%;max-height:60vh;border-radius:var(--radius-sm)">
        <source src="${_x(m.url)}">Seu navegador não suporta vídeo.
      </video>`;
    }

    if (m.tipo === 'link' && m.url) {
      return `
        <div style="text-align:center">
          <div style="font-size:36px;margin-bottom:16px">🔗</div>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:8px">${_x(m.nome)}</div>
          <div style="font-size:12px;color:var(--text4);margin-bottom:20px">${_x(m.url)}</div>
          <a href="${_x(m.url)}" target="_blank" class="btn btn-primary">Abrir link externo</a>
        </div>`;
    }

    if (m.tipo === 'pdf' && temUrl) {
      return `<iframe src="${_x(m.url)}" style="width:100%;height:500px;border:none;border-radius:var(--radius-sm)"></iframe>`;
    }

    if (m.tipo === 'imagem' && m.url?.startsWith('data:')) {
      return `<img src="${_x(m.url)}" style="max-width:100%;max-height:500px;border-radius:var(--radius-sm);object-fit:contain">`;
    }

    // Fallback genérico
    return `
      <div style="text-align:center;padding:24px">
        <div style="width:64px;height:64px;border-radius:12px;background:${tipoCfg.bg};color:${tipoCfg.txt};font-size:20px;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          ${tipoCfg.label.slice(0, 3).toUpperCase()}
        </div>
        <div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:6px">${_x(m.nome)}</div>
        <div style="font-size:12px;color:var(--text4);margin-bottom:20px">${_x(m.descricao || 'Sem descrição')}</div>
        ${temUrl
          ? `<a href="${_x(m.url)}" download="${_x(m.nome)}" class="btn btn-primary">Baixar arquivo</a>`
          : '<span style="font-size:12px;color:var(--text4)">Arquivo simulado — sem URL real</span>'}
      </div>`;
  }

  // ── Vincular a outro curso ────────────────────────────────────

  function abrirVincular(id) {
    _vincularId = id;
    const m   = Storage.Materiais.obter(id);
    const el  = document.getElementById('mv-nome');
    if (el) el.textContent = m ? `Material: ${m.nome}` : '';

    const sel    = document.getElementById('mv-curso-sel');
    const cursos = Storage.Cursos.listar().filter(c => c.id !== m?.cursoId);
    if (sel) {
      sel.innerHTML =
        '<option value="">Selecione um curso...</option>' +
        cursos.map(c => `<option value="${_x(c.id)}">${_x(c.titulo)}</option>`).join('');
    }
    document.getElementById('modal-vincular')?.classList.add('open');
  }

  function confirmarVinculo() {
    const cursoId = document.getElementById('mv-curso-sel')?.value;
    if (!cursoId || !_vincularId) { alert('Selecione um curso.'); return; }
    Storage.Materiais.vincular(_vincularId, cursoId);
    const c = Storage.Cursos.obter(cursoId);
    _toast(`Material vinculado a "${c?.titulo || 'curso'}"!`, 's');
    document.getElementById('modal-vincular')?.classList.remove('open');
    _vincularId = null;
    MatMod.refresh();
  }

  // ── Modal de criação / edição ─────────────────────────────────

  /**
   * Abre o modal para criação de um novo material.
   */
  function abrirModal() {
    _editId    = null;
    _fileAtual = null;
    _uploadMode = 'file';

    const tituloEl = document.getElementById('mm-titulo');
    const subEl    = document.getElementById('mm-sub');
    if (tituloEl) tituloEl.textContent = 'Novo Material';
    if (subEl)    subEl.textContent    = '';

    ['mm-nome', 'mm-desc', 'mm-responsavel', 'mm-url', 'mm-url-texto'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    _setVal('mm-tipo',      '');
    _setVal('mm-categoria', '');
    _setVal('mm-status',    'ativo');

    const dzText = document.getElementById('mm-dropzone-text');
    const dzSub  = document.getElementById('mm-dropzone-sub');
    if (dzText) dzText.textContent = 'Arraste o arquivo ou clique para selecionar';
    if (dzSub)  dzSub.textContent  = 'PDF · MP4 · XLSX · DOC · PPTX · IMG · ZIP — máx. 100MB';

    const prev = document.getElementById('mm-file-preview');
    if (prev) prev.style.display = 'none';

    _popularSelectCursoModal();
    _renderConfigModal({});
    setUploadMode('file');
    tabModal(0, document.querySelector('#modal-material .mc-tab'));
    document.getElementById('modal-material')?.classList.add('open');
  }

  /**
   * Abre o modal preenchido com dados de um material existente.
   * @param {string} id
   */
  function abrirEdit(id) {
    const m = Storage.Materiais.obter(id);
    if (!m) return;

    _editId    = id;
    _fileAtual = null;

    const tituloEl = document.getElementById('mm-titulo');
    const subEl    = document.getElementById('mm-sub');
    if (tituloEl) tituloEl.textContent = 'Editar Material';
    if (subEl)    subEl.textContent    = `Criado em ${_fmtDate(m.criadoEm)}`;

    _setVal('mm-nome',        m.nome);
    _setVal('mm-desc',        m.descricao);
    _setVal('mm-responsavel', m.responsavel);
    _setVal('mm-tipo',        m.tipo);
    _setVal('mm-categoria',   m.categoria);
    _setVal('mm-status',      m.status || 'ativo');
    _setVal('mm-url',         m.url !== '#simulado' ? m.url : '');

    _popularSelectCursoModal(m.cursoId);
    _carregarModulos(m.cursoId, m.moduloId);
    _renderConfigModal(m.config || {});

    if (m.tipo === 'link') {
      setUploadMode('link');
    } else {
      setUploadMode('file');
      if (m.nome) {
        const dt = document.getElementById('mm-dropzone-text');
        const ds = document.getElementById('mm-dropzone-sub');
        if (dt) dt.textContent = m.nome;
        if (ds) ds.textContent = m.tamanho || '';
      }
    }

    tabModal(0, document.querySelector('#modal-material .mc-tab'));
    document.getElementById('modal-material')?.classList.add('open');
  }

  /** Helper para setar value de campo pelo ID */
  function _setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  /**
   * Popula o <select> de cursos dentro do modal.
   * @param {string} [selectedId]
   */
  function _popularSelectCursoModal(selectedId) {
    const sel = document.getElementById('mm-curso');
    if (!sel) return;
    const cursos = Storage.Cursos.listar();
    sel.innerHTML =
      '<option value="">Sem curso vinculado</option>' +
      cursos.map(c =>
        `<option value="${_x(c.id)}" ${c.id === selectedId ? 'selected' : ''}>${_x(c.titulo)}</option>`
      ).join('');
    sel.onchange = () => _carregarModulos(sel.value);
    if (selectedId) _carregarModulos(selectedId);
  }

  /**
   * Popula o <select> de módulos conforme o curso selecionado.
   * @param {string} cursoId
   * @param {string} [selectedId]
   */
  function _carregarModulos(cursoId, selectedId) {
    const sel = document.getElementById('mm-modulo');
    if (!sel) return;
    const mods = cursoId ? Storage.Modulos.listarPorCurso(cursoId) : [];
    sel.disabled = !cursoId || mods.length === 0;
    sel.innerHTML =
      '<option value="">' +
      (!cursoId ? 'Selecione um curso primeiro' : mods.length === 0 ? 'Nenhum módulo cadastrado' : 'Selecione um módulo...') +
      '</option>' +
      mods.map(m =>
        `<option value="${_x(m.id)}" ${m.id === selectedId ? 'selected' : ''}>${_x(m.titulo)}</option>`
      ).join('');
  }

  /**
   * Renderiza os toggles de configuração do material no modal.
   * @param {object} cfg — configurações atuais
   */
  function _renderConfigModal(cfg) {
    const wrap = document.getElementById('mm-config-body');
    if (!wrap) return;

    const togRow = (id, label, desc, val) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px">${label}</div>
          <div style="font-size:11px;color:var(--text4)">${desc}</div>
        </div>
        <div id="${id}" class="toggle ${val ? 'on' : ''}"
          onclick="this.classList.toggle('on');this.querySelector('span').style.left=this.classList.contains('on')?'21px':'3px';this.style.background=this.classList.contains('on')?'var(--blue)':'var(--border2)'"
          style="position:relative;width:40px;height:22px;background:${val ? 'var(--blue)' : 'var(--border2)'};border-radius:11px;cursor:pointer;transition:background .2s;flex-shrink:0">
          <span style="position:absolute;top:3px;left:${val ? 21 : 3}px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></span>
        </div>
      </div>`;

    wrap.innerHTML =
      togRow('mmcfg-obrig',   'Material obrigatório',             'O aluno deve acessar para progredir',          cfg.obrigatorio) +
      togRow('mmcfg-dl',      'Permitir download',                'O aluno pode baixar o arquivo',                cfg.permitirDownload !== false) +
      togRow('mmcfg-ocultar', 'Ocultar após conclusão',           'Desaparece para quem concluiu o curso',        cfg.ocultarAposConclusao) +
      togRow('mmcfg-turma',   'Exibir apenas para turma',         'Visível somente para turmas específicas',      cfg.apenasParaTurma) +
      togRow('mmcfg-compl',   'Material complementar',            'Indicado como recurso extra, não obrigatório', cfg.complementar) +
      togRow('mmcfg-antes',   'Necessário antes da próxima aula', 'Bloqueia avanço até o aluno visualizar',       cfg.necessarioAntesDaProxima);
  }

  // ── Upload — file e drag & drop ───────────────────────────────

  /**
   * Alterna entre modo de upload por arquivo ou link externo.
   * @param {'file'|'link'} mode
   */
  function setUploadMode(mode) {
    _uploadMode = mode;

    const mFile = document.getElementById('mm-mode-file');
    const mLink = document.getElementById('mm-mode-link');
    const sFile = document.getElementById('mm-upload-section');
    const sLink = document.getElementById('mm-link-section');

    if (mFile) {
      mFile.style.background = mode === 'file' ? 'var(--blue)' : 'var(--surface)';
      mFile.style.color      = mode === 'file' ? '#fff' : 'var(--text3)';
    }
    if (mLink) {
      mLink.style.background = mode === 'link' ? 'var(--blue)' : 'var(--surface)';
      mLink.style.color      = mode === 'link' ? '#fff' : 'var(--text3)';
    }
    if (sFile) sFile.style.display = mode === 'file' ? 'block' : 'none';
    if (sLink) sLink.style.display = mode === 'link' ? 'block' : 'none';
  }

  /**
   * Processa o arquivo selecionado no input file.
   * Detecta tipo automaticamente pela extensão e popula campos.
   * @param {HTMLInputElement} input
   */
  function handleFile(input) {
    const file = input.files[0];
    if (!file) return;

    const ext     = file.name.split('.').pop().toLowerCase();
    const tipoMap = {
      pdf: 'pdf', mp4: 'video', webm: 'video', avi: 'video',
      xlsx: 'xlsx', xls: 'xlsx', doc: 'doc', docx: 'doc',
      png: 'imagem', jpg: 'imagem', jpeg: 'imagem', webp: 'imagem',
      zip: 'zip', rar: 'zip', pptx: 'pptx', ppt: 'pptx', quiz: 'quiz',
    };
    const tipo = tipoMap[ext] || 'outro';
    _fileAtual = { nome: file.name, tamanho: _fmtBytes(file.size), tipo, url: null };

    // Preenche campos automaticamente se estiverem vazios
    const nomeEl = document.getElementById('mm-nome');
    if (nomeEl && !nomeEl.value) nomeEl.value = file.name.replace(/\.[^.]+$/, '');
    const tipoEl = document.getElementById('mm-tipo');
    if (tipoEl && !tipoEl.value) tipoEl.value = tipo;

    // Atualiza visual da dropzone
    const dz = document.getElementById('mm-dropzone');
    const dt = document.getElementById('mm-dropzone-text');
    const ds = document.getElementById('mm-dropzone-sub');
    if (dt) dt.textContent = file.name;
    if (ds) ds.textContent = _fmtBytes(file.size);
    if (dz) { dz.style.borderColor = 'var(--blue)'; dz.style.background = 'var(--blue-light)'; }

    // Para imagens, carrega base64 para preview
    if (tipo === 'imagem') {
      const reader  = new FileReader();
      reader.onload = e => { _fileAtual.url = e.target.result; };
      reader.readAsDataURL(file);
    } else {
      _fileAtual.url = URL.createObjectURL(file);
    }

    // Preview do arquivo selecionado
    const prev = document.getElementById('mm-file-preview');
    if (prev) {
      const tipoCfg = TIPO_CFG[tipo] || TIPO_CFG.outro;
      prev.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm)">
          <div style="width:32px;height:32px;border-radius:var(--radius-sm);background:${tipoCfg.bg};color:${tipoCfg.txt};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800">
            ${tipoCfg.label.slice(0, 3).toUpperCase()}
          </div>
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text)">${_x(file.name)}</div>
            <div style="font-size:11px;color:var(--text4)">${_fmtBytes(file.size)}</div>
          </div>
        </div>`;
      prev.style.display = 'block';
    }
  }

  function onDragOver(e) {
    e.preventDefault();
    const dz = document.getElementById('mm-dropzone');
    if (dz) { dz.style.borderColor = 'var(--blue)'; dz.style.background = 'var(--blue-light)'; }
  }

  function onDragLeave() {
    const dz = document.getElementById('mm-dropzone');
    if (dz) { dz.style.borderColor = ''; dz.style.background = 'var(--bg)'; }
  }

  function onDrop(e) {
    e.preventDefault();
    onDragLeave();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const input = document.getElementById('mm-file-input');
    if (input) {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      handleFile(input);
    }
  }

  // ── Salvar material ───────────────────────────────────────────

  /**
   * Lê os campos do modal, valida e persiste o material.
   */
  function salvar() {
    const nome = document.getElementById('mm-nome')?.value.trim();
    const tipo = document.getElementById('mm-tipo')?.value;

    if (!nome) { alert('Informe o nome do material.'); return; }
    if (!tipo) { alert('Selecione o tipo do material.'); return; }

    const getTogOn = id => document.getElementById(id)?.classList.contains('on') ?? false;

    const dados = {
      nome,
      descricao:   document.getElementById('mm-desc')?.value.trim()        || '',
      tipo,
      categoria:   document.getElementById('mm-categoria')?.value           || '',
      tags:        '',
      cursoId:     document.getElementById('mm-curso')?.value               || '',
      moduloId:    document.getElementById('mm-modulo')?.value              || '',
      responsavel: document.getElementById('mm-responsavel')?.value.trim()  || '',
      status:      document.getElementById('mm-status')?.value              || 'ativo',
      url: _uploadMode === 'link'
        ? (document.getElementById('mm-url')?.value.trim() || '#')
        : (_fileAtual?.url || '#simulado'),
      tamanho: _uploadMode === 'file' && _fileAtual ? _fileAtual.tamanho : '',
      config: {
        obrigatorio:              getTogOn('mmcfg-obrig'),
        permitirDownload:         getTogOn('mmcfg-dl'),
        ocultarAposConclusao:     getTogOn('mmcfg-ocultar'),
        apenasParaTurma:          getTogOn('mmcfg-turma'),
        complementar:             getTogOn('mmcfg-compl'),
        necessarioAntesDaProxima: getTogOn('mmcfg-antes'),
      },
    };

    if (_editId) {
      Storage.Materiais.atualizar(_editId, dados);
      _toast('Material atualizado!', 's');
    } else {
      Storage.Materiais.criar(dados);
      _toast('Material cadastrado!', 's');
    }

    document.getElementById('modal-material')?.classList.remove('open');
    _editId    = null;
    _fileAtual = null;
    MatMod.refresh();
  }

  // ── Tabs do modal ─────────────────────────────────────────────

  function tabModal(idx, btn) {
    document.querySelectorAll('#modal-material .mc-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
    document.querySelectorAll('#modal-material .mc-pane').forEach((p, i) => p.classList.toggle('active', i === idx));
  }

  return {
    visualizar, abrirVincular, confirmarVinculo,
    abrirModal, abrirEdit, salvar, tabModal,
    setUploadMode, handleFile, onDragOver, onDragLeave, onDrop,
  };
})();
