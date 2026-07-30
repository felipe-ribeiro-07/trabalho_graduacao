import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// 1. A interface dos dados continua a mesma
interface EvolucaoData {
  total: string | number;
  municipio: string; // Lembre-se de trocar "quantidade" se o seu backend usar outro nome (ex: "total")
}

// 2. A interface das props também continua igual
interface GraficoProps {
  dados: EvolucaoData[];
}

export function GraficoBarrasEvolucaoMunicipio({ dados }: GraficoProps) {
  
  // Tratamento caso não tenha dados ainda
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
        {/* 3. Trocamos LineChart por BarChart */}
        <BarChart 
          data={dados}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          
          <XAxis dataKey="municipio" /> 
          <YAxis />
          
          {/* Adicionei um fundo cinza claro (gray-100) quando você passa o mouse na barra */}
          <Tooltip cursor={{ fill: '#f3f4f6' }} /> 
          
          {/* 4. Trocamos Line por Bar */}
          <Bar 
            dataKey="total" 
            fill="#294b0a" // Um verde esmeralda bonito do Tailwind, mas você pode mudar a cor!
            radius={[4, 4, 0, 0]} // Arredonda levemente os cantos superiores da barra
            label={{ position: 'top' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}