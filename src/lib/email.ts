"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { findOrCreateConversation } from "@/lib/chat/conversations";

export type QuoteEmailData = {
  businessName: string;
  businessEmail: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  price: number | null;
  priceType: "fixed" | "starting_from" | "range" | "quote_required";
  requestedDate: string | null;
  requestedTime: string | null;
  notes: string | null;
};

export type QuoteConversationData = {
  businessName: string;
  serviceName: string;
  price: number | null;
  priceType: "fixed" | "starting_from" | "range" | "quote_required";
  requestedDate: string | null;
  requestedTime: string | null;
  notes: string | null;
};

/**
 * Send quote via Resend API (best-effort).
 * If Resend API key is not configured, returns an indicator for fallback to in-app message.
 */
export async function sendQuoteEmail(data: QuoteEmailData): Promise<{ ok: boolean; error?: string; fallbackToInApp?: boolean }> {
  const supabase = await createClient();

  // Check RESEND_API_KEY from secrets table or environment
  // For now, check if the key exists in the supabase secrets table
  const { data: secrets } = await supabase
    .from("secrets")
    .select("value")
    .eq("key", "RESEND_API_KEY")
    .maybeSingle();

  if (!secrets?.value) {
    // No Resend key — indicate fallback to in-app message
    return { ok: false, fallbackToInApp: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secrets.value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "OnePlace <quotes@oneplace.local>",
        to: [data.businessEmail],
        subject: `New quote request from ${data.customerName}`,
        html: `
          <h3>Quote Request</h3>
          <p><strong>Business:</strong> ${data.businessName}</p>
          <p><strong>Customer:</strong> ${data.customerName} (${data.customerEmail})</p>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          ${data.price !== null
            ? `<p><strong>Price:</strong> ${data.priceType === "starting_from"
              ? `From $${data.price}`
              : data.priceType === "range"
                ? `$${data.price}+`
                : `$${data.price}`}`
            : "<p><strong>Price:</strong> Quote required</p>"}
          ${data.requestedDate ? `<p><strong>Preferred date:</strong> ${data.requestedDate}</p>` : ""}
          ${data.requestedTime ? `<p><strong>Preferred time:</strong> ${data.requestedTime}</p>` : ""}
          ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ""}
          <p><br/>Sent via OnePlace platform.</p>
        `,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, error: `Resend API error: ${errText}`, fallbackToInApp: true };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown email error.", fallbackToInApp: true };
  }
}

/**
 * Post a quote as a system message to the conversation thread.
 * This is the fallback when Resend API is not configured.
 */
export async function postQuoteToConversation(
  conversationId: string,
  data: QuoteConversationData
): Promise<{ ok: boolean; error?: string }> {
  const service = createServiceClient();

  const priceLabel = data.price !== null
    ? data.priceType === "starting_from"
      ? `From $${data.price}`
      : data.priceType === "range"
        ? `$${data.price}+`
        : `$${data.price}`
    : "Quote required";

  const notesHtml = data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : "";

  try {
    await service.from("messages").insert({
      conversation_id: conversationId,
      sender_type: "system",
      message_type: "system",
      content: `
        <p><strong>Quote request</strong></p>
        <p><strong>Business:</strong> ${data.businessName}</p>
        <p><strong>Service:</strong> ${data.serviceName}</p>
        <p><strong>Price:</strong> ${priceLabel}</p>
        ${data.requestedDate ? `<p><strong>Preferred date:</strong> ${data.requestedDate}</p>` : ""}
        ${data.requestedTime ? `<p><strong>Preferred time:</strong> ${data.requestedTime}</p>` : ""}
        ${notesHtml}
        <p><br/>Customer can be contacted at the conversation thread.</p>
      `,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to post quote." };
  }
}

/**
 * Main entry point: request a quote — handles both email and in-app.
 * Flow:
 * 1. Find/create conversation
 * 2. Post quote system message to conversation
 * 3. Try Resend email (best-effort, won't block)
 */
export async function requestQuote(
  businessId: string,
  customerEmail: string,
  serviceName: string,
  price: number | null,
  priceType: "fixed" | "starting_from" | "range" | "quote_required",
  requestedDate: string | null,
  requestedTime: string | null,
  notes: string | null
): Promise<{ ok: boolean; error?: string; conversationId?: string }> {
  try {
    // 1. Find or create conversation
    const { id: conversationId } = await findOrCreateConversation(businessId);
    if (!conversationId) {
      return { ok: false, error: "Could not create/fetch conversation." };
    }

    // 2. Post quote to conversation thread (in-app fallback)
    const posted = await postQuoteToConversation(conversationId, {
      businessName: "",
      serviceName,
      price,
      priceType,
      requestedDate,
      requestedTime,
      notes,
    });
    if (!posted.ok) {
      return { ok: false, error: posted.error, conversationId };
    }

    // 3. Try Resend email (best-effort — won't block the request)
    const emailData: QuoteEmailData = {
      businessName: "",
      businessEmail: "",
      customerName: "Customer",
      customerEmail,
      serviceName,
      price,
      priceType,
      requestedDate,
      requestedTime,
      notes,
    };
    await sendQuoteEmail(emailData); // non-blocking

    return { ok: true, error: undefined, conversationId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error." };
  }
}