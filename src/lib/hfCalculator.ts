export interface StageScoreInput {
  powerFactor: 'major' | 'minor';
  hitsA: number;
  hitsC: number;
  hitsD: number;
  misses: number;
  metalHits: number;
  metalMisses: number;
  noShootHits: number;
  procedurals: number;
  timeSeconds: number;
}

export interface HitFactorResult {
  rawPoints: number;
  penalties: number;
  finalPoints: number;
  hitFactor: number;
  maxPossiblePoints: number;
  accuracyPercent: number;
}

export function calculateDetailedHitFactor(input: StageScoreInput): HitFactorResult {
  const isMajor = input.powerFactor === 'major';
  
  // Points per zone
  const aPoints = input.hitsA * 5;
  const cPoints = input.hitsC * (isMajor ? 4 : 3);
  const dPoints = input.hitsD * (isMajor ? 2 : 1);
  const metalPoints = input.metalHits * 5;
  
  const rawPoints = aPoints + cPoints + dPoints + metalPoints;
  
  // Penalties
  const missPenalties = (input.misses + input.metalMisses) * 10;
  const noShootPenalties = input.noShootHits * 10;
  const procPenalties = input.procedurals * 10;
  const penalties = missPenalties + noShootPenalties + procPenalties;
  
  const finalPoints = Math.max(0, rawPoints - penalties);
  const time = Math.max(0.01, input.timeSeconds);
  const hitFactor = finalPoints > 0 ? Number((finalPoints / time).toFixed(4)) : 0;
  
  const totalPaperShots = input.hitsA + input.hitsC + input.hitsD + input.misses;
  const totalShots = totalPaperShots + input.metalHits + input.metalMisses;
  const maxPossiblePoints = totalShots * 5;
  
  const accuracyPercent = totalShots > 0 
    ? Math.round(((input.hitsA + input.metalHits) / totalShots) * 100) 
    : 0;

  return {
    rawPoints,
    penalties,
    finalPoints,
    hitFactor,
    maxPossiblePoints,
    accuracyPercent,
  };
}

export function simulateSpeedVsAccuracy(
  current: StageScoreInput,
  timeDeltaSeconds: number, // e.g. -0.5s faster or +0.5s slower
  convertHits: { from: 'c' | 'd' | 'miss'; to: 'a'; count: number }
): { newHitFactor: number; deltaHf: number; isBetter: boolean } {
  const simulated: StageScoreInput = { ...current };
  simulated.timeSeconds = Math.max(0.1, current.timeSeconds + timeDeltaSeconds);

  if (convertHits.from === 'c' && simulated.hitsC >= convertHits.count) {
    simulated.hitsC -= convertHits.count;
    simulated.hitsA += convertHits.count;
  } else if (convertHits.from === 'd' && simulated.hitsD >= convertHits.count) {
    simulated.hitsD -= convertHits.count;
    simulated.hitsA += convertHits.count;
  } else if (convertHits.from === 'miss' && simulated.misses >= convertHits.count) {
    simulated.misses -= convertHits.count;
    simulated.hitsA += convertHits.count;
  }

  const currentResult = calculateDetailedHitFactor(current);
  const simResult = calculateDetailedHitFactor(simulated);
  const deltaHf = Number((simResult.hitFactor - currentResult.hitFactor).toFixed(4));

  return {
    newHitFactor: simResult.hitFactor,
    deltaHf,
    isBetter: deltaHf > 0,
  };
}
