import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GestaoEvolucaoHeader from '../../components/gestaoPendenciasEvolucao/GestaoEvolucaoHeader'
import GestaoEvolucaoMetrics from '../../components/gestaoPendenciasEvolucao/GestaoEvolucaoMetrics'
import GestaoEvolucaoAll from '../../components/gestaoPendenciasEvolucao/GestaoEvolucaoAll'
import useProfissionais from '../../hooks/useProfissionais'
import SingleSelect from '../../components/input/SingleSelect'
import {
    NIVEIS,
    PACIENTES_IGNORADOS_CRITICA,
    campoNivel,
    horasDesde,
    classificarPendencia,
} from '../../utils/pendencias/niveisPendencia'
import GestaoEvolucaoProfissional from '../../components/gestaoPendenciasEvolucao/GestaoEvolucaoProfissional'

function GestaoEvolucao() {
    const navigate = useNavigate()

    const [selectedProfessional, setSelectedProfessional] = useState(null)

    const {
        fetchProfissionais,
        fetchPendenciasProfissionais,
        pendenciasProfissionais,
        profissionaisOptions,
    } = useProfissionais()

    useEffect(() => {
        fetchProfissionais()
        fetchPendenciasProfissionais()
    }, [])

    const dadosEnriquecidos = useMemo(() => {
        const agora = Date.now()

        return (pendenciasProfissionais ?? [])
            .filter((prof) => prof?.nomeCompleto !== null)
            .filter((prof) => prof?.ativo === true)
            .map((prof) => {
                const tempos = (prof?.agendamentos ?? [])
                    .filter((ag) => ag?.fim)
                    .map((ag) => new Date(ag.fim).getTime())

                const contagens = Object.fromEntries(
                    NIVEIS.map((n) => [campoNivel(n.chave), 0])
                )
                tempos.forEach((t) => {
                    const nivel = classificarPendencia(horasDesde(agora, t))
                    contagens[campoNivel(nivel)] += 1
                })

                const maisAntigaTs = tempos.length ? Math.min(...tempos) : null

                return {
                    ...prof,
                    ...contagens,
                    totalPendencias: prof?.ag_presenca_ids?.length ?? 0,
                    maisAntigaTs,
                    maisAntiga: maisAntigaTs
                        ? new Date(maisAntigaTs).toLocaleDateString('pt-BR')
                        : null,
                }
            })
    }, [pendenciasProfissionais])

    const resumo = useMemo(() => {
        const agora = Date.now()

        const totalPendencias = dadosEnriquecidos.reduce(
            (acc, p) => acc + p.totalPendencias,
            0
        )

        const profissionaisComPendencias = dadosEnriquecidos.filter(
            (p) => p.totalPendencias > 0
        ).length

        const campoCritica = campoNivel('critica')
        const topCritica = dadosEnriquecidos.reduce(
            (max, p) => (p[campoCritica] > (max?.[campoCritica] ?? 0) ? p : max),
            null
        )

        const tsMaisAntiga = dadosEnriquecidos.reduce((min, p) => {
            const tempos = (p?.agendamentos ?? [])
                .filter(
                    (ag) =>
                        ag?.fim &&
                        !PACIENTES_IGNORADOS_CRITICA.includes(ag.pacienteId)
                )
                .map((ag) => new Date(ag.fim).getTime())

            if (!tempos.length) return min

            const menorDoProf = Math.min(...tempos)
            return min === null || menorDoProf < min ? menorDoProf : min
        }, null)

        let criticaMaisAntiga = '-'
        if (tsMaisAntiga) {
            const horas = horasDesde(agora, tsMaisAntiga)
            if (classificarPendencia(horas) === 'critica') {
                const dias = Math.floor(horas / 24)
                criticaMaisAntiga = `${new Date(tsMaisAntiga).toLocaleDateString('pt-BR')} (${dias} ${dias === 1 ? 'dia' : 'dias'})`
            }
        }

        return {
            totalPendencias,
            profissionaisComPendencias,
            topCritica: topCritica
                ? `${topCritica?.nomeCompleto?.split(' ')[0]}`
                : '-',
            criticaMaisAntiga,
        }
    }, [dadosEnriquecidos])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gray-50">
            <div className="w-full min-h-screen flex flex-col md:gap-8 gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-6 p-2 items-center">
                <div className="bg-white w-full h-full rounded-2xl shadow-xl flex flex-col md:p-8 p-4">
                    <GestaoEvolucaoHeader
                        onBack={() => navigate('/forms-terapeuta/tela-inicial')}
                    />

                    <GestaoEvolucaoMetrics resumo={resumo} />

                    <GestaoEvolucaoAll dados={dadosEnriquecidos} />

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center w-full border-b pt-10 border-gray-100 pb-6 mb-8 gap-4">
                        <div className="flex flex-col items-center lg:items-start gap-1 w-full lg:w-auto">
                            <h1 className="font-extrabold text-2xl sm:text-3xl lg:text-4xl text-gray-800 flex items-center gap-3 animate-fade-in-down">
                                <span className="bg-clip-text text-transparent bg-linear-to-r from-gray-800 to-gray-500">
                                    Pendências por profissonal
                                </span>
                            </h1>
                        </div>
                    </div>

                    {console.log(dadosEnriquecidos)}

                    <SingleSelect
                        options={profissionaisOptions}
                        onChange={setSelectedProfessional}
                        value={selectedProfessional}
                    />

                    <GestaoEvolucaoProfissional dados={dadosEnriquecidos} profissionalSelecionado={selectedProfessional} />
                </div>
            </div>
        </div>
    )
}

export default GestaoEvolucao