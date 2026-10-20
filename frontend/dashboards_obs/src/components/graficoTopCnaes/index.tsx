import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface TopCnaeData {
  cnae: string;
  descricao: string;
  total_estado: number;
}

interface GraficoTopCnaesProps {
  dados: TopCnaeData[];
}

export function GraficoTopCnaes({ dados }: GraficoTopCnaesProps) {

  if (!dados || dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] sm:h-[350px] lg:h-[450px] bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm">
        Nenhum dado disponível para este ranking de CNAEs.
      </div>
    );
  }

  // Altura dinâmica: cresce conforme o número de barras
  const altura = Math.max(280, dados.length * 32);

  // Trunca a descrição do CNAE para não empurrar o gráfico para fora do ecrã
  const formatarDescricao = (texto: string) => {
    if (!texto) return '';
    return texto.length > 30 ? `${texto.substring(0, 30)}...` : texto;
  };

  return (
    <div className="w-full" style={{ height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={dados}
          layout="vertical"
          margin={{ top: 10, right: 40, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />

          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis 
            type="category" 
            dataKey="descricao" 
            tick={{ fontSize: 11 }}
            width={220} // Eixo mais largo para descrições de CNAEs
            tickFormatter={formatarDescricao}
          />

          <Tooltip cursor={{ fill: '#f3f4f6' }} />

          <Bar 
            dataKey="total_estado" 
            name="Total de MEIs"
            fill="#1013b9"
            radius={[0, 4, 4, 0]}
            label={{ position: 'right', fontSize: 12 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}