# Product

## Register

MeetMind AI uses two distinct registers based on context:
1. **Considered Register (Marketing & Info)**: Informative, structured, and spacious. Used on surfaces like the Home and About pages to explain the application's features and technical architecture clearly without marketing hype.
2. **Dense Register (Working Tool)**: Highly compact, information-dense, and scannable. Used on surfaces like the Process Page, Results Dashboard, and Chat Page to give the user quick access to data, transcripts, and citations.

## Users

Engineering and product teams (PMs, tech leads, design leads) drowning in synchronous meetings. Their moment: a 60-minute recording just ended, two more are scheduled this week, and someone has to write the summary. They are not exploring a product; they are trying to close a tab. Context: laptop, often headphones, often with the recording still open in another tab. They want the meeting gone — decisions captured, action items owned, transcript searchable — in under two minutes of file-and-forget.

## Product Purpose

Turn a meeting recording (audio or video) into structured, queryable knowledge: title, hierarchical summary, action items with assignees and deadlines, key decisions, follow-up questions, and a transcript. Then let the team chat with that meeting specifically through a deterministic **LangGraph StateGraph DAG** pipeline monitored with **LangSmith** observability — no cross-talk across meetings. Success is not "user stays on the page." Success is the meeting being closed in another tab and the team acting on what was decided. Long-term: the recorded meeting is the durable artifact, the live meeting is the throwaway.

## Brand Personality

Calm, precise, considered. The product earns trust by being quieter than the meeting it replaced: not a parade of gradients, not a festival of toasts, not a dashboard that needs a tour. The interface should feel like a well-edited technical document — information dense, claims sourced, no decoration standing in for substance. Voice in the UI: declarative, short, no marketing voice, no exclamation marks, no "supercharge your workflow."

## Anti-references

- **Generic SaaS landing (Notion / Linear / Stripe-clone).** Hero with one headline and one product screenshot, airy white, soft shadows, "trusted by 10,000 teams." Not this. MeetMind's home page is the entrance to a working tool, not a campaign — it should not look like it sells something.
- **Dark-mode-default AI dev tool (Vercel / OpenAI playground).** Pure black, neon mono, terminal aesthetic as the whole identity. Not this either. The control-room vibe is welcome on the *processing* surface (SSE console, live pipeline), not as the system's house style. Going dark-by-default would make MeetMind indistinguishable from every other AI tool shipping in 2026.
- **What this means concretely.** Restrained accent usage. No gradient text on headings. No glassmorphism as the default surface. No "hero metric" template (big number / small label / supporting stats). No eyebrow label on every section. No numbered `01 · 02 · 03` markers as default scaffolding — the SSE pipeline steps are one place where numbers earn their place, and only there.

## Design Principles

1. **Practice what you preach.** The product is about structured output. The UI itself should be structured: clear hierarchy, named regions, predictable placement. No element should exist that isn't doing a job.
2. **Show, don't tell.** No "powerful" / "blazing fast" / "next-generation." Show the pipeline running, the transcript rendering, the citations linking back to chunk offsets. The work is the proof.
3. **Quiet chrome, loud content.** The frame (nav, footer, status badges) recedes. The work (transcript, action items, decisions, citations) carries the visual weight. The user is here for the meeting they just had, not the app.
4. **Cite, don't hallucinate.** Every summary, every chat answer, every action item should resolve to a transcript position the user can click. This is a trust principle, not a UI principle — but it has UI consequences: citations are first-class, not a tooltip.
5. **Two themes, one bar.** Light and dark are equally weighted and both meet AA. Neither is the "default" in spirit. The system does not lean into either as identity.
6. **Density follows the surface.** Marketing-adjacent surfaces (Home, About) get breathing room and considered prose. Working surfaces (Process, Results, Chat) get dense, scannable, tool-like layouts. The system stays coherent; the registers do not.

## Accessibility & Inclusion

WCAG 2.1 AA across both themes, treated as a deliverable not an audit step. Concrete commitments:

- Body text ≥ 4.5:1 against its background in both themes. No "muted gray for elegance" that pushes contrast under 4.5:1. Placeholder text meets the same bar.
- Focus states visible on every interactive element in both themes. No `outline: none` without a replacement.
- All functionality keyboard-reachable. Drag-and-drop uploader has a keyboard fallback (a real `<input type="file">` triggered by a button).
- SSE status updates announced via a polite live region so screen readers hear `transcribing chunk 2 of 3`, not silence.
- Information never conveyed by color alone. The pipeline status badge pairs color with a label and an icon.
- `prefers-reduced-motion: reduce` respected everywhere. Springs, blurs, and stagger reveals become crossfades or instant transitions.
- Color is not the only signal for the action items table status, the SSE state, or the theme toggle.
