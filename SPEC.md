# CVPilot — Product Specification

> Upload your CV, paste job listings, and let AI craft a tailored CV for each opportunity.

## 🎯 Vision

CVPilot helps job seekers stop sending the same generic CV everywhere. You provide your background once, paste job listing URLs, and the AI generates a custom-tailored CV for each position — emphasizing the right skills, adapting the wording, and filling gaps with a conversational chatbot.

---

## 👤 User Flow

### 1. Onboarding — "Tell me about yourself"

The user starts with a **conversational chatbot** (not a form). The bot:
- Asks the user to **upload an existing CV** (PDF) or **paste their LinkedIn URL**
- Parses and extracts structured data (experience, education, skills, languages, etc.)
- Asks follow-up questions to fill gaps:
  - "I see you worked at X for 3 years. Can you tell me more about your main achievements there?"
  - "You listed Python as a skill. What's your level? Any notable projects?"
  - "I don't see any education listed. Can you add that?"
  - "What kind of role are you looking for?"
- The user can also manually edit their **profile** at any time (structured view)
- The bot stores everything in a **master profile** — the single source of truth about the user

### 2. Job Listings — "Where do you want to apply?"

The user pastes one or more **job listing URLs**. The system:
- **Scrapes the page** to extract: job title, company, location, requirements, responsibilities, nice-to-haves, salary (if available)
- Falls back to **manual paste** if scraping fails (some sites block bots)
- Displays the parsed job listing in a clean card format
- The user can edit/correct the parsed data

### 3. Analysis — "How well do you match?"

For each job listing, the AI produces:
- **Compatibility score** (0-100) with breakdown:
  - Hard skills match
  - Soft skills match
  - Experience level fit
  - Education fit
  - Language/location fit
- **Strengths**: what the user has that matches perfectly
- **Gaps**: what's missing or weak
- **Recommendations**: concrete tips ("Consider highlighting your X experience", "You might want to get certified in Y")

### 4. CV Generation — "Here's your tailored CV"

For each job listing, the AI generates a **custom CV** that:
- **Cherry-picks** the most relevant experiences and skills from the master profile
- **Rewords** descriptions to match the job listing vocabulary and keywords
- **Reorders** sections to put the most relevant info first
- **Adds a tailored summary/objective** at the top specific to this role
- Maintains truthfulness — never invents experience, only reframes existing data

The generated CV appears in a **structured editor** (see below).

### 5. Editor — "Make it yours"

A real-time structured CV editor with:
- **Sections**: Summary, Experience, Education, Skills, Languages, Certifications, Projects, Other
- **Drag & drop** to reorder sections and items within sections
- **Inline editing** — click any text to edit
- **AI assist button** on each section: "Improve this", "Make more concise", "Add metrics"
- **Side-by-side view**: job listing on the left, CV editor on the right
- **Live preview** of the final PDF layout

### 6. Export — "Send it"

- **PDF export** with choice of 2-3 clean templates:
  - **Classic**: single column, traditional, ATS-friendly
  - **Modern**: subtle accent color, clean typography
  - **Compact**: dense two-column layout for experienced profiles
- **Language selection**: generate CV in French or English
- **Filename convention**: `CV_[Name]_[Company]_[Date].pdf`
- Future: direct apply integration, cover letter generation

---

## 🏗 Architecture

### Frontend (100% client-side SPA — GitHub Pages compatible)
- **React 18+** with **Vite** (static build, no server needed)
- **Tailwind CSS** + **Framer Motion** for polished animations (page transitions, skeleton loaders, micro-interactions)
- **@react-pdf/renderer** for live preview + PDF export (client-side)
- **Tiptap** for rich text editing within sections
- **dnd-kit** for drag & drop reordering
- **pdf.js** for client-side PDF text extraction (no server)

### Backend — There is none.
Everything runs in the browser. No server, no database, no auth.
- **PDF parsing**: `pdfjs-dist` in the browser
- **Web scraping**: calls a free CORS proxy or Jina Reader API (`https://r.jina.ai/URL`) to extract page content
- **LLM integration**: User provides their own **Gemini API key** (stored in localStorage, never leaves the browser). Calls Gemini API directly from client.
- **Storage**: `localStorage` + `IndexedDB` for profiles, job listings, generated CVs. Export/import as JSON for backup.
- **No auth needed**: everything is local to the browser

### Client-Side Architecture
```
Browser
├── PDF.js          → Extract text from uploaded CV
├── Jina Reader     → Scrape job listing URLs (r.jina.ai)
├── Gemini API      → All AI calls (chat, analysis, generation, improvement)
├── IndexedDB       → Persist profiles, jobs, CVs
├── @react-pdf      → Render + export PDF client-side
└── localStorage    → API key, preferences, UI state
```

### Data Models

**UserProfile** (master profile)
```
- id, userId
- fullName, email, phone, location, linkedinUrl, websiteUrl
- summary (free text)
- experiences: [{ company, title, startDate, endDate, current, description, highlights[] }]
- education: [{ school, degree, field, startDate, endDate, description }]
- skills: [{ name, level (1-5), category }]
- languages: [{ name, level (native/fluent/intermediate/basic) }]
- certifications: [{ name, issuer, date }]
- projects: [{ name, description, url, technologies[] }]
- targetRole (what they're looking for)
- rawCvText (original extracted text for context)
```

**JobListing**
```
- id, userId
- url, company, title, location, type (remote/hybrid/onsite)
- description (full scraped text)
- requirements[], niceToHaves[], responsibilities[]
- salary (if found)
- scrapedAt, status (active/applied/rejected/interview)
```

**GeneratedCV**
```
- id, userId, jobListingId
- sections: JSON (structured CV content)
- template (classic/modern/compact)
- language (fr/en)
- analysisScore, analysisDetails: JSON
- exportedAt, version
```

---

## 💬 Chatbot Behavior

The chatbot is the primary onboarding mechanism. It should feel natural, not like a form.

**Initial flow:**
1. "Hey! I'm here to help you land your next job. Start by uploading your current CV, or just tell me about yourself."
2. Parse the CV → extract structured data → confirm with user
3. "Great, I found X years of experience in Y. Let me ask a few questions to fill in the gaps..."
4. Ask 3-5 targeted questions based on what's missing or vague
5. "Your profile is ready! Now paste a job listing URL and I'll tailor a CV for you."

**Ongoing interactions:**
- User can always come back to chat to update their profile
- After generating a CV: "Want me to adjust anything? I can make the experience section more technical, or add more detail about your time at X."
- Proactive suggestions: "I noticed this job requires Docker — you didn't mention it. Do you have Docker experience?"

**Tone:** Professional but friendly. Not corporate. Think helpful career coach, not HR bot.

---

## 🎨 Design & UX Guidelines

- **Ultra-clean, minimal, delightful** — think Linear meets Notion
- White background, very subtle grays (#fafafa, #f5f5f5), one accent color (indigo-500)
- **Inter** font, generous whitespace, large click targets
- **Animations everywhere** (but tasteful):
  - Page transitions (fade + slide)
  - Skeleton loaders while AI thinks
  - Smooth accordion/collapse for sections
  - Micro-interactions: button press scales, hover lifts, checkmarks animate in
  - Score counter animates up (like a speedometer)
  - Cards slide in with stagger on list views
  - Toast notifications slide in/out
- **Progressive disclosure**: don't overwhelm. Show one step at a time.
- **Desktop-first** but fully responsive
- No sidebar — use a **clean top nav** or step-based flow
- The editor should feel like **Notion**: click to edit, clean blocks, no visual clutter
- Empty states with illustrations and clear CTAs
- **First-run experience**: the chatbot IS the homepage. No dashboard until you have data.

---

## 🔒 Security & Privacy

- **100% client-side** — no data ever leaves the browser (except to Gemini API and Jina Reader)
- User's Gemini API key stored in `localStorage` — never sent anywhere except Google's API
- No analytics, no tracking, no cookies
- Users can clear all data from settings
- All code is open source — auditable
- `CORS` handled via Jina Reader proxy (no custom backend needed)

---

## 📋 MVP Scope (v1)

**In scope:**
- [ ] Chatbot onboarding with CV upload (PDF)
- [ ] Manual profile editor (structured sections)
- [ ] Job listing URL scraping + manual paste fallback
- [ ] AI compatibility analysis (score + breakdown)
- [ ] AI CV generation (tailored to each job)
- [ ] Structured CV editor with inline editing
- [ ] PDF export (1 template to start)
- [ ] Auth (email magic link minimum)
- [ ] Basic dashboard (my profile, my jobs, my CVs)

**Out of scope for v1:**
- [ ] LinkedIn URL scraping (complex, anti-bot)
- [ ] Cover letter generation
- [ ] Direct apply integration
- [ ] Multiple PDF templates (start with 1, add later)
- [ ] Team/recruiter features
- [ ] Mobile app
- [ ] Multi-provider LLM support (Gemini only for v1)

---

## 🚀 Deployment

- **GitHub Pages** — static SPA, zero cost, zero maintenance
- `vite build` → deploy `dist/` to `gh-pages` branch
- GitHub Actions workflow for auto-deploy on push to `main`
- Public repo: `Youplala/cvpilot`
- Live at: `https://youplala.github.io/cvpilot/`
- No environment variables needed — user provides their own API key in the UI

### First-time Setup Screen
When no API key is configured, show a clean onboarding:
1. "To get started, you'll need a Gemini API key (it's free)"
2. Link to https://aistudio.google.com/apikey
3. Input field to paste the key
4. "Your key stays in your browser. We never see it."
5. Test the key → green checkmark → proceed to chatbot

---

## 💡 Future Ideas (v2+)

- Cover letter generation matching the CV
- LinkedIn profile import
- Job board aggregation (scrape Indeed, LinkedIn, Welcome to the Jungle)
- Application tracker (kanban: wishlist → applied → interview → offer)
- A/B test different CV versions
- ATS score checker (is my CV parseable by robots?)
- Chrome extension: "Generate CV for this job" button on job listing pages
