// Dados de exemplo estáticos para simular os metadados dos formulários
export const formularios = [
  {
    id: 1,
    titulo: "TUG (Timed Up and Go)",
    campos: [
      { id: 1, tipo_resposta_esperada: "DATA", nome: "data_avaliacao_original", label: "Data da Avaliação" },
      { id: 2, tipo_resposta_esperada: "NUMERO_FLOAT", nome: "tentativa1_original", label: "Tentativa 1", meta_dados: { min_value: 0.0, step: 0.1 } },
      { id: 3, tipo_resposta_esperada: "NUMERO_FLOAT", nome: "tentativa2_original", label: "Tentativa 2", meta_dados: { min_value: 0.0, step: 0.1 } },
      { id: 4, tipo_resposta_esperada: "NUMERO_FLOAT", nome: "tentativa3_original", label: "Tentativa 3", meta_dados: { min_value: 0.0, step: 0.1 } },
      { id: 5, tipo_resposta_esperada: "NUMERO_FLOAT", nome: "menor_tempo_calculado", label: "Menor tempo calculado", meta_dados: { format: "%.1f" } },
      {
        id: 6,
        tipo_resposta_esperada: "SELECAO_UNICA",
        nome: "dispositivo_original",
        label: "Utilizou dispositivo auxiliar de marcha?",
        opcoes: [
          { valor: "nao", label: "Não utilizou DAM" },
          { valor: "bengala_1", label: "Bengala de 1 ponto" },
          { valor: "bengala_3", label: "Bengala de 3 pontos" },
          { valor: "bengala_4", label: "Bengala de 4 pontos" },
          { valor: "muleta_canadense", label: "Muleta canadense" },
          { valor: "muleta_axilar", label: "Muleta axilar" },
          { valor: "andador_fixo", label: "Andador fixo" },
          { valor: "andador_rodizios", label: "Andador com rodízios" },
        ],
      },
      {
        id: 7,
        tipo_resposta_esperada: "SELECAO_UNICA",
        nome: "baiobit_original",
        label: "Utilizou Baiobit?",
        opcoes: [
          { valor: "sim", label: "Sim" },
          { valor: "nao", label: "Não" },
        ],
      },
      {
        id: 8,
        tipo_resposta_esperada: "SELECAO_UNICA",
        nome: "intercorrencias_original",
        label: "Intercorrências?",
        opcoes: [
          { valor: "sim", label: "Sim" },
          { valor: "nao", label: "Não" },
        ],
      },
      { id: 9, tipo_resposta_esperada: "TEXTO_LIVRE", nome: "observacoes_original", label: "Observações" },
    ],
  },
  {
    id: 2,
    titulo: "FOIS – Escala Funcional de Alimentação Oral",
    campos: [
      {
        id: 1,
        tipo_resposta_esperada: "SELECAO_UNICA",
        nome: "nivel_fois",
        label: "Selecione o nível FOIS do paciente:",
        opcoes: [
          "Nível 1 – Nada por via oral.",
          "Nível 2 – Dependente de via alternativa com mínima oferta de via oral.",
          "Nível 3 – Dependente de via alternativa com consistente oferta de via oral.",
          "Nível 4 – Via oral exclusiva com uma única consistência.",
          "Nível 5 – Via oral exclusiva com múltiplas consistências, porém com necessidade de preparo especial ou compensações.",
          "Nível 6 – Via oral exclusiva com múltiplas consistências, sem necessidade de preparo especial, porém com restrições específicas.",
          "Nível 7 – Via oral total sem restrições.",
        ],
      },
      { id: 2, tipo_resposta_esperada: "TEXTO_LIVRE", nome: "observacoes", label: "Observações sobre alimentação:" },
    ],
  },
  {
    id: 3,
    titulo: "Fugl-Meyer - Extremidades Superiores",
    campos: [
      { id: 1, tipo_resposta_esperada: "SELECAO_UNICA", nome: "reflexo_biceps", label: "Motricidade Reflexa: Bíceps", opcoes: [
        "0 - Ausente",
        "2 - Completo"
      ] },
      { id: 2, tipo_resposta_esperada: "SELECAO_UNICA", nome: "reflexo_triceps", label: "Motricidade Reflexa: Tríceps", opcoes: [
        "0 - Ausente",
        "2 - Completo"
      ] },
      { id: 3, tipo_resposta_esperada: "SELECAO_UNICA", nome: "sinergia_flexora_retracao", label: "Sinergia Flexora: Retração da Escápula", opcoes: [
        "0 - Ausente",
        "1 - Parcial",
        "2 - Completo"
      ] },
      { id: 4, tipo_resposta_esperada: "SELECAO_UNICA", nome: "sinergia_flexora_elevacao", label: "Sinergia Flexora: Elevação do Ombro", opcoes: [
        "0 - Ausente",
        "1 - Parcial",
        "2 - Completo"
      ] },
      { id: 5, tipo_resposta_esperada: "SELECAO_UNICA", nome: "sinergia_flexora_rotacao_externa", label: "Sinergia Flexora: Rotação Externa do Ombro", opcoes: [
        "0 - Ausente",
        "1 - Parcial",
        "2 - Completo"
      ] },
      { id: 6, tipo_resposta_esperada: "SELECAO_UNICA", nome: "sinergia_flexora_flexao_cotovelo", label: "Sinergia Flexora: Flexão de Cotovelo", opcoes: [
        "0 - Ausente",
        "1 - Parcial",
        "2 - Completo"
      ] },
      { id: 7, tipo_resposta_esperada: "SELECAO_UNICA", nome: "sinergia_extensora", label: "Sinergia Extensora", opcoes: [
        "0 - Ausente",
        "1 - Parcial",
        "2 - Completo"
      ] },
      { id: 8, tipo_resposta_esperada: "SELECAO_UNICA", nome: "movimentos_fora_sinergia", label: "Movimentos Fora da Sinergia", opcoes: [
        "0 - Ausente",
        "1 - Parcial",
        "2 - Completo"
      ] },
      { id: 9, tipo_resposta_esperada: "TEXTO_LIVRE", nome: "observacoes", label: "Observações gerais" },
    ],
  },
];
