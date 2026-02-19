
# System-Dokumentation: LS SceneEditor Ultra

## 1. Architektur: Hybrid-Native-Ansatz
Die App nutzt ein innovatives Modell, bei dem die Benutzeroberfläche im Browser läuft, die Datenhaltung aber **direkt auf der physischen Festplatte** des Nutzers erfolgt. Dies eliminiert die Notwendigkeit für einen lokalen Backend-Server.

### 1.1 Storage Layer (File System Access API)
*   **Workspace Handle:** Die App speichert einen `FileSystemDirectoryHandle`. Dieser erlaubt es, Dateien ohne Nutzerinteraktion zu lesen und zu schreiben (nach einmaliger Autorisierung).
*   **Ordnerstruktur:**
    *   `/data/projects/[Projektname]/`: Beinhaltet die `[Projektname].json`.
    *   `/data/projects/[Projektname]/assets/`: (Geplant) Lokale Kopien der verwendeten Medien.

### 1.2 State Management & Auto-Save
Der **Zustand (Store)** wird via Zustand verwaltet. Jede "Mutations-Funktion" (z.B. `updateClip`, `addKeyframe`) triggert automatisch die `saveProject(true)`-Funktion.

---

## 2. Projekt-Lebenszyklus

### 2.1 Neues Projekt
*   Setzt den Store auf die `INITIAL_TRACKS` zurück.
*   Generiert einen neuen Zeitstempel für den Standard-Projektnamen.

### 2.2 Laden & Wiederherstellen
*   Nutzer können alte `.json` Dateien via **File Picker** laden.
*   Die App parst das JSON und injiziert die Tracks und Keyframes direkt in den Store.

---

## 3. KI-Integrationen

### 3.1 ComfyUI Bridge (Port 8188)
*   **Workflow Injection:** Die App parst hochgeladene Comfy-JSONs und sucht nach spezifischen Klassen (z.B. `CLIPTextEncode`).
*   **Parameter Mapping:** In der UI geänderte Werte werden in das JSON injiziert, bevor es an die `/prompt` API gesendet wird.

### 3.2 Ollama Intel (Port 11434)
*   **Local LLM:** Nutzt das `llama3` Modell für Prompt-Enhancement.
*   **Scene Analysis:** Analysiert Clip-Metadaten für cinematographische Tipps.

---

## 4. Hardware & Browser-Anforderungen

*   **Browser:** Erfordert **Chrome 86+** oder **Edge 86+**.
*   **GPU:** Optimiert für NVIDIA RTX Karten (NVENC Support in der FFmpeg-Logik).

---

## 5. Export-Logik (FFmpeg)
Die App fungiert als **"Command Generator"**. 
*   Übersetzt Timeline-Daten in einen komplexen FFmpeg-String.
*   Nutzt Hardware-Beschleunigung (NVENC) deiner RTX-Karte im lokalen Terminal.

---

## 6. Interaktions-Modell: Drag & Drop
Die App implementiert ein spezialisiertes Drag-and-Drop-System für das Platzieren von Assets in der Timeline.

### 6.1 Koordinaten-Mapping
Beim Drag-Over über die Timeline wird die Mausposition wie folgt transformiert:
1.  **X-Position:** `(mouseX - labelWidth - scrollX) / pxPerSec`. Dies ergibt die exakte Zeit in Sekunden im Timeline-Space.
2.  **Y-Position:** `(mouseY - headerHeight) / trackHeight`. Dies identifiziert den Ziel-Track (z.B. Track 0 = Main Video).

### 6.2 Visuelles Feedback (Ghost Preview)
*   Während des Drags wird im Store ein `draggingAsset` gesetzt.
*   Die Timeline rendert ein semi-transparentes Rechteck ("Ghost Clip") an der berechneten Zielposition.
*   Track-Lanes leuchten auf (`trackIndex` Highlighting), wenn sie als gültiges Ziel erkannt werden.

### 6.3 State Synchronisation
Beim `onDrop` wird eine Kopie des Assets mit einer neuen `UUID` und der berechneten `startTime` in das `clips` Array des entsprechenden Tracks im Store injiziert.
