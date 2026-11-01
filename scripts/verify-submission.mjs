const desc = `Prabandh (प्रबंध) is an intelligent celebration planner engineered for Indian families. It rebuilds disconnected spreadsheets into a reactive, deterministic graph:

1. Unified Graph: Editing guests dynamically updates catering tiers, hall capacities, task deadlines, and budget variance.
2. Financial Engine: Strict integer rupee math prevents floating-point drift across deposits, GST, and vendor schedules.
3. 4-Pillar Celebration Analytics: Real-time scoring across Financial Health, Timeline Pace, Recce/Tasting status, and RSVP conversion with dietary split visuals.
4. Indian Cultural Presets: Tailored milestones for Shaadi, Birthday, Anniversary, Mundan, and Griha Pravesh with muhurat slots.
5. Production Quality: 16 Vitest test suites (66 tests passing), 100% TypeScript type safety, zero legacy dependencies, WCAG 2.2 AA dark/light tokens, and local-first persistence with cloud sync.`;

const genai = `Google Gemini 3.5 Flash Lite (with automated multi-tier heuristic fallback) powers 4 key celebration planning flows via structured Zod schema validation:

1. Natural Language Event Intake: Zero-shot extraction of guest counts, budgets, Indian currency formats (lakhs/crores), dates (DD/MM/YYYY), and city into structured event specs.
2. Quote Extraction: Parses raw unstructured vendor quotes and WhatsApp rate cards into line items, advances, and deliverables with tax estimation.
3. Grounded Celebration Copilot: Context-aware advice referencing the user's active budget, timeline, and vendor contracts to prevent overspending and conflicts.
4. Cultural Theme & Muhurat Ideation: Generates curated Indian celebration concepts, decor palettes, and ritual run-sheets adapted to venue type and budget constraints.`;

console.log('=== Character Count Verification ===');
console.log('Description length:', desc.length, '/ 1024 ->', desc.length <= 1024 ? 'PASS' : 'FAIL');
console.log('GenAI length:', genai.length, '/ 1024 ->', genai.length <= 1024 ? 'PASS' : 'FAIL');
