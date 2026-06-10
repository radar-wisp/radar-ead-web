/**
 * stats.js — Cards de indicadores e gráficos do Dashboard
 * Responsabilidade: ler dados do Storage e preencher os elementos de UI.
 */

/* global Storage, DashboardUtils */
/* exported DashboardStats */

var DashboardStats = (() => {
  'use strict';

  const _x             = DashboardUtils.escapeHtml;
  const renderBarChart = DashboardUtils.renderBarChart;

  function q(sel) { return document.querySelector(sel); }

  /**
   * Atualiza os cards de indicadores e os gráficos do Dashboard.
   */
  function render() {
    const allCursos  = Storage.Cursos.listar();
    const allAlunos  = Storage.Alunos.listar();
    const certStats  = Storage.Certificados.stats();
    const certs      = Storage.Certificados.listar();
    const ativos     = allAlunos.filter(a => a.statusAcesso === 'ativo' || (a.ativo && !a.statusAcesso)).length;

    // ── Cards ──
    q('#ds-cursos').textContent       = allCursos.length;
    q('#ds-colab-total').textContent  = allAlunos.length;
    q('#ds-colab-ativos').textContent = ativos;
    q('#ds-cert-emit').textContent    = certStats.emitidos;
    q('#ds-cert-venc').textContent    = certStats.expirados;

    const subAtivos = q('#ds-colab-ativos-sub');
    if (subAtivos) {
      const pct = allAlunos.length ? Math.round(ativos / allAlunos.length * 100) : 0;
      subAtivos.textContent = pct + '% do total';
    }

    // ── Gráfico: Conclusão dos cursos (taxa média por curso) ──
    const conclusao = allCursos
      .filter(c => (c.status || 'rascunho') === 'publicado')
      .map(c => {
        const pcts  = allAlunos.filter(a => a.ativo).map(a => Storage.Progresso.pctCurso(a.id, c.id));
        const media = pcts.length ? Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length) : 0;
        return { nome: c.titulo, valor: media };
      })
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);
    renderBarChart('ds-chart-conclusao', conclusao, 'blue', v => v + '%', 100);

    // ── Gráfico: Certificados por setores ──
    const validos   = certs.filter(c => c.status !== 'cancelado');
    const porSetor  = {};
    validos.forEach(c => {
      const al = allAlunos.find(a => a.id === c.alunoId);
      const id = al && al.setorId ? al.setorId : '__';
      porSetor[id] = (porSetor[id] || 0) + 1;
    });
    const setores = Object.keys(porSetor).map(id => ({
      nome:  id === '__' ? 'Sem setor' : (Storage.Setores.obter(id)?.nome || 'Setor'),
      valor: porSetor[id],
    })).sort((a, b) => b.valor - a.valor).slice(0, 6);
    renderBarChart('ds-chart-setores', setores, 'green');

    // ── Gráfico: Certificados por equipes ──
    const porEquipe = {};
    validos.forEach(c => {
      const al = allAlunos.find(a => a.id === c.alunoId);
      const id = al && al.equipeId ? al.equipeId : '__';
      porEquipe[id] = (porEquipe[id] || 0) + 1;
    });
    const equipes = Object.keys(porEquipe).map(id => ({
      nome:  id === '__' ? 'Sem equipe' : (Storage.Equipes.obter(id)?.nome || 'Equipe'),
      valor: porEquipe[id],
    })).sort((a, b) => b.valor - a.valor).slice(0, 6);
    renderBarChart('ds-chart-equipes', equipes, 'purple');
  }

  return { render };
})();
