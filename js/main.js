(() => {
  "use strict";

  const items = Array.from(document.querySelectorAll(".item"));
  if (!items.length) return;

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  let current = -1;
  const focusAt = (index) => {
    current = (index + items.length) % items.length;
    items[current].focus();
  };

  const launch = (index) => {
    const item = items[index];
    if (item) window.open(item.href, "_blank", "noopener,noreferrer");
  };

  // Физические клавиши: сочетания работают независимо от раскладки.
  const BY_CODE = {
    KeyB: 0,
    KeyM: 1,
    KeyI: 2,
    KeyT: 3,
    KeyW: 4,
    KeyS: 5,
    KeyP: 6,
    KeyK: 7
  };

  const toast = document.getElementById("toast");
  let toastHide = null;
  let toastClear = null;

  // Плашка позиционируется fixed и лежит вне потока документа,
  // поэтому копирайт не подменяется, а вёрстка не сдвигается.
  function flash(message, isSuccess = true) {
    if (!toast) return;
    window.clearTimeout(toastHide);
    window.clearTimeout(toastClear);

    toast.textContent = message;
    toast.classList.toggle("ok", isSuccess);
    toast.classList.toggle("err", !isSuccess);
    toast.classList.add("show");

    toastHide = window.setTimeout(() => {
      toast.classList.remove("show");
      toastClear = window.setTimeout(() => {
        toast.textContent = "";
        toast.classList.remove("ok", "err");
      }, 220);
    }, 1600);
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.inset = "0 auto auto 0";
    textarea.style.width = "1px";
    textarea.style.height = "1px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (_) {
      copied = false;
    }
    textarea.remove();
    return copied;
  }

  function copyHost(item) {
    let host;
    try {
      host = new URL(item.href).host;
    } catch (_) {
      host = item.href;
    }

    const success = () => flash(`✓ ${host} скопирован`, true);
    const failure = () => flash("Не удалось скопировать адрес", false);

    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(host).then(success).catch(() => {
        fallbackCopy(host) ? success() : failure();
      });
    } else {
      fallbackCopy(host) ? success() : failure();
    }
  }

  function isEditableTarget(target) {
    return target instanceof Element && Boolean(
      target.closest("input, textarea, select, [contenteditable='true'], [role='textbox']")
    );
  }

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || isEditableTarget(event.target)) return;

    const key = event.key;
    const code = event.code;
    const hasCommand = event.ctrlKey || event.metaKey;

    // Ctrl/Cmd+C копирует домен текущей строки, если текст не выделен.
    if (hasCommand && !event.shiftKey && !event.altKey && code === "KeyC") {
      const selection = window.getSelection ? String(window.getSelection()) : "";
      if (selection) return;

      const focusedIndex = items.indexOf(document.activeElement);
      const targetIndex = focusedIndex >= 0 ? focusedIndex : current;
      if (targetIndex >= 0) {
        event.preventDefault();
        copyHost(items[targetIndex]);
      }
      return;
    }

    if (hasCommand || event.altKey) return;

    if (key === "ArrowDown") {
      event.preventDefault();
      focusAt(current < 0 ? 0 : current + 1);
      return;
    }

    if (key === "ArrowUp") {
      event.preventDefault();
      focusAt(current < 0 ? items.length - 1 : current - 1);
      return;
    }

    if (key === "Escape") {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      current = -1;
      return;
    }

    // Не открываем несколько вкладок из-за удерживания горячей клавиши.
    if (event.repeat) return;

    if (/^[1-8]$/.test(key)) {
      const index = Number(key) - 1;
      if (index < items.length) {
        event.preventDefault();
        launch(index);
      }
      return;
    }

    const index = BY_CODE[code];
    if (typeof index === "number") {
      event.preventDefault();
      launch(index);
    }
  });

  // Синхронизируем выбранную строку и при обычной табуляции.
  items.forEach((item, index) => {
    item.addEventListener("focus", () => { current = index; });
  });
})();
