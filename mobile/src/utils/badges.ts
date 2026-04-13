/**
 * Badge Engine — computes earned badges from a player's catch history.
 *
 * All logic runs client-side from local CatchRecord data. Works fully offline.
 * Add new badges by appending to BADGE_DEFS — no other changes needed.
 */

import type { CatchRecord } from '@/stores/catchStore';

export type Badge = {
  id: string;
  name: string;
  description: string;
  category: 'enthusiast' | 'collection' | 'rarity' | 'decade' | 'style';
  icon: string;                 // emoji
  color: string;                // accent color for the badge card
  earned: boolean;
  progress?: { current: number; total: number };
};

type BadgeDef = Omit<Badge, 'earned' | 'progress'> & {
  check: (catches: CatchRecord[]) => boolean;
  trackProgress?: (catches: CatchRecord[]) => { current: number; total: number };
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function byMake(make: string) {
  return (c: CatchRecord) => c.make.toLowerCase() === make.toLowerCase();
}

function byMakes(makes: string[]) {
  const set = new Set(makes.map(m => m.toLowerCase()));
  return (c: CatchRecord) => set.has(c.make.toLowerCase());
}

function hasModel(make: string, model: string) {
  return (catches: CatchRecord[]) =>
    catches.some(c =>
      c.make.toLowerCase() === make.toLowerCase() &&
      c.model.toLowerCase().includes(model.toLowerCase()),
    );
}

function distinctModels(predicate: (c: CatchRecord) => boolean) {
  return (catches: CatchRecord[]) =>
    new Set(catches.filter(predicate).map(c => `${c.make}|${c.model}`)).size;
}

function hasMakes(makes: string[]) {
  return (catches: CatchRecord[]) => {
    const caught = new Set(catches.map(c => c.make.toLowerCase()));
    return makes.every(m => caught.has(m.toLowerCase()));
  };
}

/** Extract the start year from a generation string like "XW50 (2019–present)" */
function genYear(generation: string): number | null {
  const m = generation.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : null;
}

function hasBodyStyles(styles: string[]) {
  const set = new Set(styles.map(s => s.toLowerCase()));
  return (catches: CatchRecord[]) => {
    const caught = new Set(catches.map(c => c.bodyStyle.toLowerCase()));
    return [...set].every(s => caught.has(s));
  };
}

// ─── Badge Definitions ───────────────────────────────────────────────────────

const BADGE_DEFS: BadgeDef[] = [

  // ── Enthusiast / Make ────────────────────────────────────────────────────

  {
    id: 'blue_oval',
    name: 'Blue Oval',
    description: 'Catch 5 different Ford models.',
    category: 'enthusiast',
    icon: '🔵',
    color: '#003478',
    check: c => distinctModels(byMake('Ford'))(c) >= 5,
    trackProgress: c => ({ current: Math.min(distinctModels(byMake('Ford'))(c), 5), total: 5 }),
  },
  {
    id: 'stang_gang',
    name: 'Stang Gang',
    description: 'Catch a Ford Mustang.',
    category: 'enthusiast',
    icon: '🐎',
    color: '#c8102e',
    check: hasModel('Ford', 'Mustang'),
  },
  {
    id: 'bronco_nation',
    name: 'Bronco Nation',
    description: 'Catch a Ford Bronco.',
    category: 'enthusiast',
    icon: '🤠',
    color: '#007bff',
    check: hasModel('Ford', 'Bronco'),
  },
  {
    id: 'jeep_life',
    name: 'Jeep Life',
    description: 'Catch 3+ Jeeps.',
    category: 'enthusiast',
    icon: '🪨',
    color: '#4a7c59',
    check: c => c.filter(byMake('Jeep')).length >= 3,
    trackProgress: c => ({ current: Math.min(c.filter(byMake('Jeep')).length, 3), total: 3 }),
  },
  {
    id: 'trail_rated',
    name: 'Trail Rated',
    description: 'Catch both a Wrangler and a Gladiator.',
    category: 'enthusiast',
    icon: '🏔️',
    color: '#2e7d32',
    check: c => hasModel('Jeep', 'Wrangler')(c) && hasModel('Jeep', 'Gladiator')(c),
  },
  {
    id: 'toyota_nation',
    name: 'Toyota Nation',
    description: 'Catch 5 different Toyota models.',
    category: 'enthusiast',
    icon: '🇯🇵',
    color: '#eb0a1e',
    check: c => distinctModels(byMake('Toyota'))(c) >= 5,
    trackProgress: c => ({ current: Math.min(distinctModels(byMake('Toyota'))(c), 5), total: 5 }),
  },
  {
    id: 'supra_club',
    name: 'Supra Club',
    description: 'Catch a Toyota GR Supra.',
    category: 'enthusiast',
    icon: '🏁',
    color: '#e50000',
    check: hasModel('Toyota', 'Supra'),
  },
  {
    id: 'tacoma_bro',
    name: 'Tacoma Bro',
    description: 'Catch a Toyota Tacoma.',
    category: 'enthusiast',
    icon: '🛻',
    color: '#b71c1c',
    check: hasModel('Toyota', 'Tacoma'),
  },
  {
    id: 'four_runner_faithful',
    name: '4Runner Faithful',
    description: 'Catch a Toyota 4Runner.',
    category: 'enthusiast',
    icon: '🏕️',
    color: '#827717',
    check: hasModel('Toyota', '4Runner'),
  },
  {
    id: 'bow_tie',
    name: 'Bow Tie',
    description: 'Catch 5 different Chevrolet models.',
    category: 'enthusiast',
    icon: '🏅',
    color: '#d4a017',
    check: c => distinctModels(byMake('Chevrolet'))(c) >= 5,
    trackProgress: c => ({ current: Math.min(distinctModels(byMake('Chevrolet'))(c), 5), total: 5 }),
  },
  {
    id: 'vette_owner',
    name: 'Vette Owner',
    description: 'Catch a Chevrolet Corvette.',
    category: 'enthusiast',
    icon: '⚡',
    color: '#f57f17',
    check: hasModel('Chevrolet', 'Corvette'),
  },
  {
    id: 'america_first',
    name: 'America First',
    description: 'Catch a Ford, Chevy, Ram, and GMC.',
    category: 'enthusiast',
    icon: '🦅',
    color: '#b22234',
    check: hasMakes(['Ford', 'Chevrolet', 'Ram', 'GMC']),
  },
  {
    id: 'german_precision',
    name: 'German Precision',
    description: 'Catch a BMW, Mercedes-Benz, Audi, and Porsche.',
    category: 'enthusiast',
    icon: '🇩🇪',
    color: '#000000',
    check: hasMakes(['BMW', 'Mercedes-Benz', 'Audi', 'Porsche']),
  },
  {
    id: 'stuttgart_spec',
    name: 'Stuttgart Spec',
    description: 'Catch a Porsche 911.',
    category: 'enthusiast',
    icon: '🏎️',
    color: '#8b0000',
    check: hasModel('Porsche', '911'),
  },
  {
    id: 'prancing_horse',
    name: 'Prancing Horse',
    description: 'Catch a Ferrari.',
    category: 'enthusiast',
    icon: '🐴',
    color: '#cc0000',
    check: c => c.some(byMake('Ferrari')),
  },
  {
    id: 'raging_bull',
    name: 'Raging Bull',
    description: 'Catch a Lamborghini.',
    category: 'enthusiast',
    icon: '🐂',
    color: '#ffd700',
    check: c => c.some(byMake('Lamborghini')),
  },
  {
    id: 'rising_sun',
    name: 'Rising Sun',
    description: 'Catch 5+ Japanese brand vehicles.',
    category: 'enthusiast',
    icon: '🌅',
    color: '#bc002d',
    check: c => c.filter(byMakes(['Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Lexus', 'Acura', 'Infiniti', 'Mitsubishi'])).length >= 5,
    trackProgress: c => ({
      current: Math.min(c.filter(byMakes(['Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Lexus', 'Acura', 'Infiniti', 'Mitsubishi'])).length, 5),
      total: 5,
    }),
  },
  {
    id: 'korean_wave',
    name: 'Korean Wave',
    description: 'Catch a Hyundai, Kia, and Genesis.',
    category: 'enthusiast',
    icon: '🇰🇷',
    color: '#003478',
    check: hasMakes(['Hyundai', 'Kia', 'Genesis']),
  },
  {
    id: 'wrx_club',
    name: 'WRX Club',
    description: 'Catch a Subaru WRX.',
    category: 'enthusiast',
    icon: '🌊',
    color: '#1565c0',
    check: hasModel('Subaru', 'WRX'),
  },
  {
    id: 'gt_r_spotter',
    name: 'GT-R Spotter',
    description: 'Catch a Nissan GT-R. Godzilla walks among us.',
    category: 'enthusiast',
    icon: '🦖',
    color: '#880e4f',
    check: hasModel('Nissan', 'GT-R'),
  },
  {
    id: 'tesla_fleet',
    name: 'Tesla Fleet',
    description: 'Catch 3 different Tesla models.',
    category: 'enthusiast',
    icon: '⚡',
    color: '#cc0000',
    check: c => distinctModels(byMake('Tesla'))(c) >= 3,
    trackProgress: c => ({ current: Math.min(distinctModels(byMake('Tesla'))(c), 3), total: 3 }),
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Catch a Tesla Cybertruck.',
    category: 'enthusiast',
    icon: '🤖',
    color: '#607d8b',
    check: hasModel('Tesla', 'Cybertruck'),
  },
  {
    id: 'miata_is_always_the_answer',
    name: 'Miata Is Always the Answer',
    description: 'Catch a Mazda MX-5 Miata.',
    category: 'enthusiast',
    icon: '🎌',
    color: '#e53935',
    check: hasModel('Mazda', 'MX-5'),
  },

  // ── Style ────────────────────────────────────────────────────────────────

  {
    id: 'truck_life',
    name: 'Truck Life',
    description: 'Catch 5+ trucks.',
    category: 'style',
    icon: '🛻',
    color: '#5d4037',
    check: c => c.filter(x => x.bodyStyle.toLowerCase() === 'truck').length >= 5,
    trackProgress: c => ({
      current: Math.min(c.filter(x => x.bodyStyle.toLowerCase() === 'truck').length, 5),
      total: 5,
    }),
  },
  {
    id: 'coupe_de_grace',
    name: 'Coupé de Grâce',
    description: 'Catch 5+ coupes.',
    category: 'style',
    icon: '🏆',
    color: '#4a148c',
    check: c => c.filter(x => x.bodyStyle.toLowerCase() === 'coupe').length >= 5,
    trackProgress: c => ({
      current: Math.min(c.filter(x => x.bodyStyle.toLowerCase() === 'coupe').length, 5),
      total: 5,
    }),
  },
  {
    id: 'body_builder',
    name: 'Body Builder',
    description: 'Catch all 6 body styles.',
    category: 'style',
    icon: '📐',
    color: '#00695c',
    check: hasBodyStyles(['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'Convertible']),
    trackProgress: c => {
      const styles = ['sedan', 'suv', 'truck', 'coupe', 'hatchback', 'convertible'];
      const caught = new Set(c.map(x => x.bodyStyle.toLowerCase()));
      return { current: styles.filter(s => caught.has(s)).length, total: 6 };
    },
  },
  {
    id: 'drop_top',
    name: 'Drop Top',
    description: 'Catch a convertible.',
    category: 'style',
    icon: '🌞',
    color: '#e65100',
    check: c => c.some(x => x.bodyStyle.toLowerCase() === 'convertible'),
  },

  // ── Rarity ───────────────────────────────────────────────────────────────

  {
    id: 'first_catch',
    name: 'First Catch',
    description: 'Catch your first vehicle.',
    category: 'rarity',
    icon: '🎣',
    color: '#455a64',
    check: c => c.length >= 1,
  },
  {
    id: 'road_scholar',
    name: 'Road Scholar',
    description: 'Catch 25 vehicles.',
    category: 'rarity',
    icon: '📚',
    color: '#37474f',
    check: c => c.length >= 25,
    trackProgress: c => ({ current: Math.min(c.length, 25), total: 25 }),
  },
  {
    id: 'garage_king',
    name: 'Garage King',
    description: 'Catch 50 vehicles.',
    category: 'rarity',
    icon: '👑',
    color: '#f57f17',
    check: c => c.length >= 50,
    trackProgress: c => ({ current: Math.min(c.length, 50), total: 50 }),
  },
  {
    id: 'rare_find',
    name: 'Rare Find',
    description: 'Catch a rare or better vehicle.',
    category: 'rarity',
    icon: '💎',
    color: '#6a1b9a',
    check: c => c.some(x => x.rarity && ['rare', 'epic', 'legendary'].includes(x.rarity)),
  },
  {
    id: 'epic_taste',
    name: 'Epic Taste',
    description: 'Catch 3 epic vehicles.',
    category: 'rarity',
    icon: '🔮',
    color: '#f59e0b',
    check: c => c.filter(x => x.rarity === 'epic').length >= 3,
    trackProgress: c => ({ current: Math.min(c.filter(x => x.rarity === 'epic').length, 3), total: 3 }),
  },
  {
    id: 'legend_seeker',
    name: 'Legend Seeker',
    description: 'Catch a legendary vehicle.',
    category: 'rarity',
    icon: '🌟',
    color: '#e63946',
    check: c => c.some(x => x.rarity === 'legendary'),
  },
  {
    id: 'full_spectrum',
    name: 'Full Spectrum',
    description: 'Catch one of each rarity tier.',
    category: 'rarity',
    icon: '🌈',
    color: '#00897b',
    check: c => {
      const tiers = new Set(c.map(x => x.rarity).filter(Boolean));
      return ['common', 'uncommon', 'rare', 'epic', 'legendary'].every(t => tiers.has(t));
    },
    trackProgress: c => {
      const tiers = new Set(c.map(x => x.rarity).filter(Boolean));
      return { current: ['common', 'uncommon', 'rare', 'epic', 'legendary'].filter(t => tiers.has(t)).length, total: 5 };
    },
  },

  // ── Decade ───────────────────────────────────────────────────────────────

  {
    id: 'classic_eye',
    name: 'Classic Eye',
    description: 'Catch a vehicle from a pre-2000 generation.',
    category: 'decade',
    icon: '🕰️',
    color: '#795548',
    check: c => c.some(x => {
      const y = genYear(x.generation);
      return y !== null && y < 2000;
    }),
  },
  {
    id: 'aughts_kid',
    name: 'Aughts Kid',
    description: 'Catch a 2000–2009 generation vehicle.',
    category: 'decade',
    icon: '📼',
    color: '#5c6bc0',
    check: c => c.some(x => {
      const y = genYear(x.generation);
      return y !== null && y >= 2000 && y <= 2009;
    }),
  },
  {
    id: 'tens_collector',
    name: "2010s Collector",
    description: 'Catch a 2010–2019 generation vehicle.',
    category: 'decade',
    icon: '📱',
    color: '#26a69a',
    check: c => c.some(x => {
      const y = genYear(x.generation);
      return y !== null && y >= 2010 && y <= 2019;
    }),
  },
  {
    id: 'new_decade',
    name: 'New Decade',
    description: 'Catch a 2020+ generation vehicle.',
    category: 'decade',
    icon: '🚀',
    color: '#1565c0',
    check: c => c.some(x => {
      const y = genYear(x.generation);
      return y !== null && y >= 2020;
    }),
  },
];

// ─── Public API ──────────────────────────────────────────────────────────────

/** Compute all badges, marking each as earned/not-earned with optional progress. */
export function computeBadges(catches: CatchRecord[]): Badge[] {
  return BADGE_DEFS.map(def => ({
    id:          def.id,
    name:        def.name,
    description: def.description,
    category:    def.category,
    icon:        def.icon,
    color:       def.color,
    earned:      def.check(catches),
    progress:    def.trackProgress?.(catches),
  }));
}

/** Subset of badges that have been earned. */
export function earnedBadges(catches: CatchRecord[]): Badge[] {
  return computeBadges(catches).filter(b => b.earned);
}

export const BADGE_CATEGORIES = ['enthusiast', 'collection', 'rarity', 'decade', 'style'] as const;
export type BadgeCategory = typeof BADGE_CATEGORIES[number];
