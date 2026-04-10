import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/api/client';
import { usePlayerStore } from '@/stores/playerStore';

export type CatchRecord = {
  id: string;
  make: string;
  model: string;
  generation: string;
  generationId: string | null;   // resolved from vehicle DB; null until synced
  bodyStyle: string;
  color: string;
  confidence: number;
  catchType: 'highway' | 'scan360' | 'space' | 'unknown';
  fuzzyCity?: string;
  caughtAt: string;
  synced: boolean;
  xpEarned?: number;             // set after successful backend sync
  firstFinderAwarded?: string | null;
};

type ResolveResult  = { generation_id: string | null; rarity_tier: string | null };
type CatchResponse  = {
  catch_id: string;
  xp_earned: number;
  new_total_xp: number;
  level_up: boolean;
  road_king_claimed: boolean;
  first_finder_awarded: string | null;
  duplicate: boolean;
};

async function resolveGenerationId(
  make: string,
  model: string,
  generation: string,
): Promise<string | null> {
  try {
    const params = new URLSearchParams({ make, model, generation });
    const res = await apiClient.get(`/vehicles/resolve?${params}`) as ResolveResult;
    return res.generation_id ?? null;
  } catch {
    return null;
  }
}

type CatchStore = {
  catches: CatchRecord[];
  addCatch: (data: Omit<CatchRecord, 'id' | 'caughtAt' | 'synced' | 'generationId'>) => void;
  syncPending: () => Promise<void>;
};

export const useCatchStore = create<CatchStore>()(
  persist(
    (set, get) => ({
      catches: [],

      addCatch(data) {
        const record: CatchRecord = {
          ...data,
          generationId: null,
          id:       `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          caughtAt: new Date().toISOString(),
          synced:   false,
        };
        set(s => ({ catches: [record, ...s.catches] }));
        get().syncPending().catch(() => {});
      },

      async syncPending() {
        const pending = get().catches.filter(c => !c.synced);
        for (const catch_ of pending) {
          try {
            // Resolve generation ID if not yet known
            let generationId = catch_.generationId;
            if (!generationId) {
              generationId = await resolveGenerationId(
                catch_.make, catch_.model, catch_.generation,
              );
              if (generationId) {
                set(s => ({
                  catches: s.catches.map(c =>
                    c.id === catch_.id ? { ...c, generationId } : c,
                  ),
                }));
              }
            }

            const res = await apiClient.post('/catches', {
              generation_id: generationId,
              catch_type:    catch_.catchType,
              color:         catch_.color,
              body_style:    catch_.bodyStyle,
              confidence:    catch_.confidence,
              fuzzy_city:    catch_.fuzzyCity ?? null,
              caught_at:     catch_.caughtAt,
            }) as CatchResponse;

            // Apply XP to player state
            if (res.xp_earned > 0) {
              const levelArg = res.level_up ? Math.floor(res.new_total_xp / 1000) + 1 : undefined;
              usePlayerStore.getState().applyXp(res.xp_earned, levelArg);
            }

            set(s => ({
              catches: s.catches.map(c =>
                c.id === catch_.id
                  ? { ...c, synced: true, xpEarned: res.xp_earned, firstFinderAwarded: res.first_finder_awarded }
                  : c,
              ),
            }));
          } catch {
            // Network unavailable — will retry on next call
          }
        }
      },
    }),
    {
      name: 'catch-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
