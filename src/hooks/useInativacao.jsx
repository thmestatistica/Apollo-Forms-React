import { useCallback, useEffect, useState } from "react";
import { buscar_respostas_inativas, buscar_respostas_pendentes } from "../api/gestao/gestao_utils";

export const useInativacao = () => {
    const [respostasPendentes, setRespostasPendentes] = useState([]);
    const [respostasInativas, setRespostasInativas] = useState([]);
    const [loadingRespostasPendentes, setLoadingRespostasPendentes] = useState(true);
    const [loadingRespostasInativas, setLoadingRespostasInativas] = useState(true);

    const carregarPendentes = useCallback(async () => {
        setLoadingRespostasPendentes(true);
        try {
            const pendentes = await buscar_respostas_pendentes();
            setRespostasPendentes(pendentes);
        } catch (e) {
            console.error("Erro ao carregar respostas pendentes", e);
        } finally {
            setLoadingRespostasPendentes(false);
        }
    }, []);

    const carregarInativas = useCallback(async () => {
        setLoadingRespostasInativas(true);
        try {
            const inativas = await buscar_respostas_inativas();
            setRespostasInativas(inativas);
        } catch (e) {
            console.error("Erro ao carregar respostas inativas", e);
        } finally {
            setLoadingRespostasInativas(false);
        }
    }, []);

    const recarregar = useCallback(() => {
        return Promise.all([carregarPendentes(), carregarInativas()]);
    }, [carregarPendentes, carregarInativas]);

    useEffect(() => {
        recarregar();
    }, [recarregar]);

    return {
        respostasPendentes,
        respostasInativas,
        loadingRespostasPendentes,
        loadingRespostasInativas,
        recarregar,
    };
};