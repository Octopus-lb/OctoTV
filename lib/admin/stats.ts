import { count, desc } from "drizzle-orm";
import { tryGetDb } from "@/db";
import {
  adminAuditLogs,
  channels,
  playbackServers,
  syncJobs,
  titles,
  users,
} from "@/db/schema";
import { getProviderHealth } from "@/lib/playback/service";
import type { ProviderHealth } from "@/lib/playback/types";

export type AdminStats = {
  users: number;
  titles: number;
  channels: number;
  servers: number;
  databaseReady: boolean;
};

export async function getAdminStats(): Promise<AdminStats> {
  const db = tryGetDb();
  if (!db) {
    return { users: 0, titles: 0, channels: 0, servers: 0, databaseReady: false };
  }

  const safeCount = async (fn: () => Promise<Array<{ value: number }>>) => {
    try {
      const [row] = await fn();
      return row?.value ?? 0;
    } catch {
      return 0;
    }
  };

  const [userCount, titleCount, channelCount, serverCount] = await Promise.all([
    safeCount(() => db.select({ value: count() }).from(users)),
    safeCount(() => db.select({ value: count() }).from(titles)),
    safeCount(() => db.select({ value: count() }).from(channels)),
    safeCount(() => db.select({ value: count() }).from(playbackServers)),
  ]);

  return {
    users: userCount,
    titles: titleCount,
    channels: channelCount,
    servers: serverCount,
    databaseReady: true,
  };
}

export type AuditEntry = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: Date;
  metadata: unknown;
};

export async function getRecentAudit(limit = 20): Promise<AuditEntry[]> {
  const db = tryGetDb();
  if (!db) return [];
  try {
    const rows = await db
      .select()
      .from(adminAuditLogs)
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(limit);
    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      createdAt: row.createdAt,
      metadata: row.metadataJson,
    }));
  } catch {
    return [];
  }
}

export type SyncJobEntry = {
  id: string;
  jobType: string;
  status: string;
  itemsProcessed: number;
  errorCount: number;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
};

export async function getRecentSyncJobs(limit = 10): Promise<SyncJobEntry[]> {
  const db = tryGetDb();
  if (!db) return [];
  try {
    const rows = await db
      .select()
      .from(syncJobs)
      .orderBy(desc(syncJobs.createdAt))
      .limit(limit);
    return rows.map((row) => ({
      id: row.id,
      jobType: row.jobType,
      status: row.status,
      itemsProcessed: row.itemsProcessed,
      errorCount: row.errorCount,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      createdAt: row.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function getRegisteredServers() {
  const db = tryGetDb();
  if (!db) return [];
  try {
    return await db.select().from(playbackServers).orderBy(playbackServers.priority);
  } catch {
    return [];
  }
}

export async function getProviderStatuses(): Promise<ProviderHealth[]> {
  return getProviderHealth();
}
