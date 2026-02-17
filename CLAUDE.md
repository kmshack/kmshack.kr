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


LLM 코딩 시 흔히 발생하는 오류를 줄이기 위한 행동 지침입니다. 필요에 따라 프로젝트별 지침과 병합하세요.

**절충점:** 이 지침은 속도보다는 신중함을 우선시합니다. 사소한 작업의 경우 판단력을 발휘하십시오.

## 1. 코딩하기 전에 생각하세요

**추측하지 마세요. 혼란스러운 점을 숨기지 마세요. 장단점을 명확히 드러내세요.**

실행하기 전에:
- 가정한 내용을 명확하게 밝히세요. 확실하지 않으면 질문하세요.
- 여러 해석이 가능하다면, 모두 제시하십시오. 묵묵히 하나를 선택하지 마십시오.
- 더 간단한 방법이 있다면 언급하십시오. 필요하다면 반박하십시오.
- 만약 이해가 안 되는 부분이 있다면, 멈추세요. 무엇이 헷갈리는지 말하고 질문하세요.

## 2. 단순함이 최우선

**문제를 해결하는 데 필요한 최소한의 코드만 작성하세요. 추측성 코드는 일절 포함하지 마세요.**

- 요청하신 기능 외에는 추가 기능이 없습니다.
- 일회용 코드에는 추상화 계층이 없습니다.
- 요청하지 않은 "유연성"이나 "설정 가능성"은 없습니다.
- 불가능한 시나리오에 대한 오류 처리가 없습니다.
- 200줄을 썼는데 50줄로 줄일 수 있다면 다시 쓰세요.

스스로에게 "선임 엔지니어가 이것이 지나치게 복잡하다고 말할까?"라고 질문해 보세요. 만약 그렇다면, 단순화하세요.

## 3. 수술적 변화

**필요한 것만 만지세요. 자신이 만든 것만 치우세요.**

기존 코드를 편집할 때:
- 인접한 코드, 주석 또는 서식을 "개선"하지 마십시오.
- 멀쩡한 것을 굳이 리팩토링하지 마세요.
- 기존 스타일과 일치시키세요. 비록 당신이 다르게 표현하더라도 말입니다.
- 관련 없는 사용되지 않는 코드를 발견하면 삭제하지 말고 언급해 주세요.

변경 사항으로 인해 고아 파일이 생성되는 경우:
- 사용자가 변경하여 더 이상 사용되지 않게 된 임포트/변수/함수를 제거하세요.
- 요청받지 않는 한 기존의 사용되지 않는 코드를 삭제하지 마십시오.

테스트: 변경된 모든 줄은 사용자의 요청과 직접적으로 연결되어야 합니다.

## 4. 목표 중심 실행

**성공 기준을 정의하고, 검증될 때까지 반복합니다.**

과제를 검증 가능한 목표로 전환하세요:
- "유효성 검사 추가" → "유효하지 않은 입력에 대한 테스트를 작성한 다음, 해당 테스트를 통과하도록 수정"
- "버그 수정" → "버그를 재현하는 테스트를 작성하고, 테스트를 통과시키세요"
- "X 리팩토링" → "리팩토링 전후에 테스트 통과 확인"

여러 단계를 거치는 작업의 경우, 간략한 계획을 제시하십시오.
```
1. [단계] → 확인: [체크]
2. [단계] → 확인: [확인]
3. [단계] → 확인: [체크]
```

명확한 성공 기준은 독립적인 반복 작업을 가능하게 합니다. 반면, 모호한 기준("그냥 작동하게 하라")은 지속적인 명확화를 요구합니다.

