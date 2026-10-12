import EmpApoioNauticoOUPescaService from '../../services/emp_apoio_nautico_pesca.ts';
import { PainelTurismo, type TextosPainel } from '../../components/painel/PainelTurismo.tsx';
import { adaptarServicoLegado } from '../../lib/adaptarServicoLegado.ts';

const servico = adaptarServicoLegado(EmpApoioNauticoOUPescaService);

const textos: TextosPainel = {
  titulo: 'Panorama de empreendimentos de apoio ao turismo náutico ou de pesca',
  plural: 'empreendimentos de apoio náutico ou de pesca',
  prefixoCache: 'emp-nautico-pesca',
};

export function EmpNauticoPescaTuristicos() {
  return <PainelTurismo servico={servico} textos={textos} />;
}