import { Link } from 'react-router-dom';

interface TopBarGraficoProps {
  titulo: string;
  link: string;
}

export function TopBarGrafico({ titulo, link }: TopBarGraficoProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium text-black-700">{titulo}</h2>
        <Link to={link}>
          <button className="px-3 py-1 border border-gray-200 rounded-xl text-sm text-blue-600 hover:text-blue-800 hover:bg-gray-50 font-medium transition-colors">Ver mais</button>
        </Link>
      </div>
    </>
  );
}
