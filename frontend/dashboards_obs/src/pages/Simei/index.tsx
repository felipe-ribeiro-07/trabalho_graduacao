import { PainelSimeiCnae } from '../../components/painel/painelSimeiCnae';

// Opcional: Se quiser gerir o Título da Página (SEO/Head)
// import { Helmet } from 'react-helmet'; 

export function PaginaSimeiCnae() {
  return (
    <>
      {/* <Helmet>
        <title>Observatório de Turismo - Dados SIMEI</title>
      </Helmet> */}
      
      {/* O Painel já inclui toda a lógica de estado, chamadas à API e gráficos */}
      <PainelSimeiCnae />
    </>
  );
}

export default PaginaSimeiCnae;