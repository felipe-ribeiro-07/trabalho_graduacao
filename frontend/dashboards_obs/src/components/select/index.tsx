import { useState, useEffect, useRef } from 'react';

// Lista de estados para popular o Select
const ESTADOS_BRASILEIROS = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' }
];

interface StateSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function StateSelect({ label, value, onChange, disabled = false }: StateSelectProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sincroniza o valor recebido por propriedade com o texto do input
  useEffect(() => {
    if (value) {
      const estadoSelecionado = ESTADOS_BRASILEIROS.find((e) => e.sigla === value);
      if (estadoSelecionado) {
        setInputValue(estadoSelecionado.nome);
      }
    } else {
      setInputValue('');
    }
  }, [value]);

  // Fecha o dropdown se o usuário clicar fora do componente
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtra os estados com base no que está sendo digitado
  const filteredStates = ESTADOS_BRASILEIROS.filter(
    (estado) =>
      estado.nome.toLowerCase().includes(inputValue.toLowerCase()) ||
      estado.sigla.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const texto = e.target.value;
    setInputValue(texto);
    setIsOpen(true); // Mantém a lista aberta enquanto digita

    if (texto === '') {
      onChange(''); // Se apagar tudo, avisa o componente pai para buscar "Todos"
    }
  };

  // Esta é a função que faz o autopreenchimento ao clicar!
  const handleSelectEstado = (sigla: string, nome: string) => {
    setInputValue(nome); // Preenche o input visualmente com o nome do estado
    onChange(sigla);     // Envia a sigla (ex: 'SP') para o seu backend/estado pai
    setIsOpen(false);    // Esconde a lista suspensa
  };

  return (
    <div ref={wrapperRef} className="relative flex flex-col w-full">
      <label className="mb-1 text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)} // Se clicar no input, abre a lista
        disabled={disabled}
        placeholder="Digite o nome do estado que deseja comparar"
        className="px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400 transition-colors w-full"
      />

      {/* Dropdown com a lista filtrada */}
      {isOpen && filteredStates.length > 0 && (
        <ul className="absolute z-10 w-full mt-16 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredStates.map((estado) => (
            <li
              key={estado.sigla}
              // O segredo está aqui: usar onMouseDown ao invés de onClick evita conflitos de foco!
              onMouseDown={() => handleSelectEstado(estado.sigla, estado.nome)} 
              className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              {estado.nome} ({estado.sigla})
            </li>
          ))}
        </ul>
      )}

      {/* Mensagem de estado não encontrado */}
      {isOpen && inputValue.length > 0 && filteredStates.length === 0 && (
        <div className="absolute z-10 w-full mt-16 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-gray-500 text-center">
          Nenhum estado encontrado.
        </div>
      )}
    </div>
  );
}