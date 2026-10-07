export type PlanId = 'free' | 'premium';

export interface PlanLimit {
  dailyUses: number;
  maxFileSize: number; // in MB
  batchProcessing: boolean;
  maxBatchSize: number;
}

export interface PricingPlan {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  priceLifetime?: number;
  subtitle: string;
  badge?: string;
  features: string[];
  limits: PlanLimit;
}

export const PRICING_PLANS: Record<PlanId, PricingPlan> = {
  free: {
    id: 'free',
    name: 'Free Plan',
    priceMonthly: 0,
    priceYearly: 0,
    subtitle: 'Private, fast browser-based tools',
    features: [
      '5 uses/day across all tools',
      'Browser-local processing',
      'No watermarks on exported files',
      'Basic cleaning options',
      'Small batch (5 images)',
      'Standard processing',
    ],
    limits: {
      dailyUses: 5,
      maxFileSize: 50, // 50MB limit
      batchProcessing: true,
      maxBatchSize: 5,
    }
  },
  premium: {
    id: 'premium',
    name: 'Calcora Premium',
    priceMonthly: 4.99,
    priceYearly: 39.00,
    priceLifetime: 99.00,
    subtitle: 'Launch Special Pricing',
    badge: 'LAUNCH OFFER',
    features: [
      '500 uses/day',
      'Larger file sizes (up to 1GB)',
      'Large batch (100 images)',
      'Longer videos + high-res',
      'Advanced cleaning + crop overlays',
    ],
    limits: {
      dailyUses: 500,
      maxFileSize: 1000, // 1GB
      batchProcessing: true,
      maxBatchSize: 100,
    }
  }
};

export const getPlanLimits = (planId: PlanId): PlanLimit => {
  return PRICING_PLANS[planId].limits;
};

