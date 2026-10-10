(() => {
  "use strict";

  // Year & Time
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const timeDisplay = document.getElementById("timeDisplay");
  function updateTime() {
    if (!timeDisplay) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const mins = String(now.getMinutes()).padStart(2, "0");
    timeDisplay.textContent = `${hours}:${mins}`;
  }
  updateTime();
  setInterval(updateTime, 10000);

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

  // 3D Card Tilt Effect
  const cards = document.querySelectorAll(".tilt-card");
  cards.forEach(card => {
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

  // Keyboard Shortcuts (1-9)
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
    }
  });
})();
