# University portfolio section

Compact grouped page: `dist/projects/university/` (RU/EN). Three concise cards and one project-contribution certificate; not a claim that the three projects form one deployed product.

## Evidence and scope

- UniTrack: grades and needed-score calculation confirmed in `Calculator.tsx`; recommendations confirmed in `AIAdvisor.tsx` in the available project archive. Independent student project, not an official university service. No private repository link, student screenshots, credentials or student records copied.
- AI Masterclass Materials: public original website inspected on 2026-09-19; 60 bilingual scenarios, presentations, practice files and QR confirmed. Describes prepared materials, not teaching or an already-held event. Source: https://nursultannurmukhamet.github.io/ai-masterclass-materials/ .
- Speech: project-contribution certificate supports ASR analysis, integration design for Telegram/Whisper/MMS, contextual post-processing and engineering constraints. No accuracy metrics, model-training or production-deployment claim.
- Certificate: original unmodified PNG, with the redacted preview replaced at the user's request. This supports speech research; it is not masterclass completion certification. This change is local, not a new publication.
- Artwork: reused existing AI Masterclass `brand-hero.png`; UniTrack and speech cover illustrations are original CSS graphics, not screenshots or actual recognition output.

Main gallery third entry opens this grouped case. Other project entries and the eight blueprint slots are preserved. No external deployment performed for this change.

## Verification

Run `node --test tests/university.test.mjs` for local references, page content, bilingual/modal structure and publication-boundary checks. Browser QA covers desktop/mobile, RU/EN, opening/closing the certificate and returning focus.

Verified 2026-09-19: all 69 repository tests pass; browser checks at 1280×800, 375×812 and 320×740 pass, images load, RU/EN switch works, certificate opens and closes with Escape with focus restoration. The third diagonal-gallery entry opens the new page. No browser errors/warnings observed. The existing UniTrack URL was blocked by the browsing client (`ERR_BLOCKED_BY_CLIENT`), so current live availability is not verified; this is not evidence that the service itself is down.
