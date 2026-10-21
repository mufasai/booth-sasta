import { NextResponse } from "next/server";
import { fetchLiveVotes } from "@/app/actions/voting";

export async function GET(request: Request) {
  // Accessing request URL ensures this route runs dynamically on each request
  const _url = request.url;
  const data = await fetchLiveVotes();
  return NextResponse.json(data);
}
