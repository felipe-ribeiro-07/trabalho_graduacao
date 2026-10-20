import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface DistribuicaoCnaeData {
  municipio: string;
  descricao: string;
  total: number;
}

interface GraficoDistribuicaoProps {
  dados: DistribuicaoCnaeData[];
  cnaeSelecionado?: string; // Para mostrar na mensagem de vazio
}

export function GraficoDistribuicaoCnae({ dados, cnaeSelecionado }: GraficoDistribuicaoProps) {

  if (!dados || dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] sm:h-[350px] lg:h-[450px] bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm">
        {cnaeSelecionado 
          ? `Nenhum registo encontrado para o CNAE ${cnaeSelecionado}.` 
          : 'Selecione um CNAE para visualizar a distribuição.'}
      </div>
    );
  }

  const altura = Math.max(280, dados.length * 32);

  const formatarMunicipio = (texto: string) => {
    if (!texto) return '';
    return texto.length > 20 ? `${texto.substring(0, 20)}...` : texto;
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
            dataKey="municipio" 
            tick={{ fontSize: 12 }}
            width={140}
            tickFormatter={formatarMunicipio}
          />

          {/* Tooltip customizado ajuda a ver a descrição completa ao passar o rato */}
          <Tooltip cursor={{ fill: '#f3f4f6' }} />

          <Bar 
            dataKey="total" 
            name="Ocorrências"
            fill="#1013b9"
            radius={[0, 4, 4, 0]}
            label={{ position: 'right', fontSize: 12 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}