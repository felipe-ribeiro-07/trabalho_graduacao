interface PillProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}


export function Pill({ label, isActive, onClick }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      value={label}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
        isActive
          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}