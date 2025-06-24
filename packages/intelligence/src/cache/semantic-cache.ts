import { createClient, RedisClientType } from 'redis';
import { createHash } from 'crypto';
import { CacheEntry, CacheStats, LLMResponse } from '../types/index.js';

export class SemanticCache {
  private redis: RedisClientType;
  private stats: CacheStats = {
    totalRequests: 0,
    hits: 0,
    misses: 0,
    hitRate: 0,
    costSavings: 0,
    storageUsed: 0
  };
  private readonly keyPrefix = 'mcpgen:cache:';
  private readonly statsKey = 'mcpgen:cache:stats';

  constructor(
    redisUrl?: string,
    private defaultTTL: number = 3600 // 1 hour
  ) {
    this.redis = createClient({
      url: redisUrl || 'redis://localhost:6379'
    });

    this.redis.on('error', (err) => {
      console.error('Redis Cache Error:', err);
    });
  }

  async connect(): Promise<void> {
    if (!this.redis.isOpen) {
      await this.redis.connect();
      await this.loadStats();
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis.isOpen) {
      try {
        await this.saveStats();
        await this.redis.disconnect();
      } catch (error) {
        console.error('Error during Redis disconnect:', error);
        // Force close if graceful disconnect fails
        this.redis.quit();
      }
    }
  }

  /**
   * Generate a cache key from input parameters
   */
  private generateKey(
    prompt: string, 
    model: string, 
    temperature?: number,
    additionalParams?: Record<string, any>
  ): string {
    const keyData = {
      prompt: this.normalizePrompt(prompt),
      model,
      temperature,
      ...additionalParams
    };
    
    const hash = createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
    
    return `${this.keyPrefix}${hash}`;
  }

  /**
   * Normalize prompt for consistent caching
   */
  private normalizePrompt(prompt: string): string {
    return prompt
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .toLowerCase();
  }

  /**
   * Get cached response with similarity threshold
   */
  async get(
    prompt: string,
    model: string,
    temperature: number = 0.7,
    additionalParams?: Record<string, any>,
    similarityThreshold: number = 0.95
  ): Promise<LLMResponse | null> {
    await this.connect();
    this.stats.totalRequests++;

    const key = this.generateKey(prompt, model, temperature, additionalParams);
    
    try {
      // Try exact match first
      const exactMatch = await this.redis.get(key);
      if (exactMatch) {
        const entry: CacheEntry = JSON.parse(exactMatch);
        await this.updateEntryStats(key, entry);
        this.stats.hits++;
        this.stats.costSavings += entry.value.usage.cost;
        return entry.value;
      }

      // TODO: Implement semantic similarity search using embeddings
      // For now, we only support exact matches
      
      this.stats.misses++;
      return null;

    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Store response in cache
   */
  async set(
    prompt: string,
    model: string,
    response: LLMResponse,
    temperature: number = 0.7,
    additionalParams?: Record<string, any>,
    ttl?: number
  ): Promise<void> {
    await this.connect();

    const key = this.generateKey(prompt, model, temperature, additionalParams);
    
    try {
      const entry: CacheEntry = {
        key,
        value: response,
        metadata: {
          created: new Date(),
          accessed: new Date(),
          hits: 0,
          cost: response.usage.cost
        }
      };

      const ttlToUse = ttl || this.defaultTTL;
      await this.redis.setEx(key, ttlToUse, JSON.stringify(entry));
      
      this.stats.storageUsed += this.estimateEntrySize(entry);

    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    this.updateHitRate();
    return { ...this.stats };
  }

  /**
   * Clear cache with optional pattern
   */
  async clear(pattern?: string): Promise<void> {
    await this.connect();

    try {
      if (pattern) {
        const keys = await this.redis.keys(`${this.keyPrefix}${pattern}*`);
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      } else {
        const keys = await this.redis.keys(`${this.keyPrefix}*`);
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      }

      // Reset relevant stats
      this.stats.storageUsed = 0;
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache size information
   */
  async getSize(): Promise<{ keys: number; memory: string }> {
    await this.connect();

    try {
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memory = memoryMatch ? memoryMatch[1] : 'unknown';

      return {
        keys: keys.length,
        memory
      };
    } catch (error) {
      console.error('Cache size error:', error);
      return { keys: 0, memory: 'unknown' };
    }
  }

  /**
   * Prune expired or least recently used entries
   */
  async prune(maxEntries?: number): Promise<void> {
    await this.connect();

    try {
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      
      if (maxEntries && keys.length > maxEntries) {
        // Get all entries with metadata
        const entries: Array<{ key: string; entry: CacheEntry }> = [];
        
        for (const key of keys) {
          const data = await this.redis.get(key);
          if (data) {
            try {
              const entry: CacheEntry = JSON.parse(data);
              entries.push({ key, entry });
            } catch {
              // Remove corrupted entries
              await this.redis.del(key);
            }
          }
        }

        // Sort by last accessed (LRU)
        entries.sort((a, b) => 
          new Date(a.entry.metadata.accessed).getTime() - 
          new Date(b.entry.metadata.accessed).getTime()
        );

        // Remove oldest entries
        const toRemove = entries.slice(0, entries.length - maxEntries);
        const keysToRemove = toRemove.map(item => item.key);
        
        if (keysToRemove.length > 0) {
          await this.redis.del(keysToRemove);
        }
      }
    } catch (error) {
      console.error('Cache prune error:', error);
    }
  }

  private async updateEntryStats(key: string, entry: CacheEntry): Promise<void> {
    try {
      entry.metadata.accessed = new Date();
      entry.metadata.hits++;
      
      await this.redis.setEx(key, this.defaultTTL, JSON.stringify(entry));
    } catch (error) {
      console.error('Error updating entry stats:', error);
    }
  }

  private estimateEntrySize(entry: CacheEntry): number {
    return JSON.stringify(entry).length;
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? this.stats.hits / this.stats.totalRequests 
      : 0;
  }

  private async loadStats(): Promise<void> {
    try {
      const statsData = await this.redis.get(this.statsKey);
      if (statsData) {
        const savedStats = JSON.parse(statsData);
        this.stats = { ...this.stats, ...savedStats };
      }
    } catch (error) {
      console.error('Error loading cache stats:', error);
    }
  }

  private async saveStats(): Promise<void> {
    try {
      this.updateHitRate();
      await this.redis.set(this.statsKey, JSON.stringify(this.stats));
    } catch (error) {
      console.error('Error saving cache stats:', error);
    }
  }
}

/**
 * In-memory cache for when Redis is not available
 */
export class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    totalRequests: 0,
    hits: 0,
    misses: 0,
    hitRate: 0,
    costSavings: 0,
    storageUsed: 0
  };

  constructor(
    private maxSize: number = 1000,
    private defaultTTL: number = 3600000 // 1 hour in ms
  ) {
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  async get(
    prompt: string,
    model: string,
    temperature: number = 0.7,
    additionalParams?: Record<string, any>
  ): Promise<LLMResponse | null> {
    this.stats.totalRequests++;

    const key = this.generateKey(prompt, model, temperature, additionalParams);
    const entry = this.cache.get(key);

    if (entry && this.isEntryValid(entry)) {
      entry.metadata.accessed = new Date();
      entry.metadata.hits++;
      this.stats.hits++;
      this.stats.costSavings += entry.value.usage.cost;
      return entry.value;
    }

    if (entry && !this.isEntryValid(entry)) {
      this.cache.delete(key);
    }

    this.stats.misses++;
    return null;
  }

  async set(
    prompt: string,
    model: string,
    response: LLMResponse,
    temperature: number = 0.7,
    additionalParams?: Record<string, any>
  ): Promise<void> {
    const key = this.generateKey(prompt, model, temperature, additionalParams);
    
    const entry: CacheEntry = {
      key,
      value: response,
      metadata: {
        created: new Date(),
        accessed: new Date(),
        hits: 0,
        cost: response.usage.cost
      }
    };

    // Evict old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    this.stats.storageUsed += this.estimateEntrySize(entry);
  }

  async getStats(): Promise<CacheStats> {
    this.updateHitRate();
    return { ...this.stats };
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.storageUsed = 0;
  }

  private generateKey(
    prompt: string,
    model: string,
    temperature?: number,
    additionalParams?: Record<string, any>
  ): string {
    const keyData = {
      prompt: prompt.trim().replace(/\s+/g, ' ').toLowerCase(),
      model,
      temperature,
      ...additionalParams
    };
    
    return createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }

  private isEntryValid(entry: CacheEntry): boolean {
    const now = Date.now();
    const created = new Date(entry.metadata.created).getTime();
    return (now - created) < this.defaultTTL;
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      const accessTime = new Date(entry.metadata.accessed).getTime();
      if (accessTime < oldestTime) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.stats.storageUsed -= this.estimateEntrySize(entry);
      }
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isEntryValid(entry)) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      const entry = this.cache.get(key);
      if (entry) {
        this.stats.storageUsed -= this.estimateEntrySize(entry);
      }
      this.cache.delete(key);
    }
  }

  private estimateEntrySize(entry: CacheEntry): number {
    return JSON.stringify(entry).length;
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? this.stats.hits / this.stats.totalRequests 
      : 0;
  }
}