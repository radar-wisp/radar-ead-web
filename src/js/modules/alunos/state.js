/**
 * state.js — Estado centralizado do módulo Alunos
 * Ponto único de verdade para todas as variáveis internas.
 * Outros arquivos do módulo leem/escrevem via este objeto.
 */

/* exported AlunosState */
var AlunosState = {
  editId:          null,   // ID do aluno em edição (null = novo)
  perfilId:        null,   // ID do aluno visualizado no perfil
  progCache:       null,   // Map() de progresso por ciclo de render
  vincularAlunoId: null,   // ID do aluno aguardando vinculação de turma
  step:            0,      // Etapa atual do stepper (0–2)
};
