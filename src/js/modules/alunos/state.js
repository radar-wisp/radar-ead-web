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
  page:            1,      // Página atual da tabela (quebra de página)
  perPage:         25,     // Itens por página (25 / 50 / 75 / 100)
  lastFilterSig:   null,   // Assinatura dos filtros p/ resetar página ao mudar
};
