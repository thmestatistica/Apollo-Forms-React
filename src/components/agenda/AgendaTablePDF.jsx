import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { formatarData } from "../../utils/format/formatar_utils.js";
import logoApollo from "../../assets/logo.png";

const styles = StyleSheet.create({
    table: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        borderWidth: 1,
        borderColor: "#cbd5e1", // gray-300
        borderRadius: 6,
        overflow: 'hidden', 
        backgroundColor: "#fff",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0", // gray-200
        minHeight: 45,
    },
    tableRowLast: {
        flexDirection: "row", 
        minHeight: 45,
    },
    tableHeader: {
        backgroundColor: "#5A2779", // bg-apollo-200
        borderBottomColor: "#cbd5e1",
        minHeight: 30,
    },
    colHour: {
        width: 65,
        borderRightWidth: 1,
        borderRightColor: "#cbd5e1",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8fafc", // gray-50
    },
    colDay: {
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: "#e2e8f0",
        padding: 4,
        justifyContent: "flex-start",
    },
    colDayLast: {
        flex: 1,
        padding: 4,
        justifyContent: "flex-start",
    },
    tableCellHeader: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#FFFFFF", 
        textAlign: "center",
    },
    tableCellHourText: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#64748b",
    },
    cardWrapper: {
        borderRadius: 3,
        padding: 3,
        marginBottom: 3,
        borderLeftWidth: 2,
    },
    cardText: {
        fontSize: 8,
        color: "#1e293b",
        lineHeight: 1.2,
    },
       header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 5,
        paddingBottom: 2,
        borderBottomWidth: 2,
        borderBottomColor: "#5A2779",
    },

    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },

    logo: {
        width: 45,
        height: 45,
        marginRight: 14,
    },

    titleContainer: {
        flexDirection: "column",
    },

    subtitle: {
        fontSize: 10,
        color: "#64748B",
        marginBottom: 2,
    },

    title: {
        fontSize: 20,
        color: "#5A2779",
        fontFamily: "Helvetica-Bold",
    },

    dateContainer: {
        alignItems: "flex-end",
    },

    dateLabel: {
        fontSize: 9,
        color: "#64748B",
    },

    date: {
        fontSize: 11,
        color: "#334155",
        fontFamily: "Helvetica-Bold",
    },
});

export default function AgendaTablePDF({ pacienteAgenda, displayedDays, timeSlots, agByDateAndHour, getAgendamentoText }) {
    
    const renderCardText = (agendamento) => {
        if (getAgendamentoText) return getAgendamentoText(agendamento);
        return agendamento.paciente?.nome || agendamento.titulo || agendamento.nome || "Compromisso";
    };

    const renderTitulo = () => {
        if (pacienteAgenda) {
            // Pega o nome do paciente do primeiro agendamento, se disponível
            const primeiroAgendamento =
                Object.values(agByDateAndHour)
                    .flatMap((dia) => Object.values(dia))
                    .flat()
                    .at(0);

            const nomePaciente =
                primeiroAgendamento?.paciente?.nome ?? "Paciente";

            return `Agenda do ${nomePaciente}`;
        } else {
            return "Agenda Semanal do Terapeuta";
        }
    }

    return (
        <View style={{ width: "100%" }}>

        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <Image
                    src={logoApollo}
                    style={styles.logo}
                />

                <View style={styles.titleContainer}>
                    <Text style={styles.title}>
                        {renderTitulo()}
                    </Text>
                </View>
            </View>

            <View style={styles.dateContainer}>
                <Text style={styles.dateLabel}>
                    Gerado em
                </Text>

                <Text style={styles.date}>
                    {new Date().toLocaleDateString("pt-BR")}
                </Text>
            </View>
        </View>

            <View style={styles.table}>
                
                {/* LINHA DE CABEÇALHO */}
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <View style={styles.colHour}>
                        <Text style={styles.tableCellHeader}>Hora</Text>
                    </View>
                    
                    {displayedDays.map((d, idx) => {
                        const isLastCol = idx === displayedDays.length - 1;
                        return (
                            <View 
                                key={`header-${idx}`} 
                                style={isLastCol ? styles.colDayLast : styles.colDay}
                            >
                                <Text style={styles.tableCellHeader}>
                                    {formatarData(d.toISOString())}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* LINHAS DE HORÁRIO */}
                {timeSlots.map((h, rowIndex) => {
                    const isLastRow = rowIndex === timeSlots.length - 1;
                    
                    return (
                        <View key={`row-${h}`} style={isLastRow ? styles.tableRowLast : styles.tableRow}>
                            
                            {/* Coluna fixa de Hora */}
                            <View style={styles.colHour}>
                                <Text style={styles.tableCellHourText}>
                                    {String(h).padStart(2, '0')}:00
                                </Text>
                            </View>

                            {/* Colunas dinâmicas dos Dias */}
                            {displayedDays.map((d, colIndex) => {
                                const isLastCol = colIndex === displayedDays.length - 1;
                                const key = d.toISOString().split("T")[0];
                                const matches = agByDateAndHour[key]?.[h] || [];

                                return (
                                    <View 
                                        key={`cell-${key}-${h}-${colIndex}`} 
                                        style={isLastCol ? styles.colDayLast : styles.colDay}
                                    >
                                        {matches.length > 0 && matches.map((ag, agIdx) => {
                                            const corPaciente = ag.paciente?.cor || ag.cor || "#3b82f6";
                                            const backgroundColorClaro = (corPaciente.startsWith('#') && corPaciente.length === 7)
                                                ? `${corPaciente}15`
                                                : "#eff6ff";

                                            return (
                                                <View 
                                                    key={`card-${agIdx}`} 
                                                    style={[
                                                        styles.cardWrapper, 
                                                        { 
                                                            borderLeftColor: corPaciente, 
                                                            backgroundColor: backgroundColorClaro 
                                                        }
                                                    ]}
                                                >
                                                    <Text style={styles.cardText}>
                                                        {renderCardText(ag)}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                );
                            })}

                        </View>
                    );
                })}
            </View>
        </View>
    );
}