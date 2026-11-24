import {
  FingerType,
  GeneratedRemediationLesson,
  HandType,
  HotspotSeverity,
  TrickyKeyHotspot,
} from '../types';
import { getGuidanceForChar } from './guidanceEngine';

const FINGER_HOME_ANCHOR: Record<FingerType, string> = {
  left_pinky: 'a',
  left_ring: 's',
  left_middle: 'd',
  left_index: 'f',
  left_thumb: ' ',
  right_thumb: ' ',
  right_index: 'j',
  right_middle: 'k',
  right_ring: 'l',
  right_pinky: ';',
  none: 'f',
};

const FINGER_TRANSITION_NEIGHBORS: Record<FingerType, string[]> = {
  left_pinky: ['a', 's', 'd', 'j', 'k'],
  left_ring: ['s', 'a', 'd', 'f', 'l'],
  left_middle: ['d', 's', 'f', 'k', 'j'],
  left_index: ['f', 'd', 's', 'j', 'k'],
  left_thumb: ['f', 'j', 'd', 'k'],
  right_thumb: ['f', 'j', 'd', 'k'],
  right_index: ['j', 'k', 'l', 'f', 'd'],
  right_middle: ['k', 'j', 'l', 'd', 'f'],
  right_ring: ['l', 'k', ';', 's', 'f'],
  right_pinky: [';', 'l', 'k', 'a', 'f'],
  none: ['f', 'j', 'd', 'k'],
};

const ROW_NAMES: Record<number, string> = {
  0: 'Number Row',
  1: 'Top Row',
  2: 'Home Row',
  3: 'Bottom Row',
  4: 'Spacebar',
};

// Curated clean English word bank covering every letter a-z thoroughly for Stage 3 Real Words
const REAL_WORD_BANK: string[] = [
  // High-frequency & balanced anchors
  'about', 'above', 'active', 'adapt', 'after', 'again', 'agile', 'align', 'allow', 'almost',
  'alpha', 'always', 'anchor', 'angle', 'answer', 'apple', 'apply', 'arcade', 'around', 'atlas',
  'badge', 'balance', 'bamboo', 'banner', 'basic', 'beacon', 'before', 'begin', 'bench', 'better',
  'beyond', 'binary', 'black', 'blade', 'blank', 'blaze', 'blend', 'block', 'bloom', 'board',
  'bonus', 'boost', 'border', 'bounce', 'boxer', 'branch', 'brave', 'breeze', 'bridge', 'bright',
  'bring', 'broad', 'bronze', 'brown', 'brush', 'build', 'bundle', 'burst', 'button', 'buzz',
  'cabin', 'cable', 'cadence', 'calm', 'camera', 'campus', 'candle', 'canopy', 'canvas', 'carbon',
  'careful', 'carpet', 'carry', 'castle', 'catch', 'center', 'chain', 'chalk', 'chance', 'change',
  'charge', 'chart', 'check', 'cherry', 'choice', 'chord', 'circle', 'civic', 'claim', 'clarity',
  'clean', 'clear', 'click', 'climb', 'clock', 'close', 'cloud', 'clover', 'cluster', 'coach',
  'coast', 'cobalt', 'coffee', 'column', 'combo', 'comet', 'common', 'compact', 'craft', 'crisp',
  'crown', 'crystal', 'curve', 'custom', 'cycle', 'daily', 'dance', 'dazzle', 'decide', 'deep',
  'delta', 'dense', 'depth', 'design', 'detail', 'device', 'dial', 'digital', 'direct', 'divide',
  'dizzy', 'domain', 'double', 'draft', 'dragon', 'drawer', 'dream', 'drift', 'drill', 'drive',
  'drizzle', 'dynamic', 'eager', 'eagle', 'early', 'earth', 'echo', 'editor', 'effort', 'elbow',
  'element', 'elevate', 'ember', 'emerald', 'enable', 'energy', 'engine', 'enjoy', 'enter', 'entry',
  'equal', 'equip', 'evening', 'event', 'exact', 'exam', 'example', 'excel', 'execute', 'expand',
  'expect', 'expert', 'explore', 'export', 'express', 'extra', 'fabric', 'factor', 'falcon', 'family',
  'famous', 'fast', 'feather', 'feedback', 'field', 'figure', 'filter', 'final', 'finger', 'finish',
  'fixed', 'fjord', 'flame', 'flash', 'flavor', 'flex', 'flight', 'float', 'flock', 'floor',
  'flora', 'flour', 'flower', 'fluent', 'fluid', 'focus', 'folder', 'follow', 'forest', 'format',
  'forum', 'forward', 'fossil', 'foster', 'found', 'frame', 'frank', 'freeze', 'fresh', 'friend',
  'frost', 'frozen', 'fruit', 'future', 'fuzzy', 'galaxy', 'garden', 'gather', 'gauge', 'gazelle',
  'gentle', 'genuine', 'gesture', 'giant', 'ginger', 'glacier', 'glance', 'glaze', 'glide', 'global',
  'gloss', 'glove', 'golden', 'grace', 'grade', 'grain', 'grand', 'graph', 'grasp', 'gravity',
  'green', 'grid', 'groove', 'ground', 'group', 'growth', 'guard', 'guide', 'guitar', 'habit',
  'hammer', 'handle', 'happen', 'harbor', 'harmony', 'harvest', 'hazard', 'health', 'hearth', 'heavy',
  'height', 'helium', 'helper', 'herbal', 'heroic', 'hidden', 'higher', 'hollow', 'honest', 'horizon',
  'humble', 'humor', 'hurdle', 'hybrid', 'icicle', 'ideal', 'ignite', 'image', 'impact', 'imply',
  'improve', 'index', 'indigo', 'indoor', 'infant', 'inform', 'inject', 'inkwell', 'inner', 'input',
  'inquire', 'insert', 'inside', 'insight', 'inspire', 'instant', 'intact', 'intent', 'invent', 'invest',
  'invite', 'island', 'ivory', 'jacket', 'jaguar', 'jasper', 'javelin', 'jazz', 'jersey', 'jigsaw',
  'jockey', 'joiner', 'jolly', 'journal', 'journey', 'joyful', 'judge', 'juggle', 'juice', 'jumble',
  'jumbo', 'jumper', 'jungle', 'junior', 'juniper', 'just', 'justice', 'kayak', 'keeper', 'kernel',
  'kettle', 'keycap', 'keypad', 'keyword', 'khaki', 'kickoff', 'kindle', 'kindly', 'kinetic', 'kingdom',
  'kitchen', 'kitten', 'knack', 'knight', 'knitted', 'knuckle', 'koala', 'label', 'ladder', 'lagoon',
  'lantern', 'laptop', 'laser', 'launch', 'laurel', 'lavish', 'layer', 'layout', 'leader', 'league',
  'learn', 'leather', 'ledger', 'legacy', 'legend', 'lemon', 'length', 'lesson', 'letter', 'level',
  'lever', 'liberty', 'library', 'light', 'lilac', 'limit', 'linear', 'linen', 'linger', 'liquid',
  'listen', 'little', 'lively', 'lizard', 'local', 'locate', 'locket', 'logic', 'lounge', 'loyal',
  'lucid', 'lumber', 'lunar', 'luster', 'luxury', 'lyric', 'magnet', 'maize', 'major', 'maker',
  'manage', 'mango', 'manner', 'manual', 'maple', 'marble', 'margin', 'marine', 'marker', 'market',
  'marvel', 'master', 'matrix', 'matter', 'maxim', 'meadow', 'measure', 'medal', 'medium', 'melody',
  'member', 'memory', 'mentor', 'mercy', 'merge', 'merit', 'message', 'metal', 'meteor', 'method',
  'metric', 'middle', 'mighty', 'mild', 'miller', 'mimic', 'mineral', 'mingle', 'minimal', 'minute',
  'mirage', 'mirror', 'mission', 'mistake', 'mixer', 'mobile', 'model', 'modern', 'modest', 'modify',
  'module', 'moment', 'monday', 'monitor', 'monkey', 'morning', 'mosaic', 'motion', 'motive', 'motor',
  'mountain', 'mouse', 'mouth', 'moving', 'muffin', 'mumble', 'muscle', 'museum', 'music', 'mustard',
  'mutual', 'muzzle', 'myriad', 'mystic', 'napkin', 'narrow', 'nation', 'native', 'nature', 'naval',
  'navigate', 'nearby', 'neatly', 'nectar', 'needle', 'neither', 'nephew', 'nerve', 'nestle', 'network',
  'neural', 'neutral', 'never', 'newest', 'nickel', 'nimble', 'nimbus', 'ninety', 'noble', 'nobody',
  'nocturne', 'noodle', 'normal', 'north', 'notable', 'notice', 'notion', 'novel', 'nozzle', 'nuance',
  'number', 'nurture', 'nutmeg', 'nuzzle', 'oakwood', 'oasis', 'object', 'observe', 'obtain', 'obvious',
  'ocean', 'octave', 'october', 'office', 'offset', 'olive', 'omega', 'online', 'onward', 'opaque',
  'opener', 'opera', 'optic', 'optimal', 'option', 'oracle', 'orange', 'orbit', 'orchard', 'order',
  'organic', 'orient', 'origin', 'ornate', 'osprey', 'other', 'otter', 'ounce', 'outcome', 'outdoor',
  'outer', 'outfit', 'outline', 'output', 'outside', 'oval', 'overcome', 'overlap', 'oversee', 'owner',
  'oxygen', 'oyster', 'ozone', 'pacific', 'package', 'paddle', 'padlock', 'pageant', 'painter', 'palace',
  'palette', 'palm', 'panel', 'panther', 'pantry', 'paper', 'parade', 'parcel', 'pardon', 'parent',
  'parlor', 'parrot', 'parse', 'partial', 'partner', 'passage', 'passion', 'passive', 'pastel', 'pasture',
  'patch', 'patent', 'pathway', 'patient', 'patrol', 'pattern', 'pause', 'pavement', 'pavilion', 'payoff',
  'peace', 'peach', 'peacock', 'peanut', 'pebble', 'pedal', 'pelican', 'pencil', 'pendant', 'penguin',
  'penny', 'people', 'pepper', 'percent', 'perfect', 'perform', 'perfume', 'perhaps', 'period', 'permit',
  'persist', 'person', 'petal', 'petite', 'pewter', 'phantom', 'phase', 'phoenix', 'phone', 'photo',
  'phrase', 'physics', 'piano', 'pickle', 'picnic', 'picture', 'piece', 'pigeon', 'pillar', 'pillow',
  'pilot', 'pinch', 'pine', 'pioneer', 'pipeline', 'pirate', 'pistol', 'pitcher', 'pivot', 'pixel',
  'pizza', 'placard', 'place', 'placid', 'plague', 'plain', 'planet', 'plank', 'planner', 'plant',
  'plaque', 'plasma', 'plaster', 'plastic', 'plate', 'plateau', 'platform', 'platter', 'playful', 'plaza',
  'plead', 'pleasant', 'please', 'pledge', 'plenty', 'pliable', 'plight', 'plod', 'plover', 'plucky',
  'plumage', 'plumber', 'plume', 'plump', 'plunder', 'plunge', 'plural', 'plush', 'pocket', 'podcast',
  'poem', 'poetic', 'point', 'poise', 'polar', 'policy', 'polish', 'polite', 'pollen', 'polymer',
  'pomelo', 'ponder', 'poncho', 'poodle', 'poplar', 'popular', 'porch', 'portal', 'portion', 'portrait',
  'possum', 'postage', 'postal', 'poster', 'posture', 'potash', 'potato', 'potent', 'pottery', 'pouch',
  'poultry', 'pounce', 'pound', 'powder', 'power', 'practice', 'prairie', 'praise', 'prance', 'prawn',
  'preach', 'precede', 'precise', 'predict', 'preface', 'prefer', 'prefix', 'prelude', 'premier', 'premise',
  'premium', 'prepare', 'present', 'preserve', 'press', 'prestige', 'pretzel', 'prevail', 'prevent', 'preview',
  'primary', 'primate', 'primer', 'prince', 'printer', 'prior', 'prism', 'privacy', 'private', 'prize',
  'probe', 'problem', 'proceed', 'process', 'proclaim', 'procure', 'produce', 'product', 'profile', 'profit',
  'program', 'project', 'prolong', 'promise', 'promote', 'prompt', 'pronoun', 'proof', 'propel', 'proper',
  'prophet', 'propose', 'prose', 'prosper', 'protect', 'protein', 'protest', 'proton', 'proud', 'prove',
  'proverb', 'provide', 'province', 'prowl', 'proxy', 'prudent', 'prune', 'psalm', 'public', 'publish',
  'pucker', 'pudding', 'puddle', 'puffin', 'pulley', 'pulpit', 'pulse', 'pumpkin', 'punch', 'punctual',
  'pundit', 'pungent', 'pupil', 'puppet', 'puppy', 'purchase', 'purely', 'purify', 'purple', 'purpose',
  'pursue', 'pushy', 'puzzle', 'pyramid', 'python', 'quack', 'quad', 'quail', 'quaint', 'quake',
  'qualify', 'quality', 'qualm', 'quant', 'quantum', 'quarry', 'quart', 'quarter', 'quartet', 'quartz',
  'quash', 'quasar', 'quaver', 'quay', 'queen', 'queer', 'quell', 'quench', 'query', 'quest',
  'queue', 'quibble', 'quick', 'quickly', 'quiet', 'quietly', 'quill', 'quilt', 'quince', 'quintet',
  'quirk', 'quirky', 'quit', 'quite', 'quiver', 'quiz', 'quizzed', 'quota', 'quote', 'quoted',
  'rabbit', 'raccoon', 'racket', 'radar', 'radial', 'radiant', 'radical', 'radio', 'radish', 'radius',
  'raffle', 'rafter', 'ragged', 'railing', 'railway', 'rainbow', 'raisin', 'rally', 'ramble', 'rampant',
  'rampart', 'rancher', 'random', 'ranger', 'ranking', 'ransom', 'rapid', 'rapidly', 'rapport', 'raptor',
  'rarely', 'rascal', 'raster', 'ratchet', 'rather', 'ratify', 'rating', 'ratio', 'ration', 'rattle',
  'ravage', 'raven', 'ravine', 'ravioli', 'ravish', 'rawhide', 'razor', 'reach', 'react', 'reader',
  'readily', 'reading', 'ready', 'reaffirm', 'realist', 'reality', 'realize', 'realm', 'reaper', 'reason',
  'rebel', 'rebound', 'rebuild', 'rebuke', 'recall', 'recast', 'recede', 'receipt', 'receive', 'recent',
  'recess', 'recipe', 'recital', 'recite', 'reckon', 'reclaim', 'recline', 'record', 'recover', 'recruit',
  'rectify', 'recur', 'recycle', 'redden', 'redeem', 'redesign', 'redwood', 'reed', 'refine', 'reflect',
  'reform', 'refract', 'refresh', 'refuge', 'refund', 'refusal', 'refuse', 'refute', 'regain', 'regal',
  'regard', 'regatta', 'regent', 'regime', 'region', 'register', 'regret', 'regular', 'rehab', 'rehearse',
  'reign', 'reissue', 'reject', 'rejoice', 'rejoin', 'relate', 'relax', 'relay', 'release', 'relent',
  'relic', 'relief', 'relieve', 'relish', 'relive', 'reload', 'rely', 'remain', 'remake', 'remark',
  'remedy', 'remind', 'remit', 'remnant', 'remodel', 'remote', 'removal', 'remove', 'rename', 'render',
  'renew', 'renown', 'rental', 'reopen', 'repair', 'repay', 'repeal', 'repeat', 'repel', 'repent',
  'replace', 'replay', 'replica', 'reply', 'report', 'repose', 'reprint', 'reproach', 'reptile', 'republic',
  'repulse', 'repute', 'request', 'require', 'rescue', 'research', 'resemble', 'resent', 'reserve', 'reset',
  'reside', 'residue', 'resign', 'resin', 'resist', 'resolve', 'resort', 'resound', 'resource', 'respect',
  'respond', 'restful', 'restore', 'restrain', 'result', 'resume', 'retail', 'retain', 'retake', 'retell',
  'rethink', 'retina', 'retire', 'retort', 'retrace', 'retract', 'retreat', 'retrieve', 'retro', 'return',
  'reunion', 'reunite', 'reuse', 'revamp', 'reveal', 'revel', 'revenge', 'revenue', 'revere', 'reverse',
  'revert', 'review', 'revile', 'revise', 'revisit', 'revival', 'revive', 'revoke', 'revolt', 'revolve',
  'reward', 'rewind', 'rewire', 'rewrite', 'rhythm', 'ribbon', 'richest', 'riddle', 'rider', 'ridge',
  'riffle', 'rigging', 'right', 'rightly', 'rigid', 'rigor', 'rimless', 'ringlet', 'rinse', 'riot',
  'ripen', 'ripple', 'riser', 'rising', 'risky', 'ritual', 'rival', 'river', 'rivet', 'roadway',
  'roamer', 'roast', 'robber', 'robin', 'robot', 'robotic', 'robust', 'rocker', 'rocket', 'rocky',
  'rodent', 'rodeo', 'rogue', 'roller', 'romance', 'romper', 'rooftop', 'rookie', 'roomy', 'rooster',
  'rooted', 'ropeway', 'rosary', 'rosebud', 'rosemary', 'rosette', 'roster', 'rostrum', 'rotary', 'rotate',
  'rotor', 'rotten', 'rotunda', 'rough', 'roughly', 'round', 'roundup', 'rouse', 'router', 'routine',
  'rover', 'rowboat', 'rowdy', 'royal', 'royalty', 'rubber', 'rubble', 'rubric', 'ruby', 'ruckus',
  'rudder', 'ruddy', 'rueful', 'ruffian', 'ruffle', 'rugged', 'ruined', 'ruler', 'ruling', 'rumble',
  'rummage', 'rumor', 'rumple', 'runaway', 'rundown', 'runner', 'runoff', 'runway', 'rupture', 'rural',
  'russet', 'rustic', 'rustle', 'rusty', 'rutted', 'saber', 'sable', 'sachet', 'sacred', 'saddle',
  'safari', 'safely', 'safety', 'saffron', 'saga', 'saguaro', 'sailor', 'saint', 'salad', 'salary',
  'salient', 'saline', 'saliva', 'sallow', 'salmon', 'salon', 'saloon', 'salsa', 'salted', 'salute',
  'salvage', 'salvo', 'samba', 'sample', 'sanctum', 'sandal', 'sandbox', 'sander', 'sanding', 'sanity',
  'sapling', 'sapphire', 'sarcasm', 'sardine', 'sarong', 'sashay', 'satchel', 'satin', 'satire', 'satisfy',
  'saturate', 'saturn', 'sauce', 'saucer', 'sauna', 'saunter', 'sausage', 'savage', 'savanna', 'saver',
  'saving', 'savior', 'savor', 'savory', 'savvy', 'sawdust', 'sawmill', 'sax', 'saying', 'scabbard',
  'scaffold', 'scalar', 'scald', 'scale', 'scallop', 'scalp', 'scamper', 'scandal', 'scanner', 'scant',
  'scarab', 'scarce', 'scare', 'scarf', 'scarlet', 'scatter', 'scenic', 'scent', 'scepter', 'scheme',
  'scholar', 'school', 'science', 'scintilla', 'scissor', 'scoff', 'scold', 'sconce', 'scone', 'scoop',
  'scooter', 'scope', 'scorch', 'score', 'scorn', 'scorpion', 'scotch', 'scoundrel', 'scour', 'scourge',
  'scout', 'scowl', 'scramble', 'scrap', 'scrape', 'scratch', 'scrawl', 'scream', 'screech', 'screen',
  'screw', 'scribble', 'scribe', 'scrim', 'script', 'scroll', 'scrooge', 'scrub', 'scruff', 'scrunch',
  'scruple', 'scuba', 'scuff', 'scuffle', 'sculpt', 'scurry', 'scurvy', 'scuttle', 'scythe', 'seabird',
  'seafood', 'seagull', 'seahorse', 'sealant', 'sealer', 'seaman', 'seaport', 'search', 'seashore', 'season',
  'seating', 'seaward', 'seaweed', 'secede', 'seclude', 'second', 'secrecy', 'secret', 'section', 'sector',
  'secular', 'secure', 'sedan', 'sedate', 'sediment', 'seedbed', 'seeding', 'seedling', 'seeker', 'seemly',
  'seesaw', 'seethe', 'segment', 'seismic', 'seize', 'seizure', 'seldom', 'select', 'self', 'selfish',
  'seller', 'seltzer', 'semantic', 'seminar', 'senate', 'senator', 'sender', 'senile', 'senior', 'sensation',
  'sense', 'sensor', 'sensory', 'sentence', 'sentry', 'sepal', 'separate', 'sepia', 'septet', 'sequel',
  'sequence', 'sequin', 'sequoia', 'seraph', 'serene', 'serfdom', 'sergeant', 'serial', 'series', 'serif',
  'serious', 'sermon', 'serpent', 'serum', 'servant', 'server', 'service', 'serving', 'sesame', 'session',
  'setback', 'settee', 'setter', 'setting', 'settle', 'settler', 'seven', 'seventh', 'seventy', 'several',
  'severe', 'sewing', 'sextet', 'shabby', 'shack', 'shackle', 'shaded', 'shading', 'shadow', 'shady',
  'shaft', 'shaggy', 'shaker', 'shaking', 'shale', 'shallot', 'shallow', 'shaman', 'shamble', 'shame',
  'shampoo', 'shamrock', 'shandy', 'shanghai', 'shanty', 'shaped', 'shaper', 'shard', 'shared', 'sharer',
  'shark', 'sharp', 'sharpen', 'sharply', 'shatter', 'shave', 'shaver', 'shaving', 'shawl', 'sheaf',
  'shear', 'sheath', 'sheen', 'sheep', 'sheer', 'sheet', 'sheikh', 'shelf', 'shell', 'shellac',
  'shelter', 'shelve', 'shepherd', 'sherbet', 'sheriff', 'sherry', 'shield', 'shift', 'shifty', 'shimmer',
  'shin', 'shindig', 'shiner', 'shingle', 'shining', 'shiny', 'ship', 'shipload', 'shipment', 'shipper',
  'shirk', 'shirt', 'shiver', 'shoal', 'shock', 'shoddy', 'shoelace', 'shogun', 'shooter', 'shopper',
  'shore', 'short', 'shorten', 'shortly', 'shotgun', 'should', 'shoulder', 'shout', 'shove', 'shovel',
  'shower', 'showing', 'showman', 'shown', 'showy', 'shrank', 'shrapnel', 'shred', 'shrew', 'shrewd',
  'shriek', 'shrift', 'shrill', 'shrimp', 'shrine', 'shrink', 'shrivel', 'shroud', 'shrub', 'shrug',
  'shrunk', 'shuck', 'shudder', 'shuffle', 'shun', 'shunt', 'shush', 'shutter', 'shuttle', 'shyly',
  'shyness', 'sibling', 'sickle', 'sickness', 'sidearm', 'sidebar', 'sidecar', 'sidekick', 'sideline', 'siding',
  'sidle', 'siege', 'sienna', 'sierra', 'siesta', 'sieve', 'sifter', 'sigh', 'sight', 'sigma',
  'signal', 'signet', 'signify', 'signing', 'silage', 'silence', 'silent', 'silica', 'silicon', 'silken',
  'silky', 'silly', 'silo', 'silted', 'silver', 'silvery', 'simian', 'similar', 'simile', 'simmer',
  'simper', 'simple', 'simplify', 'simply', 'simulate', 'sincere', 'sinew', 'sinful', 'singe', 'singer',
  'singing', 'single', 'singly', 'singular', 'sinister', 'sinker', 'sinking', 'sinner', 'sinuous', 'sinus',
  'siphon', 'sir', 'sire', 'siren', 'sirloin', 'sirup', 'sisal', 'sister', 'sitcom', 'sitter',
  'sitting', 'situate', 'sixfold', 'sixteen', 'sixth', 'sixty', 'sizable', 'sized', 'sizer', 'sizing',
  'sizzle', 'sizzler', 'skate', 'skater', 'skating', 'skeet', 'skein', 'skeletal', 'skeleton', 'skeptic',
  'sketch', 'sketchy', 'skew', 'skewer', 'ski', 'skid', 'skier', 'skiff', 'skiing', 'skill',
  'skilled', 'skillet', 'skillful', 'skim', 'skimmer', 'skimp', 'skimpy', 'skin', 'skincare', 'skinny',
  'skip', 'skipper', 'skirmish', 'skirt', 'skit', 'skitter', 'skittish', 'skittle', 'skulk', 'skull',
  'skunk', 'sky', 'skybox', 'skydiver', 'skyhook', 'skylark', 'skylight', 'skyline', 'skyward', 'skyway',
  'slab', 'slack', 'slacken', 'slacker', 'slag', 'slain', 'slake', 'slalom', 'slam', 'slammer',
  'slander', 'slang', 'slant', 'slap', 'slash', 'slat', 'slate', 'slather', 'slatted', 'slaughter',
  'slave', 'slavery', 'slavish', 'slaw', 'slay', 'slayer', 'sled', 'sledder', 'sledge', 'sleek',
  'sleep', 'sleeper', 'sleepily', 'sleepy', 'sleet', 'sleeve', 'sleigh', 'sleight', 'slender', 'slept',
  'sleuth', 'slew', 'slice', 'slicer', 'slick', 'slicker', 'slid', 'slide', 'slider', 'slight',
  'slightly', 'slim', 'slime', 'slimy', 'sling', 'slink', 'slinky', 'slip', 'slipknot', 'slippage',
  'slipper', 'slippery', 'slipshod', 'slit', 'slither', 'sliver', 'slob', 'slobber', 'slog', 'slogan',
  'sloop', 'slop', 'slope', 'sloppy', 'slosh', 'slot', 'sloth', 'slothful', 'slouch', 'slough',
  'sloven', 'slow', 'slowdown', 'slowly', 'slowness', 'slowpoke', 'sludge', 'slug', 'sluggard', 'slugger',
  'sluggish', 'sluice', 'slum', 'slumber', 'slump', 'slung', 'slunk', 'slur', 'slurp', 'slurry',
  'slush', 'slushy', 'sly', 'slyly', 'slyness', 'smack', 'small', 'smaller', 'smallest', 'smallpox',
  'smart', 'smarten', 'smartly', 'smash', 'smasher', 'smattering', 'smear', 'smell', 'smelly', 'smelt',
  'smelter', 'smile', 'smiler', 'smiling', 'smirk', 'smite', 'smith', 'smithy', 'smitten', 'smock',
  'smog', 'smoggy', 'smoke', 'smoker', 'smokestack', 'smoky', 'smolder', 'smooch', 'smooth', 'smoothie',
  'smoothly', 'smote', 'smother', 'smudge', 'smudgy', 'smug', 'smuggle', 'smuggler', 'smugly', 'smut',
  'snack', 'snaffle', 'snafu', 'snag', 'snail', 'snake', 'snaky', 'snap', 'snapdragon', 'snapper',
  'snappy', 'snapshot', 'snare', 'snarl', 'snatch', 'snazzy', 'sneak', 'sneaker', 'sneaky', 'sneer',
  'sneeze', 'snicker', 'snide', 'sniff', 'sniffle', 'snifter', 'snigger', 'snip', 'snipe', 'sniper',
  'snippet', 'snippy', 'snit', 'snitch', 'snivel', 'snob', 'snobbery', 'snobbish', 'snood', 'snook',
  'snooker', 'snoop', 'snooper', 'snooty', 'snooze', 'snore', 'snorer', 'snorkel', 'snort', 'snot',
  'snout', 'snow', 'snowball', 'snowbank', 'snowbird', 'snowcap', 'snowdrift', 'snowdrop', 'snowfall', 'snowflake',
  'snowman', 'snowplow', 'snowshoe', 'snowy', 'snub', 'snuck', 'snuff', 'snuffle', 'snug', 'snuggle',
  'snugly', 'soak', 'soaker', 'soap', 'soapbox', 'soapsuds', 'soapy', 'soar', 'sob', 'sober',
  'soberly', 'sobriety', 'soccer', 'sociable', 'social', 'society', 'sock', 'socket', 'sod', 'soda',
  'sodden', 'sodium', 'sofa', 'soft', 'softball', 'soften', 'softener', 'softly', 'softness', 'software',
  'softwood', 'soggy', 'soil', 'soiree', 'sojourn', 'solace', 'solar', 'sold', 'solder', 'soldier',
  'sole', 'solely', 'solemn', 'solemnly', 'solenoid', 'solicit', 'solid', 'solidify', 'solidity', 'solidly',
  'solitary', 'solitude', 'solo', 'soloist', 'solstice', 'soluble', 'solution', 'solve', 'solvent', 'solver',
  'somber', 'sombrero', 'some', 'somebody', 'someday', 'somehow', 'someone', 'someplace', 'somersault', 'something',
  'sometime', 'somewhat', 'somewhere', 'son', 'sonar', 'sonata', 'song', 'songbird', 'songbook', 'sonic',
  'sonnet', 'sonorous', 'soon', 'sooner', 'soonest', 'soot', 'soothe', 'soothing', 'sooty', 'sop',
  'sophism', 'soporific', 'soprano', 'sorbet', 'sorcerer', 'sorcery', 'sordid', 'sore', 'sorely', 'soreness',
  'sorghum', 'sorority', 'sorrel', 'sorrow', 'sorry', 'sort', 'sorter', 'sortie', 'sot', 'souffle',
  'sough', 'sought', 'soul', 'soulful', 'sound', 'sounder', 'soundly', 'soup', 'soupy', 'sour',
  'source', 'sourdough', 'sourly', 'sourness', 'souse', 'south', 'southern', 'southpaw', 'souvenir', 'sovereign',
  'sow', 'sower', 'soy', 'soybean', 'spa', 'space', 'spacer', 'spacious', 'spade', 'spaghetti',
  'spake', 'span', 'spangle', 'spaniel', 'spank', 'spanker', 'spanner', 'spar', 'spare', 'sparing',
  'spark', 'sparkle', 'sparkler', 'sparrow', 'sparse', 'sparsely', 'spartan', 'spasm', 'spat', 'spatial',
  'spatter', 'spatula', 'spawn', 'spay', 'speak', 'speaker', 'spear', 'special', 'species', 'specific',
  'specimen', 'speck', 'speckle', 'spectacle', 'specter', 'spectral', 'spectrum', 'speculate', 'sped', 'speech',
  'speed', 'speeder', 'speedily', 'speedup', 'speedway', 'speedy', 'spell', 'speller', 'spelling', 'spelt',
  'spend', 'spender', 'spent', 'sperm', 'spew', 'sphere', 'sphinx', 'spice', 'spicily', 'spicy',
  'spider', 'spidery', 'spied', 'spiffy', 'spigot', 'spike', 'spiky', 'spill', 'spillway', 'spin',
  'spinach', 'spinal', 'spindle', 'spindly', 'spine', 'spinet', 'spinner', 'spinster', 'spiny', 'spiral',
  'spire', 'spirit', 'spirited', 'spit', 'spite', 'spiteful', 'spitfire', 'spittle', 'spittoon', 'splash',
  'splashy', 'splat', 'splatter', 'splay', 'spleen', 'splendid', 'splendor', 'splice', 'splint', 'splinter',
  'split', 'splitter', 'splotch', 'splotchy', 'splurge', 'splutter', 'spoil', 'spoilage', 'spoiler', 'spoke',
  'spoken', 'spokesman', 'sponge', 'spongy', 'sponsor', 'spoof', 'spook', 'spooky', 'spool', 'spoon',
  'spoonful', 'spoor', 'sporadic', 'spore', 'sport', 'sporting', 'sportive', 'sporty', 'spot', 'spotless',
  'spotted', 'spotter', 'spotty', 'spouse', 'spout', 'sprain', 'sprang', 'sprat', 'sprawl', 'spray',
  'sprayer', 'spread', 'spreader', 'spree', 'sprig', 'sprightly', 'spring', 'springer', 'springy', 'sprinkle',
  'sprinkler', 'sprint', 'sprinter', 'sprite', 'sprocket', 'sprout', 'spruce', 'sprung', 'spry', 'spryly',
  'spud', 'spume', 'spun', 'spunk', 'spunky', 'spur', 'spurious', 'spurn', 'spurt', 'sputnik',
  'sputter', 'spy', 'spyglass', 'squab', 'squabble', 'squad', 'squadron', 'squalid', 'squall', 'squalor',
  'squander', 'square', 'squarely', 'squash', 'squashy', 'squat', 'squatter', 'squaw', 'squawk', 'squeak',
  'squeaker', 'squeaky', 'squeal', 'squealer', 'squeamish', 'squeegee', 'squeeze', 'squeezer', 'squelch', 'squib',
  'squid', 'squiggle', 'squiggly', 'squint', 'squire', 'squirm', 'squirrel', 'squirt', 'squish', 'squishy',
  'stab', 'stabber', 'stable', 'stably', 'staccato', 'stack', 'stacker', 'stadium', 'staff', 'staffer',
  'stag', 'stage', 'stager', 'stagger', 'staging', 'stagnant', 'stagnate', 'stagy', 'staid', 'stain',
  'stained', 'stair', 'stairway', 'stake', 'stakeout', 'stale', 'stalemate', 'stalk', 'stalker', 'stall',
  'stallion', 'stalwart', 'stamen', 'stamina', 'stammer', 'stamp', 'stampede', 'stance', 'stanch', 'stanchion',
  'stand', 'standard', 'standby', 'stander', 'standing', 'standoff', 'standout', 'stank', 'stanza', 'staple',
  'stapler', 'star', 'starboard', 'starch', 'starchy', 'stardom', 'stardust', 'stare', 'starer', 'starfish',
  'stargaze', 'stark', 'starkly', 'starlet', 'starlight', 'starling', 'starlit', 'starry', 'start', 'starter',
  'startle', 'startup', 'starve', 'stash', 'state', 'stately', 'statement', 'stateroom', 'statesman', 'static',
  'station', 'statism', 'statist', 'stator', 'statuary', 'statue', 'stature', 'status', 'statute', 'staunch',
  'stave', 'stay', 'stead', 'steadfast', 'steadily', 'steady', 'steak', 'steal', 'stealth', 'stealthy',
  'steam', 'steamer', 'steamy', 'steed', 'steel', 'steely', 'steep', 'steepen', 'steeple', 'steeply',
  'steer', 'steerage', 'stein', 'stellar', 'stem', 'stemware', 'stench', 'stencil', 'steno', 'step',
  'steppe', 'stepper', 'stereo', 'sterile', 'sterling', 'stern', 'sternly', 'sternum', 'steroid', 'stet',
  'stew', 'steward', 'stick', 'sticker', 'stickle', 'stickler', 'stickpin', 'sticky', 'stiff', 'stiffen',
  'stiffly', 'stifle', 'stigma', 'stile', 'stiletto', 'still', 'stillness', 'stilt', 'stilted', 'stimuli',
  'stimulus', 'sting', 'stinger', 'stingily', 'stingy', 'stink', 'stinker', 'stinky', 'stint', 'stipend',
  'stipple', 'stipulate', 'stir', 'stirrer', 'stirring', 'stirrup', 'stitch', 'stoat', 'stock', 'stockade',
  'stocking', 'stockist', 'stockpile', 'stocky', 'stodgy', 'stogie', 'stoic', 'stoical', 'stoicism', 'stoke',
  'stoker', 'stole', 'stolen', 'stolid', 'stolidly', 'stomach', 'stomp', 'stone', 'stonily', 'stony',
  'stood', 'stooge', 'stool', 'stoop', 'stop', 'stopgap', 'stoplight', 'stopover', 'stoppage', 'stopper',
  'stopwatch', 'storage', 'store', 'stork', 'storm', 'stormy', 'story', 'stout', 'stoutly', 'stove',
  'stovepipe', 'stow', 'stowage', 'stowaway', 'straddle', 'strafe', 'straggle', 'straggler', 'straight', 'strain',
  'strainer', 'strait', 'straiten', 'strand', 'strange', 'strangely', 'stranger', 'strangle', 'strap', 'strapless',
  'strata', 'strategy', 'stratify', 'stratum', 'straw', 'stray', 'streak', 'streaker', 'streaky', 'stream',
  'streamer', 'street', 'streetcar', 'strength', 'stress', 'stretch', 'stretcher', 'stretchy', 'strew', 'strewn',
  'striated', 'stricken', 'strict', 'strictly', 'stridden', 'stride', 'strident', 'strife', 'strike', 'striker',
  'striking', 'string', 'stringed', 'stringent', 'stringer', 'stringy', 'strip', 'stripe', 'striped', 'striper',
  'stripling', 'stripper', 'strive', 'striven', 'strobe', 'strode', 'stroke', 'stroll', 'stroller', 'strong',
  'strongly', 'strontium', 'strop', 'strophe', 'strove', 'struck', 'structure', 'strudel', 'struggle', 'strum',
  'strumpet', 'strung', 'strut', 'stub', 'stubble', 'stubbly', 'stubborn', 'stubby', 'stucco', 'stuck',
  'stud', 'student', 'studied', 'studio', 'studious', 'study', 'stuff', 'stuffing', 'stuffy', 'stultify',
  'stumble', 'stump', 'stumper', 'stumpy', 'stun', 'stung', 'stunk', 'stunner', 'stunning', 'stunt',
  'stupefy', 'stupor', 'sturdily', 'sturdy', 'sturgeon', 'stutter', 'sty', 'style', 'styling', 'stylish',
  'stylist', 'stylize', 'stylus', 'stymie', 'suave', 'suavely', 'sub', 'subatomic', 'subclass', 'subdivide',
  'subdue', 'subgroup', 'subject', 'subjoin', 'subjugate', 'sublease', 'sublet', 'sublime', 'submarine', 'submerge',
  'submit', 'subnet', 'suborn', 'subplot', 'subpoena', 'subscribe', 'subscript', 'subset', 'subside', 'subsidize',
  'subsidy', 'subsist', 'subsoil', 'substance', 'substation', 'subtitle', 'subtle', 'subtlety', 'subtly', 'subtotal',
  'subtract', 'suburb', 'suburban', 'suburbia', 'subvert', 'subway', 'succeed', 'success', 'succinct', 'succor',
  'succotash', 'succulent', 'succumb', 'such', 'suck', 'sucker', 'suckle', 'suckling', 'suction', 'sudden',
  'suddenly', 'suds', 'sudsy', 'sue', 'suede', 'suet', 'suffer', 'sufferer', 'suffice', 'suffix',
  'suffocate', 'suffrage', 'suffuse', 'sugar', 'sugary', 'suggest', 'suit', 'suitable', 'suitably', 'suitcase',
  'suite', 'suitor', 'sulfur', 'sulk', 'sulkily', 'sulky', 'sullen', 'sullenly', 'sully', 'sultan',
  'sultana', 'sultry', 'sum', 'sumac', 'summarize', 'summary', 'summation', 'summer', 'summery', 'summit',
  'summon', 'summoner', 'sump', 'sumptuous', 'sun', 'sunbaked', 'sunbathe', 'sunbeam', 'sunblock', 'sunburn',
  'sunburst', 'sundae', 'sunday', 'sunder', 'sundial', 'sundown', 'sundress', 'sundry', 'sunfish', 'sunflower',
  'sung', 'sunglass', 'sunk', 'sunken', 'sunlamp', 'sunless', 'sunlight', 'sunlit', 'sunny', 'sunrise',
  'sunroof', 'sunset', 'sunshade', 'sunshine', 'sunspot', 'suntan', 'sunup', 'sup', 'super', 'superb',
  'superbly', 'superhero', 'superior', 'superman', 'supernova', 'superstar', 'supine', 'supper', 'supplant', 'supple',
  'supply', 'support', 'supporter', 'suppose', 'suppress', 'supreme', 'supremely', 'surcharge', 'sure', 'surefire',
  'surely', 'sureness', 'surety', 'surf', 'surface', 'surfboard', 'surfeit', 'surfer', 'surfing', 'surge',
  'surgeon', 'surgery', 'surgical', 'surlily', 'surly', 'surmise', 'surmount', 'surname', 'surpass', 'surplice',
  'surplus', 'surprise', 'surreal', 'surrender', 'surrey', 'surrogate', 'surround', 'surtax', 'survey', 'surveyor',
  'survival', 'survive', 'survivor', 'suspect', 'suspend', 'suspense', 'sustain', 'suture', 'suzerain', 'svelte',
  'swab', 'swaddle', 'swag', 'swagger', 'swain', 'swallow', 'swam', 'swami', 'swamp', 'swampy',
  'swan', 'swank', 'swanky', 'swap', 'sward', 'swarm', 'swarthy', 'swash', 'swat', 'swatch',
  'swath', 'swathe', 'swatter', 'sway', 'swayback', 'swear', 'sweat', 'sweater', 'sweatshop', 'sweaty',
  'sweep', 'sweeper', 'sweeping', 'sweet', 'sweeten', 'sweetener', 'sweetie', 'sweetly', 'sweetmeat', 'swell',
  'swelling', 'swelter', 'swept', 'swerve', 'swift', 'swiftly', 'swig', 'swill', 'swim', 'swimmer',
  'swimming', 'swimsuit', 'swindle', 'swindler', 'swine', 'swing', 'swinger', 'swinging', 'swipe', 'swirl',
  'swirly', 'swish', 'swiss', 'switch', 'swivel', 'swizzle', 'swollen', 'swoon', 'swoop', 'swoosh',
  'sword', 'swordfish', 'swordplay', 'swore', 'sworn', 'swum', 'swung', 'sybarite', 'sycamore', 'sycophant',
  'syllabi', 'syllabic', 'syllable', 'syllabus', 'sylph', 'sylvan', 'symbol', 'symbolic', 'symmetry', 'sympathy',
  'symphony', 'symposia', 'symposium', 'symptom', 'synagogue', 'synapse', 'sync', 'synch', 'synod', 'synonym',
  'synopsis', 'syntax', 'synth', 'synthesis', 'synthetic', 'syphilis', 'syphon', 'syringe', 'syrup', 'syrupy',
  'system', 'systemic', 'tab', 'tabasco', 'tabby', 'tabernacle', 'table', 'tableau', 'tableland', 'tablespoon',
  'tablet', 'tabletop', 'tableware', 'tabloid', 'taboo', 'tabor', 'tabulate', 'tacit', 'tacitly', 'taciturn',
  'tack', 'tackily', 'tackle', 'tackler', 'tacky', 'taco', 'tact', 'tactful', 'tactic', 'tactical',
  'tactician', 'tactile', 'tactless', 'tad', 'tadpole', 'taffeta', 'taffy', 'tag', 'tagger', 'tail',
  'tailback', 'tailcoat', 'tailgate', 'tailor', 'tailpipe', 'tailspin', 'tailwind', 'taint', 'take', 'takeaway',
  'taken', 'takeoff', 'takeout', 'takeover', 'taker', 'taking', 'talc', 'talcum', 'tale', 'talent',
  'talented', 'talisman', 'talk', 'talkative', 'talker', 'talking', 'tall', 'taller', 'tallest', 'tallow',
  'tally', 'tallyho', 'talmud', 'talon', 'tamale', 'tamarind', 'tamarisk', 'tambour', 'tame', 'tamely',
  'tamer', 'tamp', 'tamper', 'tan', 'tanager', 'tandem', 'tang', 'tangelo', 'tangent', 'tangerine',
  'tangible', 'tangle', 'tango', 'tangy', 'tank', 'tankard', 'tanker', 'tankful', 'tanner', 'tannery',
  'tannin', 'tansy', 'tantalize', 'tantamount', 'tantrum', 'tap', 'tapas', 'tape', 'taper', 'tapestry',
  'tapeworm', 'tapioca', 'tapir', 'tapper', 'tapping', 'taproom', 'taproot', 'taps', 'tar', 'tarantula',
  'tardily', 'tardy', 'tare', 'target', 'tariff', 'tarmac', 'tarn', 'tarnish', 'taro', 'tarot',
  'tarp', 'tarpaulin', 'tarpon', 'tarragon', 'tarry', 'tarsal', 'tart', 'tartan', 'tartar', 'tartly',
  'task', 'taskmaster', 'tassel', 'taste', 'tasteful', 'tasteless', 'taster', 'tastily', 'tasting', 'tasty',
  'tat', 'tatter', 'tattle', 'tattler', 'tattoo', 'taught', 'taunt', 'taupe', 'taurus', 'taut',
  'tauten', 'tautly', 'tautology', 'tavern', 'tawdry', 'tawny', 'tax', 'taxable', 'taxation', 'taxer',
  'taxi', 'taxicab', 'taxidermy', 'taxonomy', 'taxpayer', 'tea', 'teabag', 'teacake', 'teach', 'teachable',
  'teacher', 'teaching', 'teacup', 'teak', 'teakettle', 'teal', 'team', 'teammate', 'teamster', 'teamwork',
  'teapot', 'tear', 'teardrop', 'tearful', 'teargas', 'tearjerker', 'tearoom', 'tease', 'teasel', 'teaser',
  'teaspoon', 'teat', 'teatime', 'tech', 'technical', 'technique', 'tedious', 'tedium', 'tee', 'teem',
  'teen', 'teenage', 'teenager', 'teensy', 'teeny', 'teepee', 'teeter', 'teeth', 'teethe', 'teetotal',
  'teflon', 'telecast', 'telecom', 'telegram', 'telegraph', 'telepathy', 'telephone', 'telephoto', 'telescope', 'televise',
  'telex', 'tell', 'teller', 'telling', 'telltale', 'temp', 'temper', 'tempera', 'temperate', 'tempest',
  'template', 'temple', 'tempo', 'temporal', 'temporary', 'tempt', 'tempter', 'tempting', 'ten', 'tenable',
  'tenacious', 'tenacity', 'tenancy', 'tenant', 'tend', 'tendency', 'tender', 'tenderize', 'tenderly', 'tendon',
  'tendril', 'tenement', 'tenet', 'tenfold', 'tennis', 'tenon', 'tenor', 'tenpin', 'tense', 'tensely',
  'tensile', 'tension', 'tensor', 'tent', 'tentacle', 'tentative', 'tenter', 'tenth', 'tenuous', 'tenure',
  'tepee', 'tepid', 'tequila', 'term', 'termagant', 'terminal', 'terminate', 'terminus', 'termite', 'tern',
  'ternary', 'terrace', 'terrain', 'terrapin', 'terrazzo', 'terrible', 'terribly', 'terrier', 'terrific', 'terrify',
  'territory', 'terror', 'terrorism', 'terrorist', 'terrorize', 'terry', 'terse', 'tersely', 'tertiary', 'test',
  'testament', 'testate', 'tester', 'testicle', 'testify', 'testily', 'testimony', 'testing', 'testy', 'tetanus',
  'tether', 'tetra', 'tetrad', 'teutonic', 'text', 'textbook', 'textile', 'textual', 'texture', 'than',
  'thane', 'thank', 'thankful', 'thanks', 'that', 'thatch', 'thaw', 'the', 'theater', 'theatre',
  'thee', 'theft', 'their', 'theirs', 'theism', 'theist', 'them', 'theme', 'then', 'thence',
  'theocracy', 'theology', 'theorem', 'theoretic', 'theorist', 'theorize', 'theory', 'therapy', 'there', 'thereby',
  'therefore', 'therein', 'thereof', 'thereon', 'thereto', 'thermal', 'thermos', 'these', 'thesis', 'thespian',
  'theta', 'they', 'thick', 'thicken', 'thickener', 'thicket', 'thickly', 'thickness', 'thickset', 'thief',
  'thieve', 'thievery', 'thievish', 'thigh', 'thimble', 'thin', 'thine', 'thing', 'think', 'thinker',
  'thinking', 'thinly', 'thinner', 'thinness', 'third', 'thirdly', 'thirst', 'thirstily', 'thirsty', 'thirteen',
  'thirty', 'this', 'thistle', 'thither', 'tho', 'thong', 'thoracic', 'thorax', 'thorium', 'thorn',
  'thorny', 'thorough', 'those', 'thou', 'though', 'thought', 'thousand', 'thrall', 'thrash', 'thrasher',
  'thread', 'threadbare', 'threat', 'threaten', 'three', 'threefold', 'thresh', 'thresher', 'threshold', 'threw',
  'thrice', 'thrift', 'thriftily', 'thrifty', 'thrill', 'thriller', 'thrive', 'throat', 'throaty', 'throb',
  'throe', 'thrombosis', 'throne', 'throng', 'throttle', 'through', 'throw', 'throwaway', 'throwback', 'thrower',
  'thru', 'thrum', 'thrush', 'thrust', 'thruster', 'thruway', 'thud', 'thug', 'thuggery', 'thumb',
  'thumbnail', 'thumbtack', 'thump', 'thumper', 'thunder', 'thursday', 'thus', 'thwack', 'thwart', 'thy',
  'thyme', 'thymus', 'thyroid', 'thyself', 'tiara', 'tibia', 'tic', 'tick', 'ticker', 'ticket',
  'ticking', 'tickle', 'ticklish', 'tidal', 'tidbit', 'tide', 'tidemark', 'tidewater', 'tidily', 'tidiness',
  'tidings', 'tidy', 'tie', 'tieback', 'tiebreaker', 'tier', 'tiered', 'tiff', 'tiffany', 'tiger',
  'tight', 'tighten', 'tightfisted', 'tightly', 'tightrope', 'tights', 'tightwad', 'tigress', 'tike', 'tilde',
  'tile', 'tiler', 'tiling', 'till', 'tillage', 'tiller', 'tilt', 'tilter', 'timber', 'timbre',
  'time', 'timecard', 'timeless', 'timely', 'timepiece', 'timer', 'timescale', 'timeshare', 'timetable', 'timeworn',
  'timid', 'timidity', 'timidly', 'timing', 'timorous', 'timothy', 'timpani', 'tin', 'tincture', 'tinder',
  'tinderbox', 'tine', 'tinfoil', 'tinge', 'tingle', 'tingly', 'tinker', 'tinkle', 'tinned', 'tinny',
  'tinsel', 'tint', 'tintype', 'tiny', 'tip', 'tipoff', 'tipper', 'tippet', 'tipple', 'tippler',
  'tipsily', 'tipster', 'tipsy', 'tiptoe', 'tiptop', 'tirade', 'tire', 'tired', 'tiredly', 'tireless',
  'tiresome', 'tiro', 'tissue', 'tit', 'titan', 'titanic', 'titanium', 'titbit', 'tithe', 'tither',
  'titian', 'titillate', 'title', 'titled', 'titleholder', 'titmouse', 'titter', 'tittle', 'titular', 'tizzy',
  'toad', 'toadstool', 'toady', 'toast', 'toaster', 'toasty', 'tobacco', 'toboggan', 'tocsin', 'today',
  'toddle', 'toddler', 'toddy', 'toe', 'toehold', 'toenail', 'toffee', 'tofu', 'tog', 'toga',
  'together', 'toggle', 'toil', 'toiler', 'toilet', 'toiletry', 'toilsome', 'tokamak', 'token', 'told',
  'tolerable', 'tolerably', 'tolerance', 'tolerant', 'tolerate', 'toll', 'tollbooth', 'tollgate', 'tollway', 'toluene',
  'tom', 'tomahawk', 'tomato', 'tomb', 'tomboy', 'tombstone', 'tomcat', 'tome', 'tomfool', 'tomorrow',
  'tomtit', 'tomtom', 'ton', 'tonal', 'tonality', 'tone', 'toneless', 'toner', 'tong', 'tongs',
  'tongue', 'tonic', 'tonight', 'tonnage', 'tonne', 'tonsil', 'tonsure', 'too', 'took', 'tool',
  'toolbox', 'toolkit', 'toolmaker', 'toolshed', 'toot', 'tooth', 'toothache', 'toothbrush', 'toothed', 'toothless',
  'toothpaste', 'toothpick', 'toothsome', 'toothy', 'tootle', 'top', 'topaz', 'topcoat', 'tope', 'toper',
  'topiary', 'topic', 'topical', 'topknot', 'topless', 'topmost', 'topper', 'topping', 'topple', 'topsail',
  'topsoil', 'toque', 'tor', 'torah', 'torch', 'tore', 'toreador', 'torment', 'tormentor', 'torn',
  'tornado', 'torpedo', 'torpid', 'torpor', 'torque', 'torrent', 'torrid', 'torsion', 'torso', 'tort',
  'torte', 'tortilla', 'tortoise', 'tortuous', 'torture', 'torturer', 'tory', 'toss', 'tosser', 'tossup',
  'tot', 'total', 'totality', 'totally', 'tote', 'totem', 'totter', 'toucan', 'touch', 'touchdown',
  'touched', 'touchily', 'touching', 'touchstone', 'touchup', 'touchy', 'tough', 'toughen', 'toughly', 'toughness',
  'toupee', 'tour', 'tourism', 'tourist', 'tourney', 'tourniquet', 'tousle', 'tout', 'tow', 'towage',
  'toward', 'towards', 'towboat', 'towel', 'toweling', 'tower', 'towering', 'towhead', 'towhee', 'towline',
  'town', 'townhouse', 'townsfolk', 'township', 'townsman', 'towpath', 'towrope', 'toxemia', 'toxic', 'toxicity',
  'toxin', 'toy', 'toybox', 'toyland', 'toymaker', 'toyshop', 'trace', 'traceable', 'tracer', 'tracery',
  'trachea', 'tracing', 'track', 'trackage', 'tracker', 'trackless', 'tracksuit', 'tract', 'tractable', 'traction',
  'tractor', 'trade', 'trademark', 'trader', 'tradesman', 'trading', 'tradition', 'traduce', 'traffic', 'tragedy',
  'tragic', 'tragically', 'trail', 'trailer', 'train', 'trainee', 'trainer', 'training', 'trainload', 'trainman',
  'traipse', 'trait', 'traitor', 'tram', 'tramcar', 'trammel', 'tramp', 'trample', 'trampler', 'trampoline',
  'tramway', 'trance', 'tranquil', 'transact', 'transcend', 'transcribe', 'transcript', 'transept', 'transfer', 'transfix',
  'transform', 'transfuse', 'transgress', 'transient', 'transistor', 'transit', 'translate', 'transmit', 'transmute', 'transom',
  'transparent', 'transpire', 'transplant', 'transport', 'transpose', 'transship', 'transverse', 'trap', 'trapdoor', 'trapeze',
  'trapezium', 'trapezoid', 'trapper', 'trapping', 'trash', 'trashy', 'trauma', 'traumatic', 'travail', 'travel',
  'traveler', 'traveling', 'traverse', 'travesty', 'trawl', 'trawler', 'tray', 'treacherous', 'treachery', 'treacle',
  'tread', 'treadle', 'treadmill', 'treason', 'treasure', 'treasurer', 'treasury', 'treat', 'treatise', 'treatment',
  'treaty', 'treble', 'trebly', 'tree', 'treeless', 'treeline', 'treetop', 'trefoil', 'trek', 'trekker',
  'trellis', 'tremble', 'trembler', 'trembly', 'tremendous', 'tremolo', 'tremor', 'tremulous', 'trench', 'trenchant',
  'trencher', 'trend', 'trendy', 'trepan', 'trephine', 'trepidation', 'trespass', 'tress', 'trestle', 'trey',
  'triad', 'triage', 'trial', 'triangle', 'triathlon', 'tribal', 'tribalism', 'tribe', 'tribesman', 'tribunal',
  'tribune', 'tributary', 'tribute', 'trice', 'triceps', 'trichina', 'trick', 'trickery', 'trickily', 'trickle',
  'trickster', 'tricky', 'tricolor', 'tricorn', 'tricycle', 'trident', 'tried', 'triennial', 'trier', 'trifle',
  'trifler', 'trifling', 'trifocal', 'trigger', 'trigram', 'trilateral', 'trilby', 'trill', 'trillion', 'trillium',
  'trilobite', 'trilogy', 'trim', 'trimaran', 'trimester', 'trimly', 'trimmer', 'trimming', 'trine', 'trinity',
  'trinket', 'trio', 'triode', 'trip', 'tripartite', 'tripe', 'triplane', 'triple', 'triplet', 'triplex',
  'triplicate', 'triply', 'tripod', 'tripper', 'tripping', 'triptych', 'trireme', 'trisect', 'trite', 'tritely',
  'tritium', 'triton', 'triturate', 'triumph', 'triumphal', 'triumphant', 'triumvir', 'trivalent', 'trivet', 'trivia',
  'trivial', 'trochaic', 'trochee', 'trod', 'trodden', 'troglodyte', 'troika', 'trojan', 'troll', 'trolley',
  'trollop', 'trombone', 'tromp', 'troop', 'trooper', 'troopship', 'trope', 'trophy', 'tropic', 'tropical',
  'tropism', 'trot', 'troth', 'trotter', 'trouble', 'troubler', 'trough', 'trounce', 'troupe', 'trouper',
  'trouser', 'trousers', 'trousseau', 'trout', 'trow', 'trowel', 'troy', 'truancy', 'truant', 'truce',
  'truck', 'truckage', 'trucker', 'trucking', 'truckle', 'truckload', 'truculent', 'trudge', 'true', 'trueborn',
  'truehearted', 'truelove', 'truffle', 'truism', 'truly', 'trump', 'trumpery', 'trumpet', 'trumpeter', 'truncate',
  'truncheon', 'trundle', 'trunk', 'trunkful', 'truss', 'trust', 'trustee', 'trustful', 'trustily', 'trusting',
  'trusty', 'truth', 'truthful', 'try', 'trying', 'tryout', 'tryst', 'tsar', 'tsarina', 'tsetse',
  'tsunami', 'tub', 'tuba', 'tubal', 'tubby', 'tube', 'tubeless', 'tuber', 'tubercle', 'tuberose',
  'tuberous', 'tubful', 'tubing', 'tubular', 'tuck', 'tucker', 'tuesday', 'tufa', 'tuft', 'tufted',
  'tug', 'tugboat', 'tugger', 'tuition', 'tulip', 'tulle', 'tumble', 'tumbler', 'tumbrel', 'tumescent',
  'tumid', 'tummy', 'tumor', 'tumult', 'tumulus', 'tun', 'tuna', 'tundra', 'tune', 'tuneful',
  'tuneless', 'tuner', 'tuneup', 'tungsten', 'tunic', 'tuning', 'tunnel', 'tunneler', 'tupelo', 'tuque',
  'turban', 'turbid', 'turbine', 'turbo', 'turbofan', 'turbojet', 'turboprop', 'turbot', 'turbulent', 'tureen',
  'turf', 'turgid', 'turkey', 'turmoil', 'turn', 'turnabout', 'turnbuckle', 'turncoat', 'turndown', 'turner',
  'turning', 'turnip', 'turnkey', 'turnoff', 'turnout', 'turnover', 'turnpike', 'turnstile', 'turntable', 'turpentine',
  'turpitude', 'turquoise', 'turret', 'turtle', 'turtledove', 'turtleneck', 'tuscan', 'tush', 'tusk', 'tusked',
  'tusker', 'tussle', 'tussock', 'tut', 'tutelage', 'tutelary', 'tutor', 'tutorial', 'tutti', 'tutu',
  'tux', 'tuxedo', 'twaddle', 'twain', 'twang', 'twangy', 'tweak', 'tweed', 'tweedy', 'tween',
  'tweet', 'tweeter', 'tweeze', 'tweezer', 'tweezers', 'twelfth', 'twelve', 'twentieth', 'twenty', 'twerp',
  'twice', 'twiddle', 'twig', 'twiggy', 'twilight', 'twill', 'twin', 'twine', 'twiner', 'twinge',
  'twinkle', 'twinkling', 'twirl', 'twirler', 'twirly', 'twist', 'twister', 'twisty', 'twit', 'twitch',
  'twitchy', 'twitter', 'twixt', 'two', 'twofold', 'twopence', 'twosome', 'tycoon', 'tying', 'tyke',
  'tympani', 'tympanum', 'type', 'typecast', 'typeface', 'typeset', 'typewrite', 'typhoid', 'typhoon', 'typhus',
  'typical', 'typically', 'typify', 'typing', 'typist', 'typo', 'tyranny', 'tyrant', 'tyro', 'tzar',
  'udder', 'uglily', 'ugliness', 'ugly', 'ukulele', 'ulcer', 'ulcerate', 'ulcerous', 'ulna', 'ulnar',
  'ulster', 'ulterior', 'ultimate', 'ultimatum', 'ultimo', 'ultra', 'ululate', 'umbel', 'umber', 'umbilical',
  'umbilicus', 'umbra', 'umbrage', 'umbrella', 'umlaut', 'ump', 'umpire', 'umpteen', 'umpteenth', 'unabashed',
  'unabated', 'unable', 'unabridged', 'unaccounted', 'unadorned', 'unaided', 'unaligned', 'unaltered', 'unanimous', 'unarmed',
  'unasked', 'unassisted', 'unassuming', 'unattached', 'unattended', 'unaware', 'unawares', 'unbalance', 'unbar', 'unbearable',
  'unbeaten', 'unbecoming', 'unbeknown', 'unbelief', 'unbeliever', 'unbend', 'unbending', 'unbent', 'unbiased', 'unbidden',
  'unbind', 'unbleached', 'unblemished', 'unblinking', 'unblock', 'unblushing', 'unbolt', 'unborn', 'unbosom', 'unbound',
  'unbounded', 'unbowed', 'unbox', 'unbraid', 'unbranched', 'unbranded', 'unbreakable', 'unbridled', 'unbroken', 'unbuckle',
  'unbundle', 'unburden', 'unburied', 'unburned', 'unbutton', 'uncaged', 'uncalled', 'uncannily', 'uncanny', 'uncap',
  'uncared', 'uncaring', 'uncertain', 'unchain', 'unchanged', 'uncharted', 'unchecked', 'uncivil', 'unclad', 'unclaimed',
  'unclasp', 'uncle', 'unclean', 'uncleanly', 'unclear', 'unclench', 'unclip', 'uncloak', 'unclog', 'unclothe',
  'unclouded', 'uncoil', 'uncolored', 'uncombed', 'uncombined', 'uncomely', 'uncommon', 'unconcern', 'unconfined', 'unconfirmed',
  'unconnected', 'unconquered', 'unconscious', 'uncooked', 'uncool', 'uncork', 'uncounted', 'uncouple', 'uncouth', 'uncover',
  'uncovered', 'uncritical', 'uncross', 'uncrowned', 'unction', 'unctuous', 'uncultured', 'uncurb', 'uncurl', 'uncut',
  'undamaged', 'undamped', 'undated', 'undaunted', 'undeceive', 'undecided', 'undeclared', 'undefiled', 'undefined', 'undeniable',
  'under', 'underact', 'underage', 'underarm', 'underbid', 'underbody', 'underbred', 'underbrush', 'undercar', 'undercoat',
  'undercook', 'undercover', 'undercut', 'underdo', 'underdog', 'underdone', 'underfed', 'underfeed', 'underfoot', 'underfur',
  'undergarment', 'undergo', 'undergone', 'undergrad', 'underground', 'undergrowth', 'underhand', 'underlay', 'underlie', 'underline',
  'underling', 'undermine', 'undermost', 'underneath', 'underpaid', 'underpants', 'underpart', 'underpass', 'underpay', 'underpin',
  'underplay', 'underprice', 'underrate', 'underscore', 'undersea', 'undersell', 'underset', 'undershirt', 'undershoot', 'undershot',
  'underside', 'undersign', 'undersize', 'underskirt', 'undersold', 'understand', 'understate', 'understood', 'understudy', 'undertake',
  'undertaker', 'undertaking', 'undertone', 'undertook', 'undertow', 'underuse', 'undervalue', 'underwater', 'underwear', 'underwent',
  'underwire', 'underwood', 'underworld', 'underwrite', 'underwriter', 'undeserved', 'undesired', 'undid', 'undies', 'undigested',
  'undignified', 'undiluted', 'undimmed', 'undivided', 'undo', 'undoing', 'undone', 'undoubted', 'undrape', 'undreamed',
  'undress', 'undressed', 'undried', 'undue', 'undulant', 'undulate', 'unduly', 'undying', 'unearned', 'unearth',
  'unearthly', 'unease', 'uneasily', 'uneasiness', 'uneasy', 'uneatable', 'uneaten', 'unedited', 'uneducated', 'unemployed',
  'unending', 'unendurable', 'unenviable', 'unequal', 'unequaled', 'unequally', 'unequivocal', 'unerring', 'unethical', 'uneven',
  'unevenly', 'uneventful', 'unexamined', 'unexampled', 'unexcelled', 'unexpected', 'unexpired', 'unexplained', 'unexplored', 'unexposed',
  'unfailing', 'unfair', 'unfairly', 'unfaithful', 'unfamiliar', 'unfasten', 'unfathomed', 'unfed', 'unfeeling', 'unfeigned',
  'unfelt', 'unfermented', 'unfetter', 'unfilled', 'unfinished', 'unfired', 'unfit', 'unfitting', 'unfix', 'unfixed',
  'unflagging', 'unflappable', 'unflattering', 'unfledged', 'unflinching', 'unfold', 'unforced', 'unforeseen', 'unforgiven', 'unforgiving',
  'unformed', 'unfounded', 'unframed', 'unfree', 'unfreeze', 'unfriendly', 'unfrock', 'unfrozen', 'unfruitful', 'unfulfilled',
  'unfunded', 'unfurl', 'unfurnished', 'ungainly', 'unglazed', 'ungloved', 'unglue', 'ungodly', 'ungoverned', 'ungracious',
  'ungraded', 'ungrateful', 'unguarded', 'unguent', 'unguided', 'ungulate', 'unhallowed', 'unhand', 'unhandled', 'unhandsome',
  'unhandy', 'unhappily', 'unhappy', 'unharmed', 'unharness', 'unhatched', 'unhealed', 'unhealthy', 'unheard', 'unheated',
  'unheeded', 'unhelpful', 'unheralded', 'unheroic', 'unhesitating', 'unhindered', 'unhinge', 'unhitch', 'unholy', 'unhonored',
  'unhook', 'unhoped', 'unhorse', 'unhoused', 'unhurried', 'unhurt', 'unhusked', 'unicorn', 'unicycle', 'unifiable',
  'unification', 'unified', 'unifier', 'uniform', 'uniformed', 'uniformity', 'uniformly', 'unify', 'unilateral', 'unimagined',
  'unimpaired', 'unimpeachable', 'unimpeded', 'unimportant', 'unimposed', 'unimpressed', 'unimproved', 'unindexed', 'uninfected', 'uninformed',
  'uninhabited', 'uninhibited', 'uninitiated', 'uninjured', 'uninspired', 'uninsured', 'unintended', 'uninterested', 'uninterrupted', 'uninvited',
  'union', 'unionism', 'unionist', 'unionize', 'unique', 'uniquely', 'unisex', 'unison', 'unit', 'unitarian',
  'unitary', 'unite', 'united', 'uniter', 'unity', 'univalent', 'univalve', 'universal', 'universe', 'university',
  'unjust', 'unjustly', 'unkempt', 'unkind', 'unkindly', 'unknowable', 'unknowing', 'unknown', 'unlace', 'unlade',
  'unladen', 'unlatch', 'unlawful', 'unleaded', 'unlearn', 'unlearned', 'unleash', 'unleavened', 'unless', 'unlettered',
  'unlicensed', 'unlike', 'unlikely', 'unlimber', 'unlimited', 'unlined', 'unlink', 'unlisted', 'unlit', 'unload',
  'unloaded', 'unloader', 'unlock', 'unlocked', 'unlooked', 'unloose', 'unloosen', 'unloved', 'unlovely', 'unloving',
  'unluckily', 'unlucky', 'unmade', 'unmake', 'unman', 'unmanly', 'unmanned', 'unmannerly', 'unmapped', 'unmarked',
  'unmarred', 'unmarried', 'unmask', 'unmasked', 'unmatched', 'unmeaning', 'unmeasured', 'unmeet', 'unmelted', 'unmended',
  'unmentioned', 'unmerciful', 'unmerited', 'unmet', 'unmindful', 'unmingled', 'unmistakable', 'unmitigated', 'unmixed', 'unmodified',
  'unmolested', 'unmoor', 'unmoral', 'unmotivated', 'unmounted', 'unmourned', 'unmoved', 'unmoving', 'unmown', 'unmuffle',
  'unmusical', 'unmuzzle', 'unnamed', 'unnatural', 'unneeded', 'unnerve', 'unnoticed', 'unnumbered', 'unobserved', 'unobstructed',
  'unobtained', 'unobtrusive', 'unoccupied', 'unofficial', 'unopened', 'unopposed', 'unordained', 'unorganized', 'unoriginal', 'unorthodox',
  'unowned', 'unpack', 'unpacked', 'unpaid', 'unpainted', 'unpaired', 'unpalatable', 'unparalleled', 'unpardonable', 'unpaved',
  'unpeeled', 'unpeg', 'unpen', 'unpeopled', 'unperceived', 'unperformed', 'unperturbed', 'unpicked', 'unpin', 'unpitied',
  'unpitying', 'unplaced', 'unplanned', 'unplanted', 'unplayed', 'unpleasant', 'unpleasing', 'unpledged', 'unplowed', 'unplucked',
  'unplug', 'unplugged', 'unplumbed', 'unpoetic', 'unpointed', 'unpoised', 'unpolished', 'unpolluted', 'unpopular', 'unpopulated',
  'unposed', 'unposted', 'unpracticed', 'unpraised', 'unpredicted', 'unprejudiced', 'unprepared', 'unpressed', 'unpretending', 'unpriced',
  'unprimed', 'unprincipled', 'unprinted', 'unprivileged', 'unprized', 'unprobed', 'unprocessed', 'unproclaimed', 'unproductive', 'unprofaned',
  'unprofessed', 'unprofitable', 'unpromising', 'unprompted', 'unpronounced', 'unpropitious', 'unprotected', 'unproved', 'unproven', 'unprovided',
  'unprovoked', 'unpruned', 'unpublished', 'unpunished', 'unpurged', 'unpurified', 'unqualified', 'unquenched', 'unquestioned', 'unquiet',
  'unquoted', 'unraced', 'unraised', 'unraked', 'unranked', 'unrated', 'unratified', 'unravel', 'unreached', 'unread',
  'unreadable', 'unready', 'unreal', 'unrealized', 'unreason', 'unrebuked', 'unreceived', 'unreckoned', 'unreclaimed', 'unrecorded',
  'unredeemed', 'unrefined', 'unreflecting', 'unreformed', 'unrefuted', 'unregarded', 'unregistered', 'unregulated', 'unrehearsed', 'unrelated',
  'unrelaxed', 'unreleased', 'unrelenting', 'unreliable', 'unrelieved', 'unremarked', 'unremedied', 'unremembered', 'unremitted', 'unremitting',
  'unremoved', 'unrenewed', 'unrented', 'unrepaid', 'unrepaired', 'unrepealed', 'unrepeated', 'unrepentant', 'unreported', 'unrepressed',
  'unreproved', 'unrequested', 'unrequited', 'unreserved', 'unresolved', 'unrespected', 'unresponsive', 'unrest', 'unrested', 'unrestored',
  'unrestrained', 'unrestricted', 'unretained', 'unretarded', 'unretentive', 'unretracted', 'unreturned', 'unrevealed', 'unrevenged', 'unreversed',
  'unreviewed', 'unrevised', 'unrevived', 'unrevoked', 'unrewarded', 'unrhymed', 'unribbed', 'unridden', 'unriddle', 'unrifled',
  'unrig', 'unrigged', 'unrighteous', 'unrimed', 'unrinsed', 'unrip', 'unripe', 'unripened', 'unrisen', 'unrivaled',
  'unrivet', 'unroasted', 'unrobe', 'unroll', 'unrolled', 'unromantic', 'unroofed', 'unroot', 'unrooted', 'unrounded',
  'unroused', 'unrouted', 'unruffled', 'unruled', 'unruliness', 'unruly', 'unrusted', 'unsaddle', 'unsafe', 'unsafely',
  'unsaid', 'unsalable', 'unsalted', 'unsampled', 'unsanctioned', 'unsanded', 'unsanitary', 'unsated', 'unsatisfied', 'unsaturated',
  'unsaved', 'unsavory', 'unscaled', 'unscanned', 'unscarred', 'unscathed', 'unscented', 'unscheduled', 'unschooled', 'unscientific',
  'unscoured', 'unscraped', 'unscratched', 'unscreened', 'unscrew', 'unscripted', 'unscrupulous', 'unseal', 'unsealed', 'unseam',
  'unseamed', 'unseared', 'unsearched', 'unseasonable', 'unseasoned', 'unseat', 'unseated', 'unseconded', 'unsecured', 'unseeded',
  'unseeing', 'unseemly', 'unseen', 'unseized', 'unselected', 'unselfish', 'unsellable', 'unsent', 'unseparated', 'unserved',
  'unserviceable', 'unset', 'unsettle', 'unsettled', 'unsew', 'unsewn', 'unshackle', 'unshaded', 'unshadowed', 'unshaken',
  'unshaped', 'unshapely', 'unshared', 'unsharpened', 'unshaved', 'unshaven', 'unsheathe', 'unshed', 'unshelled', 'unsheltered',
  'unshielded', 'unshifted', 'unshod', 'unshorn', 'unshrinking', 'unshrouded', 'unshrunk', 'unshuttered', 'unsifted', 'unsighted',
  'unsightly', 'unsigned', 'unsilenced', 'unsilvered', 'unsinged', 'unsinkable', 'unsized', 'unskimmed', 'unskinned', 'unslaked',
  'unsliced', 'unslipped', 'unsmirched', 'unsmoked', 'unsmoothed', 'unsmudged', 'unsnap', 'unsnarl', 'unsnipped', 'unsoaked',
  'unsoaped', 'unsober', 'unsociable', 'unsocial', 'unsoiled', 'unsold', 'unsolder', 'unsolicited', 'unsolid', 'unsolved',
  'unsonorous', 'unsorted', 'unsought', 'unsound', 'unsoundly', 'unsoured', 'unsowed', 'unsown', 'unsparing', 'unspeakable',
  'unspecified', 'unspectacular', 'unspent', 'unspiced', 'unspilled', 'unspilt', 'unsplit', 'unspoiled', 'unspoilt', 'unspoken',
  'unsponsored', 'unsporting', 'unspotted', 'unsprung', 'unspun', 'unsquared', 'unstable', 'unstably', 'unstacked', 'unstaffed',
  'unstained', 'unstamped', 'unstanched', 'unstarched', 'unstated', 'unstatesmanlike', 'unsteadily', 'unsteady', 'unsteamed', 'unsteered',
  'unstep', 'unsterile', 'unstick', 'unstiffened', 'unstinted', 'unstinting', 'unstirred', 'unstitch', 'unstocked', 'unstopped',
  'unstoppered', 'unstored', 'unstrained', 'unstrapped', 'unstratified', 'unstressed', 'unstretched', 'unstriped', 'unstripped', 'unstrung',
  'unstuck', 'unstudied', 'unstuffed', 'unstung', 'unsubdued', 'unsubmitted', 'unsubscribed', 'unsubsidized', 'unsubstantial', 'unsubtle',
  'unsuccessful', 'unsued', 'unsugared', 'unsuitable', 'unsuitably', 'unsuited', 'unsullied', 'unsung', 'unsunk', 'unsupervised',
  'unsupplied', 'unsupported', 'unsuppressed', 'unsure', 'unsurely', 'unsurpassed', 'unsurprised', 'unsuspected', 'unsuspecting', 'unsustained',
  'unswaddle', 'unswayed', 'unsweetened', 'unswept', 'unswerving', 'unsworn', 'unsymmetrical', 'unsympathetic', 'unsystematic', 'untack',
  'untacked', 'untagged', 'untainted', 'untaken', 'untamed', 'untangle', 'untanned', 'untaped', 'untapped', 'untarnished',
  'untarred', 'untasted', 'untaught', 'untaxed', 'unteachable', 'untempered', 'untenable', 'untenanted', 'untended', 'untested',
  'untether', 'unthanked', 'unthankful', 'unthawed', 'unthinkable', 'unthinking', 'unthought', 'unthread', 'unthrifty', 'unthrone',
  'untidily', 'untidy', 'untie', 'untied', 'until', 'untilled', 'untilted', 'untimely', 'untinged', 'untinted',
  'untired', 'untiring', 'untitled', 'unto', 'untoasted', 'untold', 'untoward', 'untraceable', 'untraced', 'untracked',
  'untrained', 'untrammeled', 'untransacted', 'untranscribed', 'untransferred', 'untransformed', 'untranslated', 'untransmitted', 'untrapped', 'untraveled',
  'untraversed', 'untread', 'untreated', 'untried', 'untrimmed', 'untrod', 'untrodden', 'untroubled', 'untrue', 'untruly',
  'untruss', 'untrusted', 'untrustworthy', 'untruth', 'untruthful', 'untuck', 'untucked', 'untufted', 'untuned', 'unturned',
  'untutored', 'untwine', 'untwist', 'untying', 'unusable', 'unused', 'unusual', 'unusually', 'unuttered', 'unvacated',
  'unvaccinated', 'unvalidated', 'unvalued', 'unvanquished', 'unvaried', 'unvarnished', 'unvarying', 'unveil', 'unveiled', 'unveiling',
  'unvented', 'unventilated', 'unverifiable', 'unverified', 'unversed', 'unvexed', 'unvisited', 'unvoiced', 'unvoted', 'unvouched',
  'unwaked', 'unwakened', 'unwalled', 'unwanted', 'unwarmed', 'unwarned', 'unwarped', 'unwarranted', 'unwary', 'unwashed',
  'unwasted', 'unwatched', 'unwatered', 'unwavering', 'unwaxed', 'unweaned', 'unwearied', 'unweary', 'unweathered', 'unweave',
  'unwed', 'unwedded', 'unweeded', 'unweighed', 'unwelcome', 'unwelded', 'unwell', 'unwept', 'unwetted', 'unwhipped',
  'unwholesome', 'unwieldy', 'unwilled', 'unwilling', 'unwillingly', 'unwind', 'unwinking', 'unwinning', 'unwiped', 'unwired',
  'unwise', 'unwisely', 'unwished', 'unwithered', 'unwitnessed', 'unwitting', 'unwittingly', 'unwitty', 'unwomanly', 'unwon',
  'unwonted', 'unwooed', 'unwooded', 'unworkable', 'unworked', 'unworldly', 'unworn', 'unworried', 'unworthily', 'unworthy',
  'unwound', 'unwounded', 'unwoven', 'unwrap', 'unwrapped', 'unwrinkled', 'unwritten', 'unwrought', 'unwrung', 'unyielding',
  'unyoke', 'unzip', 'unzipped', 'up', 'upbeat', 'upbraid', 'upbringing', 'upbuild', 'upcast', 'upchuck',
  'upcoming', 'upcountry', 'upcurl', 'update', 'updraft', 'upend', 'upfield', 'upfront', 'upgrade', 'upgrowth',
  'upheaval', 'upheave', 'upheld', 'uphill', 'uphold', 'upholder', 'upholster', 'upkeep', 'upland', 'uplift',
  'uplit', 'upload', 'upmost', 'upon', 'upper', 'uppercut', 'uppermost', 'uppish', 'uppity', 'upraise',
  'uprear', 'upright', 'uprightly', 'uprise', 'uprising', 'upriver', 'uproar', 'uproarious', 'uproot', 'uprose',
  'upscale', 'upset', 'upsetter', 'upsetting', 'upshift', 'upshoot', 'upshot', 'upside', 'upsilon', 'upspring',
  'upstage', 'upstair', 'upstairs', 'upstand', 'upstanding', 'upstart', 'upstate', 'upstream', 'upstroke', 'upsurge',
  'upsweep', 'upswell', 'upswept', 'upswing', 'uptake', 'upthrust', 'uptick', 'uptight', 'uptime', 'uptown',
  'uptrend', 'upturn', 'upward', 'upwards', 'upwell', 'upwind', 'uranium', 'uranus', 'urban', 'urbane',
  'urbanely', 'urbanism', 'urbanite', 'urbanize', 'urchin', 'urea', 'uremia', 'ureter', 'urethra', 'urge',
  'urgency', 'urgent', 'urgently', 'uric', 'urinal', 'urinary', 'urinate', 'urine', 'urn', 'urology',
  'ursine', 'us', 'usable', 'usage', 'use', 'useful', 'usefully', 'useless', 'user', 'usher',
  'usherette', 'usual', 'usually', 'usurer', 'usurious', 'usurp', 'usurper', 'usury', 'utensil', 'uterine',
  'uterus', 'utility', 'utilize', 'utmost', 'utopia', 'utopian', 'utter', 'utterance', 'utterly', 'uttermost',
  'uvula', 'uvular', 'uxorious', 'vac', 'vacancy', 'vacant', 'vacantly', 'vacate', 'vacation', 'vaccinate',
  'vaccine', 'vacillate', 'vacuity', 'vacuous', 'vacuum', 'vagabond', 'vagary', 'vagrant', 'vague', 'vaguely',
  'vagueness', 'vain', 'vainglory', 'vainly', 'valance', 'vale', 'valedictory', 'valence', 'valency', 'valentine',
  'valerian', 'valet', 'valiant', 'valiantly', 'valid', 'validate', 'validity', 'validly', 'valise', 'valkyrie',
  'valley', 'valor', 'valorous', 'valuable', 'valuably', 'valuation', 'value', 'valued', 'valueless', 'valuer',
  'valve', 'valved', 'valvular', 'vamoose', 'vamp', 'vampire', 'vampirism', 'van', 'vanadium', 'vandal',
  'vandalism', 'vandalize', 'vandyke', 'vane', 'vanguard', 'vanilla', 'vanish', 'vanity', 'vanquish', 'vantage',
  'vapid', 'vapidity', 'vapidly', 'vapor', 'vaporize', 'vaporous', 'vapory', 'vaquero', 'variable', 'variably',
  'variance', 'variant', 'variation', 'varicose', 'varied', 'variegate', 'variety', 'variform', 'variola', 'variorum',
  'various', 'variously', 'varlet', 'varmint', 'varnish', 'varsity', 'vary', 'varying', 'vascular', 'vase',
  'vaseline', 'vassal', 'vassalage', 'vast', 'vastly', 'vastness', 'vat', 'vatican', 'vaudeville', 'vault',
  'vaulted', 'vaulter', 'vaulting', 'vaunt', 'vaunted', 'veal', 'vector', 'vectorial', 'veda', 'vedanta',
  'vedic', 'veep', 'veer', 'veg', 'vegan', 'vegeburger', 'vegetable', 'vegetal', 'vegetate', 'veggie',
  'vehemence', 'vehement', 'vehicle', 'vehicular', 'veil', 'veiled', 'veiling', 'vein', 'veined', 'veining',
  'veiny', 'velar', 'velcro', 'veld', 'veldt', 'vellum', 'veloce', 'velocity', 'velour', 'velours',
  'velvet', 'velveteen', 'velvety', 'venal', 'venality', 'venally', 'venation', 'vend', 'vendee', 'vender',
  'vendetta', 'vendible', 'vending', 'vendor', 'veneer', 'venerable', 'venerably', 'venerate', 'venereal', 'venery',
  'venetian', 'vengeance', 'vengeful', 'venial', 'venially', 'venison', 'venom', 'venomous', 'venous', 'vent',
  'ventage', 'venter', 'ventilate', 'ventral', 'ventricle', 'venture', 'venturer', 'venturous', 'venue', 'venus',
  'veracious', 'veracity', 'veranda', 'verandah', 'verb', 'verbal', 'verbalize', 'verbally', 'verbatim', 'verbena',
  'verbiage', 'verbose', 'verbosely', 'verbosity', 'verdant', 'verdict', 'verdigris', 'verdure', 'verge', 'verger',
  'verifiable', 'verify', 'verily', 'verism', 'veritable', 'veritably', 'verity', 'verjuice', 'vermeil', 'vermicelli',
  'vermiform', 'vermilion', 'vermin', 'verminous', 'vermouth', 'vernacular', 'vernal', 'vernier', 'veronica', 'versatile',
  'verse', 'versed', 'versicle', 'versify', 'version', 'verso', 'verst', 'versus', 'vert', 'vertebra',
  'vertebrae', 'vertebral', 'vertex', 'vertical', 'vertices', 'vertigo', 'vervain', 'verve', 'very', 'vesicle',
  'vesicular', 'vesper', 'vespers', 'vessel', 'vest', 'vestal', 'vested', 'vestibule', 'vestige', 'vestigial',
  'vestment', 'vestry', 'vestryman', 'vesture', 'vet', 'vetch', 'veteran', 'veto', 'vetter', 'vex',
  'vexation', 'vexatious', 'vexed', 'vexing', 'via', 'viable', 'viably', 'viaduct', 'vial', 'viand',
  'vibe', 'vibes', 'vibrancy', 'vibrant', 'vibrantly', 'vibrate', 'vibrato', 'vibrator', 'vibratory', 'viburnum',
  'vicar', 'vicarage', 'vicariate', 'vicarious', 'vice', 'viceroy', 'vicinage', 'vicinity', 'vicious', 'viciously',
  'vicissitude', 'victim', 'victimize', 'victor', 'victoria', 'victorian', 'victory', 'victual', 'vicuna', 'video',
  'videotape', 'vie', 'vied', 'viewer', 'viewpoint', 'vigil', 'vigilance', 'vigilant', 'vignette', 'vigor',
  'vigorous', 'viking', 'vile', 'vilely', 'vileness', 'vilify', 'villa', 'village', 'villager', 'villain',
  'villainous', 'villainy', 'villein', 'villi', 'villus', 'vim', 'vinaigrette', 'vincible', 'vindicate', 'vindictive',
  'vine', 'vinegar', 'vinegary', 'vinery', 'vineyard', 'vinous', 'vintage', 'vintager', 'vintner', 'vinyl',
  'viol', 'viola', 'violable', 'violate', 'violation', 'violator', 'violence', 'violent', 'violently', 'violet',
  'violin', 'violinist', 'violist', 'vip', 'viper', 'viperish', 'viperous', 'virago', 'viral', 'vireo',
  'virgin', 'virginal', 'virginia', 'virginity', 'virgo', 'virgule', 'virile', 'virility', 'virology', 'virtual',
  'virtually', 'virtue', 'virtuosi', 'virtuoso', 'virtuous', 'virulence', 'virulent', 'virus', 'visa', 'visage',
  'viscera', 'visceral', 'viscid', 'viscose', 'viscosity', 'viscount', 'viscous', 'vise', 'vishnu', 'visible',
  'visibly', 'vision', 'visionary', 'visit', 'visitant', 'visiting', 'visitor', 'visor', 'vista', 'visual',
  'visualize', 'visually', 'vital', 'vitalism', 'vitality', 'vitalize', 'vitally', 'vitals', 'vitamin', 'vitiate',
  'vitreous', 'vitrify', 'vitriol', 'vitriolic', 'vituperate', 'viva', 'vivace', 'vivacious', 'vivacity', 'vivarium',
  'vivid', 'vividly', 'vividness', 'vivify', 'viviparous', 'vivisect', 'vixen', 'vixenish', 'viz', 'vizier',
  'vizor', 'vocab', 'vocal', 'vocalic', 'vocalist', 'vocalize', 'vocally', 'vocation', 'vocative', 'vociferate',
  'vodka', 'vogue', 'voice', 'voiced', 'voiceless', 'void', 'voidable', 'voila', 'voile', 'volatile',
  'volcanic', 'volcano', 'vole', 'volition', 'volley', 'volt', 'voltage', 'voltaic', 'voltmeter', 'voluble',
  'volubly', 'volume', 'voluntary', 'volunteer', 'voluptuary', 'voluptuous', 'volute', 'vomit', 'voodoo', 'voodooism',
  'voracious', 'voracity', 'vortex', 'vortices', 'votary', 'vote', 'voter', 'voting', 'votive', 'vouch',
  'voucher', 'vouchsafe', 'vow', 'vowel', 'vower', 'vox', 'voyage', 'voyager', 'voyeur', 'voyeurism',
  'vulcan', 'vulcanism', 'vulcanite', 'vulcanize', 'vulgar', 'vulgarism', 'vulgarity', 'vulgarize', 'vulgarly', 'vulgate',
  'vulpine', 'vulture', 'vulturine', 'vulva', 'vying', 'wacky', 'wad', 'wadding', 'waddle', 'waddler',
  'wade', 'wader', 'wadi', 'wafer', 'waffle', 'waffler', 'waft', 'wag', 'wage', 'wager',
  'wagerer', 'waggery', 'waggish', 'waggle', 'wagon', 'wagoner', 'wagonette', 'wagtail', 'wah', 'waif',
  'wail', 'wailer', 'wain', 'wainscot', 'waist', 'waistband', 'waistcoat', 'waistline', 'wait', 'waiter',
  'waiting', 'waitress', 'waive', 'waiver', 'wake', 'wakeful', 'waken', 'waker', 'waking', 'wale',
  'walk', 'walkabout', 'walkaway', 'walker', 'walking', 'walkout', 'walkover', 'walkup', 'walkway', 'wall',
  'wallaby', 'wallboard', 'walled', 'wallet', 'walleye', 'wallflower', 'wallop', 'walloper', 'wallow', 'wallpaper',
  'walnut', 'walrus', 'waltz', 'waltzer', 'wampum', 'wan', 'wand', 'wander', 'wanderer', 'wandering',
  'wane', 'wangle', 'wangler', 'wanly', 'wanna', 'wannabe', 'wanness', 'want', 'wanting', 'wanton',
  'wantonly', 'wapiti', 'war', 'warble', 'warbler', 'ward', 'warden', 'warder', 'wardress', 'wardrobe',
  'wardroom', 'ware', 'warehouse', 'warfare', 'warhead', 'warhorse', 'warily', 'wariness', 'warlike', 'warlock',
  'warlord', 'warm', 'warmed', 'warmer', 'warming', 'warmish', 'warmly', 'warmonger', 'warmth', 'warmup',
  'warn', 'warner', 'warning', 'warp', 'warpath', 'warper', 'warplane', 'warrant', 'warrantor', 'warranty',
  'warren', 'warrior', 'warship', 'wart', 'warthog', 'wartime', 'warty', 'wary', 'was', 'wash',
  'washable', 'washbasin', 'washboard', 'washbowl', 'washcloth', 'washday', 'washed', 'washer', 'washhouse', 'washing',
  'washout', 'washrag', 'washroom', 'washstand', 'washtub', 'washy', 'wasp', 'waspish', 'wassail', 'wastage',
  'waste', 'wasted', 'wasteful', 'wasteland', 'waster', 'wastrel', 'watch', 'watchband', 'watchdog', 'watcher',
  'watchful', 'watchman', 'watchword', 'water', 'waterbed', 'waterborne', 'waterbuck', 'watercress', 'watered', 'waterfall',
  'waterfowl', 'waterfront', 'waterhole', 'watering', 'waterless', 'waterline', 'waterlog', 'waterman', 'watermark', 'watermelon',
  'watermill', 'waterproof', 'watershed', 'waterside', 'waterspout', 'watertight', 'waterway', 'waterwheel', 'waterworks', 'watery',
  'watt', 'wattage', 'wattle', 'wattled', 'wattmeter', 'waul', 'wave', 'waveband', 'waved', 'waveform',
  'wavelength', 'wavelet', 'waver', 'waverer', 'wavering', 'wavily', 'wavy', 'wax', 'waxed', 'waxen',
  'waxer', 'waxing', 'waxwing', 'waxwork', 'waxy', 'way', 'waybill', 'wayfarer', 'wayfaring', 'waylay',
  'waylayer', 'wayside', 'wayward', 'waywardly', 'we', 'weak', 'weaken', 'weakener', 'weakfish', 'weakling',
  'weakly', 'weakness', 'weal', 'wealth', 'wealthy', 'wean', 'weanling', 'weapon', 'weaponry', 'wear',
  'wearable', 'wearer', 'wearied', 'wearily', 'weariness', 'wearing', 'wearisome', 'weary', 'weasel', 'weather',
  'weathered', 'weave', 'weaver', 'weaving', 'web', 'webbed', 'webbing', 'webcam', 'weber', 'webfoot',
  'weblog', 'webmaster', 'webpage', 'website', 'wed', 'wedded', 'wedding', 'wedge', 'wedged', 'wedgie',
  'wedlock', 'wednesday', 'wee', 'weed', 'weeder', 'weedy', 'week', 'weekday', 'weekend', 'weekender',
  'weekly', 'weeknight', 'ween', 'weenie', 'weeny', 'weep', 'weeper', 'weeping', 'weepy', 'weevil',
  'weft', 'weigh', 'weigher', 'weight', 'weighted', 'weightily', 'weighty', 'weir', 'weird', 'weirdly',
  'weirdness', 'weirdo', 'welcome', 'welcomer', 'weld', 'welder', 'welding', 'welfare', 'welkin', 'well',
  'wellbeing', 'wellborn', 'wellbred', 'welldone', 'wellhead', 'wellknown', 'wellness', 'wellspring', 'welsh', 'welsher',
  'welt', 'welter', 'wen', 'wench', 'wend', 'went', 'wept', 'were', 'werewolf', 'wert',
  'west', 'westbound', 'westerly', 'western', 'westerner', 'westward', 'westwards', 'wet', 'wetback', 'wether',
  'wetland', 'wetly', 'wetness', 'wetsuit', 'whack', 'whacker', 'whacking', 'whacky', 'whale', 'whaleboat',
  'whalebone', 'whaler', 'whaling', 'wham', 'whammy', 'whap', 'wharf', 'wharfage', 'wharfinger', 'wharves',
  'what', 'whatever', 'whatnot', 'whatsoever', 'wheal', 'wheat', 'wheatear', 'wheaten', 'wheatgerm', 'wheedle',
  'wheedler', 'wheel', 'wheelbase', 'wheeled', 'wheeler', 'wheelie', 'wheeling', 'wheelman', 'wheeze', 'wheezy',
  'whelk', 'whelm', 'whelp', 'when', 'whence', 'whenever', 'where', 'whereabouts', 'whereas', 'whereat',
  'whereby', 'wherefore', 'wherein', 'whereof', 'whereon', 'wheresoever', 'whereto', 'whereupon', 'wherever', 'wherewith',
  'wherry', 'whet', 'whether', 'whetstone', 'whew', 'whey', 'which', 'whichever', 'whiff', 'whiffet',
  'whiffle', 'whig', 'while', 'whilom', 'whilst', 'whim', 'whimper', 'whimsical', 'whimsy', 'whin',
  'whine', 'whiner', 'whinny', 'whiny', 'whip', 'whipcord', 'whiplash', 'whipper', 'whippet', 'whipping',
  'whippoorwill', 'whipsaw', 'whipstitch', 'whipstock', 'whir', 'whirl', 'whirler', 'whirligig', 'whirlpool', 'whirlwind',
  'whirlybird', 'whirr', 'whisk', 'whisker', 'whiskered', 'whiskey', 'whisky', 'whisper', 'whisperer', 'whist',
  'whistle', 'whistler', 'whit', 'white', 'whitebait', 'whitecap', 'whitefish', 'whitely', 'whiten', 'whitener',
  'whiteness', 'whiteout', 'whitetail', 'whitewall', 'whitewash', 'whither', 'whiting', 'whitish', 'whitlow', 'whittle',
  'whittler', 'whiz', 'whizbang', 'whizz', 'who', 'whoa', 'whodunit', 'whoever', 'whole', 'wholefood',
  'wholehearted', 'wholesale', 'wholesaler', 'wholesome', 'wholly', 'whom', 'whomever', 'whomsoever', 'whoop', 'whoopee',
  'whooper', 'whooping', 'whoops', 'whoosh', 'whop', 'whopper', 'whopping', 'whore', 'whorl', 'whorled',
  'whose', 'whosoever', 'why', 'wick', 'wicked', 'wickedly', 'wicker', 'wicket', 'wide', 'widely',
  'widen', 'wideness', 'widescreen', 'widespread', 'widgeon', 'widget', 'widow', 'widowed', 'widower', 'widowhood',
  'width', 'wield', 'wielder', 'wieldy', 'wiener', 'wienie', 'wife', 'wifehood', 'wifeless', 'wifelike',
  'wifely', 'wig', 'wigeon', 'wigged', 'wiggle', 'wiggler', 'wiggly', 'wight', 'wiglet', 'wigmaker',
  'wigwag', 'wigwam', 'wiki', 'wild', 'wildcat', 'wilder', 'wilderness', 'wildfire', 'wildfowl', 'wildlife',
  'wildly', 'wildness', 'wildwood', 'wile', 'wilful', 'wilfully', 'wilily', 'wiliness', 'will', 'willed',
  'willful', 'willfully', 'willies', 'willing', 'willingly', 'willow', 'willowy', 'willpower', 'willy', 'wilt',
  'wily', 'wimp', 'wimple', 'wimpy', 'win', 'wince', 'winch', 'wincher', 'wind', 'windbag',
  'windblown', 'windbreak', 'windburn', 'windchill', 'winded', 'winder', 'windfall', 'windfarm', 'windflower', 'windily',
  'winding', 'windlass', 'windless', 'windmill', 'window', 'windpipe', 'windproof', 'windrow', 'windscreen', 'windshield',
  'windsock', 'windstorm', 'windsurf', 'windswept', 'windup', 'windward', 'windy', 'wine', 'wineglass', 'winepress',
  'winery', 'wineskin', 'wing', 'wingback', 'wingbeat', 'wingchair', 'winged', 'winger', 'wingless', 'winglet',
  'wingman', 'wingnut', 'wingspan', 'wingspread', 'wingtip', 'wink', 'winker', 'winkle', 'winner', 'winning',
  'winnow', 'winnower', 'wino', 'winsome', 'winsomely', 'winter', 'winterize', 'wintertime', 'wintery', 'wintry',
  'winy', 'wipe', 'wipeout', 'wiper', 'wire', 'wired', 'wirehair', 'wireless', 'wireman', 'wirer',
  'wiretap', 'wireway', 'wirework', 'wirily', 'wiriness', 'wiring', 'wiry', 'wis', 'wisdom', 'wise',
  'wiseacre', 'wisecrack', 'wiseguy', 'wisely', 'wisenheimer', 'wish', 'wishbone', 'wisher', 'wishful', 'wisp',
  'wispy', 'wistaria', 'wisteria', 'wistful', 'wistfully', 'wit', 'witch', 'witchcraft', 'witchery', 'witching',
  'with', 'withal', 'withdraw', 'withdrawal', 'withdrawn', 'withdrew', 'withe', 'wither', 'withering', 'withers',
  'withheld', 'withhold', 'within', 'without', 'withstand', 'withstood', 'witless', 'witness', 'witted', 'witticism',
  'wittily', 'wittiness', 'witting', 'wittingly', 'witty', 'wive', 'wives', 'wizard', 'wizardry', 'wizen',
  'wizened', 'woad', 'wobble', 'wobbler', 'wobbly', 'woe', 'woebegone', 'woeful', 'woefully', 'wog',
  'wok', 'woke', 'woken', 'wold', 'wolf', 'wolfer', 'wolfhound', 'wolfish', 'wolfram', 'wolfsbane',
  'wolverine', 'wolves', 'woman', 'womanhood', 'womanish', 'womanize', 'womankind', 'womanly', 'womb', 'wombat',
  'women', 'womenfolk', 'won', 'wonder', 'wonderful', 'wonderland', 'wondrous', 'wonk', 'wonky', 'wont',
  'wonted', 'woo', 'wood', 'woodbine', 'woodblock', 'woodcarver', 'woodchuck', 'woodcock', 'woodcraft', 'woodcut',
  'wooded', 'wooden', 'woodenly', 'woodland', 'woodlark', 'woodlice', 'woodlot', 'woodlouse', 'woodman', 'woodpecker',
  'woodpile', 'woodruff', 'woodshed', 'woodsman', 'woodsy', 'woodwind', 'woodwork', 'woodworm', 'woody', 'wooer',
  'woof', 'woofer', 'wool', 'woolen', 'woolgather', 'woollen', 'woollies', 'woolly', 'woolsack', 'woolsey',
  'wooly', 'woozily', 'wooziness', 'woozy', 'wop', 'word', 'wordage', 'wordbook', 'worded', 'wordily',
  'wordiness', 'wording', 'wordless', 'wordplay', 'wordsmith', 'wordy', 'wore', 'work', 'workable', 'workaday',
  'workbag', 'workbasket', 'workbench', 'workbook', 'workbox', 'workday', 'worked', 'worker', 'workfare', 'workforce',
  'workhorse', 'workhouse', 'working', 'workingman', 'workload', 'workman', 'workout', 'workplace', 'workroom', 'worksheet',
  'workshop', 'workspace', 'workstation', 'worktable', 'worktop', 'workweek', 'world', 'worldling', 'worldly', 'worldwide',
  'worm', 'wormhole', 'wormwood', 'wormy', 'worn', 'worried', 'worriedly', 'worrier', 'worrisome', 'worry',
  'worrywart', 'worse', 'worsen', 'worship', 'worshiper', 'worst', 'worsted', 'wort', 'worth', 'worthily',
  'worthless', 'worthy', 'would', 'wouldst', 'wound', 'wounded', 'wove', 'woven', 'wow', 'wrack',
  'wraith', 'wrangle', 'wrangler', 'wrap', 'wraparound', 'wrapper', 'wrapping', 'wrath', 'wrathful', 'wreak',
  'wreath', 'wreathe', 'wreck', 'wreckage', 'wrecker', 'wren', 'wrench', 'wrest', 'wrestle', 'wrestler',
  'wrestling', 'wretch', 'wretched', 'wrick', 'wriggle', 'wriggler', 'wriggly', 'wright', 'wring', 'wringer',
  'wrinkle', 'wrinkly', 'wrist', 'wristband', 'wristlet', 'wristwatch', 'writ', 'write', 'writer', 'writhe',
  'writing', 'written', 'wrong', 'wrongdoer', 'wrongdoing', 'wronged', 'wrongful', 'wrongly', 'wrote', 'wroth',
  'wrought', 'wrung', 'wry', 'wryly', 'wryneck', 'wryness', 'wurst', 'wuss', 'wussy', 'wyvern',
  'xanthic', 'xanthine', 'xebec', 'xenolith', 'xenon', 'xenophobe', 'xeric', 'xerox', 'xiphoid', 'xylem',
  'xylene', 'xylophone', 'yacht', 'yachting', 'yachtsman', 'yack', 'yahoo', 'yak', 'yam', 'yammer',
  'yank', 'yankee', 'yap', 'yard', 'yardage', 'yardarm', 'yardbird', 'yardman', 'yardmaster', 'yardstick',
  'yarmulke', 'yarn', 'yarrow', 'yashmak', 'yataghan', 'yaw', 'yawl', 'yawn', 'yawner', 'yawp',
  'yaws', 'yea', 'yeah', 'year', 'yearbook', 'yearling', 'yearlong', 'yearly', 'yearn', 'yearning',
  'yeast', 'yeasty', 'yegg', 'yell', 'yeller', 'yellow', 'yellowfin', 'yellowish', 'yelp', 'yen',
  'yeoman', 'yeomanry', 'yep', 'yerba', 'yes', 'yeshiva', 'yesman', 'yesterday', 'yesteryear', 'yet',
  'yeti', 'yew', 'yid', 'yiddish', 'yield', 'yielding', 'yike', 'yikes', 'yin', 'yip',
  'yippee', 'yob', 'yobbo', 'yodel', 'yodeler', 'yoga', 'yoghurt', 'yogi', 'yogin', 'yogurt',
  'yoicks', 'yoke', 'yokel', 'yolk', 'yolky', 'yom', 'yon', 'yonder', 'yoni', 'yoo',
  'yore', 'york', 'yorker', 'you', 'young', 'younger', 'youngest', 'youngish', 'youngster', 'your',
  'yours', 'yourself', 'yourselves', 'youth', 'youthful', 'yowl', 'yoyo', 'ytterbium', 'yttrium', 'yuan',
  'yucca', 'yuck', 'yucky', 'yuk', 'yukky', 'yule', 'yuletide', 'yum', 'yummy', 'yup',
  'yuppie', 'yurt', 'zabra', 'zany', 'zap', 'zapper', 'zappy', 'zarf', 'zeal', 'zealot',
  'zealotry', 'zealous', 'zealously', 'zebra', 'zebu', 'zed', 'zee', 'zeitgeist', 'zen', 'zenana',
  'zenith', 'zephyr', 'zeppelin', 'zero', 'zest', 'zestful', 'zestfully', 'zesty', 'zeta', 'zeugma',
  'zibet', 'zig', 'ziggurat', 'zigzag', 'zilch', 'zillion', 'zinc', 'zine', 'zing', 'zinger',
  'zingy', 'zinnia', 'zion', 'zionism', 'zionist', 'zip', 'zipper', 'zippered', 'zippy', 'zircon',
  'zirconium', 'zither', 'ziti', 'zizith', 'zloty', 'zoaria', 'zodiac', 'zodiacal', 'zoic', 'zombi',
  'zombie', 'zonal', 'zonally', 'zonary', 'zonate', 'zonation', 'zone', 'zoned', 'zoner', 'zoning',
  'zonk', 'zonked', 'zonule', 'zoo', 'zooid', 'zoolater', 'zoolatry', 'zoologic', 'zoologist', 'zoology',
  'zoom', 'zoon', 'zoonosis', 'zoophyte', 'zoospore', 'zoot', 'zori', 'zoril', 'zorilla', 'zoster',
  'zounds', 'zowie', 'zucchetto', 'zucchini', 'zulu', 'zwieback', 'zydeco', 'zygoma', 'zygomatic', 'zygomorphic',
  'zygote', 'zygotic', 'zymase', 'zymogen', 'zymology', 'zymosis', 'zymotic', 'zymurgy',
];

function classifySeverity(mistakes: number): HotspotSeverity {
  if (mistakes >= 5) return 'critical';
  if (mistakes >= 2) return 'moderate';
  return 'minor';
}

export function formatHotspotKeyLabel(key: string): string {
  if (key === ' ') return 'SPACE';
  return key.length === 1 ? key : key.toUpperCase();
}

/**
 * Rule Engine Step 1: Enrich raw weakKeys mistake counts with QWERTY finger, hand, row,
 * shift requirement, home anchor, and deterministic severity tier.
 */
export function analyzeHotspots(weakKeys: Record<string, number> | undefined): TrickyKeyHotspot[] {
  if (!weakKeys) return [];

  return Object.entries(weakKeys)
    .filter(([key, count]) => Boolean(key) && Number.isFinite(count) && count > 0)
    .map(([key, count]) => {
      const guidance = getGuidanceForChar(key);
      const mistakes = Math.round(count);
      const homeAnchor = FINGER_HOME_ANCHOR[guidance.finger] || 'f';
      return {
        key,
        displayKey: formatHotspotKeyLabel(key),
        mistakes,
        severity: classifySeverity(mistakes),
        finger: guidance.finger,
        fingerName: guidance.fingerName,
        hand: guidance.hand,
        row: guidance.row,
        rowName: ROW_NAMES[guidance.row] || 'Keyboard',
        requiresShift: Boolean(guidance.requiresShift),
        homeAnchor,
      };
    })
    .sort((a, b) => b.mistakes - a.mistakes || a.key.localeCompare(b.key));
}

/**
 * Rule Engine Step 2: Synthesize a structured 3-stage exercise sequence for any set of target keys:
 *  - Stage 1: Key Isolation (anchor -> target -> anchor rhythmic muscle-memory pulses)
 *  - Stage 2: Home-Row & Adjacent-Finger Transitions (smooth bigram/trigram flow)
 *  - Stage 3: Real-Word & Contextual Application (high-density real English words / realistic tokens)
 */
export function buildThreeStageExercises(targetKeys: string[]): [string, string, string] {
  const uniqueTargets = Array.from(new Set(targetKeys.filter((k) => k && k.length === 1)));
  const targets = uniqueTargets.length > 0 ? uniqueTargets : ['e', 'r', 't'];

  // STAGE 1: Key Isolation (anchor + key isolation pulses)
  const stage1Chunks: string[] = [];
  const repsPerKey = targets.length === 1 ? 4 : targets.length === 2 ? 3 : 2;
  for (let r = 0; r < repsPerKey; r++) {
    for (const key of targets) {
      if (key === ' ') {
        stage1Chunks.push('f j', 'd k', 'fj dk', 'asdf jkl;');
        continue;
      }
      const g = getGuidanceForChar(key);
      const anchor = FINGER_HOME_ANCHOR[g.finger] === ' ' ? 'f' : FINGER_HOME_ANCHOR[g.finger];
      if (anchor === key.toLowerCase() && !g.requiresShift) {
        const opp = g.hand === 'left' ? 'j' : 'f';
        stage1Chunks.push(`${key}${key}${key}`, `${key}${opp}${key}`, `${opp}${key}${key}`);
      } else {
        stage1Chunks.push(`${anchor}${key}${anchor}`, `${key}${key}`, `${anchor}${key}${key}${anchor}`);
      }
    }
  }
  const stage1 = stage1Chunks.slice(0, 14).join(' ').trim();

  // STAGE 2: Home-Row & Neighbor Transitions
  const stage2Chunks: string[] = [];
  for (const key of targets) {
    if (key === ' ') {
      stage2Chunks.push('as df', 'jk l;', 'fd sa', 'kj ;l', 'af jd', 'sk fl');
      continue;
    }
    const g = getGuidanceForChar(key);
    const neighbors = FINGER_TRANSITION_NEIGHBORS[g.finger] || ['f', 'j', 'd', 'k'];
    const n0 = neighbors[0];
    const n1 = neighbors[1];
    const n2 = neighbors[2];
    const n3 = neighbors[3] || 'j';
    stage2Chunks.push(
      `${n0}${key}${n1}`,
      `${n1}${key}${n2}`,
      `${n3}${key}${n0}`,
      `${key}${n1}${key}${n3}`
    );
  }
  // Interleave pairs when multiple keys are targeted
  if (targets.length >= 2) {
    for (let i = 0; i < targets.length - 1; i++) {
      const a = targets[i];
      const b = targets[i + 1];
      if (a !== ' ' && b !== ' ') {
        stage2Chunks.push(`${a}${b}${a}`, `${b}${a}${b}`, `f${a}j${b}`, `d${b}k${a}`);
      }
    }
  }
  const stage2 = stage2Chunks.slice(0, 14).join(' ').trim();

  // STAGE 3: Real-Word & Contextual Application
  const letterTargets = targets.filter((k) => /^[a-zA-Z]$/.test(k));
  const upperTargets = new Set(targets.filter((k) => /^[A-Z]$/.test(k)));
  const lowerLetterSet = new Set(letterTargets.map((k) => k.toLowerCase()));
  const digitTargets = targets.filter((k) => /^[0-9]$/.test(k));
  const symbolTargets = targets.filter((k) => !/^[a-zA-Z0-9 ]$/.test(k));

  const stage3Words: string[] = [];

  if (lowerLetterSet.size > 0) {
    // Score every word in REAL_WORD_BANK by target-letter hit count & uniqueness
    const scored = REAL_WORD_BANK.map((word) => {
      let hits = 0;
      const distinct = new Set<string>();
      for (const ch of word) {
        if (lowerLetterSet.has(ch)) {
          hits++;
          distinct.add(ch);
        }
      }
      return { word, score: hits * 2 + distinct.size * 3 - (word.length > 8 ? 1 : 0) };
    })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.word.length - b.word.length);

    // Pick balanced diverse real words (prefer words starting with target uppercase letters if needed)
    const chosen: string[] = [];
    const used = new Set<string>();
    for (const upper of upperTargets) {
      const lower = upper.toLowerCase();
      const match = scored.find((s) => s.word.startsWith(lower) && !used.has(s.word));
      if (match) {
        used.add(match.word);
        chosen.push(match.word[0].toUpperCase() + match.word.slice(1));
      }
    }
    for (const entry of scored) {
      if (chosen.length >= 14) break;
      if (used.has(entry.word)) continue;
      used.add(entry.word);
      const firstUpper = entry.word[0].toUpperCase();
      if (upperTargets.has(firstUpper) && chosen.length % 2 === 0) {
        chosen.push(firstUpper + entry.word.slice(1));
      } else {
        chosen.push(entry.word);
      }
    }
    stage3Words.push(...chosen);
  }

  // Weave digit targets into realistic numeric phrases
  if (digitTargets.length > 0) {
    const numAnchors = ['code', 'step', 'item', 'line', 'level', 'page', 'unit', 'score'];
    const digitPhrases: string[] = [];
    for (let i = 0; i < 8; i++) {
      const d1 = digitTargets[i % digitTargets.length];
      const d2 = digitTargets[(i + 1) % digitTargets.length];
      const label = numAnchors[i % numAnchors.length];
      digitPhrases.push(`${label} ${d1}${d2}`);
    }
    if (stage3Words.length === 0) {
      stage3Words.push(...digitPhrases);
    } else {
      // Interleave digits into selected words
      digitPhrases.slice(0, 4).forEach((p, idx) => {
        stage3Words.splice(Math.min(stage3Words.length, idx * 3 + 2), 0, p);
      });
    }
  }

  // Weave symbol/punctuation targets into realistic natural words
  if (symbolTargets.length > 0) {
    const baseWords =
      stage3Words.length >= 6
        ? stage3Words.slice(0, 10)
        : ['ready', 'steady', 'clean', 'focus', 'craft', 'tempo', 'fluid', 'sharp', 'solid', 'prime'];
    const decorated = baseWords.map((w, idx) => {
      const sym = symbolTargets[idx % symbolTargets.length];
      if (sym === '(' || sym === ')') return `(${w})`;
      if (sym === '[' || sym === ']') return `[${w}]`;
      if (sym === '{' || sym === '}') return `{${w}}`;
      if (sym === '"' || sym === "'") return `${sym}${w}${sym}`;
      if (sym === '<' || sym === '>') return `<${w}>`;
      if (sym === '-' || sym === '_' || sym === '/' || sym === '\\' || sym === '+' || sym === '=') {
        const nextWord = baseWords[(idx + 1) % baseWords.length];
        return `${w}${sym}${nextWord}`;
      }
      return `${w}${sym}`;
    });
    stage3Words.splice(0, stage3Words.length, ...decorated.slice(0, 10));
  }

  if (stage3Words.length === 0) {
    stage3Words.push(
      'clean', 'steady', 'focus', 'builds', 'smooth', 'typing', 'rhythm', 'across', 'every', 'single', 'word', 'today'
    );
  }

  const stage3 = stage3Words.slice(0, 14).join(' ').replace(/\s+/g, ' ').trim();
  return [stage1, stage2, stage3];
}

function buildLessonObject(params: {
  id: string;
  ruleId: GeneratedRemediationLesson['ruleId'];
  ruleName: string;
  ruleReason: string;
  title: string;
  description: string;
  hotspots: TrickyKeyHotspot[];
}): GeneratedRemediationLesson {
  const targetKeys = params.hotspots.map((h) => h.key);
  const totalMistakes = params.hotspots.reduce((sum, h) => sum + h.mistakes, 0);
  const highestSeverity: HotspotSeverity = params.hotspots.some((h) => h.severity === 'critical')
    ? 'critical'
    : params.hotspots.some((h) => h.severity === 'moderate')
    ? 'moderate'
    : 'minor';
  const completionAccuracy = highestSeverity === 'critical' ? 94 : highestSeverity === 'moderate' ? 92 : 90;
  const exercises = buildThreeStageExercises(targetKeys);
  const targetFingers = Array.from(new Set(params.hotspots.map((h) => h.finger)));
  const targetHands = Array.from(new Set(params.hotspots.map((h) => h.hand))) as HandType[];

  return {
    id: params.id,
    level: 'beginner',
    module: 0,
    moduleTitle: params.ruleName,
    title: params.title,
    objective: params.ruleReason,
    targetKeys,
    targetFingers,
    targetHands,
    exercises,
    assessmentRepetitions: 20,
    completionAccuracy,
    guidanceConfig: {
      keyboardVisible: true,
      handsVisible: true,
      fingerGuideVisible: true,
      targetKeyVisible: true,
      guidanceLevel: 'full',
    },
    description: params.description,
    ruleId: params.ruleId,
    ruleName: params.ruleName,
    ruleReason: params.ruleReason,
    severity: highestSeverity,
    totalMistakes,
    stageLabels: ['Key Isolation', 'Home-Row Transitions', 'Real Words'],
    remediationTargetKeys: targetKeys,
  };
}

/**
 * Rule 4 (On-Demand): Generate a focused 3-stage precision lesson for a single Tricky Key hotspot.
 */
export function generateSingleKeyLesson(hotspot: TrickyKeyHotspot): GeneratedRemediationLesson {
  return buildLessonObject({
    id: `remediation-key-${encodeURIComponent(hotspot.key)}`,
    ruleId: 'single_key_precision',
    ruleName: 'Single-Key Precision Rule',
    ruleReason: `${hotspot.mistakes} ${hotspot.mistakes === 1 ? 'mistake' : 'mistakes'} on "${hotspot.displayKey}" (${hotspot.fingerName})`,
    title: `Key "${hotspot.displayKey}" Recovery Lesson`,
    description: `3-stage targeted drill isolating "${hotspot.displayKey}" from its ${hotspot.fingerName} anchor into real words.`,
    hotspots: [hotspot],
  });
}

/**
 * Master Deterministic Rule Pipeline:
 * Evaluates weakKeys hotspots and arranges up to 4 non-redundant 3-stage recovery lessons.
 */
export function generateRuleBasedLessons(
  weakKeys: Record<string, number> | undefined
): GeneratedRemediationLesson[] {
  const hotspots = analyzeHotspots(weakKeys);
  if (hotspots.length === 0) return [];

  const lessons: GeneratedRemediationLesson[] = [];
  const seenKeySignatures = new Set<string>();

  const addIfUnique = (lesson: GeneratedRemediationLesson) => {
    const sig = [...lesson.remediationTargetKeys].sort().join('|');
    if (seenKeySignatures.has(sig)) return;
    seenKeySignatures.add(sig);
    lessons.push(lesson);
  };

  // RULE 1: Priority Hotspot Cluster (top 1–4 highest-mistake keys)
  const topCluster = hotspots.slice(0, Math.min(4, hotspots.length));
  const topLabels = topCluster.map((h) => h.displayKey).join(', ');
  const topMistakeSum = topCluster.reduce((sum, h) => sum + h.mistakes, 0);
  addIfUnique(
    buildLessonObject({
      id: `remediation-priority-${topCluster.map((h) => h.key).join('')}`,
      ruleId: 'priority_cluster',
      ruleName: 'Priority Hotspot Rule',
      ruleReason: `${topMistakeSum} combined ${topMistakeSum === 1 ? 'mistake' : 'mistakes'} across top tricky ${topCluster.length === 1 ? 'key' : 'keys'}: ${topLabels}`,
      title:
        topCluster.length === 1
          ? `Priority Recovery: Key "${topLabels}"`
          : `Priority Hotspot Recovery (${topLabels})`,
      description:
        'Targets your highest-error keys through isolation, home-row transitions, and real-word fluency.',
      hotspots: topCluster,
    })
  );

  // RULE 2: Finger Overload Rule (group tricky keys sharing the same finger)
  const byFinger = new Map<FingerType, TrickyKeyHotspot[]>();
  for (const h of hotspots) {
    if (h.finger === 'none') continue;
    const list = byFinger.get(h.finger) || [];
    list.push(h);
    byFinger.set(h.finger, list);
  }

  const overloadedFingers = Array.from(byFinger.entries())
    .map(([finger, list]) => ({
      finger,
      fingerName: list[0].fingerName,
      list,
      total: list.reduce((s, x) => s + x.mistakes, 0),
    }))
    .filter((entry) => entry.list.length >= 2 || entry.total >= 3)
    .sort((a, b) => b.total - a.total);

  for (const group of overloadedFingers) {
    if (lessons.length >= 3) break;
    const keyNames = group.list.map((h) => h.displayKey).join(', ');
    addIfUnique(
      buildLessonObject({
        id: `remediation-finger-${group.finger}`,
        ruleId: 'finger_overload',
        ruleName: 'Finger Overload Rule',
        ruleReason: `${group.total} mistakes concentrated on ${group.fingerName} (${keyNames})`,
        title: `${group.fingerName} Precision Lesson`,
        description: `Strengthens ${group.fingerName.toLowerCase()} accuracy and anchor return across ${keyNames}.`,
        hotspots: group.list.slice(0, 4),
      })
    );
  }

  // RULE 3A: Shift & Symbol Reach Rule
  const shiftedHotspots = hotspots.filter((h) => h.requiresShift);
  const shiftedTotal = shiftedHotspots.reduce((s, h) => s + h.mistakes, 0);
  if (lessons.length < 4 && shiftedHotspots.length >= 1 && shiftedTotal >= 2) {
    const keyNames = shiftedHotspots.slice(0, 4).map((h) => h.displayKey).join(', ');
    addIfUnique(
      buildLessonObject({
        id: 'remediation-shift-reach',
        ruleId: 'row_shift_reach',
        ruleName: 'Shift Coordination Rule',
        ruleReason: `${shiftedTotal} mistakes on shifted keys requiring opposite-hand Shift (${keyNames})`,
        title: 'Shift & Symbol Coordination Lesson',
        description: 'Builds synchronized opposite-hand Shift timing from isolated taps into real phrases.',
        hotspots: shiftedHotspots.slice(0, 4),
      })
    );
  }

  // RULE 3B: Off-Home-Row Reach Rule (Top, Bottom, or Number Row)
  if (lessons.length < 4) {
    const byRow = new Map<number, TrickyKeyHotspot[]>();
    for (const h of hotspots) {
      if (h.row === 2 || h.row === 4) continue; // Home row & spacebar excluded
      const list = byRow.get(h.row) || [];
      list.push(h);
      byRow.set(h.row, list);
    }

    const topRowGroup = Array.from(byRow.entries())
      .map(([row, list]) => ({
        row,
        rowName: ROW_NAMES[row] || 'Reach Row',
        list,
        total: list.reduce((s, x) => s + x.mistakes, 0),
      }))
      .filter((g) => g.list.length >= 2 && g.total >= 3)
      .sort((a, b) => b.total - a.total)[0];

    if (topRowGroup) {
      const keyNames = topRowGroup.list.slice(0, 4).map((h) => h.displayKey).join(', ');
      addIfUnique(
        buildLessonObject({
          id: `remediation-row-${topRowGroup.row}`,
          ruleId: 'row_shift_reach',
          ruleName: 'Row Reach Rule',
          ruleReason: `${topRowGroup.total} mistakes reaching to the ${topRowGroup.rowName} (${keyNames})`,
          title: `${topRowGroup.rowName} Reach Lesson`,
          description: `Trains clean vertical extension from the home row to ${topRowGroup.rowName.toLowerCase()} keys.`,
          hotspots: topRowGroup.list.slice(0, 4),
        })
      );
    }
  }

  // Fallback: if only 1 lesson so far and there are multiple hotspots, add focused top-key precision drill
  if (lessons.length === 1 && hotspots.length >= 2) {
    addIfUnique(generateSingleKeyLesson(hotspots[0]));
  }

  return lessons.slice(0, 4);
}

/**
 * Rule Engine Step 3: Hotspot Healing Rule on Remediation Lesson Completion.
 *  - Mastery (>=96% accuracy and 0 misses on a targeted key): clears the key from weakKeys.
 *  - Passed (>= completionAccuracy): halves the mistake count (at least -2), clearing it if <= 0.
 *  - Failed: keeps hotspot active and accumulates any new misses.
 */
export function applyRemediationHealing(
  prevWeakKeys: Record<string, number>,
  targetKeys: string[],
  accuracy: number,
  passed: boolean,
  missedKeysInRun?: Record<string, number>
): {
  nextWeakKeys: Record<string, number>;
  healedKeys: { cleared: string[]; reduced: string[] };
} {
  const nextWeakKeys: Record<string, number> = { ...(prevWeakKeys || {}) };
  const targetSet = new Set(targetKeys);
  const cleared: string[] = [];
  const reduced: string[] = [];

  // Always record non-target misses from the run
  if (missedKeysInRun) {
    for (const [k, count] of Object.entries(missedKeysInRun)) {
      if (!k || k.trim() === '' || targetSet.has(k)) continue;
      nextWeakKeys[k] = (nextWeakKeys[k] || 0) + count;
    }
  }

  if (!passed) {
    // Not passed yet — record any target misses normally without healing
    if (missedKeysInRun) {
      for (const k of targetSet) {
        const missed = missedKeysInRun[k] || 0;
        if (missed > 0) {
          nextWeakKeys[k] = (nextWeakKeys[k] || 0) + missed;
        }
      }
    }
    return { nextWeakKeys, healedKeys: { cleared, reduced } };
  }

  for (const k of targetSet) {
    const prevCount = nextWeakKeys[k] || 0;
    const missedThisRun = missedKeysInRun?.[k] || 0;

    if (prevCount <= 0) {
      if (missedThisRun > 0) nextWeakKeys[k] = missedThisRun;
      continue;
    }

    if (accuracy >= 96 && missedThisRun === 0) {
      delete nextWeakKeys[k];
      cleared.push(k);
    } else {
      const reduction = Math.max(2, Math.ceil(prevCount * 0.5));
      const remaining = prevCount - reduction + missedThisRun;
      if (remaining <= 0) {
        delete nextWeakKeys[k];
        cleared.push(k);
      } else {
        nextWeakKeys[k] = remaining;
        reduced.push(k);
      }
    }
  }

  return { nextWeakKeys, healedKeys: { cleared, reduced } };
}
