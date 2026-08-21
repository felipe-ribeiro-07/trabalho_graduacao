import { Outlet, useLocation } from 'react-router-dom';
import { Header, type NavItem } from '../components/pillNave/index.tsx'; // Ajuste o caminho se necessário

export function Layout() {
  // O hook useLocation pega a URL atual (ex: '/guias-turisticos')
  const location = useLocation();

  // Defina os links do seu menu baseados nas suas rotas
  const navItems: NavItem[] = [
    { label: 'Início', href: '/' },
    { label: 'Acampamentos', href: '/acampamentos-turisticos' },
    { label: 'Guias', href: '/guias-turisticos' },
    // isCta: true transforma este link no botão verde de destaque
    { label: 'Locadora', href: '/locadora-de-veiculos', isCta: true }, 
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      
      {/* 
        Passamos os itens de navegação e informamos ao Header qual é a 
        página atual para ele poder pintar o link ativo de verde.
      */}
      <Header 
        title="Observatório de Turismo" 
        items={navItems} 
        currentPath={location.pathname} 
      />
      
      {/* O conteúdo das suas páginas vai renderizar aqui dentro */}
      <main className="">
        <Outlet />
      </main>

    </div>
  );
}