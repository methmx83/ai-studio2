
# LS SceneEditor Ultra 🎬 

**The Zero-Installation Native Desktop Suite**

LS SceneEditor Ultra ist ein professioneller Video-Editor, der die Geschwindigkeit einer Web-App mit der Power lokaler Dateisysteme vereint. Dank der modernsten Browser-Technologie benötigt er **keinen lokalen Server** (Python/Node), um direkt auf deine Festplatte zu schreiben. 

Er ist das Kontrollzentrum für dein lokales KI-Ökosystem (RTX 5090 optimiert).

---

## ⚡️ Key Features

*   **Direct Disk Link:** Kopple die App direkt mit deiner Festplatte. Kein Up- und Downloaden von Projektdateien.
*   **Auto-Save Engine:** Jede Änderung wird sofort im Hintergrund in deine `.json` Projektdatei geschrieben.
*   **Neural Bridge:** Native Integration von **ComfyUI** und **Ollama** für 100% lokalen KI-Workflow.
*   **Dope Sheet Animation:** Präzises Keyframing mit Bezier-Kurven.
*   **Inline Renaming:** Verwalte Assets professionell direkt in der Library.

---

## 🚀 Lokale Installation & Setup (Full Guide)

Um den SceneEditor Ultra mit voller KI-Power zu nutzen, folge diesen Schritten für dein lokales Setup:

### 1. Hardware & Browser
*   **GPU:** Empfohlen NVIDIA RTX (8GB+ VRAM für SD, 16GB+ für Video).
*   **Browser:** Erfordert **Chrome** oder **Microsoft Edge** (für die File System Access API).

### 2. Projekt-Ordner anlegen
Erstelle einen Hauptordner auf deiner Festplatte, in dem alle Projekte landen:
`C:/AI/Sceneeditor_ultra/` (oder ein Pfad deiner Wahl).

### 3. KI-Backend 1: Ollama (Texte & Analyse)
*   Lade Ollama von [ollama.com](https://ollama.com) herunter und installiere es.
*   Öffne dein Terminal und lade das Llama3-Modell:
    ```bash
    ollama run llama3
    ```
*   Der SceneEditor verbindet sich automatisch über Port `11434`.

### 4. KI-Backend 2: ComfyUI (Bild & Video)
*   Installiere ComfyUI (z.B. via [ComfyUI-Manager](https://github.com/ltdrdata/ComfyUI-Manager)).
*   **WICHTIG:** Starte ComfyUI mit dem API-Enable Flag, damit der Editor darauf zugreifen kann:
    ```bash
    python main.py --listen --enable-cors-header
    ```
*   Der Editor erwartet ComfyUI auf Port `8188`.

### 5. App starten
1. Öffne die `index.html` in deinem Chrome/Edge Browser.
2. Gehe zu **Settings**.
3. Klicke auf **"Authorize Root Folder"** und wähle deinen unter Schritt 2 erstellten Ordner aus.
4. Fertig! Die App hat nun Schreibrechte und speichert alles lokal.

---

## 🛠 Tech Stack
*   **Frontend:** React 19 + Zustand (State Management).
*   **Storage:** File System Access API (W3C Standard).
*   **KI:** Gemini 3 Flash (Analyse), Ollama/Llama3 (Prompting), ComfyUI (Rendering).
*   **Export:** FFmpeg Command Generator für NVENC-Beschleunigung.

*Entwickelt für die nächste Generation des digitalen Storytellings.*
