import PrestadoresEspecializadosEmInfraService from '../../services/pres_infra.ts';
import { PainelTurismo, type TextosPainel } from '../../components/painel/PainelTurismo.tsx';
import { adaptarServicoLegado } from '../../lib/adaptarServicoLegado.ts';

const servico = adaptarServicoLegado(PrestadoresEspecializadosEmInfraService);

// O título original era cópia de "Prestadores especializados no ramo de turismo".
// Ajustei para infraestrutura; confirme o nome oficial da categoria no CADASTUR.
const textos: TextosPainel = {
  titulo: 'Panorama de prestadores de serviço especializados em infraestrutura',
  plural: 'prestadores de serviço de infraestrutura',
  prefixoCache: 'pres-infra',
};

export function PresServInfraTuristicos() {
  return <PainelTurismo servico={servico} textos={textos} />;
}