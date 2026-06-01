export const getCalculatedEmissions = (activityType: string, quantity: number, _unit: string): number => {
  const q = Number(quantity) || 0;
  const act = (activityType || '').toUpperCase();

  if (act === 'ELECTRICITY') {
    // 0.385 kg CO2e per kWh
    return Math.round((q * 0.385 / 1000) * 10) / 10;
  }
  if (act === 'FUEL') {
    // 2.5 kg CO2e per Liter
    return Math.round((q * 2.5) / 1000 * 10) / 10;
  }
  if (act === 'FLIGHT') {
    // 0.3 kg CO2e per passenger-mile
    return Math.round((q * 0.3) / 1000 * 10) / 10;
  }
  // Default fallback
  return Math.round((q * 0.5) / 1000 * 10) / 10;
};
