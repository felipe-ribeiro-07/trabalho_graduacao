import { createBrowserRouter } from 'react-router-dom';
import { Home } from './pages/home/index.tsx';
import { EvolucaoAnualAcampamentos } from './pages/AcampamentosTuristicos/index.tsx';
import { GuiasTuristicos } from './pages/GuiasTuristicos/index.tsx';
import { LocadoraDeVeiculos } from './pages/LocadoraDeVeiculos/index.tsx';

// Importe o seu componente de Layout (ajuste o caminho conforme sua pasta)
import { Layout } from './layouts/header.tsx'

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
      }
    ],
  },

]);