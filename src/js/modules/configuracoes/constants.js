/**
 * configuracoes/constants.js — Constantes e dados estáticos
 * Dependências: nenhuma
 */

/* exported CfgConstants */
var CfgConstants = (() => {
  'use strict';

  const KEYS = {
    CAT_CURSO: 'ead_cfg_cat_curso',
    FMT_CURSO: 'ead_cfg_fmt_aula',
    TIPO_AULA: 'ead_cfg_tipo_aula',
    TIPO_MAT:  'ead_cfg_tipo_mat',
    CAT_MAT:   'ead_cfg_cat_mat',
    DEPTO:     'ead_cfg_departamentos',
    CARGO:     'ead_cfg_cargos',
    UNIDADE:   'ead_cfg_unidades',
  };

  const FORMAT_ICONS = [
    { value:'video',  label:'Vídeo',         svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>' },
    { value:'pdf',    label:'PDF',            svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' },
    { value:'word',   label:'Word',           svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>' },
    { value:'excel',  label:'Excel/Planilha', svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>' },
    { value:'ppt',    label:'Apresentação',   svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' },
    { value:'audio',  label:'Áudio/Podcast',  svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>' },
    { value:'link',   label:'Link Externo',   svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' },
    { value:'quiz',   label:'Quiz/Avaliação', svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
    { value:'live',   label:'Ao Vivo',        svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>' },
    { value:'image',  label:'Imagem',         svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' },
    { value:'text',   label:'Texto/Artigo',   svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>' },
    { value:'zip',    label:'Arquivo/ZIP',    svg:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/></svg>' },
  ];

  const TABS = [
    { id:'cat-curso',  label:'Categoria de curso',    key:KEYS.CAT_CURSO, singular:'categoria',         fields:['nome','descricao'] },
    { id:'fmt-curso',  label:'Formato de curso',      key:KEYS.FMT_CURSO, singular:'formato',           fields:['nome','descricao','icone'], hasIcon:true },
    { id:'tipo-aula',  label:'Tipo de aula',          key:KEYS.TIPO_AULA, singular:'tipo de aula',      fields:['nome','descricao'] },
    { id:'tipo-mat',   label:'Tipo de material',      key:KEYS.TIPO_MAT,  singular:'tipo de material',  fields:['nome','descricao','icone'], hasIcon:true },
    { id:'cat-mat',    label:'Categoria de material', key:KEYS.CAT_MAT,   singular:'categoria',         fields:['nome','descricao'] },
    { id:'depto',      label:'Departamento',          key:KEYS.DEPTO,     singular:'departamento',      fields:['nome','descricao'] },
    { id:'cargo',      label:'Cargo',                 key:KEYS.CARGO,     singular:'cargo',             fields:['nome','descricao'] },
    { id:'unidade',    label:'Unidade/Filial',        key:KEYS.UNIDADE,   singular:'unidade',           fields:['nome','estado'] },
  ];

  const SEED = {
    [KEYS.CAT_CURSO]: [
      { nome:'Técnica',        descricao:'Cursos com foco em habilidades técnicas e operacionais' },
      { nome:'Comportamental', descricao:'Cursos de desenvolvimento humano e soft skills' },
      { nome:'Regulatória',    descricao:'Cursos obrigatórios por normas e compliance' },
      { nome:'Liderança',      descricao:'Cursos voltados para gestão e liderança de equipes' },
    ],
    [KEYS.FMT_CURSO]: [
      { nome:'Vídeo',           descricao:'Arquivo de vídeo MP4, YouTube, Vimeo etc.',  icone:'video' },
      { nome:'PDF',             descricao:'Documento em formato PDF',                    icone:'pdf' },
      { nome:'Word',            descricao:'Documento Microsoft Word (.docx)',            icone:'word' },
      { nome:'Excel',           descricao:'Planilha Excel / Google Sheets',              icone:'excel' },
      { nome:'Apresentação',    descricao:'Slides PowerPoint ou Google Slides',          icone:'ppt' },
      { nome:'Áudio / Podcast', descricao:'Arquivo de áudio ou episódio de podcast',    icone:'audio' },
      { nome:'Link Externo',    descricao:'URL para recurso em site externo',            icone:'link' },
      { nome:'Quiz',            descricao:'Avaliação interativa ou questionário',        icone:'quiz' },
      { nome:'Ao Vivo',         descricao:'Transmissão em tempo real (live/webinar)',    icone:'live' },
      { nome:'Imagem',          descricao:'Arquivo de imagem (PNG, JPG, etc.)',          icone:'image' },
      { nome:'Texto / Artigo',  descricao:'Conteúdo textual inline ou artigo',          icone:'text' },
      { nome:'Arquivo ZIP',     descricao:'Pacote compactado de materiais',              icone:'zip' },
    ],
    [KEYS.TIPO_AULA]: [
      { nome:'Teórica',      descricao:'Aula com foco em conceitos e teoria' },
      { nome:'Prática',      descricao:'Aula com atividades práticas e laboratoriais' },
      { nome:'Avaliativa',   descricao:'Aula destinada a avaliações e testes' },
      { nome:'Complementar', descricao:'Conteúdo de apoio e aprofundamento' },
    ],
    [KEYS.TIPO_MAT]: [
      { nome:'PDF',          descricao:'Documento em formato PDF',       icone:'pdf' },
      { nome:'Vídeo',        descricao:'Arquivo ou link de vídeo',       icone:'video' },
      { nome:'Planilha',     descricao:'Arquivo Excel / Google Sheets',  icone:'excel' },
      { nome:'Apresentação', descricao:'Slides PowerPoint ou similares', icone:'ppt' },
      { nome:'Link Externo', descricao:'URL para recurso externo',       icone:'link' },
    ],
    [KEYS.CAT_MAT]: [
      { nome:'Apostila',      descricao:'Material de estudo em formato de apostila' },
      { nome:'Exercício',     descricao:'Atividade prática para fixação de conteúdo' },
      { nome:'Referência',    descricao:'Material de consulta e referência técnica' },
      { nome:'Complementar',  descricao:'Material de apoio e aprofundamento' },
    ],
    [KEYS.DEPTO]: [
      { nome:'Tecnologia',     descricao:'Equipes de TI, desenvolvimento e infraestrutura' },
      { nome:'Comercial',      descricao:'Vendas, pré-vendas e atendimento ao cliente' },
      { nome:'Operações',      descricao:'Campo, instalação e suporte técnico' },
      { nome:'Administrativo', descricao:'Financeiro, RH e processos internos' },
      { nome:'Marketing',      descricao:'Comunicação, branding e mídias digitais' },
    ],
    [KEYS.CARGO]: [
      { nome:'Técnico de Campo',        descricao:'Instalação e manutenção em campo' },
      { nome:'Analista de Suporte',     descricao:'Suporte técnico N1/N2' },
      { nome:'Vendedor',                descricao:'Prospecção e fechamento de vendas' },
      { nome:'Gerente de TI',           descricao:'Liderança da equipe de tecnologia' },
      { nome:'Auxiliar Administrativo', descricao:'Apoio administrativo e burocrático' },
    ],
    [KEYS.UNIDADE]: [
      { nome:'Sede Anápolis',      estado:'GO' },
      { nome:'Filial Goiânia',     estado:'GO' },
      { nome:'Filial Brasília',    estado:'DF' },
      { nome:'Filial São Paulo',   estado:'SP' },
      { nome:'Filial Rio de Janeiro', estado:'RJ' },
    ],
  };

  return { KEYS, FORMAT_ICONS, TABS, SEED };
})();
