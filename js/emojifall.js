const emojis = ["🍌", "💩", "🤡", "🍆"];
var isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
var MAX_EMOJIS = isMobile ? 15 : 50;
var SPAWN_RATE = isMobile ? 500 : 300;
var emojiTimer = setInterval(createEmoji, SPAWN_RATE);

function createEmoji() {
  var screen = document.getElementById('screen');
  if (screen.childElementCount > MAX_EMOJIS) return;

  var emoji = document.createElement("div");
  emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  emoji.className = "emoji";

  var startX = Math.random() * (window.innerWidth - 50);
  emoji.style.left = startX + "px";
  emoji.style.top = "-50px";
  emoji.style.fontSize = (Math.random() * 20 + 20) + "px";

  var swayAmount = Math.random() * 200 - 100;
  emoji.style.setProperty("--sway", swayAmount + "px");

  var duration = Math.random() * 5 + 5;
  emoji.style.animationDuration = duration + "s";

  var brightness = Math.random() * 0.5 + 0.5;
  emoji.style.filter = "brightness(" + brightness + ")";

  screen.appendChild(emoji);

  emoji.addEventListener("animationend", function () {
    emoji.remove();
  });
}

function setEmojiSpawnRate(ms) {
  clearInterval(emojiTimer);
  if (ms > 0) {
    emojiTimer = setInterval(createEmoji, ms);
  }
}
