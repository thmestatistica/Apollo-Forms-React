import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import LogoApollo from "../../assets/logo_apollo.png";
import { scaleProcessors } from "../../components/escalas/ProcessScales.jsx";

const background = "#f3f3f3";
const idsComEscore = Object.keys(scaleProcessors).map(Number);

const styles = StyleSheet.create({
  page: {
    padding: 24,
    backgroundColor: "#fff",
    fontSize: 10,
    color: "#1e293b",
    fontFamily: "Helvetica",
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
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#000",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 5,
    fontSize: 12,
    color: "#64748b"
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6a1b9a",
    borderBottom: "2 solid #6a1b9a",
    paddingBottom: 5,
    marginBottom: 10,
  },
  table: {
    width: "100%",
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
  },
  th: {
    color: "#fff",
    fontWeight: "700",
    borderColor: background,
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: "#6A1B9A",
    textAlign: "center",
    fontSize: 10,
  },
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  td: {
    borderColor: background,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    fontSize: 9,
  },
  tdCenter: {
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.4,
    fontSize: 8,
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

const LISTA_ID_ECALAS_EXC = [32, 61]
const LISTA_ID_ESCALAS_EXLUIR = [85,86,87,88,89,59]

export default function TabelaScorePDF({ forms = [] }) {
  return (
    <Document title="Relatorio_Escores_Apollo">
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.containerHeader}>
          <Image src={LogoApollo} style={styles.image} />
          <Text style={styles.title}>Relação de Formulários e Escores</Text>
          <Text style={styles.subtitle}>Relatório gerado em: {hoje}</Text>
        </View>

        {/* TABELA */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text>Listagem Geral de Escores</Text>
          </View>

          <View style={styles.table}>
            {/* HEADER DA TABELA */}
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1 }]}>ID_Formulario</Text>
              <Text style={[styles.th, { flex: 3 }]}>Nome Escala</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>Tem Cálculo de Escore?</Text>
            </View>

            {/* BODY DA TABELA */}
            {forms
              .filter((f) => {
                const id = Number(f.formulario_id || f.id);
                return !(LISTA_ID_ESCALAS_EXLUIR.includes(id)) && (
                       f.tipo_formulario === "Escalas/testes" || 
                       f.nome_formulario === "VAS - Escala Visual Analógica de Dor" ||
                       LISTA_ID_ECALAS_EXC.includes(id)
                );
              })
              .sort((a, b) => {
                const idA = a.formulario_id || a.id;
                const idB = b.formulario_id || b.id;
                return Number(idA) - Number(idB);
              })
              .map((form) => {
              const id = form.formulario_id || form.id;
              const temEscore = idsComEscore.includes(Number(id));
              const nome = form.nome_formulario || form.titulo || form.nomeEscala || "Sem Nome";

              return (
                <View key={id} style={styles.row} wrap={false}>
                  <Text style={[styles.td, styles.tdCenter, { flex: 1 }]}>
                    {id}
                  </Text>
                  <Text style={[styles.td, { flex: 3 }]}>
                    {nome}
                  </Text>
                  <View style={[styles.td, { flex: 1.5, justifyContent: "center", alignItems: "center" }]}>
                    <View style={styles.checkbox}>
                      {temEscore && <View style={styles.checkboxChecked} />}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </Page>
    </Document>
  );
}