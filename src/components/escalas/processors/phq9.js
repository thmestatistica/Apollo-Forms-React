export const processarPHQ9 = (respostas) => {

    const pontuacao = coletarPHQ9(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "PHQ-9 – Questionário de Depressão",
        "doi": "10.1046/j.1525-1497.2001.016009606.x",
        "nome_curto": "PHQ9",
        "calculo": "Escore = p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9",
        "calculo_processado": "Padronização Radar = (base / 27) × 10",
        "interpretacao": "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 27. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (27 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
    };
};

export const coletarPHQ9 = (form) => {
    let count = 0;

	for (let id = 670; id <= 678; id++) {

		const item = form.find(
			(resposta) => Number(resposta.perguntaId) === id
		);

		const valor = item?.resposta;

		if (valor) {
			const numero = parseInt(valor.split(" - ")[0], 10);

			if (!isNaN(numero)) {
				count += numero;
			}
		}
	}

    if (count >= 27){
        count = 27;
    }

	return count;
    
};
