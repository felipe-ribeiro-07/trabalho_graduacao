import LocadoraDeVeiculosService from '../../services/locadora_de_veiculos.ts';
import { PainelTurismo, type TextosPainel } from '../../components/painel/PainelTurismo.tsx';
import { adaptarServicoLegado } from '../../lib/adaptarServicoLegado.ts';

const servico = adaptarServicoLegado(LocadoraDeVeiculosService);

const textos: TextosPainel = {
  titulo: 'Panorama de locadoras de veículos',
  plural: 'locadoras de veículos',
  prefixoCache: 'locadoras',
};

export function LocadoraDeVeiculos() {
  return <PainelTurismo servico={servico} textos={textos} />;
}