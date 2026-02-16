export const calculateScore = (currentScore: number, round: number, isHeadshot: boolean = false): number => {
  const basePoints = 100;
  const roundMultiplier = 1 + (round - 1) * 0.1; // 10% increase per round
  const headshotBonus = isHeadshot ? 50 : 0;
  
  return Math.floor(currentScore + (basePoints * roundMultiplier) + headshotBonus);
};

export const getTauntLevel = (misses: number): 'mild' | 'medium' | 'savage' => {
  if (misses < 3) return 'mild';
  if (misses < 7) return 'medium';
  return 'savage';
};
