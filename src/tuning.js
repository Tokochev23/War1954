// =========================== TUNING (ajustes) ================================
// ATENÇÃO: Os coeficientes podem ser ajustados para calibrar o sistema
// sem mexer na lógica principal do código.
// =============================================================================

export const TUNING = {
  // Como mapear níveis (1–5) para multiplicadores
  level: { 1: 0.7, 2: 0.85, 3: 1.0, 4: 1.2, 5: 1.4 },

  // Efeito da tecnologia civil (0–100) nos setores
  techFoodAlpha: 0.5,
  techFuelAlpha: 0.4,
  techMetalAlpha: 0.4,

  // Comida
  baseFoodPerRuralCapita: 0.008,
  foodConsumptionPerCapita: 0.007,

  // Combustível (poço)
  fuelSizeUnitToBbl: 1000,

  // Metal (mina)
  metalSizeUnitToTon: 1000,
  
  // Orçamento (fórmula ajustada com estabilidade, tec e pib)
  orcamentoPIBBase: 0.05,
  orcamentoPIBEstabilidade: 0.005,
  orcamentoPIBTecnologia: 0.0025,
};
