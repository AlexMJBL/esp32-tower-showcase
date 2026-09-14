/**
 * Module Agronomique & Scientifique pour Tower Garden & Serres Intérieures
 * - Calculs précis du Déficit de Pression de Vapeur (VPD)
 * - Conversion Lux -> PPFD (PAR) pour le spectre Full Spectrum CRI 98+ (42W)
 * - Calcul du Daily Light Integral (DLI)
 */

export interface VpdResult {
  svpAir: number;      // Pression saturante air (kPa)
  svpLeaf: number;     // Pression saturante feuille (kPa)
  vpa: number;         // Pression réelle vapeur d'eau (kPa)
  vpdAir: number;      // VPD de l'air ambiant (kPa)
  vpdLeaf: number;     // VPD réel à la surface foliaire (kPa)
  zone: 'DANGER_LOW' | 'CLONES' | 'EARLY_VEG' | 'LATE_VEG' | 'FLOWERING' | 'DANGER_HIGH';
  statusLabel: string;
  advice: string;
  colorClass: string;
  badgeBg: string;
}

export interface ParResult {
  lux: number;
  ppfd: number;       // Flux de photons photosynthétiques en µmol/(m²·s)
  dli12h: number;     // Intégrale de lumière quotidienne sur 12h (mol/m²/jour)
  dli16h: number;     // Intégrale de lumière quotidienne sur 16h (mol/m²/jour)
  dli18h: number;     // Intégrale de lumière quotidienne sur 18h (mol/m²/jour)
  intensityLabel: 'Faible' | 'Semis/Boutures' | 'Croissance' | 'Floraison' | 'Saturation';
}

/**
 * Pression de vapeur saturante selon l'équation d'Arden Buck (kPa)
 * Précision agronomique supérieure entre -20°C et +50°C
 */
export function calculateSVP(tempC: number): number {
  return 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

/**
 * Calcule le VPD complet (Air & Feuille)
 * @param tempAir Température ambiante (°C)
 * @param humidityPercent Humidité relative (%)
 * @param leafTempOffset Décalage thermique feuille sous LED (°C, typiquement -1.5°C à -2.0°C)
 */
export function calculateVPD(
  tempAir: number,
  humidityPercent: number,
  leafTempOffset: number = -1.5
): VpdResult {
  const clampedHum = Math.min(100, Math.max(0, humidityPercent));
  const svpAir = calculateSVP(tempAir);
  const vpa = svpAir * (clampedHum / 100);

  const tempLeaf = tempAir + leafTempOffset;
  const svpLeaf = calculateSVP(tempLeaf);

  const vpdAir = Math.max(0, svpAir - vpa);
  const vpdLeaf = Math.max(0, svpLeaf - vpa);

  // Diagnostic selon le VPD feuille (le plus précis biologiquement)
  let zone: VpdResult['zone'] = 'LATE_VEG';
  let statusLabel = 'Optimal Végétatif';
  let advice = 'Transpiration équilibrée, stomates ouverts.';
  let colorClass = 'text-emerald-400';
  let badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

  if (vpdLeaf < 0.4) {
    zone = 'DANGER_LOW';
    statusLabel = 'Trop humide (Danger)';
    advice = 'Risque très élevé de moisissure (Botrytis), transpiration quasi nulle.';
    colorClass = 'text-sky-400';
    badgeBg = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
  } else if (vpdLeaf < 0.8) {
    zone = 'CLONES';
    statusLabel = 'Semis & Boutures';
    advice = 'Idéal pour enracinement et très jeunes pousses sans stress.';
    colorClass = 'text-teal-300';
    badgeBg = 'bg-teal-500/20 text-teal-300 border-teal-500/30';
  } else if (vpdLeaf < 1.05) {
    zone = 'EARLY_VEG';
    statusLabel = 'Croissance Végétative';
    advice = 'Parfait pour le développement foliaire et l’absorption d’azote.';
    colorClass = 'text-emerald-400';
    badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  } else if (vpdLeaf <= 1.45) {
    zone = 'FLOWERING';
    statusLabel = 'Floraison / Fructification';
    advice = 'Transpiration active, absorption maximale de nutriments minéraux.';
    colorClass = 'text-amber-400';
    badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  } else {
    zone = 'DANGER_HIGH';
    statusLabel = 'Trop sec (Stress Hydrique)';
    advice = 'Stomates fermés pour éviter le dessèchement, arrêt de croissance.';
    colorClass = 'text-rose-400';
    badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  }

  return {
    svpAir: Number(svpAir.toFixed(3)),
    svpLeaf: Number(svpLeaf.toFixed(3)),
    vpa: Number(vpa.toFixed(3)),
    vpdAir: Number(vpdAir.toFixed(2)),
    vpdLeaf: Number(vpdLeaf.toFixed(2)),
    zone,
    statusLabel,
    advice,
    colorClass,
    badgeBg,
  };
}

/**
 * Facteur de conversion Lux -> PPFD pour le spectre spécifique :
 * Lampe Horticole Barrina T8 4FT 5000K Daylight White (42W V-Shape, CRI 98+)
 * Spectre fixe non-ajustable : pic bleu 450nm + plateau 520-660nm.
 * Ratio étalonné : 1 µmol/(m²·s) ≈ 66.7 Lux -> Facteur = 0.0150
 */
export const LUX_TO_PPFD_FACTOR = 0.0150;

/**
 * Convertit une lecture Lux (VEML7700) en PPFD et DLI
 * @param lux Mesure en Lux
 */
export function calculatePAR(lux: number): ParResult {
  const safeLux = Math.max(0, lux);
  const ppfd = safeLux * LUX_TO_PPFD_FACTOR;

  // Calcul du DLI en mol/(m²·jour) : PPFD * heures * 3600 / 1 000 000 = PPFD * heures * 0.0036
  const dli12h = ppfd * 12 * 0.0036;
  const dli16h = ppfd * 16 * 0.0036;
  const dli18h = ppfd * 18 * 0.0036;

  let intensityLabel: ParResult['intensityLabel'] = 'Faible';
  if (ppfd < 100) {
    intensityLabel = 'Faible';
  } else if (ppfd < 250) {
    intensityLabel = 'Semis/Boutures';
  } else if (ppfd < 500) {
    intensityLabel = 'Croissance';
  } else if (ppfd <= 900) {
    intensityLabel = 'Floraison';
  } else {
    intensityLabel = 'Saturation';
  }

  return {
    lux: Number(safeLux.toFixed(1)),
    ppfd: Number(ppfd.toFixed(1)),
    dli12h: Number(dli12h.toFixed(2)),
    dli16h: Number(dli16h.toFixed(2)),
    dli18h: Number(dli18h.toFixed(2)),
    intensityLabel,
  };
}
