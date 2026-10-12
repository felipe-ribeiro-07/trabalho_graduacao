import AcampamentosTuristicosServices from '../../services/acampamentos_turisticos.tsx';
import { PainelTurismo, type TextosPainel } from '../../components/painel/PainelTurismo.tsx';
import { adaptarServicoLegado } from '../../lib/adaptarServicoLegado.ts';

const servico = adaptarServicoLegado(AcampamentosTuristicosServices);

const textos: TextosPainel = {
  titulo: 'Panorama de acampamentos turísticos',
  plural: 'acampamentos turísticos',
  prefixoCache: 'acampamentos',
};

export function EvolucaoAnualAcampamentos() {
  return <PainelTurismo servico={servico} textos={textos} />;
}