# Engineering for Gemini (Google)

Prompting and agent patterns for Gemini models. Host skill: `gemini-prompting`.
Framework: Google ADK (`google-adk.md`). Access via Google AI Studio / Vertex AI
or a gateway.

## Strengths
- Large context windows; strong multimodal (text/image/audio/video).
- Native tool/function calling and code execution; Google Search grounding.
- Tight Vertex AI integration for deploy + eval.

## Prompting patterns
- **Clear role + task + constraints**; Gemini responds well to structured,
  explicit instructions and examples.
- **Multimodal prompts** — interleave media with text; be specific about what to
  extract from each modality.
- **Grounding** — enable Search grounding for fresh factual tasks.
- **Function calling** — declare typed functions; let the model choose and chain.
- **Long context** — exploit big windows for whole-doc/codebase reasoning, but
  put the instruction near the relevant content.

## Model ids
Verify current ids and tiers (e.g. Gemini 2.x Pro/Flash) against Google's live
docs or the `gemini-prompting` skill — they change often.
