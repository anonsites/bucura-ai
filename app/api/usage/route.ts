import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDailyRequestLimit } from "@/lib/usage";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getTodayUsage } from "@/services/usage.service";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { user } = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const usage = await getTodayUsage(supabase, user.id);
    const dailyLimit = getDailyRequestLimit();

    return NextResponse.json({
      usage: {
        usageDate: usage.usage_date,
        requestCount: usage.request_count,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        dailyLimit,
        remainingRequests: Math.max(dailyLimit - usage.request_count, 0),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_USAGE_ERROR";
    return NextResponse.json(
      { error: "FAILED_TO_FETCH_USAGE", message },
      { status: 500 },
    );
  }
}
