// Smart Pose Image Resolver
// Maps exercise names and types to high-quality visual mat pose illustrations

export const POSE_IMAGES = {
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

  // 1. Planks, pushups, abdominal hollows
  if (name.includes('plank') || name.includes('push-up') || name.includes('pushup') || name.includes('hollow') || name.includes('bear') || name.includes('dead bug') || name.includes('core brace')) {
    return POSE_IMAGES.plank;
  }

  // 2. Bird-dog, quadruped balance, swimmers
  if (name.includes('bird-dog') || name.includes('bird dog') || name.includes('quadruped') || name.includes('swimmer') || name.includes('pointer') || name.includes('pedaling')) {
    return POSE_IMAGES.bird_dog;
  }

  // 3. Glute bridges, hip extensions, tabletop
  if (name.includes('bridge') || name.includes('glute') || name.includes('tabletop') || name.includes('reverse table')) {
    return POSE_IMAGES.glute_bridge;
  }

  // 4. Cat-Cow waves
  if (name.includes('cat-cow') || name.includes('cat/cow') || name.includes('cat') || name.includes('cow') || name.includes('spinal wave')) {
    return POSE_IMAGES.cat_cow;
  }

  // 5. Child's pose, puppy pose, frog pose, melting heart
  if (name.includes('child') || name.includes('puppy') || name.includes('melting heart') || name.includes('frog') || name.includes('anahatasana')) {
    return POSE_IMAGES.childs_pose;
  }

  // 6. Sphinx, Cobra, Seal, Prone extensions
  if (name.includes('sphinx') || name.includes('cobra') || name.includes('seal') || name.includes('prone') || name.includes('chest release') || name.includes('y-t-w')) {
    return POSE_IMAGES.sphinx;
  }

  // 7. Spinal twists, needle thread, wiper waves
  if (name.includes('twist') || name.includes('needle') || name.includes('wiper') || name.includes('spiral')) {
    return POSE_IMAGES.spinal_twist;
  }

  // 8. Reclined pigeon, figure-4, butterfly, 90/90 hips, hamstrings
  if (name.includes('pigeon') || name.includes('figure-4') || name.includes('figure 4') || name.includes('butterfly') || name.includes('90/90') || name.includes('bound angle') || name.includes('lunge') || name.includes('hamstring') || name.includes('hip') || name.includes('piriformis') || name.includes('baddha konasana')) {
    return POSE_IMAGES.reclined_pigeon;
  }

  // 9. Savasana, breathing, drift, meditation, body scan
  if (name.includes('breath') || name.includes('savasana') || name.includes('sleep') || name.includes('rest') || name.includes('drift') || name.includes('meditation') || name.includes('box') || name.includes('ocean') || name.includes('scan') || name.includes('vagus') || name.includes('parasympathetic')) {
    return POSE_IMAGES.savasana;
  }

  // Fallbacks by category
  if (type === 'core' || type === 'upper') return POSE_IMAGES.plank;
  if (type === 'lower') return POSE_IMAGES.glute_bridge;
  if (type === 'spine' || type === 'back') return POSE_IMAGES.cat_cow;
  if (type === 'hips') return POSE_IMAGES.reclined_pigeon;
  if (type === 'breath' || type === 'sleep') return POSE_IMAGES.savasana;

  return POSE_IMAGES.savasana;
}
