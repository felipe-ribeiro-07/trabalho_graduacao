import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// 1. Definimos o formato do dado que vem do seu backend
interface EvolucaoData {
  ano: string | number;
  quantidade: number; 
}

// 2. Definimos que o componente espera receber uma propriedade chamada "dados" 
// que é um array (lista) do formato EvolucaoData
interface GraficoProps {
  dados: EvolucaoData[];
}

// 3. Desestruturamos a propriedade { dados } direto nos parâmetros do componente
export function GraficoEvolucaoAnual({ dados }: GraficoProps) {
  
  // Tratamento de segurança: se a requisição ainda não terminou ou retornou vazia
  if (!dados || dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-[450px] bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm">
        Nenhum dado disponível para este filtro.
      </div>
    );
  }

  return (
    <div className="w-full h-[450px]">
      <ResponsiveContainer width="100%" height="100%">
        {/* 4. Passamos os "dados" recebidos para o Recharts */}
        <LineChart 
          data={dados}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          
          <XAxis dataKey="ano" /> 
          <YAxis />
          <Tooltip />
          
          {/* Eixo Y recebe o valor. Lembre-se de ajustar o dataKey se o backend usar outro nome */}
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke="#2563eb" // Um azul bem legal do Tailwind (blue-600)
            strokeWidth={3}
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}