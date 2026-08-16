import React from 'react';

interface GrowthCardProps {
  title: string;
  subtitle?: string;
  percentage: string;
  description: string;
}

const GrowthCard: React.FC<GrowthCardProps> = ({ 
  title, 
  subtitle, 
  percentage, 
  description 
}) => {
  return (
    // Removido o w-[340px]. Agora ele ocupa 100% da coluna onde for inserido.
    <div className="w-full h-full bg-[#f4f9ea] rounded-2xl p-3 md:p-4 shadow-sm flex flex-col items-center justify-center text-center font-sans">
      
      {/* Cabeçalho */}
      <div className="mb-2 md:mb-4">
        <h2 className="text-xs md:text-sm font-semibold text-gray-900 tracking-tight leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[10px] md:text-xs text-gray-600 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Dado Principal */}
      <div className="text-xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-4 tracking-tighter">
        {percentage}
      </div>

      {/* Descrição */}
      <p className="text-[10px] md:text-xs text-gray-700 leading-snug">
        {description}
      </p>

    </div>
  );
};

export default GrowthCard;