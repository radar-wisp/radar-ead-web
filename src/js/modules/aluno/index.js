/**
 * @fileoverview aluno/index.js — Portal do Aluno EAD
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO: Aluno (window.Aluno)                                    ║
 * ║                                                                  ║
 * ║  Ponto de entrada: aluno.html                                    ║
 * ║                                                                  ║
 * ║  Dependências internas (ordem de carregamento):                  ║
 * ║  • AlunoState        (state.js)                                  ║
 * ║  • AlunoUtils        (utils.js)                                  ║
 * ║  • AlunoCards        (cards.js)                                  ║
 * ║  • AlunoCertificados (certificados.js)                           ║
 * ║  • AlunoPages        (pages.js)                                  ║
 * ║  • AlunoNav          (nav.js)                                    ║
 * ║  • AlunoPlayer       (player.js)                                 ║
 * ║  • AlunoAuth         (auth.js)                                   ║
 * ║                                                                  ║
 * ║  Dependências externas:                                          ║
 * ║  • window.Storage  (storage.js)                                  ║
 * ║  • window.EadUtils (utils.js)                                    ║
 * ║                                                                  ║
 * ║  API pública (window.Aluno) — contratos preservados:             ║
 * ║  • boot()                                                        ║
 * ║  • iniciarCurso(cursoId)                                         ║
 * ║  • abrirAula(cursoId, aulaId)                                    ║
 * ║  • selAula(aulaId)                                               ║
 * ║  • baixarCert(certId)                                            ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

/* global AlunoAuth, AlunoPlayer, AlunoCertificados */

var Aluno = (() => {
  'use strict';

  return {
    boot:                  AlunoAuth.boot,
    iniciarCurso:          AlunoPlayer.iniciarCurso,
    abrirAula:             AlunoPlayer.abrirAula,
    selAula:               AlunoPlayer.selAula,
    toggleModulo:          AlunoPlayer.toggleModulo,
    irParaAvaliacao:       AlunoPlayer.irParaAvaliacao,
    _submeterAvaliacao:    AlunoPlayer._submeterAvaliacao,
    _emitirCertificadoComNota: AlunoPlayer._emitirCertificadoComNota,
    baixarCert:            AlunoCertificados.baixarCert,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  Storage.seed();
  Aluno.boot();
});
