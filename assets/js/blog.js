(function () {
    'use strict';

    var root = document.documentElement;
    var themeToggle = document.querySelector('[data-theme-toggle]');
    var menuToggle = document.querySelector('[data-menu-toggle]');
    var mobileNav = document.querySelector('[data-mobile-nav]');
    var pageProgress = document.querySelector('[data-progress]');

    function setTheme(theme) {
        root.setAttribute('data-theme', theme);
        localStorage.setItem('kms-theme', theme);
        if (themeToggle) themeToggle.setAttribute('aria-label', theme === 'dark' ? '밝은 테마로 전환' : '어두운 테마로 전환');
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a0a0b' : '#f5f4ef');
    }

    setTheme(root.getAttribute('data-theme') || 'dark');
    if (themeToggle) themeToggle.addEventListener('click', function () { setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); });

    function closeMenu() {
        if (!mobileNav || !menuToggle) return;
        mobileNav.classList.remove('is-open');
        menuToggle.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', '메뉴 열기');
    }

    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', function () {
            var open = mobileNav.classList.toggle('is-open');
            menuToggle.classList.toggle('is-open', open);
            menuToggle.setAttribute('aria-expanded', String(open));
            menuToggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
        });
        Array.prototype.forEach.call(mobileNav.querySelectorAll('a'), function (link) { link.addEventListener('click', closeMenu); });
    }

    function copyText(value) {
        if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(value);
        var textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
        return Promise.resolve();
    }

    Array.prototype.forEach.call(document.querySelectorAll('[data-copy-link]'), function (button) {
        button.addEventListener('click', function () {
            var original = button.textContent;
            copyText(window.location.href).then(function () {
                button.textContent = '복사됨';
                window.setTimeout(function () { button.textContent = original; }, 1400);
            });
        });
    });

    Array.prototype.forEach.call(document.querySelectorAll('.entry pre'), function (block) {
        var code = block.querySelector('code');
        if (!code || block.querySelector('[data-code-copy]')) return;
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'code-copy';
        button.setAttribute('data-code-copy', '');
        button.textContent = '복사';
        button.addEventListener('click', function () {
            copyText(code.textContent).then(function () {
                button.textContent = '복사됨';
                window.setTimeout(function () { button.textContent = '복사'; }, 1400);
            });
        });
        block.appendChild(button);
    });

    var tocPanel = document.querySelector('[data-toc-panel]');
    var tocList = document.querySelector('[data-toc-list]');
    var headings = Array.prototype.slice.call(document.querySelectorAll('[data-post] .entry h2'));
    var tocItems = [];
    if (tocPanel && tocList && headings.length) {
        headings.forEach(function (heading, index) {
            if (!heading.id) heading.id = 'section-' + (index + 1);
            var item = document.createElement('li');
            var link = document.createElement('a');
            link.href = '#' + heading.id;
            link.textContent = heading.textContent.replace(/^\d+\.\s*/, '');
            item.appendChild(link);
            tocList.appendChild(item);
            tocItems.push({ heading: heading, link: link });
        });
    } else if (tocPanel) {
        tocPanel.hidden = true;
    }

    var entry = document.querySelector('[data-post] .entry');
    var readingProgress = document.querySelector('[data-reading-progress]');
    var progressLabel = document.querySelector('[data-reading-progress-label]');
    var readingTime = document.querySelector('[data-reading-time]');
    if (entry && readingTime) {
        var characters = entry.textContent.replace(/\s/g, '').length;
        readingTime.textContent = '읽는 시간 약 ' + Math.max(1, Math.ceil(characters / 700)) + '분';
    }

    function updateScroll() {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var pagePercentage = max > 0 ? Math.min(100, window.scrollY / max * 100) : 0;
        if (pageProgress) pageProgress.style.width = pagePercentage + '%';
        if (!entry || !readingProgress) return;
        var top = entry.getBoundingClientRect().top + window.scrollY;
        var height = Math.max(entry.offsetHeight - window.innerHeight + 160, 1);
        var percentage = Math.min(100, Math.max(0, ((window.scrollY - top + 130) / height) * 100));
        readingProgress.style.width = percentage + '%';
        if (progressLabel) progressLabel.textContent = Math.round(percentage) + '%';
        var active = null;
        tocItems.forEach(function (item) { if (item.heading.getBoundingClientRect().top <= 150) active = item; });
        tocItems.forEach(function (item) { item.link.classList.toggle('is-active', item === active); });
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () { updateScroll(); ticking = false; });
    }, { passive: true });
    window.addEventListener('resize', updateScroll);
    updateScroll();
}());
