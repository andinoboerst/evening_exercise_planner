// Smart Pose Image Resolver
// Maps exercise names and types to high-quality visual mat pose illustrations

export const POSE_IMAGES = {
  push_up: '/poses/push_up.jpg',
  dead_bug: '/poses/dead_bug.jpg',
  downward_dog: '/poses/downward_dog.jpg',
  side_plank: '/poses/side_plank.jpg',
  plank: '/poses/plank.jpg',
  bird_dog: '/poses/bird_dog.jpg',
  glute_bridge: '/poses/glute_bridge.jpg',
  cat_cow: '/poses/cat_cow.jpg',
  childs_pose: '/poses/childs_pose.jpg',
  sphinx: '/poses/sphinx.jpg',
  spinal_twist: '/poses/spinal_twist.jpg',
  reclined_pigeon: '/poses/reclined_pigeon.jpg',
  savasana: '/poses/savasana.jpg'
};

export function getPoseImage(exercise) {
  if (!exercise) return POSE_IMAGES.savasana;
  if (exercise.image) return exercise.image;

  const name = (exercise.name || '').toLowerCase();
  const type = (exercise.type || '').toLowerCase();
  const instructions = (exercise.instructions || '').toLowerCase();

  // 1. Push-ups (Prioritized FIRST to avoid being misidentified as plank or general upper body)
  if (name.includes('push-up') || name.includes('pushup') || name.includes('push up') || instructions.includes('push-up') || instructions.includes('push up')) {
    return POSE_IMAGES.push_up;
  }

  // 2. Dead bug & supine core bicycle / hollow body
  if (name.includes('dead bug') || name.includes('deadbug') || name.includes('dead-bug') || name.includes('bicycle') || name.includes('hollow body') || name.includes('floor push')) {
    return POSE_IMAGES.dead_bug;
  }

  // 3. Downward-Facing Dog & pedaling flow
  if (name.includes('downward dog') || name.includes('downward-dog') || name.includes('down dog') || name.includes('pedaling') || name.includes('adho mukha')) {
    return POSE_IMAGES.downward_dog;
  }

  // 4. Side Plank
  if (name.includes('side plank') || name.includes('side-plank')) {
    return POSE_IMAGES.side_plank;
  }

  // 5. Forearm Planks, Dolphin plank, Bear plank
  if (name.includes('plank') || name.includes('bear') || name.includes('core brace')) {
    return POSE_IMAGES.plank;
  }

  // 6. Bird-Dog, quadruped balance, pointer
  if (name.includes('bird-dog') || name.includes('bird dog') || name.includes('quadruped') || name.includes('pointer') || name.includes('cat balance')) {
    return POSE_IMAGES.bird_dog;
  }

  // 7. Reclined pigeon, figure-4, butterfly, 90/90 hips, hamstrings, happy baby, lunges
  // (Checked BEFORE glute bridge so 'Reclined Pigeon Deep Glute Hold' gets pigeon!)
  if (name.includes('pigeon') || name.includes('figure-4') || name.includes('figure 4') || name.includes('butterfly') || name.includes('90/90') || name.includes('bound angle') || name.includes('lunge') || name.includes('dragon') || name.includes('hamstring') || name.includes('happy baby') || name.includes('hero') || name.includes('piriformis') || name.includes('baddha konasana')) {
    return POSE_IMAGES.reclined_pigeon;
  }

  // 8. Glute bridges, hip extensions, pelvic tilts
  if (name.includes('bridge') || name.includes('glute') || name.includes('pelvic tilt') || name.includes('tabletop') || name.includes('reverse table')) {
    return POSE_IMAGES.glute_bridge;
  }

  // 9. Cat-Cow waves
  if (name.includes('cat-cow') || name.includes('cat/cow') || name.includes('spinal wave') || (name.includes('cat') && !name.includes('balance'))) {
    return POSE_IMAGES.cat_cow;
  }

  // 10. Child's pose, puppy pose, frog pose, melting heart
  if (name.includes('child') || name.includes('puppy') || name.includes('melting heart') || name.includes('frog') || name.includes('anahatasana')) {
    return POSE_IMAGES.childs_pose;
  }

  // 11. Sphinx, Cobra, Seal, Prone extensions, Y-T-W, Swimmer, Locust, Chest openers
  if (name.includes('sphinx') || name.includes('cobra') || name.includes('seal') || name.includes('prone') || name.includes('locust') || name.includes('swimmer') || name.includes('y-t-w') || name.includes('chest release') || name.includes('chest opener') || name.includes('floor chest')) {
    return POSE_IMAGES.sphinx;
  }

  // 12. Spinal twists, needle thread, open book, windshield wiper
  if (name.includes('twist') || name.includes('needle') || name.includes('open book') || name.includes('wiper') || name.includes('spiral')) {
    return POSE_IMAGES.spinal_twist;
  }

  // 13. Savasana, breathing, sleep drift, meditation, body scan, neck softening
  if (name.includes('breath') || name.includes('savasana') || name.includes('sleep') || name.includes('rest') || name.includes('drift') || name.includes('meditation') || name.includes('box') || name.includes('ocean') || name.includes('scan') || name.includes('vagus') || name.includes('parasympathetic') || name.includes('neck') || name.includes('trapezius') || name.includes('constructive rest') || name.includes('eagle arms')) {
    return POSE_IMAGES.savasana;
  }

  // Category fallbacks
  if (type === 'upper') return POSE_IMAGES.push_up;
  if (type === 'core') return POSE_IMAGES.plank;
  if (type === 'lower') return POSE_IMAGES.glute_bridge;
  if (type === 'spine' || type === 'back') return POSE_IMAGES.cat_cow;
  if (type === 'hips' || type === 'hamstrings') return POSE_IMAGES.reclined_pigeon;
  if (type === 'breath' || type === 'sleep' || type === 'neck') return POSE_IMAGES.savasana;

  return POSE_IMAGES.savasana;
}
