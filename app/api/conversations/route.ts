import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { isChatMode } from "@/types/conversation";
import {
  createConversation,
  deleteConversation,
  listConversations,
} from "@/services/conversation.service";

type CreateConversationBody = {
  title?: string;
  mode?: string;
  model?: string;
};

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { user } = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const conversations = await listConversations({
      supabase,
      userId: user.id,
      includeArchived: false,
      limit: 50,
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "UNKNOWN_CONVERSATIONS_ERROR";
    return NextResponse.json(
      { error: "FAILED_TO_FETCH_CONVERSATIONS", message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { user } = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    let body: CreateConversationBody = {};
    try {
      body = (await request.json()) as CreateConversationBody;
    } catch {
      body = {};
    }

    const title = body.title?.trim();
    const mode = body.mode && isChatMode(body.mode) ? body.mode : "explanation";
    const model = body.model?.trim() || undefined;

    const conversation = await createConversation({
      supabase,
      userId: user.id,
      title,
      mode,
      model,
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "UNKNOWN_CONVERSATION_CREATE_ERROR";
    return NextResponse.json(
      { error: "FAILED_TO_CREATE_CONVERSATION", message },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { user } = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId")?.trim();

    if (!conversationId) {
      return NextResponse.json(
        { error: "MISSING_CONVERSATION_ID", message: "conversationId is required." },
        { status: 400 },
      );
    }

    const deleted = await deleteConversation({
      supabase,
      userId: user.id,
      conversationId,
    });

    if (!deleted) {
      return NextResponse.json(
        { error: "CONVERSATION_NOT_FOUND", message: "Conversation was not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "UNKNOWN_CONVERSATION_DELETE_ERROR";
    return NextResponse.json(
      { error: "FAILED_TO_DELETE_CONVERSATION", message },
      { status: 500 },
    );
  }
}
