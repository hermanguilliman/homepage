const emojis = ["🍌", "💩", "🤡", "🍆"];

function createEmoji() {
  const emoji = document.createElement("div");
  emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  emoji.className = "emoji";

  // Randomize initial position and styles
  const startX = Math.random() * (window.innerWidth - 50);
  emoji.style.left = `${startX}px`;
  emoji.style.top = `-50px`;
  emoji.style.fontSize = `${Math.random() * 20 + 20}px`;

  // Generate random sway
  const swayAmount = Math.random() * 200 - 100; // Between -100px and 100px
  emoji.style.setProperty("--sway", `${swayAmount}px`);

  // Randomize animation duration
  const duration = Math.random() * 5 + 5; // Between 5 and 10 seconds
  emoji.style.animationDuration = `${duration}s`;

  // Apply random brightness
  const brightness = Math.random() * 0.5 + 0.75; // Between 0.75 and 1.25
  emoji.style.filter = `brightness(${brightness})`;

  // Add the banana to the document
  document.body.appendChild(emoji);

  // Remove the banana after animation
  emoji.addEventListener("animationend", () => {
    emoji.remove();
  });
}

setInterval(createEmoji, 200);
