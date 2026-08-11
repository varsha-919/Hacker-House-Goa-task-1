// Deterministic builder-title generator.
//
// We keep a curated list of titles and match keywords from the user's
// stack/role. The match is deterministic: same input -> same title.
// A "↻ Try another title" interaction cycles through the matched list.

export type TitleEntry = {
  title: string;
  keywords: string[]; // lowercased substrings to look for in the input
};

// Order matters: more specific categories first. The first bucket whose
// keywords hit wins, then we cycle within that bucket.
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

const FALLBACK: TitleEntry = { title: 'THE BUILDER', keywords: [] };

export type TitleCandidate = {
  title: string;
  bucketIndex: number;
  indexInBucket: number;
};

export function findTitleBucket(input: string): { bucket: TitleEntry; index: number } {
  const q = (input || '').toLowerCase().trim();
  if (!q) return { bucket: FALLBACK, index: -1 };
  for (let i = 0; i < BUCKETS.length; i++) {
    const b = BUCKETS[i];
    if (b.keywords.some((k) => q.includes(k))) {
      return { bucket: b, index: i };
    }
  }
  return { bucket: FALLBACK, index: -1 };
}

export function pickTitle(stackOrRole: string, variant: number = 0): TitleCandidate {
  const { bucket, index } = findTitleBucket(stackOrRole);
  return { title: bucket.title, bucketIndex: index, indexInBucket: 0 };
}

export function allTitlesForInput(stackOrRole: string): string[] {
  const { bucket } = findTitleBucket(stackOrRole);
  // Cycle through same bucket first, then fallbacks so "Try another" feels
  // meaningful but bounded.
  const out = [bucket.title];
  for (const b of BUCKETS) {
    if (b.title !== bucket.title && !out.includes(b.title)) out.push(b.title);
    if (out.length >= 6) break;
  }
  return out;
}

export function pickTitleVariant(stackOrRole: string, variant: number): TitleCandidate {
  const list = allTitlesForInput(stackOrRole);
  const safeVariant = ((variant % list.length) + list.length) % list.length;
  return { title: list[safeVariant], bucketIndex: safeVariant, indexInBucket: safeVariant };
}
