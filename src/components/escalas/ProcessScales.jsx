import { processarGAD7 } from './processors/gad7';/*
import { processarLawtonBrody } from './processors/lawtonBrody';
import { processarMIFMobilidade } from './processors/mif';
import { processarMIFAutocuidados } from './processors/mif';
import { processarMIFControleEsfincteres } from './processors/mif';
import { processarMIFComunicacao } from './processors/mif';
import { processarMIFConhecimentoSocial } from './processors/mif';
import { processarPHQ9 } from './processors/phq9';
import { processarTC10m } from './processors/tc10m';
import { processarTUG } from './processors/tug';
import { processarVAS } from './processors/vas';*/
import { processarMOCA } from './processors/moca.js';

export const scaleProcessors = {
    /**1: processarTUG,
    7: processarVAS,
    23: processarFuglMeyerInferior,
    25: processarTC10m,
    26: processarBerg,
    27: processarBristol,
    28: processarFOIS,*/
    29: processarGAD7,
    /*30: processarLawtonBrody,
    31: processarPHQ9,
    33: processarMIFMobilidade,
    34: processarMIFAutocuidados,
    35: processarMIFControleEsfincteres,
    36: processarMIFComunicacao,
    37: processarMIFConhecimentoSocial,
    38: processarFuglMeyerSuperior,*/
    45: processarMOCA,
};

export const scalesMap = [
    /*{ id: 30, label: "Lawton & Brody" },
    { id: 26, label: "Escala de Berg" },
    { id: 27, label: "Escala Bristol" },
    { id: 28, label: "FOIS" },
    { id: 38, label: "Fugl-Meyer - Superiores" },
    { id: 23, label: "Fugl-Meyer - Inferiores" },*/
    { id: 29, label: "GAD-7" },
    /*{ id: 33, label: "MIF - Mobilidade"},
    { id: 34, label: "MIF – Autocuidados" },
    { id: 35, label: "MIF - Controle de Esfíncter"},
    { id: 36, label: "MIF - Comunicação"},
    { id: 37, label: "MIF - Conhecimento"},
    { id: 31, label: "PHQ-9" },
    { id: 25, label: "TC 10m"}, 
    { id: 1,  label: "TUG"},
    { id: 7,  label: "VAS" },*/
    { id: 45, label: "MOCA"}
];