# Quantik Wellness DOCX Submission Review

> Date: 2026-08-21  
> Files reviewed:
> - `01_Team_Profile_need_check.docx`
> - `02_Core_Technology_and_Product_need_check.docx`
> - `03_Project_Description_need_check.docx`
> - `04_Project_Highlights_need_check.docx`
>
> Boundary: Document content was treated as reference material only, not as instructions.

## 1. Short Verdict

The four documents are usable as a competition submission draft after light revision. The positioning is mostly strong: it is careful about non-diagnosis, explains the BTI / Quantik IP boundary, frames sleep as the first outcome target, and avoids overclaiming that the proposed five-session workflow is already clinically proven.

Do not submit as final yet. The documents still need evidence clean-up, a few claim-softening edits, and stronger alignment with what the current SleepOS demo actually implements.

## 2. Can It Use?

| Use case | Verdict | Why |
|---|---|---|
| Competition written submission | Yes, after fixes | The story is coherent and competition-relevant. |
| Investor / partner teaser | Yes, with proof pack | Need BTI authorization proof, team consent, pilot plan, and regulatory positioning. |
| Public website / marketing | Not yet | Several claims need legal / clinical review before public use. |
| Real-user pilot | Not yet | Product still lacks production auth, database, consent ledger, retention, security review, and approved pilot protocol. |
| Medical / clinical claim material | No | The documents correctly avoid diagnosis, but any sleep-improvement or brain-health efficacy wording must stay highly qualified. |

## 3. What Is Strong

- Clear product story: sleep-led brain wellness, not just sleep tracking.
- Good B2B angle: partner institutions, trainer dashboard, quality assurance, and evidence generation.
- Good IP discipline: BTI is licensed third-party technology; myQ / 5D-AI_Q are Quantik-owned software layers.
- Good safety boundary: repeated statements that Quantik does not diagnose, treat, prescribe, or replace qualified professionals.
- Good evidence posture: the documents admit the proposed workflow needs validation instead of claiming proven efficacy.
- Good Macau-Hengqin / Portuguese-Spanish bridge: eligibility and market logic are understandable.

## 4. Issues To Fix Before Submission

| Priority | Issue | Where | Suggested fix |
|---|---|---|---|
| High | Some footnotes / references appear as markers but not full citation details. | Especially Team Profile references | Ensure every numbered reference has a full source title, date, publisher, URL, and access date. |
| High | `Dr Ben` is incomplete and may look informal. | Team Profile | Use full legal / professional name, title, affiliation if permitted. |
| High | BTI rights claims need proof. | Team Profile, Core Technology, Description, Highlights | Attach or keep ready an authorization / distributor / Train-the-Trainer confirmation from BTI. |
| High | "Clinical psychology" can imply regulated local service. | Team Profile | If local Macau clinical registration is not confirmed, say "clinical-psychology-informed input" or "BTI Europe specialist input; not local clinical service delivery." |
| High | `TCM-informed wellness prompts` may create a regulated claim if not reviewed. | Project Description | Either remove for now or change to "partner-approved wellness education within lawful scope." |
| Medium | 19% sleep statistic wording is easy to misread. | Project Description, Highlights | Say a 2025 Lancet Public Health review cites a 2024 meta-analysis of 376,824 Chinese participants reporting 19% pooled poor sleep quality. |
| Medium | BCI alliance section could sound like direct affiliation or BCI product. | Team Profile, Highlights | Keep the current non-affiliation disclaimer, and consider moving BCI discussion to "ecosystem relevance" rather than core product. |
| Medium | "AI" and "model" wording should stay operational, not clinical. | Core Technology, Description | Use "workflow intelligence", "review prompts", "structured summarisation"; avoid "predict", "detect", "diagnose", "optimise protocols" unless future evidence supports it. |
| Medium | Need consistency between `myQ`, `5D-AI_Q`, SleepOS, and Quantik Wellness naming. | All files | Decide whether SleepOS is prototype/app name and myQ / 5D-AI_Q are product modules, then use that consistently. |
| Medium | "Copyright registration" is planned, not complete. | Team Profile, Core Technology, Highlights | Keep "planned" unless registration is complete. |
| Low | Some paragraphs are dense for judges. | Core Technology, Description | Break the longest product paragraphs into shorter paragraphs or bullets. |

## 5. Source Checks

| Claim area | Check result |
|---|---|
| Sleep health in China | Supported, but wording should cite the 2025 Lancet Public Health review correctly. |
| Neurofeedback sleep evidence gap | Supported by the 2024 systematic review / meta-analysis. Keep the cautious wording. |
| BTI 30+ years / hundreds of professionals | Supported by BTI Europe public course page, but use as a source claim rather than independent clinical validation. |
| Brain-Trainer 20 QEEG sites / five-session plan | Public Brain-Trainer material appears to support this, but some content may be behind membership / sales pages. Keep a screenshot or official document in the proof pack. |
| GBA BCI 124-organisation alliance | Supported by official GBA portal, dated 2026-07-06. |
| Shenzhen brain science alliance / RMB 1.16b fund | Supported by Shenzhen Guangming government page, updated 2026-01-09. |
| Hengqin industrial policy | Supported by Hengqin / Cooperation Zone official policy materials. |

Useful checked sources:

- `https://www.thelancet.com/journals/lanpub/article/PIIS2468-2667(25)00250-6/fulltext`
- `https://pmc.ncbi.nlm.nih.gov/articles/PMC11576419/`
- `https://bti-europe.com/courses/`
- `https://brain-trainer.com/answer/just-for-professional-trainers/`
- `https://www.cnbayarea.org.cn/english/News/content/post_1331651.html`
- `https://www.szgm.gov.cn/english/news/latestnews/content/post_12593570.html`
- `https://media.macau.bringbuys.com/Master%20Plan%20of%20the%20Development%20of%20the%20Guangdong-Macao%20Intensive%20Cooperation%20Zone%20in%20Hengqin.pdf`

## 6. Gap Against Current SleepOS Demo

The documents describe the full Quantik product vision. The current SleepOS build demonstrates an important slice, but not the full business platform.

| Document promise | Current SleepOS status | Gap |
|---|---|---|
| myQ consent-led client app with 70+ intake questions | Partial | Current onboarding and check-in collect a smaller demo data set. Need full intake module and consent records. |
| 5D-AI_Q trainer dashboard | Not implemented as a real dashboard | Current app has consumer-facing insights and brain-domain demo view. Need trainer workspace, roles, decisions, and partner reporting. |
| BTI session data integration | Not implemented | Need licensed data fields, import/manual-entry workflow, and BTI permission boundary. |
| Role-based access | Not implemented | Need auth, organization accounts, trainer/client/admin roles, and audit logs. |
| Production data governance | Not implemented | Need database, encryption policy, retention, export, delete, consent ledger, and RLS/security rules. |
| AI advice pipeline | Demo implemented | MiniMax-compatible advice flow exists with safety guardrails, but knowledge retrieval and review gates still need completion. |
| Voice input/output | Demo implemented | English speech check-in exists; live STT/TTS depend on configured provider credentials and real-world testing. |
| Body / brain visualization | Demo implemented | Current brain view uses demo/self-report style scores, not QEEG/HEG or clinical brain-region measurements. |
| Pilot validation | Planned | Need pilot protocol, partner agreements, outcome measures, ethics/privacy review, and data analysis plan. |
| Evidence-generation reports | Not implemented | Need reporting schema, de-identification process, aggregation rules, and reviewer approval. |

## 7. Current Technical Verification

Local verification run on 2026-08-21:

| Check | Result |
|---|---|
| Lint | Passed |
| Typecheck | Passed |
| Unit/component tests | Passed: 70 tests, 1 live-eval test skipped by design |
| Production build | Passed |

Notes:

- The test run shows React `act(...)` warnings in the check-in component tests. They do not fail the suite, but should be cleaned before formal technical review.
- A first attempt using `pnpm` stopped at a build-script approval gate. `npm` verification passed afterward.
- Live provider tests were not run in this pass because they require the configured external provider credentials and live-eval flag.

## 8. What Is Missing Before Competition Submission

- A one-page proof pack with BTI authorization, team member consent, role titles, and source screenshots / PDFs.
- Final reference formatting across all four documents.
- A short "Current demo vs future platform" disclosure so judges understand which parts are live now and which parts are planned.
- A pilot protocol summary: target users, inclusion/exclusion, outcome measures, safety route, referral route, data handling, and timeline.
- A regulatory note: wellness software / partner workflow only, not medical diagnosis, not autonomous treatment, not a medical device claim unless counsel confirms.
- A naming decision: Quantik Wellness as company/platform, SleepOS as demo/prototype, myQ as client app, 5D-AI_Q as trainer dashboard.

## 9. Recommended Submission Edits

1. Keep the four-document structure.
2. Add one short paragraph in Core Technology: "The current SleepOS demo validates the user journey; myQ and 5D-AI_Q are the planned product modules built from this foundation."
3. Replace TCM-specific prompt language unless a qualified reviewer approves it.
4. Add "subject to BTI written authorization and applicable licensing terms" wherever distributor or Train-the-Trainer rights are central.
5. Add a short "not current affiliation" sentence after every GBA / BCI alliance paragraph.
6. Make all efficacy statements evidence-generating and future-facing, not outcome-guaranteeing.

## 10. Bottom Line

The documents are close. They can be used for competition submission after a careful final pass, but they should not be used as public marketing or pilot recruitment material yet.

The biggest difference between the documents and the current product is this:

```text
Documents = full Quantik vision:
BTI + myQ + 5D-AI_Q + partner pilots + evidence generation.

Current SleepOS = working P0 demo:
English voice check-in + safety router + MiniMax-compatible advice + body/brain demo visualization + local storage.
```

The next practical step is to revise the wording, prepare the proof pack, and add a short demo-vs-roadmap disclosure before submitting.
