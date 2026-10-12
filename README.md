# ইসলামী বিশ্বকোষ ও আল হাদিস — Automated Video Render

A GitHub Actions pipeline that renders a 1080×1920 portrait video using HTML/CSS/JS, Playwright (Chromium), and FFmpeg.

## Root layout

Keep these files in the **repository root**:
- `index.html` — animated visual template and custom Islamic vector artwork
- `render.js` — timestamp parser, frame capture, and FFmpeg encoding
- `timestamps.txt` — timing/text/tone rows
- `audio.mp3` — narration
- `logo.png` — supplied app logo
- `google-play-badge.png` — supplied Play Store badge
- `package.json` and `package-lock.json`

The only required subfolder is `.github/workflows/`, because GitHub Actions only discovers workflow YAML files there.

## Run on GitHub
1. Upload the root files and `.github/workflows/render-video.yml` to your repository's `main` branch.
2. Open **Actions → Render Islamic Hadith Video → Run workflow** (or push a change to a watched file).
3. Wait for the job to finish.
4. In the completed workflow run, download the `islamic-hadith-video` artifact. The MP4 is inside it.

## Run locally
Requirements: Node.js 20+, FFmpeg, and Playwright Chromium.
```bash
npm ci
npx playwright install chromium
npm run render
```
Output: `output/islamic-hadith-video.mp4`

## Timing behavior
The supplied timestamp file contains scenes ending at 82.00 seconds; the narration audio is about 79.68 seconds. The render is kept at 82 seconds and FFmpeg pads the audio with silence at the end so the final CTA scene is not cut off. Scene boundaries come from `timestamps.txt`.

## Notes
- Video size: 1080×1920 (9:16), 30 fps, H.264/AAC MP4.
- The workflow uploads the MP4 as a GitHub Actions artifact; it does not commit generated video back into the repository.
- The HTML references Google Fonts as a progressive enhancement; fallback fonts are specified. For fully offline reproducibility, bundle Noto Bengali/Arabic font files in the repository and reference them locally.
- Keep supplied image assets unchanged. The central artwork is a custom inline SVG and uses Arabic calligraphy for the minbar label and hadith heading.
