# Arcade Hub

A small Vue 3 + Fastify monorepo for a browser game collection.

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

The game hall runs at `http://localhost:5173` and the API runs at `http://localhost:3000`.

## Verification

```bash
npm run typecheck
npm run build
```

The server exposes `GET /api/health`, `GET /api/games`, and `GET /api/games/:slug`.
