import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  isCta?: boolean;
}

interface HeaderProps {
  title?: string;
  items?: NavItem[];
  currentPath?: string; // Usado para identificar o link ativo
}

const defaultItems: NavItem[] = [
  { label: 'Início', href: '/' },
  { label: 'Panorama', href: '/panorama' },
  { label: 'Metodologia', href: '/metodologia' },
  { label: 'Contato', href: '/contato', isCta: true },
];

export function Header({
  title = 'Observatório de Turismo',
  items = defaultItems,
  currentPath = '/',
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fecha o menu mobile caso a tela seja redimensionada para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Previne rolagem da página quando o menu mobile está aberto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md transition-all duration-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-12 ">
        <div className="flex h-24 items-center justify-between">
          
          {/* Logo / Título */}
          <div className="flex-shrink-0">
            <a 
              href="/" 
              className="text-xl font-bold tracking-tight text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-900 rounded-sm"
              aria-label="Ir para a página inicial"
            >
              {title}
            </a>
          </div>

          {/* Navegação Desktop */}
          <nav className="hidden md:block" aria-label="Navegação principal">
            <ul className="flex items-center space-x-10">
              {items.map((item) => {
                const isActive = currentPath === item.href;

                if (item.isCta) {
                  return (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        className="inline-flex items-center justify-center rounded-xl bg-green-900 px-6 py-2.5 text-sm font-medium tracking-wide text-white transition-colors duration-200 hover:bg-green-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-900"
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                }

                return (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className={`text-sm font-medium tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-900 rounded-sm ${
                        isActive
                          ? 'text-green-700'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Botão Menu Mobile */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-900 rounded-md p-2 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Drawer do Menu Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden absolute top-24 left-0 w-full h-[calc(100vh-6rem)] bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-sm"
          id="mobile-menu"
        >
          <nav className="flex flex-col px-6 py-8 space-y-6 overflow-y-auto" aria-label="Navegação mobile">
            {items.map((item) => {
              const isActive = currentPath === item.href;

              if (item.isCta) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-green-900 px-6 py-4 text-base font-medium tracking-wide text-white transition-colors duration-200 hover:bg-green-800"
                  >
                    {item.label}
                  </a>
                );
              }

              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`block text-lg font-medium tracking-wide transition-colors duration-200 ${
                    isActive
                      ? 'text-green-700'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}