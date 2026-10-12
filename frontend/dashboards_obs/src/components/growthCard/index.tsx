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
    // flex-1: Garante que todos os cards na mesma coluna dividam a altura igualmente.
    // Estilo Clean: Fundo branco, sombra sutil, sem bordas pesadas.
    <article 
      className="flex-1 flex flex-col justify-between w-full bg-white rounded-3xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 font-sans"
      aria-labelledby={`card-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <header className="mb-2">
        <h3 
          id={`card-title-${title.replace(/\s+/g, '-').toLowerCase()}`} 
          className="text-[15px] font-semibold text-gray-500 tracking-tight"
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-[13px] text-gray-400 mt-0.5 font-medium">
            {subtitle}
          </p>
        )}
      </header>

      <div className="mt-auto">
        {/* Tipografia séria e pesada para os números */}
        <div className="text-[34px] font-bold text-gray-900 mb-1 tracking-[-0.04em] leading-none">
          {percentage}
        </div>
        <p className="text-[13px] text-gray-500 font-medium leading-snug">
          {description}
        </p>
      </div>
    </article>
  );
};

export default GrowthCard;