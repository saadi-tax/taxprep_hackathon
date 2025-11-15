# TaxGPT Frontend

Vite + React workspace enabling document organization, conversational review, and return traceability.

## Requirements
- Node.js 20+
- pnpm 9+

## Setup
```bash
cd /Volumes/ExtStorage/TaxGPT\ fun/taxprep_hackathon/frontend
pnpm install
cp env.example .env
pnpm dev
```

`VITE_API_URL` should point to the FastAPI server (default `http://localhost:8000`).

## Available scripts
| Command | Description |
| --- | --- |
| `pnpm dev` | Launch Vite dev server with HMR |
| `pnpm build` | Type-check and build production bundle |
| `pnpm preview` | Preview the production build |
| `pnpm test` | Run Vitest suite once |
| `pnpm test:watch` | Watch mode |
| `pnpm lint` | ESLint (React, hooks, TanStack Query rules) |
| `pnpm format` | Prettier across source files |

## Project structure
- `src/app` – routing + app-level tests
- `src/components` – shared UI building blocks
- `src/features/*` – feature slices (documents, workpapers, etc.)
- `src/lib` – API clients, hooks, utilities
- `src/styles` – Tailwind entrypoints
- `src/test` – testing utilities / setup

## Next steps
- Integrate live document metadata from backend endpoints
- Implement socket/EventSource updates for extraction progress
- Add bounding-box overlays in the document viewer
- Build workpaper summary visualizations hooked to backend calculators

