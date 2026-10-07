import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlanId, getPlanLimits } from '../config/pricing';
import { safeStorage } from '../utils/storage';

interface UsageRecord {
  date: string;
  count: number;
}

interface PlanState {
  activePlan: PlanId;
  usage: Record<string, UsageRecord>;
  setActivePlan: (plan: PlanId) => void;
  activatePremiumFromToken: (token: string) => boolean;
  checkPremiumStatus: () => boolean;
  consumeUsage: (toolId: string) => void;
  getUsageCount: () => number;
  canUseTool: (toolId: string) => boolean;
  canBatchProcess: () => boolean;
  getMaxFileSize: () => number;
  getRemainingUses: () => number;
}

const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

// Token validation — checks if token is present and not expired
const validateToken = (token: string): boolean => {
  if (!token || token.length < 3) return false;
  const expiry = safeStorage.getItem('calcora_premium_expiry');
  if (!expiry) return false;
  const expiryDate = new Date(expiry);
  if (expiryDate < new Date()) return false;
  return true;
};

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      activePlan: 'free',
      usage: {},

      // Kept for backwards compatibility — but does NOT unlock premium locally
      setActivePlan: (_plan) => {
        // Only allow if valid token exists
        const token = safeStorage.getItem('calcora_premium_token');
        if (_plan === 'premium' && token && validateToken(token)) {
          set({ activePlan: 'premium' });
          return;
        }
        set({ activePlan: 'free' });
      },

      // NEW: Activate premium from a valid token (used by PremiumHandler)
      activatePremiumFromToken: (token) => {
        if (!token || token.length < 3) return false;
        
        try {
          safeStorage.setItem('calcora_premium_token', token);
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          safeStorage.setItem('calcora_premium_expiry', expiryDate.toISOString());
          set({ activePlan: 'premium' });
          return true;
        } catch {
          return false;
        }
      },

      // NEW: Check on app load if user has valid premium token
      checkPremiumStatus: () => {
        const token = safeStorage.getItem('calcora_premium_token');
        if (!token) return false;
        
        const isValid = validateToken(token);
        if (isValid) {
          set({ activePlan: 'premium' });
          return true;
        } else {
          // Token expired — clear it
          safeStorage.removeItem('calcora_premium_token');
          safeStorage.removeItem('calcora_premium_expiry');
          set({ activePlan: 'free' });
          return false;
        }
      },

      consumeUsage: (toolId) => {
        const today = getTodayDateString();
        set((state) => {
          const key = 'global';
          const currentRecord = state.usage[key];
          const isToday = currentRecord?.date === today;
          return {
            usage: {
              ...state.usage,
              [key]: {
                date: today,
                count: isToday ? currentRecord.count + 1 : 1,
              },
            },
          };
        });
      },

      getUsageCount: () => {
        const today = getTodayDateString();
        const key = 'global';
        const record = get().usage[key];
        if (record?.date === today) {
          return record.count;
        }
        return 0;
      },

      canUseTool: (toolId) => {
        const limits = getPlanLimits(get().activePlan);
        const currentUsage = get().getUsageCount();
        return currentUsage < limits.dailyUses;
      },

      canBatchProcess: () => {
        return getPlanLimits(get().activePlan).batchProcessing;
      },

      getMaxFileSize: () => {
        return getPlanLimits(get().activePlan).maxFileSize;
      },

      getRemainingUses: () => {
        const limits = getPlanLimits(get().activePlan);
        const currentUsage = get().getUsageCount();
        const remaining = limits.dailyUses - currentUsage;
        return remaining > 0 ? remaining : 0;
      }
    }),
    {
      name: 'plan-storage',
    }
  )
);