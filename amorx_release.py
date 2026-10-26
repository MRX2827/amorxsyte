#!/usr/bin/env python3
"""
Делает update.json из готовых APK. Запуск:
  python3 amorx_release.py ПАПКА_С_APK ["Строка 1\nСтрока 2"] [--mandatory]
Имена APK: AmorX-5.5.500.1305-githubRelease-arm64-v8a.apk (версия берётся из имени).
Результат: update.json рядом со скриптом. Затем:
  1) создайте релиз с тегом v<версия> и прикрепите эти APK
  2) загрузите update.json в корень репозитория (commit)
"""
import hashlib, json, re, sys
from pathlib import Path

REPO = "mrx2827/amorxsyte"
args = [a for a in sys.argv[1:] if not a.startswith("--")]
if not args:
    sys.exit(__doc__)
folder = Path(args[0]).expanduser()
notes = args[1].replace("\\n", "\n") if len(args) > 1 else "Улучшения и исправления"
apks = sorted(folder.glob("*.apk"))
if not apks:
    sys.exit("В папке нет .apk")
m = re.search(r"(\d+\.\d+\.\d+\.\d+)", apks[0].name)
if not m:
    sys.exit("Не нашёл версию вида 5.5.500.1305 в имени файла")
ver = m.group(1)
out = {"version": ver, "mandatory": "--mandatory" in sys.argv, "notes": notes, "apk": {}}
for p in apks:
    key = next((k for k in ("arm64-v8a", "armeabi-v7a", "x86_64", "x86") if k in p.name), "universal")
    out["apk"][key] = {
        "url": f"https://github.com/{REPO}/releases/download/v{ver}/{p.name}",
        "size": p.stat().st_size,
        "sha256": hashlib.sha256(p.read_bytes()).hexdigest(),
    }
dest = Path(__file__).with_name("update.json")
dest.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("Версия:", ver, "| сборки:", ", ".join(out["apk"]))
print("Записано:", dest)
print(f"Тег релиза: v{ver}")
