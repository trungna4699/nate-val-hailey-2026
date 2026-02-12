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
        "Nice try 😌",
        "Nope 😂",
        "You can't pick that one 😤",
        "Be honest 💖",
    ];

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

        // Smooth-ish move
        btnNo.style.transition = 'left 160ms ease, top 160ms ease, transform 120ms ease, background 160ms ease';
        btnNo.style.left = `${x}px`;
        btnNo.style.top = `${y}px`;
    };

    const resetGame = () => {
        noHoverCount = 0;
        tease.textContent = '';

        // Center-ish default placement for "No"
        btnNo.style.left = '60%';
        btnNo.style.top = '60%';
        btnNo.style.transform = 'translate(-50%, -50%)';

        setView('question');

        // After layout settles, replace with an actual pixel position so future moves are consistent
        requestAnimationFrame(() => {
            const containerRect = playground.getBoundingClientRect();
            const noRect = btnNo.getBoundingClientRect();

            const x = Math.max(12, Math.min(containerRect.width - noRect.width - 12, (containerRect.width * 0.62)));
            const y = Math.max(12, Math.min(containerRect.height - noRect.height - 12, (containerRect.height * 0.62)));

            btnNo.style.transform = 'none';
            btnNo.style.left = `${Math.floor(x)}px`;
            btnNo.style.top = `${Math.floor(y)}px`;
        });
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

            if (noHoverCount <= 5) {
                tease.textContent = teaseLines[noHoverCount - 1];
            } else if (noHoverCount % 3 === 0) {
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