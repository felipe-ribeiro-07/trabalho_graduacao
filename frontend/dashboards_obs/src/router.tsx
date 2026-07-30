import { createBrowserRouter } from 'react-router-dom';
import { Home } from './pages/home/index.tsx';
import { EvolucaoAnualAcampamentos } from './pages/evolucao-anual/index.tsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/evolucao-anual',
    element: <EvolucaoAnualAcampamentos />,
  },
]);
