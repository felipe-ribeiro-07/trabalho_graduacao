import CentroDeConcoesService from '../../services/centro_convencoes.tsx';
import { PainelTurismo, type TextosPainel } from '../../components/painel/PainelTurismo.tsx';
import { adaptarServicoLegado } from '../../lib/adaptarServicoLegado.ts';

const servico = adaptarServicoLegado(CentroDeConcoesService);

const textos: TextosPainel = {
  titulo: 'Panorama de centros de convenções',
  plural: 'centros de convenções',
  prefixoCache: 'centro-convencoes',
};

// Nome exportado original mantido (com o typo) para não quebrar suas rotas.
export function CentroDeConvencoesDeTursimo() {
  return <PainelTurismo servico={servico} textos={textos} />;
}