import AgenciasDeTursimoService from '../../services/agencias_turismo.ts';
import { PainelTurismo, type TextosPainel } from '../../components/painel/PainelTurismo.tsx';
import { adaptarServicoLegado } from '../../lib/adaptarServicoLegado.ts';

const servico = adaptarServicoLegado(AgenciasDeTursimoService);

const textos: TextosPainel = {
  titulo: 'Panorama de agências de turismo',
  plural: 'agências de turismo',
  prefixoCache: 'agencias',
};

// Nome exportado original mantido (com o typo) para não quebrar suas rotas.
export function AgenciasDeTursimo() {
  return <PainelTurismo servico={servico} textos={textos} />;
}