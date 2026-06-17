/**
 * modals.js — Modais do módulo Certificados.
 * @module CertModals
 */

/* global Storage, CertUtils, CertState, CertMod */

var CertModals = (() => {
  'use strict';

  const _x       = CertUtils.x;
  const _fmtDate = CertUtils.fmtDate;
  const _setVal  = CertUtils.setVal;
  const _toast   = CertUtils.toast;
  const _ST      = CertUtils.ST;

  // ── HELPERS DE VALIDAÇÃO ──────────────────────────────────────
  function _err(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = 'var(--red)';
    el.style.boxShadow = '0 0 0 3px rgba(220,38,38,.1)';
    let span = el.parentElement?.querySelector(`.field-err-msg[data-for="${id}"]`);
    if (!span) {
      span = document.createElement('span');
      span.className = 'field-err-msg';
      span.dataset.for = id;
      el.insertAdjacentElement('afterend', span);
    }
    span.textContent = msg;
  }

  function _clearErrs(ids) {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.borderColor = '';
      el.style.boxShadow = '';
      el.parentElement?.querySelector(`.field-err-msg[data-for="${id}"]`)?.remove();
    });
  }

  // ── EMISSÃO MANUAL ────────────────────────────────────────────
  function abrirEmissaoManual(alunoId, cursoId) {
    const alunos = Storage.Alunos.listar().filter(a => a.ativo);
    const cursos = Storage.Cursos.listar();

    const sA = document.getElementById('mce-aluno');
    const sC = document.getElementById('mce-curso');
    if (sA) sA.innerHTML =
      '<option value="">Selecione...</option>' +
      alunos.map(a =>
        `<option value="${_x(a.id)}" ${a.id === alunoId ? 'selected' : ''}>${_x(a.nome)}</option>`
      ).join('');
    if (sC) sC.innerHTML =
      '<option value="">Selecione...</option>' +
      cursos.map(c =>
        `<option value="${_x(c.id)}" ${c.id === cursoId ? 'selected' : ''}>${_x(c.titulo)}</option>`
      ).join('');

    _setVal('mce-conclusao', new Date().toISOString().slice(0, 10));
    _setVal('mce-validade', '');
    _setVal('mce-nota',     '');
    _setVal('mce-obs',      '');
    _setVal('mce-resp',     'Admin');

    document.getElementById('modal-cert-emitir')?.classList.add('open');
  }

  function salvarEmissao() {
    const MCE_FIELDS = ['mce-aluno','mce-curso','mce-modelo','mce-conclusao','mce-resp'];
    _clearErrs(MCE_FIELDS);
    const alunoId  = document.getElementById('mce-aluno')?.value;
    const cursoId  = document.getElementById('mce-curso')?.value;
    const modeloId = document.getElementById('mce-modelo')?.value;
    const concl    = document.getElementById('mce-conclusao')?.value;
    const resp     = document.getElementById('mce-resp')?.value.trim();
    let ok = true;
    if (!alunoId)  { _err('mce-aluno',    'Selecione o aluno.');                ok = false; }
    if (!cursoId)  { _err('mce-curso',    'Selecione o curso.');                ok = false; }
    if (!modeloId) { _err('mce-modelo',   'Selecione o modelo de certificado.'); ok = false; }
    if (!concl)    { _err('mce-conclusao','Informe a data de conclusão.');       ok = false; }
    if (!resp)     { _err('mce-resp',     'Informe o responsável.');             ok = false; }
    if (!ok) return;

    const val  = document.getElementById('mce-validade')?.value;
    const nota = parseInt(document.getElementById('mce-nota')?.value) || 0;
    const cur  = Storage.Cursos.obter(cursoId);

    Storage.Certificados.emitir({
      alunoId, cursoId,
      cargaHoraria:  cur?.carga || 0,
      dataConclucao: new Date(concl).toISOString(),
      dataValidade:  val ? new Date(val).toISOString() : null,
      nota,
      responsavel:   resp,
      obs:           document.getElementById('mce-obs')?.value.trim() || '',
      ...(modeloId && { modeloId }),
    });

    _toast('Certificado emitido!', 's');
    document.getElementById('modal-cert-emitir')?.classList.remove('open');
    CertMod.refresh();
  }

  // ── EMISSÃO EM LOTE ───────────────────────────────────────────
  function abrirEmissaoLote() {
    const sel    = document.getElementById('mlote-curso');
    const cursos = Storage.Cursos.listar().filter(c => c.status === 'publicado');
    if (sel) sel.innerHTML =
      '<option value="">Selecione...</option>' +
      cursos.map(c => `<option value="${_x(c.id)}">${_x(c.titulo)}</option>`).join('');

    const prev = document.getElementById('mlote-preview');
    if (prev) prev.style.display = 'none';

    document.getElementById('modal-cert-lote')?.classList.add('open');
  }

  function previewLote() {
    _clearErrs(['mlote-curso']);
    const cursoId = document.getElementById('mlote-curso')?.value;
    if (!cursoId) { _err('mlote-curso', 'Selecione um curso.'); return; }

    const emitidos = new Set(
      Storage.Certificados.listar()
        .filter(c => c.status !== 'cancelado')
        .map(c => `${c.alunoId}:${c.cursoId}`)
    );
    const elegiveis = Storage.Alunos.listar().filter(a => {
      if (!a.ativo) return false;
      if (Storage.Progresso.pctCurso(a.id, cursoId) < 100) return false;
      if (emitidos.has(`${a.id}:${cursoId}`)) return false;
      return true;
    });

    const prev = document.getElementById('mlote-preview');
    if (!prev) return;
    prev.style.display = 'block';
    prev.innerHTML = elegiveis.length
      ? `Serão emitidos <strong style="color:var(--blue)">${elegiveis.length}</strong> certificado(s) para:<br>` +
        elegiveis.slice(0, 5).map(a => `• ${_x(a.nome)}`).join('<br>') +
        (elegiveis.length > 5 ? `<br>+ ${elegiveis.length - 5} outros` : '')
      : '<span style="color:var(--text4)">Nenhum aluno elegível encontrado para este curso.</span>';
  }

  function executarLote(cursoIdArg, modeloIdArg) {
    const LOTE_FIELDS = ['mlote-curso','mlote-modelo'];
    _clearErrs(LOTE_FIELDS);
    const cursoId  = cursoIdArg  || document.getElementById('mlote-curso')?.value;
    const modeloId = modeloIdArg || document.getElementById('mlote-modelo')?.value || '';
    let ok = true;
    if (!cursoId)  { _err('mlote-curso',  'Selecione um curso.');                  ok = false; }
    if (!modeloId) { _err('mlote-modelo', 'Selecione o modelo de certificado.');   ok = false; }
    if (!ok) return;

    const nota    = parseInt(document.getElementById('mlote-nota')?.value)     || 0;
    const valDias = parseInt(document.getElementById('mlote-validade')?.value) || 0;
    const resp    = document.getElementById('mlote-resp')?.value.trim()        || 'Admin';

    const emitidos = Storage.Certificados.emitirLote(cursoId, {
      notaMinima:   nota,
      validadeDias: valDias,
      responsavel:  resp,
      ...(modeloId && { modeloId }),
    });

    _toast(`${emitidos.length} certificado(s) emitido(s)!`, emitidos.length > 0 ? 's' : 'i');
    document.getElementById('modal-cert-lote')?.classList.remove('open');
    CertMod.refresh();
  }

  // ── VALIDAÇÃO DE CÓDIGO ───────────────────────────────────────
  function abrirValidar() {
    _setVal('validar-codigo', '');
    const res = document.getElementById('validar-result');
    if (res) res.style.display = 'none';
    document.getElementById('modal-cert-validar')?.classList.add('open');
  }

  function executarValidacao() {
    _clearErrs(['validar-codigo']);
    const codigo = document.getElementById('validar-codigo')?.value.trim().toUpperCase();
    if (!codigo) { _err('validar-codigo', 'Digite o código do certificado.'); return; }

    const c   = Storage.Certificados.porCodigo(codigo);
    const res = document.getElementById('validar-result');
    if (!res) return;
    res.style.display = 'block';

    if (!c) {
      res.innerHTML = `
        <div style="padding:14px;background:#fee2e2;border-radius:var(--radius-sm);border:1.5px solid #fca5a5">
          <div style="font-size:14px;font-weight:700;color:var(--red);margin-bottom:4px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Certificado não encontrado</div>
          <div style="font-size:12px;color:var(--red)">O código informado não existe na base de dados.</div>
        </div>`;
      return;
    }

    const al    = Storage.Alunos.obter(c.alunoId);
    const cur   = Storage.Cursos.obter(c.cursoId);
    const clsBg  = c.status === 'emitido' ? '#d1fae5' : c.status === 'expirado' ? '#fee2e2' : '#fef3c7';
    const clsBo  = c.status === 'emitido' ? '#6ee7b7' : c.status === 'expirado' ? '#fca5a5' : '#fcd34d';
    const clsTxt = c.status === 'emitido' ? 'var(--green-dark)' : c.status === 'expirado' ? 'var(--red)' : 'var(--amber-dark)';
    const icon   = c.status === 'emitido' ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>' : c.status === 'expirado' ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

    res.innerHTML = `
      <div style="padding:14px;background:${clsBg};border-radius:var(--radius-sm);border:1.5px solid ${clsBo}">
        <div style="font-size:14px;font-weight:700;color:${clsTxt};margin-bottom:8px">${icon} Certificado ${_ST[c.status]?.label || c.status}</div>
        <div style="font-size:12px;color:var(--text);line-height:1.8">
          <strong>Aluno:</strong> ${_x(al?.nome || '—')}<br>
          <strong>Curso:</strong> ${_x(cur?.titulo || '—')}<br>
          <strong>Carga:</strong> ${c.cargaHoraria}h<br>
          <strong>Emitido:</strong> ${_fmtDate(c.dataEmissao)}<br>
          <strong>Validade:</strong> ${c.dataValidade ? _fmtDate(c.dataValidade) : 'Sem validade'}
        </div>
      </div>`;
  }

  // ── MODELOS DE CERTIFICADO ────────────────────────────────────
  function abrirModelos() {
    _renderModelos();
    document.getElementById('modal-cert-modelos')?.classList.add('open');
  }

  function _renderModelos() {
    const wrap = document.getElementById('modelos-lista');
    if (!wrap) return;

    const lista = Storage.Certificados.listarModelos();
    if (!lista.length) {
      wrap.innerHTML = '<div style="color:var(--text4);font-size:13px">Nenhum modelo cadastrado.</div>';
      return;
    }

    wrap.innerHTML = lista.map(m => `
      <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
        <div style="width:20px;height:20px;border-radius:4px;background:${m.corPrimaria || '#0002da'};flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;color:var(--text)">${_x(m.nome)}</div>
          <div style="font-size:11px;color:var(--text4)">${_x(m.logoTexto)}</div>
        </div>
        ${m.ativo ? '<span class="badge badge-green" style="font-size:9px">Ativo</span>' : ''}
        <button onclick="CertMod._editarModelo('${m.id}')" class="btn btn-ghost btn-sm">Editar</button>
        <button onclick="CertMod._excluirModelo('${m.id}')" class="btn btn-danger btn-sm">×</button>
      </div>`).join('');
  }

  function novoModelo() {
    CertState.editId = null;
    ['novo-mod-nome','novo-mod-logo','novo-mod-sub','novo-mod-as1','novo-mod-c1','novo-mod-as2','novo-mod-c2','novo-mod-rodape'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('modal-cert-modelos')?.classList.remove('open');
    document.getElementById('modal-cert-novo-modelo')?.classList.add('open');
  }

  const _NOVO_MOD_FIELDS = ['novo-mod-nome','novo-mod-logo','novo-mod-as1','novo-mod-as2','novo-mod-c1','novo-mod-c2','novo-mod-rodape'];

  function salvarNovoModelo() {
    _clearErrs(_NOVO_MOD_FIELDS);
    const nome   = document.getElementById('novo-mod-nome')?.value.trim();
    const logo   = document.getElementById('novo-mod-logo')?.value.trim();
    const as1    = document.getElementById('novo-mod-as1')?.value.trim();
    const as2    = document.getElementById('novo-mod-as2')?.value.trim();
    const c1     = document.getElementById('novo-mod-c1')?.value.trim();
    const c2     = document.getElementById('novo-mod-c2')?.value.trim();
    const rodape = document.getElementById('novo-mod-rodape')?.value.trim();
    let ok = true;
    if (!nome)   { _err('novo-mod-nome',   'Informe o nome do modelo.');      ok = false; }
    if (!logo)   { _err('novo-mod-logo',   'Informe o nome da organização.'); ok = false; }
    if (!as1)    { _err('novo-mod-as1',    'Informe a Assinatura 1.');        ok = false; }
    if (!as2)    { _err('novo-mod-as2',    'Informe a Assinatura 2.');        ok = false; }
    if (!c1)     { _err('novo-mod-c1',     'Informe o Cargo 1.');             ok = false; }
    if (!c2)     { _err('novo-mod-c2',     'Informe o Cargo 2.');             ok = false; }
    if (!rodape) { _err('novo-mod-rodape', 'Informe o texto do rodapé.');     ok = false; }
    if (!ok) return;

    const dados = {
      nome,
      corPrimaria:  '#0002da',
      logoTexto:    logo,
      subtitulo:    document.getElementById('novo-mod-sub')?.value.trim() || 'Plataforma EAD',
      assinatura1:  as1, cargo1: c1,
      assinatura2:  as2, cargo2: c2,
      textoRodape:  rodape,
    };

    Storage.Certificados.criarModelo(dados);
    document.getElementById('modal-cert-novo-modelo')?.classList.remove('open');
    if (window.CertMod?._renderModelosTab) CertMod._renderModelosTab();
    if (window.CertMod?.switchTab) CertMod.switchTab('modelos');
    _toast('Modelo criado!', 's');
  }

  function _editarModelo(id) {
    CertState.editId = id;
    const m = Storage.Certificados.listarModelos().find(m => m.id === id);
    if (!m) return;

    _setVal('mod-nome',   m.nome);
    _setVal('mod-logo',   m.logoTexto);
    _setVal('mod-sub',    m.subtitulo);
    _setVal('mod-as1',    m.assinatura1);
    _setVal('mod-c1',     m.cargo1);
    _setVal('mod-as2',    m.assinatura2);
    _setVal('mod-c2',     m.cargo2);
    _setVal('mod-rodape', m.textoRodape);

    document.getElementById('modal-cert-modelos')?.classList.add('open');
    const lista = document.getElementById('modelos-lista');
    if (lista) lista.style.display = 'none';
    const editor = document.getElementById('modelo-editor');
    if (editor) editor.style.display = 'block';
  }

  const _MOD_FIELDS = ['mod-nome','mod-logo','mod-as1','mod-as2','mod-c1','mod-c2','mod-rodape'];

  function salvarModelo() {
    _clearErrs(_MOD_FIELDS);
    const nome   = document.getElementById('mod-nome')?.value.trim();
    const logo   = document.getElementById('mod-logo')?.value.trim();
    const as1    = document.getElementById('mod-as1')?.value.trim();
    const as2    = document.getElementById('mod-as2')?.value.trim();
    const c1     = document.getElementById('mod-c1')?.value.trim();
    const c2     = document.getElementById('mod-c2')?.value.trim();
    const rodape = document.getElementById('mod-rodape')?.value.trim();
    let ok = true;
    if (!nome)   { _err('mod-nome',   'Informe o nome do modelo.');      ok = false; }
    if (!logo)   { _err('mod-logo',   'Informe o nome da organização.'); ok = false; }
    if (!as1)    { _err('mod-as1',    'Informe a Assinatura 1.');        ok = false; }
    if (!as2)    { _err('mod-as2',    'Informe a Assinatura 2.');        ok = false; }
    if (!c1)     { _err('mod-c1',     'Informe o Cargo 1.');             ok = false; }
    if (!c2)     { _err('mod-c2',     'Informe o Cargo 2.');             ok = false; }
    if (!rodape) { _err('mod-rodape', 'Informe o texto do rodapé.');     ok = false; }
    if (!ok) return;

    const dados = {
      nome,
      corPrimaria: CertState.editId
        ? (Storage.Certificados.listarModelos().find(m => m.id === CertState.editId)?.corPrimaria || '#0002da')
        : '#0002da',
      logoTexto:   logo,
      subtitulo:   document.getElementById('mod-sub')?.value.trim() || 'Plataforma EAD',
      assinatura1: as1, cargo1: c1,
      assinatura2: as2, cargo2: c2,
      textoRodape: rodape,
    };

    if (CertState.editId) {
      Storage.Certificados.atualizarModelo(CertState.editId, dados);
    } else {
      Storage.Certificados.criarModelo(dados);
    }

    document.getElementById('modal-cert-modelos')?.classList.remove('open');
    if (window.CertMod?._renderModelosTab) CertMod._renderModelosTab();
    if (window.CertMod?.switchTab) CertMod.switchTab('modelos');
    _toast('Modelo salvo!', 's');
    CertState.editId = null;
  }

  function _excluirModelo(id) {
    if (!confirm('Excluir este modelo?')) return;
    Storage.Certificados.excluirModelo(id);
    _renderModelos();
    if (window.CertMod?._renderModelosTab) CertMod._renderModelosTab();
  }

  return {
    abrirEmissaoManual, salvarEmissao,
    abrirEmissaoLote, previewLote, executarLote,
    abrirValidar, executarValidacao,
    abrirModelos, novoModelo, salvarNovoModelo, salvarModelo,
    _editarModelo, _excluirModelo,
  };
})();
