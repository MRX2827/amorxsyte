const find = id => document.getElementById(id);
const repo = "https://github.com/MRX2827/amorxsyte";
const formatSize = bytes => Number(bytes) > 0 ? (bytes / 1048576).toFixed(1).replace(".", ",") + " МБ" : "";
const label = { arm64: "arm64", arm: "arm", x86: "x86", x86_64: "x86-64", universal: "Универсальная APK" };

async function readRelease(file) {
  const response = await fetch(file, { cache: "no-store" });
  if (!response.ok) throw new Error("Выпуск недоступен");
  return response.json();
}

function releaseURL(value, version, suffix) {
  const address = new URL(value);
  const prefix = "/mrx2827/amorxsyte/releases/download/";
  const path = address.pathname.toLowerCase();
  if (address.origin !== "https://github.com" || address.username || address.password ||
      ![version, "v" + version].some(tag => path.startsWith(prefix + tag + "/")) ||
      !path.endsWith(suffix)) throw new Error("Неизвестная сборка");
  return address.href;
}

readRelease("update.json").then(release => {
  const apk = release.apk || {};
  const entries = Object.entries(apk).map(([abi, artifact]) => {
    const descriptor = typeof artifact === "string" ? {url: artifact} : artifact;
    return [abi, {url: releaseURL(descriptor.url, release.version, ".apk"), size: descriptor.size}];
  });
  const variants = Object.fromEntries(entries);
  const main = variants["arm64-v8a"] || variants.universal || entries[0]?.[1];
  if (main) {
    find("dl").href = main.url;
    find("sub").textContent = [formatSize(main.size), "Android 8.0 и новее"].filter(Boolean).join(" · ");
  }
  find("ver").textContent = release.version;
  const notes = String(release.notes || "").split("\n").map(note => note.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
  find("notes").replaceChildren(...(notes.length ? notes : ["Улучшения и исправления."]).map(note => {
    const item = document.createElement("li");
    item.textContent = note;
    return item;
  }));
  find("builds").replaceChildren(...entries.map(([abi, artifact]) => {
    const link = document.createElement("a");
    link.className = "chip";
    link.href = artifact.url;
    link.textContent = label[abi] || abi;
    return link;
  }));
}).catch(() => {
  find("ver").textContent = "Список изменений доступен в GitHub.";
  const link = document.createElement("a");
  link.href = repo + "/releases/latest";
  link.textContent = "Последний релиз";
  const item = document.createElement("li");
  item.append(link);
  find("notes").replaceChildren(item);
});

readRelease("windows-update.json").then(release => {
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(release.version)) return;
  find("dlWin").href = releaseURL(release.exe.url, release.version, "-windows-x64.exe");
  find("subWin").textContent = [formatSize(release.exe.size), "Windows 10/11 · x64", release.version].filter(Boolean).join(" · ");
}).catch(() => {});

const audio = find("preview");
const play = find("play");
const seek = find("seek");
const demo = find("demo");
const heart = find("heart");
const wave = find("wave");
const bars = Array.from({length: 34}, (_, index) => {
  const bar = document.createElement("i");
  bar.style.setProperty("--h", (25 + (index * 19 + index * index * 7) % 75) + "%");
  bar.style.setProperty("--speed", (.3 + index % 5 * .12) + "s");
  bar.style.setProperty("--delay", (-index * .047) + "s");
  wave.append(bar);
  return bar;
});

function timeText(seconds) {
  const whole = Math.floor(seconds);
  return Math.floor(whole / 60) + ":" + String(whole % 60).padStart(2, "0");
}

function render() {
  const length = Number.isFinite(audio.duration) ? audio.duration : 12;
  const time = audio.currentTime || 0;
  seek.max = length;
  seek.value = time;
  find("elapsed").textContent = timeText(time);
  find("duration").textContent = timeText(length);
  bars.forEach((bar, index) => bar.classList.toggle("active", index / bars.length < time / length));
  const playing = !audio.paused;
  demo.classList.toggle("playing", playing);
  play.firstElementChild.textContent = playing ? "Ⅱ" : "▶";
  play.setAttribute("aria-label", playing ? "Приостановить пример" : "Воспроизвести пример");
}

play.addEventListener("click", async () => {
  try {
    find("player-error").hidden = true;
    if (audio.paused) await audio.play();
    else audio.pause();
  } catch {
    find("player-error").hidden = false;
  }
  render();
});
seek.addEventListener("input", () => { audio.currentTime = Number(seek.value); render(); });
["play", "pause", "timeupdate", "loadedmetadata", "ended"].forEach(event => audio.addEventListener(event, render));
heart.addEventListener("click", () => {
  const liked = heart.getAttribute("aria-pressed") !== "true";
  heart.setAttribute("aria-pressed", String(liked));
  heart.setAttribute("aria-label", liked ? "Убрать пример из избранного" : "Добавить пример в избранное");
  heart.textContent = liked ? "♥" : "♡";
  heart.classList.remove("pop");
  requestAnimationFrame(() => heart.classList.add("pop"));
});

if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("motion");
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("shown");
    observer.unobserve(entry.target);
  }), {threshold: .14});
  document.querySelectorAll(".reveal").forEach((card, index) => {
    card.style.setProperty("--delay", index * .07 + "s");
    observer.observe(card);
  });
}

const lightbox = find("lightbox");
if (typeof lightbox?.showModal === "function") {
  const screenshot = lightbox.querySelector("img");
  find("close-lightbox").addEventListener("click", () => lightbox.close());
  document.querySelectorAll(".screenshot-link").forEach(link => {
    link.addEventListener("click", event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      screenshot.src = link.href;
      screenshot.alt = link.querySelector("img").alt;
      lightbox.showModal();
    });
  });
  lightbox.addEventListener("click", event => {
    if (event.target === lightbox) lightbox.close();
  });
}
