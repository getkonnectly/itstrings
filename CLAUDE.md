# IT Strings Website

## Project Overview
Static single-page website for IT Strings (itstrings.com) — a company offering IT Consulting (Cloud & AI talent placement) and IT Services (digital products & AI solutions).

## Tech Stack
- Single `index.html` file (no build step, no framework)
- Inline CSS in `<style>` tag
- Vanilla JavaScript (IntersectionObserver animations, smooth scroll)
- Google Fonts: Plus Jakarta Sans (body), Fraunces (display headings)

## Design System
- **Primary**: Navy `#0b1f4b`, Blue `#1652c8`
- **Surfaces**: White `#fff`, Surface `#f8fafc`, IT Services tint `#f0f4ff`
- **Text**: Ink `#0f172a`, Muted `#64748b`
- **Borders**: `#e2e8f0` with 1.5px on cards
- **Cards**: 16px border-radius, hover lift with blue top accent bar
- **Responsive**: Single breakpoint at 960px

## Deployment
- Target: Vercel (static site, no config needed)
- Just push to GitHub and import into Vercel

## Conventions
- All styles are inline in `<head>` — no external CSS files
- Use CSS custom properties (`:root` variables) for theming
- Use `.fade-up` class + IntersectionObserver for scroll animations
- Section IDs for anchor navigation: `#consulting`, `#services`, `#how`, `#industries`, `#about`, `#contact`
