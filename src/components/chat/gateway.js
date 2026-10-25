// Robi's brain. Every reply comes from the model behind the gateway the
// owner configured (Chat settings → AI Gateway) — there is no offline
// keyword engine anymore. The gateway speaks one of two wire formats —
// Anthropic's /v1/messages or OpenAI's /v1/chat/completions — selected by
// the provider setting.
//
// Replies STREAM: text is pushed back to the caller through onText as it
// arrives, so the bubble fills up live. The model also gets TOOLS — real
// actions in the site (build the CV PDF, copy the contact email). It
// decides when to call them; this module runs the handler, streams any
// narration, and feeds tool results back until the model settles on the
// final text.

export const PROVIDERS = [
  { value: "anthropic", label: "Anthropic Compatible", defaultModel: "claude-sonnet-5-5" },
  { value: "openai", label: "OpenAI Compatible", defaultModel: "gpt-4o-mini" },
];

export const providerMeta = (value) =>
  PROVIDERS.find((provider) => provider.value === value) || PROVIDERS[0];

// The tools the model may call. A tool is only offered when its handler is
// present (the library counter needs a signed-in owner, the email needs a
// configured address) — handlers live in the chatbot component.
// `audience` names the narrowest role a tool makes sense for — "editor"
// (the owner, who can change content) or "member" (any signed-in account).
// Left off means "all": visitors included.
const TOOL_SCHEMAS = [
  {
    name: "download_cv",
    title: "CV Builder",
    summary:
      "Builds the full CV into a print-ready PDF and drops it in the visitor's downloads.",
    progress: "Building the CV PDF…",
    description:
      "Build the portfolio owner's full CV as a print-ready PDF and save it to the visitor's downloads. Call this when the visitor asks for the CV as a file or a download — not for merely reading the CV.",
  },
  {
    name: "copy_email",
    title: "Email Copier",
    summary:
      "Puts the contact email on the visitor's clipboard, ready to paste.",
    progress: "Copying the email…",
    description:
      "Copy the site owner's contact email to the visitor's clipboard. Call this when the visitor wants the email copied or ready to paste.",
  },
  {
    name: "write_cv",
    title: "CV Writer",
    audience: "editor",
    summary:
      "Turns rough career details into a complete, profession-tailored CV saved straight into the owner's library.",
    progress: "Writing the CV…",
    description:
      "Save a complete CV you composed from the details the member gave you. Work out their profession first, pick the sections that profession needs, then call this ONCE with the finished CV: 'title' is the CV's headline (e.g. 'Frontend Developer'), 'profession' names the field you detected, 'sections' is the ordered array — each { title, type: 'entry'|'list'|'text', items }. entry items carry { heading, sub, period, details }; list and text items carry { text }. Include only facts the member actually gave you.",
    args: {
      properties: {
        title: {
          type: "string",
          description: "The CV's headline title, e.g. 'Frontend Developer'.",
        },
        profession: {
          type: "string",
          description: "The profession you detected, e.g. 'software engineer'.",
        },
        sections: {
          type: "array",
          description: "The CV's sections, in document order (5-8 of them).",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Section title." },
              type: {
                type: "string",
                description: "One of 'entry', 'list' or 'text'.",
              },
              items: {
                type: "array",
                description:
                  "entry items: { heading, sub, period, details }; list/text items: { text }.",
                items: {
                  type: "object",
                  properties: {
                    heading: { type: "string" },
                    sub: { type: "string" },
                    period: { type: "string" },
                    details: { type: "string" },
                    text: { type: "string" },
                  },
                },
              },
            },
            required: ["title", "type", "items"],
          },
        },
      },
      required: ["title", "sections"],
    },
  },
  {
    name: "ask_cv",
    title: "CV Reader",
    summary:
      "Answers questions about the portfolio owner's CV from its live content.",
    progress: "Reading the CV…",
    description:
      "Fetch the portfolio owner's live CV content so you can answer a question about it — experience, education, skills, headline. Call this whenever an answer needs CV details; then answer only from the returned text, never inventing facts.",
    args: {
      properties: {
        question: {
          type: "string",
          description: "What the person wants to know, in one line.",
        },
      },
      required: ["question"],
    },
  },
  {
    name: "summarize_cv",
    title: "CV Summarizer",
    audience: "member",
    summary:
      "Composes shareable text — a LinkedIn about, intro email or one-liner — from the owner's CV.",
    progress: "Composing the summary…",
    description:
      "Compose ready-to-paste text FROM the portfolio owner's live CV. Call with the 'style' they want: 'linkedin' (first-person about section), 'email' (short intro mail) or 'oneliner'. Use only facts from the returned CV.",
    args: {
      properties: {
        style: {
          type: "string",
          description: "'linkedin', 'email' or 'oneliner'.",
        },
      },
    },
  },
  {
    name: "analyze_fit",
    title: "Job Fit Analyst",
    audience: "member",
    summary:
      "Compares a pasted job description against the owner's CV and reports the fit and the gaps.",
    progress: "Analyzing the fit…",
    description:
      "Analyze how well the portfolio owner's CV matches a job description. Call with the full 'jobDescription' text, then report: overall fit (high/medium/low), matching strengths and the specific gaps — every claim grounded in the CV text the tool returns, never invented.",
    args: {
      properties: {
        jobDescription: {
          type: "string",
          description: "The full job description text.",
        },
      },
      required: ["jobDescription"],
    },
  },
  {
    name: "jump_to_page",
    title: "Page Jumper",
    summary: "Takes the visitor straight to any page of the site.",
    progress: "Jumping to the page…",
    description:
      "Navigate the visitor to one of the site's public pages. Use this when the visitor asks to see or go to a specific page. The 'page' argument must be a route path the site actually has, like '/projects' — if the tool refuses, it lists the pages that exist.",
    args: {
      properties: {
        page: {
          type: "string",
          description: "Route path to open, e.g. '/projects' or '/'.",
        },
      },
      required: ["page"],
    },
  },
  {
    name: "count_library",
    title: "Library Counter",
    audience: "editor",
    summary:
      "Tells the signed-in owner how many CVs and portfolios are saved in their library.",
    progress: "Counting the library…",
    description:
      "Report how many CVs and portfolios the signed-in member has saved in their library — names and which one is active included. Only meaningful for a signed-in member. Call this when they ask how many CVs or portfolios they have, or what their library holds.",
  },
  {
    name: "share_page_link",
    title: "Link Sharer",
    summary:
      "Copies the address of the page the visitor is on to their clipboard.",
    progress: "Copying the page link…",
    description:
      "Copy the URL of the page the visitor is currently viewing to their clipboard, ready to paste anywhere. Use this when the visitor wants to share or grab the link of the page they are on.",
  },
];

// The skills store: every capability Robi can be given, with its display
// metadata. The chatbot's Skills panel renders this list — installing a
// skill hands its tool to the model, uninstalling takes it away.
export const SKILL_REGISTRY = TOOL_SCHEMAS;

// Human label for the live status row. Every tool carries its own progress
// line right in its definition, so a new tool shows up in the status row
// automatically — no second list to maintain.
export const toolProgress = (name) =>
  TOOL_SCHEMAS.find((tool) => tool.name === name)?.progress || `Running ${name}…`;

// Exported for regression tests — pure functions over the registry.
export const providerTools = (handlerNames, provider) => {
  const tools = TOOL_SCHEMAS.filter((tool) => handlerNames.includes(tool.name));
  if (tools.length === 0) return undefined;
  // A tool's argument schema comes from its own `args` in the registry —
  // tools without one take no arguments.
  const schemaFor = (tool) => ({
    type: "object",
    properties: tool.args?.properties ?? {},
    ...(tool.args?.required ? { required: tool.args.required } : {}),
  });
  if (provider === "openai") {
    return tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: schemaFor(tool),
      },
    }));
  }
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: schemaFor(tool),
  }));
};

// Run one tool call and phrase the outcome for the model to relay. The
// model-parsed arguments are handed to the handler; handlers validate their
// own input and return an honest failure message rather than pretending.
// Also exported for the regression tests.
export const runTool = async (handlers, name, args = {}) => {
  const handler = handlers?.[name];
  if (!handler) return `Tool ${name} is not available right now.`;
  try {
    return await handler(args);
  } catch (error) {
    return `Tool ${name} failed: ${error?.message || "unknown error"}`;
  }
};

const safeJson = (raw) => {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
};

// The system prompt: who Robi is, what the site contains, plus the LIVE
// portfolio content — so the model speaks the owner's real data and answers
// in the visitor's language.
const systemPromptFor = (content, audience = "visitor") => {
  const brand = content?.brand || "this portfolio";
  const owner = content?.hero?.name || brand;
  const skills = [
    ...new Set([
      ...(content?.hero?.skills ?? []).map((skill) => skill.name).filter(Boolean),
      ...(content?.skills ?? []),
    ]),
  ]
    .slice(0, 15)
    .join(", ");
  const projects = (content?.projects ?? [])
    .slice(0, 6)
    .map((project) => project.title)
    .join(", ");
  const email =
    content?.contact?.mail?.href?.replace(/^mailto:/, "").split("?")[0] || "";
  const about = String(content?.about?.paragraphs?.[0]?.text ?? "")
    .replace(/\*\*/g, "")
    .slice(0, 300);

  return [
    `You are Robi, the friendly robot assistant living in the corner of ${owner}'s portfolio site (${brand}).`,
    `The navbar menu labels are Intro (that's the home page, path "/"), About, Skills, Projects, Contact and My CV (/cv/library). CV mode's menu is just My CV (/cv/library) — the shelf whose New CV modal takes a title and creates a CV pre-seeded with the standard sections (Professional Summary, Work Experience, Education, Skills and so on — all empty, ready to fill). The whole CV lives on ONE page at /cv: a single stack of section cards, no group headings. Signed-in owners edit any card with its pencil, drag a card anywhere to reorder it, and delete with the trash (two clicks to confirm) — the headline card at the top is the exception: it edits but never deletes. "+ Add section" at the top-right of the page drops a fresh section right under the headline and opens its editor.`,
    `It is also a builder: signed-in owners get a portfolio editor (/edit), the More Templates gallery on /cv that restyles the CV — 100 design layouts, every gallery card a live miniature, with a print preview of the real PDF — a Guidelines guide on /cv that teaches how that design system works, and library shelves (/library, /cv/library) holding every saved version. Visitors browse the public showcase and get the same CV viewing, theming, Guidelines and PDF hand-outs — and they can even DRAG the /cv section cards into any order just to see them arranged their way; nothing saves for them, a refresh restores the original. No sign-in needed for any of that.`,
    skills && `Live skills data: ${skills}.`,
    projects && `Live projects: ${projects}.`,
    email && `Contact email: ${email}.`,
    about && `About intro: ${about}`,
    `CV WRITING — when someone shares raw career details (jobs, studies, skills, projects) and wants a CV, first work out their PROFESSION from the clues: tools, verbs, degrees, industries. React and APIs mean software engineer; wards and patient care mean nurse; classrooms and lesson plans mean teacher; ledgers and audits mean accountant. Then shape the CV the way that profession's recruiters expect: engineering and development put Projects & Achievements high; healthcare, aviation and finance lead with Certifications & Training; hospitality, sales and support highlight Languages; researchers put Education first. Name the profession inside the Professional Summary.`,
    `CV section shapes: "entry" items carry heading (role/degree/title), sub (organization/place), period, details; "list" items are short texts (skills, languages); "text" items are paragraphs (summaries, references). Keep 5-8 sections with concrete, achievement-flavored wording. Use ONLY the facts you were given — reword freely, but never invent employers, dates, numbers or schools.`,
    audience === "editor"
      ? `When the member asks for a CV and you have the write_cv tool, compose the full CV and call write_cv ONCE with { title, profession, sections } instead of printing it, then confirm what was saved (it opens at /cv). Without write_cv — or the skill uninstalled — write the CV as neat plain text in your reply and mention that signing in lets Robi save it into their library automatically.`
      : `You cannot save anything for this person — the library belongs to the owner's account. If they want a CV, either write it as neat plain text in your reply or, when they mean THIS portfolio's CV, use your reading tools instead.`,
    audience === "editor"
      ? `BE PROACTIVE with CV talk: whenever someone mentions a CV — writing one, improving it, its design, sections, printing or downloading — answer briefly, then push the conversation forward by offering 2-3 concrete next steps they can pick from. Draw them from what this person can actually do: signed-in members can have you write and save a whole CV (write_cv), restyle it from the More Templates gallery on /cv, learn the design from Guidelines, or get the PDF (download_cv); visitors can get a plain-text CV, the PDF, and a nudge that signing in unlocks auto-saving into their library. Vary the suggestions instead of repeating one, and on non-CV topics stay a normal assistant — don't push.`
      : audience === "viewer"
        ? `BE PROACTIVE as a reading assistant: after you answer, offer 2-3 concrete next steps from what they can actually do — dig deeper into a section (ask_cv), compare the CV to a job description they paste (analyze_fit), compose a LinkedIn about or intro email from it (summarize_cv), or take the PDF (download_cv). Vary the suggestions instead of repeating one, and on non-CV topics stay a normal assistant — don't push.`
        : `BE PROACTIVE as a site guide: after you answer, offer 2-3 next steps from what a visitor can actually do — explore the pages, get the CV as a PDF (download_cv), copy the contact email, or ask you anything about ${owner}'s work (ask_cv). A gentle nudge that signing in unlocks CV building and saving is welcome — once. On non-site topics stay a normal assistant — don't push.`,
    `Rules: answer in the language the visitor writes (English, Bengali or Banglish). Keep replies short — under 80 words, plain text, no markdown. Be warm and a little playful; you are a robot. When a tool call produced a result, confirm it in your own words. If asked to do something the site cannot do, say what you CAN do instead.`,
  ]
    .filter(Boolean)
    .join("\n");
};

const gatewayError = async (response) => {
  let detail = "";
  try {
    const data = await response.json();
    detail = data?.error?.message || data?.message || "";
  } catch {
    /* non-JSON body — the status alone will do */
  }
  return `Gateway responded ${response.status}${detail ? ` — ${detail}` : ""}`;
};

// The upstream model can refuse at peak hours (429 rate limits, 529/5xx
// overloads — MiniMax-style surges). A short bounded retry with backoff
// rides out the transient blips; longer outages still surface as errors.
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504, 529]);

const fetchWithRetry = async (url, options, onStatus) => {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url, options);
    if (
      response.ok ||
      !RETRYABLE_STATUSES.has(response.status) ||
      attempt > 2
    ) {
      return response;
    }
    onStatus({ kind: "retry", status: response.status, attempt });
    await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
  }
};

// Read a streaming response as server-sent events, handing each `data:`
// JSON payload (and null for the `[DONE]` sentinel) to onEvent. Buffering
// by blank line survives chunk boundaries that split events apart.
const streamSSE = async (response, onEvent) => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const event of events) {
      for (const line of event.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") {
          onEvent(null);
          continue;
        }
        try {
          onEvent(JSON.parse(payload));
        } catch {
          /* keepalive comment or incomplete JSON — ignore */
        }
      }
    }
  }
};

const MAX_TOOL_ROUNDS = 4;

// The system prompt every brain starts from: Robi's persona, who is on the
// other side (as verified by the app's own auth), where they are sitting,
// and a nudge to actually use the tools on offer — without which smaller
// models answer "click the About link" instead of jumping. The tool list is
// built from the handlers really being offered, so it never advertises a
// missing tool.
const buildSystem = (
  content,
  { handlers = {}, audience = null, viewer = null, currentPage = "" } = {},
) =>
  [
    systemPromptFor(content, audience || (viewer ? "member" : "visitor")),
    // Who is on the other side, as verified by the app's own auth — not just
    // claimed in chat. An editor owns the content; a viewer reads it
    // read-only; a visitor gets site talk only.
    audience === "viewer" && viewer
      ? `You are talking to a SIGNED-IN VIEWER${[viewer.firstName, viewer.lastName].filter(Boolean).length ? ` — ${[viewer.firstName, viewer.lastName].filter(Boolean).join(" ")}` : ""}${viewer.email ? ` (${viewer.email})` : ""}. Their sign-in is verified by the app itself, and they see the whole portfolio READ-ONLY: they may read, download and ask about everything here, but neither they nor you can edit the owner's content — never promise changes, saves or new CVs to them.`
      : viewer
        ? `You are talking to a SIGNED-IN member${[viewer.firstName, viewer.lastName].filter(Boolean).length ? ` — ${[viewer.firstName, viewer.lastName].filter(Boolean).join(" ")}` : ""}${viewer.email ? ` (${viewer.email})` : ""}. Their sign-in is verified by the app itself, so you may share THEIR OWN account-related details — their name, email, and their portfolio content — and help with account things.`
        : `You are talking to a VISITOR who is NOT signed in. Stick to site-related questions; never invent or reveal any account details, and if they ask about "their account", kindly tell them to sign in first via the Login option in the navbar.`,
    // Where the visitor is sitting right now — the model otherwise answers
    // "which page am I on" with a guess.
    currentPage && `The visitor is currently viewing: ${currentPage}.`,
    TOOL_SCHEMAS.some((tool) => handlers?.[tool.name]) &&
      `Your tools (${TOOL_SCHEMAS.filter((tool) => handlers?.[tool.name])
        .map((tool) => tool.name)
        .join(", ")}) take real actions in the visitor's browser. When a request matches one — going to a page, copying a link or the email, handing over the CV file — call the tool and confirm the result, instead of telling the visitor to do it themselves.`,
  ]
    .filter(Boolean)
    .join("\n");

// One conversation turn-set in ({from, text} messages). Resolves to
// { text, usage: {input, output} | null, thinkMs | null } — the model's
// final text, the token accounting, and how long it thought before its
// first word — with the text streaming live through onText(fullTextSoFar).
// Progress surfaces through onStatus({kind:"thinking"} | {kind:"tool",name})
// so the UI can show what Robi is doing right now. Tool calls loop
// internally: call → run handler → feed result back, until the model
// answers with plain text.
export const callGateway = async (
  gateway,
  turns,
  content,
  {
    handlers = {},
    onText = () => {},
    onStatus = () => {},
    currentPage = "",
    viewer = null,
    audience = null,
  } = {},
) => {
  const base = String(gateway.url || "").trim().replace(/\/+$/, "");
  if (!/^https?:\/\//.test(base)) {
    throw new Error("Gateway URL must start with http:// or https://");
  }
  if (!gateway.key) throw new Error("API key is missing");

  const provider = gateway.provider === "openai" ? "openai" : "anthropic";
  const tools = providerTools(Object.keys(handlers), provider);
  const system = buildSystem(content, { handlers, audience, viewer, currentPage });
  const conversation = turns
    .slice(-12)
    .map((turn) => ({
      role: turn.from === "user" ? "user" : "assistant",
      content: turn.text,
    }));
  // Timing and token accounting, Claude-style: how long the model thought
  // before its first word, and what the round trip cost.
  const startedAt = performance.now();
  let firstTokenAt = null;
  let usage = null; // { input, output }
  let fullText = "";

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
    // Each round starts with the model reading everything again.
    onStatus({ kind: "thinking" });
    let url;
    let headers;
    // Composing a whole CV through the write_cv tool call is a big JSON —
    // rounds carrying that tool get room to finish it; the fit/summary
    // composers get a little more than plain chat; plain chat stays lean.
    const body = {
      max_tokens: handlers?.write_cv
        ? 2000
        : handlers?.analyze_fit || handlers?.summarize_cv
          ? 700
          : 400,
      stream: true,
    };
    if (provider === "openai") {
      url = `${base}/v1/chat/completions`;
      headers = {
        "content-type": "application/json",
        authorization: `Bearer ${gateway.key}`,
      };
      body.model = gateway.model || providerMeta("openai").defaultModel;
      body.messages = [{ role: "system", content: system }, ...conversation];
      // Ask OpenAI-compatible backends to append a usage summary chunk.
      body.stream_options = { include_usage: true };
      if (tools) body.tools = tools;
    } else {
      url = `${base}/v1/messages`;
      headers = {
        "content-type": "application/json",
        "x-api-key": gateway.key,
        "anthropic-version": "2023-06-01",
        // Anthropic's own API refuses browser calls unless this header is
        // set; gateways that proxy it simply ignore the header.
        "anthropic-dangerous-direct-browser-access": "true",
      };
      body.model = gateway.model || providerMeta("anthropic").defaultModel;
      body.system = system;
      body.messages = conversation;
      if (tools) body.tools = tools;
    }

    const response = await fetchWithRetry(
      url,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      },
      onStatus,
    );
    if (!response.ok) throw new Error(await gatewayError(response));

    let roundText = "";
    let finishReason = null;
    const openaiCalls = new Map(); // index → { id, name, arguments }
    const anthropicTools = [];
    let currentTool = null;

    await streamSSE(response, (event) => {
      if (!event) return;
      if (provider === "openai") {
        const choice = event.choices?.[0];
        // The usage summary rides on its own final chunk.
        if (event.usage) {
          usage = {
            input: event.usage.prompt_tokens ?? 0,
            output: event.usage.completion_tokens ?? 0,
          };
        }
        if (!choice) return;
        if (choice.finish_reason) finishReason = choice.finish_reason;
        const delta = choice.delta;
        if (delta?.content) {
          if (firstTokenAt == null) firstTokenAt = performance.now();
          roundText += delta.content;
          onText(fullText + roundText);
        }
        // Reasoning models (deepseek-r1, o-series, …) stream their private
        // thinking before any answer text — surface it in the status row so
        // the wait shows what the model is doing, not a bare clock.
        if (typeof delta?.reasoning_content === "string" && delta.reasoning_content) {
          onStatus({ kind: "thinking", thought: delta.reasoning_content });
        }
        for (const fragment of delta?.tool_calls ?? []) {
          const assembled =
            openaiCalls.get(fragment.index) ?? { id: "", name: "", arguments: "" };
          if (fragment.id) assembled.id = fragment.id;
          if (fragment.function?.name) assembled.name = fragment.function.name;
          if (fragment.function?.arguments) {
            assembled.arguments += fragment.function.arguments;
          }
          openaiCalls.set(fragment.index, assembled);
        }
        return;
      }
      // Anthropic event stream.
      if (event.type === "message_start") {
        usage = {
          input: event.message?.usage?.input_tokens ?? 0,
          output: event.message?.usage?.output_tokens ?? 0,
        };
      } else if (event.type === "content_block_start") {
        const block = event.content_block ?? {};
        if (block.type === "tool_use") {
          currentTool = { id: block.id, name: block.name, json: "" };
          anthropicTools.push(currentTool);
        }
      } else if (event.type === "content_block_delta") {
        const delta = event.delta ?? {};
        if (delta.type === "text_delta") {
          if (firstTokenAt == null) firstTokenAt = performance.now();
          roundText += delta.text ?? "";
          onText(fullText + roundText);
        } else if (delta.type === "input_json_delta" && currentTool) {
          currentTool.json += delta.partial_json ?? "";
        }
      } else if (event.type === "message_delta") {
        finishReason = event.delta?.stop_reason ?? finishReason;
        if (event.usage?.output_tokens != null) {
          usage = { input: usage?.input ?? 0, output: event.usage.output_tokens };
        }
      }
    });

    if (provider === "openai") {
      const calls = [...openaiCalls.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([index, call]) => ({
          id: call.id || `call_${index}`,
          name: call.name,
          arguments: call.arguments || "{}",
        }));
      if (calls.length > 0) {
        fullText += roundText;
        conversation.push({
          role: "assistant",
          content: roundText || null,
          tool_calls: calls.map((call) => ({
            id: call.id,
            type: "function",
            function: { name: call.name, arguments: call.arguments },
          })),
        });
        for (const call of calls) {
          onStatus({ kind: "tool", name: call.name });
          conversation.push({
            role: "tool",
            tool_call_id: call.id,
            content: await runTool(handlers, call.name, safeJson(call.arguments)),
          });
        }
        continue;
      }
      return {
        text: roundText.trim(),
        usage,
        thinkMs: firstTokenAt == null ? null : Math.round(firstTokenAt - startedAt),
      };
    }

    if (finishReason === "tool_use" && anthropicTools.length > 0) {
      fullText += roundText;
      conversation.push({
        role: "assistant",
        content: [
          ...(roundText ? [{ type: "text", text: roundText }] : []),
          ...anthropicTools.map((use) => ({
            type: "tool_use",
            id: use.id,
            name: use.name,
            input: safeJson(use.json),
          })),
        ],
      });
      const results = [];
      for (const use of anthropicTools) {
        onStatus({ kind: "tool", name: use.name });
        results.push({
          type: "tool_result",
          tool_use_id: use.id,
          content: await runTool(handlers, use.name, safeJson(use.json)),
        });
      }
      conversation.push({ role: "user", content: results });
      continue;
    }
    return {
      text: roundText.trim(),
      usage,
      thinkMs: firstTokenAt == null ? null : Math.round(firstTokenAt - startedAt),
    };
  }
  throw new Error("The model kept calling tools without settling on an answer");
};

// ---- The built-in free brain ---------------------------------------------
//
// Robi answers out of the box through Puter.js (js.puter.com), which fronts
// hosted models with NO API key: under Puter's "User Pays" model each
// chatter's own free Puter allowance covers the tokens, so the site owner
// never wires a key and visitors chat for free up to that allowance (and
// this app's own daily cap, enforced in Chatbot.jsx). A configured AI
// Gateway always wins — the built-in brain only fills the no-gateway case.

export const BUILT_IN_BRAIN = {
  source: "https://js.puter.com/v2/",
  model: "gpt-5.4-mini",
  label: "Built-in free brain",
};

// Inject the Puter SDK once, on first use — the script tag only hits the
// network when the built-in brain actually answers, never when a custom
// gateway is doing the thinking.
let puterPromise = null;
export const loadPuter = () => {
  if (window.puter) return Promise.resolve(window.puter);
  if (!puterPromise) {
    puterPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = BUILT_IN_BRAIN.source;
      script.async = true;
      script.onload = () =>
        window.puter
          ? resolve(window.puter)
          : reject(new Error("The free AI bridge loaded but didn't initialize."));
      script.onerror = () => {
        // Allow a retry on the next message — the failure may be transient.
        puterPromise = null;
        reject(
          new Error(
            "Couldn't reach the free AI bridge (js.puter.com) — check the connection, or set up an AI Gateway in Settings.",
          ),
        );
      };
      document.head.appendChild(script);
    });
  }
  return puterPromise;
};

// The free brain speaks Puter's chat API — OpenAI-shaped (same message
// list, same tools array) but streamed as an async iterable whose parts
// arrive whole: text parts carry `.text`, tool calls arrive complete as
// {type:"tool_use", id, name, input}, errors as {type:"error", message}.
// So this is a lighter cousin of callGateway: no SSE assembly, and the
// contract is identical — { text, usage, thinkMs }.
export const callBuiltInBrain = async (
  puter,
  turns,
  content,
  {
    handlers = {},
    onText = () => {},
    onStatus = () => {},
    currentPage = "",
    viewer = null,
    audience = null,
  } = {},
) => {
  const system = buildSystem(content, { handlers, audience, viewer, currentPage });
  const messages = [
    { role: "system", content: system },
    ...turns.slice(-12).map((turn) => ({
      role: turn.from === "user" ? "user" : "assistant",
      content: turn.text,
    })),
  ];
  const tools = providerTools(Object.keys(handlers), "openai");
  // Same size rules as the gateway rounds: CV composition needs the most room.
  const max_tokens = handlers?.write_cv
    ? 2000
    : handlers?.analyze_fit || handlers?.summarize_cv
      ? 700
      : 400;
  const startedAt = performance.now();
  let firstTokenAt = null;
  let fullText = "";
  let model = BUILT_IN_BRAIN.model;

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
    onStatus({ kind: "thinking" });
    const options = { stream: true, max_tokens };
    if (tools) options.tools = tools;
    if (model) options.model = model;
    let resp;
    try {
      resp = await puter.ai.chat(messages, options);
    } catch (error) {
      // A retired model id shouldn't brick the free brain — fall back to
      // Puter's platform default once, then let real errors surface.
      if (model && /model/i.test(String(error?.message || error))) {
        model = null;
        delete options.model;
        resp = await puter.ai.chat(messages, options);
      } else {
        throw error;
      }
    }

    let roundText = "";
    const calls = [];
    for await (const part of resp) {
      if (part?.type === "error") {
        throw new Error(part.message || "The free brain didn't answer.");
      }
      if (part?.type === "tool_use") {
        calls.push(part);
        continue;
      }
      const text = typeof part?.text === "string" ? part.text : "";
      if (text) {
        if (firstTokenAt == null) firstTokenAt = performance.now();
        roundText += text;
        onText(fullText + roundText);
      }
    }

    if (calls.length > 0) {
      fullText += roundText;
      messages.push({
        role: "assistant",
        ...(roundText ? { content: roundText } : {}),
        tool_calls: calls.map((call) => ({
          id: call.id,
          type: "function",
          function: { name: call.name, arguments: JSON.stringify(call.input ?? {}) },
        })),
      });
      for (const call of calls) {
        onStatus({ kind: "tool", name: call.name });
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: await runTool(handlers, call.name, call.input ?? {}),
        });
      }
      continue;
    }
    return {
      text: roundText.trim(),
      usage: null, // Puter's stream carries no usage summary
      thinkMs: firstTokenAt == null ? null : Math.round(firstTokenAt - startedAt),
    };
  }
  throw new Error("The model kept calling tools without settling on an answer");
};
