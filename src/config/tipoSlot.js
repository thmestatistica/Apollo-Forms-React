export const tipoForms = {
    "Evoluções": {
        13: ['Tab1', 'Tab2'],
        14: ['TO1', 'TO2'],
        15: ['PSI'],
        40: ['NUT'],
        46: ['CML'],
        3: ['FONO1', 'FONO2'],
    },

    "Avaliações": {
        17: ['ENF'],
        18: ['Tab1', 'Tab2'],
        19: ['LKM'],
        20: ['FONO1', 'FONO2'],
        32: ['TO1', 'TO2'],
        39: ['NUT'],
        44: ['PSI'],
        47: ['CML'],

    }
};

export const getFormulariosPorSlot = (slot) => {
    const formularios = [];

    for (const tipo in tipoForms) {
        const formulariosDoTipo = tipoForms[tipo];
        for (const id in formulariosDoTipo) {
            if (formulariosDoTipo[id].includes(slot)) {
                formularios.push({
                    tipo: tipo.slice(0, -2), // Remove 'es' ou 'as' de 'Evoluções'/'Avaliações'
                    id: parseInt(id),
                    titulo: `${tipo.slice(0, -2)} ${slot}`
                });
            }
        }
    }

    return formularios;
};
