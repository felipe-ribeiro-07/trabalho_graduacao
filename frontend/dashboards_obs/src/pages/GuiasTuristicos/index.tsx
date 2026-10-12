import GuiasTuristicosService from '../../services/guias_turisticos.ts';
import { PainelTurismo, type TextosPainel } from '../../components/painel/PainelTurismo.tsx';
import { adaptarServicoLegado } from '../../lib/adaptarServicoLegado.ts';

const servico = adaptarServicoLegado(GuiasTuristicosService);

const textos: TextosPainel = {
  titulo: 'Panorama de guias de turismo',
  plural: 'guias de turismo',
  prefixoCache: 'guias',
};

export function GuiasTuristicos() {
  return <PainelTurismo servico={servico} textos={textos} />;
}