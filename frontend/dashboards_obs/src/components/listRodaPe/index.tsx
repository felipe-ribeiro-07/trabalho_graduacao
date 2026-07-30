interface Categoria {
  id: string | number;
  titulo: string;
  url: string;
}

interface ListaCategoriasProps {
  categorias?: Categoria[];
}

export const ListaCategorias = ({ categorias }: ListaCategoriasProps) => {
  const categoriasPadrao: Categoria[] = [
    { id: 1, titulo: 'Evolução Anual (Estados)', url: '/evolucao' },
    { id: 2, titulo: 'Ranking Municipal', url: '/ranking-municipios' },
    { id: 3, titulo: 'Comparativo Regional', url: '/comparativo' },
    { id: 4, titulo: 'Mapa de Calor', url: '/mapa' },
  ];

  const lista = categorias || categoriasPadrao;

  return (
    <div className="w-full h-full flex flex-col p-5 bg-white rounded-xl shadow-sm border border-gray-100">
      {' '}
      <h3 className="text-lg font-bold text-gray-800 mb-4">Veja outras categorias</h3>
      <nav className="flex flex-col space-y-2">
        {/* NOTA: Se estiver usando React Router, troque a tag <a> abaixo por <Link to={categoria.url}> */}
        {lista.map((categoria) => (
          <a
            key={categoria.id}
            href={categoria.url}
            className="group flex items-center justify-between w-full px-4 py-3 bg-gray-50 border border-transparent rounded-lg text-gray-700 font-medium transition-all hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100 active:scale-[0.98]">
            <span>{categoria.titulo}</span>

            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        ))}

        <div className="pt-4 mt-2 border-t border-gray-100">
          <a
            href="/"
            className="flex items-center justify-center w-full px-4 py-3 bg-slate-900 text-white font-medium rounded-lg transition-colors hover:bg-slate-800 active:scale-[0.98]">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Ir para a Home
          </a>
        </div>
      </nav>
    </div>
  );
};
