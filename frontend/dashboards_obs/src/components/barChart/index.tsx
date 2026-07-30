import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface RankingUFData {
  uf: string;
  total: number;
}

interface GraficoProps {
  dados: RankingUFData[];
}

export function GraficoBarrasEvolucao({ dados }: GraficoProps) {

  if (!dados || dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] sm:h-[350px] lg:h-[450px] bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm">
        Nenhum dado disponível para este filtro.
      </div>
    );
  }

  // altura dinâmica: cresce conforme o número de barras, pra cada uma ter espaço legível
  const altura = Math.max(280, dados.length * 32);

  return (
    <div className="w-full" style={{ height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={dados}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />

          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis 
            type="category" 
            dataKey="uf" 
            tick={{ fontSize: 12 }}
            width={70}
          />

          <Tooltip cursor={{ fill: '#f3f4f6' }} />

          <Bar 
            dataKey="total" 
            fill="#1013b9"
            radius={[0, 4, 4, 0]}
            label={{ position: 'right' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}