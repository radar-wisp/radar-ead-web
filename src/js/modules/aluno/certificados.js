/**
 * certificados.js — Exibição, emissão e download de certificados
 */

/* global Storage, AlunoState, AlunoUtils */

var AlunoCertificados = (() => {
  'use strict';

  const { x, toast } = AlunoUtils;

  function renderCertificados() {
    const me   = AlunoState.getMe();
    const lista = Storage.Certificados.porAluno(me.id);
    const wrap  = document.getElementById('certs-list');

    if (!lista.length) {
      wrap.innerHTML = `<div class="empty"><div class="empty-icon"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg></div><h3>Nenhum certificado ainda</h3><p>Conclua um curso para receber seu certificado.</p></div>`;
      return;
    }

    wrap.innerHTML = lista.map(c => {
      const curso = Storage.Cursos.obter(c.cursoId);
      const data  = (c.dataConclucao || c.dataEmissao)
        ? new Date(c.dataConclucao || c.dataEmissao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
        : '—';
      return `<div class="card cert-row">
        <div class="card-body" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <div style="flex:1;min-width:0">
            <div style="font-family:var(--font-j);font-weight:700;font-size:.9rem;margin-bottom:3px">${x(curso?.titulo || 'Curso removido')}</div>
            <div style="font-size:.78rem;color:var(--t3)">Concluído em ${data}</div>
            <div style="font-size:.72rem;color:var(--t4);margin-top:2px">Código: ${c.codigo || '—'}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="Aluno.baixarCert('${c.id}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Baixar
          </button>
        </div>
      </div>`;
    }).join('');
  }

  function baixarCert(certId) {
    const me  = AlunoState.getMe();
    const c   = Storage.Certificados.obter(certId);
    const curso = c ? Storage.Cursos.obter(c.cursoId) : null;
    if (!c) { toast('Certificado não encontrado.', 'e'); return; }

    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Certificado</title>
    <style>body{font-family:Georgia,serif;text-align:center;padding:60px 80px;color:#1a1a2e}
    h1{font-size:2rem;color:#2f45ff;margin-bottom:6px}
    .sub{color:#666;font-size:.9rem;margin-bottom:40px}
    .nome{font-size:1.8rem;font-weight:700;border-bottom:2px solid #e0e0e0;padding-bottom:16px;margin-bottom:16px}
    .curso{font-size:1.1rem;color:#2f45ff;font-weight:600;margin-bottom:8px}
    .data{color:#888;font-size:.85rem;margin-bottom:30px}
    .cod{font-size:.72rem;color:#aaa;border-top:1px solid #eee;padding-top:14px;margin-top:30px}
    @media print{button{display:none}}</style></head><body>
    <h1>Certificado de Conclusão</h1>
    <p class="sub">Certificamos que</p>
    <div class="nome">${x(me.nome)}</div>
    <div class="curso">${x(curso?.titulo || '—')}</div>
    <p class="data">Concluído em ${new Date(c.dataConclucao || c.dataEmissao || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
    <div class="cod">Código de validação: ${c.codigo || '—'}</div>
    <br><button onclick="window.print()">Imprimir / Salvar PDF</button>
    </body></html>`);
    w.document.close();
  }

  function mostrarCertificado() {
    const me   = AlunoState.getMe();
    const cur  = AlunoState.getCur();
    const curso = Storage.Cursos.obter(cur.cursoId);
    const cert  = Storage.Certificados.emitir({
      alunoId: me.id,
      cursoId: cur.cursoId,
      cargaHoraria: curso?.carga || 0,
      dataConclucao: new Date().toISOString(),
      dataValidade: null,
      responsavel: 'Sistema',
    });

    document.getElementById('certNome').textContent  = me?.nome || '—';
    document.getElementById('certCurso').textContent = curso?.titulo || '—';
    document.getElementById('certData').textContent  =
      new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    const codigoEl = document.getElementById('certCodigo');
    if (codigoEl) codigoEl.textContent = cert?.codigo || '';

    document.getElementById('certBg').classList.add('open');
    document.getElementById('btnFecharCert').onclick   = () => document.getElementById('certBg').classList.remove('open');
    document.getElementById('btnImprimirCert').onclick = () => window.print();
  }

  return { renderCertificados, baixarCert, mostrarCertificado };
})();
