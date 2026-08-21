import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  title?: string;
  currentPath?: string; 
}

// 1. Separamos o Início dos itens do Cadastur
const homeItem: NavItem = { label: 'Início', href: '/' };

const cadasturItems: NavItem[] = [
  { label: 'Acampamentos', href: '/acampamentos-turisticos' },
  { label: 'Guias', href: '/guias-turisticos' },
  { label: 'Locadora', href: '/locadora-de-veiculos' },
  { label: 'Agências', href: '/agencias-de-turismo' },
  { label: 'Convenções', href: '/centro-convencoes' },
  { label: 'Espetáculos', href: '/casa-de-espetaculos' },
  { label: 'Prest. Turísticos', href: '/prestadores-de-servicos-turisticos' },
  { label: 'Org. Eventos', href: '/organizadora-de-eventos' },
  { label: 'Prest. Infra', href: '/prestadores-de-servicos-infra' },
  { label: 'Transportadoras', href: '/transportadora-turistica' },
  { label: 'Parques', href: '/parques-tematicos' },
  { label: 'Emp. e Parques', href: '/empreendimentos-parques-turisticos' },
  { label: 'Náutico e Pesca', href: '/empreendimentos-pesca-nautico' },
  { label: 'Hospedagem', href: '/meios-hospedagem' },
];

export function Header({
  title = 'Observatório de Turismo',
  currentPath = '/',
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md transition-all duration-200">
      <div className="w-full px-4 lg:px-8 py-4">
        
        <div className="flex items-center justify-between">
          
          {/* AGRUPAMENTO DA ESQUERDA: Título e Menu */}
          <div className="flex items-center gap-8 lg:gap-12">
            
            {/* Logo / Título */}
            <div className="flex-shrink-0">
              <a 
                href="/" 
                className="text-xl font-bold tracking-tight text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-900 rounded-sm whitespace-nowrap"
              >
                {title}
              </a>
            </div>

            {/* Navegação Desktop */}
            <nav className="hidden md:flex items-center gap-6" aria-label="Navegação principal">
              
              {/* Link Solto: Início */}
              <a
                href={homeItem.href}
                className={`text-sm font-medium tracking-wide transition-colors duration-200 py-2 ${
                  currentPath === homeItem.href
                    ? 'text-green-700 font-bold border-b-2 border-green-700'
                    : 'text-gray-600 hover:text-green-700'
                }`}
              >
                {homeItem.label}
              </a>

              {/* DROPDOWN: Cadastur */}
              <div className="relative group">
                <button 
                  className={`flex items-center gap-1 text-sm font-medium tracking-wide transition-colors duration-200 py-2 ${
                    cadasturItems.some(item => item.href === currentPath) 
                      ? 'text-green-700 font-bold border-b-2 border-green-700' 
                      : 'text-gray-600 hover:text-green-700'
                  }`}
                >
                  Cadastur
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-green-700 transition-transform duration-200 group-hover:-rotate-180" />
                </button>

                {/* Área do conteúdo do Dropdown (Aparece no hover) */}
                <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                  {/* Grid de 2 colunas para o Mega Menu */}
                  <div className="w-[450px] bg-white border border-gray-100 rounded-xl shadow-xl p-4 grid grid-cols-2 gap-2">
                    {cadasturItems.map((item) => {
                      const isActive = currentPath === item.href;
                      return (
                        <a
                          key={item.label}
                          href={item.href}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors duration-150 ${
                            isActive
                              ? 'bg-green-50 text-green-700 font-bold'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-green-700'
                          }`}
                        >
                          {item.label}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </nav>
          </div>

          {/* Botão Menu Mobile */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-900 rounded-md p-2 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Drawer do Menu Mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[100%] left-0 w-full h-[calc(100vh-4.5rem)] bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-sm">
          <nav className="flex flex-col px-6 py-6 overflow-y-auto h-full pb-20">
            
            {/* Início Mobile */}
            <a
              href={homeItem.href}
              className={`block text-lg font-medium transition-colors duration-200 mb-6 ${
                currentPath === homeItem.href ? 'text-green-700 font-bold' : 'text-gray-700'
              }`}
            >
              {homeItem.label}
            </a>

            {/* Divisor */}
            <div className="w-full h-px bg-gray-200 mb-6"></div>

            {/* Título da Seção Mobile */}
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
              Painéis Cadastur
            </h3>

            {/* Lista Cadastur Mobile */}
            <div className="flex flex-col space-y-4">
              {cadasturItems.map((item) => {
                const isActive = currentPath === item.href;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`block text-base font-medium transition-colors duration-200 ${
                      isActive ? 'text-green-700 font-bold' : 'text-gray-600 hover:text-green-700'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}