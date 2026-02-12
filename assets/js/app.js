// assets/js/app.js

(() => {
    /**
     * Desktop-only: we show a fallback if the device likely doesn't support hover
     * or the screen is small.
     */
    const isProbablyDesktop = () => {
        const hasHover = window.matchMedia?.('(hover: hover)').matches;
        const hasFinePointer = window.matchMedia?.('(pointer: fine)').matches;
        const wideEnough = window.innerWidth >= 820; // adjustable
        return hasHover && hasFinePointer && wideEnough;
    };

    const views = {
        mobile: document.getElementById('view-mobile'),
        question: document.getElementById('view-question'),
        success: document.getElementById('view-success'),
    };

    const playground = document.getElementById('playground');
    const btnYes = document.getElementById('btn-yes');
    const btnNo = document.getElementById('btn-no');
    const btnAgain = document.getElementById('btn-again');
    const tease = document.getElementById('tease');

    if (!views.mobile || !views.question || !views.success || !playground || !btnYes || !btnNo || !btnAgain || !tease) {
        // If something is missing, do nothing (avoid runtime errors).
        return;
    }

    const teaseLines = [
        "Hmm? You sure? 😏",
        "Nope 😂",
        "Be honest 😉",
        "Đừng né mà 🥹",
    ];

    const defaultTease = 'Choose wisely 🤭';

    let noHoverCount = 0;

    const setView = (which) => {
        Object.values(views).forEach((el) => el.classList.add('hidden'));
        views[which].classList.remove('hidden');
    };

    /**
     * Places the "No" button somewhere random inside the playground,
     * while avoiding a "safe zone" around the Yes button.
     */
    const moveNoButton = () => {
        const containerRect = playground.getBoundingClientRect();
        const noRect = btnNo.getBoundingClientRect();
        const yesRect = btnYes.getBoundingClientRect();

        const noW = Math.ceil(noRect.width);
        const noH = Math.ceil(noRect.height);

        // Inner bounds with padding so it doesn't stick to the edges.
        const padding = 12;
        const minX = padding;
        const minY = padding;
        const maxX = Math.max(minX, Math.floor(containerRect.width - noW - padding));
        const maxY = Math.max(minY, Math.floor(containerRect.height - noH - padding));

        // Build safe zone around YES (relative to playground coordinates)
        const yesX = yesRect.left - containerRect.left;
        const yesY = yesRect.top - containerRect.top;
        const safePad = 30; // "safe zone" expansion around the YES button

        const safeZone = {
            left: Math.max(0, Math.floor(yesX - safePad)),
            top: Math.max(0, Math.floor(yesY - safePad)),
            right: Math.min(Math.floor(containerRect.width), Math.ceil(yesX + yesRect.width + safePad)),
            bottom: Math.min(Math.floor(containerRect.height), Math.ceil(yesY + yesRect.height + safePad)),
        };

        const intersectsSafeZone = (x, y) => {
            const left = x;
            const top = y;
            const right = x + noW;
            const bottom = y + noH;

            const separated =
                right < safeZone.left || left > safeZone.right || bottom < safeZone.top || top > safeZone.bottom;

            return !separated;
        };

        // Try random positions a few times; fall back to anything if needed.
        let x = minX;
        let y = minY;

        const tries = 25;
        for (let i = 0; i < tries; i++) {
            const rx = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
            const ry = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

            if (!intersectsSafeZone(rx, ry)) {
                x = rx;
                y = ry;
                break;
            }

            // if we fail a lot, accept the last random attempt
            x = rx;
            y = ry;
        }

        // Pin the Yes button in place before pulling No out of flex flow
        if (!btnYes.style.position) {
            btnYes.style.position = 'absolute';
            btnYes.style.left = `${Math.floor(yesX)}px`;
            btnYes.style.top = `${Math.floor(yesY)}px`;
        }

        // Pull out of flex flow so it can roam freely
        btnNo.style.position = 'absolute';

        // Smooth-ish move
        btnNo.style.transition = 'left 160ms ease, top 160ms ease, transform 120ms ease, background 160ms ease';
        btnNo.style.left = `${x}px`;
        btnNo.style.top = `${y}px`;
    };

    const resetGame = () => {
        noHoverCount = 0;
        tease.textContent = defaultTease;

        // Return both buttons to normal flex flow (centered side-by-side)
        btnYes.style.position = '';
        btnYes.style.left = '';
        btnYes.style.top = '';

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
        });

        btnAgain.addEventListener('click', () => {
            resetGame();
        });

        // Run-away on hover
        btnNo.addEventListener('mouseenter', () => {
            noHoverCount += 1;

            if (noHoverCount <= teaseLines.length) {
                tease.textContent = teaseLines[noHoverCount - 1];
            } else {
                tease.textContent = teaseLines[Math.floor(Math.random() * teaseLines.length)];
            }

            moveNoButton();
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