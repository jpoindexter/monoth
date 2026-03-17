# Contributing to Monoth

Thanks for your interest. Here's how to get started.

## Setup

```bash
git clone https://github.com/jpoindexter/monoth
cd monoth
cp .env.example .env
# Fill in at minimum: FINNHUB_API_KEY and FRED_API_KEY (both free)
npm install
npm run dev
```

For API routes locally, use the Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

Or use the included dev server:

```bash
npx tsx dev-server.ts   # runs API routes on :3002
npm run dev             # runs frontend on :5173
```

## Adding a panel

1. Create `src/components/panels/YourPanel.tsx` (keep it under 300 lines — split into sub-components if needed)
2. Register it in `src/stores/panel-store.ts`
3. Add an API route under `api/` if you need server-side data fetching
4. Use shared utilities from `src/lib/panel-utils.ts` (formatters, tab helpers, etc.)

## Code style

- TypeScript everywhere
- Tailwind for styling — no inline styles
- Keep files short: 300 lines max for files, 150 for components, 50 for functions
- No hardcoded secrets or API keys

## Submitting changes

1. Fork the repo and create a branch (`git checkout -b feat/my-panel`)
2. Make your changes
3. Run `npm run lint` to check for errors
4. Open a pull request against `main`

## Reporting bugs

Use the [bug report template](https://github.com/jpoindexter/monoth/issues/new?template=bug_report.md).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
