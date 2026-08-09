import { NextRequest, NextResponse } from "next/server";
import { processDueRecurringTransactions } from "@/lib/actions/recurring";
import { env } from "@/env";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const cronSecret = env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDueRecurringTransactions();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process recurring transactions" },
      { status: 500 }
    );
  }
}
