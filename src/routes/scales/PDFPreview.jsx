import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { carregar_info_form, carregar_perguntas_form } from "../../api/forms/forms_utils";
import CampoDinamico from "../../components/form/CampoDinamico";
import { BlockMath, InlineMath } from 'react-katex';
import { PDFViewer } from "@react-pdf/renderer";
import EscalaPDF from "./EscalaPDF";
import LoadingGen from "../../components/info/LoadingGen";

import { scaleProcessors } from '../../components/escalas/ProcessScales'

const PDFPreview = () => {
    const { id_form } = useParams();
    console.log("PARAM", id_form)
    const [perguntas, setPerguntas] = useState([]);
    const [info, setInfo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resFake, setResFake] = useState([])

    useEffect(() => {
        const carregarPerguntas = async () => {
            try {
                setLoading(true);

                const perg = await carregar_perguntas_form(Number(id_form));
                setPerguntas(perg);

                const inf = await carregar_info_form(Number(id_form));
                setInfo(inf);

                const processor = scaleProcessors[Number(id_form)]
                const resProcessadoFake = processor([1]);
                setResFake(resProcessadoFake);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false)
            }
        };

        carregarPerguntas();
    }, [id_form]);

    if (loading) {
        return <LoadingGen mensagem="Carregando dados" primaryColor={"#fff"} messageColor={"#fff"}/>;
    }

    return (
        <PDFViewer width="100%" height="969">
            <EscalaPDF perguntas={perguntas} info={info} calculoFake={resFake}/>
        </PDFViewer>
    )
}

export default PDFPreview;