
# System-Dokumentation: LS SceneEditor Ultra

## 1. Architektur: Hybrid-Native-Ansatz
Die App nutzt ein innovatives Modell, bei dem die Benutzeroberfläche im Browser läuft, die Datenhaltung aber **direkt auf der physischen Festplatte** des Nutzers erfolgt. Dies eliminiert die Notwendigkeit für einen lokalen Backend-Server.

### 1.1 Storage Layer (File System Access API)
*   **Workspace Handle:** Die App speichert einen `FileSystemDirectoryHandle`. Dieser erlaubt es, Dateien ohne Nutzerinteraktion zu lesen und zu schreiben (nach einmaliger Autorisierung).
*   **Ordnerstruktur:**
    *   `/data/projects/[Projektname]/`: Beinhaltet die `[Projektname].json`.
    *   `/data/projects/[Projektname]/assets/`: (Geplant) Lokale Kopien der verwendeten Medien.

### 1.2 State Management & Auto-Save
Der **Zustand (Store)** wird via Zustand verwaltet. Jede "Mutations-Funktion" (z.B. `updateClip`, `addKeyframe`) triggert automatisch die `saveProject(true)`-Funktion, die den aktuellen State als JSON auf die Platte schreibt.

---

## 2. Projekt-Lebenszyklus

### 2.1 Neues Projekt ("New" Button)
*   Setzt den Store auf die `INITIAL_TRACKS` zurück.
*   Löscht die `selectedClipId` und `selectedKeyframes`.
*   Generiert einen neuen Zeitstempel für den Standard-Projektnamen.
*   Wichtig: Das Auto-Save schreibt erst in eine neue Datei, sobald der Nutzer den Namen in den Settings ändert oder das erste Asset hinzufügt.

### 2.2 Laden & Wiederherstellen
*   Nutzer können alte `.json` Dateien via **File Picker** laden.
*   Die App parst das JSON und injiziert die Tracks und Keyframes direkt in den Store.

---

## 3. KI-Integrationen

### 3.1 ComfyUI Bridge (Port 8188)
*   **Workflow Injection:** Die App parst hochgeladene Comfy-JSONs und sucht nach spezifischen Klassen (z.B. `CLIPTextEncode`).
*   **Parameter Mapping:** In der UI geänderte Werte (Breite, Höhe, Prompt) werden in das JSON injiziert, bevor es an die `/prompt` API gesendet wird.

### 3.2 Ollama Intel (Port 11434)
*   **Local LLM:** Nutzt das `llama3` Modell für Prompt-Enhancement.
*   **Scene Analysis:** Analysiert Clip-Metadaten, um cinematographische Tipps zu geben.

---

## 4. Hardware & Browser-Anforderungen

*   **Browser:** Erfordert **Chrome 86+** oder **Edge 86+** (wegen der File System Access API). Firefox/Safari unterstützen derzeit nur lesenden Zugriff über Umwege.
*   **GPU:** Optimiert für NVIDIA RTX Karten (NVENC Support in der FFmpeg-Logik).
*   **VRAM:** Für lokale Diffusion (ComfyUI) werden mindestens 12GB empfohlen.

---

## 5. Export-Logik (FFmpeg)
Da Browser keine 4K-Videos mit komplexen Effekten in Echtzeit rendern können, fungiert die App als **"Command Generator"**. 
*   Sie übersetzt die Timeline-Daten (Startzeiten, Dauer, Overlays) in einen komplexen FFmpeg-String.
*   Dieser String kann kopiert und in einem lokalen Terminal ausgeführt werden, um die volle Hardware-Beschleunigung (NVENC) deiner RTX-Karte zu nutzen.
