(function () {
    const root = document.documentElement;
    const themeToggle = document.querySelector('[data-theme-toggle]');
    const menuToggle = document.querySelector('[data-menu-toggle]');
    const mobileNav = document.querySelector('[data-mobile-nav]');
    const progress = document.querySelector('[data-progress]');
    const rotator = document.querySelector('[data-rotator]');
    const navLinks = Array.from(document.querySelectorAll('[data-navlink]'));
    const sections = Array.from(document.querySelectorAll('[data-section]'));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function setTheme(theme) {
        root.setAttribute('data-theme', theme);
        localStorage.setItem('kms-theme', theme);
        themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
        document.querySelector('meta[name="theme-color"]').setAttribute('content', theme === 'dark' ? '#0a0a0b' : '#f5f4ef');
    }

    const savedTheme = localStorage.getItem('kms-theme');
    setTheme(savedTheme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));

    themeToggle.addEventListener('click', function () {
        setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    });

    function closeMenu() {
        mobileNav.classList.remove('is-open');
        menuToggle.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open menu');
    }

    menuToggle.addEventListener('click', function () {
        const open = mobileNav.classList.toggle('is-open');
        menuToggle.classList.toggle('is-open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    navLinks.forEach(function (link) {
        link.addEventListener('click', closeMenu);
    });

    const words = ['Build.', 'Ship.', 'Refactor.', 'Repeat.'];
    let wordIndex = 0;
    if (!reduceMotion.matches) {
        window.setInterval(function () {
            rotator.style.opacity = '0';
            rotator.style.transform = 'translateY(-8px)';
            window.setTimeout(function () {
                wordIndex = (wordIndex + 1) % words.length;
                rotator.textContent = words[wordIndex];
                rotator.style.transform = 'translateY(8px)';
                requestAnimationFrame(function () {
                    rotator.style.opacity = '1';
                    rotator.style.transform = 'none';
                });
            }, 250);
        }, 2400);
    }

    const revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    document.querySelectorAll('.reveal').forEach(function (element) {
        if (reduceMotion.matches) element.classList.add('is-visible');
        else revealObserver.observe(element);
    });

    function updateScrollState() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (max > 0 ? Math.min(100, window.scrollY / max * 100) : 0) + '%';
        const active = sections.reduce(function (current, section) {
            const bounds = section.getBoundingClientRect();
            return bounds.top <= window.innerHeight * .35 && bounds.bottom > window.innerHeight * .35 ? section.dataset.section : current;
        }, null);
        navLinks.forEach(function (link) {
            link.classList.toggle('is-active', link.dataset.navlink === active);
        });
    }

    let ticking = false;
    window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            updateScrollState();
            ticking = false;
        });
    }, { passive: true });
    updateScrollState();

    if (!reduceMotion.matches && window.matchMedia('(pointer: fine)').matches) {
        document.querySelectorAll('.magnetic').forEach(function (card) {
            card.addEventListener('pointermove', function (event) {
                const bounds = card.getBoundingClientRect();
                const x = (event.clientX - bounds.left) / bounds.width - .5;
                const y = (event.clientY - bounds.top) / bounds.height - .5;
                card.style.transform = 'translate3d(' + (x * 8).toFixed(2) + 'px,' + (y * 8 - 4).toFixed(2) + 'px,0)';
            });
            card.addEventListener('pointerleave', function () {
                card.style.transform = '';
            });
        });
    }
}());
