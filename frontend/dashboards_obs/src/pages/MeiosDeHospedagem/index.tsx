import MeiosDeHospedagemService from '../../services/meios_hospedagem.ts';
import { PainelTurismo, type TextosPainel } from '../../components/painel/PainelTurismo.tsx';
import { adaptarServicoLegado } from '../../lib/adaptarServicoLegado.ts';

const servico = adaptarServicoLegado(MeiosDeHospedagemService);

const textos: TextosPainel = {
  titulo: 'Panorama de meios de hospedagem',
  plural: 'meios de hospedagem',
  prefixoCache: 'hospedagem',
};

export function MeiosDeHospedagemTuristicos() {
  return <PainelTurismo servico={servico} textos={textos} />;
}