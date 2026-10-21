"use server";

import { getSql, initDatabase } from "@/lib/db";

export interface LiveVoteResponse {
  edu: Record<string, number>;
  inter: Record<string, number>;
  isNeonConnected: boolean;
  totalVotes: number;
}

// Fetch live aggregated votes from Neon
export async function fetchLiveVotes(): Promise<LiveVoteResponse> {
  const sql = getSql();
  if (!sql) {
    return {
      edu: {},
      inter: {},
      isNeonConnected: false,
      totalVotes: 0,
    };
  }

  try {
    await initDatabase();

    const rows = await sql`
      SELECT category, booth_name, COUNT(*)::int AS count
      FROM votes
      GROUP BY category, booth_name;
    `;

    const edu: Record<string, number> = {};
    const inter: Record<string, number> = {};
    let total = 0;

    for (const r of rows as Array<{ category: string; booth_name: string; count: number }>) {
      total += r.count;
      if (r.category === "edu") {
        edu[r.booth_name] = r.count;
      } else if (r.category === "inter") {
        inter[r.booth_name] = r.count;
      }
    }

    return {
      edu,
      inter,
      isNeonConnected: true,
      totalVotes: total,
    };
  } catch (error) {
    console.error("Failed to query votes from Neon:", error);
    return {
      edu: {},
      inter: {},
      isNeonConnected: false,
      totalVotes: 0,
    };
  }
}

// Submit a single vote to Neon
export async function submitVote(
  category: "edu" | "inter",
  boothName: string,
  voterId?: string
): Promise<{ success: boolean; isNeonConnected: boolean; error?: string }> {
  const sql = getSql();
  if (!sql) {
    return { success: false, isNeonConnected: false };
  }

  try {
    await initDatabase();

    await sql`
      INSERT INTO votes (category, booth_name, voter_id)
      VALUES (${category}, ${boothName}, ${voterId || null});
    `;

    return { success: true, isNeonConnected: true };
  } catch (error: unknown) {
    console.error("Failed to insert vote into Neon:", error);
    return {
      success: false,
      isNeonConnected: true,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Reset all votes in Neon (for testing / admin)
export async function resetDatabaseVotes(): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;

  try {
    await sql`TRUNCATE TABLE votes;`;
    return true;
  } catch (error) {
    console.error("Failed to reset votes in Neon:", error);
    return false;
  }
}
