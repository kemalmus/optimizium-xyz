// ============================================================================
// Pluggable Storage Interface for API Data Persistence
// ============================================================================

export interface StorageRecord {
  id: string;
  timestamp: string;
  type: 'feedback' | 'handoff' | 'negotiation' | 'contact_preference' | 'webhook';
  data: Record<string, unknown>;
}

export interface IStorage {
  save(record: StorageRecord): Promise<void>;
  query?(filter: Partial<StorageRecord>): Promise<StorageRecord[]>;
}

// ============================================================================
// Console Storage (Default - Logs to console for development)
// ============================================================================
export class ConsoleStorage implements IStorage {
  async save(record: StorageRecord): Promise<void> {
    const logEntry = {
      ...record,
      _logged_at: new Date().toISOString(),
    };

    // Pretty print for development
    console.log(`\n[${record.type.toUpperCase()}] ${record.id}`);
    console.log(JSON.stringify(logEntry, null, 2));
  }
}

// ============================================================================
// NDJSON File Storage (For Vercel-compatible logging)
// Note: In production serverless, use Vercel KV, Postgres, or external service
// ============================================================================
export class NDJSONStorage implements IStorage {
  private basePath: string;

  constructor(basePath: string = '/tmp') {
    this.basePath = basePath;
  }

  async save(record: StorageRecord): Promise<void> {
    // In serverless environments, use /tmp for ephemeral storage
    const fs = await import('fs/promises');
    const path = await import('path');

    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(this.basePath, `optimizium_${date}.ndjson`);

    const line = JSON.stringify(record) + '\n';

    try {
      await fs.appendFile(filePath, line);
    } catch (error) {
      // Fallback to console if file write fails
      console.warn('[NDJSONStorage] File write failed, using console fallback', error);
      new ConsoleStorage().save(record);
    }
  }
}

// ============================================================================
// Vercel KV Storage (Production-ready - requires @vercel/kv)
// ============================================================================
export class VercelKVStorage implements IStorage {
  private kv: { redis: { set: (key: string, value: string) => Promise<void> } } | null = null;

  constructor() {
    // Lazy load KV only if available
    if (process.env.KV_URL || process.env.KV_REST_API_URL) {
      // KV would be initialized here
      // For now, this is a placeholder for future implementation
    }
  }

  async save(record: StorageRecord): Promise<void> {
    if (!this.kv) {
      console.warn('[VercelKVStorage] KV not configured, using console fallback');
      new ConsoleStorage().save(record);
      return;
    }

    const key = `optimizium:${record.type}:${record.id}`;
    const value = JSON.stringify(record);

    await this.kv.redis.set(key, value);
  }
}

// ============================================================================
// Storage Factory
// ============================================================================
export type StorageType = 'console' | 'ndjson' | 'vercel-kv';

export function createStorage(type: StorageType = 'console'): IStorage {
  switch (type) {
    case 'ndjson':
      return new NDJSONStorage();
    case 'vercel-kv':
      return new VercelKVStorage();
    case 'console':
    default:
      return new ConsoleStorage();
  }
}

// Storage instance based on environment
const STORAGE_TYPE = (process.env.STORAGE_TYPE as StorageType) || 'console';
export const storage = createStorage(STORAGE_TYPE);
