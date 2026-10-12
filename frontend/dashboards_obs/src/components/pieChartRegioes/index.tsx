import { useMemo } from 'react';
import {
  Pie,
  PieChart,
  type PieSectorShapeProps,
  Sector,
  Tooltip,
  Legend,
  useActiveTooltipDataPoints,
  useIsTooltipActive,
  ResponsiveContainer,
} from 'recharts';

const MAPA_REGIOES: Record<string, string> = {
  AC: 'Norte', AL: 'Nordeste', AP: 'Norte', AM: 'Norte', BA: 'Nordeste', CE: 'Nordeste',
  DF: 'Centro-Oeste', ES: 'Sudeste', GO: 'Centro-Oeste', MA: 'Nordeste', MT: 'Centro-Oeste',
  MS: 'Centro-Oeste', MG: 'Sudeste', PA: 'Norte', PB: 'Nordeste', PR: 'Sul', PE: 'Nordeste',
  PI: 'Nordeste', RJ: 'Sudeste', RN: 'Nordeste', RS: 'Sul', RO: 'Norte', RR: 'Norte',
  SC: 'Sul', SP: 'Sudeste', SE: 'Nordeste', TO: 'Norte',
};

// Paleta corporativa clean
const COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30'];

interface ItemRankingUF {
  uf: string;
  total: number;
  [key: string]: any;
}

interface GraficoRegioesRankingProps {
  dadosRanking: ItemRankingUF[];
  chaveUf?: string;
  isAnimationActive?: boolean;
}

function agruparPorRegiao(dados: ItemRankingUF[], chaveUf: string) {
  if (!dados || dados.length === 0) return [];
  const totaisPorRegiao: Record<string, number> = {};

  dados.forEach((item) => {
    const uf = item[chaveUf];
    const regiao = MAPA_REGIOES[uf] || 'Desconhecida';
    totaisPorRegiao[regiao] = (totaisPorRegiao[regiao] || 0) + (item.total || 0);
  });

  const totalGeral = Object.values(totaisPorRegiao).reduce((soma, v) => soma + v, 0);

  // Ordenamos PRIMEIRO do maior para o menor, e SÓ ENTÃO mapeamos as cores.
  // Isso garante que a cor principal (Azul) fique sempre com a maior fatia.
  return Object.entries(totaisPorRegiao)
    .sort((a, b) => b[1] - a[1])
    .map(([regiao, total], index) => ({
      name: regiao,
      value: total,
      percentual: totalGeral ? Number(((total / totalGeral) * 100).toFixed(1)) : 0,
      fill: COLORS[index % COLORS.length], // Repassa a cor para a legenda automaticamente
    }));
}

const FatiaRegiao = (props: PieSectorShapeProps) => {
  const pontoAtivo = useActiveTooltipDataPoints();
  const algumaFatiaAtiva = useIsTooltipActive();
  const estaFatiaAtiva = algumaFatiaAtiva && props.payload === pontoAtivo?.[0];

  // Foco exclusivo: escurece os inativos em vez de clarear, dando mais destaque à fatia ativa
  const fillOpacity = algumaFatiaAtiva && !estaFatiaAtiva ? 0.2 : 1;

  return (
    <Sector
      {...props}
      fill={props.payload.fill} // Usa a cor vinculada ao dado
      fillOpacity={fillOpacity}
      style={{ transition: 'all 0.3s ease-out', outline: 'none' }}
    />
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const numero = Number(data.value);
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-gray-100 px-4 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] font-sans min-w-[140px]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.fill }}></span>
          <p className="text-[13px] font-medium text-gray-500 uppercase tracking-wide">{data.name}</p>
        </div>
        <p className="text-xl font-bold text-gray-900 tracking-tight">
          {numero.toLocaleString('pt-BR')} <span className="text-[14px] text-gray-400 font-medium ml-1">({data.percentual}%)</span>
        </p>
      </div>
    );
  }
  return null;
};

export function GraficoRegioesRanking({
  dadosRanking,
  chaveUf = 'uf',
  isAnimationActive = true,
}: GraficoRegioesRankingProps) {
  const dadosPorRegiao = useMemo(
    () => agruparPorRegiao(dadosRanking, chaveUf),
    [dadosRanking, chaveUf]
  );

  if (!dadosPorRegiao || dadosPorRegiao.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full min-h-[300px] text-gray-400 text-[15px]" role="alert">
        Sem dados suficientes.
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[350px] flex-1 relative" role="figure" aria-label="Gráfico de distribuição por regiões">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dadosPorRegiao}
            dataKey="value"
            nameKey="name"
            cx="45%" // Centraliza um pouco mais para unir o gráfico à legenda
            cy="50%"
            innerRadius="70%" // Aumentado para deixar o anel mais fino e sofisticado
            outerRadius="90%"
            isAnimationActive={isAnimationActive}
            shape={FatiaRegiao}
            stroke="#ffffff"
            strokeWidth={4} // Maior espaçamento em branco entre fatias (Clean)
            labelLine={false}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: 'transparent' }} 
            wrapperStyle={{ outline: 'none' }}
          />
          <Legend 
            layout="vertical" 
            verticalAlign="middle" 
            align="right"
            iconType="circle"
            iconSize={8} // Bolinhas mais delicadas
            wrapperStyle={{ 
              right: '10%', // Puxa a legenda da extremidade direita para mais perto do gráfico
              fontSize: '14px', 
              color: '#4B5563', 
              fontWeight: 500,
              lineHeight: '2.5' // Maior respiro entre os itens da legenda
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default GraficoRegioesRanking;