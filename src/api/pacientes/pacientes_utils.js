import axiosInstance from '../axiosInstance';

export const atualizar_diagnostico_paciente = async (pacienteId, diagnosticoMacro) => {
  if (!pacienteId) throw new Error('ID do paciente nao informado');

  const diagnosticoList = Array.isArray(diagnosticoMacro) ? diagnosticoMacro : [diagnosticoMacro];

  const payload = {
    diagnosticoMacro: diagnosticoList
  };

  const { data } = await axiosInstance.put(`/pacientes/${Number(pacienteId)}`, payload);
  return data;
};
