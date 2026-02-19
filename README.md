
# LS SceneEditor Ultra 🎬 

**The Zero-Installation Native Desktop Suite**

LS SceneEditor Ultra ist ein professioneller Video-Editor, der die Geschwindigkeit einer Web-App mit der Power lokaler Dateisysteme vereint. Dank der modernsten Browser-Technologie benötigt er **keinen lokalen Server** (Python/Node), um direkt auf deine Festplatte zu schreiben. 

Er ist das Kontrollzentrum für dein lokales KI-Ökosystem (RTX 5090 optimiert).

---

## ⚡️ Key Features

*   **Fluid Drag & Drop:** Ziehe Clips direkt aus der Library in die Timeline. Inklusive **Ghost-Preview** und Track-Highlighting für präzises Platzieren.
*   **Direct Disk Link:** Kopple die App direkt mit deiner Festplatte. Kein Up- und Downloaden von Projektdateien.
*   **Auto-Save Engine:** Jede Änderung wird sofort im Hintergrund in deine `.json` Projektdatei geschrieben.
*   **Neural Bridge:** Native Integration von **ComfyUI** und **Ollama** für 100% lokalen KI-Workflow.
*   **Dope Sheet Animation:** Präzises Keyframing mit Bezier-Kurven und Live-Interpolation im Preview-Fenster.
*   **Smart Asset Management:** Anzeige von Media-Metadaten (Dauer, Typ) und Inline-Renaming direkt in der Library.

---

## 🚀 Lokale Installation & Setup (Full Guide)

Um den SceneEditor Ultra mit voller KI-Power zu nutzen, folge diesen Schritten für dein lokales Setup:

### 1. Hardware & Browser
*   **GPU:** Empfohlen NVIDIA RTX (8GB+ VRAM für SD, 16GB+ für Video). Optimiert für RTX 5090.
*   **Browser:** Erfordert **Chrome** oder **Microsoft Edge** (für die File System Access API).

### 2. Projekt-Ordner anlegen
Erstelle einen Hauptordner auf deiner Festplatte, in dem alle Projekte landen:
`C:/AI/Sceneeditor_ultra/` (oder ein Pfad deiner Wahl).

### 3. KI-Backend 1: Ollama (Texte & Analyse)
*   Lade Ollama von [ollama.com](https://ollama.com) herunter.
*   **WICHTIG:** Setze `OLLAMA_ORIGINS="*"` in den Umgebungsvariablen, damit der Editor zugreifen darf.
*   Öffne dein Terminal und lade das Modell: `ollama run llama3`.

### 4. KI-Backend 2: ComfyUI (Bild & Video)
*   Installiere ComfyUI.
*   **WICHTIG:** Starte ComfyUI mit dem API-Enable Flag:
    ```bash
    python main.py --listen --enable-cors-header
    ```

### 5. App starten
1. Öffne die `index.html` in deinem Chrome/Edge Browser.
2. Gehe zu **Configs**.
3. Klicke auf **"Authorize Root Folder"** und wähle deinen Ordner aus.

---

## 🛠 Tech Stack
*   **Frontend:** React 19 + Zustand (State Management).
*   **Canvas Engine:** React-Konva für die performante Timeline-Darstellung.
*   **Storage:** File System Access API (W3C Standard).
*   **KI:** Gemini 3 Flash (Analyse), Ollama/Llama3 (Prompting), ComfyUI (Rendering).

*Entwickelt für die nächste Generation des digitalen Storytellings.*
