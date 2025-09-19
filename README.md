# Reels-Scraper

Lightweight Express + Playwright project to scrape Instagram Reels for a given username.

## Features

- Express server with a `/scrape` route
- Uses Playwright (Chromium) to load Instagram and extract reel URLs, captions and thumbnails
- Fallback to interactive browser if Instagram redirects to login

## Quick start (local)

1. Install dependencies:

```bash
npm install
```

2. Start the server (development):

```bash
npm run dev
```

3. Example request:

GET /scrape?username=<instagram_username>&limit=10

Example using curl:

```bash
curl "http://localhost:3000/scrape?username=instagram&limit=5"
```

The route returns a JSON array of reels with fields: `reel_url`, `caption`, `thumbnail_url`, `posted_at`.

## Docker

A Dockerfile is included that uses the official Playwright image so browsers are available inside the container.

Build the image:

```bash
docker build -t reels-scraper .
```

Run the container (map port 3000):

```bash
docker run --rm -p 3000:3000 reels-scraper
```
