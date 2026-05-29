const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
});

const clean = (value = "") => String(value).replace(/\s+/g, " ").trim().slice(0, 1200);

const buildMessage = (data) => [
  "New PetDecor request",
  "",
  `Name: ${clean(data.name) || "not provided"}`,
  `Contact: ${clean(data.contact) || "not provided"}`,
  `Request type: ${clean(data.requestType) || "not provided"}`,
  `Wishes: ${clean(data.wishes) || "not provided"}`,
  `Language: ${clean(data.language) || "not provided"}`,
  `Page: ${clean(data.page) || "not provided"}`,
].join("\n");

const sendToTelegram = async (env, message) => {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return { skipped: true };

  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: message,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    return { ok: false, error: await response.text() };
  }

  return { ok: true };
};

const sendToFormspree = async (env, data) => {
  if (!env.FORMSPREE_ENDPOINT) return { skipped: true };

  const response = await fetch(env.FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: clean(data.name),
      contact: clean(data.contact),
      requestType: clean(data.requestType),
      wishes: clean(data.wishes),
      page: clean(data.page),
      language: clean(data.language),
      _subject: "New PetDecor request",
    }),
  });

  if (!response.ok) {
    return { ok: false, error: await response.text() };
  }

  return { ok: true };
};

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestPost({ request, env }) {
  let data;

  try {
    data = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid request body" }, 400);
  }

  if (!clean(data.name) || !clean(data.contact)) {
    return jsonResponse({ ok: false, error: "Name and contact are required" }, 400);
  }

  const message = buildMessage(data);
  const [telegram, formspree] = await Promise.all([
    sendToTelegram(env, message),
    sendToFormspree(env, data),
  ]);

  const channels = { telegram, formspree };
  const delivered = [telegram, formspree].some((result) => result.ok);
  const configured = [telegram, formspree].some((result) => !result.skipped);

  if (!configured) {
    return jsonResponse({ ok: false, error: "No contact channel configured", channels }, 503);
  }

  if (!delivered) {
    return jsonResponse({ ok: false, error: "All contact channels failed", channels }, 502);
  }

  return jsonResponse({ ok: true, channels });
}
