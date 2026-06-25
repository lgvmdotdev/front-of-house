# Recepcionai — Product Marketing Context

Canonical product-marketing reference for the Recepcionai landing page, in-product copy, sales materials, and any customer-facing surface. Read this before writing marketing copy, hero sections, FAQs, or UI strings that the customer will see.

The short-form pointer to this file lives in `.claude/CLAUDE.md` under the **Product** section.

---

## 1. What it is

**Recepcionai** (recepcion-AI) is a WhatsApp-based AI receptionist for barbershops. It runs on the barbershop's own WhatsApp Business number, talks to customers in natural Brazilian Portuguese, and does four jobs:

1. **Books** appointments directly into the shop's existing scheduling tool.
2. **Answers** questions about services, prices, hours, and individual barber availability.
3. **Confirms** appointments hours before they happen to reduce no-shows.
4. **Hands off** to a human at the shop whenever the conversation needs it.

The agent is trained on each shop's services, prices, procedures, and roster of barbers during onboarding.

---

## 2. Who it's for

- Brazilian barbershops. MVP target market.
- Shops with **multiple barbers** and **meaningful WhatsApp inbound volume** (enough that responding manually costs time or lost bookings).
- Shops that **already use a scheduling tool** (Booksy, Trinks, Belezito, Trezo/Trezzo, Schedullr, Google Agenda, others) and do not want to migrate.

It's **not** for:
- One-barber shops with low message volume — they can answer WhatsApp themselves.
- Shops looking to replace their scheduling tool — Recepcionai does not replace it.

---

## 3. Positioning

**We are not a competitor to existing booking tools. We are a layer on top of them.**

This is the single most important positioning point. The shop keeps its current schedule of record. Recepcionai connects to that schedule via integration and operates the WhatsApp conversation in front of it.

Avoid framing that pits Recepcionai against Booksy / Trinks / Belezito / Trezo / Schedullr. Frame it as: "you keep what works; we add the WhatsApp receptionist on top."

---

## 4. Core capabilities (what the agent does today)

- **Book on WhatsApp** — consults the shop's calendar, proposes available slots filtered by barber, books the appointment in the shop's existing tool.
- **Answer customer questions** — trained on the shop's services, prices, hours, barbers, and procedures. Examples: "Qual o preço do degradê?", "O Felipe trabalha sábado?", "Vocês fazem barba?", "Tem horário hoje à tarde?".
- **Confirm appointments** — sends a confirmation message a few hours before the appointment. Frees the slot if the customer cancels; reminds the customer if they confirm.
- **Hand off to human** — customer can ask for a human at any time; the agent steps aside and the shop owner takes over the conversation.

---

## 5. What it doesn't do (don't promise these)

- No POS integration.
- No payment collection.
- No outbound marketing campaigns.
- No replacement of the shop's scheduling tool.
- No multi-language support (pt-BR only).

If a feature isn't in section 4, do not put it on the marketing site.

---

## 6. Integrations

Integrations are **custom during beta**. The team integrates with whatever scheduling tool the partner shop already uses.

Common targets we expect to encounter: **Booksy, Trinks, Belezito, Trezo/Trezzo, Schedullr, Google Agenda**.

Do not list a specific integration on the marketing site as if it's a one-click connector — during the beta phase, integration is part of the white-glove onboarding. The honest framing is: "we integrate with the tool your shop already uses."

---

## 7. Stage

**Private beta** with a few pilot shops in Brazil. Important constraints this imposes on the marketing site:

- No public testimonials yet — do not fabricate any.
- No no-show-reduction percentage stats yet — do not fabricate any.
- No public customer logos yet.
- Beta-stage positioning is honest and useful: "vagas limitadas", "onboarding personalizado", "barbearias parceiras."

If the team gathers real numbers or testimonials later, replace the founder-credibility-and-mechanism framing with the actual proof.

---

## 8. Pricing (internal — never on the public site)

- **Setup:** R$ 2.000 one-time. Covers WhatsApp Business verification, calendar integration, knowledge base ingestion, agent training on the shop's procedures.
- **Monthly:** R$ 1.200–2.500 depending on conversation volume and number of integrations.

**Pricing is revealed only in the sales demonstration call.** The marketing site must not show numbers. Use phrasing like "plano sob medida pra sua barbearia" or "valores apresentados na demonstração."

---

## 9. Primary conversion action

**"Agendar demonstração"** — the visitor books a call with the founder.

- No self-serve sign-up.
- No public free trial.
- No "talk to AI now" widget on the marketing site.

Every CTA on the landing page should funnel to the demo booking flow.

---

## 10. Voice & tone

**Direct & professional Brazilian Portuguese.**

- Treat the shop owner as a small-business operator who values their time.
- Use the language barbershops actually use (`cadeira parada`, `no-show`, `agenda furada`, `cliente sumiu`), but don't lean into heavy slang (`fala mano`, `parceiro`) — the audience includes older owners.
- No exclamation points.
- No emoji-spam (one or two intentional emojis in a hero line are fine; emoji-littered bullet lists are not).
- No hype words: `revolucionar`, `transformar`, `potencialize`, `inovador`, `disruptivo`.
- Specifics over vague claims. Concrete scenarios ("Cliente manda mensagem às 22h e ninguém responde") over abstract benefits ("Melhore o atendimento").
- No fabricated statistics or testimonials.

---

## 11. Voice-of-customer (Brazilian barbershop owner)

Phrases / pains that resonate with the target buyer. Use these or close variants in copy:

- "Perdi cliente porque não respondi o WhatsApp a tempo."
- "Cadeira parada custa dinheiro."
- "Cliente marcou e sumiu."
- "No-show" (used in pt-BR as-is in the segment).
- "Agenda furada."
- "Respondo mensagem no meio do corte."
- "WhatsApp não para."
- "Cliente quer marcar fora do horário."

Tools the audience recognizes by name: Booksy, Trinks, Belezito, Trezo / Trezzo, Schedullr, Google Agenda, planilha.

---

## 12. Founder & credibility

- **Founder:** Luiz Vergennes — senior software engineer.
- No barbershop industry background. Don't fake one.
- The honest credibility angle is **engineering rigor + direct partnership with beta shops**, not industry pedigree.
- Recommended phrasing: "Desenvolvida por engenheiros, em parceria com barbearias parceiras no beta." Avoid "criada por especialistas em barbearia."

---

## 13. What to avoid on the marketing site

- Fabricated testimonials or quotes.
- Made-up "X% reduction in no-shows" numbers — we do not have them yet.
- Generic SaaS buzzwords (`revolucionar`, `transformar`, `potencializar`).
- Positioning against existing booking tools (we integrate, we don't compete).
- Showing pricing publicly — pricing belongs in the demo conversation.
- Claiming features that don't exist yet (POS, payments, marketing campaigns, multi-language).
- Self-serve sign-up CTAs — the conversion is always the demo.
- AI/tech jargon front-and-center ("LLM", "agente autônomo", "RAG") — the buyer is a shop owner, not an engineer.

---

## 14. Brand

- **Name:** Recepcionai. The play on words is `recepcionista` + `AI`. Sometimes stylized **Recepcion AI** when the pun needs to be visible (e.g. on first reference in a hero).
- **Pronunciation hint for first-time readers:** Recepcion-AI.
- **Category line:** "Recepcionista de IA no WhatsApp."
- **Domain (TBD):** the team has not committed to a final domain yet. Use `recepcionai.com.br` as a working placeholder unless told otherwise.

---

## 15. Glossary (for non-Brazilian readers / future agents)

- **No-show** — Customer books and doesn't appear. Direct revenue loss. The single most quantifiable benefit Recepcionai promises to reduce.
- **Cadeira parada** — Empty barber chair = lost revenue. Cultural shorthand among shop owners; lands harder than the literal "horário vazio."
- **WhatsApp Business** — Official WhatsApp product for businesses. Supports API access, verified business profile, broadcast lists. Recepcionai requires it for operation.
- **Agenda** — In this context, the scheduling tool the shop uses. Not the literal calendar app.

---

## 16. Changelog

- **2026-05-27** — Initial version. Private beta stage, pt-BR only, demo-only conversion, no public testimonials or stats.
