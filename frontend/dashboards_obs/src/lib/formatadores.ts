// Instâncias criadas uma única vez (Intl é caro de instanciar a cada render).
const percentual = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});
const inteiro = new Intl.NumberFormat('pt-BR');

export const formatarPercentual = (n: number) => `${percentual.format(n)}%`;
export const formatarInteiro = (n: number) => inteiro.format(n);

const porcentagem = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const formatarPorcentagem = (n: number) => `${porcentagem.format(n)}%`;