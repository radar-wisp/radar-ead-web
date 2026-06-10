/**
 * configuracoes/index.js — Módulo de Configurações com abas
 * Tabs: Categoria de Curso | Formatos de Aula | Tipos de Material
 *       Departamentos | Cargos | Cidades
 */

var ConfigMod = (() => {

  /* ── Storage keys ─────────────────────────────────────────────── */
  const KEYS = {
    CAT_AULA:    'ead_cfg_cat_aula',
    FMT_AULA:    'ead_cfg_fmt_aula',
    TIPO_MAT:    'ead_cfg_tipo_mat',
    DEPTO:       'ead_cfg_departamentos',
    CARGO:       'ead_cfg_cargos',
    CIDADE:      'ead_cfg_cidades',
  };

  /* ── Helpers ──────────────────────────────────────────────────── */
  const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  const now  = () => new Date().toISOString();
  const get  = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
  const save = (k,v) => localStorage.setItem(k, JSON.stringify(v));
  const x    = s => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';

  /* ── Tab state ────────────────────────────────────────────────── */
  let _activeTab = 0;

  /* ── Ícones disponíveis para Formatos de Aula ─────────────────── */
  const FORMAT_ICONS = [
    { value:'video',       label:'Vídeo',        svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>' },
    { value:'pdf',         label:'PDF',           svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' },
    { value:'word',        label:'Word',          svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>' },
    { value:'excel',       label:'Excel/Planilha',svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>' },
    { value:'ppt',         label:'Apresentação',  svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' },
    { value:'audio',       label:'Áudio/Podcast', svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>' },
    { value:'link',        label:'Link Externo',  svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' },
    { value:'quiz',        label:'Quiz/Avaliação', svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
    { value:'live',        label:'Ao Vivo',       svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>' },
    { value:'image',       label:'Imagem',        svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' },
    { value:'text',        label:'Texto/Artigo',  svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>' },
    { value:'zip',         label:'Arquivo/ZIP',   svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/></svg>' },
  ];

  /* helper: get icon entry by value */
  const getIcon = v => FORMAT_ICONS.find(i => i.value === v) || FORMAT_ICONS[0];

  /* ── Tab config ───────────────────────────────────────────────── */
  const TABS = [
    { id: 'cat-aula',  label: 'Categoria de Curso',  key: KEYS.CAT_AULA,  singular: 'categoria',    fields: ['nome','descricao'] },
    { id: 'fmt-aula',  label: 'Formatos de Aula',     key: KEYS.FMT_AULA,  singular: 'formato',      fields: ['nome','descricao','icone'], hasIcon: true },
    { id: 'tipo-mat',  label: 'Tipos de Material',    key: KEYS.TIPO_MAT,  singular: 'tipo',         fields: ['nome','descricao'] },
    { id: 'depto',     label: 'Departamentos',         key: KEYS.DEPTO,     singular: 'departamento', fields: ['nome','descricao'] },
    { id: 'cargo',     label: 'Cargos',                key: KEYS.CARGO,     singular: 'cargo',        fields: ['nome','descricao'] },
    { id: 'cidade',    label: 'Cidades',               key: KEYS.CIDADE,    singular: 'cidade',       fields: ['nome','estado'] },
  ];

  /* ── Seed defaults ────────────────────────────────────────────── */
  function seedDefaults() {
    const defaults = {
      [KEYS.CAT_AULA]: [
        { nome:'Teórica',       descricao:'Aula com foco em conceitos e teoria' },
        { nome:'Prática',       descricao:'Aula com atividades práticas e laboratoriais' },
        { nome:'Avaliativa',    descricao:'Aula destinada a avaliações e testes' },
        { nome:'Complementar',  descricao:'Conteúdo de apoio e aprofundamento' },
      ],
      [KEYS.FMT_AULA]: [
        { nome:'Vídeo',          descricao:'Arquivo de vídeo MP4, YouTube, Vimeo etc.',   icone:'video' },
        { nome:'PDF',            descricao:'Documento em formato PDF',                     icone:'pdf' },
        { nome:'Word',           descricao:'Documento Microsoft Word (.docx)',             icone:'word' },
        { nome:'Excel',          descricao:'Planilha Excel / Google Sheets',               icone:'excel' },
        { nome:'Apresentação',   descricao:'Slides PowerPoint ou Google Slides',           icone:'ppt' },
        { nome:'Áudio / Podcast',descricao:'Arquivo de áudio ou episódio de podcast',     icone:'audio' },
        { nome:'Link Externo',   descricao:'URL para recurso em site externo',             icone:'link' },
        { nome:'Quiz',           descricao:'Avaliação interativa ou questionário',         icone:'quiz' },
        { nome:'Ao Vivo',        descricao:'Transmissão em tempo real (live/webinar)',     icone:'live' },
        { nome:'Imagem',         descricao:'Arquivo de imagem (PNG, JPG, etc.)',           icone:'image' },
        { nome:'Texto / Artigo', descricao:'Conteúdo textual inline ou artigo',           icone:'text' },
        { nome:'Arquivo ZIP',    descricao:'Pacote compactado de materiais',               icone:'zip' },
      ],
      [KEYS.TIPO_MAT]: [
        { nome:'PDF',          descricao:'Documento em formato PDF' },
        { nome:'Vídeo',        descricao:'Arquivo ou link de vídeo' },
        { nome:'Planilha',     descricao:'Arquivo Excel / Google Sheets' },
        { nome:'Apresentação', descricao:'Slides PowerPoint ou similares' },
        { nome:'Link Externo', descricao:'URL para recurso externo' },
      ],
      [KEYS.DEPTO]: [
        { nome:'Tecnologia',       descricao:'Equipes de TI, desenvolvimento e infraestrutura' },
        { nome:'Comercial',        descricao:'Vendas, pré-vendas e atendimento ao cliente' },
        { nome:'Operações',        descricao:'Campo, instalação e suporte técnico' },
        { nome:'Administrativo',   descricao:'Financeiro, RH e processos internos' },
        { nome:'Marketing',        descricao:'Comunicação, branding e mídias digitais' },
      ],
      [KEYS.CARGO]: [
        { nome:'Técnico de Campo',         descricao:'Instalação e manutenção em campo' },
        { nome:'Analista de Suporte',      descricao:'Suporte técnico N1/N2' },
        { nome:'Vendedor',                 descricao:'Prospecção e fechamento de vendas' },
        { nome:'Gerente de TI',            descricao:'Liderança da equipe de tecnologia' },
        { nome:'Auxiliar Administrativo',  descricao:'Apoio administrativo e burocrático' },
      ],
      [KEYS.CIDADE]: [
        { nome:'Anápolis',     estado:'GO' },
        { nome:'Goiânia',      estado:'GO' },
        { nome:'Brasília',     estado:'DF' },
        { nome:'São Paulo',    estado:'SP' },
        { nome:'Rio de Janeiro', estado:'RJ' },
      ],
    };
    Object.entries(defaults).forEach(([key, items]) => {
      if (!get(key).length) {
        save(key, items.map(d => ({ id: uid(), ...d, criadoEm: now() })));
      }
    });
  }

  /* ── Init ─────────────────────────────────────────────────────── */
  function init() {
    seedDefaults();
    _render();
  }

  /* ── Build page ───────────────────────────────────────────────── */
  function _render() {
    const pg = document.getElementById('pg-configuracoes');
    if (!pg) return;
    pg.innerHTML = `
      <div class="ph">
        <div>
          <h2>Configurações</h2>
          <p>Gerencie as opções e tabelas de referência do sistema</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="cfg-tabs" style="
        display:flex; gap:0; border-bottom:1px solid var(--border);
        margin-bottom:18px; overflow-x:auto;
      ">
        ${TABS.map((t,i) => `
          <button
            class="cfg-tab-btn ${i===_activeTab?'cfg-tab-active':''}"
            data-tab="${i}"
            onclick="ConfigMod.switchTab(${i})"
            style="
              padding:10px 16px; font-size:13px; font-weight:600;
              border:none; background:none; cursor:pointer;
              font-family:var(--font);
              color:${i===_activeTab?'var(--blue)':'var(--text3)'};
              border-bottom:2px solid ${i===_activeTab?'var(--blue)':'transparent'};
              margin-bottom:-1px; white-space:nowrap;
              transition:color .12s, border-color .12s;
            "
          >${x(t.label)}</button>
        `).join('')}
      </div>

      <!-- Tab panes -->
      ${TABS.map((t,i) => `
        <div id="cfg-pane-${i}" style="display:${i===_activeTab?'block':'none'}">
          ${_buildPane(t, i)}
        </div>
      `).join('')}
    `;
  }

  /* ── Icon picker HTML ─────────────────────────────────────────── */
  function _buildIconPicker(idx, selectedValue) {
    return `
      <div class="fg" style="grid-column:1/-1">
        <label>Ícone do Formato</label>
        <div id="cfg-icon-picker-${idx}" style="
          display:flex; flex-wrap:wrap; gap:8px; margin-top:4px;
        ">
          ${FORMAT_ICONS.map(ic => `
            <button
              type="button"
              title="${x(ic.label)}"
              onclick="ConfigMod.selectIcon(${idx},'${ic.value}')"
              data-icon-val="${ic.value}"
              style="
                display:flex; flex-direction:column; align-items:center; gap:3px;
                padding:8px 10px; border-radius:var(--radius);
                border:2px solid ${ic.value===selectedValue?'var(--blue)':'var(--border)'};
                background:${ic.value===selectedValue?'var(--blue-light)':'var(--bg)'};
                cursor:pointer; font-size:10px; color:var(--text3);
                transition:border-color .12s, background .12s;
                min-width:56px;
              "
            >
              ${ic.svg}
              <span>${x(ic.label)}</span>
            </button>
          `).join('')}
        </div>
        <input type="hidden" id="cfg-icone-${idx}" value="${x(selectedValue||'video')}">
      </div>
    `;
  }

  /* ── Build individual pane ────────────────────────────────────── */
  function _buildPane(tab, idx) {
    const items    = get(tab.key);
    const isCidade = tab.key === KEYS.CIDADE;
    const isFmt    = !!tab.hasIcon;
    const col2Label = isCidade ? 'Estado' : 'Descrição';

    return `
      <!-- Toolbar -->
      <div style="
        display:flex; align-items:center; justify-content:space-between;
        gap:12px; margin-bottom:14px; flex-wrap:wrap;
      ">
        <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:200px">
          <div style="position:relative;flex:1;max-width:320px">
            <input
              id="cfg-busca-${idx}"
              class="ift-input"
              type="text"
              placeholder="Buscar ${x(tab.singular)}..."
              oninput="ConfigMod.renderList(${idx})"
              style="padding-left:32px;width:100%"
            >
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text4);pointer-events:none">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
          </div>
          <span id="cfg-count-${idx}" style="font-size:12px;color:var(--text4)"></span>
        </div>
        <button
          class="btn btn-primary"
          onclick="ConfigMod.openForm(${idx})"
          style="white-space:nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo ${x(tab.singular)}
        </button>
      </div>

      <!-- Form inline (hidden by default) -->
      <div id="cfg-form-${idx}" style="
        display:none; background:var(--blue-light);
        border:1px solid var(--blue-mid); border-radius:var(--radius);
        padding:16px; margin-bottom:14px;
      ">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:12px" id="cfg-form-title-${idx}">
          Novo ${x(tab.singular)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:end">
          <div class="fg">
            <label>Nome <span style="color:var(--red)">*</span></label>
            <input type="text" id="cfg-nome-${idx}" placeholder="Nome do ${x(tab.singular)}">
          </div>
          <div class="fg">
            <label>${x(col2Label)}</label>
            <input type="text" id="cfg-desc-${idx}" placeholder="${isCidade?'Ex: SP':'Descrição opcional'}">
          </div>
          ${isFmt ? _buildIconPicker(idx, 'video') : ''}
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end">
          <button class="btn btn-ghost" onclick="ConfigMod.cancelForm(${idx})">Cancelar</button>
          <button class="btn btn-primary" onclick="ConfigMod.saveItem(${idx})">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Salvar
          </button>
        </div>
      </div>

      <!-- List -->
      <div class="card">
        <div class="card-head" style="padding:10px 16px">
          <div class="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            ${x(tab.label)}
          </div>
        </div>
        <div class="tbl-wrap">
          <table>
            <thead>
              <tr>
                ${isFmt ? '<th style="width:48px">Ícone</th>' : ''}
                <th>Nome</th>
                <th>${x(col2Label)}</th>
                <th>Cadastrado em</th>
                <th style="width:80px"></th>
              </tr>
            </thead>
            <tbody id="cfg-tbody-${idx}"></tbody>
          </table>
        </div>
        <div id="cfg-empty-${idx}" style="display:none;text-align:center;padding:48px 20px;color:var(--text4)">
          <div style="font-size:36px;margin-bottom:12px">⚙️</div>
          <div style="font-size:14px;font-weight:600;color:var(--text2);margin-bottom:6px">
            Nenhum ${x(tab.singular)} cadastrado
          </div>
          <div style="font-size:12px">
            Clique em "Novo ${x(tab.singular)}" para começar
          </div>
        </div>
      </div>
    `;
  }

  /* ── Switch tab ───────────────────────────────────────────────── */
  function switchTab(idx) {
    _activeTab = idx;
    document.querySelectorAll('.cfg-tab-btn').forEach((btn, i) => {
      const active = i === idx;
      btn.style.color = active ? 'var(--blue)' : 'var(--text3)';
      btn.style.borderBottomColor = active ? 'var(--blue)' : 'transparent';
    });
    TABS.forEach((_, i) => {
      const pane = document.getElementById(`cfg-pane-${i}`);
      if (pane) pane.style.display = i === idx ? 'block' : 'none';
    });
    renderList(idx);
  }

  /* ── Select icon in picker ────────────────────────────────────── */
  function selectIcon(idx, value) {
    document.getElementById(`cfg-icone-${idx}`).value = value;
    document.querySelectorAll(`#cfg-icon-picker-${idx} button`).forEach(btn => {
      const active = btn.getAttribute('data-icon-val') === value;
      btn.style.borderColor  = active ? 'var(--blue)' : 'var(--border)';
      btn.style.background   = active ? 'var(--blue-light)' : 'var(--bg)';
    });
  }

  /* ── Render list for a tab ────────────────────────────────────── */
  function renderList(idx) {
    const tab    = TABS[idx];
    const busca  = (document.getElementById(`cfg-busca-${idx}`)?.value || '').toLowerCase().trim();
    let   items  = get(tab.key);
    const isCidade = tab.key === KEYS.CIDADE;
    const isFmt    = !!tab.hasIcon;

    if (busca) {
      items = items.filter(it =>
        it.nome?.toLowerCase().includes(busca) ||
        (isCidade ? it.estado?.toLowerCase().includes(busca) : it.descricao?.toLowerCase().includes(busca))
      );
    }

    const tbody = document.getElementById(`cfg-tbody-${idx}`);
    const empty = document.getElementById(`cfg-empty-${idx}`);
    const count = document.getElementById(`cfg-count-${idx}`);

    if (count) count.textContent = `${items.length} item(s)`;

    if (!tbody) return;
    if (!items.length) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = items.map(it => {
      const col2 = isCidade
        ? `<span class="badge badge-blue" style="font-size:10px">${x(it.estado||'—')}</span>`
        : `<span style="font-size:12px;color:var(--text3)">${x(it.descricao||'—')}</span>`;
      const dt = it.criadoEm
        ? new Date(it.criadoEm).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'})
        : '—';
      const iconCell = isFmt
        ? `<td style="text-align:center;color:var(--blue)">${getIcon(it.icone).svg}</td>`
        : '';

      return `<tr>
        ${iconCell}
        <td>
          <div style="font-weight:600;font-size:13px;color:var(--text)">${x(it.nome)}</div>
        </td>
        <td>${col2}</td>
        <td style="font-size:11px;color:var(--text4)">${dt}</td>
        <td>
          <div style="display:flex;gap:4px;justify-content:flex-end">
            <button
              class="btn btn-ghost btn-sm"
              title="Editar"
              onclick="ConfigMod.editItem(${idx},'${it.id}')"
              style="padding:4px 8px"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button
              class="btn btn-danger btn-sm"
              title="Excluir"
              onclick="ConfigMod.deleteItem(${idx},'${it.id}')"
              style="padding:4px 8px"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  /* ── Form: open (new) ─────────────────────────────────────────── */
  function openForm(idx) {
    const tab  = TABS[idx];
    const form = document.getElementById(`cfg-form-${idx}`);
    const title = document.getElementById(`cfg-form-title-${idx}`);
    if (!form) return;
    form.removeAttribute('data-edit-id');
    if (title) title.textContent = `Novo ${tab.singular}`;
    const nome = document.getElementById(`cfg-nome-${idx}`);
    const desc = document.getElementById(`cfg-desc-${idx}`);
    if (nome) nome.value = '';
    if (desc) desc.value = '';
    if (tab.hasIcon) selectIcon(idx, 'video');
    form.style.display = 'block';
    nome?.focus();
  }

  /* ── Form: cancel ─────────────────────────────────────────────── */
  function cancelForm(idx) {
    const form = document.getElementById(`cfg-form-${idx}`);
    if (form) { form.style.display = 'none'; form.removeAttribute('data-edit-id'); }
  }

  /* ── Form: save (create or update) ───────────────────────────── */
  function saveItem(idx) {
    const tab    = TABS[idx];
    const nome   = document.getElementById(`cfg-nome-${idx}`)?.value.trim();
    const desc   = document.getElementById(`cfg-desc-${idx}`)?.value.trim();
    const icone  = document.getElementById(`cfg-icone-${idx}`)?.value || 'video';
    const form   = document.getElementById(`cfg-form-${idx}`);
    const editId = form?.getAttribute('data-edit-id');

    if (!nome) { _toast('O campo "Nome" é obrigatório.', 'e'); return; }

    const isCidade = tab.key === KEYS.CIDADE;
    const isFmt    = !!tab.hasIcon;
    const items = get(tab.key);

    if (editId) {
      const i = items.findIndex(it => it.id === editId);
      if (i > -1) {
        items[i] = {
          ...items[i],
          nome,
          ...(isCidade ? { estado: desc } : { descricao: desc }),
          ...(isFmt ? { icone } : {}),
          atualizadoEm: now(),
        };
      }
      _toast('Atualizado com sucesso!', 's');
    } else {
      items.push({
        id: uid(),
        nome,
        ...(isCidade ? { estado: desc } : { descricao: desc }),
        ...(isFmt ? { icone } : {}),
        criadoEm: now(),
      });
      _toast('Cadastrado com sucesso!', 's');
    }

    save(tab.key, items);
    cancelForm(idx);
    renderList(idx);
  }

  /* ── Edit: open form pre-filled ───────────────────────────────── */
  function editItem(idx, id) {
    const tab  = TABS[idx];
    const item = get(tab.key).find(it => it.id === id);
    if (!item) return;

    const isCidade = tab.key === KEYS.CIDADE;
    const form  = document.getElementById(`cfg-form-${idx}`);
    const title = document.getElementById(`cfg-form-title-${idx}`);

    if (!form) return;
    form.setAttribute('data-edit-id', id);
    if (title) title.textContent = `Editar ${tab.singular}`;

    const nome = document.getElementById(`cfg-nome-${idx}`);
    const desc = document.getElementById(`cfg-desc-${idx}`);
    if (nome) nome.value = item.nome || '';
    if (desc) desc.value = isCidade ? (item.estado || '') : (item.descricao || '');
    if (tab.hasIcon) selectIcon(idx, item.icone || 'video');

    form.style.display = 'block';
    nome?.focus();
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ── Delete ───────────────────────────────────────────────────── */
  function deleteItem(idx, id) {
    if (!confirm(`Excluir este item permanentemente?`)) return;
    const tab   = TABS[idx];
    const items = get(tab.key).filter(it => it.id !== id);
    save(tab.key, items);
    _toast('Item excluído.', 'i');
    renderList(idx);
  }

  /* ── Toast helper ─────────────────────────────────────────────── */
  function _toast(msg, tipo='i') {
    const s = document.getElementById('toasts');
    if (!s) return;
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.innerHTML = `<span>${{s:'✅',e:'❌',i:'ℹ️'}[tipo]||'ℹ️'}</span><span>${msg}</span>`;
    s.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  /* ── Public API ───────────────────────────────────────────────── */
  return {
    init, switchTab, renderList,
    openForm, cancelForm, saveItem,
    editItem, deleteItem, selectIcon,
    getItems: (key) => get(key),
    KEYS,
  };

})();
