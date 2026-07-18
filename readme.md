# Somrat Sorkar — Portfolio

Personal portfolio of [Somrat Sorkar](https://somrat.netlify.app) — Senior Web Developer & Dev Team Lead at [Themefisher](https://themefisher.com).

Built with [Astro](https://astro.build) + [Tailwind CSS v4](https://tailwindcss.com), based on [Astroplate](https://github.com/zeon-studio/astroplate).

## Development

```bash
pnpm install
pnpm dev      # start dev server at localhost:4321
pnpm build    # production build to dist/
pnpm check    # type-check
```

## Editing content

All copy lives in [`src/content/homepage/-index.md`](src/content/homepage/-index.md) — hero, about, experience, skills, projects, open-source stats, services and contact. Site settings, menus and socials are in [`src/config/`](src/config/), colors and fonts in [`src/config/theme.json`](src/config/theme.json).

Contact form submissions are handled by [Formspree](https://formspree.io).

## Deploy

Pushed to Netlify (`netlify.toml` included): publish directory `dist`, build command `pnpm build`.
