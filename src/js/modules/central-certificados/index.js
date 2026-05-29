/**
 * @fileoverview central-certificados/index.js — Fachada do módulo.
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MÓDULO: CertMod (Central de Certificados EAD)                   ║
 * ║                                                                  ║
 * ║  Fachada do módulo — mantém a API pública window.CertMod         ║
 * ║  consumida por admin.html (onclick) SEM alterações.              ║
 * ║                                                                  ║
 * ║  Dependências (ordem de carregamento):                           ║
 * ║  • window.Storage  (storage.js)                                  ║
 * ║  • CertState   → state.js                                        ║
 * ║  • CertUtils   → utils.js                                        ║
 * ║  • CertTable   → table.js   (stats, filtros, tabela, painéis)    ║
 * ║  • CertRender  → render.js  (visualizador + impressão)           ║
 * ║  • CertModals  → modals.js  (emissão, lote, validação, modelos)  ║
 * ║  • CertActions → actions.js (reemitir, cancelar, excluir)        ║
 * ║                                                                  ║
 * ║  MIGRAÇÃO BACKEND: apenas window.Storage precisa mudar.          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * @module CertMod
 * @version 2.0.0
 */

/* global Storage, CertTable, CertRender, CertModals, CertActions */

var CertMod = (() => {
  'use strict';

  function init() {
    Storage.Certificados.sincronizar();
    if (!Storage.Certificados.listarModelos().length) {
      Storage.Certificados.criarModelo({ nome: 'Modelo Padrão' });
    }
    CertTable.renderStats();
    CertTable.renderTabela();
    CertTable.renderPendentes();
    CertTable.renderVencimentos();
    CertTable._popularFiltroCurso();
  }

  function refresh() {
    Storage.Certificados.sincronizar();
    CertTable.renderStats();
    CertTable.renderTabela();
    CertTable.renderPendentes();
    CertTable.renderVencimentos();
  }

  return {
    // Ciclo de vida
    init, refresh,

    // Renderização (tabela e painéis)
    renderTabela:     CertTable.renderTabela,
    renderPendentes:  CertTable.renderPendentes,
    renderVencimentos:CertTable.renderVencimentos,

    // Filtros
    setStatus:    CertTable.setStatus,
    resetFiltros: CertTable.resetFiltros,

    // Visualização e download
    visualizar:   CertRender.visualizar,
    baixarCert:   CertRender.baixarCert,
    imprimirCert: CertRender.imprimirCert,

    // Ações individuais
    reemitir: CertActions.reemitir,
    cancelar: CertActions.cancelar,
    excluir:  CertActions.excluir,

    // Emissão
    abrirEmissaoManual: CertModals.abrirEmissaoManual,
    salvarEmissao:      CertModals.salvarEmissao,
    abrirEmissaoLote:   CertModals.abrirEmissaoLote,
    previewLote:        CertModals.previewLote,
    executarLote:       CertModals.executarLote,

    // Validação
    abrirValidar:      CertModals.abrirValidar,
    executarValidacao: CertModals.executarValidacao,

    // Modelos
    abrirModelos: CertModals.abrirModelos,
    novoModelo:   CertModals.novoModelo,
    salvarModelo: CertModals.salvarModelo,

    // Menu
    _menu: CertTable._menu,
    _cm:   CertTable._cm,

    // Internos chamados pelo HTML inline
    _emitirRapido:  CertActions._emitirRapido,
    _editarModelo:  CertModals._editarModelo,
    _excluirModelo: CertModals._excluirModelo,
  };
})();
