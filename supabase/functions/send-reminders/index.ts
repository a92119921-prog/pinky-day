import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  buildPushPayload,
  type PushSubscription,
  type VapidKeys,
} from "npm:@block65/webcrypto-web-push@2.0.0";

const required = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing secret: ${name}`);
  return value;
};

const supabase = createClient(
  required("SUPABASE_URL"),
  required("SUPABASE_SERVICE_ROLE_KEY"),
);

const vapid: VapidKeys = {
  subject: required("VAPID_SUBJECT"),
  publicKey: required("VAPID_PUBLIC_KEY"),
  privateKey: required("VAPID_PRIVATE_KEY"),
};

function taipeiNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = taipeiNow();
  const { data: events, error: eventError } = await supabase
    .from("calendar_events")
    .select("id, user_id, date, title, time, reminder")
    .eq("date", now.date)
    .eq("reminder", true);

  if (eventError) {
    console.error("Could not load calendar events:", eventError.message);
    return Response.json({ error: "Could not load calendar events." }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const event of events ?? []) {
    const eventTime = String(event.time ?? "").slice(0, 5);
    if (!eventTime || eventTime > now.time) continue;

    const scheduledFor = `${event.date}T${eventTime}:00+08:00`;

    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("user_id", event.user_id);

    if (subscriptionError) {
      console.error("Could not load subscriptions:", subscriptionError.message);
      failed++;
      continue;
    }

    if (!subscriptions?.length) {
      skipped++;
      continue;
    }

    // The unique constraint prevents the same event/time from being sent twice.
    const { error: logError } = await supabase
      .from("push_notification_logs")
      .insert({
        event_id: String(event.id),
        user_id: event.user_id,
        scheduled_for: scheduledFor,
      });

    if (logError) {
      if (logError.code === "23505") {
        skipped++;
        continue;
      }
      console.error("Could not claim notification:", logError.message);
      failed++;
      continue;
    }

    let delivered = 0;

    for (const row of subscriptions) {
      try {
        const subscription = row.subscription as PushSubscription;
        const payload = await buildPushPayload(
          {
            data: JSON.stringify({
              title: "Pinky Day 🎀",
              body: `${event.title}，現在是你安排的時間囉！`,
              url: "/",
            }),
            options: { ttl: 60, urgency: "high" },
          },
          subscription,
          vapid,
        );

        const response = await fetch(subscription.endpoint, {
          ...payload,
          body: new Uint8Array(payload.body),
        });

        if (response.status === 404 || response.status === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", row.id);
        } else if (!response.ok) {
          console.error("Push provider returned:", response.status);
        } else {
          delivered++;
        }
      } catch (error) {
        console.error(
          "Push delivery failed:",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }

    if (delivered > 0) {
      sent += delivered;
    } else {
      // Allow a later cron run to retry if every delivery failed.
      await supabase
        .from("push_notification_logs")
        .delete()
        .eq("event_id", String(event.id))
        .eq("scheduled_for", scheduledFor);
      failed++;
    }
  }

  return Response.json({
    success: true,
    date: now.date,
    time: now.time,
    sent,
    skipped,
    failed,
  });
});
