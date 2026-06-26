export type CardType = 'boost' | 'nitro' | 'shield' | 'trap' | 'cruise';

export interface CardEffect {
  speedChange: number;
  heatChange: number;
  oppHeatChange: number;
  shield: boolean;
  trapSpeedReduction: number;
}

export interface Card {
  id: string;
  name: string;
  description: string;
  type: CardType;
  effect: CardEffect;
}

const cardTemplates: Card[] = [
  {
    id: 'boost_basic',
    name: '부스트',
    description: '속도 +25, 열 +10',
    type: 'boost',
    effect: { speedChange: 25, heatChange: 10, oppHeatChange: 0, shield: false, trapSpeedReduction: 0 },
  },
  {
    id: 'boost_strong',
    name: '강력 부스트',
    description: '속도 +40, 열 +20',
    type: 'boost',
    effect: { speedChange: 40, heatChange: 20, oppHeatChange: 0, shield: false, trapSpeedReduction: 0 },
  },
  {
    id: 'nitro',
    name: '니트로',
    description: '속도 +60, 열 +40',
    type: 'nitro',
    effect: { speedChange: 60, heatChange: 40, oppHeatChange: 0, shield: false, trapSpeedReduction: 0 },
  },
  {
    id: 'shield',
    name: '실드',
    description: '열 +5, 다음 트랩 방어',
    type: 'shield',
    effect: { speedChange: 0, heatChange: 5, oppHeatChange: 0, shield: true, trapSpeedReduction: 0 },
  },
  {
    id: 'trap_oil',
    name: '오일 트랩',
    description: '상대 속도 -30',
    type: 'trap',
    effect: { speedChange: 0, heatChange: 5, oppHeatChange: 0, shield: false, trapSpeedReduction: 30 },
  },
  {
    id: 'trap_spike',
    name: '스파이크',
    description: '상대 속도 -50, 열 +15',
    type: 'trap',
    effect: { speedChange: 0, heatChange: 10, oppHeatChange: 15, shield: false, trapSpeedReduction: 50 },
  },
  {
    id: 'cruise',
    name: '크루즈',
    description: '속도 +10, 열 0 (안정 주행)',
    type: 'cruise',
    effect: { speedChange: 10, heatChange: 0, oppHeatChange: 0, shield: false, trapSpeedReduction: 0 },
  },
  {
    id: 'drift',
    name: '드리프트',
    description: '속도 +15, 열 +5, 코너컷',
    type: 'boost',
    effect: { speedChange: 15, heatChange: 5, oppHeatChange: 0, shield: false, trapSpeedReduction: 0 },
  },
];

export function getDeckCards(): Card[] {
  const deck: Card[] = [];
  const counts: Record<string, number> = {
    boost_basic: 4,
    boost_strong: 2,
    nitro: 2,
    shield: 3,
    trap_oil: 3,
    trap_spike: 1,
    cruise: 3,
    drift: 2,
  };
  for (const card of cardTemplates) {
    const n = counts[card.id] ?? 1;
    for (let i = 0; i < n; i++) {
      deck.push({ ...card, id: card.id + '_' + i });
    }
  }
  return deck;
}
