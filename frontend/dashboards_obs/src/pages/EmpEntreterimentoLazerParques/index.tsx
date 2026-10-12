import EmpEntreterimentoLazerParquesService from '../../services/emp_entreterimento_lazer_parques_aquaticos.ts';
import { PainelTurismo, type TextosPainel } from '../../components/painel/PainelTurismo.tsx';
import { adaptarServicoLegado } from '../../lib/adaptarServicoLegado.ts';

const servico = adaptarServicoLegado(EmpEntreterimentoLazerParquesService);

const textos: TextosPainel = {
  titulo: 'Panorama de empreendimentos de lazer e parques',
  plural: 'empreendimentos de lazer e parques',
  prefixoCache: 'emp-lazer-parques',
};

export function EmpEntreLazerParquesTuristicos() {
  return <PainelTurismo servico={servico} textos={textos} />;
}