# Global Architects Website

Premium multi-page architecture portfolio website for **Global Architects (Dehradun, India)**.

## Overview

This is a static frontend website built with:
- HTML (multi-page structure)
- CSS (design system + animations + responsive styles)
- Vanilla JavaScript (theme handling, cursor interactions, animations, UI behavior)

## Pages

- `index.html` — Home
- `projects.html` — Projects listing
- `project-detail.html` — Single project scrollytelling page
- `about.html` — About the firm
- `contact.html` — Contact page

## Project Structure

- `css/style.css` — Core design system and component styles
- `css/animations.css` — Motion and keyframe animations
- `css/responsive.css` — Breakpoint and device-specific styles
- `js/theme.js` — Time-aware theme switching
- `js/cursor.js` — Custom architectural cursor behavior
- `js/animations.js` — Scroll/entry animation orchestration
- `js/main.js` — Shared site interactions

## Key Features

- Time-aware color themes
- Custom interactive cursor (desktop/fine pointer)
- Blueprint-style intro visuals
- Responsive layout across devices
- Project showcase and scrollytelling sections
- SEO-focused meta tags and structured data

## Run Locally

Since this is a static site, run with any local web server.

### Option 1: VS Code Live Server
1. Install **Live Server** extension.
2. Open the project folder.
3. Right-click `index.html` → **Open with Live Server**.

### Option 2: Python HTTP server
```bash
python3 -m http.server 5500
```
Then open: `http://localhost:5500`

## Deployment

You can deploy on any static hosting provider:
- GitHub Pages
- Netlify
- Vercel (static)
- Cloudflare Pages

## Notes

- Ensure all referenced assets (especially under `assets/images/` and `assets/textures/`) are present before production deployment.
- External libraries are loaded via CDN where configured.

## License

All rights reserved by the project owner unless otherwise specified.
