# HugeGames

Pure games, tons of mini-games.

A Vue 3 + Fastify monorepo for a browser game collection.

## Requirements

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
cp .env.example .env
```

## Development

Start both apps with:

```bash
npm run dev
```

The portal runs at `http://localhost:5173/zh` and the API runs at `http://localhost:3000`.
The versioned portal API is available under `/api/v1`.

## Verification and GitHub Pages

```bash
npm run typecheck
npm run build
npm run build:pages
```

`build:pages` builds the shared package and server data, generates the public catalog, builds the client with the `/HugeGamesRelease/` base path, and creates the SPA `404.html` fallback. GitHub Pages publishes only the resulting `apps/client/dist` directory; it does not run Fastify. When `/api/v1` is unavailable, the portal reads the generated static catalog and still supports listing, search, category filtering, sorting, and game details.

The release repository is `https://github.com/mohuancaizi/HugeGamesRelease.git`, and the target site is:

`https://mohuancaizi.github.io/HugeGamesRelease/`

The server also exposes `GET /api/health`, `GET /api/games`, and `GET /api/games/:slug` for local development.
