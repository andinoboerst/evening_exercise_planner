// 30-Minute Bedtime Floor Mat Routines for Couples
// Breakdown:
// Phase 1: Strength Training (10 minutes / 600s)
// Phase 2: Stretching & Mobility (15 minutes / 900s)
// Phase 3: Wind Down & Meditation (5 minutes / 300s)

export const WEEKLY_ROUTINES = [
  {
    dayIndex: 0, // Sunday
    dayName: 'Sunday',
    title: 'Mindful Mat Restoration & Core Reset',
    tagline: 'Gently activate core muscles, decompress the lumbar spine, and transition into peaceful deep rest.',
    phases: [
      {
        id: 'strength',
        title: 'Strength Training',
        durationSec: 600, // 10 minutes
        color: '#6366f1', // Indigo
        icon: 'Flame',
        description: 'Mat-only core and stabilization to release daytime physical restlessness.',
        exercises: [
          {
            name: 'Forearm Plank Hold',
            duration: 50,
            rest: 10,
            type: 'core',
            instructions: 'Elbows under shoulders, engage glutes and belly button to spine. Keep neck neutral.',
            partnerTip: 'Facing each other or side-by-side. If one needs a rest first, drop knees down without stopping the partner clock!',
            target: 'Transverse Abdominis, Shoulders'
          },
          {
            name: 'Kneeling Push-Ups / Standard Push-Ups',
            duration: 45,
            rest: 15,
            type: 'upper',
            instructions: 'Hands shoulder-width apart. Lower chest down in a controlled 2-second tempo, exhale to push up.',
            partnerTip: 'One partner can do full push-ups, while the other does kneeling variations. Go at your own pace.',
            target: 'Chest, Triceps, Anterior Core'
          },
          {
            name: 'Dead Bug Alternations',
            duration: 50,
            rest: 10,
            type: 'core',
            instructions: 'Lie on back, lower opposite arm and leg while pressing lower back flat into the mat.',
            partnerTip: 'Focus on slow control rather than speed. Count reps together.',
            target: 'Deep Core, Pelvic Floor'
          },
          {
            name: 'Glute Bridge Holds & Pulses',
            duration: 50,
            rest: 10,
            type: 'lower',
            instructions: 'Drive through heels, squeeze glutes at the top. Avoid arching lower back.',
            partnerTip: 'Hold the top squeeze together for the last 15 seconds!',
            target: 'Glutes, Hamstrings, Lumbar Stability'
          },
          {
            name: 'Bird-Dog (Right Side Lead)',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'On hands and knees, extend right arm and left leg parallel to floor. Hold 3s, return, repeat.',
            partnerTip: 'Check each other’s posture — hips should stay square to the mat.',
            target: 'Erector Spinae, Glutes, Core'
          },
          {
            name: 'Bird-Dog (Left Side Lead)',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Switch sides: extend left arm and right leg. Maintain continuous core engagement.',
            partnerTip: 'Match your arm and leg extensions in rhythm.',
            target: 'Erector Spinae, Glutes, Core'
          },
          {
            name: 'Side Plank Hold (Right Side)',
            duration: 40,
            rest: 20,
            type: 'core',
            instructions: 'Right elbow on mat, stack or stagger feet. Lift hips high to create a straight diagonal line.',
            partnerTip: 'Modify by bending bottom knee at 90 degrees if elbow or oblique needs relief.',
            target: 'Obliques, Shoulder Stabilizers'
          },
          {
            name: 'Side Plank Hold (Left Side)',
            duration: 40,
            rest: 20,
            type: 'core',
            instructions: 'Left elbow on mat. Lift hips and hold firmly, breathing steadily.',
            partnerTip: 'Smile at your partner — almost finished with the strength block!',
            target: 'Obliques, Shoulder Stabilizers'
          },
          {
            name: 'Hollow Body Hold / Tucked Hold',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Press lower back into mat, lift shoulder blades and feet. Tuck knees to chest to scale down.',
            partnerTip: 'Tuck knees to chest when fatigue sets in, keeping lower back grounded.',
            target: 'Rectus Abdominis, Hip Flexors'
          },
          {
            name: 'Finisher: High Plank to Downward Dog Taps',
            duration: 50,
            rest: 10,
            type: 'core',
            instructions: 'In plank, lift hips up into down dog and tap opposite shin with hand, return to solid plank.',
            partnerTip: 'Final movement before the soothing stretching phase!',
            target: 'Full Body Core & Deltoids'
          }
        ]
      },
      {
        id: 'mobility',
        title: 'Stretching & Mobility',
        durationSec: 900, // 15 minutes
        color: '#8b5cf6', // Violet
        icon: 'Sparkles',
        description: 'Unwind spine and hip tension accumulated from daytime sitting.',
        exercises: [
          {
            name: 'Cat-Cow Spinal Waves',
            duration: 75,
            rest: 15,
            type: 'spine',
            instructions: 'Inhale: drop belly, lift heart (Cow). Exhale: tuck tailbone, dome upper back (Cat). Move like water.',
            partnerTip: 'Sync your breathing together: deep synchronized inhales and exhales.',
            target: 'Full Spine Flexion & Extension'
          },
          {
            name: 'Extended Child’s Pose with Lat Reach',
            duration: 80,
            rest: 10,
            type: 'back',
            instructions: 'Knees wide, big toes touching. Walk hands far forward. Creep fingertips toward the right, then left.',
            partnerTip: 'Close your eyes. Feel the spacious opening across ribcage and lats.',
            target: 'Lats, Lower Back, Thoracic Spine'
          },
          {
            name: 'Sphinx Pose into Gentle Cobra',
            duration: 80,
            rest: 10,
            type: 'spine',
            instructions: 'Lie on belly, forearms on mat. Pull chest forward between arms. Soften glutes and breathe into belly.',
            partnerTip: 'Gentle lumbar decompression — excellent after sitting at a desk.',
            target: 'Thoracic Extension, Abdominal Stretch'
          },
          {
            name: 'Thread the Needle (Right Arm Under)',
            duration: 75,
            rest: 15,
            type: 'shoulders',
            instructions: 'From table-top, slide right arm under torso until right shoulder and ear rest softly on mat.',
            partnerTip: 'Let the weight of your torso sink heavy into the floor.',
            target: 'Upper Back, Rhomboids, Rear Delts'
          },
          {
            name: 'Thread the Needle (Left Arm Under)',
            duration: 75,
            rest: 15,
            type: 'shoulders',
            instructions: 'Switch sides: slide left arm through, resting left temple and shoulder. Relax the jaw.',
            partnerTip: 'Notice any asymmetry between sides without judgment.',
            target: 'Upper Back, Rhomboids, Rear Delts'
          },
          {
            name: '90/90 Hip Opener / Pigeon (Right Lead)',
            duration: 80,
            rest: 10,
            type: 'hips',
            instructions: 'Front shin at 90 degrees or folded in front. Walk hands forward over front knee.',
            partnerTip: 'Place a folded blanket or pillow under the hip if tight.',
            target: 'Glute Medius, Piriformis, Hip Capsule'
          },
          {
            name: '90/90 Hip Opener / Pigeon (Left Lead)',
            duration: 80,
            rest: 10,
            type: 'hips',
            instructions: 'Switch to left hip. Fold upper body forward over knee. Inhale peace, exhale tension.',
            partnerTip: 'Slow the heart rate with long, prolonged exhales.',
            target: 'Glute Medius, Piriformis, Hip Capsule'
          },
          {
            name: 'Supine Spinal Twist (Knees to Left)',
            duration: 80,
            rest: 10,
            type: 'back',
            instructions: 'Lie on back, open arms like wings (T-shape). Drop both knees to the left, look toward right hand.',
            partnerTip: 'Keep both shoulder blades pinned softly onto the floor mat.',
            target: 'Lumbar Spine, Obliques, Chest'
          },
          {
            name: 'Supine Spinal Twist (Knees to Right)',
            duration: 80,
            rest: 10,
            type: 'back',
            instructions: 'Gently shift knees over to the right side, turning head toward the left. Let gravity do all the work.',
            partnerTip: 'Feel the gentle release in the lower back and outer hip.',
            target: 'Lumbar Spine, Obliques, Chest'
          },
          {
            name: 'Happy Baby & Sacrum Rock',
            duration: 75,
            rest: 15,
            type: 'hips',
            instructions: 'Hold outside of feet or ankles. Draw knees down toward armpits. Gently rock side to side.',
            partnerTip: 'Massage your lower back and sacrum against the mat. Pure comfort.',
            target: 'Groin, Hamstrings, Lower Spine'
          }
        ]
      },
      {
        id: 'windDown',
        title: 'Wind-Down & Meditation',
        durationSec: 300, // 5 minutes
        color: '#ec4899', // Rose/Pink
        icon: 'Moon',
        description: 'Guided parasympathetic breathing and full body release before sleep.',
        exercises: [
          {
            name: '4-7-8 Parasympathetic Reset Breathing',
            duration: 90,
            rest: 10,
            type: 'breath',
            instructions: 'Inhale through nose for 4s, hold gently for 7s, exhale completely through mouth for 8s with a soft sigh.',
            partnerTip: 'Breathe together. This triggers the vagus nerve and shuts off stress hormones.',
            target: 'Nervous System, Heart Rate Lowering'
          },
          {
            name: 'Progressive Body Relaxation Scan',
            duration: 100,
            rest: 10,
            type: 'meditation',
            instructions: 'Mentally release forehead, unclench jaw, drop shoulders into the mat, relax belly, thighs, and toes.',
            partnerTip: 'Notice the sensation of warm heaviness sinking into the floor.',
            target: 'Deep Muscle Release, Mental Clarity'
          },
          {
            name: 'Savasana / Bedtime Drift Silence',
            duration: 90,
            rest: 0,
            type: 'sleep',
            instructions: 'Lie completely still beside each other. Palm facing up. Soft ambient chimes. You are ready for sleep.',
            partnerTip: 'When timer rings, quietly roll up your mats and crawl into bed.',
            target: 'Deep Rest, Sleep Transition'
          }
        ]
      }
    ]
  },
  {
    dayIndex: 1, // Monday
    dayName: 'Monday',
    title: 'Core Anchor & Lower Back Decompression',
    tagline: 'Start the week by stabilizing the core cylinder and erasing work-chair back tightness.',
    phases: [
      {
        id: 'strength',
        title: 'Strength Training',
        durationSec: 600,
        color: '#6366f1',
        icon: 'Flame',
        description: 'Core stabilization and posture reinforcement.',
        exercises: [
          {
            name: 'High Plank Shoulder Taps',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Feet hip-width apart. Tap left shoulder with right hand without twisting hips.',
            partnerTip: 'Keep hips dead steady like a table! Drop to knees if form wobbles.',
            target: 'Anti-Rotation Core, Shoulders'
          },
          {
            name: 'Forearm Plank with Knee Taps',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'From forearm plank, gently tap alternating knees to the mat without dropping hips.',
            partnerTip: 'Maintain neutral neck and smooth breathing.',
            target: 'Deep Transverse Core'
          },
          {
            name: 'Glute Bridge with 3-Second Hold',
            duration: 50,
            rest: 10,
            type: 'lower',
            instructions: 'Drive heels into mat, lift hips, squeeze glutes firmly for 3 count at the top.',
            partnerTip: 'Great counterbalance for hours of sitting during Monday.',
            target: 'Glutes, Lower Spine Support'
          },
          {
            name: 'Modified / Full Push-Ups',
            duration: 45,
            rest: 15,
            type: 'upper',
            instructions: 'Chest to mat level. Keep elbows at 45 degrees, avoid flaring out.',
            partnerTip: 'Quality over quantity. Knees down is 100% fine!',
            target: 'Chest, Core, Triceps'
          },
          {
            name: 'Bicycle Crunches (Tempo Controlled)',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Opposite elbow to knee slowly. Don’t pull on the neck.',
            partnerTip: 'Count a 2-second hold on each side together.',
            target: 'Obliques, Upper Abs'
          },
          {
            name: 'Superman Back Extensors',
            duration: 45,
            rest: 15,
            type: 'back',
            instructions: 'Lie face down. Lift chest and legs 2 inches off floor, hold 2s, lower with control.',
            partnerTip: 'Strengthens the posterior chain along the entire spine.',
            target: 'Erector Spinae, Rhomboids, Glutes'
          },
          {
            name: 'Side Plank Reach-Through (Right Side)',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Top arm reaches under ribcage, then reaches high toward ceiling.',
            partnerTip: 'Take your time. Kneeling modification works wonderfully.',
            target: 'Obliques, Serratus'
          },
          {
            name: 'Side Plank Reach-Through (Left Side)',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Switch sides. Lift hips and execute controlled reach under.',
            partnerTip: 'Keep breathing throughout the movement.',
            target: 'Obliques, Serratus'
          },
          {
            name: 'Russian Twists (Feet on Mat)',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Lean torso back 45 degrees, chest proud. Rotate shoulders left and right.',
            partnerTip: 'High-five each other’s hands in the middle if sitting facing one another!',
            target: 'Rotational Core, Transverse Abs'
          },
          {
            name: 'Static Bear Crawl Hold',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Hands under shoulders, knees under hips hovering 1 inch off the floor.',
            partnerTip: 'Final core hold! Shake out any tension when the bell rings.',
            target: 'Full Core, Quads, Shoulders'
          }
        ]
      },
      {
        id: 'mobility',
        title: 'Stretching & Mobility',
        durationSec: 900,
        color: '#8b5cf6',
        icon: 'Sparkles',
        description: 'Targeted spine decompression and hip flexor release.',
        exercises: [
          {
            name: 'Cat-Cow Flow & Rib Circles',
            duration: 75,
            rest: 15,
            type: 'spine',
            instructions: 'Roll spine through flexion, extension, and circular barrel rolls.',
            partnerTip: 'Let your head and neck hang loose when rounding.',
            target: 'Spine & Ribcage'
          },
          {
            name: 'Low Lunge Hip Flexor Stretch (Right)',
            duration: 75,
            rest: 15,
            type: 'hips',
            instructions: 'Right foot forward, left knee on mat. Sink hips down and forward, tucking pelvis.',
            partnerTip: 'Counteracts sitting posture by opening the front of the hip.',
            target: 'Psoas, Quads, Hip Flexors'
          },
          {
            name: 'Low Lunge Hip Flexor Stretch (Left)',
            duration: 75,
            rest: 15,
            type: 'hips',
            instructions: 'Step left foot forward, right knee grounded. Breathe space into the hip crease.',
            partnerTip: 'Raise right arm overhead for an added side-body stretch.',
            target: 'Psoas, Quads, Hip Flexors'
          },
          {
            name: 'Downward Facing Dog to Pedal Feet',
            duration: 75,
            rest: 15,
            type: 'back',
            instructions: 'Hips high, press through knuckles. Bend one knee, press opposite heel down.',
            partnerTip: 'Lengthen the lower spine. Bend knees as much as needed!',
            target: 'Hamstrings, Calves, Thoracic Spine'
          },
          {
            name: 'Cobra Pose to Child’s Pose Flow',
            duration: 80,
            rest: 10,
            type: 'back',
            instructions: 'Glide forward into gentle cobra, then press back onto heels in child’s pose.',
            partnerTip: 'Fluid wave motion with your breath.',
            target: 'Spinal Articulation'
          },
          {
            name: 'Seated Butterfly Forward Fold',
            duration: 80,
            rest: 10,
            type: 'hips',
            instructions: 'Soles of feet together, knees drop open. Softly fold over feet with rounded spine.',
            partnerTip: 'Release all tension in the inner thighs and lower back.',
            target: 'Adductors, Lumbar Spine'
          },
          {
            name: 'Thread the Needle Spinal Twist (Right)',
            duration: 75,
            rest: 15,
            type: 'shoulders',
            instructions: 'Right arm threads under body. Rest head and breathe into back ribs.',
            partnerTip: 'Feel the shoulder blades glide apart.',
            target: 'Upper Back, Rhomboids'
          },
          {
            name: 'Thread the Needle Spinal Twist (Left)',
            duration: 75,
            rest: 15,
            type: 'shoulders',
            instructions: 'Left arm threads under body. Let your neck fully relax.',
            partnerTip: 'Deep, calming breath in.',
            target: 'Upper Back, Rhomboids'
          },
          {
            name: 'Supine Knees-to-Chest Hug & Roll',
            duration: 75,
            rest: 15,
            type: 'back',
            instructions: 'Lie on back, hug knees into chest. Draw gentle circles with knees on ceiling.',
            partnerTip: 'Gentle self-massage for the lower back and sacrum.',
            target: 'Lower Back, Glutes'
          },
          {
            name: 'Supine Reclined Figure-Four Stretch',
            duration: 80,
            rest: 10,
            type: 'hips',
            instructions: 'Ankle over opposite knee, gently pull thigh toward chest (40s each side).',
            partnerTip: 'Unlocks piriformis and sciatica tension.',
            target: 'Piriformis, Outer Hips'
          }
        ]
      },
      {
        id: 'windDown',
        title: 'Wind-Down & Meditation',
        durationSec: 300,
        color: '#ec4899',
        icon: 'Moon',
        description: 'Night calming breath and mental stillness.',
        exercises: [
          {
            name: 'Box Breathing (4-4-4-4)',
            duration: 90,
            rest: 10,
            type: 'breath',
            instructions: 'Inhale 4s, hold full 4s, exhale 4s, hold empty 4s. Repeat in gentle rhythm.',
            partnerTip: 'Imagine tracing a calm square of light in your mind.',
            target: 'Nervous System Regulation'
          },
          {
            name: 'Full Body Wave Release',
            duration: 100,
            rest: 10,
            type: 'meditation',
            instructions: 'Scan from crown of head to toes. Let go of every to-do item for tomorrow.',
            partnerTip: 'Give yourselves credit for showing up on the mat tonight.',
            target: 'Mental Peace'
          },
          {
            name: 'Pre-Sleep Mat Silence',
            duration: 90,
            rest: 0,
            type: 'sleep',
            instructions: 'Rest heavy on the mat. Gentle ambient hum. Ready for dreamland.',
            partnerTip: 'Acknowledge your partner with a gentle smile or touch. Goodnight.',
            target: 'Sleep Induction'
          }
        ]
      }
    ]
  },
  {
    dayIndex: 2, // Tuesday
    dayName: 'Tuesday',
    title: 'Isometric Mat Stability & Torso Release',
    tagline: 'Build joint stability with low-impact isometrics, followed by soothing rotational mobility.',
    phases: [
      {
        id: 'strength',
        title: 'Strength Training',
        durationSec: 600,
        color: '#6366f1',
        icon: 'Flame',
        description: 'Isometric holds and core control.',
        exercises: [
          {
            name: 'Forearm Plank with Hip Dips',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Rotate hips side to side, lightly tapping towards the mat in plank.',
            partnerTip: 'Hold center if dips feel too intense — partner holds standard plank.',
            target: 'Obliques, Core Wall'
          },
          {
            name: 'Diamond Push-Up / Tricep Mat Push-Ups',
            duration: 45,
            rest: 15,
            type: 'upper',
            instructions: 'Hands closer together under chest. On knees or toes, keep elbows tight to ribs.',
            partnerTip: 'Focus on triceps and controlled descent.',
            target: 'Triceps, Upper Chest'
          },
          {
            name: 'Single-Leg Glute Bridge (Right Leg)',
            duration: 45,
            rest: 15,
            type: 'lower',
            instructions: 'Left leg straight in air or crossed, drive through right heel into bridge.',
            partnerTip: 'Even out hip height throughout the duration.',
            target: 'Right Glute, Hamstrings'
          },
          {
            name: 'Single-Leg Glute Bridge (Left Leg)',
            duration: 45,
            rest: 15,
            type: 'lower',
            instructions: 'Drive through left heel, lift hips evenly.',
            partnerTip: 'Feel the posterior chain firing up cleanly.',
            target: 'Left Glute, Hamstrings'
          },
          {
            name: 'Prone Cobra Lat & Upper Back Pulls',
            duration: 45,
            rest: 15,
            type: 'back',
            instructions: 'Lie on belly, hover chest, squeeze shoulder blades together and pull elbows back.',
            partnerTip: 'Strengthens posture muscles without any weights.',
            target: 'Rhomboids, Middle Traps'
          },
          {
            name: 'Forearm Plank Saw (Rock Forward & Back)',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'In forearm plank, shift weight forward over elbows onto tiptoes, then push back.',
            partnerTip: 'Rock in sync! If calves tire, hold steady.',
            target: 'Core, Shoulders, Calves'
          },
          {
            name: 'Flutter Kicks (Hands Under Sacrum)',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Press lower back into mat, flutter legs 6 inches above floor.',
            partnerTip: 'Raise legs higher (towards 45 degrees) if lower back arches.',
            target: 'Lower Abs, Hip Flexors'
          },
          {
            name: 'Side Plank Pulse (Right Side)',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Right forearm down. Dip hip 2 inches down and lift back up.',
            partnerTip: 'Static hold is a great partner option if tired.',
            target: 'Obliques, Glute Medius'
          },
          {
            name: 'Side Plank Pulse (Left Side)',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Left forearm down. Dip and lift with steady tempo.',
            partnerTip: 'Almost done with Tuesday strength!',
            target: 'Obliques, Glute Medius'
          },
          {
            name: 'Full Mat Hollow Hold Finisher',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Extend arms and legs, hold like a shallow banana boat. Lower back glued down.',
            partnerTip: 'Cheer each other to the final chime!',
            target: 'Core Bracing'
          }
        ]
      },
      {
        id: 'mobility',
        title: 'Stretching & Mobility',
        durationSec: 900,
        color: '#8b5cf6',
        icon: 'Sparkles',
        description: 'Open tight hips, shoulders, and middle back.',
        exercises: [
          {
            name: 'Puppy Pose (Heart Melting Pose)',
            duration: 80,
            rest: 10,
            type: 'back',
            instructions: 'Hips stay stacked over knees. Walk hands forward and drop forehead or chin to mat.',
            partnerTip: 'Deep thoracic spine release. Great for computer neck.',
            target: 'Thoracic Spine, Shoulders, Upper Chest'
          },
          {
            name: 'Sphinx Pose with Neck Rolls',
            duration: 80,
            rest: 10,
            type: 'spine',
            instructions: 'On forearms, gently roll chin to right shoulder, then through center to left shoulder.',
            partnerTip: 'Release daytime jaw and neck stiffness.',
            target: 'Cervical & Lumbar Spine'
          },
          {
            name: 'Wide-Knee Child’s Pose Side Reach',
            duration: 75,
            rest: 15,
            type: 'back',
            instructions: 'Walk hands to far right side for 40s, then cross over to left side for 40s.',
            partnerTip: 'Lengthen the intercostal muscles between ribs.',
            target: 'Lats, QL Muscle, Lower Back'
          },
          {
            name: 'Seated Spinal Twist (Right)',
            duration: 75,
            rest: 15,
            type: 'spine',
            instructions: 'Sit tall, bend right knee over left leg. Twist torso right, looking over shoulder.',
            partnerTip: 'Inhale to grow tall through the spine, exhale to gently rotate.',
            target: 'Spinal Rotators, Glutes'
          },
          {
            name: 'Seated Spinal Twist (Left)',
            duration: 75,
            rest: 15,
            type: 'spine',
            instructions: 'Switch legs: bend left knee over right, twist left with long spine.',
            partnerTip: 'Keep collarbones wide and open.',
            target: 'Spinal Rotators, Glutes'
          },
          {
            name: 'Half Frog Hip Stretch (Right)',
            duration: 75,
            rest: 15,
            type: 'hips',
            instructions: 'Lie on belly, bring right knee up 90 degrees out to the side. Rest head on hands.',
            partnerTip: 'One of the most relaxing hip openers before bed.',
            target: 'Inner Thigh, Hip Flexor'
          },
          {
            name: 'Half Frog Hip Stretch (Left)',
            duration: 75,
            rest: 15,
            type: 'hips',
            instructions: 'Switch: bring left knee out at 90 degrees. Sink into the floor.',
            partnerTip: 'Breathe softly into the pelvic bowl.',
            target: 'Inner Thigh, Hip Flexor'
          },
          {
            name: 'Supine Windshield Wipers',
            duration: 80,
            rest: 10,
            type: 'hips',
            instructions: 'Feet wide on mat edges. Drop both knees left, then right in continuous easy motion.',
            partnerTip: 'Internal and external hip rotation.',
            target: 'Hips, Lower Back'
          },
          {
            name: 'Reclined Bound Angle Pose (Supta Baddha Konasana)',
            duration: 80,
            rest: 10,
            type: 'hips',
            instructions: 'Lie on back, soles of feet together, knees splay wide. Hands resting on belly.',
            partnerTip: 'Feel the rhythm of your partner’s breathing beside you.',
            target: 'Groin, Pelvis, Lower Back'
          },
          {
            name: 'Gentle Legs-to-Chest Squeeze & Breathe',
            duration: 75,
            rest: 15,
            type: 'back',
            instructions: 'Wrap arms around shins. Tuck chin, take 3 deep sighs.',
            partnerTip: 'Release all lingering back effort.',
            target: 'Lumbar Decompression'
          }
        ]
      },
      {
        id: 'windDown',
        title: 'Wind-Down & Meditation',
        durationSec: 300,
        color: '#ec4899',
        icon: 'Moon',
        description: 'Night calming breath and mental stillness.',
        exercises: [
          {
            name: 'Resonant Coherence Breathing (5s In, 5s Out)',
            duration: 90,
            rest: 10,
            type: 'breath',
            instructions: 'Breathe in slowly for 5 seconds through nose. Breathe out smoothly for 5 seconds.',
            partnerTip: 'Harmonizes heart rate variability (HRV).',
            target: 'Vagal Nerve Activation'
          },
          {
            name: 'Mindful Tension Unloading',
            duration: 100,
            rest: 10,
            type: 'meditation',
            instructions: 'Give permission to the body to shut down for the night. No thinking required.',
            partnerTip: 'Let go of any thoughts of the workday.',
            target: 'Mental Quietude'
          },
          {
            name: 'Resting Nocturne Stillness',
            duration: 90,
            rest: 0,
            type: 'sleep',
            instructions: 'Lie flat, arms loose at sides. Float on the soundscape.',
            partnerTip: 'You completed today’s session together. Sweet dreams.',
            target: 'Deep Rest'
          }
        ]
      }
    ]
  },
  {
    dayIndex: 3, // Wednesday
    dayName: 'Wednesday',
    title: 'Midweek Core Strength & Shoulder Opening',
    tagline: 'Balance midweek fatigue with targeted core resilience and soothing upper spine mobility.',
    phases: [
      {
        id: 'strength',
        title: 'Strength Training',
        durationSec: 600,
        color: '#6366f1',
        icon: 'Flame',
        description: 'Core & upper body floor tone.',
        exercises: [
          {
            name: 'Forearm Plank with Alternating Reach',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'In forearm plank, slowly reach right arm forward, set down, reach left arm forward.',
            partnerTip: 'High-five in the center if you are facing each other!',
            target: 'Core Stability, Anti-Extension'
          },
          {
            name: 'Eccentric Slow Push-Ups',
            duration: 45,
            rest: 15,
            type: 'upper',
            instructions: 'Take 3 full seconds to lower chest to mat, press up normally. Use knees if needed.',
            partnerTip: 'Focus on control on the way down.',
            target: 'Chest, Anterior Delts'
          },
          {
            name: 'Dead Bug with Arm/Leg Press',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Opposite hand presses into opposite knee for isometric tension while extending other side.',
            partnerTip: 'Keep lower back glued to the floor.',
            target: 'Deep Core Bracing'
          },
          {
            name: 'Glute Bridge Marches',
            duration: 45,
            rest: 15,
            type: 'lower',
            instructions: 'Hold glute bridge high. Alternate lifting one foot 2 inches off floor without dropping hips.',
            partnerTip: 'Keep hands on hip bones to ensure they stay level.',
            target: 'Glutes, Lumbar Support'
          },
          {
            name: 'Bird-Dog with Elbow-to-Knee Crunch',
            duration: 50,
            rest: 10,
            type: 'core',
            instructions: 'Reach arm and leg, then crunch elbow to knee under torso. 25s each side.',
            partnerTip: 'Move with control and steady breath.',
            target: 'Posterior & Anterior Core'
          },
          {
            name: 'Prone Y-T-W Back Raises',
            duration: 45,
            rest: 15,
            type: 'back',
            instructions: 'On stomach: lift arms in Y shape (15s), T shape (15s), and W shape (15s).',
            partnerTip: 'Restores posture after slouching over desks or phones.',
            target: 'Lower Traps, Mid Traps, Rhomboids'
          },
          {
            name: 'Side Plank Star (Right Side)',
            duration: 40,
            rest: 20,
            type: 'core',
            instructions: 'Lift top leg slightly or keep grounded. Support on right forearm.',
            partnerTip: 'Keep hips pushed forward.',
            target: 'Obliques, Abductors'
          },
          {
            name: 'Side Plank Star (Left Side)',
            duration: 40,
            rest: 20,
            type: 'core',
            instructions: 'Lift onto left forearm, align shoulder over elbow.',
            partnerTip: 'Hold strong together.',
            target: 'Obliques, Abductors'
          },
          {
            name: 'Scissor Kicks on Mat',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Legs extended low, cross ankles over each other in scissor pattern.',
            partnerTip: 'Bend knees slightly if hip flexors pinch.',
            target: 'Lower Abs, Adductors'
          },
          {
            name: 'High Plank to Low Plank Flow',
            duration: 50,
            rest: 10,
            type: 'core',
            instructions: 'From high plank, lower to right elbow, left elbow, push back up to hands.',
            partnerTip: 'Final strength drill of Wednesday! Give it what you’ve got.',
            target: 'Full Core & Triceps'
          }
        ]
      },
      {
        id: 'mobility',
        title: 'Stretching & Mobility',
        durationSec: 900,
        color: '#8b5cf6',
        icon: 'Sparkles',
        description: 'Midweek spine recovery and shoulder de-stressing.',
        exercises: [
          {
            name: 'Cat-Cow with Breath Coordination',
            duration: 75,
            rest: 15,
            type: 'spine',
            instructions: 'Inhale arches the back, exhale tucks tailbone and rounds thoracic spine.',
            partnerTip: 'Match your partner’s breathing pace.',
            target: 'Spinal Mobility'
          },
          {
            name: 'Thread the Needle Flow (Right Side)',
            duration: 80,
            rest: 10,
            type: 'shoulders',
            instructions: 'Thread right arm under, then open right arm high to ceiling 3 times, then hold.',
            partnerTip: 'Opens chest and rotational spine.',
            target: 'Thoracic Mobility & Rhomboids'
          },
          {
            name: 'Thread the Needle Flow (Left Side)',
            duration: 80,
            rest: 10,
            type: 'shoulders',
            instructions: 'Thread left arm under, sweep high to ceiling, then hold on the mat.',
            partnerTip: 'Breathe deep into the back ribs.',
            target: 'Thoracic Mobility & Rhomboids'
          },
          {
            name: 'Seal Pose / Supported Cobra',
            duration: 75,
            rest: 15,
            type: 'spine',
            instructions: 'Hands wide on mat turned slightly outward, press up and straighten arms gently.',
            partnerTip: 'Keep pubic bone grounded. Soften belly completely.',
            target: 'Deep Spine Decompression'
          },
          {
            name: 'Child’s Pose with Tricep Overhead Stretch',
            duration: 80,
            rest: 10,
            type: 'shoulders',
            instructions: 'In child’s pose, bring palms together behind neck with elbows on floor.',
            partnerTip: 'Incredible stretch for triceps and upper back.',
            target: 'Triceps, Lats, Upper Spine'
          },
          {
            name: 'Kneeling Crescent Side Stretch (Right)',
            duration: 75,
            rest: 15,
            type: 'back',
            instructions: 'From knees, step right foot out, reach left arm overhead in a long side bend.',
            partnerTip: 'Opens the QL muscle (quadratus lumborum) that causes back ache.',
            target: 'QL, Lat, Intercostals'
          },
          {
            name: 'Kneeling Crescent Side Stretch (Left)',
            duration: 75,
            rest: 15,
            type: 'back',
            instructions: 'Step left foot out, reach right arm overhead in a deep arch.',
            partnerTip: 'Feel the ribs fan open like an accordion.',
            target: 'QL, Lat, Intercostals'
          },
          {
            name: 'Supine Eagle Leg Spinal Twist',
            duration: 80,
            rest: 10,
            type: 'back',
            instructions: 'Cross right thigh over left, drop knees to the left side. Arms in T-shape.',
            partnerTip: 'Adds deep stretch across the outer hip and IT band.',
            target: 'Glute Medius, IT Band, Lumbar'
          },
          {
            name: 'Supine Eagle Leg Spinal Twist (Switch)',
            duration: 80,
            rest: 10,
            type: 'back',
            instructions: 'Cross left thigh over right, drop knees to the right side.',
            partnerTip: 'Allow gravity to sink knees toward the mat.',
            target: 'Glute Medius, IT Band, Lumbar'
          },
          {
            name: 'Happy Baby Pose Relaxation',
            duration: 75,
            rest: 15,
            type: 'hips',
            instructions: 'Hold feet, let knees drop down. Gentle rocking.',
            partnerTip: 'Notice tension melting away from the lower back.',
            target: 'Groin & Lumbar Spine'
          }
        ]
      },
      {
        id: 'windDown',
        title: 'Wind-Down & Meditation',
        durationSec: 300,
        color: '#ec4899',
        icon: 'Moon',
        description: 'Night calming breath and mental stillness.',
        exercises: [
          {
            name: 'Extended Exhale Breathing (4 In, 8 Out)',
            duration: 90,
            rest: 10,
            type: 'breath',
            instructions: 'Gentle inhale for 4 counts, slow elongated exhale for 8 counts.',
            partnerTip: 'Long exhales stimulate the parasympathetic nervous system.',
            target: 'Stress Reduction'
          },
          {
            name: 'Gratitude Scan with Partner',
            duration: 100,
            rest: 10,
            type: 'meditation',
            instructions: 'Think of 2 simple things you are grateful for today while lying in calm.',
            partnerTip: 'You can share a word softly or keep it in your heart.',
            target: 'Emotional Well-Being'
          },
          {
            name: 'Savasana Rest & Mat Drift',
            duration: 90,
            rest: 0,
            type: 'sleep',
            instructions: 'Stillness on the floor. Body is loose and relaxed.',
            partnerTip: 'Turn off lights and transition straight to bed.',
            target: 'Deep Rest'
          }
        ]
      }
    ]
  },
  {
    dayIndex: 4, // Thursday
    dayName: 'Thursday',
    title: 'Posterior Chain Tone & Hamstring Release',
    tagline: 'Target glutes, hamstrings, and lower back to reverse daytime compression.',
    phases: [
      {
        id: 'strength',
        title: 'Strength Training',
        durationSec: 600,
        color: '#6366f1',
        icon: 'Flame',
        description: 'Glute and core chain strength.',
        exercises: [
          {
            name: 'Standard Forearm Plank',
            duration: 50,
            rest: 10,
            type: 'core',
            instructions: 'Solid plank posture. Glutes engaged, neck in line with spine.',
            partnerTip: 'Encourage each other to reach the 50-second mark!',
            target: 'Core & Stabilizers'
          },
          {
            name: 'Wide-Stance Mat Push-Ups',
            duration: 45,
            rest: 15,
            type: 'upper',
            instructions: 'Hands wider than shoulders. Focus on chest recruitment. Knees down as needed.',
            partnerTip: 'Go at a smooth 2-second rhythm.',
            target: 'Chest, Pectorals'
          },
          {
            name: 'Frog Pumps (Glute Bridges Soles Together)',
            duration: 50,
            rest: 10,
            type: 'lower',
            instructions: 'Soles of feet together, knees splayed open. Lift hips by squeezing glutes.',
            partnerTip: 'Burns glutes without placing strain on lower back!',
            target: 'Gluteus Medius & Maximus'
          },
          {
            name: 'Bird-Dog Holds with Pulse',
            duration: 50,
            rest: 10,
            type: 'core',
            instructions: 'Hold arm and leg extended, pulse 1 inch up and down for 25s each side.',
            partnerTip: 'Keep core firmly engaged so back does not over-arch.',
            target: 'Erector Spinae, Glutes'
          },
          {
            name: 'Prone Swimmers (Opposite Arm/Leg Lift)',
            duration: 45,
            rest: 15,
            type: 'back',
            instructions: 'Lie on belly, flutter opposite arm and leg in rhythmic swimming motion.',
            partnerTip: 'Keep gaze down at mat to protect neck.',
            target: 'Posterior Chain'
          },
          {
            name: 'Reverse Plank / Table-Top Hold',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Hands behind hips, lift hips up into reverse tabletop. Squeeze glutes.',
            partnerTip: 'Opens the front of the shoulders while strengthening glutes.',
            target: 'Hamstrings, Glutes, Front Delts'
          },
          {
            name: 'Side Plank with Hip Lift (Right Side)',
            duration: 40,
            rest: 20,
            type: 'core',
            instructions: 'Lift hips high on right forearm. Solid straight line.',
            partnerTip: 'Partner can do bottom knee bent to scale perfectly.',
            target: 'Obliques'
          },
          {
            name: 'Side Plank with Hip Lift (Left Side)',
            duration: 40,
            rest: 20,
            type: 'core',
            instructions: 'Lift onto left forearm. Steady breathing.',
            partnerTip: 'Keep head aligned with spine.',
            target: 'Obliques'
          },
          {
            name: 'Bicycle Crunches (Slow Burn)',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Turn ribcage towards opposite knee. 3-second pause per repetition.',
            partnerTip: 'Work at a shared slow tempo.',
            target: 'Obliques, Abs'
          },
          {
            name: 'High Plank Mountain Climber Taps',
            duration: 50,
            rest: 10,
            type: 'core',
            instructions: 'Slowly bring knee toward chest in high plank, pause, step back. Alternate.',
            partnerTip: 'Final strength interval! Keep hips from piking up high.',
            target: 'Core, Hip Flexors'
          }
        ]
      },
      {
        id: 'mobility',
        title: 'Stretching & Mobility',
        durationSec: 900,
        color: '#8b5cf6',
        icon: 'Sparkles',
        description: 'Deep hamstring, spine, and lower back relief.',
        exercises: [
          {
            name: 'Cat-Cow Flow & Tail Wags',
            duration: 75,
            rest: 15,
            type: 'spine',
            instructions: 'Arch and round, gently shifting hips side to side like wagging a tail.',
            partnerTip: 'Releases side lower back tension.',
            target: 'Full Spine'
          },
          {
            name: 'Half Kneeling Hamstring Stretch (Right)',
            duration: 75,
            rest: 15,
            type: 'hips',
            instructions: 'Right leg straight in front, flex toes up. Hinge at hips and fold over leg.',
            partnerTip: 'Keep back flat rather than rounding into the chest.',
            target: 'Hamstrings, Calves'
          },
          {
            name: 'Half Kneeling Hamstring Stretch (Left)',
            duration: 75,
            rest: 15,
            type: 'hips',
            instructions: 'Left leg straight, flex toes toward face. Hinge forward from hips.',
            partnerTip: 'Take 4 long, relaxing breaths.',
            target: 'Hamstrings, Calves'
          },
          {
            name: 'Downward Dog with Heel Drops',
            duration: 75,
            rest: 15,
            type: 'back',
            instructions: 'Press back onto balls of feet, press chest toward thighs, pedal heels.',
            partnerTip: 'Great decompression for lumbar vertebra.',
            target: 'Posterior Chain'
          },
          {
            name: 'Cobra to Child’s Pose Waves',
            duration: 80,
            rest: 10,
            type: 'spine',
            instructions: 'Flow between prone cobra and extended child’s pose.',
            partnerTip: 'Breathe out when sinking back into child’s pose.',
            target: 'Spine Decompression'
          },
          {
            name: 'Seated Wide Straddle Fold',
            duration: 80,
            rest: 10,
            type: 'hips',
            instructions: 'Legs in comfortable V shape on mat. Walk hands forward and fold.',
            partnerTip: 'You can hold hands across from each other for a gentle shared stretch!',
            target: 'Groin, Hamstrings, Lower Spine'
          },
          {
            name: 'Lying Spinal Twist with Knee Stack (Left)',
            duration: 80,
            rest: 10,
            type: 'back',
            instructions: 'Stack knees and drop to left. Turn head right, breathing easy.',
            partnerTip: 'Let shoulders sink into mat.',
            target: 'Thoracolumbar Fascia'
          },
          {
            name: 'Lying Spinal Twist with Knee Stack (Right)',
            duration: 80,
            rest: 10,
            type: 'back',
            instructions: 'Stack knees and drop to right. Turn head left.',
            partnerTip: 'Feel chest open wide.',
            target: 'Thoracolumbar Fascia'
          },
          {
            name: 'Supine Bridge to Mat Roll Down',
            duration: 75,
            rest: 15,
            type: 'spine',
            instructions: 'Lift to bridge, then articulate spine vertebrae by vertebrae back to mat.',
            partnerTip: 'Like unrolling a bead necklace onto the floor.',
            target: 'Spinal Articulation'
          },
          {
            name: 'Happy Baby Pose Hold',
            duration: 80,
            rest: 10,
            type: 'hips',
            instructions: 'Grab outer edges of feet, relax hips, breathe deeply.',
            partnerTip: 'Sink into comfort.',
            target: 'Lower Back & Hips'
          }
        ]
      },
      {
        id: 'windDown',
        title: 'Wind-Down & Meditation',
        durationSec: 300,
        color: '#ec4899',
        icon: 'Moon',
        description: 'Night calming breath and mental stillness.',
        exercises: [
          {
            name: '4-7-8 Deep Sleep Breathing',
            duration: 90,
            rest: 10,
            type: 'breath',
            instructions: 'Inhale 4s, hold 7s, long whispering exhale for 8s.',
            partnerTip: 'Breathe together to sync resting pulses.',
            target: 'Autonomic Nervous System'
          },
          {
            name: 'Body Lightness Visualization',
            duration: 100,
            rest: 10,
            type: 'meditation',
            instructions: 'Picture physical stress evaporating like steam into the night air.',
            partnerTip: 'Feel the quiet of the bedroom.',
            target: 'Mental Relaxation'
          },
          {
            name: 'Nocturne Bedtime Drift',
            duration: 90,
            rest: 0,
            type: 'sleep',
            instructions: 'Total stillness. The session is complete.',
            partnerTip: 'Gently transition to the bed.',
            target: 'Rest'
          }
        ]
      }
    ]
  },
  {
    dayIndex: 5, // Friday
    dayName: 'Friday',
    title: 'Dynamic Floor Flow & Spine Freedom',
    tagline: 'Shake off the work week with core endurance and expansive rotational mat stretches.',
    phases: [
      {
        id: 'strength',
        title: 'Strength Training',
        durationSec: 600,
        color: '#6366f1',
        icon: 'Flame',
        description: 'Energizing mat strength to cap off the week.',
        exercises: [
          {
            name: 'High Plank to Forearm Plank Transitions',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Step down to elbows, push back up to hands. Switch lead arm halfway.',
            partnerTip: 'Drop to knees if shoulders fatigue. Partner holds standard plank.',
            target: 'Full Core, Triceps, Delts'
          },
          {
            name: 'Kneeling / Standard Tempo Push-Ups',
            duration: 45,
            rest: 15,
            type: 'upper',
            instructions: 'Smooth, unbroken push-ups. Chest to mat level, tight core.',
            partnerTip: 'Count reps together or cheer each other on!',
            target: 'Chest, Arms, Core'
          },
          {
            name: 'Dead Bug with Extended Hold',
            duration: 50,
            rest: 10,
            type: 'core',
            instructions: 'Hold each extension for 4 seconds before switching. Keep low back glued.',
            partnerTip: 'Maintain flat spine against floor.',
            target: 'Transverse Abdominis'
          },
          {
            name: 'Glute Bridge with Pulses at Top',
            duration: 50,
            rest: 10,
            type: 'lower',
            instructions: 'Hold high bridge, pulse top 2 inches for the entire set.',
            partnerTip: 'Feel the glutes work together!',
            target: 'Glutes & Hamstrings'
          },
          {
            name: 'Bird-Dog Cross Reaches',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Touch opposite elbow to knee, extend, switch sides smoothly.',
            partnerTip: 'Keep hips level throughout.',
            target: 'Erector Spinae & Core'
          },
          {
            name: 'Prone Cobra Holds with Scapular Squeeze',
            duration: 45,
            rest: 15,
            type: 'back',
            instructions: 'Lift chest and arms, squeeze shoulder blades back for 5-second holds.',
            partnerTip: 'Opens chest while strengthening posture muscles.',
            target: 'Upper Back & Rhomboids'
          },
          {
            name: 'Side Plank with Knee-to-Elbow (Right Side)',
            duration: 40,
            rest: 20,
            type: 'core',
            instructions: 'Hold side plank, pull top knee toward top elbow and extend.',
            partnerTip: 'Modify with bottom knee down on mat.',
            target: 'Obliques & Core'
          },
          {
            name: 'Side Plank with Knee-to-Elbow (Left Side)',
            duration: 40,
            rest: 20,
            type: 'core',
            instructions: 'Switch sides. Focus on balance and breath.',
            partnerTip: 'Smile at your partner — weekend is here!',
            target: 'Obliques & Core'
          },
          {
            name: 'Lying Leg Raises with Hip Lift',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Raise straight legs to 90 degrees, give a small 1-inch hip pulse off mat.',
            partnerTip: 'Hands under hips to support lower back.',
            target: 'Lower Abs'
          },
          {
            name: 'Bear Plank Static Hold Finisher',
            duration: 50,
            rest: 10,
            type: 'core',
            instructions: 'Hover knees 1 inch off mat on hands and toes. Hold like a statue!',
            partnerTip: 'Finish the strength section strong together!',
            target: 'Full Body Stability'
          }
        ]
      },
      {
        id: 'mobility',
        title: 'Stretching & Mobility',
        durationSec: 900,
        color: '#8b5cf6',
        icon: 'Sparkles',
        description: 'Weekend unwinding, spine twists, and hip releases.',
        exercises: [
          {
            name: 'Cat-Cow into Child’s Pose Wave',
            duration: 75,
            rest: 15,
            type: 'spine',
            instructions: 'Continuous fluid flow: Cow, Cat, glide back into Child’s pose, return to table.',
            partnerTip: 'Move like calm ocean waves.',
            target: 'Full Spine'
          },
          {
            name: 'Cobra Pose to Sphinx Pose',
            duration: 80,
            rest: 10,
            type: 'spine',
            instructions: 'Press into Cobra for 3 breaths, lower to forearms in Sphinx. Breathe deep into belly.',
            partnerTip: 'Counteracts all sitting from the week.',
            target: 'Spinal Extension'
          },
          {
            name: 'Thread the Needle Long Rest (Right)',
            duration: 80,
            rest: 10,
            type: 'shoulders',
            instructions: 'Rest deep into right shoulder and temple on mat.',
            partnerTip: 'Close eyes and let upper back unspool.',
            target: 'Upper Back & Neck'
          },
          {
            name: 'Thread the Needle Long Rest (Left)',
            duration: 80,
            rest: 10,
            type: 'shoulders',
            instructions: 'Rest deep into left shoulder. Release tension in face.',
            partnerTip: 'Deep, slow belly breaths.',
            target: 'Upper Back & Neck'
          },
          {
            name: 'Pigeon / 90-90 Hip Stretch (Right Lead)',
            duration: 80,
            rest: 10,
            type: 'hips',
            instructions: 'Fold forward over right shin. Relax forehead on hands.',
            partnerTip: 'Allow hip joints to release completely.',
            target: 'Glutes, Hip Rotators'
          },
          {
            name: 'Pigeon / 90-90 Hip Stretch (Left Lead)',
            duration: 80,
            rest: 10,
            type: 'hips',
            instructions: 'Fold forward over left shin. Sink into comfort.',
            partnerTip: 'Feel the hip tightness dissipate.',
            target: 'Glutes, Hip Rotators'
          },
          {
            name: 'Seated Torso Circles & Side Bends',
            duration: 75,
            rest: 15,
            type: 'spine',
            instructions: 'Cross-legged, circle torso smoothly, then reach arms overhead side to side.',
            partnerTip: 'Gentle, soothing movement.',
            target: 'Spine & Ribcage'
          },
          {
            name: 'Supine Deep Spinal Twist (Left)',
            duration: 80,
            rest: 10,
            type: 'back',
            instructions: 'Drop knees left, turn head right. Arms outstretched.',
            partnerTip: 'Heavy, sinking relaxation.',
            target: 'Lumbar Spine'
          },
          {
            name: 'Supine Deep Spinal Twist (Right)',
            duration: 80,
            rest: 10,
            type: 'back',
            instructions: 'Drop knees right, turn head left.',
            partnerTip: 'Let go of any remaining physical effort.',
            target: 'Lumbar Spine'
          },
          {
            name: 'Happy Baby & Sacrum Rocks',
            duration: 75,
            rest: 15,
            type: 'hips',
            instructions: 'Hold feet, knees wide, rock slowly on lower back.',
            partnerTip: 'Feel the support of the floor mat.',
            target: 'Hips & Sacrum'
          }
        ]
      },
      {
        id: 'windDown',
        title: 'Wind-Down & Meditation',
        durationSec: 300,
        color: '#ec4899',
        icon: 'Moon',
        description: 'Night calming breath and mental stillness.',
        exercises: [
          {
            name: 'Box Breathing Relaxation (4-4-4-4)',
            duration: 90,
            rest: 10,
            type: 'breath',
            instructions: 'Inhale 4, hold 4, exhale 4, pause 4.',
            partnerTip: 'Sync your breathing in rhythm.',
            target: 'Parasympathetic Reset'
          },
          {
            name: 'Body Melting Meditation',
            duration: 100,
            rest: 10,
            type: 'meditation',
            instructions: 'Feel muscles softening from jaw, shoulders, spine down to heels.',
            partnerTip: 'The week is done. Total calm.',
            target: 'Mental Tranquility'
          },
          {
            name: 'Night Silence on Mat',
            duration: 90,
            rest: 0,
            type: 'sleep',
            instructions: 'Pure quiet or soft ambient music. Sleep awaits.',
            partnerTip: 'Ready to turn off the light.',
            target: 'Sleep Induction'
          }
        ]
      }
    ]
  },
  {
    dayIndex: 6, // Saturday
    dayName: 'Saturday',
    title: 'Deep Restoration & Lumbar Relief',
    tagline: 'Gentle strength stabilization followed by prolonged, luxurious back and hip opening.',
    phases: [
      {
        id: 'strength',
        title: 'Strength Training',
        durationSec: 600,
        color: '#6366f1',
        icon: 'Flame',
        description: 'Gentle posture-reinforcing isometric strength.',
        exercises: [
          {
            name: 'Forearm Plank Breath Sync',
            duration: 50,
            rest: 10,
            type: 'core',
            instructions: 'Hold solid plank while counting 8 long breaths.',
            partnerTip: 'Hold together. If knees drop, resume when ready.',
            target: 'Core & Shoulders'
          },
          {
            name: 'Kneeling Slow Push-Ups',
            duration: 45,
            rest: 15,
            type: 'upper',
            instructions: 'Controlled reps on knees. Feel chest and upper back work in synergy.',
            partnerTip: 'Keep neck relaxed and gaze between thumbs.',
            target: 'Chest, Arms'
          },
          {
            name: 'Glute Bridge Holds with Knee Squeeze',
            duration: 50,
            rest: 10,
            type: 'lower',
            instructions: 'Hold bridge, squeeze knees together (or squeeze a cushion between knees).',
            partnerTip: 'Activates adductors and pelvic stability.',
            target: 'Glutes, Adductors'
          },
          {
            name: 'Dead Bug Precision Hold',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Slow alternating extensions. Exhale as arm and leg lower.',
            partnerTip: 'Slow tempo creates the best core stimulus.',
            target: 'Transverse Core'
          },
          {
            name: 'Prone Back Extensions with Arm Sweep',
            duration: 45,
            rest: 15,
            type: 'back',
            instructions: 'Lie on belly, hover chest, sweep arms like making snow angels.',
            partnerTip: 'Strengthens mid back and scapular retraction.',
            target: 'Rhomboids, Lats'
          },
          {
            name: 'Bird-Dog Stability Holds (Right Side)',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Extend right arm and left leg, hold for full 45 seconds steady.',
            partnerTip: 'Breathe evenly without holding breath.',
            target: 'Posterior Cross-Chain'
          },
          {
            name: 'Bird-Dog Stability Holds (Left Side)',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Extend left arm and right leg, hold for full 45 seconds.',
            partnerTip: 'Notice balance improving week over week.',
            target: 'Posterior Cross-Chain'
          },
          {
            name: 'Side Plank Static Hold (Right)',
            duration: 40,
            rest: 20,
            type: 'core',
            instructions: 'Right forearm down, lift hips into straight line.',
            partnerTip: 'Knees bent modification is wonderful.',
            target: 'Obliques'
          },
          {
            name: 'Side Plank Static Hold (Left)',
            duration: 40,
            rest: 20,
            type: 'core',
            instructions: 'Left forearm down, lift hips.',
            partnerTip: 'Almost ready for the luxurious stretching block!',
            target: 'Obliques'
          },
          {
            name: 'Hollow Boat to Tuck Flow',
            duration: 45,
            rest: 15,
            type: 'core',
            instructions: 'Alternate between hollow body hold (3s) and hugging knees into tuck (2s).',
            partnerTip: 'Final strength exercise of Saturday routine!',
            target: 'Core Wall'
          }
        ]
      },
      {
        id: 'mobility',
        title: 'Stretching & Mobility',
        durationSec: 900,
        color: '#8b5cf6',
        icon: 'Sparkles',
        description: 'Restorative hip and spine renewal.',
        exercises: [
          {
            name: 'Slow Cat-Cow Spinal Meditation',
            duration: 80,
            rest: 10,
            type: 'spine',
            instructions: 'Slowest cat-cow of the week. 6 seconds per arch, 6 seconds per round.',
            partnerTip: 'Feel each spinal disc hydrate and lengthen.',
            target: 'Spine'
          },
          {
            name: 'Extended Child’s Pose with Wide Knees',
            duration: 80,
            rest: 10,
            type: 'back',
            instructions: 'Hips onto heels, forehead on floor. Arms stretched long in front.',
            partnerTip: 'Sink into profound relaxation.',
            target: 'Lats, Lower Back'
          },
          {
            name: 'Thread the Needle Deep Hold (Right)',
            duration: 80,
            rest: 10,
            type: 'shoulders',
            instructions: 'Slide right arm through, relax into mat for full duration.',
            partnerTip: 'Let go of shoulder tension.',
            target: 'Upper Back'
          },
          {
            name: 'Thread the Needle Deep Hold (Left)',
            duration: 80,
            rest: 10,
            type: 'shoulders',
            instructions: 'Slide left arm through, surrender weight to the floor.',
            partnerTip: 'Breathe into back ribs.',
            target: 'Upper Back'
          },
          {
            name: 'Sphinx Pose with Heart Melting Lift',
            duration: 80,
            rest: 10,
            type: 'spine',
            instructions: 'Forearms on mat, pull chest forward through shoulders.',
            partnerTip: 'Keep lower back completely relaxed.',
            target: 'Lumbar Decompression'
          },
          {
            name: 'Butterfly Fold with Rounded Spine',
            duration: 80,
            rest: 10,
            type: 'hips',
            instructions: 'Soles together, fold over gently like a sleeping butterfly.',
            partnerTip: 'Rest your forehead on your hands or a pillow.',
            target: 'Hips & Lower Back'
          },
          {
            name: 'Seated Spinal Twist (Right)',
            duration: 75,
            rest: 15,
            type: 'spine',
            instructions: 'Twist right, long spine, soft gaze over back shoulder.',
            partnerTip: 'Gentle rotation for spine health.',
            target: 'Spinal Rotators'
          },
          {
            name: 'Seated Spinal Twist (Left)',
            duration: 75,
            rest: 15,
            type: 'spine',
            instructions: 'Twist left, long spine, deep belly breaths.',
            partnerTip: 'Even out the sides.',
            target: 'Spinal Rotators'
          },
          {
            name: 'Supine Reclined Spinal Twist (Both Sides)',
            duration: 80,
            rest: 10,
            type: 'back',
            instructions: 'Lie on back, let knees rest softly to side, arms open wide. 40s each side.',
            partnerTip: 'Total spine release.',
            target: 'Lower Back'
          },
          {
            name: 'Knees to Chest Hug & Rock',
            duration: 80,
            rest: 10,
            type: 'back',
            instructions: 'Hug knees tight to chest, gentle side-to-side rocking massage.',
            partnerTip: 'Pure comfort.',
            target: 'Lower Back, Sacrum'
          }
        ]
      },
      {
        id: 'windDown',
        title: 'Wind-Down & Meditation',
        durationSec: 300,
        color: '#ec4899',
        icon: 'Moon',
        description: 'Night calming breath and mental stillness.',
        exercises: [
          {
            name: '4-7-8 Deep Sleep Breathing',
            duration: 90,
            rest: 10,
            type: 'breath',
            instructions: 'Inhale 4s, hold 7s, exhale 8s with relaxed mouth.',
            partnerTip: 'Deep, sleepy rhythm.',
            target: 'Nervous System Calming'
          },
          {
            name: 'Progressive Body Relaxation',
            duration: 100,
            rest: 10,
            type: 'meditation',
            instructions: 'Let forehead, jaw, hands, and feet sink into the mat.',
            partnerTip: 'Rest together.',
            target: 'Muscular Release'
          },
          {
            name: 'Saturday Night Savasana',
            duration: 90,
            rest: 0,
            type: 'sleep',
            instructions: 'Soft chimes and stillness. Done for the night.',
            partnerTip: 'Transition quietly into bed.',
            target: 'Deep Rest'
          }
        ]
      }
    ]
  }
];

// Helper to get today's routine
export function getRoutineForDay(dayIndex = new Date().getDay()) {
  const routine = WEEKLY_ROUTINES.find(r => r.dayIndex === dayIndex) || WEEKLY_ROUTINES[0];
  return routine;
}

// Calculate total duration of a routine
export function getRoutineTotalDuration(routine) {
  let total = 0;
  for (const phase of routine.phases) {
    for (const ex of phase.exercises) {
      total += (ex.duration + (ex.rest || 0));
    }
  }
  return total; // in seconds
}
