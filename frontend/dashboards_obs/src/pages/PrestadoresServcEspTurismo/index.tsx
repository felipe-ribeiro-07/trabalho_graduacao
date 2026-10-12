import PrestadoresEspecializadosTurismoSeguimentoService from '../../services/pres_especializados_turismo.ts';
import { PainelTurismo, type TextosPainel } from '../../components/painel/PainelTurismo.tsx';
import { adaptarServicoLegado } from '../../lib/adaptarServicoLegado.ts';

const servico = adaptarServicoLegado(PrestadoresEspecializadosTurismoSeguimentoService);

const textos: TextosPainel = {
  titulo: 'Panorama de prestadores de serviço especializados no ramo de turismo',
  plural: 'prestadores de serviço especializados',
  prefixoCache: 'pres-esp-turismo',
};

export function PresEspTurismoTuristicos() {
  return <PainelTurismo servico={servico} textos={textos} />;
}