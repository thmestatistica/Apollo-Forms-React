import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image
} from "@react-pdf/renderer";

import LogoApollo from "./../../assets/logo_apollo.png"
import TabelaPDF from "./TabelaPdf";

const styles = StyleSheet.create({
    page: {
        padding: 32,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: "#333",
        lineHeight: 1.5,
    },
    image: {
        width: "65%"
    },
    header: {
        textAlign: "center",
        alignItems: "center",
        gap: 3,
        paddingBottom: 12,
        marginBottom: 16,
        borderBottom: "1 solid #eee",
        backgroundColor: "#ededed",
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 23,
        fontWeight: "bold",
        marginBottom: 2,
    },
    titleDiv: {
        textAlign: "center",
        alignItems: "center",
        paddingBottom: 12,
        marginBottom: 16,
        paddingHorizontal: 10,
        paddingVertical: 15,
    },
    title: {
        fontSize: 15,
        fontWeight: "bold",
        marginBottom: 2,
    },
    patientInfo: {
        fontSize: 11,
        marginTop: 9,
    },
    perguntaCard: {
        backgroundColor: "#f3f3f3",
        borderRadius: 5,
        padding: 15,
        marginBottom: 7
    },
    pergunta: {
        fontWeight: "bold"
    },
    resposta: {
        marginLeft: 10,
        textAlign: 'justify'
    },
    separator: {
        height: 1,
        width: '100%',
        backgroundColor: '#CED0CE',
        marginVertical: 10
    },
    finalView: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    linkApollo: {
        color: 'purple',
        textDecoration: 'underline',
    }

})

const calcularIdade = (data) => {
    const hoje = new Date();
    const nascimento = new Date(data);
    let idade = hoje.getFullYear() - nascimento.getFullYear();

    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;

    return idade;
};

const hoje = new Date().toLocaleDateString('pt-BR');

const Separador = () => (
    <View style={styles.separator} />
);

export default function RelatorioPacientePDF({
    item,
    formName,
    paciente,
    data
}) {
    const idade = calcularIdade(paciente.dataNascimento)
    const perguntasIgnorar = [
        "Avaliação ou Reavaliação?",
        "Tipo de Atendimento"
    ]

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Image src={LogoApollo} style={styles.image} />
                    <Text style={styles.headerTitle}>
                        Respostas do Formulário
                    </Text>
                    <Text style={styles.patientInfo}>
                        {paciente.nome}, {idade} anos{"\n"}
                        Data: {data}
                    </Text>
                </View>
                <View>
                    <View style={styles.titleDiv}>
                        <Text style={styles.title}>
                            {formName}
                        </Text>
                    </View>
                    {item.respostas.filter(resp => !perguntasIgnorar.includes(resp.pergunta)).map((resp, index) => {
                        const label = resp.resposta
                            ?.match(/label': '([^']*)'/)?.[1] || resp.resposta

                        const ordem = index + 1

                        if( resp.pergunta === "Observações adicionais" || resp.pergunta === "Sugestões para o próximo atendimento" && label === ""){
                            return null
                        }

                        const tipoPergunta = resp.tipo_resposta_esperada || "—";
                        if (tipoPergunta === "MATRIZ") {
                            // Prepara a variável para receber o objeto
                            let dadosTabela = null;

                            // Tenta converter de string para objeto, caso venha como string
                            try {
                                if (typeof resp.resposta === 'string') {
                                    // Se por acaso vier com aspas simples (formato Python, etc), 
                                    // o replace ajuda a evitar erro no JSON.parse
                                    const jsonFormatado = resp.resposta.replace(/'/g, '"');
                                    dadosTabela = JSON.parse(jsonFormatado);
                                } else {
                                    // Se já for um objeto, apenas repassa
                                    dadosTabela = resp.resposta;
                                }
                            } catch (erro) {
                                console.error("Erro ao converter os dados da tabela:", erro);
                                console.log("Dado recebido:", resp.resposta);
                            }

                            return (
                                <View key={index} style={styles.perguntaCard}>
                                    <Text style={[styles.pergunta, { marginBottom: 8 }]}>
                                        {ordem}. {resp.pergunta}
                                    </Text>
                                    
                                    {/* Só renderiza a tabela se o parse deu certo */}
                                    {dadosTabela && dadosTabela.columns ? (
                                        <TabelaPDF tableData={dadosTabela} />
                                    ) : (
                                        <Text style={styles.resposta}>
                                            [Não foi possível carregar os dados desta tabela]
                                        </Text>
                                    )}
                                </View>
                            );
                        }

                        return (
                            <View key={index} style={styles.perguntaCard}>
                                <Text style={styles.pergunta}>
                                    {ordem}. {resp.pergunta}
                                </Text>

                                <Text style={styles.resposta}>
                                    {label}
                                </Text>
                            </View>
                        )

                    })}
                </View>
                <Separador />
                <View style={styles.finalView}>
                    <Text>Relatório gerado em {hoje} • Clínica Apollo • </Text><Text style={styles.linkApollo}>https://apolloreab.com.br/</Text>
                </View>
            </Page>
        </Document>
    )
}