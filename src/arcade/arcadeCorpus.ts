import { ArcadeDifficulty, ArcadeModeId, ArcadeTextPassage } from './arcadeTypes';
import { safeStorage } from '../utils/safeStorage';

const RECENT_PASSAGES_STORAGE_KEY = 'typing_arcade_recent_texts_v1';
const MAX_RECENT_HISTORY = 24;

// In-memory mirror so zero-repeat works cleanly in non-DOM/QA environments as well
let memoryRecentIds: string[] = [];
let dynamicMixCounter = 0;

function computeDifficultyAttrs(content: string, tier: ArcadeDifficulty) {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const totalWordChars = words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z0-9]/g, '').length, 0);
  const avgWordLength = words.length > 0 ? Number((totalWordChars / words.length).toFixed(2)) : 4;
  const punctuationCount = (content.match(/[^a-zA-Z0-9\s]/g) || []).length;
  const punctuationDensity = content.length > 0 ? Number((punctuationCount / content.length).toFixed(3)) : 0;

  return {
    avgWordLength,
    punctuationDensity,
    tier,
  };
}

interface RawPassage {
  textId: string;
  title: string;
  tier: ArcadeDifficulty;
  recommendedModes: ArcadeModeId[];
  content: string;
}

const RAW_CORPUS_V1: RawPassage[] = [
  // =========================================================================
  // ORIGINAL 15 IMMUTABLE PASSAGES (E9: NEVER MUTATED)
  // =========================================================================
  {
    textId: 'ta-v1-0001-std-horizon',
    title: 'Clear Signal',
    tier: 'standard',
    recommendedModes: ['classic', 'rhythm'],
    content:
      'Steady hands build reliable speed long before quick bursts ever do. Keep your wrists relaxed, let each finger return smoothly to its home anchor, and trust clean motion over frantic effort while every word flows forward without hesitation.',
  },
  {
    textId: 'ta-v1-0002-std-craft',
    title: 'Workshop Cadence',
    tier: 'standard',
    recommendedModes: ['classic', 'rhythm', 'accuracy_master'],
    content:
      'Good typing feels like quiet percussion on a calm morning. When your eyes read half a phrase ahead of your fingers, the keyboard stops feeling like a wall of letters and turns into a direct lane for clear thought and steady rhythm.',
  },
  {
    textId: 'ta-v1-0003-std-harbor',
    title: 'Harbor Lights',
    tier: 'standard',
    recommendedModes: ['classic', 'rhythm'],
    content:
      'Early ferries glide across flat water while dock crews coil thick ropes along the timber pier. Warm light spills across the stone walkway, marking the quiet start of another busy coastal day before the market doors swing wide open.',
  },
  {
    textId: 'ta-v1-0004-std-sprint-a',
    title: 'Velocity Stream Alpha',
    tier: 'standard',
    recommendedModes: ['speed_rush', 'classic'],
    content:
      'quick spark bright lane fast pace clean beat move forward sharp focus clear sight warm glow brisk wind swift glide light step pure flow strong drive open road bold leap true form rapid pulse calm mind neat line smart play crisp strike sure grip',
  },
  {
    textId: 'ta-v1-0005-std-sprint-b',
    title: 'Velocity Stream Beta',
    tier: 'standard',
    recommendedModes: ['speed_rush'],
    content:
      'clock ticks fast while clean strokes stack higher every second. keep breathing smooth, keep shoulders loose, and carry momentum from one short word straight into the next without breaking stride or rushing past the final letter of each phrase',
  },
  {
    textId: 'ta-v1-0006-pre-optics',
    title: 'Precision Optics',
    tier: 'precision',
    recommendedModes: ['classic', 'accuracy_master', 'challenge'],
    content:
      'Calibrating an optical bench requires patience, measured turns, and exact verification at every joint. Even a half-millimeter offset shifts the focal beam across the sensor grid, proving that deliberate accuracy always outpaces careless speed.',
  },
  {
    textId: 'ta-v1-0007-pre-ledger',
    title: 'Signal Ledger',
    tier: 'precision',
    recommendedModes: ['accuracy_master', 'classic', 'challenge'],
    content:
      'Every recorded run carries its exact timestamp, character count, and keystroke cadence. When scoring rules stay consistent from day one, players can trust that a personal record earned today reflects real, measurable progress over last month.',
  },
  {
    textId: 'ta-v1-0008-pre-metronome',
    title: 'Even Tempo',
    tier: 'precision',
    recommendedModes: ['rhythm', 'accuracy_master'],
    content:
      'Rhythm separates effortless typing from exhausting sprints. Instead of hammering easy words and stalling on awkward pairs, aim for an even pulse across every syllable so your fingers glide cleanly through vowels, consonants, and spaces alike.',
  },
  {
    textId: 'ta-v1-0009-pre-sprint-c',
    title: 'Turbo Cadence',
    tier: 'precision',
    recommendedModes: ['speed_rush', 'rhythm'],
    content:
      'momentum rewards balance: push the pace on familiar patterns, hold crisp control through double letters, and anchor every sentence with clean spacing. steady acceleration turns sixty seconds of focused typing into a high-velocity personal record.',
  },
  {
    textId: 'ta-v1-0010-pre-observatory',
    title: 'Night Observatory',
    tier: 'precision',
    recommendedModes: ['classic', 'challenge'],
    content:
      'High above the valley mist, the dome rotates silently toward the eastern ridge. Brass dials click into position, shutters part to reveal crisp starlight, and observers log coordinates with calm, methodical precision throughout the cold watch.',
  },
  {
    textId: 'ta-v1-0011-mst-protocol',
    title: 'Deterministic Replay',
    tier: 'master',
    recommendedModes: ['challenge', 'classic', 'accuracy_master'],
    content:
      'Deterministic verification replays each keystroke (timestamp, expected glyph, and actual input) against an immutable corpus snapshot. When latency stays below 16ms and drift stays under 0.5%, competitive leaderboards earn lasting player trust.',
  },
  {
    textId: 'ta-v1-0012-mst-telemetry',
    title: 'Flight Telemetry',
    tier: 'master',
    recommendedModes: ['challenge', 'classic'],
    content:
      'Altitude: 14,250m; heading: 084 degrees; crosswind: 18 knots from the northwest. Crew systems report nominal pressure across loops A-1 through C-4, confirming zero drift across three consecutive checkpoints before final descent clearance.',
  },
  {
    textId: 'ta-v1-0013-mst-foundry',
    title: 'Type Foundry',
    tier: 'master',
    recommendedModes: ['challenge', 'accuracy_master'],
    content:
      'Punchcutters carved steel matrices by hand—balancing counter-space, serif brackets, and optical weight at 10-point scale! That same respect for proportion governs modern monospace interfaces where aligned numerals prevent visual jitter.',
  },
  {
    textId: 'ta-v1-0014-mst-gauntlet',
    title: 'Iron Gauntlet',
    tier: 'master',
    recommendedModes: ['challenge', 'speed_rush'],
    content:
      'Synthesizing complex clauses requires rapid alternation between Shift-modified symbols, numeric pairs (2026/04), and uncommon consonant clusters like "rhythm", "zephyr", and "quixotic". Maintain composure, respect punctuation, and finish strong.',
  },
  {
    textId: 'ta-v1-0015-mst-chronograph',
    title: 'Chronograph Calibration',
    tier: 'master',
    recommendedModes: ['challenge', 'rhythm', 'accuracy_master'],
    content:
      'A mechanical chronograph measures fifths of a second via nested gears, jeweled pivots, and a hairspring oscillating at 28,800 beats/hour. Precision engineering thrives on repeatable tolerances—never shortcuts, never guesswork, always proof.',
  },

  // =========================================================================
  // EXPANDED CURATED DECK (21 NEW ORIGINAL PASSAGES -> 36 TOTAL)
  // =========================================================================

  // LONG-FORM SPEED RUSH SPRINTS (440-540 CHARS SO 100+ WPM TYPISTS STAY ENGAGED)
  {
    textId: 'ta-v1-0016-std-nitro-run',
    title: 'Midnight Expressway',
    tier: 'standard',
    recommendedModes: ['speed_rush'],
    content:
      'Headlights cut through cool night air as clean lanes stretch toward the bright skyline ahead. Keep your eyes scanning two words forward while each hand trades strokes in smooth, balanced bursts. Never slam keys when speed rises; light taps recover faster and carry momentum from corner to corner. Hold steady breathing, clear every open gap with calm focus, and let crisp spacing fuel your surge all the way to the final marker.',
  },
  {
    textId: 'ta-v1-0017-std-nitro-overpass',
    title: 'Coastal Overpass',
    tier: 'standard',
    recommendedModes: ['speed_rush'],
    content:
      'Salt wind sweeps across the elevated bridge while amber lamps flicker past in even rhythm. Smooth typing is built from relaxed shoulders, quick home-row returns, and quiet confidence on common letter pairs. Watch the next short phrase come into view before finishing the current word so your fingers never pause to search. Stay light, stay fluid, and carry clean speed straight down the open highway until the clock hits zero.',
  },
  {
    textId: 'ta-v1-0018-std-nitro-tunnel',
    title: 'Bayview Tunnel Sprint',
    tier: 'standard',
    recommendedModes: ['speed_rush'],
    content:
      'Golden ceiling strips blur into bright ribbons as traffic spreads across three wide lanes. Fast runners win by avoiding sudden hesitation rather than forcing risky bursts that trigger slips. Let familiar words roll effortlessly off both hands, keep your thumbs poised over the spacebar, and guide every line cleanly through the turn. Every steady second adds distance, builds streak power, and pushes your personal speed higher.',
  },
  {
    textId: 'ta-v1-0019-pre-nitro-apex',
    title: 'Apex Corridor',
    tier: 'precision',
    recommendedModes: ['speed_rush'],
    content:
      'Precision at high velocity demands clean transitions between short vowels, double consonants, and crisp punctuation marks. When a highway narrows into a fast chicane, experienced drivers look far ahead toward the exit rather than staring at the front bumper. Treat each phrase the exact same way: lock onto upcoming syllables, keep your cadence unbroken across commas, and carry high accuracy all the way across the sixty-second sprint finish line.',
  },
  {
    textId: 'ta-v1-0020-pre-nitro-slipstream',
    title: 'Slipstream Circuit',
    tier: 'precision',
    recommendedModes: ['speed_rush'],
    content:
      'Aerodynamic drafting works because smooth airflow wastes less energy than turbulent resistance. On the keyboard, unnecessary tension in your forearms creates friction that drags down top speed after twenty seconds. Unclench your jaw, float your fingertips just above the switches, and glide through mixed clauses with measured authority. Clean keystrokes stack faster than frantic corrections, turning disciplined control into blistering net speed.',
  },
  {
    textId: 'ta-v1-0021-mst-nitro-autobahn',
    title: 'Telemetry Autobahn',
    tier: 'master',
    recommendedModes: ['speed_rush', 'challenge'],
    content:
      'Sector 04 telemetry confirms 248 km/h velocity across wet asphalt with crosswinds gusting at 14.5 knots. Maintain zero-drift steering through lanes A, B, and C while shifting seamlessly between uppercase callsigns, hyphenated metrics, and tight numeric pairs (100%, 0.4s, 96-BPM). True mastery combines ruthless pace with surgical restraint: anticipate every symbol half a beat early, absorb sudden spikes without panic, and finish with pristine accuracy.',
  },

  // STANDARD TIER (SKYLINE RUNNER, RHYTHM, ACCURACY)
  {
    textId: 'ta-v1-0022-std-rooftop',
    title: 'Twilight Courier',
    tier: 'standard',
    recommendedModes: ['classic', 'rhythm'],
    content:
      'Across the slate rooftops, cool evening breezes ripple past radio masts and glowing skylight glass. Every confident stride clears the gap between old brick towers while warm streetlights flicker awake along the avenues far below.',
  },
  {
    textId: 'ta-v1-0023-std-lantern',
    title: 'Station Platform',
    tier: 'standard',
    recommendedModes: ['classic', 'accuracy_master'],
    content:
      'A silver commuter train eases along the curved iron track as brass clocks chime the top of the hour. Travelers step calmly through sliding doors, carrying folded newspapers, warm coffee cups, and quiet plans for the afternoon.',
  },
  {
    textId: 'ta-v1-0024-std-breeze',
    title: 'Cedar Trail',
    tier: 'standard',
    recommendedModes: ['classic', 'rhythm', 'accuracy_master'],
    content:
      'Sunlight filters through tall cedar branches and paints shifting gold patterns over the mossy path. Clear mountain air keeps your pace unhurried as every steady footstep climbs toward the timber lookout above the quiet canyon.',
  },
  {
    textId: 'ta-v1-0025-std-pulse',
    title: 'Studio Session',
    tier: 'standard',
    recommendedModes: ['rhythm', 'classic'],
    content:
      'Warm analog bass lines lock tightly with brushed snare hits inside the cedar-lined control room. When every musician listens closely to the shared pocket, even simple melodies feel alive, balanced, and completely effortless.',
  },
  {
    textId: 'ta-v1-0026-std-bridge',
    title: 'River Crossing',
    tier: 'standard',
    recommendedModes: ['classic', 'accuracy_master', 'rhythm'],
    content:
      'Steel suspension cables hum softly in the brisk morning wind above the winding green river. Barges drift steadily beneath the central arch while bright reflection ribbons dance across the gentle ripples near the granite shore.',
  },

  // PRECISION TIER (ORBITAL AEGIS, RHYTHM, CLASSIC, CHALLENGE)
  {
    textId: 'ta-v1-0027-pre-aegis',
    title: 'Orbital Relay',
    tier: 'precision',
    recommendedModes: ['accuracy_master', 'classic'],
    content:
      'Deep-space relays align their parabolic mirrors within fractions of an arcsecond before transmitting packet bursts home. One stray bit corrupts the entire checksum, so flight engineers prize calm, repeatable discipline over haste.',
  },
  {
    textId: 'ta-v1-0028-pre-cartography',
    title: 'Coastal Charting',
    tier: 'precision',
    recommendedModes: ['accuracy_master', 'classic', 'challenge'],
    content:
      'Modern hydrographers combine sonar sweeps, tidal gauges, and satellite altimetry to map shifting sandbars along busy shipping channels. Reliable navigation depends on verified soundings, clear annotations, and zero guesswork.',
  },
  {
    textId: 'ta-v1-0029-pre-acoustics',
    title: 'Concert Acoustics',
    tier: 'precision',
    recommendedModes: ['rhythm', 'accuracy_master'],
    content:
      'Curved birch panels suspended above the symphony stage guide subtle overtones evenly toward every balcony row. Good timing mirrors fine acoustics: balanced spacing lets each note breathe without crowding the phrase that follows.',
  },
  {
    textId: 'ta-v1-0030-pre-glider',
    title: 'Thermal Soaring',
    tier: 'precision',
    recommendedModes: ['classic', 'rhythm'],
    content:
      'Sailplane pilots read cloud shadows and rising dust columns to locate warm columns of ascending ridge air. By banking smoothly into each thermal without abrupt rudder corrections, they convert quiet patience into effortless altitude.',
  },
  {
    textId: 'ta-v1-0031-pre-clockwork',
    title: 'Escapement Rhythm',
    tier: 'precision',
    recommendedModes: ['rhythm', 'accuracy_master', 'challenge'],
    content:
      'Inside a marine chronometer, the escapement releases stored spring tension in crisp, identical pulses despite rolling ocean swells. Consistent intervals build accuracy automatically, whether measuring longitude or typing complex sentences.',
  },

  // MASTER TIER (TITAN SIEGE, ACCURACY MASTER, CLASSIC)
  {
    textId: 'ta-v1-0032-mst-reactor',
    title: 'Reactor Containment',
    tier: 'master',
    recommendedModes: ['challenge', 'accuracy_master'],
    content:
      'Coolant flow stabilized at 4,820 L/min (delta-T: 19.4 C) across primary manifolds #1 and #2. Auxiliary baffles engage automatically whenever pressure exceeds 12.6 MPa, keeping core resonance safely inside nominal safety bounds.',
  },
  {
    textId: 'ta-v1-0033-mst-cipher',
    title: 'Checksum Audit',
    tier: 'master',
    recommendedModes: ['challenge', 'classic', 'accuracy_master'],
    content:
      'Cryptographic ledgers chain immutable hashes (SHA-256) so altering a single comma invalidates every downstream block! Auditors verify signatures, timestamps, and nonce entropy in milliseconds before sealing the final checkpoint.',
  },
  {
    textId: 'ta-v1-0034-mst-orbital',
    title: 'Perigee Burn',
    tier: 'master',
    recommendedModes: ['challenge', 'classic'],
    content:
      'Ignition T-00:00:03; thruster gimbal locked at +1.25 deg pitch, -0.08 deg yaw! Telemetry packets stream down the Ka-band carrier at 64.8 Mbps as the probe executes a crisp 42-second burn to circularize its lunar transfer orbit.',
  },
  {
    textId: 'ta-v1-0035-mst-architecture',
    title: 'Seismic Dampers',
    tier: 'master',
    recommendedModes: ['challenge', 'rhythm', 'classic'],
    content:
      'A 660-metric-ton tuned mass damper hangs between floors 87 and 92 on braided steel cables—counteracting typhoon sway by up to 40%! Structural engineers model harmonic frequencies with ruthless rigor so tall towers stay calm in high gusts.',
  },
  {
    textId: 'ta-v1-0036-mst-prism',
    title: 'Spectrometer Array',
    tier: 'master',
    recommendedModes: ['challenge', 'accuracy_master', 'rhythm'],
    content:
      'Diffraction gratings split faint starlight into crisp emission lines (486.1 nm, 656.3 nm), revealing atmospheric sodium, iron, and methane across distant exoplanets. High-contrast data demands steady calibration and zero stray noise.',
  },
];

export const ARCADE_CORPUS_V1: ArcadeTextPassage[] = RAW_CORPUS_V1.map((raw) => ({
  textId: raw.textId,
  textVersion: 1,
  title: raw.title,
  content: raw.content,
  difficultyAttrs: computeDifficultyAttrs(raw.content, raw.tier),
  license: 'Original',
  source: 'Typing Arcade Curated Corpus v1 (CC0 / Original)',
  isActive: true,
  recommendedModes: raw.recommendedModes,
}));

// =========================================================================
// RECENT-PASSAGE ZERO-REPEAT TRACKER
// =========================================================================
export function getRecentPassageIds(): string[] {
  const saved = safeStorage.getItem(RECENT_PASSAGES_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((x): x is string => typeof x === 'string');
        memoryRecentIds = clean;
        return clean;
      }
    } catch {
      // Ignore malformed storage
    }
  }
  return [...memoryRecentIds];
}

export function markPassageSeen(textId: string): void {
  const current = getRecentPassageIds().filter((id) => id !== textId);
  current.unshift(textId);
  const trimmed = current.slice(0, MAX_RECENT_HISTORY);
  memoryRecentIds = trimmed;
  safeStorage.setItem(RECENT_PASSAGES_STORAGE_KEY, JSON.stringify(trimmed));
}

export function clearRecentPassageIds(): void {
  memoryRecentIds = [];
  safeStorage.removeItem(RECENT_PASSAGES_STORAGE_KEY);
}

// =========================================================================
// DYNAMIC CLAUSE COMPOSER (ENDLESS UNSEEN PARAGRAPHS ONCE DECK EXHAUSTED)
// =========================================================================
const CLAUSE_BANKS: Record<ArcadeDifficulty, { openings: string[]; middles: string[]; closings: string[] }> = {
  standard: {
    openings: [
      'Bright morning light spills across the wide avenue as early runners find an easy stride.',
      'Cool evening air sweeps over the quiet harbor while ferry beacons blink in steady rhythm.',
      'Smooth keyboards reward calm wrists and clear focus far more than tense rushes ever could.',
      'Golden lamps trace clean curves along the hillside road while traffic flows in open lanes.',
      'Clear skies stretch above the timber bridge as soft winds ripple across the sunlit water.',
      'Balanced fingers glide effortlessly between short vowels and crisp spaces on every clean line.',
    ],
    middles: [
      'When your eyes read two words ahead of your hands, sudden pauses vanish and steady momentum takes over naturally.',
      'Relaxed shoulders keep your stroke light so fast sections feel calm, smooth, and controlled from start to finish.',
      'Each clean word builds quiet confidence, letting both hands share the workload without crowding awkward corners.',
      'Keeping an even pace across familiar patterns prevents sloppy slips and turns practice into effortless flow.',
      'Small gains in spacing and posture add up quickly once you stop fighting the keys and trust your home-row anchors.',
      'Steady breathing carries clear focus through longer stretches where frantic bursts normally fade away.',
    ],
    closings: [
      'Stay light on the keys, hold your rhythm steady, and finish every single phrase cleanly.',
      'Carry that calm motion straight through the final word and watch your real speed climb.',
      'Trust smooth timing over wild haste and let clean precision lock in your next record.',
      'Keep your gaze moving forward so every clean stroke lands right on the beat.',
      'End strong with relaxed hands, crisp spacing, and sharp control across the closing line.',
    ],
  },
  precision: {
    openings: [
      'Calibrated instruments depend on measured adjustments, patient verification, and consistent intervals.',
      'High-speed navigation across narrow coastal channels demands sharp attention to every shifting marker.',
      'Studio acoustics transform subtle percussion into crystal-clear phrasing when timing remains disciplined.',
      'Orbital telemetry teams monitor optical mirrors continuously so faint signals arrive completely intact.',
      'Experienced pilots read subtle wind shifts early, banking cleanly without wasting precious altitude.',
    ],
    middles: [
      'Rather than surging recklessly on simple clusters and stumbling on unfamiliar syllables, maintain deliberate cadence throughout.',
      'Notice how clean finger placement reduces lateral drift, preserving high keystroke accuracy across double consonants and commas.',
      'True technical fluency emerges when visual lookahead synchronizes smoothly with tactile muscle memory under pressure.',
      'Controlled acceleration always outperforms erratic sprinting because zero-error streaks compound steadily over time.',
      'Measured spacing keeps complex clauses legible, transforming demanding passages into predictable, repeatable sequences.',
    ],
    closings: [
      'Verify every final punctuation mark cleanly and close the run with unshaken composure.',
      'Discipline builds enduring speed, turning deliberate precision into your strongest competitive advantage.',
      'Hold steady focus to the very last character and leave zero stray errors on the ledger.',
      'Respect the cadence, protect your accuracy shield, and seal the checkpoint with authority.',
    ],
  },
  master: {
    openings: [
      'Telemetry Bus #4 reports 99.4% nominal alignment across optical arrays A-1 through D-8 at 28,800 ticks/sec.',
      'Structural dampers (660 metric tons) counterbalance 42-knot crosswinds—cutting harmonic tower sway by 38.5%!',
      'Deterministic replay engines verify keystroke timestamps, nonce entropy, and UTF-8 glyphs with <0.5% drift.',
      'Orbital transfer burn T-00:04:15 locks thruster gimbals at +1.40 deg pitch while streaming 64.2 Mbps telemetry.',
      'Spectrometer gratings isolate crisp 486.1 nm and 656.3 nm emission peaks across faint exoplanet horizons.',
    ],
    middles: [
      'Rapid alternation between Shift-modified symbols, hyphenated metrics (14.5-kW, 2026/08), and dense consonant clusters tests true poise.',
      'Never compromise syntactic precision when digits, parentheses, or em-dashes appear mid-clause; anticipate every modifier half a beat ahead.',
      'Auditors cross-check SHA-256 checksums, latency percentiles (P95 < 16ms), and error budgets before certifying leaderboard entries.',
      'High-tolerance engineering rejects guesswork: repeatable calibration, verified tolerances, and zero-jitter timing guarantee trustworthy results.',
    ],
    closings: [
      'Execute the closing sequence cleanly—zero panic, exact punctuation, verified mastery.',
      'Maintain razor-sharp composure through the final bracket and lock in an undeniable benchmark!',
      'Precision under load separates casual bursts from championship-grade execution at every checkpoint.',
    ],
  },
};

export function synthesizeDynamicPassage(
  mode: ArcadeModeId,
  difficulty: ArcadeDifficulty,
  seed?: number
): ArcadeTextPassage {
  dynamicMixCounter += 1;
  const s = Math.abs(Math.floor(seed ?? Date.now() + dynamicMixCounter * 9973));
  const bank = CLAUSE_BANKS[difficulty];

  const openIdx = s % bank.openings.length;
  const midIdx1 = Math.floor(s / 7) % bank.middles.length;
  const midIdx2 = (midIdx1 + 1 + (Math.floor(s / 13) % Math.max(1, bank.middles.length - 1))) % bank.middles.length;
  const closeIdx = Math.floor(s / 29) % bank.closings.length;

  const parts: string[] = [bank.openings[openIdx], bank.middles[midIdx1]];

  // Speed Rush needs generous 430-560 char runway so fast typists never finish prematurely
  if (mode === 'speed_rush') {
    const midIdx3 = (midIdx2 + 1) % bank.middles.length;
    parts.push(bank.middles[midIdx2]);
    if (midIdx3 !== midIdx1 && midIdx3 !== midIdx2) {
      parts.push(bank.middles[midIdx3]);
    }
  } else {
    parts.push(bank.middles[midIdx2]);
  }
  parts.push(bank.closings[closeIdx]);

  const content = parts.join(' ');
  const shortHash = (s % 0xffffff).toString(36).padStart(4, '0');
  const textId = `ta-v1-dyn-${difficulty.slice(0, 3)}-${shortHash}-${dynamicMixCounter}`;

  const titleByMode: Record<ArcadeModeId, string> = {
    classic: `Skyline Sector #${dynamicMixCounter}`,
    speed_rush: `Expressway Run #${dynamicMixCounter}`,
    accuracy_master: `Orbital Vector #${dynamicMixCounter}`,
    rhythm: `Harmonic Track #${dynamicMixCounter}`,
    challenge: `Siege Protocol #${dynamicMixCounter}`,
  };

  return {
    textId,
    textVersion: 1,
    title: titleByMode[mode],
    content,
    difficultyAttrs: computeDifficultyAttrs(content, difficulty),
    license: 'Original',
    source: 'Typing Arcade Dynamic Clause Composer v1 (Original)',
    isActive: true,
    recommendedModes: [mode],
  };
}

export function getPassageById(textId: string): ArcadeTextPassage | undefined {
  return ARCADE_CORPUS_V1.find((p) => p.textId === textId);
}

/**
 * Selects a guaranteed-fresh passage that never repeats the current text or recently played texts.
 * Automatically transitions to dynamically synthesized fresh paragraphs once a pool is exhausted.
 */
export function getFreshPassageForMode(
  mode: ArcadeModeId,
  difficulty: ArcadeDifficulty,
  excludeTextId?: string
): ArcadeTextPassage {
  const recentSet = new Set(getRecentPassageIds());
  if (excludeTextId) recentSet.add(excludeTextId);

  // Build prioritized candidate pools
  let pool = ARCADE_CORPUS_V1.filter(
    (p) =>
      p.isActive &&
      p.recommendedModes.includes(mode) &&
      p.difficultyAttrs.tier === difficulty
  );

  // For Speed Rush, strictly use long-form sprint passages (>= 380 chars) so fast players never run out of runway
  if (mode === 'speed_rush') {
    const longSpeedPool = ARCADE_CORPUS_V1.filter(
      (p) =>
        p.isActive &&
        p.recommendedModes.includes('speed_rush') &&
        p.content.length >= 380 &&
        p.difficultyAttrs.tier === difficulty
    );
    const anyLongSpeedPool = ARCADE_CORPUS_V1.filter(
      (p) => p.isActive && p.recommendedModes.includes('speed_rush') && p.content.length >= 380
    );
    if (longSpeedPool.some((p) => !recentSet.has(p.textId))) {
      pool = longSpeedPool;
    } else {
      pool = anyLongSpeedPool;
    }
  }

  // Filter out recently seen & excluded IDs
  let unseen = pool.filter((p) => !recentSet.has(p.textId));

  // Secondary pool: same tier across any mode if primary pool is all seen
  if (unseen.length === 0 && mode !== 'speed_rush') {
    const tierPool = ARCADE_CORPUS_V1.filter(
      (p) => p.isActive && p.difficultyAttrs.tier === difficulty && !recentSet.has(p.textId)
    );
    if (tierPool.length > 0) {
      unseen = tierPool;
    }
  }

  if (unseen.length > 0) {
    const pickIndex = Math.floor(Math.random() * unseen.length);
    const chosen = unseen[pickIndex];
    markPassageSeen(chosen.textId);
    return chosen;
  }

  // All matching static passages recently seen -> synthesize a fresh unseen passage dynamically!
  const dynamicPassage = synthesizeDynamicPassage(mode, difficulty);
  markPassageSeen(dynamicPassage.textId);
  return dynamicPassage;
}

export function getPassageForMode(
  mode: ArcadeModeId,
  difficulty: ArcadeDifficulty,
  excludeTextId?: string
): ArcadeTextPassage {
  return getFreshPassageForMode(mode, difficulty, excludeTextId);
}

export function getTodayArcadeDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDailyChallengePassage(isoDate: string = getTodayArcadeDate()): ArcadeTextPassage {
  let hash = 0;
  for (let i = 0; i < isoDate.length; i++) {
    hash = (hash * 31 + isoDate.charCodeAt(i)) >>> 0;
  }
  const challengePool = ARCADE_CORPUS_V1.filter(
    (p) => p.isActive && (p.difficultyAttrs.tier === 'precision' || p.difficultyAttrs.tier === 'master')
  );
  const pool = challengePool.length > 0 ? challengePool : ARCADE_CORPUS_V1;
  return pool[hash % pool.length];
}
