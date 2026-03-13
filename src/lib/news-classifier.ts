export type ThreatLevel = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type ThreatCategory = 'conflict' | 'protest' | 'disaster' | 'diplomatic' | 'economic' | 'terrorism' | 'cyber' | 'health' | 'environmental' | 'military' | 'crime' | 'infrastructure' | 'tech' | 'general'

export interface Classification {
  level: ThreatLevel
  category: ThreatCategory
  confidence: number
}

const CRITICAL_KEYWORDS: Record<string, ThreatCategory> = {
  'nuclear strike': 'military',
  'nuclear attack': 'military',
  'nuclear war': 'military',
  'world war': 'military',
  'martial law': 'military',
  'coup attempt': 'military',
  'coup d\'etat': 'military',
  'state of emergency': 'disaster',
  'mass casualty': 'disaster',
  'pandemic declared': 'health',
  'market crash': 'economic',
  'bank run': 'economic',
  'currency collapse': 'economic',
  'debt default': 'economic',
  'sovereign default': 'economic',
}

const HIGH_KEYWORDS: Record<string, ThreatCategory> = {
  'invasion': 'conflict',
  'airstrike': 'conflict',
  'air strike': 'conflict',
  'missile strike': 'conflict',
  'bombing': 'conflict',
  'artillery': 'conflict',
  'ceasefire': 'conflict',
  'escalation': 'conflict',
  'sanctions': 'diplomatic',
  'embargo': 'diplomatic',
  'trade war': 'economic',
  'tariff': 'economic',
  'rate hike': 'economic',
  'rate cut': 'economic',
  'recession': 'economic',
  'inflation surge': 'economic',
  'default': 'economic',
  'bankruptcy': 'economic',
  'earthquake': 'disaster',
  'tsunami': 'disaster',
  'hurricane': 'disaster',
  'wildfire': 'disaster',
  'terror attack': 'terrorism',
  'terrorist': 'terrorism',
  'ransomware': 'cyber',
  'cyberattack': 'cyber',
  'data breach': 'cyber',
  'outbreak': 'health',
  'epidemic': 'health',
  'protest': 'protest',
  'uprising': 'protest',
  'riot': 'protest',
}

const MEDIUM_KEYWORDS: Record<string, ThreatCategory> = {
  'military': 'military',
  'troops': 'military',
  'weapons': 'military',
  'nato': 'military',
  'drone': 'military',
  'conflict': 'conflict',
  'tension': 'diplomatic',
  'summit': 'diplomatic',
  'treaty': 'diplomatic',
  'diplomatic': 'diplomatic',
  'negotiation': 'diplomatic',
  'fed': 'economic',
  'central bank': 'economic',
  'gdp': 'economic',
  'unemployment': 'economic',
  'cpi': 'economic',
  'inflation': 'economic',
  'interest rate': 'economic',
  'bond yield': 'economic',
  'stock market': 'economic',
  'bull market': 'economic',
  'bear market': 'economic',
  'rally': 'economic',
  'selloff': 'economic',
  'sell-off': 'economic',
  'ipo': 'economic',
  'merger': 'economic',
  'acquisition': 'economic',
  'earnings': 'economic',
  'flood': 'disaster',
  'drought': 'disaster',
  'storm': 'disaster',
  'volcano': 'disaster',
  'hack': 'cyber',
  'security breach': 'cyber',
  'climate': 'environmental',
  'emissions': 'environmental',
  'pollution': 'environmental',
  'pipeline': 'infrastructure',
  'grid': 'infrastructure',
  'supply chain': 'infrastructure',
  'shortage': 'infrastructure',
  'ai': 'tech',
  'artificial intelligence': 'tech',
  'blockchain': 'tech',
  'cryptocurrency': 'tech',
  'bitcoin': 'tech',
  'ethereum': 'tech',
}

export const THREAT_COLORS: Record<ThreatLevel, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  info: '#3b82f6',
}

export const CATEGORY_LABELS: Record<ThreatCategory, string> = {
  conflict: 'CONFLICT',
  protest: 'PROTEST',
  disaster: 'DISASTER',
  diplomatic: 'DIPLOMATIC',
  economic: 'ECONOMIC',
  terrorism: 'TERROR',
  cyber: 'CYBER',
  health: 'HEALTH',
  environmental: 'CLIMATE',
  military: 'MILITARY',
  crime: 'CRIME',
  infrastructure: 'INFRA',
  tech: 'TECH',
  general: 'GENERAL',
}

export function classifyHeadline(headline: string): Classification | null {
  if (!headline) return null
  const lower = headline.toLowerCase()

  for (const [keyword, category] of Object.entries(CRITICAL_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return { level: 'critical', category, confidence: 0.9 }
    }
  }

  for (const [keyword, category] of Object.entries(HIGH_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return { level: 'high', category, confidence: 0.8 }
    }
  }

  for (const [keyword, category] of Object.entries(MEDIUM_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return { level: 'medium', category, confidence: 0.6 }
    }
  }

  return null
}
