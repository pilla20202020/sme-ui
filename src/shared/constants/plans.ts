export interface Plan {
  id: string;
  name: string;
  premium: number;
  tier: string;
  category?: string;
  carrier?: string;
  isRemoved?: boolean;
}

export const L713_PLANS: Plan[] = [
  { id: 'L713-PLN-001', name: 'BA PHCS 7350 Value L3', premium: 790.49, tier: 'Bronze' },
  { id: 'L713-PLN-002', name: 'BA PHCS 5000 Standard L2', premium: 650.0, tier: 'Silver' },
  { id: 'L713-PLN-003', name: 'BA PHCS 3000 Premium L1', premium: 920.75, tier: 'Gold' },
  { id: 'L713-PLN-004', name: 'BA PHCS 10000 Basic L4', premium: 480.3, tier: 'Bronze' },
  { id: 'L713-PLN-005', name: 'BA PHCS 2500 Elite L0', premium: 1125.0, tier: 'Platinum' },
  { id: 'L713-PLN-006', name: 'BA PHCS 8500 Economy L5', premium: 385.6, tier: 'Bronze' },
  { id: 'L713-PLN-007', name: 'BA PHCS 4000 Plus L2', premium: 715.25, tier: 'Silver' },
  { id: 'L713-PLN-008', name: 'BA PHCS 6000 Core L3', premium: 560.9, tier: 'Silver' },
];
