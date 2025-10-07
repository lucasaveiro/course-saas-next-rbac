/**
 * Calcula a distância entre dois endereços usando a API do Google Maps
 */
export async function calculateDistance(
  originAddress: string,
  destinationAddress: string
): Promise<number> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
      originAddress
    )}&destinations=${encodeURIComponent(
      destinationAddress
    )}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (
      data.status === 'OK' &&
      data.rows[0]?.elements[0]?.status === 'OK'
    ) {
      // Retorna a distância em quilômetros
      return data.rows[0].elements[0].distance.value / 1000
    } else {
      console.error('Erro ao calcular distância:', data)
      return 0
    }
  } catch (error) {
    console.error('Erro ao calcular distância:', error)
    return 0
  }
}

/**
 * Calcula o custo do frete baseado na distância, custo por km, quantidade de produtos e capacidade do caminhão
 */
export function calculateFreightCost(
  distanceKm: number,
  costPerKm: number,
  totalQuantity: number,
  qtPerPallet: number,
  maxTruckPallets: number
): { cost: number; trips: number } {
  // Calcula o número de pallets necessários
  const pallets = Math.ceil(totalQuantity / qtPerPallet)
  
  // Calcula o número de viagens necessárias
  const trips = Math.ceil(pallets / maxTruckPallets)
  
  // Calcula o custo total do frete
  const cost = distanceKm * costPerKm * trips
  
  return { cost, trips }
}

/**
 * Calcula o custo do frete usando endereços de origem e destino
 */
export async function calculateFreightCostWithAddresses({
  originAddress,
  destinationAddress,
  costPerKm,
  totalQuantity,
  qtPerPallet,
  maxTruckPallets
}: {
  originAddress: string;
  destinationAddress: string;
  costPerKm: number;
  totalQuantity: number;
  qtPerPallet: number;
  maxTruckPallets: number;
}): Promise<{ cost: number; trips: number }> {
  // Calcula a distância entre os endereços
  const distance = await calculateDistance(originAddress, destinationAddress);
  
  // Usa a função existente para calcular o custo
  return calculateFreightCost(
    distance,
    costPerKm,
    totalQuantity,
    qtPerPallet,
    maxTruckPallets
  );
}