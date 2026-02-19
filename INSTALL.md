
# 🎬 SceneEditor Ultra: Pro Installation Guide

Da du eine **RTX 5090** und ein vollständiges Dev-Setup auf `Z:\AI\` hast, ist dies der schnellste Weg zur lauffähigen App.

## 1. Frontend-Setup (Vite)
Öffne dein Terminal (CMD oder PowerShell) im Projektordner:

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Den Dev-Server starten
npm run dev
```
Die App ist nun unter `http://localhost:5173` erreichbar.

## 2. Backend-Bridge (KI) - CORS FIX

Damit die Statusanzeigen grün werden, müssen die Backends Anfragen vom Browser erlauben.

### Ollama (Llama 3) - WICHTIG
Ollama blockiert standardmäßig Browser-Anfragen. Du musst die Umgebungsvariable `OLLAMA_ORIGINS` setzen:

**Windows (PowerShell):**
```powershell
$env:OLLAMA_ORIGINS="*"; ollama serve
```
*Oder permanent in den Windows-Systemeinstellungen (Umgebungsvariablen) hinzufügen.*

### ComfyUI (Rendering)
Starte ComfyUI unbedingt mit dem CORS-Flag:
```bash
cd Z:\AI\projects\ComfyUI_dev
python main.py --listen --enable-cors-header
```

## 3. Ordner-Kopplung
1. Starte die App im Chrome.
2. Gehe zu **Configs** (Settings).
3. Klicke auf **"Authorize Root Folder"**.
4. Wähle `Z:\AI\projects\`, damit der Auto-Save direkt dorthin schreiben kann.

## 4. Hardware-Check
Die Statusleiste unten sollte nun **"RTX 5090 Ready"** und **"Comfy Bridge: Online"** anzeigen.
Wenn ComfyUI im AI LAB Tab geht, aber oben rot bleibt, prüfe ob du `127.0.0.1` statt `localhost` nutzt.
