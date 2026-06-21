# ForestGuard

A small web app for field triage of forest health issues. It accepts natural-language observations, GPS/location, tree species, forest type, affected-tree counts, symptoms, and an optional image.

Each diagnosis includes a Sources section backed by a curated article library. The local fallback attaches sources by diagnostic profile, and live AI mode is instructed to cite only from that same library.

## Run

For the self-contained prototype, open `index.html` in a browser. It will use local in-browser triage when no server is running.

For live AI mode, run the local server:

```powershell
cd C:\Users\haoqi\Documents\Codex\2026-06-21\i\outputs\forest-diagnosis-site
npm start
```

Open the shown local URL.

## Optional Live AI

The app works without setup using a local triage fallback. To connect a live model, set:

```powershell
$env:OPENAI_API_KEY = "your-key"
$env:AI_MODEL = "your-preferred-model"
npm start
```

The optional image is sent to the server as a data URL and only passed to the model when `OPENAI_API_KEY` is present.

This tool is for decision support only. Field diagnosis should be confirmed by a qualified forester, arborist, extension specialist, or plant pathology lab.
