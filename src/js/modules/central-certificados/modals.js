/**
 * modals.js — Modais do módulo Certificados.
 * Responsabilidade: abertura/submit dos modais (emissão manual, emissão
 * em lote, validação por código e gestão de modelos). Persiste via
 * window.Storage e dispara CertMod.refresh() após mutações.
 *
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
    const alunoId = document.getElementById('mce-aluno')?.value;
    const cursoId = document.getElementById('mce-curso')?.value;
    if (!alunoId || !cursoId) { alert('Selecione aluno e curso.'); return; }

    const concl = document.getElementById('mce-conclusao')?.value;
    const val   = document.getElementById('mce-validade')?.value;
    const nota  = parseInt(document.getElementById('mce-nota')?.value) || 0;
    const cur   = Storage.Cursos.obter(cursoId);

    Storage.Certificados.emitir({
      alunoId,
      cursoId,
      cargaHoraria:  cur?.carga || 0,
      dataConclucao: concl ? new Date(concl).toISOString() : new Date().toISOString(),
      dataValidade:  val   ? new Date(val).toISOString()   : null,
      nota,
      responsavel:   document.getElementById('mce-resp')?.value.trim() || 'Admin',
      obs:           document.getElementById('mce-obs')?.value.trim()  || '',
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
    const cursoId = document.getElementById('mlote-curso')?.value;
    if (!cursoId) { alert('Selecione um curso.'); return; }

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

  function executarLote() {
    const cursoId  = document.getElementById('mlote-curso')?.value;
    if (!cursoId) { alert('Selecione um curso.'); return; }

    const nota     = parseInt(document.getElementById('mlote-nota')?.value)     || 0;
    const valDias  = parseInt(document.getElementById('mlote-validade')?.value) || 0;
    const resp     = document.getElementById('mlote-resp')?.value.trim()        || 'Admin';

    const emitidos = Storage.Certificados.emitirLote(cursoId, {
      notaMinima:   nota,
      validadeDias: valDias,
      responsavel:  resp,
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
    const codigo = document.getElementById('validar-codigo')?.value.trim().toUpperCase();
    if (!codigo) { alert('Digite o código do certificado.'); return; }

    const c   = Storage.Certificados.porCodigo(codigo);
    const res = document.getElementById('validar-result');
    if (!res) return;
    res.style.display = 'block';

    if (!c) {
      res.innerHTML = `
        <div style="padding:14px;background:#fee2e2;border-radius:var(--radius-sm);border:1.5px solid #fca5a5">
          <div style="font-size:14px;font-weight:700;color:var(--red);margin-bottom:4px">❌ Certificado não encontrado</div>
          <div style="font-size:12px;color:var(--red)">O código informado não existe na base de dados.</div>
        </div>`;
      return;
    }

    const al    = Storage.Alunos.obter(c.alunoId);
    const cur   = Storage.Cursos.obter(c.cursoId);
    const clsBg  = c.status === 'emitido' ? '#d1fae5' : c.status === 'expirado' ? '#fee2e2' : '#fef3c7';
    const clsBo  = c.status === 'emitido' ? '#6ee7b7' : c.status === 'expirado' ? '#fca5a5' : '#fcd34d';
    const clsTxt = c.status === 'emitido' ? 'var(--green-dark)' : c.status === 'expirado' ? 'var(--red)' : 'var(--amber-dark)';
    const icon   = c.status === 'emitido' ? '✅' : c.status === 'expirado' ? '⚠️' : '❌';

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
    ['mod-nome', 'mod-logo', 'mod-sub', 'mod-as1', 'mod-c1', 'mod-as2', 'mod-c2', 'mod-rodape'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    _setVal('mod-cor', '#0002da');
    _renderModelos();
    document.getElementById('modal-cert-modelos')?.classList.add('open');
    const editor = document.getElementById('modelo-editor');
    if (editor) editor.style.display = 'block';
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
    _setVal('mod-cor',    m.corPrimaria || '#0002da');

    _renderModelos();
    document.getElementById('modal-cert-modelos')?.classList.add('open');
    const editor = document.getElementById('modelo-editor');
    if (editor) editor.style.display = 'block';
  }

  function salvarModelo() {
    const nome = document.getElementById('mod-nome')?.value.trim();
    if (!nome) { alert('Informe o nome do modelo.'); return; }

    const dados = {
      nome,
      corPrimaria:  document.getElementById('mod-cor')?.value                 || '#0002da',
      logoTexto:    document.getElementById('mod-logo')?.value.trim()         || 'Radar Internet',
      subtitulo:    document.getElementById('mod-sub')?.value.trim()          || 'Plataforma EAD',
      assinatura1:  document.getElementById('mod-as1')?.value.trim()          || '',
      cargo1:       document.getElementById('mod-c1')?.value.trim()           || '',
      assinatura2:  document.getElementById('mod-as2')?.value.trim()          || '',
      cargo2:       document.getElementById('mod-c2')?.value.trim()           || '',
      textoRodape:  document.getElementById('mod-rodape')?.value.trim()       || '',
    };

    if (CertState.editId) {
      Storage.Certificados.atualizarModelo(CertState.editId, dados);
    } else {
      Storage.Certificados.criarModelo(dados);
    }

    const editor = document.getElementById('modelo-editor');
    if (editor) editor.style.display = 'none';

    _renderModelos();
    if (window.CertMod?._renderModelosTab) CertMod._renderModelosTab();
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
    abrirModelos, novoModelo, salvarModelo,
    _editarModelo, _excluirModelo,
  };
})();
