# Release checklist

- [ ] Repository contains no secrets, recordings, personal data, or client assets.
- [ ] Demo disclaimer is visible globally and on success/tracking views.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.
- [ ] `npm run test:e2e` passes on desktop, 360×800, 390×844, and tablet projects.
- [ ] `npm run audit` reports no high-severity finding.
- [ ] Water, pothole, duplicate, and danger judge scenarios work without a key.
- [ ] Create/merge controls are disabled until explicit confirmation.
- [ ] Danger path never shows an unverified number or normal create control.
- [ ] Real token route fails safely without a key.
- [ ] Public tracking excludes transcript, internal notes, assignment, and contact fields.
- [ ] Map has OpenStreetMap attribution and an accessible list alternative.
- [ ] Keyboard, focus, touch targets, contrast, and reduced-motion behaviour are checked.
- [ ] Privacy, terms, accessibility, help, 404, offline, API, mic, and browser states render.
- [ ] Cover image, screenshots, demo video, slide deck, repository, deployed URL, and submission copy are ready.
- [ ] Public deployment and any key use have explicit owner approval.
