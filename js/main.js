(() => {
  "use strict";

  // Year & Time
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const timeDisplay = document.getElementById("timeDisplay");
  function updateTime() {
    if (!timeDisplay) return;
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateStr = now.toLocaleDateString('ru-RU', options);
    const formatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    timeDisplay.textContent = formatted;
  }
  updateTime();
  setInterval(updateTime, 60000);

  // Spotlight follower
  const spotlight = document.getElementById("spotlight");
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (spotlight) {
      spotlight.style.opacity = "1";
    }
  });

  window.addEventListener("mouseleave", () => {
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

  // Web Audio API Sound Generator (Harmonic Pentatonic Scale)
  let audioCtx = null;
  function playCardSound(pitchIndex) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const frequencies = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98];
      const freq = frequencies[pitchIndex % frequencies.length];

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.035, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.16);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } catch (_) {}
  }

  // 3D Card Tilt Effect
  const cards = Array.from(document.querySelectorAll(".tilt-card"));
  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xc = rect.width / 2;
      const yc = rect.height / 2;
      const dx = (x - xc) / xc;
      const dy = (y - yc) / yc;

      card.style.transform = `perspective(1000px) rotateY(${dx * 6}deg) rotateX(${-dy * 6}deg) translateY(-3px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0px)";
      card.style.transition = "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)";
    });

    card.addEventListener("mouseenter", () => {
      card.style.transition = "none";
    });
  });

  // Canvas Particle / Node Network Background
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
    const count = Math.min(Math.floor((width * height) / 18000), 60);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 0.5
      });
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = "rgba(182, 154, 255, 0.25)";
      ctx.strokeStyle = "rgba(182, 154, 255, 0.04)";
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

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }
    draw();
  }

  // 2D Grid Keyboard Navigation & Shortcuts (with Sound)
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
    "https://soma.guilliman.ru",
    "https://input.guilliman.ru",
    "https://tartan.guilliman.ru",
    "https://walgen.guilliman.ru",
    "https://stl.guilliman.ru",
    "https://password.guilliman.ru",
    "https://keytag.guilliman.ru",
    "https://md.guilliman.ru"
  ];

  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
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
})();
