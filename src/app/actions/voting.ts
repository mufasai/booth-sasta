"use server";

import { getSql, initDatabase } from "@/lib/db";

export interface LiveVoteResponse {
  edu: Record<string, number>;
  inter: Record<string, number>;
  isNeonConnected: boolean;
  totalVotes: number;
  filterPeriod: string;
  serverToday: string;
  serverYesterday: string;
  availableDates: string[];
}

// Fetch live aggregated votes from Neon with date / period filter (WIB Timezone)
export async function fetchLiveVotes(filterPeriod: string = "all"): Promise<LiveVoteResponse> {
  const sql = getSql();
  if (!sql) {
    return {
      edu: {},
      inter: {},
      isNeonConnected: false,
      totalVotes: 0,
      filterPeriod: "all",
      serverToday: "",
      serverYesterday: "",
      availableDates: [],
    };
  }

  try {
    await initDatabase();

    // Query current date & yesterday in Asia/Jakarta timezone (WIB)
    const dateInfo = await sql`
      SELECT 
        TO_CHAR(NOW() AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS today,
        TO_CHAR((NOW() AT TIME ZONE 'Asia/Jakarta') - INTERVAL '1 day', 'YYYY-MM-DD') AS yesterday;
    `;
    const serverToday = (dateInfo[0] as { today: string })?.today || "";
    const serverYesterday = (dateInfo[0] as { yesterday: string })?.yesterday || "";

    // Query list of distinct dates that have vote records
    const datesRes = await sql`
      SELECT DISTINCT TO_CHAR(created_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS vote_date
      FROM votes
      ORDER BY vote_date DESC;
    `;
    const availableDates = (datesRes as Array<{ vote_date: string }>).map((r) => r.vote_date);

    let rows: Array<{ category: string; booth_name: string; count: number }> = [];

    if (filterPeriod === "today") {
      rows = (await sql`
        SELECT category, booth_name, COUNT(*)::int AS count
        FROM votes
        WHERE (created_at AT TIME ZONE 'Asia/Jakarta')::date = (NOW() AT TIME ZONE 'Asia/Jakarta')::date
        GROUP BY category, booth_name;
      `) as Array<{ category: string; booth_name: string; count: number }>;
    } else if (filterPeriod === "yesterday") {
      rows = (await sql`
        SELECT category, booth_name, COUNT(*)::int AS count
        FROM votes
        WHERE (created_at AT TIME ZONE 'Asia/Jakarta')::date = ((NOW() AT TIME ZONE 'Asia/Jakarta')::date - INTERVAL '1 day')::date
        GROUP BY category, booth_name;
      `) as Array<{ category: string; booth_name: string; count: number }>;
    } else if (filterPeriod === "tomorrow") {
      rows = (await sql`
        SELECT category, booth_name, COUNT(*)::int AS count
        FROM votes
        WHERE (created_at AT TIME ZONE 'Asia/Jakarta')::date = ((NOW() AT TIME ZONE 'Asia/Jakarta')::date + INTERVAL '1 day')::date
        GROUP BY category, booth_name;
      `) as Array<{ category: string; booth_name: string; count: number }>;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(filterPeriod)) {
      rows = (await sql`
        SELECT category, booth_name, COUNT(*)::int AS count
        FROM votes
        WHERE (created_at AT TIME ZONE 'Asia/Jakarta')::date = ${filterPeriod}::date
        GROUP BY category, booth_name;
      `) as Array<{ category: string; booth_name: string; count: number }>;
    } else {
      // Default: "all" (Total akumulasi dari awal hingga sekarang)
      rows = (await sql`
        SELECT category, booth_name, COUNT(*)::int AS count
        FROM votes
        GROUP BY category, booth_name;
      `) as Array<{ category: string; booth_name: string; count: number }>;
    }

    const edu: Record<string, number> = {};
    const inter: Record<string, number> = {};
    let total = 0;

    for (const r of rows) {
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
      filterPeriod,
      serverToday,
      serverYesterday,
      availableDates,
    };
  } catch (error) {
    console.error("Failed to query recap votes from Neon:", error);
    return {
      edu: {},
      inter: {},
      isNeonConnected: false,
      totalVotes: 0,
      filterPeriod,
      serverToday: "",
      serverYesterday: "",
      availableDates: [],
    };
  }
}

// Submit a single vote to Neon (Insert-only, completely safe)
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

// Protected: Reset is blocked to protect active production data
export async function resetDatabaseVotes(): Promise<boolean> {
  // Safeguard: Live event data protection
  console.warn("resetDatabaseVotes called but blocked: Live event data protection is active.");
  return false;
}
