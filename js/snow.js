const emojis = ["🍌", "💩", "🤡", "🍆"];

function createBanana() {
  const banana = document.createElement("div");
  banana.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  banana.className = "banana";

  // Randomize initial position and styles
  const startX = Math.random() * (window.innerWidth - 50);
  banana.style.left = `${startX}px`;
  banana.style.top = `-50px`;
  banana.style.fontSize = `${Math.random() * 20 + 20}px`;

  // Generate random sway
  const swayAmount = Math.random() * 200 - 100; // Between -100px and 100px
  banana.style.setProperty("--sway", `${swayAmount}px`);

  // Randomize animation duration
  const duration = Math.random() * 5 + 5; // Between 5 and 10 seconds
  banana.style.animationDuration = `${duration}s`;

  // Apply random brightness
  const brightness = Math.random() * 0.5 + 0.75; // Between 0.75 and 1.25
  banana.style.filter = `brightness(${brightness})`;

  // Add the banana to the document
  document.body.appendChild(banana);

  // Remove the banana after animation
  banana.addEventListener("animationend", () => {
    banana.remove();
  });
}

setInterval(createBanana, 200);
