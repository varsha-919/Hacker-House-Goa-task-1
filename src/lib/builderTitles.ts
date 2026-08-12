// Deterministic builder-title generator.
//
// We keep a curated list of titles and match keywords from the user's
// stack/role. The match is deterministic: same input -> same title.
// A "↻ Try another title" interaction cycles through the matched list.
//
// For unrecognized (but non-empty) input, we deterministically rotate
// through a curated "identity" pool so the user never sees the bare
// "THE BUILDER" placeholder. "THE BUILDER" is reserved for literal empty
// input.

export type TitleEntry = {
  title: string;
  keywords: string[]; // lowercased substrings to look for in the input
};

// Curated "identity" pool used when no specific bucket matches and as
// fallback options for "Try another title". Each one feels like a real
// Hacker House Goa identity.
const IDENTITY_POOL: string[] = [
  'THE SHIPPER',
  'THE CODE WIZARD',
  'THE PIXEL ENGINEER',
  'THE TERMINAL WIZARD',
  'THE INTERFACE BUILDER',
  'THE SYSTEMS BUILDER',
  'THE MODEL WRANGLER',
  'THE PROMPT ALCHEMIST',
  'THE INFRA BUILDER',
  'THE API ARCHITECT',
  'THE DATABASE SHAPER',
  'THE COMPONENT WIZARD',
  'THE CHAIN BUILDER',
  'THE SECURITY FORTRESS',
  'THE MOBILE ARCHITECT',
  'THE PRODUCT HACKER',
  'THE CODE ALCHEMIST',
];

// Order matters: more specific categories first. The first bucket whose
// keywords hit wins.
const BUCKETS: TitleEntry[] = [
  // Frontend / UI
  { title: 'THE INTERFACE BUILDER', keywords: ['frontend', 'front-end', 'react', 'vue', 'svelte', 'ui', 'ux', 'design engineer', 'web designer'] },
  { title: 'THE PIXEL ENGINEER', keywords: ['css', 'tailwind', 'designer', 'design', 'figma'] },
  { title: 'THE COMPONENT WIZARD', keywords: ['react', 'next', 'nextjs', 'component'] },

  // AI / ML
  { title: 'THE AI BUILDER', keywords: ['ai', 'ml', 'llm', 'gpt', 'machine learning', 'deep learning', 'data scientist', 'ml engineer', 'ai engineer', 'rag'] },
  { title: 'THE PROMPT ALCHEMIST', keywords: ['prompt', 'llm', 'gpt', 'claude', 'agent'] },
  { title: 'THE MODEL WRANGLER', keywords: ['mlops', 'training', 'inference', 'model'] },

  // Backend / Infra
  { title: 'THE SYSTEMS BUILDER', keywords: ['backend', 'back-end', 'systems', 'distributed', 'systems engineer'] },
  { title: 'THE INFRA BUILDER', keywords: ['devops', 'infra', 'infrastructure', 'sre', 'platform', 'kubernetes', 'k8s', 'cloud', 'aws', 'gcp', 'azure'] },
  { title: 'THE API ARCHITECT', keywords: ['api', 'backend', 'graphql', 'rest', 'grpc'] },
  { title: 'THE DATABASE SHAPER', keywords: ['database', 'postgres', 'sql', 'mongo', 'redis', 'data engineer'] },
  { title: 'THE SECURITY FORTRESS', keywords: ['security', 'infosec', 'appsec', 'red team', 'blue team'] },

  // Mobile
  { title: 'THE MOBILE ARCHITECT', keywords: ['ios', 'android', 'swift', 'kotlin', 'mobile', 'flutter', 'react native'] },

  // Web3
  { title: 'THE CHAIN BUILDER', keywords: ['solidity', 'ethereum', 'solana', 'web3', 'crypto', 'blockchain', 'smart contract'] },

  // Full-stack / generalist
  { title: 'THE SHIPPER', keywords: ['full stack', 'fullstack', 'full-stack', 'founder', 'cto', 'ceo', 'indie hacker'] },
  { title: 'THE PRODUCT HACKER', keywords: ['product', 'pm', 'product manager', 'growth', 'founder'] },
  { title: 'THE CODE ALCHEMIST', keywords: ['engineer', 'developer', 'dev', 'software', 'programmer', 'coder'] },
  { title: 'THE FULL-STACK BUILDER', keywords: ['full', 'stack'] },
];

const EMPTY_TITLE = 'THE BUILDER';

// Deterministic small hash so unrecognized inputs rotate through the
// identity pool instead of always showing the same default.
function hashInput(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

export type TitleCandidate = {
  title: string;
  bucketIndex: number;
  indexInBucket: number;
};

export function findTitleBucket(input: string): { title: string; bucketIndex: number } {
  const q = (input || '').toLowerCase().trim();
  if (!q) return { title: EMPTY_TITLE, bucketIndex: -1 };
  for (let i = 0; i < BUCKETS.length; i++) {
    const b = BUCKETS[i];
    if (b.keywords.some((k) => q.includes(k))) {
      return { title: b.title, bucketIndex: i };
    }
  }
  // Deterministic rotation through the curated identity pool.
  const title = IDENTITY_POOL[hashInput(q) % IDENTITY_POOL.length];
  return { title, bucketIndex: -2 };
}

export function pickTitle(stackOrRole: string, variant: number = 0): TitleCandidate {
  const { title, bucketIndex } = findTitleBucket(stackOrRole);
  return { title, bucketIndex, indexInBucket: 0 };
}

export function allTitlesForInput(stackOrRole: string): string[] {
  const q = (stackOrRole || '').toLowerCase().trim();
  if (!q) return [EMPTY_TITLE];
  const { title: matched } = findTitleBucket(stackOrRole);
  // Cycle: matched identity first, then rotate the rest of the pool so
  // "Try another" feels meaningful.
  const startIdx = IDENTITY_POOL.indexOf(matched);
  const offset = startIdx >= 0 ? startIdx : 0;
  const out: string[] = [];
  for (let i = 0; i < IDENTITY_POOL.length; i++) {
    out.push(IDENTITY_POOL[(offset + i) % IDENTITY_POOL.length]);
  }
  return out.slice(0, 8);
}

export function pickTitleVariant(stackOrRole: string, variant: number): TitleCandidate {
  const list = allTitlesForInput(stackOrRole);
  const safeVariant = ((variant % list.length) + list.length) % list.length;
  return { title: list[safeVariant], bucketIndex: safeVariant, indexInBucket: safeVariant };
}
