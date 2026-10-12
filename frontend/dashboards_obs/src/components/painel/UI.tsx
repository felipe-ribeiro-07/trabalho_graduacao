import { memo, type ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/** Overlay anunciado a leitores de tela (role="status"). */
export function OverlayCarregando({ visivel, texto }: { visivel: boolean; texto: string }) {
  return (
    <div role="status" aria-live="polite">
      {visivel && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70">
          <p className="text-sm text-gray-700">{texto}</p>
        </div>
      )}
    </div>
  );
}

export function AlertaErro({ mensagem, onTentarNovamente }: { mensagem: string; onTentarNovamente?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <span>{mensagem}</span>
      {onTentarNovamente && (
        <button
          type="button"
          onClick={onTentarNovamente}
          className="rounded-md border border-red-300 px-3 py-1 font-medium hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export const Esqueleto = memo(function Esqueleto({ altura = 'h-64' }: { altura?: string }) {
  return <div aria-hidden="true" className={`${altura} w-full animate-pulse rounded-xl bg-gray-100 motion-reduce:animate-none`} />;
});