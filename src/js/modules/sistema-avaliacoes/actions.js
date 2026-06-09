/**
 * actions.js — Ações de avaliação (Avaliações).
 * Responsabilidade: CRUD/ciclo de vida (publicar, encerrar, excluir,
 * duplicar, salvar) e modal de resultados. Sem renderização de tabela.
 *
 * @module AvalActions
 */

/* global Storage, AvalUtils, AvalState, Aval */

var AvalActions = (() => {
  'use strict';

  const _q       = AvalUtils.q;
  const _x       = AvalUtils.x;
  const _fmtDate = AvalUtils.fmtDate;
  const _fmtTempo= AvalUtils.fmtTempo;
  const _toast   = AvalUtils.toast;

  function publicar(id) {
    Storage.Avaliacoes.publicar(id);
    _toast('Avaliação publicada!', 's');
    Aval.refresh();
  }

  function encerrar(id) {
    Storage.Avaliacoes.encerrar(id);
    _toast('Avaliação encerrada.', 'i');
    Aval.refresh();
  }

  function arquivar(id) {
    Storage.Avaliacoes.arquivar(id);
    _toast('Avaliação arquivada.', 'i');
    Aval.refresh();
  }

  function excluir(id) {
    if (!confirm('Excluir avaliação e todos os resultados?')) return;
    Storage.Avaliacoes.excluir(id);
    _toast('Excluída.', 'i');
    Aval.refresh();
  }

  function duplicar(id) {
    const nova = Storage.Avaliacoes.duplicar(id);
    if (nova) { _toast('Avaliação duplicada!', 's'); Aval.refresh(); }
  }

  // ══════════════════════════════════════════════════════════════
  // MODAL DE CRIAÇÃO

  function salvar() {
    const nome = document.getElementById('mav-nome')?.value.trim();
    if (!nome) { alert('Informe o nome da avaliação.'); return; }

    // Campos obrigatórios — Dados gerais
    const cursoId = document.getElementById('mav-curso')?.value || '';
    const status  = document.getElementById('mav-status')?.value || '';
    if (!cursoId) { alert('Selecione o curso vinculado.'); return; }
    if (!status)  { alert('Selecione o status.'); return; }

    // Campos obrigatórios — Configurações (0 é valor válido; vazio não)
    const vNota  = document.getElementById('mav-nota-min')?.value ?? '';
    const vTempo = document.getElementById('mav-tempo')?.value ?? '';
    const vTent  = document.getElementById('mav-tentativas')?.value ?? '';
    if (vNota === '')  { alert('Informe a nota mínima para aprovação.'); return; }
    if (vTempo === '') { alert('Informe o tempo limite.'); return; }
    if (vTent === '')  { alert('Informe as tentativas permitidas.'); return; }

    const getTog = id => document.getElementById(id)?.classList.contains('on') ?? false;

    const dados = {
      nome,
      descricao:          document.getElementById('mav-desc')?.value.trim()          || '',
      cursoId,
      moduloId:           document.getElementById('mav-modulo')?.value                || '',
      turmaId:            document.getElementById('mav-turma')?.value                 || '',
      status,
      notaMinima:         parseInt(vNota)  || 0,
      tempoLimite:        parseInt(vTempo) || 0,
      tentativas:         parseInt(vTent)  || 0,
      resultadoImediato:  getTog('mavcfg-imediato'),
      ordemAleatoria:     getTog('mavcfg-aleatoria'),
      correcaoAutomatica: getTog('mavcfg-correcao'),
    };

    let avalId = AvalState.editId;
    if (AvalState.editId) {
      Storage.Avaliacoes.atualizar(AvalState.editId, dados);
    } else {
      const nova = Storage.Avaliacoes.criar(dados);
      avalId = nova.id;
    }

    // Salva questões: remove antigas e recria todas
    if (AvalState.editId) {
      Storage.Questoes.porAvaliacao(AvalState.editId).forEach(q => Storage.Questoes.excluir(q.id));
    }
    AvalState.questoes.forEach((q, i) => {
      Storage.Questoes.criar({
        avaliacaoId:  avalId,
        tipo:         q.tipo,
        pergunta:     q.pergunta,
        alternativas: q.alternativas,
        correta:      q.correta,
        pontos:       q.pontos  || 10,
        feedback:     q.feedback || '',
        categoria:    q.categoria || '',
        ordem:        i + 1,
      });
    });

    _toast(AvalState.editId ? 'Avaliação atualizada!' : 'Avaliação criada!', 's');
    document.getElementById('modal-avaliacao')?.classList.remove('open');
    AvalState.editId   = null;
    AvalState.questoes = [];
    Aval.refresh();
  }

  /**
   * Abre o modal com os resultados de todos os alunos para uma avaliação.
   * @param {string} id
   */
  function verResultados(id) {
    const av = Storage.Avaliacoes.obter(id);
    if (!av) return;

    const stats     = Storage.Respostas.statsAvaliacao(id);
    const respostas = Storage.Respostas.porAvaliacao(id);

    // Preenche cabeçalho
    const _set = (elId, val) => {
      const el = document.getElementById(elId);
      if (el) el.textContent = val;
    };
    _set('av-res-nome',   av.nome);
    _set('av-res-part',   stats.participantes);
    _set('av-res-media',  stats.media + '%');
    _set('av-res-aprov',  stats.aprovados);
    _set('av-res-reprov', stats.reprovados);
    _set('av-res-taxa',   stats.taxa + '%');
    _set('av-res-taxa2',  stats.taxa + '%');

    const bar = document.getElementById('av-res-bar');
    if (bar) bar.style.width = stats.taxa + '%';

    const tbody = document.getElementById('av-res-tbody');
    const empty = document.getElementById('av-res-empty');

    if (!respostas.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
    } else {
      if (empty) empty.style.display = 'none';
      if (tbody) tbody.innerHTML = respostas
        .sort((a, b) => new Date(b.concluidoEm) - new Date(a.concluidoEm))
        .map(r => {
          const aluno = Storage.Alunos.obter(r.alunoId);
          const nome  = aluno ? _x(aluno.nome) : 'Aluno ' + String(r.alunoId || '').slice(0, 6);
          const stCls = r.aprovado ? 'badge-green' : 'badge-red';
          const stLbl = r.aprovado ? '✓ Aprovado'  : '✕ Reprovado';
          return `<tr>
            <td style="padding:8px 10px;border-bottom:1px solid #f0f1fb">
              <div style="font-size:12px;font-weight:500;color:var(--text)">${nome}</div>
            </td>
            <td style="padding:8px 10px;border-bottom:1px solid #f0f1fb;text-align:center">
              <span style="font-size:14px;font-weight:700;color:${r.aprovado ? 'var(--green-dark)' : 'var(--red)'}">${r.nota}%</span>
            </td>
            <td style="padding:8px 10px;border-bottom:1px solid #f0f1fb;text-align:center">
              <span class="badge ${stCls}">${stLbl}</span>
            </td>
            <td style="padding:8px 10px;border-bottom:1px solid #f0f1fb;text-align:center;font-size:12px;color:var(--text3)">${r.tentativa}ª</td>
            <td style="padding:8px 10px;border-bottom:1px solid #f0f1fb;text-align:center;font-size:12px;color:var(--text4)">${_fmtTempo(r.tempoUsado)}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #f0f1fb;font-size:11px;color:var(--text4)">${_fmtDate(r.concluidoEm)}</td>
          </tr>`;
        }).join('');
    }

    document.getElementById('modal-av-resultados')?.classList.add('open');
  }

  return { publicar, encerrar, arquivar, excluir, duplicar, salvar, verResultados };
})();
