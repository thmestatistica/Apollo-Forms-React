import { processarGAD7 } from './processors/gad7';/*
import { processarLawtonBrody } from './processors/lawtonBrody';*/
import { processarFuglMeyerSuperior, processarFuglMeyerInferior } from './processors/fuglMeyer.js';
import { processarMIFMobilidade, processarMIFAutocuidados, processarMIFControleEsfincteres, processarMIFComunicacao, processarMIFConhecimentoSocial } from './processors/mif';
import { processarPHQ9 } from './processors/phq9';
import { processarTC10m } from './processors/tc10m';
import { processarTUG } from './processors/tug';
import { processarVAS } from './processors/vas';
import { processarMOCA } from './processors/moca.js';
import { processarEDT } from './processors/edt.js';
import { processarBerg } from './processors/berg.js';
import { processarBristol } from './processors/bristol.js';
import { processarFOIS } from './processors/fois.js'
import { processarADDENBROK } from './processors/addenbrock.js';
import { processarFAC } from './processors/fac.js';
import { processarGRBASI } from './processors/grbasi.js';
import { processarSUNNYBROOK } from './processors/sunnybrook.js'
import { processarTOScales } from './processors/toscales.js'
import { processarGAS } from './processors/gas.js'
import { processarIPAQ } from './processors/ipaq.js';
import { processarSARA } from './processors/sara.js';
import { processarWISCI } from './processors/wisci.js';
import { processarFMS } from './processors/fms.js';
import { processarGMFM } from './processors/gmfm.js';
import { processarParkinsonUPDRS } from './processors/parkinsonUpdrs.js';
import { processarApraxia } from './processors/apraxia.js';

export const scaleProcessors = {
    1: processarTUG,
    7: processarVAS,
    23: processarFuglMeyerInferior,
    25: processarTC10m,
    26: processarBerg,
    27: processarBristol,
    28: processarFOIS,
    29: processarGAD7,
    //30: processarLawtonBrody,
    31: processarPHQ9,
    32: processarTOScales,
    61: processarTOScales,
    33: processarMIFMobilidade,
    34: processarMIFAutocuidados,
    35: processarMIFControleEsfincteres,
    36: processarMIFComunicacao,
    37: processarMIFConhecimentoSocial,
    38: processarFuglMeyerSuperior,
    45: processarMOCA,
    41: processarGAS,
    53: processarFAC,
    56: processarSUNNYBROOK,
    62: processarADDENBROK,
    65: processarEDT,
    68: processarGRBASI,
    69: processarSARA,
    50: processarIPAQ,
    51: processarWISCI,
    66: processarFMS,
    67: processarGMFM,
    54: processarParkinsonUPDRS,
    55: processarApraxia,
};