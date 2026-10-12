import TransportadoraTuristicaService from '../../services/transportadora_turistica.ts';
import { PainelTurismo, type TextosPainel } from '../../components/painel/PainelTurismo.tsx';
import { adaptarServicoLegado } from '../../lib/adaptarServicoLegado.ts';

const servico = adaptarServicoLegado(TransportadoraTuristicaService);

const textos: TextosPainel = {
  titulo: 'Panorama de transportadoras turísticas',
  plural: 'transportadoras turísticas',
  prefixoCache: 'transportadoras',
};

export function TranspTurisTuristicos() {
  return <PainelTurismo servico={servico} textos={textos} />;
}