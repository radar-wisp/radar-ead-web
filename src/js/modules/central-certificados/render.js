/**
 * render.js — Visualizador do certificado e impressão (Certificados).
 * Responsabilidade: gerar o HTML/SVG visual do certificado e a janela
 * de impressão/PDF. Sem CRUD, sem regras de negócio.
 *
 * @module CertRender
 */

/* global Storage, CertUtils */

var CertRender = (() => {
  'use strict';

  const _x           = CertUtils.x;
  const _fmtDate     = CertUtils.fmtDate;
  const _fmtDateLong = CertUtils.fmtDateLong;

  function visualizar(id) {
    const c = Storage.Certificados.obter(id);
    if (!c) return;

    const codigoEl = document.getElementById('cv-codigo-badge');
    if (codigoEl) codigoEl.textContent = `📋 ${c.codigo}`;

    const renderEl = document.getElementById('cert-render');
    if (renderEl) renderEl.innerHTML = _renderCertSVG(id);

    const modal = document.getElementById('modal-cert-view');
    if (modal) {
      modal.classList.add('open');
      modal._certId = id;
    }
  }

  /**
   * Gera o HTML visual do certificado a partir dos dados do Storage.
   * @param {string} certId
   * @returns {string} HTML do certificado
   */
  function _renderCertSVG(certId) {
    const c   = Storage.Certificados.obter(certId);
    if (!c) return '';
    const al  = Storage.Alunos.obter(c.alunoId);
    const cur = Storage.Cursos.obter(c.cursoId);
    const m   = c.modeloId
      ? Storage.Certificados.listarModelos().find(m => m.id === c.modeloId)
      : null;

    const cor = m?.corPrimaria  || '#0002da';
    const org = m?.logoTexto    || 'Radar Internet';
    const sub = m?.subtitulo    || 'Plataforma EAD';
    const as1 = m?.assinatura1  || 'Diretor(a) de Operações';
    const ca1 = m?.cargo1       || 'Assinatura 1';
    const as2 = m?.assinatura2  || 'Coordenador(a) de T&D';
    const ca2 = m?.cargo2       || 'Assinatura 2';
    const rod = m?.textoRodape  || 'Este certificado atesta a conclusão do curso conforme registros da plataforma.';

    const nomeAluno = al?.nome    || '—';
    const nomeCurso = cur?.titulo || '—';
    const carga     = c.cargaHoraria || cur?.carga || 0;
    const dataConcl = _fmtDateLong(c.dataConclucao || c.dataEmissao);
    const dataEmiss = _fmtDate(c.dataEmissao);
    const validade  = c.dataValidade ? _fmtDate(c.dataValidade) : 'Sem validade';

    // QR-code simulado (grid de quadrados)
    const qrCells = Array.from({ length: 49 }, (_, i) => {
      const row = Math.floor(i / 7), col = i % 7;
      const corner = (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2);
      const fill   = corner || Math.random() > 0.45;
      return `<rect x="${col * 8 + 2}" y="${row * 8 + 2}" width="${fill ? 6 : 0}" height="${fill ? 6 : 0}" fill="${cor}" rx="1"/>`;
    }).join('');

    return `
      <div id="cert-printable" style="background:#fff;width:760px;min-height:540px;margin:0 auto;font-family:'DM Sans',sans-serif;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.12)">
        <div style="height:8px;background:${cor}"></div>
        <div style="padding:28px 40px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e8e8f5">
          <div>
            <div style="font-size:22px;font-weight:800;color:${cor};letter-spacing:-.5px">${_x(org)}</div>
            <div style="font-size:12px;color:#888;margin-top:2px">${_x(sub)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#aaa">Certificado de Conclusão</div>
            <div style="font-size:10px;color:#bbb;margin-top:3px">Emitido em ${_x(dataEmiss)}</div>
          </div>
        </div>
        <div style="padding:32px 40px;display:grid;grid-template-columns:1fr auto;gap:32px;align-items:start">
          <div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#aaa;margin-bottom:8px">Certificamos que</div>
            <div style="font-size:30px;font-weight:800;color:#111;letter-spacing:-.8px;line-height:1.15;margin-bottom:16px">${_x(nomeAluno)}</div>
            <div style="font-size:13px;color:#666;line-height:1.6;max-width:440px">
              concluiu com êxito o curso
              <strong style="color:#111">"${_x(nomeCurso)}"</strong>,
              com carga horária de <strong>${carga} horas</strong>,
              em <strong>${_x(dataConcl)}</strong>.
            </div>
            ${c.nota ? `<div style="margin-top:12px;display:inline-block;padding:4px 14px;background:${cor}15;border-radius:99px;font-size:12px;font-weight:700;color:${cor}">Nota final: ${c.nota}%</div>` : ''}
            <div style="display:flex;gap:40px;margin-top:36px">
              <div style="text-align:center">
                <div style="width:120px;border-top:1.5px solid #ccc;padding-top:6px">
                  <div style="font-size:12px;font-weight:600;color:#333">${_x(as1)}</div>
                  <div style="font-size:10px;color:#aaa">${_x(ca1)}</div>
                </div>
              </div>
              <div style="text-align:center">
                <div style="width:120px;border-top:1.5px solid #ccc;padding-top:6px">
                  <div style="font-size:12px;font-weight:600;color:#333">${_x(as2)}</div>
                  <div style="font-size:10px;color:#aaa">${_x(ca2)}</div>
                </div>
              </div>
            </div>
          </div>
          <div style="text-align:center;flex-shrink:0">
            <svg viewBox="0 0 60 60" width="80" height="80" style="display:block;margin:0 auto 8px;border:1.5px solid #eee;border-radius:6px;padding:4px;background:#fff">
              ${qrCells}
            </svg>
            <div style="font-size:9px;font-family:monospace;color:#999;letter-spacing:.04em;word-break:break-all;max-width:90px">${_x(c.codigo)}</div>
            <div style="font-size:9px;color:#ccc;margin-top:4px">Validade: ${_x(validade)}</div>
          </div>
        </div>
        <div style="padding:14px 40px;background:#fafafa;border-top:1px solid #eee;display:flex;align-items:center;justify-content:space-between">
          <div style="font-size:10px;color:#bbb;max-width:500px;line-height:1.5">${_x(rod)}</div>
          <div style="font-size:9px;color:#ddd;text-align:right;flex-shrink:0">ID: ${_x(c.id.slice(0, 8).toUpperCase())}</div>
        </div>
        <div style="height:4px;background:${cor}"></div>
      </div>`;
  }

  function baixarCert(id) {
    const c = Storage.Certificados.obter(id);
    if (!c) return;
    visualizar(id);
    setTimeout(() => imprimirCert(), 400);
  }

  function imprimirCert() {
    const area = document.getElementById('cert-printable');
    if (!area) return;
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>Certificado</title>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#f4f5fb; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:20px; }
        @media print {
          body { background:#fff; padding:0; }
          .no-print { display:none; }
        }
      </style>
    </head><body>
      <div class="no-print" style="position:fixed;top:16px;right:16px;z-index:9">
        <button onclick="window.print()" style="background:#0002da;color:#fff;border:none;border-radius:7px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer">
          Imprimir / Salvar PDF
        </button>
      </div>
      ${area.outerHTML}
    </body></html>`);
    w.document.close();
  }

  return { visualizar, baixarCert, imprimirCert };
})();
