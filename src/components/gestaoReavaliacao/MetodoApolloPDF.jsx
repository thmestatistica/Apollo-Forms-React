import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import LogoApollo from "../../assets/logo_apollo.png";

const background = "#f3f3f3";

const styles = StyleSheet.create({
    page: { padding: 24, paddingBottom: 50, backgroundColor: "#fff", fontSize: 10, color: "#1e293b", fontFamily: "Helvetica" },

    containerHeader: { marginBottom: 10, padding: 24, paddingVertical: 20, width: "100%", alignItems: "center" },
    image: { width: "65%", marginBottom: 10 },
    title: { fontSize: 28, fontWeight: "bold", textAlign: "center", color: "#000" },
    subtitleH2: { textAlign: "center", marginTop: 3, fontSize: 15, fontWeight: "bold" },
    subtitle: { textAlign: "center", marginTop: 3 },

    container: { backgroundColor: background, marginBottom: 10, borderRadius: 5, padding: 15, borderLeft: "4 solid #6A1B9A" },
    section: { marginBottom: 10 },
    sectionTitle: { borderBottom: "2 solid #6a1b9a", paddingBottom: 5, marginBottom: 10 },
    sectionTitleText: { fontSize: 14, fontWeight: "bold", color: "#6a1b9a" },

    flexText: { marginBottom: 10, flexDirection: "column" },
    textBlack: { marginBottom: 3, fontWeight: "bold", fontSize: 12 },
    text: { marginLeft: 10 },

    box: { backgroundColor: "#f1f5f9", borderRadius: 12, padding: 7 },

    tableHeader: { flexDirection: "row" },
    th: { flex: 1, color: "#fff", fontWeight: "700", paddingVertical: 8, paddingHorizontal: 6, backgroundColor: "#6A1B9A", fontSize: 9 },
    row: { flexDirection: "row", backgroundColor: "#fff" },
    td: { flex: 1, borderColor: background, borderLeftWidth: 0.5, borderRightWidth: 0.5, borderTopWidth: 1, paddingVertical: 8, paddingHorizontal: 6, fontSize: 9 },

    badge: { textAlign: "center", borderRadius: 2, paddingHorizontal: 6, paddingVertical: 2, fontSize: 8, fontWeight: "bold" },
    badgeCompleta: { backgroundColor: "#d1fae5", color: "#047857" },
    badgeIncompleta: { backgroundColor: "#ffe4e6", color: "#be123c" },

    tag: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginBottom: 4, fontSize: 8 },
    tagContainer: { flexDirection: "row", flexWrap: "wrap" },

    diagText: { fontWeight: "bold", color: "#6A1B9A" },
    countText: { marginTop: 3, fontSize: 8, color: "#64748b" },

    footer: { position: "absolute", bottom: 20, left: 0, right: 0, flexDirection: "row", justifyContent: "center", alignItems: "center", opacity: 0.4 },
    link: { color: "black", textDecoration: "underline" },
});

const Tags = ({ itens }) =>
    itens.length > 0 ? (
        <View style={styles.tagContainer}>
            {itens.map((item, idx) => (
                <Text key={idx} style={styles.tag}>{item}</Text>
            ))}
        </View>
    ) : (
        <Text>-</Text>
    );

const ordenar = (arr) => [...arr].sort((a, b) => a.localeCompare(b, "pt-BR"));
const pluralFormulario = (n) => `${n} ${n === 1 ? "formulário" : "formulários"}`;

function agruparPorDiagnostico(linhas) {
    const mapa = new Map();

    linhas.forEach((l) => {
        (l.diagnosticos || []).forEach((diag) => {
            if (!mapa.has(diag)) mapa.set(diag, new Set());
            mapa.get(diag).add(l.formulario);
        });
    });

    const grupos = ordenar(Array.from(mapa.keys())).map((diagnostico) => ({
        diagnostico,
        formularios: ordenar(Array.from(mapa.get(diagnostico))),
    }));

    const semDiagnostico = ordenar(
        linhas.filter((l) => !l.diagnosticos || l.diagnosticos.length === 0).map((l) => l.formulario)
    );

    return { grupos, semDiagnostico };
}

const VisaoGeralFormulario = ({ resumo }) => (
    <>
        <View style={styles.flexText}>
            <Text style={styles.textBlack}>• Formulários ativos:</Text>
            <Text style={styles.text}>{resumo.total}</Text>
        </View>
        <View style={styles.flexText}>
            <Text style={styles.textBlack}>• Associações completas:</Text>
            <Text style={styles.text}>{resumo.completas}</Text>
        </View>
        <View>
            <Text style={styles.textBlack}>• Não associadas (sem especialidade ou diagnóstico):</Text>
            <Text style={styles.text}>{resumo.incompletas}</Text>
        </View>
    </>
);

const VisaoGeralDiagnostico = ({ resumo, agrupado }) => (
    <>
        <View style={styles.flexText}>
            <Text style={styles.textBlack}>• Formulários ativos:</Text>
            <Text style={styles.text}>{resumo.total}</Text>
        </View>
        <View style={styles.flexText}>
            <Text style={styles.textBlack}>• Diagnósticos macro com formulários:</Text>
            <Text style={styles.text}>{agrupado.grupos.length}</Text>
        </View>
        <View>
            <Text style={styles.textBlack}>• Formulários sem diagnóstico associado:</Text>
            <Text style={styles.text}>{agrupado.semDiagnostico.length}</Text>
        </View>
    </>
);

const TabelaPorFormulario = ({ linhas }) => (
    <View style={styles.box}>
        <View style={styles.tableHeader} fixed>
            <Text style={[styles.th, { flex: 2 }]}>Formulário</Text>
            <Text style={[styles.th, { flex: 1.2 }]}>Tipo</Text>
            <Text style={[styles.th, { flex: 1.1 }]}>Associação</Text>
            <Text style={[styles.th, { flex: 2 }]}>Especialidades</Text>
            <Text style={[styles.th, { flex: 2 }]}>Diagnósticos</Text>
        </View>

        {linhas.length === 0 ? (
            <View style={styles.row}>
                <Text style={[styles.td, { textAlign: "center" }]}>Nenhum formulário ativo.</Text>
            </View>
        ) : (
            linhas.map((l, idx) => (
                <View key={idx} wrap={false} style={styles.row}>
                    <Text style={[styles.td, { flex: 2 }]}>{l.formulario}</Text>
                    <Text style={[styles.td, { flex: 1.2 }]}>{l.tipo}</Text>
                    <View style={[styles.td, { flex: 1.1 }]}>
                        <Text style={[styles.badge, l.associacao === "Completa" ? styles.badgeCompleta : styles.badgeIncompleta]}>
                            {l.associacao}
                        </Text>
                    </View>
                    <View style={[styles.td, { flex: 2 }]}>
                        <Tags itens={l.especialidades} />
                    </View>
                    <View style={[styles.td, { flex: 2 }]}>
                        <Tags itens={l.diagnosticos} />
                    </View>
                </View>
            ))
        )}
    </View>
);

const TabelaPorDiagnostico = ({ agrupado }) => {
    const { grupos, semDiagnostico } = agrupado;

    return (
        <View style={styles.box}>
            <View style={styles.tableHeader} fixed>
                <Text style={[styles.th, { flex: 2 }]}>Diagnóstico macro</Text>
                <Text style={[styles.th, { flex: 5 }]}>Formulários</Text>
            </View>

            {grupos.length === 0 && semDiagnostico.length === 0 ? (
                <View style={styles.row}>
                    <Text style={[styles.td, { textAlign: "center" }]}>Nenhum diagnóstico associado.</Text>
                </View>
            ) : (
                grupos.map((g, idx) => (
                    <View key={idx} wrap={false} style={styles.row}>
                        <View style={[styles.td, { flex: 2 }]}>
                            <Text style={styles.diagText}>{g.diagnostico}</Text>
                            <Text style={styles.countText}>{pluralFormulario(g.formularios.length)}</Text>
                        </View>
                        <View style={[styles.td, { flex: 5 }]}>
                            <Tags itens={g.formularios} />
                        </View>
                    </View>
                ))
            )}

            {semDiagnostico.length > 0 && (
                <View wrap={false} style={styles.row}>
                    <View style={[styles.td, { flex: 2 }]}>
                        <Text style={styles.diagText}>Sem diagnóstico</Text>
                        <Text style={styles.countText}>{pluralFormulario(semDiagnostico.length)}</Text>
                    </View>
                    <View style={[styles.td, { flex: 5 }]}>
                        <Tags itens={semDiagnostico} />
                    </View>
                </View>
            )}
        </View>
    );
};

export default function MetodoApolloPDF({
    linhas = [],
    resumo = { total: 0, completas: 0, incompletas: 0 },
    modo = "formulario",
}) {
    const hoje = new Date().toLocaleDateString("pt-BR");
    const porDiagnostico = modo === "diagnostico";
    const agrupado = porDiagnostico ? agruparPorDiagnostico(linhas) : null;

    return (
        <Document title={porDiagnostico ? "Metodo_Apollo_Diagnosticos_Macro" : "Metodo_Apollo_Associacoes"}>
            <Page size="A4" style={styles.page}>
                <View style={styles.containerHeader}>
                    <Image src={LogoApollo} style={styles.image} />
                    <Text style={styles.title}>Método Apollo</Text>
                    <Text style={styles.subtitleH2}>
                        {porDiagnostico ? "Formulários por Diagnóstico Macro" : "Associação de Formulários"}{"\n"}
                    </Text>
                    <Text style={styles.subtitle}>Data: {hoje}</Text>
                </View>

                <View style={styles.container}>
                    <View style={styles.section}>
                        <View style={styles.sectionTitle}>
                            <Text style={styles.sectionTitleText}>1. Visão geral</Text>
                        </View>
                        {porDiagnostico ? (
                            <VisaoGeralDiagnostico resumo={resumo} agrupado={agrupado} />
                        ) : (
                            <VisaoGeralFormulario resumo={resumo} />
                        )}
                    </View>
                </View>

                <View break style={styles.container}>
                    <View style={styles.section}>
                        <View style={styles.sectionTitle}>
                            <Text style={styles.sectionTitleText}>
                                {porDiagnostico ? "2. Diagnósticos e formulários" : "2. Formulários e associações"}
                            </Text>
                        </View>
                        {porDiagnostico ? (
                            <TabelaPorDiagnostico agrupado={agrupado} />
                        ) : (
                            <TabelaPorFormulario linhas={linhas} />
                        )}
                    </View>
                </View>

                <View style={styles.footer} fixed>
                    <Text>• Desenvolvido por THM Estatística | </Text>
                    <Text style={styles.link}>https://thmestatistica.com </Text>
                    <Text>•</Text>
                </View>
            </Page>
        </Document>
    );
}