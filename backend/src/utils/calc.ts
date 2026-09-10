import crypto from 'crypto';

/**
 * Calcula o Custo Médio Ponderado (CMP) para novas entradas de estoque.
 * CMP = ((Qtd Atual * Custo Atual) + (Qtd Entrada * Custo Entrada)) / (Qtd Atual + Qtd Entrada)
 */
export function calculateWeightedAverageCost(
  currentQty: number,
  currentCost: number,
  inboundQty: number,
  inboundCost: number
): number {
  if (currentQty <= 0) {
    return Math.max(0, Number(inboundCost.toFixed(2)));
  }

  const totalQty = currentQty + inboundQty;
  if (totalQty <= 0) {
    return Math.max(0, Number(inboundCost.toFixed(2)));
  }

  const currentTotalVal = currentQty * currentCost;
  const inboundTotalVal = inboundQty * inboundCost;
  const newAverage = (currentTotalVal + inboundTotalVal) / totalQty;

  return Math.max(0, Number(newAverage.toFixed(2)));
}

/**
 * Gera um código de compartilhamento exclusivo de 6 caracteres alfanuméricos em caixa alta.
 * Validade de 15 minutos.
 * Exemplo: K8P2M5
 */
export function generateShareCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

