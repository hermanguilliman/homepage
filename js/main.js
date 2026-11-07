(() => {
    "use strict";

    // Year & Time
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    const timeDisplay = document.getElementById("timeDisplay");
    function updateTime() {
        if (!timeDisplay) return;
        const now = new Date();
        const options = { weekday: "short", day: "numeric", month: "short" };
        const dateStr = now
            .toLocaleDateString("ru-RU", options)
            .replace(/\./g, "");
        const formatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        timeDisplay.textContent = formatted;
    }
    updateTime();
    setInterval(updateTime, 60000);

    // Spotlight follower & interactive cursor position
    const spotlight = document.getElementById("spotlight");
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let isMouseActive = false;

    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        isMouseActive = true;
        if (spotlight) spotlight.style.opacity = "1";
    });

    window.addEventListener("mouseleave", () => {
        isMouseActive = false;
        if (spotlight) spotlight.style.opacity = "0";
    });

    function renderSpotlight() {
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;
        if (spotlight) {
            spotlight.style.left = `${currentX}px`;
            spotlight.style.top = `${currentY}px`;
        }
        requestAnimationFrame(renderSpotlight);
    }
    requestAnimationFrame(renderSpotlight);

    // ============================================================================
    // POLYPHONIC WEB AUDIO SYNTHESIZER + FX + OSCILLOSCOPE + LOOPER
    // ============================================================================
    const BASE_FREQS = [
        523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51,
        1567.98,
    ];
    const NOTE_NAMES = [
        ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5", "G5"],
        ["C5", "D5", "E5", "G5", "A5", "C6", "D6", "E6", "G6"],
        ["C6", "D6", "E6", "G6", "A6", "C7", "D7", "E7", "G7"],
    ];

    const PRESETS = [
        {
            name: "Crystal",
            type1: "sine",
            type2: "triangle",
            detune: 4,
            subGain: 0.25,
            cutoff: 3800,
            attack: 0.015,
            release: 0.35,
        },
        {
            name: "Cyber Saw",
            type1: "sawtooth",
            type2: "sawtooth",
            detune: 10,
            subGain: 0.5,
            cutoff: 2200,
            attack: 0.01,
            release: 0.25,
        },
        {
            name: "8-Bit",
            type1: "square",
            type2: "square",
            detune: 0,
            subGain: 0.0,
            cutoff: 4500,
            attack: 0.005,
            release: 0.12,
        },
        {
            name: "Warm Pad",
            type1: "triangle",
            type2: "sawtooth",
            detune: 14,
            subGain: 0.45,
            cutoff: 1400,
            attack: 0.06,
            release: 0.65,
        },
    ];

    let audioCtx = null;
    let masterGain = null;
    let analyser = null;
    let delaySend = null;

    let presetIndex = 0;
    let octaveShift = 0; // -1, 0, +1
    let delayEnabled = true;

    const activeVoices = new Map();
    const bgRipples = [];

    function initAudioEngine() {
        if (audioCtx) {
            if (audioCtx.state === "suspended") audioCtx.resume();
            return;
        }
        const Ctx = window.AudioContext || window.webkitAudioContext;
        audioCtx = new Ctx();

        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.3;

        const compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.value = -14;
        compressor.ratio.value = 4;

        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;

        delaySend = audioCtx.createGain();
        delaySend.gain.value = delayEnabled ? 0.32 : 0;

        const delayNode = audioCtx.createDelay(1.0);
        delayNode.delayTime.value = 0.26;

        const delayFeedback = audioCtx.createGain();
        delayFeedback.gain.value = 0.38;

        const delayFilter = audioCtx.createBiquadFilter();
        delayFilter.type = "lowpass";
        delayFilter.frequency.value = 1800;

        masterGain.connect(compressor);
        masterGain.connect(delaySend);

        delaySend.connect(delayNode);
        delayNode.connect(delayFilter);
        delayFilter.connect(delayFeedback);
        delayFeedback.connect(delayNode);
        delayFilter.connect(compressor);

        compressor.connect(analyser);
        analyser.connect(audioCtx.destination);

        startOscilloscope();
    }

    function getCardAccentColor(idx) {
        const colors = [
            "#f59e0b",
            "#c9f24b",
            "#38bdf8",
            "#f43f5e",
            "#a855f7",
            "#06b6d4",
            "#10b981",
            "#eab308",
            "#6366f1",
        ];
        return colors[idx % colors.length];
    }

    function triggerVisualFeedback(pitchIndex) {
        const idx = pitchIndex % 9;
        const card = cards[idx];
        if (card) {
            card.classList.add("synth-pulse");
            setTimeout(() => card.classList.remove("synth-pulse"), 240);

            const rect = card.getBoundingClientRect();
            bgRipples.push({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                r: 10,
                alpha: 0.55,
                color: getCardAccentColor(idx),
            });
        }
    }

    function startNote(
        pitchIndex,
        voiceId = `key-${pitchIndex}`,
        fromLooper = false,
    ) {
        try {
            initAudioEngine();
            if (activeVoices.has(voiceId)) return;

            const preset = PRESETS[presetIndex];
            const baseFreq = BASE_FREQS[pitchIndex % BASE_FREQS.length];
            const freq = baseFreq * Math.pow(2, octaveShift);
            const now = audioCtx.currentTime;

            const voiceGain = audioCtx.createGain();
            voiceGain.gain.setValueAtTime(0.0001, now);
            voiceGain.gain.linearRampToValueAtTime(0.28, now + preset.attack);
            voiceGain.gain.exponentialRampToValueAtTime(
                0.18,
                now + preset.attack + 0.15,
            );

            const filter = audioCtx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(
                preset.cutoff * Math.pow(1.25, octaveShift),
                now,
            );
            filter.Q.value = 2.2;

            const osc1 = audioCtx.createOscillator();
            osc1.type = preset.type1;
            osc1.frequency.setValueAtTime(freq, now);

            const osc2 = audioCtx.createOscillator();
            osc2.type = preset.type2;
            osc2.frequency.setValueAtTime(freq, now);
            osc2.detune.setValueAtTime(preset.detune, now);

            const osc2Gain = audioCtx.createGain();
            osc2Gain.gain.value = preset.subGain;

            osc1.connect(filter);
            osc2.connect(osc2Gain);
            osc2Gain.connect(filter);

            filter.connect(voiceGain);
            voiceGain.connect(masterGain);

            osc1.start(now);
            osc2.start(now);

            activeVoices.set(voiceId, {
                pitchIndex,
                stop() {
                    const t = audioCtx.currentTime;
                    voiceGain.gain.cancelScheduledValues(t);
                    voiceGain.gain.setValueAtTime(
                        Math.max(voiceGain.gain.value, 0.0001),
                        t,
                    );
                    voiceGain.gain.exponentialRampToValueAtTime(
                        0.0001,
                        t + preset.release,
                    );
                    osc1.stop(t + preset.release + 0.02);
                    osc2.stop(t + preset.release + 0.02);
                },
            });

            const btn = document.querySelector(
                `.pkey[data-idx="${pitchIndex}"]`,
            );
            if (btn) btn.classList.add("active");

            triggerVisualFeedback(pitchIndex);

            if (looperState === "recording" && !fromLooper) {
                recordedEvents.push({
                    type: "on",
                    idx: pitchIndex,
                    time: performance.now() - recordStartTime,
                });
            }
        } catch (_) {}
    }

    function stopNote(
        pitchIndex,
        voiceId = `key-${pitchIndex}`,
        fromLooper = false,
    ) {
        const voice = activeVoices.get(voiceId);
        if (!voice) return;
        voice.stop();
        activeVoices.delete(voiceId);

        const btn = document.querySelector(`.pkey[data-idx="${pitchIndex}"]`);
        if (btn) btn.classList.remove("active");

        if (looperState === "recording" && !fromLooper) {
            recordedEvents.push({
                type: "off",
                idx: pitchIndex,
                time: performance.now() - recordStartTime,
            });
        }
    }

    function playCardSound(pitchIndex) {
        const id = `oneshot-${pitchIndex}-${performance.now()}`;
        startNote(pitchIndex, id, true);
        setTimeout(() => stopNote(pitchIndex, id, true), 120);
    }

    // Oscilloscope Renderer
    const scopeCanvas = document.getElementById("synthScope");
    function startOscilloscope() {
        if (!scopeCanvas || !analyser) return;
        const sCtx = scopeCanvas.getContext("2d");
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function renderScope() {
            requestAnimationFrame(renderScope);
            if (!pianoDrawer || pianoDrawer.hidden) return;

            analyser.getByteTimeDomainData(dataArray);
            const w = scopeCanvas.width;
            const h = scopeCanvas.height;

            sCtx.clearRect(0, 0, w, h);
            sCtx.lineWidth = 1.5;
            sCtx.strokeStyle = "#b69aff";
            sCtx.beginPath();

            const sliceWidth = w / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * h) / 2;
                if (i === 0) sCtx.moveTo(x, y);
                else sCtx.lineTo(x, y);
                x += sliceWidth;
            }
            sCtx.lineTo(w, h / 2);
            sCtx.stroke();
        }
        renderScope();
    }

    // ============================================================================
    // TOAST, 3D CARD TILT & SPECULAR INNER GLOW
    // ============================================================================
    const toast = document.getElementById("toast");
    let toastTimer = null;

    function showToast(message) {
        if (!toast) return;
        const span = toast.querySelector("span");
        if (span && message) span.textContent = message;
        toast.classList.add("show");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            toast.classList.remove("show");
        }, 2200);
    }

    function copyCardUrl(card, idx = 0) {
        if (!card) return;
        const host = card.dataset.host;
        const url = host ? `https://${host}` : card.href;
        if (!url || !navigator.clipboard) return;

        navigator.clipboard
            .writeText(url)
            .then(() => {
                playCardSound(idx);
                showToast(`✓ Скопировано: ${host || url}`);
            })
            .catch(() => {});
    }

    const cards = Array.from(document.querySelectorAll(".tilt-card"));
    cards.forEach((card, idx) => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xc = rect.width / 2;
            const yc = rect.height / 2;
            const dx = (x - xc) / xc;
            const dy = (y - yc) / yc;

            card.style.setProperty("--mouse-x", `${x}px`);
            card.style.setProperty("--mouse-y", `${y}px`);
            card.style.transform = `perspective(1000px) rotateY(${dx * 5.5}deg) rotateX(${-dy * 5.5}deg) translateY(-3px)`;
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform =
                "perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0px)";
            card.style.transition =
                "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)";
        });

        card.addEventListener("mouseenter", () => {
            card.style.transition = "none";
        });

        const copyBtn = card.querySelector(".copy-btn");
        if (copyBtn) {
            copyBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                copyCardUrl(card, idx);
            });
        }
    });

    // ============================================================================
    // INTERACTIVE CANVAS PARTICLE NETWORK + SOUND RIPPLES
    // ============================================================================
    const canvas = document.getElementById("bgCanvas");
    if (canvas) {
        const ctx = canvas.getContext("2d");
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        window.addEventListener("resize", () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        const particles = [];
        const count = Math.min(Math.floor((width * height) / 17000), 65);

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.38,
                vy: (Math.random() - 0.5) * 0.38,
                radius: Math.random() * 1.4 + 0.5,
            });
        }

        function draw() {
            ctx.clearRect(0, 0, width, height);

            // Draw Sound Ripples from Synth
            for (let r = bgRipples.length - 1; r >= 0; r--) {
                const rip = bgRipples[r];
                rip.r += 4.5;
                rip.alpha *= 0.95;

                ctx.save();
                ctx.beginPath();
                ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
                ctx.strokeStyle = rip.color;
                ctx.globalAlpha = rip.alpha;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();

                if (rip.alpha < 0.02) bgRipples.splice(r, 1);
            }

            ctx.fillStyle = "rgba(182, 154, 255, 0.26)";
            ctx.lineWidth = 1;

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();

                // Connect particles to each other
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if (dist < 120) {
                        const alpha = (1 - dist / 120) * 0.055;
                        ctx.strokeStyle = `rgba(182, 154, 255, ${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }

                // Connect particles softly to user cursor
                if (isMouseActive) {
                    const mDist = Math.hypot(p.x - currentX, p.y - currentY);
                    if (mDist < 160) {
                        const mAlpha = (1 - mDist / 160) * 0.14;
                        ctx.strokeStyle = `rgba(182, 154, 255, ${mAlpha})`;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(currentX, currentY);
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================================
    // SYNTH CONTROLS, POINTER GLISSANDO & LOOPER
    // ============================================================================
    const copyrightTrigger = document.getElementById("copyrightTrigger");
    const pianoDrawer = document.getElementById("pianoDrawer");
    const pianoClose = document.getElementById("pianoClose");
    const pianoKeys = document.querySelectorAll(".pkey");

    const synthWaveBtn = document.getElementById("synthWaveBtn");
    const synthWaveLbl = document.getElementById("synthWaveLbl");
    const synthOctBtn = document.getElementById("synthOctBtn");
    const synthOctLbl = document.getElementById("synthOctLbl");
    const synthDelayBtn = document.getElementById("synthDelayBtn");
    const synthRecBtn = document.getElementById("synthRecBtn");
    const synthRecLbl = document.getElementById("synthRecLbl");
    const synthDot = document.getElementById("synthDot");

    function cyclePreset() {
        presetIndex = (presetIndex + 1) % PRESETS.length;
        if (synthWaveLbl) synthWaveLbl.textContent = PRESETS[presetIndex].name;
    }

    function setOctave(newOct) {
        octaveShift = Math.max(-1, Math.min(1, newOct));
        if (synthOctLbl)
            synthOctLbl.textContent =
                octaveShift > 0 ? `+${octaveShift}` : String(octaveShift);
        const names = NOTE_NAMES[octaveShift + 1];
        pianoKeys.forEach((btn, idx) => {
            const lbl = btn.querySelector(".note-lbl");
            if (lbl && names[idx]) lbl.textContent = names[idx];
        });
    }

    function toggleDelay() {
        delayEnabled = !delayEnabled;
        if (delaySend && audioCtx) {
            delaySend.gain.setTargetAtTime(
                delayEnabled ? 0.32 : 0,
                audioCtx.currentTime,
                0.04,
            );
        }
        if (synthDelayBtn)
            synthDelayBtn.classList.toggle("active", delayEnabled);
    }

    if (synthWaveBtn) synthWaveBtn.addEventListener("click", cyclePreset);
    if (synthOctBtn) {
        synthOctBtn.addEventListener("click", () => {
            setOctave(octaveShift >= 1 ? -1 : octaveShift + 1);
        });
    }
    if (synthDelayBtn) synthDelayBtn.addEventListener("click", toggleDelay);

    let looperState = "idle";
    let recordedEvents = [];
    let recordStartTime = 0;
    let loopDuration = 0;
    let loopTimeouts = [];
    let loopInterval = null;

    function clearLoopPlayback() {
        loopTimeouts.forEach((t) => clearTimeout(t));
        loopTimeouts = [];
        if (loopInterval) {
            clearInterval(loopInterval);
            loopInterval = null;
        }
        for (const [key] of activeVoices) {
            if (key.startsWith("loop-"))
                stopNote(activeVoices.get(key).pitchIndex, key, true);
        }
    }

    function playLoopIteration() {
        recordedEvents.forEach((ev) => {
            const t = setTimeout(() => {
                if (looperState !== "playing") return;
                const vId = `loop-${ev.idx}`;
                if (ev.type === "on") startNote(ev.idx, vId, true);
                else stopNote(ev.idx, vId, true);
            }, ev.time);
            loopTimeouts.push(t);
        });
    }

    if (synthRecBtn) {
        synthRecBtn.addEventListener("click", () => {
            if (looperState === "idle") {
                recordedEvents = [];
                recordStartTime = performance.now();
                looperState = "recording";
                synthRecBtn.classList.add("recording");
                if (synthDot) synthDot.classList.add("rec");
                if (synthRecLbl) synthRecLbl.textContent = "■ Stop";
            } else if (looperState === "recording") {
                loopDuration = Math.max(
                    400,
                    performance.now() - recordStartTime,
                );
                if (recordedEvents.length === 0) {
                    looperState = "idle";
                    synthRecBtn.classList.remove("recording");
                    if (synthDot) synthDot.classList.remove("rec");
                    if (synthRecLbl) synthRecLbl.textContent = "● Rec";
                    return;
                }
                looperState = "playing";
                synthRecBtn.classList.remove("recording");
                synthRecBtn.classList.add("playing");
                if (synthDot) synthDot.classList.remove("rec");
                if (synthRecLbl) synthRecLbl.textContent = "▶ Loop";

                playLoopIteration();
                loopInterval = setInterval(playLoopIteration, loopDuration);
            } else {
                clearLoopPlayback();
                looperState = "idle";
                synthRecBtn.classList.remove("playing", "recording");
                if (synthRecLbl) synthRecLbl.textContent = "● Rec";
            }
        });
    }

    let isPointerDown = false;
    let currentPointerIdx = null;

    pianoKeys.forEach((btn) => {
        const idx = Number(btn.dataset.idx);

        btn.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            isPointerDown = true;
            currentPointerIdx = idx;
            startNote(idx, `ptr-${idx}`);
        });

        btn.addEventListener("pointerenter", () => {
            if (isPointerDown && currentPointerIdx !== idx) {
                if (currentPointerIdx !== null) {
                    stopNote(currentPointerIdx, `ptr-${currentPointerIdx}`);
                }
                currentPointerIdx = idx;
                startNote(idx, `ptr-${idx}`);
            }
        });
    });

    window.addEventListener("pointerup", () => {
        if (isPointerDown) {
            isPointerDown = false;
            if (currentPointerIdx !== null) {
                stopNote(currentPointerIdx, `ptr-${currentPointerIdx}`);
                currentPointerIdx = null;
            }
        }
    });

    let clickCount = 0;
    let clickTimer = null;

    if (copyrightTrigger && pianoDrawer) {
        copyrightTrigger.addEventListener("click", () => {
            clickCount++;
            window.clearTimeout(clickTimer);
            if (clickCount >= 3) {
                pianoDrawer.hidden = false;
                initAudioEngine();
                clickCount = 0;
            } else {
                clickTimer = window.setTimeout(() => {
                    clickCount = 0;
                }, 500);
            }
        });
    }

    function closePiano() {
        if (!pianoDrawer) return;
        pianoDrawer.hidden = true;
        clearLoopPlayback();
        looperState = "idle";
        if (synthRecBtn) synthRecBtn.classList.remove("playing", "recording");
        if (synthDot) synthDot.classList.remove("rec");
        if (synthRecLbl) synthRecLbl.textContent = "● Rec";
        for (const [key, voice] of activeVoices) {
            stopNote(voice.pitchIndex, key, true);
        }
    }

    if (pianoClose) {
        pianoClose.addEventListener("click", closePiano);
    }

    // ============================================================================
    // KEYBOARD NAVIGATION & POLYPHONIC SYNTH KEYBOARD INPUT
    // ============================================================================
    let currentFocusIndex = -1;

    function getColumnsCount() {
        const w = window.innerWidth;
        if (w > 860) return 3;
        if (w > 560) return 2;
        return 1;
    }

    function focusCard(index) {
        if (!cards.length) return;
        currentFocusIndex = (index + cards.length) % cards.length;
        cards[currentFocusIndex].focus();
        playCardSound(currentFocusIndex);
    }

    cards.forEach((card, idx) => {
        card.addEventListener("focus", () => {
            currentFocusIndex = idx;
        });
    });

    const BY_NUMBER = [
        "https://blog.guilliman.ru",
        "https://radio.guilliman.ru",
        "https://input.guilliman.ru",
        "https://tartan.guilliman.ru",
        "https://walgen.guilliman.ru",
        "https://stl.guilliman.ru",
        "https://password.guilliman.ru",
        "https://keytag.guilliman.ru",
        "https://md.guilliman.ru",
    ];

    const PIANO_CODES = {
        KeyZ: 0,
        KeyX: 1,
        KeyC: 2,
        KeyV: 3,
        KeyB: 4,
        KeyN: 5,
        KeyM: 6,
        Comma: 7,
        Period: 8,
    };

    document.addEventListener("keydown", (e) => {
        if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;

        const isPianoOpen = pianoDrawer && !pianoDrawer.hidden;

        if (isPianoOpen) {
            if (e.code === "Escape") {
                e.preventDefault();
                closePiano();
                return;
            }
            if (e.code === "BracketLeft") {
                e.preventDefault();
                setOctave(octaveShift - 1);
                return;
            }
            if (e.code === "BracketRight") {
                e.preventDefault();
                setOctave(octaveShift + 1);
                return;
            }
            const idx = PIANO_CODES[e.code];
            if (typeof idx === "number") {
                e.preventDefault();
                if (!e.repeat) {
                    startNote(idx, `kbd-${idx}`);
                }
                return;
            }
        }

        const key = e.key;

        if (/^[1-9]$/.test(key)) {
            const idx = Number(key) - 1;
            const url = BY_NUMBER[idx];
            if (url) {
                e.preventDefault();
                window.open(url, "_blank", "noopener,noreferrer");
            }
            return;
        }

        if (!isPianoOpen && e.code === "KeyC" && currentFocusIndex >= 0) {
            e.preventDefault();
            copyCardUrl(cards[currentFocusIndex], currentFocusIndex);
            return;
        }

        const cols = getColumnsCount();
        if (key === "ArrowRight") {
            e.preventDefault();
            focusCard(currentFocusIndex < 0 ? 0 : currentFocusIndex + 1);
        } else if (key === "ArrowLeft") {
            e.preventDefault();
            focusCard(currentFocusIndex < 0 ? 0 : currentFocusIndex - 1);
        } else if (key === "ArrowDown") {
            e.preventDefault();
            focusCard(currentFocusIndex < 0 ? 0 : currentFocusIndex + cols);
        } else if (key === "ArrowUp") {
            e.preventDefault();
            focusCard(currentFocusIndex < 0 ? 0 : currentFocusIndex - cols);
        }
    });

    document.addEventListener("keyup", (e) => {
        if (!pianoDrawer || pianoDrawer.hidden) return;
        const idx = PIANO_CODES[e.code];
        if (typeof idx === "number") {
            stopNote(idx, `kbd-${idx}`);
        }
    });
})();
