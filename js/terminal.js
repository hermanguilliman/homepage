void (function () {
    const output = document.getElementById("output");

    const SERVICES = [
        {
            name: "guilliman.ru",
            desc: "портал / корневой хаб",
            url: "https://guilliman.ru",
        },
        {
            name: "blog.guilliman.ru",
            desc: "блог полезных записей",
            url: "https://blog.guilliman.ru",
        },
        {
            name: "input.guilliman.ru",
            desc: "тестирование ввода (мышь, клавиатура, геймпад)",
            url: "https://input.guilliman.ru",
        },
        {
            name: "tartan.guilliman.ru",
            desc: "генерация тартана",
            url: "https://tartan.guilliman.ru",
        },
        {
            name: "stl.guilliman.ru",
            desc: "просмотр STL моделей",
            url: "https://stl.guilliman.ru",
        },
        {
            name: "password.guilliman.ru",
            desc: "генератор паролей",
            url: "https://password.guilliman.ru",
        },
        {
            name: "md.guilliman.ru",
            desc: "HTML → Markdown конвертер",
            url: "https://md.guilliman.ru",
        },
    ];

    var isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const CONNECT_LINES = [
        "Подключение к guilliman.ru...",
        "Создание защищенного канала...",
        "Соединение установлено.",
    ];

    function sleep(ms) {
        return new Promise(function (r) {
            setTimeout(r, ms);
        });
    }

    var buffer = "";
    var tagline = "Береги голову!";
    var TYPE_SPEED = 0.05;

    function write(text) {
        buffer += text;
        output.innerHTML = buffer;
        output.scrollTop = output.scrollHeight;
    }

    function writeln(text) {
        write(text + "\n");
    }

    async function typewrite(text, speed) {
        speed = (speed || 10) * TYPE_SPEED;
        for (var i = 0; i < text.length; i++) {
            buffer += text[i];
            output.innerHTML = buffer;
            output.scrollTop = output.scrollHeight;
            await sleep(speed + Math.random() * 8);
        }
    }

    async function connect() {
        for (var i = 0; i < CONNECT_LINES.length; i++) {
            var line = CONNECT_LINES[i];
            if (i < CONNECT_LINES.length - 1) {
                await typewrite(line, 6);
                var spaces = 52 - line.length;
                if (spaces > 0) write(" ".repeat(spaces));
                await sleep(60);
                write('<span class="ok">[  \u2713  ]</span>\n');
                await sleep(120);
            } else {
                await typewrite(line, 8);
                writeln("");
                await sleep(150);
            }
        }
        await sleep(100);
    }

    function centerText(text, width) {
        var p = Math.max(0, Math.floor((width - text.length) / 2));
        return (
            " ".repeat(p) +
            text +
            " ".repeat(Math.max(0, width - p - text.length))
        );
    }

    async function showHeader() {
        var W = 44;
        var H = "\u2550";
        var V = "\u2551";

        writeln("");
        write("  ");
        await typewrite("\u2554" + H.repeat(W) + "\u2557", 2);
        writeln("");

        var headerLines = [
            centerText("GUILLIMAN TERMINAL v3.1.4", W),
            centerText("", W),
            centerText(tagline, W),
        ];

        for (var i = 0; i < headerLines.length; i++) {
            write("  " + V);
            await typewrite(headerLines[i], 4);
            writeln(V);
        }

        write("  ");
        await typewrite("\u255a" + H.repeat(W) + "\u255d", 2);
        writeln("");
    }

    async function showMenu() {
        await sleep(100);
        writeln("");
        write("  ");
        await typewrite("\u2500".repeat(48), 2);
        writeln("");
        writeln("");

        for (var i = 0; i < SERVICES.length; i++) {
            var s = SERVICES[i];
            var num = i + 1;
            var line = "   [" + num + "]  " + s.name + "  \u2022  " + s.desc;
            write("  ");
            await typewrite(line, 5);
            writeln("");
        }

        writeln("");
        write("  ");
        await typewrite("\u2500".repeat(48), 2);
        writeln("");
        writeln("");

        await typewrite(
            "  \u041d\u0430\u0436\u043c\u0438 [1\u20137] \u0434\u043b\u044f \u043f\u0435\u0440\u0435\u0445\u043e\u0434\u0430",
            8,
        );
        writeln("");
        writeln("");
    }

    async function init() {
        await sleep(100);
        await loadTagline();
        if (isMobile) {
            renderMobileHub();
            return;
        }
        await connect();
        await showHeader();
        await showMenu();

        await typewrite("root@guilliman:~$ ", 8);
        write('<span class="cursor">\u258A</span>');
        makeLinksClickable();
    }

    function makeLinksClickable() {
        for (var i = 0; i < SERVICES.length; i++) {
            var s = SERVICES[i];
            var searchStr = "[" + (i + 1) + "]  " + s.name;
            var linkHtml =
                "[" +
                (i + 1) +
                ']  <a class="svc-link" href="' +
                s.url +
                '" data-index="' +
                i +
                '">' +
                s.name +
                "</a>";
            buffer = buffer.replace(searchStr, linkHtml);
        }
        output.innerHTML = buffer;
    }

    function escapeHtml(s) {
        return s
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function renderMobileHub() {
        var html = '<div class="mobile-hub">';
        html += '<div class="mobile-header">';
        html += '<div class="mobile-title">GUILLIMAN</div>';
        html += '<div class="mobile-tagline">' + escapeHtml(tagline) + "</div>";
        html += "</div>";
        html += '<div class="mobile-services">';
        for (var i = 0; i < SERVICES.length; i++) {
            var s = SERVICES[i];
            html +=
                '<a href="' +
                s.url +
                '" class="mobile-card">' +
                '<div class="mobile-card-name">' +
                escapeHtml(s.name) +
                "</div>" +
                '<div class="mobile-card-desc">' +
                escapeHtml(s.desc) +
                "</div>" +
                "</a>";
        }
        html += "</div>";
        html += '<div class="mobile-footer">\u043d\u0430\u0436\u043c\u0438 \u0434\u043b\u044f \u043f\u0435\u0440\u0435\u0445\u043e\u0434\u0430</div>';
        html += "</div>";
        output.innerHTML = html;
    }

    function triggerScreensaver() {
        if (document.body.classList.contains("saver-mode")) return;
        document.body.classList.add("saver-mode");
        if (typeof setEmojiSpawnRate === "function") {
            setEmojiSpawnRate(80);
        }
        playCollapseSound();
    }

    function playCollapseSound() {
        try {
            var ctx = new (window.AudioContext || window.webkitAudioContext)();
            var t = ctx.currentTime;

            // Static crackle — filtered noise burst
            var bufSize = ctx.sampleRate * 0.15;
            var noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
            var data = noiseBuf.getChannelData(0);
            for (var i = 0; i < bufSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
            }
            var noise = ctx.createBufferSource();
            noise.buffer = noiseBuf;
            var noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.06, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            var hp = ctx.createBiquadFilter();
            hp.type = "highpass";
            hp.frequency.value = 2000;
            noise.connect(hp);
            hp.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            noise.start(t);
            noise.stop(t + 0.15);

            // Low thump — sine, 80→25Hz
            var thump = ctx.createOscillator();
            thump.type = "sine";
            thump.frequency.setValueAtTime(80, t + 0.02);
            thump.frequency.exponentialRampToValueAtTime(25, t + 0.35);
            var thumpGain = ctx.createGain();
            thumpGain.gain.setValueAtTime(0.2, t + 0.02);
            thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            thump.connect(thumpGain);
            thumpGain.connect(ctx.destination);
            thump.start(t + 0.02);
            thump.stop(t + 0.35);

            // Descending fizz — sawtooth, 1000→40Hz
            var fizz = ctx.createOscillator();
            fizz.type = "sawtooth";
            fizz.frequency.setValueAtTime(1000, t + 0.02);
            fizz.frequency.exponentialRampToValueAtTime(40, t + 0.3);
            var fizzGain = ctx.createGain();
            fizzGain.gain.setValueAtTime(0.08, t + 0.02);
            fizzGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            fizz.connect(fizzGain);
            fizzGain.connect(ctx.destination);
            fizz.start(t + 0.02);
            fizz.stop(t + 0.3);
        } catch (_) {}
    }

    function playPowerOnSound() {
        try {
            var ctx = new (window.AudioContext || window.webkitAudioContext)();
            var t = ctx.currentTime;

            // Low power thump — sine burst 80→40Hz
            var thump = ctx.createOscillator();
            thump.type = "sine";
            thump.frequency.setValueAtTime(80, t);
            thump.frequency.exponentialRampToValueAtTime(40, t + 0.15);
            var thumpGain = ctx.createGain();
            thumpGain.gain.setValueAtTime(0.001, t);
            thumpGain.gain.linearRampToValueAtTime(0.15, t + 0.02);
            thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            thump.connect(thumpGain);
            thumpGain.connect(ctx.destination);
            thump.start(t);
            thump.stop(t + 0.25);

            // Deep mains hum — sine 50Hz, fades slowly
            var hum = ctx.createOscillator();
            hum.type = "sine";
            hum.frequency.setValueAtTime(50, t);
            var humGain = ctx.createGain();
            humGain.gain.setValueAtTime(0.001, t + 0.05);
            humGain.gain.linearRampToValueAtTime(0.04, t + 0.2);
            humGain.gain.linearRampToValueAtTime(0.02, t + 0.6);
            humGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
            hum.connect(humGain);
            humGain.connect(ctx.destination);
            hum.start(t + 0.05);
            hum.stop(t + 1.0);
        } catch (_) {}
    }

    async function loadTagline() {
        try {
            var res = await fetch("/phrases.json");
            var phrases = await res.json();
            tagline = phrases[Math.floor(Math.random() * phrases.length)];
        } catch (_) {}
    }

    init();

    output.addEventListener("click", function (e) {
        var link = e.target.closest(".svc-link");
        if (link) {
            e.preventDefault();
            var idx = parseInt(link.getAttribute("data-index"), 10);
            if (idx === 0) {
                triggerScreensaver();
            } else {
                window.location.href = link.getAttribute("href");
            }
        }
    });

    function exitScreensaver() {
        if (!document.body.classList.contains("saver-mode")) return;
        document.body.classList.remove("saver-mode");
        if (typeof setEmojiSpawnRate === "function") {
            setEmojiSpawnRate(300);
        }
        var el = document.querySelectorAll("#screen > .emoji");
        for (var i = 0; i < el.length; i++) el[i].remove();
        var term = document.getElementById("terminal");
        term.classList.remove("power-on");
        void term.offsetWidth;
        term.classList.add("power-on");
        playPowerOnSound();
    }

    document.addEventListener("keydown", function (e) {
        if (document.body.classList.contains("saver-mode")) {
            exitScreensaver();
            return;
        }
        var num = parseInt(e.key, 10);
        if (num >= 1 && num <= SERVICES.length) {
            if (num === 1) {
                triggerScreensaver();
            } else {
                window.location.href = SERVICES[num - 1].url;
            }
        }
    });

    document.addEventListener("click", function (e) {
        if (
            document.body.classList.contains("saver-mode") &&
            !e.target.closest(".svc-link")
        ) {
            exitScreensaver();
        }
    });
})();
