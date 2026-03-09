import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    table: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        borderWidth: 1,
        borderColor: "#490d5c",
        borderRadius: 5,
        overflow: 'hidden', 
        marginBottom: 10,
        backgroundColor: "#fff",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#490d5c",
    },
    tableRowLast: {
        flexDirection: "row", 
    },
    tableHeader: {
        backgroundColor: "#490d5c", 
    },
    tableCol: {
        borderRightWidth: 1,
        borderRightColor: "#490d5c",
        paddingVertical: 8,
        paddingHorizontal: 5,
        justifyContent: "center",
        alignItems: "center",
    },
    tableColLast: {
        paddingVertical: 8,
        paddingHorizontal: 5,
        justifyContent: "center",
        alignItems: "center", 
    },
    tableCellHeader: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "center",
    },
    tableCellText: {
        fontSize: 10,
        color: "#000",
        textAlign: "center",
    },
    firstColText: {
        fontWeight: "bold", 
        textAlign: "left",
    }
});

export default function TabelaPDF({ tableData }) {
    if (!tableData || !tableData.columns || !tableData.data) return null;

    const { columns, data } = tableData;
    
    // Calcula a largura proporcional para cada coluna
    const colWidth = `${100 / columns.length}%`;

    return (
        <View style={styles.table}>
            {/* Linha de Cabeçalho */}
            <View style={[styles.tableRow, styles.tableHeader]}>
                {columns.map((col, index) => {
                    const isLastCol = index === columns.length - 1;
                    return (
                        <View key={`header-${index}`} style={[isLastCol ? styles.tableColLast : styles.tableCol, { width: colWidth }]}>
                            <Text style={styles.tableCellHeader}>{col}</Text>
                        </View>
                    );
                })}
            </View>

            {/* Linhas de Dados */}
            {data.map((row, rowIndex) => {
                const isLastRow = rowIndex === data.length - 1;
                
                return (
                    <View key={`row-${rowIndex}`} style={isLastRow ? styles.tableRowLast : styles.tableRow}>
                        {columns.map((col, colIndex) => {
                            const isLastCol = colIndex === columns.length - 1;
                            const isFirstCol = colIndex === 0;

                            return (
                                <View 
                                    key={`cell-${rowIndex}-${colIndex}`} 
                                    style={[
                                        isLastCol ? styles.tableColLast : styles.tableCol, 
                                        { width: colWidth },
                                        isFirstCol && { alignItems: "flex-start", paddingLeft: 8 } // Alinha a primeira coluna à esquerda
                                    ]}
                                >
                                    <Text style={[styles.tableCellText, isFirstCol && styles.firstColText]}>
                                        {row[col] !== undefined && row[col] !== null ? row[col] : "—"}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                );
            })}
        </View>
    );
}