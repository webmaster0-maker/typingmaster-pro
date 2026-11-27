import { PracticeItem, TestItem } from '../types';
import { GUIDANCE_FULL, GUIDANCE_INTERMEDIATE, GUIDANCE_NONE } from './curriculumHelpers';

export const PRACTICE_ITEMS: PracticeItem[] = [
  {
    id: 'prac-weak',
    title: 'Adaptive Weak-Key Drill',
    type: 'weak_key',
    language: 'English',
    layout: 'QWERTY',
    content: 'the quick brown fox jumps over the lazy dog packed with frequent letters like e r t y u i o p a s d f g h j k l z x c v b n m',
    durationMinutes: 3,
    guidanceConfig: GUIDANCE_FULL,
    description: 'Targeted drill focusing on historically weakest keys to rebuild flawless neural pathways.'
  },
  {
    id: 'prac-speed',
    title: 'High-Velocity Speed Builder',
    type: 'speed',
    language: 'English',
    layout: 'QWERTY',
    content: 'programming requires focus rhythm and precision every single keystroke builds muscle memory and acceleration across the keyboard surface experience the flow state',
    durationMinutes: 2,
    guidanceConfig: GUIDANCE_INTERMEDIATE,
    description: 'Push your ceiling speed with continuous fluid English phrasing and professional terminology.'
  },
  {
    id: 'prac-rhythm',
    title: 'Metronome Rhythm Flow',
    type: 'rhythm',
    language: 'English',
    layout: 'QWERTY',
    content: 'tap step tap step equal timing steady cadence smooth fingers relax shoulders deep breath consistent pace',
    durationMinutes: 3,
    guidanceConfig: { keyboardVisible: true, handsVisible: false, fingerGuideVisible: false, targetKeyVisible: false, guidanceLevel: 'advanced' },
    description: 'Develop an even, metronomic cadence where every keystroke is spaced with identical milliseconds.'
  },
  {
    id: 'prac-tech-ai',
    title: 'AI & Computing',
    type: 'speed',
    language: 'English',
    layout: 'QWERTY',
    content: 'Modern software systems rely on distributed cloud nodes, low-latency networks, and clean interfaces. Engineers measure throughput, memory safety, and user responsiveness before shipping updates to production.',
    durationMinutes: 3,
    guidanceConfig: GUIDANCE_INTERMEDIATE,
    description: 'Practice realistic technology and engineering prose with natural punctuation.'
  },
  {
    id: 'prac-space-science',
    title: 'Space & Astronomy',
    type: 'stamina',
    language: 'English',
    layout: 'QWERTY',
    content: 'Deep space telescopes capture faint infrared light emitted billions of years ago. Astronomers analyze those spectra to map distant galaxies, estimate orbital mechanics, and search for habitable exoplanets.',
    durationMinutes: 3,
    guidanceConfig: GUIDANCE_INTERMEDIATE,
    description: 'Build typing stamina with rich scientific vocabulary and smooth rhythm.'
  },
  {
    id: 'prac-literature',
    title: 'Classic Literature',
    type: 'rhythm',
    language: 'English',
    layout: 'QWERTY',
    content: 'Lantern light spilled across the quiet harbor as the night train rolled past the stone bridge. Travelers checked their pocket watches, folded their newspapers, and watched the mist lift from the river.',
    durationMinutes: 3,
    guidanceConfig: GUIDANCE_INTERMEDIATE,
    description: 'Develop natural cadence and comma flow through narrative prose.'
  },
  {
    id: 'prac-business-email',
    title: 'Business Reports',
    type: 'punctuation',
    language: 'English',
    layout: 'QWERTY',
    content: 'Hello Team, please review the Q3 metrics before Friday at 3:30 PM. Our retention rose by 14%, support response time dropped to 18 minutes, and two new enterprise milestones are ready for sign-off.',
    durationMinutes: 3,
    guidanceConfig: GUIDANCE_INTERMEDIATE,
    description: 'Master real-world office writing with capitals, numbers, percentages, and punctuation.'
  },
  {
    id: 'prac-code-syntax',
    title: 'TypeScript & APIs',
    type: 'punctuation',
    language: 'Code',
    layout: 'QWERTY',
    content: 'export async function fetchProfile(id: string): Promise<User | null> { const res = await fetch(`/api/users/${id}`); return res.ok ? await res.json() : null; }',
    durationMinutes: 3,
    guidanceConfig: GUIDANCE_INTERMEDIATE,
    description: 'Sharpen pinky reaches for braces, colons, angle brackets, and template strings.'
  },
  {
    id: 'prac-nature',
    title: 'Forests & Ecology',
    type: 'stamina',
    language: 'English',
    layout: 'QWERTY',
    content: 'Coastal redwood forests pull moisture directly from rolling Pacific fog, sustaining ferns, salamanders, and mossy canopies for centuries. Healthy watersheds filter rainwater and shelter diverse wildlife.',
    durationMinutes: 3,
    guidanceConfig: GUIDANCE_INTERMEDIATE,
    description: 'Steady endurance passage featuring varied consonant clusters and hyphens.'
  },
  {
    id: 'prac-finance',
    title: 'Personal Finance',
    type: 'punctuation',
    language: 'English',
    layout: 'QWERTY',
    content: 'Compound growth rewards patience, low fees, and consistent monthly contributions. Even a modest 6% annual return doubles a portfolio roughly every twelve years when dividends are reinvested automatically.',
    durationMinutes: 3,
    guidanceConfig: GUIDANCE_INTERMEDIATE,
    description: 'Practice mixed prose, percentages, and number-row transitions.'
  },
  {
    id: 'prac-history',
    title: 'Keyboard History',
    type: 'stamina',
    language: 'English',
    layout: 'QWERTY',
    content: 'From early mechanical typewriters in the 1870s to modern optical switches, the QWERTY layout survived more than a century of hardware evolution because muscle memory scales across generations.',
    durationMinutes: 3,
    guidanceConfig: GUIDANCE_INTERMEDIATE,
    description: 'Historical nonfiction paragraph mixing dates, acronyms, and smooth phrasing.'
  },
  {
    id: 'prac-mindfulness',
    title: 'Ergonomics & Focus',
    type: 'rhythm',
    language: 'English',
    layout: 'QWERTY',
    content: 'Keep your wrists floating lightly above the desk, relax your shoulders, and let each finger return to its home row anchor. Accuracy always precedes speed; calm precision turns effort into effortless flow.',
    durationMinutes: 2,
    guidanceConfig: GUIDANCE_INTERMEDIATE,
    description: 'Calm accuracy drill reinforcing ergonomic touch-typing habits.'
  }
];

export const TEST_ITEMS: TestItem[] = [
  {
    id: 'test-standard',
    title: 'Standard Speed Test',
    durationMinutes: 2,
    content: 'technology transforms how we learn work and connect across the globe touch typing is an essential super power in the modern digital age allowing your thoughts to flow directly onto the screen without friction or hesitation practice daily for maximum fluency',
    scoring: 'standard',
    guidanceConfig: { keyboardVisible: true, handsVisible: false, fingerGuideVisible: false, targetKeyVisible: false, guidanceLevel: 'none' },
    passWpm: 35,
    passAccuracy: 95,
    description: 'Standard evaluation test measuring net WPM and accuracy under neutral conditions.'
  },
  {
    id: 'exam-certification',
    title: 'Expert Certification',
    durationMinutes: 5,
    content: 'the professional typing certification exam evaluates speed endurance and pristine accuracy under strict conditions without hints or visual aids maintain steady breathing and rhythmic keystrokes from start to finish success rewards deliberate practice and calm focus',
    scoring: 'strict',
    guidanceConfig: GUIDANCE_NONE,
    passWpm: 50,
    passAccuracy: 98,
    description: 'Rigorous exam simulation with zero hints, zero hand guidance, and strict error penalty scoring.'
  },
  {
    id: 'test-tech-future',
    title: 'Technology & AI',
    durationMinutes: 2,
    content: 'Artificial intelligence tools accelerate research, design, and software delivery, yet clear human judgment remains irreplaceable. Teams that communicate crisply and type without looking at the keyboard turn complex ideas into working products faster.',
    scoring: 'standard',
    guidanceConfig: GUIDANCE_NONE,
    passWpm: 40,
    passAccuracy: 95,
    description: 'Timed editorial passage on modern technology and engineering workflows.'
  },
  {
    id: 'test-space-frontier',
    title: 'Orbital Mechanics',
    durationMinutes: 2,
    content: 'Launching a payload into low Earth orbit requires precise velocity, thermal shielding, and real-time telemetry. Ground controllers monitor thousands of sensor readings per second while autonomous thrusters guide the booster safely back to the landing pad.',
    scoring: 'standard',
    guidanceConfig: GUIDANCE_NONE,
    passWpm: 40,
    passAccuracy: 95,
    description: 'Science and aerospace paragraph testing steady rhythm and punctuation.'
  },
  {
    id: 'test-literature-prose',
    title: 'Narrative Fiction',
    durationMinutes: 3,
    content: 'By the time the clock tower struck midnight, every bookshop along the cobbled alley had shuttered its oak doors. Only the baker remained awake, kneading dough beside a warm brick oven while rain tapped softly against the leaded glass window.',
    scoring: 'standard',
    guidanceConfig: GUIDANCE_NONE,
    passWpm: 42,
    passAccuracy: 96,
    description: 'Descriptive literary prose with natural commas and sentence variety.'
  },
  {
    id: 'test-business-ops',
    title: 'Executive Briefing',
    durationMinutes: 3,
    content: 'Quarterly operations review: Q4 revenue climbed 18.5% year-over-year, driven by a 94% renewal rate across enterprise accounts. Next month, regional leads will finalize 2027 hiring targets and publish updated service-level agreements.',
    scoring: 'strict',
    guidanceConfig: GUIDANCE_NONE,
    passWpm: 45,
    passAccuracy: 96,
    description: 'Realistic business briefing with numbers, percentages, and strict scoring.'
  },
  {
    id: 'test-code-sprint',
    title: 'Developer Code Sprint',
    durationMinutes: 2,
    content: 'const cache = new Map<string, number>(); function getScore(user: string): number { return cache.get(user) ?? 0; } if (cache.size > 100) { console.log("Pruning cache:", cache.size); }',
    scoring: 'strict',
    guidanceConfig: GUIDANCE_NONE,
    passWpm: 38,
    passAccuracy: 96,
    description: 'Technical coding speed test with brackets, generics, and operators.'
  },
  {
    id: 'test-world-history',
    title: 'Maritime History',
    durationMinutes: 3,
    content: 'For centuries, sailors crossed open oceans using wooden sextants, star charts, and mechanical chronometers. Measuring longitude accurately transformed global trade routes, turning perilous months-long voyages into predictable journeys across continents.',
    scoring: 'standard',
    guidanceConfig: GUIDANCE_NONE,
    passWpm: 40,
    passAccuracy: 95,
    description: 'Historical nonfiction passage with rich vocabulary and hyphenated phrasing.'
  },
  {
    id: 'test-cybersecurity',
    title: 'Zero Trust Security',
    durationMinutes: 3,
    content: 'Strong security architecture assumes every network boundary can be tested. Short-lived cryptographic tokens, strict Content Security Policy headers, and hardware-backed passkeys protect user accounts far better than static passwords ever could.',
    scoring: 'strict',
    guidanceConfig: GUIDANCE_NONE,
    passWpm: 45,
    passAccuracy: 97,
    description: 'Security engineering paragraph evaluating high-accuracy precision.'
  },
  {
    id: 'test-journalism',
    title: 'Urban Architecture',
    durationMinutes: 3,
    content: 'Modern cities are redesigning concrete avenues into shaded pedestrian corridors lined with solar canopies and bike lanes. Urban planners report that greener blocks cool summer street temperatures by up to 4 degrees while boosting local foot traffic.',
    scoring: 'standard',
    guidanceConfig: GUIDANCE_NONE,
    passWpm: 40,
    passAccuracy: 95,
    description: 'Journalistic feature article balancing readability, numbers, and flow.'
  },
  {
    id: 'test-endurance-master',
    title: 'Grandmaster Endurance',
    durationMinutes: 5,
    content: 'True typing mastery is not measured by a five-second burst of speed, but by calm consistency over hundreds of words. When your eyes read two words ahead of your fingers, errors vanish, breathing stays relaxed, and keystrokes merge into a seamless rhythm.',
    scoring: 'strict',
    guidanceConfig: GUIDANCE_NONE,
    passWpm: 55,
    passAccuracy: 98,
    description: 'Elite 5-minute strict endurance exam for Grandmaster certification.'
  },
  {
    id: 'test-quick-sprint',
    title: '60-Second Sprint',
    durationMinutes: 1,
    content: 'Fast fingers move lightly without tension. Focus on clean transitions between vowels and common consonants, keep your eyes on the upcoming word, and trust your home-row muscle memory to carry you smoothly across every line.',
    scoring: 'standard',
    guidanceConfig: GUIDANCE_NONE,
    passWpm: 45,
    passAccuracy: 95,
    description: 'Quick 1-minute speed benchmark for daily warmups and WPM checks.'
  }
];
