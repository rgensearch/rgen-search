# RGen Search — coordinated upgrade (v2)

A free-first static frontend plus two Vercel serverless endpoints.

## Included
- Crossref scholarly metadata search and PubMed literature search through `/api/research`.
- Search by source, relevance/newest ordering, source links, DOI and locally saved topics.
- Study workspace: local notes, downloadable TXT notes, JSON workspace export, flashcards, biology quiz, local learning points, dark mode.
- AI-ready `/api/ai` endpoint. AI is **off until configured** and uses private environment variables. No key is included in the repository.
- PWA manifest and service worker for app-like installation/basic shell caching.

## Important limits
- Crossref/PubMed provide records/metadata, not guaranteed full-text access. Follow the original source links and respect access/licensing.
- AI generation will show a study outline until a compatible provider is configured.
- Notes/topics/cards/points are saved in the current browser only. Clearing browser storage can remove them. This is not account-based cloud sync.
- PPT/PDF/DOC generation, sign-in, cross-device sync and collaboration are not claimed as implemented in this version.
- There is no built-in rate limiting or user authentication. Before opening this to high traffic, add rate limiting/abuse protection and usage monitoring to `/api/ai`.

## Deploy on Vercel from GitHub (phone-friendly)
1. Open `https://github.com/rgensearch/rgen-search` and sign in.
2. For each file in this ZIP, open the same path in the repository. Use **Add file → Upload files** for new files (`api/research.js`, `api/ai.js`, `package.json`) and replace the existing `index.html`, `styles.css`, `app.js`, `manifest.json`, `sw.js`, and `README.md` with the versions in this ZIP. Create the `api` folder first if GitHub's uploader requires a path; GitHub's web editor can create `api/research.js` directly by entering the slash in the filename.
3. Commit the changes to the `main` branch. Do not upload any API key or `.env` file.
4. Open `https://vercel.com/dashboard`, choose the project connected to `rgensearch/rgen-search`, and confirm the deployment finishes. Vercel detects functions in the `/api` directory for Node.js deployments.
5. Open the live site and test a search such as `plant tissue culture`. Also test notes, flashcards and quiz.

## Secure optional AI setup
AI requires a provider that supports the OpenAI-compatible Chat Completions API. Provider free tiers and availability change; verify its current terms before choosing one. Do not send the secret key in ChatGPT or commit it to GitHub.

In Vercel: Project → Settings → Environment Variables, add:
- `AI_API_KEY` = provider secret key
- `AI_BASE_URL` = provider's documented API base URL, without trailing slash and without `/chat/completions`
- `AI_MODEL` = exact model identifier accepted by that provider

Select the intended environments, save, and redeploy. If no provider is configured, research and study tools still work. Avoid sharing a public endpoint without rate limits because requests can consume provider quota.

## Test checklist
- Search with source `All sources`, then test Crossref and PubMed individually.
- Try a short query and an uncommon query.
- Save a topic, reload, and check it remains in the same browser.
- Save notes and download `.txt`; export workspace JSON.
- Add and flip a flashcard; answer quiz questions.
- Test narrow mobile layout and theme toggle.
- AI should display a clear setup message until environment variables are set.
