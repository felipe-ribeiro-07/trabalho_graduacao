import React, { type InputHTMLAttributes, forwardRef } from 'react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, helperText, icon, className = '', disabled, ...props }, ref) => {
    return (
      <div className="flex flex-col w-full">
        {/* Label condicional */}
        {label && (
          <label className="mb-1 text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        <div className="relative">
          {/* Ícone opcional posicionado à esquerda */}
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            disabled={disabled}
            className={`
              w-full py-2 bg-white border rounded-lg shadow-sm transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
              ${icon ? 'pl-10 pr-4' : 'px-4'} 
              ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
              ${className}
            `}
            {...props}
          />
        </div>

        {/* Mensagem de Erro ou Ajuda */}
        {(error || helperText) && (
          <span className={`mt-1 text-sm ${error ? 'text-red-500' : 'text-gray-500'}`}>
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';