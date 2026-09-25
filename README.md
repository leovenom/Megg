# Megg

**No seu ponto perfeito.** A mobile-first boiled-egg timer: pick the egg size (Brazilian weight classes), whether it came from the fridge or room temperature, and the yolk doneness. Megg computes the time, runs the countdown and rings when it's done.

Built with Next.js 16 (App Router), Tailwind CSS 4 and Motion.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build && npm run start
```

## Project layout

- `src/app/` – the single page, layout/metadata, icons, OG image, robots, sitemap, manifest, 404
- `src/components/` – `Setup`, `Timer`, `Done` screens and the `Egg` illustration
- `src/lib/eggs.ts` – egg sizes, doneness levels and the cooking-time formula
- `src/lib/site.ts` – site URL, name and SEO copy
- `public/llms.txt` – description of the app for LLM crawlers

## Deployment

Set `NEXT_PUBLIC_SITE_URL` to the production origin (e.g. `https://megg.app`) in the hosting provider's environment variables before building. It drives canonical URLs, Open Graph URLs, `robots.txt` and `sitemap.xml`; without it the fallback in `src/lib/site.ts` is used.
