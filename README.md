# AndiNú Night Routine

A guided 30-minute floor-mat routine for two: strength, stretching and a 5-minute wind-down. No equipment, only a mat.
It is one app inside the AndiNú household suite (`/routine`).

## How it works
- **Library** (`src/routine/library.js`): 36 exercises, each with a spoken cue, an optional partner tip, and tags for what it trains.
- **Generator** (`src/routine/generator.js`): builds tonight's session from the library. It covers core, glutes, upper body and back in strength, and spine, hips and hamstrings in stretching. It orders exercises to minimise position changes and avoids exercises from recent nights. Plans are seeded by date, so phone and TV show the same plan on the same night. Three lengths: Full (30 min), Short (~20), Wind-down (~10).
- **Player** (`src/views/routine.js`, `src/routine/session.js`): drift-free timer, built-in text-to-speech coach, bells and countdown beeps, screen wake lock.
- **Music** (`src/routine/music.js`): starts by itself with the session, dips while the coach speaks, softens per phase and fades out at the end. Tracks are CC0 ambient mixes (Calm Pills by Alaeddin Hallak) streamed from the Internet Archive; generated rain, singing bowls and drone are the offline fallback.
- **Demonstrations** (`src/routine/media.js`): a still image per exercise, or an optional looping clip. Drop `src/assets/poses/<exercise-id>.png` (ids are in `library.js`) and it is picked up automatically.
- **History** (`src/routine/store.js`): shared by all devices through the `routine_sessions` table in Supabase (see the migration; the table is open to anyone with the anon key, by design, so the TV needs no login). Cached locally, so it also works offline.

## On the TV
`/routine` is public, so no sign-in is needed. Open the site in the TV browser and press OK: Start is focused, and a session starts with one press.
During a session: OK pauses, left/right skip, Back/Esc asks to end.

## Adding demo clips (optional, instead of images)
In `src/routine/media.js`, add to `CLIPS`:
```js
'reverse-lunge': { youtube: 'VIDEO_ID', start: 12, end: 24 },  // muted looping section of a YouTube video
'bird-dog': { src: '/clips/bird-dog.mp4' },                    // or a self-hosted loop in public/clips/
```

## Development
Apply the database migration once: `supabase db push` (or run `supabase/migrations/20261026120000_create_routine_sessions.sql` in the Supabase SQL editor).

```bash
npm install
npm run dev
npm run build
```
