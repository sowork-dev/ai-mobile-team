/**
 * Market Data Module — sowork_db Integration
 * Queries key tables with in-memory 10-minute cache
 */
import { query } from "./db.js";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export interface TrendingTopic {
  id?: number;
  topic?: string;
  title?: string;
  summary?: string;
  description?: string;
  platform?: string;
  created_at?: string;
  [key: string]: any;
}

export interface AdBenchmark {
  id?: number;
  market?: string;
  platform?: string;
  cpm?: number;
  cpc?: number;
  ctr?: number;
  [key: string]: any;
}

export interface BrandHealthScore {
  id?: number;
  brand_name?: string;
  score?: number;
  updated_at?: string;
  [key: string]: any;
}

export interface SocialBenchmark {
  id?: number;
  platform?: string;
  avg_engagement_rate?: number;
  avg_reach?: number;
  [key: string]: any;
}

export interface KOLRanking {
  id?: number;
  rank?: number;
  name?: string;
  platform?: string;
  followers?: number;
  engagement_rate?: number;
  [key: string]: any;
}

export async function getLatestTrends(): Promise<TrendingTopic[]> {
  const cached = getCached<TrendingTopic[]>("trends");
  if (cached) return cached;
  try {
    const rows = await query<TrendingTopic>(
      "SELECT id, platform, trend_name as title, description, engagement_rate, growth_rate, region, data_date as created_at FROM social_content_trends ORDER BY created_at DESC LIMIT 10"
    );
    setCache("trends", rows);
    return rows;
  } catch (err) {
    console.error("[marketData] getLatestTrends error:", err);
    return [];
  }
}

export async function getAdBenchmarks(market: "taiwan" | "china"): Promise<AdBenchmark[]> {
  const key = `benchmarks:${market}`;
  const cached = getCached<AdBenchmark[]>(key);
  if (cached) return cached;
  try {
    const rows = await query<AdBenchmark>(
      "SELECT * FROM ad_performance_benchmarks ORDER BY created_at DESC LIMIT 20"
    );
    setCache(key, rows);
    return rows;
  } catch (err) {
    console.error("[marketData] getAdBenchmarks error:", err);
    return [];
  }
}

export async function getBrandHealth(): Promise<BrandHealthScore[]> {
  const cached = getCached<BrandHealthScore[]>("brandHealth");
  if (cached) return cached;
  try {
    const rows = await query<BrandHealthScore>(
      "SELECT * FROM brand_health_scores ORDER BY updated_at DESC LIMIT 10"
    );
    setCache("brandHealth", rows);
    return rows;
  } catch (err) {
    console.error("[marketData] getBrandHealth error:", err);
    return [];
  }
}

export async function getSocialBenchmarks(): Promise<SocialBenchmark[]> {
  const cached = getCached<SocialBenchmark[]>("social");
  if (cached) return cached;
  try {
    const rows = await query<SocialBenchmark>(
      "SELECT * FROM social_platform_benchmarks LIMIT 20"
    );
    setCache("social", rows);
    return rows;
  } catch (err) {
    console.error("[marketData] getSocialBenchmarks error:", err);
    return [];
  }
}

export async function getKOLRankings(): Promise<KOLRanking[]> {
  const cached = getCached<KOLRanking[]>("kol");
  if (cached) return cached;
  try {
    const rows = await query<KOLRanking>(
      "SELECT influencer_name, platform, market, avg_engagement_rate, category, period_month FROM monthly_hot_structures ORDER BY created_at DESC LIMIT 20"
    );
    setCache("kol", rows);
    return rows;
  } catch (err) {
    console.error("[marketData] getKOLRankings error:", err);
    return [];
  }
}
