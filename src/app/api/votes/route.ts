import { NextResponse } from "next/server";
import { fetchLiveVotes } from "@/app/actions/voting";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "all";
  const data = await fetchLiveVotes(period);
  return NextResponse.json(data);
}
