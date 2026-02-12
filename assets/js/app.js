// assets/js/app.js

// Generate sparkles
(() => {
    const container = document.getElementById('sparkles');
    if (!container) return;
    const { count, sizeMin, sizeMax, durMin, durMax, delayMax, colorA, colorB } = CONFIG.sparkles;
    for (let i = 0; i < count; i++) {
        const el = document.createElement('span');
        el.className = 'sparkle';
        el.style.setProperty('--x', `${Math.random() * 100}%`);
        el.style.setProperty('--y', `${Math.random() * 100}%`);
        el.style.setProperty('--dur', `${durMin + Math.random() * (durMax - durMin)}s`);
        el.style.setProperty('--delay', `${Math.random() * delayMax}s`);
        el.style.setProperty('--size', `${sizeMin + Math.random() * (sizeMax - sizeMin)}px`);
        el.style.setProperty('--color', Math.random() > 0.5 ? colorA : colorB);
        container.appendChild(el);
    }
})();

(() => {
    /**
     * Desktop-only: we show a fallback if the device likely doesn't support hover
     * or the screen is small.
     */
    const isProbablyDesktop = () => {
        const hasHover = window.matchMedia?.('(hover: hover)').matches;
        const hasFinePointer = window.matchMedia?.('(pointer: fine)').matches;
        const isLandscape = window.innerWidth > window.innerHeight;
        return (hasHover && hasFinePointer) || isLandscape;
    };

    const views = {
        mobile: document.getElementById('view-mobile'),
        question: document.getElementById('view-question'),
        success: document.getElementById('view-success'),
    };

    const btnYes = document.getElementById('btn-yes');
    const btnNo = document.getElementById('btn-no');
    const btnAgain = document.getElementById('btn-again');
    const tease = document.getElementById('tease');
    const btnRow = btnYes?.parentNode;

    if (!views.mobile || !views.question || !views.success || !btnYes || !btnNo || !btnAgain || !tease || !btnRow) {
        // If something is missing, do nothing (avoid runtime errors).
        return;
    }

    const teaseLines = CONFIG.teaseLines;
    const extraTeaseLines = CONFIG.extraTeaseLines;
    const extraTeaseAfter = CONFIG.extraTeaseAfter;
    const defaultTease = CONFIG.defaultTease;

    let noHoverCount = 0;
    const recentTeases = [];

    const setView = (which) => {
        // Snapshot the current card height before hiding, so the next view can match it
        const currentVisible = Object.values(views).find((el) => !el.classList.contains('hidden'));
        const prevHeight = currentVisible ? currentVisible.offsetHeight : 0;

        Object.values(views).forEach((el) => el.classList.add('hidden'));
        views[which].classList.remove('hidden');

        // Match the previous view's height to prevent the page from jumping
        if (prevHeight > 0) {
            views[which].style.minHeight = `${prevHeight}px`;
        }
    };

    /**
     * Places the "No" button somewhere random inside the entire question section,
     * while avoiding a "safe zone" around the Yes button.
     */
    const moveNoButton = () => {
        const sectionRect = views.question.getBoundingClientRect();
        const noRect = btnNo.getBoundingClientRect();
        const yesRect = btnYes.getBoundingClientRect();

        const noW = Math.ceil(noRect.width);
        const noH = Math.ceil(noRect.height);

        // Inner bounds with padding so it doesn't stick to the edges.
        const padding = CONFIG.noButton.edgePadding;
        const minX = padding;
        const minY = padding;
        const maxX = Math.max(minX, Math.floor(sectionRect.width - noW - padding));
        const maxY = Math.max(minY, Math.floor(sectionRect.height - noH - padding));

        // Build safe zone around YES (relative to section coordinates)
        const yesX = yesRect.left - sectionRect.left;
        const yesY = yesRect.top - sectionRect.top;
        const safePad = CONFIG.noButton.safePadding;

        const safeZone = {
            left: Math.max(0, Math.floor(yesX - safePad)),
            top: Math.max(0, Math.floor(yesY - safePad)),
            right: Math.min(Math.floor(sectionRect.width), Math.ceil(yesX + yesRect.width + safePad)),
            bottom: Math.min(Math.floor(sectionRect.height), Math.ceil(yesY + yesRect.height + safePad)),
        };

        const intersectsSafeZone = (x, y) => {
            const right = x + noW;
            const bottom = y + noH;
            const separated =
                right < safeZone.left || x > safeZone.right || bottom < safeZone.top || y > safeZone.bottom;
            return !separated;
        };

        // Current No position (relative to section) — must move far from here
        const curNoX = noRect.left - sectionRect.left;
        const curNoY = noRect.top - sectionRect.top;
        const minDist = CONFIG.noButton.minDistance;

        let x = minX;
        let y = minY;

        const tries = CONFIG.noButton.maxTries;
        for (let i = 0; i < tries; i++) {
            const rx = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
            const ry = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

            const dist = Math.hypot(rx - curNoX, ry - curNoY);
            if (!intersectsSafeZone(rx, ry) && dist >= minDist) {
                x = rx;
                y = ry;
                break;
            }

            x = rx;
            y = ry;
        }

        // On first move, pin Yes in place and snapshot No's position for smooth transition
        const isFirstMove = btnNo.parentNode !== views.question;
        if (isFirstMove) {
            // Pin Yes so it doesn't re-center when No leaves the flex container
            const yesRelX = yesRect.left - sectionRect.left;
            const yesRelY = yesRect.top - sectionRect.top;
            btnYes.style.position = 'absolute';
            btnYes.style.left = `${Math.floor(yesRelX)}px`;
            btnYes.style.top = `${Math.floor(yesRelY)}px`;
            views.question.appendChild(btnYes);

            // Snapshot No's current position so the transition has a starting point
            const noStartX = noRect.left - sectionRect.left;
            const noStartY = noRect.top - sectionRect.top;
            views.question.appendChild(btnNo);
            btnNo.style.position = 'absolute';
            btnNo.style.left = `${Math.floor(noStartX)}px`;
            btnNo.style.top = `${Math.floor(noStartY)}px`;
            // Force layout so the browser registers the starting position
            btnNo.getBoundingClientRect();
        }

        btnNo.style.position = 'absolute';
        const dur = CONFIG.noButton.transitionDuration;
        btnNo.style.transition = `left ${dur} ease, top ${dur} ease, transform 120ms ease, background 160ms ease`;
        btnNo.style.left = `${x}px`;
        btnNo.style.top = `${y}px`;
    };

    const flowerLayer = document.getElementById('flower-layer');

    const spawnFlowers = () => {
        // Remove any leftover petals
        flowerLayer.querySelectorAll('.flower-petal').forEach((el) => el.remove());

        const { count, emojis, durMin, durMax } = CONFIG.flowers;
        for (let i = 0; i < count; i++) {
            const el = document.createElement('span');
            el.className = 'flower-petal';
            el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            el.style.setProperty('--x', `${Math.random() * 100}%`);
            el.style.setProperty('--size', `${28 + Math.random() * 24}px`);
            el.style.setProperty('--dur', `${durMin + Math.random() * (durMax - durMin)}s`);
            el.style.setProperty('--delay', `${Math.random() * 0.5}s`);
            el.style.setProperty('--drift', `${(Math.random() - 0.5) * 180}px`);
            el.style.setProperty('--spin', `${(Math.random() - 0.5) * 360}deg`);
            el.addEventListener('animationend', () => el.remove(), { once: true });
            flowerLayer.appendChild(el);
        }
    };

    const resetGame = () => {
        noHoverCount = 0;
        recentTeases.length = 0;
        tease.textContent = defaultTease;

        // Clear min-height from all views so they size naturally
        Object.values(views).forEach((el) => el.style.minHeight = '');

        // Return both buttons to the flex row
        if (btnYes.parentNode !== btnRow) {
            btnRow.appendChild(btnYes);
        }
        btnYes.style.position = '';
        btnYes.style.left = '';
        btnYes.style.top = '';

        if (btnNo.parentNode !== btnRow) {
            btnRow.appendChild(btnNo);
        }
        btnNo.style.position = '';
        btnNo.style.left = '';
        btnNo.style.top = '';
        btnNo.style.transform = '';
        btnNo.style.transition = '';

        setView('question');
    };

    const init = () => {
        if (!isProbablyDesktop()) {
            setView('mobile');
            return;
        }

        // Initial state
        setView('question');

        // Position No button once the layout is ready
        resetGame();

        btnYes.addEventListener('click', () => {
            setView('success');
            spawnFlowers();
        });

        btnAgain.addEventListener('click', () => {
            resetGame();
        });

        // Run-away on hover: shake briefly, then move
        btnNo.addEventListener('mouseenter', () => {
            noHoverCount += 1;

            let line;
            if (noHoverCount <= teaseLines.length) {
                line = teaseLines[noHoverCount - 1];
            } else {
                const pool = noHoverCount >= extraTeaseAfter
                    ? teaseLines.concat(extraTeaseLines)
                    : teaseLines;
                const available = pool.filter((l) => !recentTeases.includes(l));
                line = available[Math.floor(Math.random() * available.length)];
            }
            recentTeases.push(line);
            if (recentTeases.length > 2) recentTeases.shift();
            tease.textContent = line;

            // Shake, then run away
            btnNo.classList.add('shaking');
            btnNo.addEventListener('animationend', () => {
                btnNo.classList.remove('shaking');
                moveNoButton();
            }, { once: true });
        });

        // If the window is resized significantly, re-place No to keep it inside bounds.
        window.addEventListener('resize', () => {
            // If it becomes non-desktop-ish, show fallback.
            if (!isProbablyDesktop()) {
                setView('mobile');
                return;
            }

            // Keep question view stable if currently playing
            if (!views.question.classList.contains('hidden')) {
                moveNoButton();
            }
        });
    };

    init();
})();