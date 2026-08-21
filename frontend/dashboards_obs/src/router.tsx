import { createBrowserRouter } from 'react-router-dom';
import { Home } from './pages/home/index.tsx';
import { EvolucaoAnualAcampamentos } from './pages/AcampamentosTuristicos/index.tsx';
import { GuiasTuristicos } from './pages/GuiasTuristicos/index.tsx';
import { LocadoraDeVeiculos } from './pages/LocadoraDeVeiculos/index.tsx';
import { CentroDeConvencoesDeTursimo } from './pages/CentroDeConvencoes/index.tsx';
import { CasaDeEspetaculosDeTursimo } from './pages/CasaDeEspetaculos/index.tsx';
import { PresEspTurismoTuristicos } from './pages/PrestadoresServcEspTurismo/index.tsx';
import { PresServInfraTuristicos } from './pages/PrestadoresServicoInfra/index.tsx';
import { TranspTurisTuristicos } from './pages/TransportadorasTuristicas/index.tsx';
import { ParquesTematicosTuristicos } from './pages/ParquesTematicos/index.tsx';
import { EmpEntreLazerParquesTuristicos } from './pages/EmpEntreterimentoLazerParques/index.tsx';
import { EmpNauticoPescaTuristicos } from './pages/EmpApoioNauticoPesca/index.tsx';
import { MeiosDeHospedagemTuristicos } from './pages/MeiosDeHospedagem/index.tsx';
import { OrganizadorasEventosTuristicos } from './pages/OrganizadoraDeEventos/index.tsx';
import { AgenciasDeTursimo } from './pages/AgenciasDeTurismo/index.tsx';

// Importe o seu componente de Layout (ajuste o caminho conforme sua pasta)
import { Layout } from './layouts/header.tsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'acampamentos-turisticos',
        element: <EvolucaoAnualAcampamentos />,
      },
      {
        path: 'guias-turisticos',
        element: <GuiasTuristicos />,
      },
      {
        path: 'locadora-de-veiculos',
        element: <LocadoraDeVeiculos />,
      },
      {
        path: 'agencias-de-turismo',
        element: <AgenciasDeTursimo />,
      },
      {
        path: 'centro-convencoes',
        element: <CentroDeConvencoesDeTursimo />,
      },
      {
        path: 'casa-de-espetaculos',
        element: <CasaDeEspetaculosDeTursimo />,
      },
      {
        path: 'prestadores-de-servicos-turisticos',
        element: <PresEspTurismoTuristicos />,
      },
      {
        path: 'organizadora-de-eventos',
        element: <OrganizadorasEventosTuristicos />,
      },
      {
        path: 'prestadores-de-servicos-infra',
        element: <PresServInfraTuristicos />,
      },
      {
        path: 'transportadora-turistica',
        element: <TranspTurisTuristicos />,
      },
      {
        path: 'parques-tematicos',
        element: <ParquesTematicosTuristicos />,
      },
      {
        path: 'empreendimentos-parques-turisticos',
        element: <EmpEntreLazerParquesTuristicos />,
      },
      {
        path: 'empreendimentos-pesca-nautico',
        element: <EmpNauticoPescaTuristicos />,
      },
      {
        path: 'meios-hospedagem',
        element: <MeiosDeHospedagemTuristicos />,
      },
    ],
  },
]);
