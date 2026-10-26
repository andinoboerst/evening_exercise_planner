// How each exercise is demonstrated. Kept apart from library.js so clips can be added or swapped
// without touching exercise content.
//
// Resolution order: video clip -> still pose image -> none (the player shows a phase icon).
//
// A clip is one of:
//   { youtube: 'VIDEO_ID', start: 12, end: 24 }   muted looping YouTube embed of a short section
//   { src: '/clips/plank.mp4' }                   self-hosted loop in public/clips/

// Still images live in src/assets/poses. Drop in a file named after the exercise id
// (e.g. reverse-lunge.png, see library.js) and it is picked up automatically.
const FILES = import.meta.glob('../assets/poses/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' });
const BY_NAME = Object.fromEntries(Object.entries(FILES).map(([path, url]) => [path.split('/').pop().replace(/\.\w+$/, ''), url]));

// Older images that predate the id naming
const ALIASES = {
  'forearm-plank': 'plank',
  'side-plank': 'side_plank',
  'kneeling-push-up': 'push_up',
  'bird-dog': 'bird_dog',
  'glute-bridge': 'glute_bridge',
  'single-leg-bridge': 'glute_bridge',
  'dead-bug': 'dead_bug',
  'cat-cow': 'cat_cow',
  'childs-pose': 'childs_pose',
  'downward-dog': 'downward_dog',
  'supine-twist': 'spinal_twist',
  'figure-four': 'reclined_pigeon',
  // Wind-down exercises are all lying on the back
  'breath-478': 'savasana',
  'breath-belly': 'savasana',
  'muscle-release': 'savasana',
  'body-scan': 'savasana'
};

const imageFor = (id) => BY_NAME[id] || BY_NAME[ALIASES[id]] || BY_NAME[id.replace(/-/g, '_')] || null;

const CLIPS = {};

export function getMedia(exercise) {
  const clip = CLIPS[exercise.id] || null;
  return { clip, image: imageFor(exercise.id) };
}

function youtubeUrl({ youtube, start = 0, end }) {
  const params = new URLSearchParams({
    autoplay: '1', mute: '1', controls: '0', loop: '1', playlist: youtube,
    modestbranding: '1', playsinline: '1', rel: '0', disablekb: '1', enablejsapi: '1', start: String(start)
  });
  if (end) params.set('end', String(end));
  return `https://www.youtube-nocookie.com/embed/${youtube}?${params}`;
}

/** Markup for the demo area of an exercise */
export function renderMedia(exercise) {
  const { clip, image } = getMedia(exercise);
  const alt = `${exercise.name} demonstration`;
  if (clip?.youtube) {
    return `<iframe class="rt-media-el" data-media="youtube" src="${youtubeUrl(clip)}" title="${alt}" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin" tabindex="-1"></iframe>`;
  }
  if (clip?.src) {
    return `<video class="rt-media-el" data-media="video" src="${clip.src}" autoplay muted loop playsinline tabindex="-1"></video>`;
  }
  if (image) {
    return `<img class="rt-media-el rt-media-image" src="${image}" alt="${alt}" />`;
  }
  return '';
}

/** Pause or resume whatever clip is mounted in `root` */
export function setMediaPlaying(root, playing) {
  const el = root?.querySelector('[data-media]');
  if (!el) return;
  if (el.dataset.media === 'video') {
    if (playing) el.play().catch(() => {}); else el.pause();
  } else if (el.dataset.media === 'youtube') {
    el.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: playing ? 'playVideo' : 'pauseVideo', args: [] }), '*');
  }
}
