import { createBrowserRouter } from 'react-router-dom';
import { Home } from './pages/home/index.tsx';
import { EvolucaoAnualAcampamentos } from './pages/AcampamentosTuristicos/index.tsx';
import { GuiasTuristicos } from './pages/GuiasTuristicos/index.tsx';
import { LocadoraDeVeiculos } from './pages/LocadoraDeVeiculos/index.tsx';
import { CentroDeConvencoesDeTursimo } from './pages/CentroDeConvencoes/index.tsx';

// Importe o seu componente de Layout (ajuste o caminho conforme sua pasta)
import { Layout } from './layouts/header.tsx'
import { AgenciasDeTursimo } from './pages/AgenciasDeTurismo/index.tsx';
import { CasaDeEspetaculosDeTursimo } from './pages/CasaDeEspetaculos/index.tsx';

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
        path:'agencias-de-turismo',
        element :<AgenciasDeTursimo/>
      },
      {
        path :'centro-convencoes',
        element :<CentroDeConvencoesDeTursimo />
      },
      {
        path: 'casa-de-espetaculos',
        element : < CasaDeEspetaculosDeTursimo/>
      }
    ],
  },

]);