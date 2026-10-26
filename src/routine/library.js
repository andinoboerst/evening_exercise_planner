// Exercise library for the night routine. Floor mat only, no equipment.
//
// Content only: how exercises are chosen and timed lives in generator.js, how
// they are demonstrated lives in media.js.
//
// phase   strength | stretch | wind
// pos     body position, used to order a session with the fewest floor transitions
// focus   what the move trains or releases; the generator uses it to keep a session balanced
// perSide the exercise is done on both sides (the slot time is split between them)
// cue     one or two sentences, read aloud by the coach and shown on screen
// tip     optional note for doing it together

export const PHASES = {
  strength: { id: 'strength', title: 'Strength', color: '#6366f1' },
  stretch: { id: 'stretch', title: 'Stretch', color: '#8b5cf6' },
  wind: { id: 'wind', title: 'Wind Down', color: '#38bdf8' }
};

// Position order inside a phase (lower comes first)
export const POSITION_ORDER = {
  strength: ['stand', 'kneel', 'plank', 'side', 'prone', 'supine'],
  stretch: ['kneel', 'prone', 'seated', 'side', 'supine'],
  wind: ['supine']
};

export const EXERCISES = [
  // --- Strength ----------------------------------------------------------
  {
    id: 'forearm-plank', phase: 'strength', pos: 'plank', focus: ['core'],
    name: 'Forearm Plank',
    cue: 'Elbows under shoulders, body in one long line. Squeeze your glutes and breathe slowly. Drop to your knees whenever you need.',
    tip: 'Face each other on your mats and match your breathing.'
  },
  {
    id: 'side-plank', phase: 'strength', pos: 'side', focus: ['core'], perSide: true,
    name: 'Side Plank',
    cue: 'Stack your feet, lift your hips and reach the top arm up. Keep the knee down if the full version is too much.'
  },
  {
    id: 'kneeling-push-up', phase: 'strength', pos: 'plank', focus: ['upper'],
    name: 'Slow Push-Ups',
    cue: 'Lower for three counts, press up smoothly. Go on your knees if you need to, and rest in child’s pose when it burns.'
  },
  {
    id: 'shoulder-tap', phase: 'strength', pos: 'plank', focus: ['upper', 'core'],
    name: 'Plank Shoulder Taps',
    cue: 'From a high plank, tap one shoulder at a time while your hips stay still. Feet wide for balance.',
    tip: 'Facing each other, you can tap hands in the middle.'
  },
  {
    id: 'bird-dog', phase: 'strength', pos: 'kneel', focus: ['core', 'back'],
    name: 'Bird Dog',
    cue: 'On hands and knees, reach opposite arm and leg long. Hold for two seconds, return slowly and switch.'
  },
  {
    id: 'glute-bridge', phase: 'strength', pos: 'supine', focus: ['glutes'],
    name: 'Glute Bridge',
    cue: 'Feet flat, drive through your heels and lift your hips. Squeeze at the top for two seconds and lower slowly.'
  },
  {
    id: 'single-leg-bridge', phase: 'strength', pos: 'supine', focus: ['glutes'], perSide: true,
    name: 'Single-Leg Bridge',
    cue: 'One foot on the floor, the other leg extended. Lift your hips level and lower with control.'
  },
  {
    id: 'dead-bug', phase: 'strength', pos: 'supine', focus: ['core'],
    name: 'Dead Bug',
    cue: 'Arms up, knees at ninety degrees. Press your lower back down and slowly extend opposite arm and leg.'
  },
  {
    id: 'leg-raise', phase: 'strength', pos: 'supine', focus: ['core'],
    name: 'Slow Leg Raises',
    cue: 'Lower back pressed into the mat. Lower straight legs slowly, stop before your back lifts, and raise them again.'
  },
  {
    id: 'bicycle-crunch', phase: 'strength', pos: 'supine', focus: ['core'],
    name: 'Slow Bicycle Crunch',
    cue: 'Hands light behind your head. Rotate your chest toward the opposite knee, slow and controlled.'
  },
  {
    id: 'superman', phase: 'strength', pos: 'prone', focus: ['back', 'glutes'],
    name: 'Superman Hold',
    cue: 'Face down, arms long. Lift arms, chest and legs a little, keep your neck neutral, and breathe.'
  },
  {
    id: 'swimmer', phase: 'strength', pos: 'prone', focus: ['back'],
    name: 'Prone Swimmers',
    cue: 'Lifted slightly off the mat, flutter opposite arm and leg slowly. Keep your gaze on the floor.'
  },
  {
    id: 'donkey-kick', phase: 'strength', pos: 'kneel', focus: ['glutes'], perSide: true,
    name: 'Donkey Kicks',
    cue: 'On hands and knees, press one heel to the ceiling with the knee bent. Hips stay square.'
  },
  {
    id: 'fire-hydrant', phase: 'strength', pos: 'kneel', focus: ['glutes'], perSide: true,
    name: 'Fire Hydrants',
    cue: 'On hands and knees, lift one knee out to the side without twisting your torso. Lower slowly.'
  },
  {
    id: 'squat', phase: 'strength', pos: 'stand', focus: ['legs', 'glutes'],
    name: 'Slow Squats',
    cue: 'Feet shoulder-width apart, sit your hips back and down for three counts, then drive up through your heels.',
    tip: 'Hold hands facing each other and use each other for balance.'
  },
  {
    id: 'reverse-lunge', phase: 'strength', pos: 'stand', focus: ['legs', 'glutes'],
    name: 'Reverse Lunges',
    cue: 'Step back, lower your back knee toward the mat, and push through the front heel to return. Alternate legs.'
  },

  // --- Stretch -----------------------------------------------------------
  {
    id: 'cat-cow', phase: 'stretch', pos: 'kneel', focus: ['spine'],
    name: 'Cat-Cow',
    cue: 'On hands and knees, inhale to arch and lift your chest, exhale to round your spine. Let your breath lead.'
  },
  {
    id: 'childs-pose', phase: 'stretch', pos: 'kneel', focus: ['spine', 'hips'],
    name: 'Child’s Pose',
    cue: 'Sit back on your heels, arms long in front of you. Let your forehead rest and your back widen with every breath.'
  },
  {
    id: 'thread-needle', phase: 'stretch', pos: 'kneel', focus: ['spine', 'shoulders'], perSide: true,
    name: 'Thread the Needle',
    cue: 'From hands and knees, slide one arm under your body, shoulder and ear to the mat. Breathe into the twist.'
  },
  {
    id: 'downward-dog', phase: 'stretch', pos: 'kneel', focus: ['hamstrings', 'shoulders', 'spine'],
    name: 'Downward Dog',
    cue: 'Hips high, heels reaching down, press the floor away. Bend your knees as much as you like and pedal your feet.'
  },
  {
    id: 'low-lunge', phase: 'stretch', pos: 'kneel', focus: ['hips'], perSide: true,
    name: 'Low Lunge',
    cue: 'Back knee down, front foot forward. Tuck your pelvis under and sink forward until you feel the front of your hip open.'
  },
  {
    id: 'sphinx', phase: 'stretch', pos: 'prone', focus: ['spine', 'chest'],
    name: 'Sphinx',
    cue: 'Face down, forearms on the mat, chest gently lifted. Relax your glutes and let your lower back soften.'
  },
  {
    id: 'seated-forward-fold', phase: 'stretch', pos: 'seated', focus: ['hamstrings', 'spine'],
    name: 'Seated Forward Fold',
    cue: 'Legs long, hinge from your hips and reach forward. Keep your knees soft and let your head hang heavy.',
    tip: 'Sit facing each other with soles touching and gently hold hands.'
  },
  {
    id: 'butterfly', phase: 'stretch', pos: 'seated', focus: ['hips'],
    name: 'Butterfly',
    cue: 'Soles of your feet together, knees falling out. Sit tall, then fold forward from your hips.'
  },
  {
    id: 'seated-twist', phase: 'stretch', pos: 'seated', focus: ['spine'], perSide: true,
    name: 'Seated Spinal Twist',
    cue: 'Sit tall, cross one foot over the opposite thigh and turn toward the bent knee. Lengthen with every inhale.'
  },
  {
    id: 'neck-release', phase: 'stretch', pos: 'seated', focus: ['neck', 'shoulders'], perSide: true,
    name: 'Neck & Shoulder Release',
    cue: 'Sit tall, drop one ear toward your shoulder and reach the opposite hand toward the floor.'
  },
  {
    id: 'figure-four', phase: 'stretch', pos: 'supine', focus: ['hips'], perSide: true,
    name: 'Reclined Figure-Four',
    cue: 'On your back, cross one ankle over the opposite knee and draw that leg toward your chest.'
  },
  {
    id: 'supine-twist', phase: 'stretch', pos: 'supine', focus: ['spine'], perSide: true,
    name: 'Supine Spinal Twist',
    cue: 'Hug one knee across your body, arms wide, gaze the other way. Let gravity do the work.'
  },
  {
    id: 'hamstring-strap', phase: 'stretch', pos: 'supine', focus: ['hamstrings'], perSide: true,
    name: 'Reclined Hamstring Stretch',
    cue: 'Lie on your back, lift one leg and hold behind the thigh or calf. Keep the other leg long on the mat.'
  },
  {
    id: 'happy-baby', phase: 'stretch', pos: 'supine', focus: ['hips', 'spine'],
    name: 'Happy Baby',
    cue: 'On your back, hold the outsides of your feet with knees wide. Rock gently side to side.'
  },
  {
    id: 'knees-to-chest', phase: 'stretch', pos: 'supine', focus: ['spine'],
    name: 'Knees to Chest',
    cue: 'Hug both knees in, rock softly and let your lower back release into the mat.'
  },

  // --- Wind down ---------------------------------------------------------
  {
    id: 'breath-478', phase: 'wind', pos: 'supine', slot: 'breathe', seconds: 100,
    name: '4-7-8 Breathing',
    cue: 'Lie on your back. Breathe in through your nose for four, hold for seven, and breathe out slowly through your mouth for eight.'
  },
  {
    id: 'breath-belly', phase: 'wind', pos: 'supine', slot: 'breathe', seconds: 100,
    name: 'Belly Breathing',
    cue: 'Rest a hand on your belly. Breathe in slowly so your hand rises, and let a long, slow exhale carry the day away.',
    tip: 'Rest a hand on your partner’s belly and breathe together.'
  },
  {
    id: 'muscle-release', phase: 'wind', pos: 'supine', slot: 'release', seconds: 100,
    name: 'Progressive Relaxation',
    cue: 'Tighten your feet for three seconds, then release. Work upward: calves, thighs, belly, hands, shoulders, face. Let each part go heavy.'
  },
  {
    id: 'body-scan', phase: 'wind', pos: 'supine', slot: 'release', seconds: 100,
    name: 'Body Scan',
    cue: 'Bring your attention to your toes, then slowly up through your body. Notice each part and let it soften.'
  },
  {
    id: 'savasana', phase: 'wind', pos: 'supine', slot: 'rest', seconds: 100,
    name: 'Final Rest',
    cue: 'Arms by your sides, palms up. Let go of all effort and rest. There is nothing left to do tonight.'
  }
];

const BY_ID = new Map(EXERCISES.map(e => [e.id, e]));

export const getExercise = (id) => BY_ID.get(id) || null;
