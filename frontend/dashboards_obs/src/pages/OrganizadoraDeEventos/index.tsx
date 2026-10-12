import OrganizadoraDeEventosService from '../../services/organizadora_eventos.ts';
import { PainelTurismo, type TextosPainel } from '../../components/painel/PainelTurismo.tsx';
import { adaptarServicoLegado } from '../../lib/adaptarServicoLegado.ts';

const servico = adaptarServicoLegado(OrganizadoraDeEventosService);

const textos: TextosPainel = {
  titulo: 'Panorama de organizadoras de eventos',
  plural: 'organizadoras de eventos',
  prefixoCache: 'organizadoras-eventos',
};

export function OrganizadorasEventosTuristicos() {
  return <PainelTurismo servico={servico} textos={textos} />;
}