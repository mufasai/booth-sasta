import { neon, NeonQueryFunction } from "@neondatabase/serverless";

// Singleton helper client Neon Serverless Postgres
let sqlClient: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> | null {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes("YOUR_PASSWORD")) {
    return null;
  }
  if (!sqlClient) {
    sqlClient = neon(url);
  }
  return sqlClient;
}

// Auto-initialize votes table if connected
export async function initDatabase(): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        booth_name VARCHAR(120) NOT NULL,
        category VARCHAR(20) NOT NULL,
        voter_id VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_votes_cat_booth ON votes (category, booth_name);
    `;

    return true;
  } catch (error) {
    console.error("Error initializing Neon database table:", error);
    return false;
  }
}
