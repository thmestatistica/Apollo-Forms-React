import { obterNumeroResposta } from "../../../utils/process/processUtils";

export const processarIPAQ = (respostas) => {
    const pontuacao = coletarIPAQ(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "Questionário Internacional de Atividade Física (IPAQ)",
        "doi": "10.12820/rbafs.v.6n2p5-18",
        "nome_curto": "IPAQ",
        "calculo": "Muito Ativo: VIGOROSAS (>= 5 dias/sem e >= 30 min/sessão)\n\nOU VIGOROSAS (>= 3 dias/sem e >= 20 min/sessão) somadas a\n\n Moderada/Caminhada (>= 5 dias/sem e >= 30 min/sessão).\n\nAtivo: VIGOROSAS (>= 3 dias/sem e >= 20 min/sessão)\n\nOU MODERADAS/CAMINHADA (>= 5 dias/sem e >= 30 min/sessão)\n\nOU qualquer atividade somada que atinja >= 5 dias/sem e >= 150 min/sem.\n\nIrregularmente ativo: Realiza atividade física, mas não o suficiente para ser classificado como Ativo.\n\nSedentário: Não realizou nenhuma atividade física por pelo menos 10 minutos contínuos durante toda a semana.",
        "calculo_processado": "Muito Ativo = 10; Ativo = 8; Irregular = 5; Sedentário = 1.",
        "interpretacao": "A pontuação é definida pelos seguintes critérios técnicos de frequência e duração:\n\n- NOTA 10 (Muito Ativo): Cumpre atividades VIGOROSAS (>= 5 dias/sem e >= 30 min/sessão) OU VIGOROSAS (>= 3 dias/sem e >= 20 min/sessão) somadas a Moderada/Caminhada (>= 5 dias/sem e >= 30 min/sessão).\n\n- NOTA 8 (Ativo): Cumpre atividades VIGOROSAS (>= 3 dias/sem e >= 20 min/sessão) OU MODERADAS/CAMINHADA (>= 5 dias/sem e >= 30 min/sessão) OU qualquer atividade somada que atinja >= 5 dias/sem e >= 150 min/sem.\n\n- NOTA 5 (Irregular): Realiza atividade física, mas não o suficiente para ser classificado como Ativo. Inclui o subgrupo A (cumpre apenas frequência de 5 dias ou apenas duração de 150 min/sem) e o subgrupo B (não cumpre nenhum critério).\n\n- NOTA 1 (Sedentário): Não realizou nenhuma atividade física por pelo menos 10 minutos contínuos durante toda a semana."
    }
}

export const coletarIPAQ = (respostas) => {

    // Dias por semana
    const diasAtividadeVigorosa = obterNumeroResposta(1010, respostas);
    const diasAtividadeModerada = obterNumeroResposta(1012, respostas);
    const diasCaminhada = obterNumeroResposta(1014, respostas);

    console.log(diasAtividadeVigorosa);
    console.log(diasAtividadeModerada);
    console.log(diasCaminhada);

    // Minutos por dia
    const minutosAtividadeVigorosa = obterNumeroResposta(1011, respostas);
    const minutosAtividadeModerada = obterNumeroResposta(1013, respostas);
    const minutosCaminhada = obterNumeroResposta(1015, respostas);

    console.log(minutosAtividadeVigorosa);
    console.log(minutosAtividadeModerada);
    console.log(minutosCaminhada);

    // Apenas atividades com duração mínima de 10 minutos contam
    const vigorosaValida = minutosAtividadeVigorosa >= 10;
    const moderadaValida = minutosAtividadeModerada >= 10;
    const caminhadaValida = minutosCaminhada >= 10;

    console.log(vigorosaValida);
    console.log(moderadaValida);
    console.log(caminhadaValida);

    // Se a duração não for válida, consideramos 0 minutos para aquela atividade
    const diasVigorosa = vigorosaValida ? diasAtividadeVigorosa : 0;
    const diasModerada = moderadaValida ? diasAtividadeModerada : 0;
    const diasCaminhadaValida = caminhadaValida ? diasCaminhada : 0;

    console.log(diasVigorosa);
    console.log(diasModerada);
    console.log(diasCaminhadaValida);

    const minutosVigorosa = vigorosaValida ? minutosAtividadeVigorosa : 0;
    const minutosModerada = moderadaValida ? minutosAtividadeModerada : 0;
    const minutosCaminhadaValidos = caminhadaValida ? minutosCaminhada : 0;

    console.log(minutosVigorosa);
    console.log(minutosModerada);
    console.log(minutosCaminhadaValidos);

    const totalDiasSemana =
        diasVigorosa +
        diasModerada +
        diasCaminhadaValida;

    console.log(totalDiasSemana);

    const totalMinutosSemana =
        (diasVigorosa * minutosVigorosa) +
        (diasModerada * minutosModerada) +
        (diasCaminhadaValida * minutosCaminhadaValidos);

    console.log(totalMinutosSemana);

    const isMuitoAtivo =
        (diasVigorosa >= 5 && minutosVigorosa >= 30) ||
        (
            diasVigorosa >= 3 &&
            minutosVigorosa >= 20 &&
            (
                (diasModerada >= 5 && minutosModerada >= 30) ||
                (diasCaminhadaValida >= 5 && minutosCaminhadaValidos >= 30)
            )
        );
    
    console.log(isMuitoAtivo);
    
    if (isMuitoAtivo) {
        console.log("Classificado como Muito Ativo");
        return 10;
    }

    const isAtivo =
        (diasVigorosa >= 3 && minutosVigorosa >= 20) ||
        (diasModerada >= 5 && minutosModerada >= 30) ||
        (diasCaminhadaValida >= 5 && minutosCaminhadaValidos >= 30) ||
        (totalDiasSemana >= 5 && totalMinutosSemana >= 150);

    console.log(isAtivo);

    if (isAtivo) {
        console.log("Classificado como Ativo");
        return 8;
    }

    const isSedentario = totalMinutosSemana === 0;

    console.log(isSedentario);

    if (isSedentario) {
        console.log("Classificado como Sedentário");
        return 1;
    }

    // Irregularmente ativo (A ou B)
    return 5;
};
