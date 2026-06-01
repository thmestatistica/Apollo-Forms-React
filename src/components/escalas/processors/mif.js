export const processarMIFAutocuidados = (respostas) => {

	const pontuacao = coletarMIFAutocuidados(respostas);
	console.log(pontuacao);

	return {
		"resultado": pontuacao,
		"descricao": "MIF - Auto-Cuidados",
		"doi": "10.1097/00002060-198704000-00011",
		"nome_curto": "MIF - Auto-Cuidados",
		"calculo": "Escore = p1 + p3 + p5 + p7 + p9 + p11",
		"calculo_processado": "Padronização Radar = (base / 42) × 10",
		"interpretacao": "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 42. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (42 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
	};
};

export const coletarMIFAutocuidados = (form) => {
	let count = 0;

	for (let id = 728; id <= 733; id++) {

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

	return count;
};

export const processarMIFControleEsfincteres = (respostas) => {

	const pontuacao = coletarMIFControleEsfincteres(respostas);
	console.log(pontuacao);

	return {
		"resultado": pontuacao,
		"descricao": "MIF - Controle de Esfíncteres",
		"doi": "10.1097/00002060-198704000-00011",
		"nome_curto": "MIF - Controle de Esfíncteres",
		"calculo": "Escore = p1 + p3",
		"calculo_processado": "Padronização Radar = (base / 14) × 10",
		"interpretacao": "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 14. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (14 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
	};
};

export const coletarMIFControleEsfincteres = (form) => {
	let count = 0;

	for (let id = 734; id <= 735; id++) {

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

	return count;
};

export const processarMIFComunicacao = (respostas) => {

	const pontuacao = coletarMIFComunicacao(respostas);
	console.log(pontuacao);

	return {
		"resultado": pontuacao,
		"descricao": "MIF - Comunicação",
		"doi": "10.1097/00002060-198704000-00011",
		"nome_curto": "MIF - Comunicação",
		"calculo": "Escore = p2 + p4",
		"calculo_processado": "Padronização Radar = (base / 14) × 10",
		"interpretacao": "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 14. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (14 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
	};
};

export const coletarMIFComunicacao = (form) => {
	let count = 0;

	for (let id = 736; id <= 737; id++) {

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

	return count;
};

export const processarMIFMobilidade = (respostas) => {

	const pontuacao = coletarMIFMobilidade(respostas);
	console.log(pontuacao);

	return {
		"resultado": pontuacao,
		"descricao": "MIF - Mobilidade/Locomoção",
		"doi": "10.1097/00002060-198704000-00011",
		"nome_curto": "MIF - Mobilidade/Locomoção",
		"calculo": "Escore = p1 + p2 + p3 + p4 + p5 + p6 + p7",
		"calculo_processado": "Padronização Radar = (base / 35) × 10",
		"interpretacao": "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 35. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (35 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
	};
};

export const coletarMIFMobilidade = (form) => {
	console.log(form)
	let count = 0;

	const ids = [723, 724, 725, 726, 727, 1491];

	for (const id of ids) {
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

	if (count >= 35){
		count = 35;
	}

	return count;
};

export const processarMIFConhecimentoSocial = (respostas) => {

	const pontuacao = coletarMIFConhecimentoSocial(respostas);
	console.log(pontuacao);

	return {
		"resultado": pontuacao,
		"descricao": "MIF - Conhecimento Social",
		"doi": "10.1097/00002060-198704000-00011",
		"nome_curto": "MIF - Conhecimento Social",
		"calculo": "Escore = p1 + p2 + p3",
		"calculo_processado": "Padronização Radar = (base / 21) × 10",
		"interpretacao": "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 21. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (21 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
	};
};

export const coletarMIFConhecimentoSocial = (form) => {
	let count = 0;

	for (let id = 738; id <= 740; id++) {

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

	return count;
};
