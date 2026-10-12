import ParquesTematicosService from '../../services/parques_tematicos.tsx';
import { PainelTurismo, type TextosPainel } from '../../components/painel/PainelTurismo.tsx';
import { adaptarServicoLegado } from '../../lib/adaptarServicoLegado.ts';

const servico = adaptarServicoLegado(ParquesTematicosService);

const textos: TextosPainel = {
  titulo: 'Panorama de parques temáticos',
  plural: 'parques temáticos',
  prefixoCache: 'parques-tematicos',
};

// Os dados desta categoria vão até 2024 (o original usava '2024' fixo).
const ANO_RANKING = 2024;

export function ParquesTematicosTuristicos() {
  return <PainelTurismo servico={servico} textos={textos} anoRanking={ANO_RANKING} />;
}