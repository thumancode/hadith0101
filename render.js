const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { spawnSync } = require('child_process');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'output');
const WIDTH = 1080, HEIGHT = 1920, FPS = 30;
const DURATION = 82;

function run(cmd, args, options={}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...options });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${cmd} exited with code ${r.status}`);
}
function parseTimestamps(file) {
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).map(line => {
    const m = line.match(/^\s*(\d+(?:\.\d+)?)\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*(.*?)\s*\|\s*([a-zA-Z]+)\s*$/);
    return m ? { start: +m[1], end: +m[2], text: m[3], tone: m[4] } : null;
  }).filter(Boolean);
}
(async () => {
  for (const f of ['index.html','audio.mp3','logo.png','google-play-badge.png','timestamps.txt']) {
    if (!fs.existsSync(path.join(ROOT,f))) throw new Error(`Missing required root asset: ${f}`);
  }
  const scenes = parseTimestamps(path.join(ROOT,'timestamps.txt'));
  if (!scenes.length) throw new Error('No timestamp rows parsed from timestamps.txt');
  fs.rmSync(OUT, { recursive:true, force:true });
  fs.mkdirSync(path.join(OUT,'frames'), { recursive:true });
  const browser = await chromium.launch({ headless:true, args:['--no-sandbox','--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage({ viewport:{width:WIDTH,height:HEIGHT}, deviceScaleFactor:1 });
    page.on('console', msg => { if(msg.type()==='error') console.error('Browser:',msg.text()); });
    await page.goto('file://' + path.join(ROOT,'index.html'), { waitUntil:'load' });
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const imgs = Array.from(document.images);
      await Promise.all(imgs.map(i => i.decode().catch(()=>{})));
    });
    const totalFrames = Math.round(DURATION * FPS);
    let sceneIndex = 0;
    for (let frame=0; frame<totalFrames; frame++) {
      const t = frame / FPS;
      while (sceneIndex < scenes.length-1 && t >= scenes[sceneIndex].end) sceneIndex++;
      const s = scenes[sceneIndex];
      await page.evaluate(({scene,progress}) => window.setScene({...scene,progress}), {
        scene:{text:s.text,tone:s.tone}, progress:Math.min(100,(t/DURATION)*100)
      });
      await page.screenshot({ path:path.join(OUT,'frames',`frame-${String(frame).padStart(5,'0')}.png`) });
    }
  } finally { await browser.close(); }

  const framePattern = path.join(OUT,'frames','frame-%05d.png');
  const video = path.join(OUT,'islamic-hadith-video.mp4');
  run('ffmpeg', [
    '-y','-hide_banner','-loglevel','warning',
    '-framerate',String(FPS),'-i',framePattern,
    '-i',path.join(ROOT,'audio.mp3'),
    '-filter_complex',`[1:a]aresample=48000,apad=pad_dur=${DURATION}[a]`,
    '-map','0:v:0','-map','[a]',
    '-t',String(DURATION),'-r',String(FPS),
    '-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',
    '-c:a','aac','-b:a','192k','-movflags','+faststart',video
  ]);
  const stats = fs.statSync(video);
  console.log(`Rendered ${video} (${(stats.size/1024/1024).toFixed(1)} MiB)`);
})().catch(err => { console.error(err); process.exit(1); });
