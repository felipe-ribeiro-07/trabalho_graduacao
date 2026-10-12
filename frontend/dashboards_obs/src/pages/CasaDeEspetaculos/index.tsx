import CasaDeEspetaculosService from '../../services/casa_espetaculos.ts';
import { PainelTurismo, type TextosPainel } from '../../components/painel/PainelTurismo.tsx';
import { adaptarServicoLegado } from '../../lib/adaptarServicoLegado.ts';

const servico = adaptarServicoLegado(CasaDeEspetaculosService);

const textos: TextosPainel = {
  titulo: 'Panorama de casas de espetáculos',
  plural: 'casas de espetáculos',
  prefixoCache: 'casa-espetaculos',
};

// Nome exportado original mantido (com o typo) para não quebrar suas rotas.
export function CasaDeEspetaculosDeTursimo() {
  return <PainelTurismo servico={servico} textos={textos} />;
}