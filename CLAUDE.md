# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal portfolio website for Minsoo Kim (kmshack.kr), an Android developer with 15 years of experience. The site is a static GitHub Pages site built with vanilla HTML, CSS, and JavaScript - no build tools or frameworks.

**Tech Stack:**
- Pure HTML5, CSS3, JavaScript (ES6+)
- GitHub Pages hosting
- Jekyll configuration (minimal - used only for GitHub Pages metadata)
- Google Analytics (G-QR5KSRPTYH)

## Project Structure

```
/
├── index.html           # Main portfolio page
├── assets/
│   ├── css/style.css    # All styles with CSS custom properties for theming
│   ├── js/main.js       # Theme toggle and smooth scroll functionality
│   └── images/
│       └── profile.jpg  # Profile photo
├── favicon.svg          # KH logo with sky blue background
├── _config.yml          # GitHub Pages/Jekyll configuration
└── CNAME                # Custom domain configuration
```

## Key Architecture Patterns

### Theme System
The site implements a dual light/dark theme system using CSS custom properties:

- Theme state is stored in `localStorage` with key `'theme'`
- Falls back to system preference via `prefers-color-scheme` media query
- Theme toggle button (bottom-right) rotates 180° on hover
- All color values are defined as CSS variables in `:root` and `[data-theme="dark"]` in assets/css/style.css:1-19

Theme switching logic in assets/js/main.js:2-44:
1. Check localStorage for saved preference
2. If none, use system preference
3. Apply `data-theme="dark"` attribute to `<html>` for dark mode
4. Listen for both button clicks and system theme changes

### Layout Structure
- Split-screen design: sticky left image panel + scrollable right content
- Responsive: converts to vertical stack on mobile (<768px)
- Hero image uses `position: sticky` to remain visible while content scrolls
- All layout is flexbox-based (no grid for main structure)

### Content Sections

**About Section** (index.html:56-62):
Three-paragraph structure describing professional experience, indie projects, and community contributions. Mentions both corporate work (Kakao, Bugs) and notable indie apps like BusanBus and ONEWallet.

**Projects Section** (index.html:63-88):
A single unified grid showcasing both professional and personal projects. Professional projects (BugsMusic, KakaoMusic, KakaoTalk, KakaoPay) are listed first using FontAwesome icons, followed by indie apps like BusanBus (public transportation), ONEWallet (finance manager), and other personal projects using emoji icons. All project cards feature hover effects (translateY + box-shadow) for interactivity.

## Development Workflow

Since this is a static site with no build process:

**Local Development:**
```bash
# Serve locally (use any simple HTTP server)
python -m http.server 8000
# or
npx serve
```

**Testing:**
- Open index.html in browser
- Test theme toggle functionality
- Verify responsive behavior at different viewport sizes
- Check smooth scroll on anchor links (if any added)

**Deployment:**
- Push to `main` branch
- GitHub Pages automatically deploys
- Site available at https://kmshack.kr

## Important Notes

**Google Analytics:**
- Tracking ID `G-QR5KSRPTYH` is configured in index.html:16-23
- Do not remove or modify the gtag.js script block

**Domain Configuration:**
- Custom domain is configured via CNAME file
- Do not modify CNAME file unless changing domain

**Jekyll Configuration:**
- _config.yml exists for GitHub Pages metadata only
- Theme is set to `null` - this is intentional (custom HTML/CSS used)
- Site uses custom styling, not a Jekyll theme

**Styling Guidelines:**
- All colors must use CSS custom properties (--bg-color, --text-color, etc.)
- Any new interactive elements should have smooth transitions
- Maintain mobile-first responsive design
- Keep the minimalist, clean aesthetic

**File Organization:**
- Keep single-page structure (index.html)
- All CSS in assets/css/style.css
- All JS in assets/js/main.js
- No build step or bundling required
