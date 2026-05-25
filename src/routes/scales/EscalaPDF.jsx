import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

import LogoApollo from "../../assets/logo_apollo.png"

const background = "#f3f3f3"

const styles = StyleSheet.create({
  page: {
    padding: 24,
    backgroundColor: "#fff",
    fontSize: 10,
    color: "#1e293b",
    fontFamily: "Helvetica",
  },

  container: {
    backgroundColor: background,
    marginBottom: 10,
    borderRadius: 5,
    padding: 15,
    borderLeft: "4 solid #6A1B9A",
  },

  containerHeader: {
    marginBottom: 10,
    borderRadius: 5,
    padding: 24,
    paddingVertical: 20,
    width: "100%",
    alignItems: 'center'
  },

  image: {
    width: "65%",
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#000",
  },

  subtitleH2: {
    textAlign: "center",
    marginTop: 3,
    fontSize: 15,
    fontWeight: "bold"
  },

  subtitle: {
    textAlign: "center",
    marginTop: 3,
  },

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#c4b5fd",
    borderBottomStyle: "dashed",
    marginVertical: 16,
  },

  section: {
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },

  sectionNumber: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 16,
    fontWeight: "bold",
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6a1b9a",
    borderBottom: "2 solid #6a1b9a",
    paddingBottom: 5,
    marginBottom: 10,
  },

  flexText: {
    marginBottom: 10,
    flexDirection: "column"
  },

  flexTextLast: {
    flexDirection: "column"
  },

  textBlack: {
    marginBottom: 3,
    fontWeight: "bold",
    fontSize: 12
  },

  text: {
    marginLeft: 10,
  },

  box: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 7,
  },

  table: {
    width: "100%",
  },

  tableHeader: {
    flexDirection: "row",
  },

  th: {
    flex: 1,
    color: "#fff",
    fontWeight: "700",
    borderColor: background,
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: "#6A1B9A",
  },

  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
  },

  td: {
    flex: 1,
    borderColor: background,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },

  badge: {
    backgroundColor: "#c883f2",
    textAlign: "center",
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 8,
  },

  optionBadge: {
    backgroundColor: "#fff",
    width: "100%",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 4,
    marginBottom: 4,
    fontSize: 8,
  },

  optionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  formulaBox: {
    backgroundColor: "#e2e8f0",
    padding: 14,
    borderRadius: 8,
    marginVertical: 10,
  },

  formula: {
    color: "#000",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "bold",
  },

  exampleText: {
    marginBottom: 6,
  },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.4
  },

  link: {
    color: 'black',
    textDecoration: 'underline',
  },

  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxChecked: {
    width: 6,
    height: 6,
    backgroundColor: "#000",
  },
});

const hoje = new Date().toLocaleDateString("pt-BR");

const labels = {
  nome_formulario: "Nome do formulário",
  descricao_formulario: "Descrição",
  tipo_formulario: "Tipo",
  formulario_id: "ID do formulário",
  data_criacao: "Data de criação"
}

export default function EscalaPDF({ perguntas = [], info = [], calculoFake = [] }) {
  const dataCriacao = new Date(info.data_criacao);
  const dataFormatada = dataCriacao.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const qtdePerguntas = perguntas.length - 1;

  const respostasTipo = ["TEXTO_LIVRE", "DATA", "TEXTO_TOPICO", "CONDICIONAL"];

  return (
    <Document title={`${calculoFake.nome_curto}_Ref`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.containerHeader}>
          <Image src={LogoApollo} style={styles.image} />
          <Text style={styles.title}>
            {info.nome_formulario}
          </Text>
          <Text style={styles.subtitleH2}>
            Memória de Cálculo{"\n"}
          </Text>
          <Text style={styles.subtitle}>
            Data: {hoje}
          </Text>
        </View>
        <View style={styles.container}>
          {/* PERGUNTAS */}

          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>1. Visão geral do formulário</Text>
            </View>
            {Object.entries(info).map(([key, value], index) => (
              <View key={index}>
                {key === "pagina_streamlit" || key === "o_que_significa" || key === "data_criacao" ? null : (
                  <View style={styles.flexText}>
                    <Text style={styles.textBlack}>• {labels[key] || key}:</Text>
                    <Text style={styles.text}> {value}</Text>
                  </View>
                )}
              </View>
            ))}
            <View style={styles.flexText}>
              <Text style={styles.textBlack}>• Quantidade de perguntas:</Text>
              <Text style={styles.text}> {qtdePerguntas + 1}</Text>
            </View>
            <View style={styles.flexText}>
              <Text style={styles.textBlack}>• Data de criação:</Text>
              <Text style={styles.text}> {dataFormatada}</Text>
            </View>
            <View style={styles.flexTextLast}>
              <Text style={styles.textBlack}>• Doi:</Text>
              <Text style={styles.text}> {calculoFake.doi}</Text>
            </View>
          </View>
        </View>

        <View break={true} style={styles.container}>
          {/* PERGUNTAS */}

          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>2. O Formulário</Text>
            </View>

            <View style={styles.box}>
              <View style={styles.table}>
                {/* HEADER */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { flex: 0.7 }]}>Ordem</Text>
                  <Text style={styles.th}>ID</Text>
                  <Text style={[styles.th, { flex: 2 }]}>Texto</Text>
                  <Text style={[styles.th, { flex: 1.5 }]}>Tipo</Text>
                  <Text style={[styles.th, { flex: 2 }]}>Opções</Text>
                  <Text style={[styles.th, { flex: 0.7 }]}>Usado no escore</Text>
                </View>

                {/* BODY */}
                {perguntas.map((campo, index) => (
                  <View key={campo.pergunta_id} wrap={false} style={[styles.row]}>
                    <Text style={[styles.td, { flex: 0.7, textAlign: "center" }]}>
                      {campo.ordem_pergunta}
                    </Text>

                    <Text style={[styles.td, { textAlign: "center" }]}>
                      {campo.pergunta_id}
                    </Text>

                    <Text style={[styles.td, { flex: 2 }]}>
                      {campo.texto_pergunta}
                    </Text>

                    <View style={[styles.td, { flex: 1.5 }]}>
                      <Text style={styles.badge}>
                        {campo.tipo_resposta_esperada}
                      </Text>
                    </View>

                    <View style={[styles.td, { flex: 2 }]}>
                      <View style={styles.optionContainer}>
                        {campo.opcoes_resposta?.length > 0 ? (
                          campo.opcoes_resposta.map((opcao, idx) => (
                            <Text key={idx} style={styles.optionBadge}>
                              {typeof opcao === "string" ? opcao : opcao.label}
                            </Text>
                          ))
                        ) : (
                          <Text>Sem opções</Text>
                        )}
                      </View>
                    </View>

                    <View style={[styles.td, { flex: 0.7, alignItems: "center", justifyContent: "center" }]}>
                      <View style={styles.checkbox}>
                        {
                          !respostasTipo.includes(campo.tipo_resposta_esperada) &&
                          (
                            campo.tipo_resposta_esperada !== "SELECAO_UNICA" &&
                              campo.tipo_resposta_esperada !== "SELECAO_MULTIPLA"
                              ? <View style={styles.checkboxChecked} />
                              : campo.opcoes_resposta?.some(opcao => {
                                const texto =
                                  typeof opcao === "string"
                                    ? opcao
                                    : opcao?.label || "";

                                return (
                                  /^(\d+)/.test(texto) || /^nível\s*\d+/i.test(texto) || /^tipo\s*\d+/i.test(texto)// Pega se a resposta tem tipo "Nivel X - ou 1 - Resposta"
                                );
                              })
                                ? <View style={styles.checkboxChecked} />
                                : null
                          )
                        }
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* CÁLCULO */}
        </View>
        <View break={true} style={styles.container}>
          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>3. O equacionamento</Text>
            </View>

            <View style={styles.box}>
              <Text>
                Atualmente para a escala {calculoFake.nome_curto} o cálculo do escore bruto é:
              </Text>

              <View style={styles.formulaBox}>
                <Text style={styles.formula}>
                  {calculoFake.calculo}
                </Text>
              </View>

              <Text>
                Depois é realizado o cálculo para o radar:
              </Text>

              <View style={styles.formulaBox}>
                <Text style={styles.formula}>
                  {calculoFake.calculo_processado}
                </Text>
              </View>
            </View>

            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>3-1. Interpretação</Text>
            </View>

            <View style={styles.box}></View>
            <View>
              <Text style={styles.text}>
                {calculoFake.interpretacao}
              </Text>
            </View>
          </View>
        </View>

        {/* INTERPRETAÇÃO */}
        {/*<View style={styles.container}>

          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>4. Interpretação</Text>
            </View>

            <View style={styles.box}>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.th}>Classificação</Text>
                  <Text style={styles.th}>Pontuação</Text>
                </View>

                {[
                  ["Mínima", "0 - 4"],
                  ["Leve", "5 - 9"],
                  ["Moderada", "10 - 14"],
                  ["Grave", "15 - 21"],
                ].map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.row,
                      {
                        backgroundColor:
                          index % 2 === 0 ? "#e2e8f0" : "#cbd5e1",
                      },
                    ]}
                  >
                    <Text style={styles.td}>{item[0]}</Text>
                    <Text style={styles.td}>{item[1]}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>*/}

        <View style={styles.footer} fixed>
          <Text>• Desenvolvido por THM Estatística | </Text><Text style={styles.link}>https://thmestatistica.com </Text><Text>•</Text>
        </View>
      </Page>
    </Document>
  );
}