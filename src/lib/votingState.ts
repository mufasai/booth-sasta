import { BOOTHS, VotingCategory } from "@/data/booths";

export interface VoteTally {
  [boothId: string]: number;
}

export interface VotingStore {
  edu: VoteTally;
  inter: VoteTally;
}

export interface VoterHistory {
  eduBoothId: string | null;
  interBoothId: string | null;
  votedAt: string | null;
}

const STORAGE_KEY_TALLY = "jff2026_vote_tallies_v1";
const STORAGE_KEY_VOTER = "jff2026_voter_session_v1";

// Initial tallies initialized to 0 for all booths
export function getInitialTallies(): VotingStore {
  const edu: VoteTally = {};
  const inter: VoteTally = {};
  BOOTHS.forEach((b) => {
    edu[b.id] = 0;
    inter[b.id] = 0;
  });
  return { edu, inter };
}

// Load tallies from localStorage with fallback
export function loadVoteTallies(): VotingStore {
  if (typeof window === "undefined") return getInitialTallies();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TALLY);
    if (!raw) return getInitialTallies();
    const parsed = JSON.parse(raw);
    const initial = getInitialTallies();
    return {
      edu: { ...initial.edu, ...(parsed.edu || {}) },
      inter: { ...initial.inter, ...(parsed.inter || {}) },
    };
  } catch (e) {
    console.error("Failed to load vote tallies", e);
    return getInitialTallies();
  }
}

// Save tallies
export function saveVoteTallies(data: VotingStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_TALLY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save vote tallies", e);
  }
}

// Load voter history
export function loadVoterHistory(): VoterHistory {
  if (typeof window === "undefined") {
    return { eduBoothId: null, interBoothId: null, votedAt: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VOTER);
    if (!raw) return { eduBoothId: null, interBoothId: null, votedAt: null };
    return JSON.parse(raw);
  } catch (e) {
    return { eduBoothId: null, interBoothId: null, votedAt: null };
  }
}

// Save voter history
export function saveVoterHistory(data: VoterHistory): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_VOTER, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save voter history", e);
  }
}

// Record a vote locally
export function recordLocalVote(
  category: VotingCategory,
  boothId: string
): VotingStore {
  const current = loadVoteTallies();
  const next: VotingStore = {
    ...current,
    [category]: {
      ...current[category],
      [boothId]: (current[category][boothId] || 0) + 1,
    },
  };
  saveVoteTallies(next);

  // Update voter session
  const history = loadVoterHistory();
  if (category === "edu") {
    history.eduBoothId = boothId;
  } else {
    history.interBoothId = boothId;
  }
  history.votedAt = new Date().toISOString();
  saveVoterHistory(history);

  return next;
}

// Reset all votes
export function resetAllVotes(): VotingStore {
  const initial = getInitialTallies();
  saveVoteTallies(initial);
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_VOTER);
  }
  return initial;
}

// Generate CSV export
export function exportVotesToCSV(store: VotingStore): string {
  const headers = ["ID", "Nama Booth", "Kategori Booth", "Suara Teredukatif", "Suara Terinteraktif", "Total Suara"];
  const rows = BOOTHS.map((b) => {
    const eduCount = store.edu[b.id] || 0;
    const interCount = store.inter[b.id] || 0;
    const total = eduCount + interCount;
    return [
      `"${b.id}"`,
      `"${b.name}"`,
      `"${b.category}"`,
      eduCount,
      interCount,
      total,
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}
