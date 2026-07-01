# Prompt Playbook

Reusable patterns for getting frontier-quality work out of Claude — in this app's API routes and in your own day-to-day use (Claude Code, chat, the API). This is model-agnostic: it survives any single model name. Capture what works for *you* here as you learn it.

## Model cheat sheet

| You want… | Use |
| --- | --- |
| Strongest reasoning / long autonomous runs | `claude-fable-5` (most capable widely released) |
| Best Opus-tier: agentic coding, knowledge work | `claude-opus-4-8` (this app's default) |
| Near-Opus quality at lower cost, high volume | `claude-sonnet-5` |
| Fast/cheap simple tasks | `claude-haiku-4-5` |

Verify any model ID against current docs before pinning it — don't guess a name. In Claude Code, the `/claude-api` skill is the reference.

## Five levers that move quality the most

1. **State the goal up front, in one well-specified turn.** Frontier models plan better when they get the whole task at once rather than dribbled across turns. Say what "done" looks like.
2. **Give the reason, not just the request.** "I'm building X for Y; they need Z. With that in mind: …" The model connects the task to the right context instead of guessing intent.
3. **Tune effort to the task.** `high` is the default sweet spot; `xhigh` for hard coding/agentic work; `low`/`medium` for routine or latency-sensitive work. Higher isn't always better — sweep it.
4. **Be concrete about output shape.** For structured data, constrain it (see below). For prose, ask for the shape you want with a positive example, not a list of "don't"s.
5. **Set boundaries.** Say what *not* to do — "report findings and stop; don't apply a fix until I ask," or "don't add abstractions beyond what the task needs."

## Structured output (what this app relies on)

Both API routes use the reliable pattern: constrain the response to a JSON Schema via `output_config.format`, then **re-validate with Zod** before trusting it. Never raw-string-match model output; always `JSON.parse` + validate. See `app/api/tag-item/route.ts` and `app/api/suggest-outfit/route.ts`.

When you add a field: update the JSON Schema **and** the Zod schema in `lib/schema.ts` (they're synced by hand), or validation will reject good responses.

## This app's AI touchpoints — how to tune them

- **Vision tagging** (`tag-item`): the prompt asks for honest uncertainty (`null` when unclear) and specific color names. If tags feel generic, make the instruction more concrete with 2–3 example color names — positive examples beat prohibitions.
- **Outfit suggestions** (`suggest-outfit`): the prompt hands the model a JSON wardrobe and asks for distinct, occasion-appropriate combos, then the route filters returned `item_ids` down to ones that actually exist. Keep that guard — it's what stops invented items.

## Reusable snippets

**Constrain scope (stop over-engineering):**
> Only make the change requested. Don't add helpers, abstractions, or error handling for cases that can't happen. Do the simplest thing that works.

**Report-then-stop (for questions, not change requests):**
> When I'm describing a problem or asking a question rather than asking for a change, the deliverable is your assessment. Report findings and stop; don't apply a fix until I ask.

**Concise, readable answers:**
> Lead with the outcome — the first sentence answers "what happened / what did you find." Supporting detail after. Keep it readable: complete sentences, spelled-out terms, no arrow-chains or invented shorthand.

**Coverage-first code review (then filter):**
> Report every issue you find, including low-confidence or low-severity ones, each tagged with confidence and severity. Don't self-filter for importance — a later pass will rank them.

## How to grow this file

When a prompt gets you a great result, paste the version that worked here with a one-line note on why. Over time this becomes *your* playbook — the thing that reproduces your best results regardless of which model is serving them.
