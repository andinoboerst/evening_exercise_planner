// 30-Minute Bedtime Floor Mat Routines for Couples
// Unhurried, Calming Pacing:
// Phase 1: Strength Training (10 minutes / 600s) — 5 sustained 2-minute mat exercises (95s hold + 25s rest/transition)
// Phase 2: Stretching & Mobility (15 minutes / 900s) — 5 restorative 3-minute deep stretches (155s hold + 25s transition)
// Phase 3: Wind Down & Meditation (5 minutes / 300s) — 2 calming 2.5-minute relaxation stages (135s / 150s)

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
        color: '#6366f1',
        icon: 'Flame',
        description: 'Unhurried core activation to release physical restlessness before sleep.',
        exercises: [
          {
            name: 'Mindful Forearm Plank & Deep Breathing',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'Elbows under shoulders, engage glutes and draw belly button gently to spine. Breathe rhythmically into ribs. Drop knees anytime if needed without breaking rhythm.',
            partnerTip: 'Mat side-by-side. If either reaches fatigue first, rest into child’s pose while your partner finishes the interval — no stress!',
            target: 'Transverse Abdominis, Shoulder Stabilizers'
          },
          {
            name: 'Flowing Bird-Dog (Alternating Slowly)',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'From hands and knees, smoothly reach opposite arm and leg parallel to the mat. Hold 3 seconds at extension, slowly return and switch sides.',
            partnerTip: 'Match each other’s tempo: slow, deliberate extensions with hips staying level to the floor.',
            target: 'Erector Spinae, Glutes, Deep Core'
          },
          {
            name: 'Glute Bridge Isometric Hold & Pulses',
            duration: 95,
            rest: 25,
            type: 'lower',
            instructions: 'Lie on back, drive heels into mat, lift hips and squeeze glutes. Hold for 30s, perform 10 gentle micro-pulses, then hold again. Keep lower back neutral.',
            partnerTip: 'Keep hands relaxed beside you. Focus on engaging the glutes and hamstrings to support the lumbar spine.',
            target: 'Glutes, Hamstrings, Lumbar Stability'
          },
          {
            name: 'Kneeling Mat Push-Ups & Chest Release',
            duration: 95,
            rest: 25,
            type: 'upper',
            instructions: 'Hands slightly wider than shoulders. Lower chest slowly in 3 seconds, pause for 1 second, press up smoothly. Rest in child’s pose whenever needed.',
            partnerTip: 'Go at your own pace. If 5 push-ups feels great, do 5 and hold an isometric plank hold for the remainder.',
            target: 'Pectorals, Triceps, Anterior Core'
          },
          {
            name: 'Supine Dead Bug & Transverse Anchor',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'Lie on back with arms extended up and knees at 90 degrees. Press lower back flat into mat while alternating slow arm/leg extensions.',
            partnerTip: 'The slower you move, the deeper the deep abdominal stabilizers activate. Keep your neck relaxed on the floor.',
            target: 'Transverse Abdominis, Pelvic Floor'
          }
        ]
      },
      {
        id: 'mobility',
        title: 'Stretching & Mobility',
        durationSec: 900, // 15 minutes
        color: '#8b5cf6',
        icon: 'Sparkles',
        description: 'Deep, spacious stretches to unwind spine and hip tension accumulated from daytime sitting.',
        exercises: [
          {
            name: 'Synchronized Cat-Cow Waves to Child’s Pose',
            duration: 155,
            rest: 25,
            type: 'spine',
            instructions: 'Flow between rolling Cat-Cow spinal ripples and sinking back into a wide Child’s Pose. Inhale to open heart, exhale to round spine and melt hips back to heels.',
            partnerTip: 'Sync your breathing together. Take full, prolonged exhales as your hips reach your heels.',
            target: 'Full Spine Flexion & Extension, Latissimus Dorsi'
          },
          {
            name: 'Sphinx Pose into Gentle Seal Decompression',
            duration: 155,
            rest: 25,
            type: 'spine',
            instructions: 'Lie on belly, forearms on mat with elbows under shoulders. Pull heart forward between collarbones. Soften glutes and let belly expand into the mat.',
            partnerTip: 'A deeply restorative posture for counteracting daytime chair slouching. Rest forehead on hands if lower back asks for ease.',
            target: 'Thoracic Extension, Abdominal Wall, Lumbar Discs'
          },
          {
            name: 'Lying Supine Spinal Twist Flow (Both Sides)',
            duration: 155,
            rest: 25,
            type: 'back',
            instructions: 'Lie on back, open arms like wings (T-shape). Gently guide knees to the right for 75s, then draw knees through center and sink to the left for 75s.',
            partnerTip: 'Keep both shoulder blades pinned softly onto the floor mat. Close your eyes and feel your ribcage soften.',
            target: 'Lumbar Spine, Obliques, Chest & Shoulders'
          },
          {
            name: 'Reclined Figure-4 Piriformis & Hip Opener',
            duration: 155,
            rest: 25,
            type: 'hips',
            instructions: 'Cross right ankle over left thigh, thread hands behind left hamstring. Spend 75s melting into the outer right hip, then gently switch to the left side for 75s.',
            partnerTip: 'Keep your head and shoulders resting comfortably on the mat. Use a pillow under your head if desired.',
            target: 'Piriformis, Glute Medius, Deep Hip Rotators'
          },
          {
            name: 'Reclined Butterfly & Lower Back Melting',
            duration: 155,
            rest: 25,
            type: 'hips',
            instructions: 'Lie on back, bring soles of feet together, let knees fall open wide like butterfly wings. Place one hand on belly, one on heart. Let gravity do all the work.',
            partnerTip: 'Feel your partner’s calm presence beside you. Allow all residual tightness in your groin and lower back to dissolve.',
            target: 'Adductors, Sacroiliac Joint, Diaphragm'
          }
        ]
      },
      {
        id: 'windDown',
        title: 'Wind-Down & Meditation',
        durationSec: 300, // 5 minutes
        color: '#ec4899',
        icon: 'Moon',
        description: 'Guided parasympathetic breathing and full body release before sleep.',
        exercises: [
          {
            name: '4-7-8 Parasympathetic Vagus Nerve Breathing',
            duration: 135,
            rest: 15,
            type: 'breath',
            instructions: 'Inhale silently through nose for 4 seconds, gently hold breath for 7 seconds, exhale completely through mouth for 8 seconds with a soft release.',
            partnerTip: 'Breathe together in unison. This extended exhale tells your brain that you are completely safe and ready for deep rest.',
            target: 'Autonomic Nervous System, Heart Rate Lowering'
          },
          {
            name: 'Savasana / Bedtime Drift Silence',
            duration: 150,
            rest: 0,
            type: 'sleep',
            instructions: 'Lie flat on your backs, palms facing upward, feet rolling naturally outward. Let your eyes close. Soft ambient chimes. You are ready for sleep.',
            partnerTip: 'When timer rings, quietly roll up your mats and crawl into bed. Sleep deeply tonight.',
            target: 'Full Body Heaviness, Delta Wave Sleep Transition'
          }
        ]
      }
    ]
  },
  {
    dayIndex: 1, // Monday
    dayName: 'Monday',
    title: 'Spine Decompression & Posture Realignment',
    tagline: 'Counteract desk-sitting posture, release upper back knots, and restore spinal alignment.',
    phases: [
      {
        id: 'strength',
        title: 'Strength Training',
        durationSec: 600,
        color: '#6366f1',
        icon: 'Flame',
        description: 'Grounding posterior chain and upper back posture strengthening.',
        exercises: [
          {
            name: 'Prone Cobra & Scapular Squeeze Holds',
            duration: 95,
            rest: 25,
            type: 'back',
            instructions: 'Lie face down, arms by sides palms down. Peel chest off mat, rotate thumbs toward ceiling, squeeze shoulder blades together for 5s holds, lower gently, repeat.',
            partnerTip: 'Keep gaze on the floor so back of neck stays long and relaxed.',
            target: 'Rhomboids, Lower Traps, Erector Spinae'
          },
          {
            name: 'High Plank to Downward Dog Pedaling Flow',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'Hold high plank for 5 seconds, press hips up and back into Downward Dog, pedal heels to open calves and hamstrings for 5 seconds, flow back to plank.',
            partnerTip: 'Take your time in Downward Dog — press the mat away to open shoulders.',
            target: 'Core, Shoulder Girdle, Hamstrings'
          },
          {
            name: 'Alternating Quadruped Bird-Dog Balance',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'Hands and knees on mat. Extend opposite arm and leg, hold for a slow 3-count, touch elbow to knee under torso, extend once more, then switch sides.',
            partnerTip: 'Focus on absolute stillness in the torso as limbs move smoothly.',
            target: 'Deep Core, Posterior Chain, Balance'
          },
          {
            name: 'Slow Eccentric Push-Up & Mat Chest Hold',
            duration: 95,
            rest: 25,
            type: 'upper',
            instructions: 'From knees or toes, lower chest over 4 slow seconds down to the mat. Rest chest completely for 1 second, then press back up. Rest in child’s pose as needed.',
            partnerTip: 'Celebrate consistency over intensity. Slow control builds resilient joints.',
            target: 'Pectorals, Anterior Deltoids, Core'
          },
          {
            name: 'Hollow Body Soft-Tuck Isometric Hold',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'Lie on back, press lumbar spine firmly into the floor. Lift shoulder blades and hug knees to chest or extend legs slightly if comfortable. Hold and breathe.',
            partnerTip: 'Whenever lower back wants to arch, tuck knees closer to chest to protect the spine.',
            target: 'Rectus Abdominis, Hip Flexors'
          }
        ]
      },
      {
        id: 'mobility',
        title: 'Stretching & Mobility',
        durationSec: 900,
        color: '#8b5cf6',
        icon: 'Sparkles',
        description: 'Restorative thoracic spine and shoulder opening.',
        exercises: [
          {
            name: 'Melting Heart (Anahatasana) & Thoracic Opener',
            duration: 155,
            rest: 25,
            type: 'shoulders',
            instructions: 'From table-top, keep hips stacked above knees, walk hands forward and melt chest and forehead toward the mat. Feel spacious opening across armpits.',
            partnerTip: 'Place a soft pillow under chest if shoulders are tight. Let heart sink down.',
            target: 'Thoracic Spine, Pectorals, Latissimus Dorsi'
          },
          {
            name: 'Thread the Needle Shoulder Opening Flow',
            duration: 155,
            rest: 25,
            type: 'shoulders',
            instructions: 'Slide right arm under chest until right temple and shoulder rest on mat for 75s. Slowly return, slide left arm under for 75s. Relax neck and jaw.',
            partnerTip: 'Close your eyes. Feel the upper back and shoulder blade unwind completely.',
            target: 'Rhomboids, Rear Deltoids, Middle Trapezius'
          },
          {
            name: 'Low Lunge Hip Flexor & Psoas Decompression',
            duration: 155,
            rest: 25,
            type: 'hips',
            instructions: 'Step right foot forward into a low lunge with left knee cushioned on mat. Melt hips forward for 75s to release the seated psoas. Switch to left foot for 75s.',
            partnerTip: 'Keep upper body upright and breathe into the front of the back hip.',
            target: 'Iliopsoas, Rectus Femoris, Pelvic Bowl'
          },
          {
            name: 'Supine Dynamic Spinal Twist with Arm Reach',
            duration: 155,
            rest: 25,
            type: 'back',
            instructions: 'Lie on back, drop knees to the right side while reaching left arm overhead in an expansive diagonal arc for 75s. Switch smoothly to the other side for 75s.',
            partnerTip: 'Feel the stretch run from your outer hip all the way through your lat and ribs.',
            target: 'Thoracolumbar Fascia, Quadratus Lumborum, Ribs'
          },
          {
            name: 'Constructive Rest Pelvic Neutral Release',
            duration: 155,
            rest: 25,
            type: 'spine',
            instructions: 'Lie on back with knees bent, feet mat-width apart, knees knocking together in the center. Rest hands on belly. Allow the entire spine to settle flat.',
            partnerTip: 'This posture allows the psoas muscle to fully disengage and relax without effort.',
            target: 'Psoas Major, Sacrum, Lower Spine'
          }
        ]
      },
      {
        id: 'windDown',
        title: 'Wind-Down & Meditation',
        durationSec: 300,
        color: '#ec4899',
        icon: 'Moon',
        description: 'Calming cadence breathwork to release the workday.',
        exercises: [
          {
            name: 'Box Breathing (4-4-4-4) Calming Cadence',
            duration: 135,
            rest: 15,
            type: 'breath',
            instructions: 'Inhale for 4 seconds, hold gently for 4 seconds, exhale smoothly for 4 seconds, hold empty for 4 seconds. Smooth square rhythm.',
            partnerTip: 'Picture tracing the four corners of a soft glowing square with your breath.',
            target: 'Vagal Tone, Mindful Centering'
          },
          {
            name: 'Progressive Body Softening & Savasana',
            duration: 150,
            rest: 0,
            type: 'sleep',
            instructions: 'Lie flat, softening feet, ankles, calves, hips, belly, chest, hands, neck, and forehead. Sink like warm stone into the mat.',
            partnerTip: 'Let go of tomorrow’s to-do list. Tonight is for rest and renewal.',
            target: 'Nervous System De-escalation, Deep Sleep'
          }
        ]
      }
    ]
  },
  {
    dayIndex: 2, // Tuesday
    dayName: 'Tuesday',
    title: 'Deep Hip & Pelvic Release',
    tagline: 'Unlock tight hip capsules, release sciatic tension, and restore pelvic balance.',
    phases: [
      {
        id: 'strength',
        title: 'Strength Training',
        durationSec: 600,
        color: '#6366f1',
        icon: 'Flame',
        description: 'Gentle pelvic stability and deep hip rotators support.',
        exercises: [
          {
            name: 'Side Plank Hold with Bottom Knee Support',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'Support on right forearm with right knee bent 90 degrees on mat. Lift hips high and hold for 45s. Transition smoothly to left side for 45s.',
            partnerTip: 'Bottom knee support allows perfect spinal alignment without straining shoulders.',
            target: 'Gluteus Medius, Quadratus Lumborum, Obliques'
          },
          {
            name: 'Glute Bridge Marches with Core Anchor',
            duration: 95,
            rest: 25,
            type: 'lower',
            instructions: 'Hold hips lifted in glute bridge. Slowly lift right foot 2 inches off mat, place down, lift left foot. Keep pelvis completely still without rocking.',
            partnerTip: 'Place fingers on hip bones to ensure your hips stay level throughout.',
            target: 'Gluteus Maximus, Transverse Abdominis, Hamstrings'
          },
          {
            name: 'Prone Swimmer & Lumbar Extension Hold',
            duration: 95,
            rest: 25,
            type: 'back',
            instructions: 'Lie face down. Gently lift chest, arms, and legs. Perform slow, gentle flutter kicks and arm reaches for 10s, rest forehead for 5s, repeat.',
            partnerTip: 'Focus on reaching limbs long rather than lifting high.',
            target: 'Erector Spinae, Glutes, Posterior Chain'
          },
          {
            name: 'Forearm Plank with Gentle Hip Sways',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'In forearm plank, gently tilt hips 2 inches right, back to center, 2 inches left. Move with deliberate control. Drop knees down whenever needed.',
            partnerTip: 'Notice the gentle engagement of your oblique stabilizers.',
            target: 'Obliques, Deep Core, Pelvic Stabilizers'
          },
          {
            name: 'Reverse Tabletop / Glute Bridge Extension',
            duration: 95,
            rest: 25,
            type: 'upper',
            instructions: 'Sit on mat, hands behind hips fingers pointing forward, feet flat. Press into hands and feet to lift hips into a tabletop. Hold for 10s, lower gently, repeat.',
            partnerTip: 'Opens the front of the shoulders while strengthening the gluteal base.',
            target: 'Glutes, Hamstrings, Anterior Deltoids'
          }
        ]
      },
      {
        id: 'mobility',
        title: 'Stretching & Mobility',
        durationSec: 900,
        color: '#8b5cf6',
        icon: 'Sparkles',
        description: 'Long restorative holds for deep hip and glute release.',
        exercises: [
          {
            name: '90/90 Grounded Hip Opener (Both Sides)',
            duration: 155,
            rest: 25,
            type: 'hips',
            instructions: 'Sit with front leg bent 90 degrees and back leg bent 90 degrees. Fold chest gently over front shin for 75s. Rotate legs to other side for 75s.',
            partnerTip: 'Keep spine long as you fold forward over your front thigh.',
            target: 'Internal & External Hip Rotation, Glute Medius'
          },
          {
            name: 'Supported Frog / Wide Child’s Pose',
            duration: 155,
            rest: 25,
            type: 'hips',
            instructions: 'Open knees comfortably wide toward the edges of your mat, big toes touching or feet turned out. Walk hands forward and rest forehead on mat.',
            partnerTip: 'Sink heavy into the floor. This allows the adductors and pelvic floor to fully yield.',
            target: 'Inner Thighs, Adductors, Hip Joint Capsules'
          },
          {
            name: 'Reclined Pigeon Deep Glute Hold (Both Sides)',
            duration: 155,
            rest: 25,
            type: 'hips',
            instructions: 'Lie on back, cross right ankle over left knee, clasp left hamstring and draw legs gently toward chest for 75s. Switch legs for 75s.',
            partnerTip: 'Flex your right foot gently to keep your knee joint stable and happy.',
            target: 'Piriformis, Sciatic Pathway, Glutes'
          },
          {
            name: 'Gentle Windshield Wiper Hip Waves',
            duration: 155,
            rest: 25,
            type: 'hips',
            instructions: 'Lie on back with feet wide near mat edges, knees bent. Slowly drop both knees to the right for 3 seconds, then float them over to the left. Wave back and forth.',
            partnerTip: 'A gentle massage for the sacrum and internal hip rotators.',
            target: 'Hip Joint Mobilization, Tensor Fasciae Latae'
          },
          {
            name: 'Reclined Bound Angle (Supta Baddha Konasana)',
            duration: 155,
            rest: 25,
            type: 'hips',
            instructions: 'Soles of feet together, knees open wide. Rest one hand on heart, one on belly. Breathe deeply into the pelvic bowl, feeling gravity melt tension.',
            partnerTip: 'Place cushions under the outside of your knees for complete, effortless support.',
            target: 'Groin, Pelvic Diaphragm, Lower Lumbar'
          }
        ]
      },
      {
        id: 'windDown',
        title: 'Wind-Down & Meditation',
        durationSec: 300,
        color: '#ec4899',
        icon: 'Moon',
        description: 'Oceanic rhythmic breathing for somatic unwinding.',
        exercises: [
          {
            name: 'Diaphragmatic Ocean Breathing (Ujjayi)',
            duration: 135,
            rest: 15,
            type: 'breath',
            instructions: 'Breathe in and out through nose with a gentle whisper-like contraction at the back of throat, like the sound of gentle ocean waves on shore.',
            partnerTip: 'Listen to the soothing wave-like sound of your partner’s breathing beside you.',
            target: 'Vagus Nerve Stimulation, Calming Mental Waves'
          },
          {
            name: 'Guided Somatic Heaviness & Savasana',
            duration: 150,
            rest: 0,
            type: 'sleep',
            instructions: 'Extend legs, rest arms alongside body. Feel the back of your skull, shoulder blades, hips, and heels sinking into the earth.',
            partnerTip: 'Release all holding. There is nothing left to achieve today.',
            target: 'Parasympathetic Rest & Digest State'
          }
        ]
      }
    ]
  },
  {
    dayIndex: 3, // Wednesday
    dayName: 'Wednesday',
    title: 'Mid-Week Stress Melt & Shoulder Freedom',
    tagline: 'Discharge mental fatigue and soothe shoulder, neck, and upper back tightness.',
    phases: [
      {
        id: 'strength',
        title: 'Strength Training',
        durationSec: 600,
        color: '#6366f1',
        icon: 'Flame',
        description: 'Shoulder stability and grounding isometric core strength.',
        exercises: [
          {
            name: 'Forearm Dolphin Plank & Core Brace',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'Forearms on mat, press through forearms to dome space between shoulder blades. Hold for 30s, rest knees for 10s, hold for 30s. Keep breath steady.',
            partnerTip: 'Engage your serratus anterior by pushing the floor away firmly.',
            target: 'Serratus Anterior, Core, Upper Back'
          },
          {
            name: 'Quadruped Bear Plank (Knees Hovering)',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'From hands and knees with toes tucked, hover knees just 1 inch off the mat. Hold for 15 seconds, gently lower knees for 5 seconds, repeat 4 times.',
            partnerTip: 'Focus on a flat back like a tabletop. Trembling is normal and builds strength!',
            target: 'Deep Core, Quadriceps, Shoulder Stability'
          },
          {
            name: 'Prone Y-T-W Scapular Series',
            duration: 95,
            rest: 25,
            type: 'upper',
            instructions: 'Lie face down. Hold arms in a "Y" for 20s, sweep out to a "T" for 20s, bend elbows to "W" for 20s. Lift chest gently and squeeze shoulder blades.',
            partnerTip: 'Directly reverses the rounded shoulder posture of typing on laptops and phones.',
            target: 'Lower Trapezius, Rhomboids, Rotator Cuff'
          },
          {
            name: 'Kneeling Push-Up to Child’s Pose Flow',
            duration: 95,
            rest: 25,
            type: 'upper',
            instructions: 'Perform one smooth push-up from knees, then press straight back into Child’s Pose for 3 seconds of rest. Flow continuously between strength and stretch.',
            partnerTip: 'A rhythmic, satisfying flow combining upper body power with restorative recovery.',
            target: 'Pectorals, Triceps, Spine Decompression'
          },
          {
            name: 'Supine Bicycle Abdominal Slow Holds',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'Lie on back, hands supporting head lightly. Bring opposite elbow toward knee, hold for a slow 2-second squeeze, smoothly switch sides. Move slowly.',
            partnerTip: 'Never pull on your neck — lead with your armpit and ribcage turning toward the knee.',
            target: 'Obliques, Rectus Abdominis'
          }
        ]
      },
      {
        id: 'mobility',
        title: 'Stretching & Mobility',
        durationSec: 900,
        color: '#8b5cf6',
        icon: 'Sparkles',
        description: 'Restorative neck, shoulder, and upper back unwinding.',
        exercises: [
          {
            name: 'Extended Puppy Pose with Forehead Grounded',
            duration: 155,
            rest: 25,
            type: 'shoulders',
            instructions: 'Hips over knees, walk hands far forward, lower forehead or chin to mat. Allow the chest to sink toward the floor while hips stay high.',
            partnerTip: 'Deeply releases tightness between shoulder blades and along the front of the chest.',
            target: 'Thoracic Spine, Lats, Pectoral Girdle'
          },
          {
            name: 'Thread the Needle Deep Twist & Bind',
            duration: 155,
            rest: 25,
            type: 'shoulders',
            instructions: 'Slide right arm under torso for 75s, resting shoulder and side of head. Optionally drape left arm behind lower back. Switch sides for 75s.',
            partnerTip: 'Breathe into the back of your lungs, expanding the ribs like wings.',
            target: 'Rhomboids, Scapular Attachment, Thoracic Twist'
          },
          {
            name: 'Lying Floor Chest & Bicep Opener (Both Sides)',
            duration: 155,
            rest: 25,
            type: 'chest',
            instructions: 'Lie on belly, extend right arm straight out to side at 90 degrees. Roll body slightly onto right hip for 75s to open right chest. Switch sides for 75s.',
            partnerTip: 'Go gently — stop where you feel a pleasant, opening stretch across the pectoral.',
            target: 'Pectoralis Major & Minor, Biceps, Anterior Deltoid'
          },
          {
            name: 'Supine Eagle Arms & Scapular Spread',
            duration: 155,
            rest: 25,
            type: 'shoulders',
            instructions: 'Lie on back, wrap right elbow under left elbow, palms touching if accessible. Gently pull elbows toward ceiling and slightly overhead. Switch arms at halfway.',
            partnerTip: 'Spreads the space between your shoulder blades where stress accumulates.',
            target: 'Upper Trapezius, Rhomboids, Infraspinatus'
          },
          {
            name: 'Neck & Trapezius Floor Softening Sequence',
            duration: 155,
            rest: 25,
            type: 'neck',
            instructions: 'Lie comfortably on back. Slowly turn head to right, let ear sink into mat for 50s. Repeat to left for 50s. Bring head center and tuck chin gently for 40s.',
            partnerTip: 'Unclench your teeth and allow your tongue to rest on the roof of your mouth.',
            target: 'Sternocleidomastoid, Scalenes, Levator Scapulae'
          }
        ]
      },
      {
        id: 'windDown',
        title: 'Wind-Down & Meditation',
        durationSec: 300,
        color: '#ec4899',
        icon: 'Moon',
        description: 'Harmonious breathing to dissolve mid-week stress.',
        exercises: [
          {
            name: '5-5 Coherent Heart-Rate Variability Breath',
            duration: 135,
            rest: 15,
            type: 'breath',
            instructions: 'Inhale gently for 5 seconds through nose, exhale smoothly for 5 seconds through nose. Exactly 6 breaths per minute for optimal cardiovascular coherence.',
            partnerTip: 'Synchronize your breath cycle. Feeling each other breathe creates deep safety.',
            target: 'Heart Rate Variability, Autonomic Balance'
          },
          {
            name: 'Bedtime Mental Reset & Savasana',
            duration: 150,
            rest: 0,
            type: 'sleep',
            instructions: 'Full rest on mat. Release all thoughts of Wednesday and the rest of the week. Let yourself be held by the floor.',
            partnerTip: 'Rest as deeply as you need. Sleep is waiting for you.',
            target: 'Deep Muscle Relaxation, Mental Peace'
          }
        ]
      }
    ]
  },
  {
    dayIndex: 4, // Thursday
    dayName: 'Thursday',
    title: 'Lower Back Ease & Hamstring Unwinding',
    tagline: 'Decompress lumbar vertebrae, release tight hamstrings, and relieve lower back pressure.',
    phases: [
      {
        id: 'strength',
        title: 'Strength Training',
        durationSec: 600,
        color: '#6366f1',
        icon: 'Flame',
        description: 'Lower back protection and posterior stability foundation.',
        exercises: [
          {
            name: 'Pelvic Tilts & Deep Transverse Core Anchor',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'Lie on back with knees bent. Inhale arch lower back slightly, exhale flatten lower back firmly into mat while engaging pelvic floor. Hold 5s, repeat continuously.',
            partnerTip: 'A gentle, safe rehabilitation exercise that strengthens the deep corset of the abdomen.',
            target: 'Transverse Abdominis, Lumbar Multifidus'
          },
          {
            name: 'Bird-Dog Sustained Hold with Pulse',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'Hands and knees on mat. Extend right arm and left leg, hold for 40s with subtle 1-inch micro pulses. Lower down, extend left arm and right leg for 40s.',
            partnerTip: 'Keep your gaze between your hands so the neck remains neutral and strain-free.',
            target: 'Erector Spinae, Glutes, Core Bracing'
          },
          {
            name: 'Glute Bridge Isometric Squeeze with Heel Drive',
            duration: 95,
            rest: 25,
            type: 'lower',
            instructions: 'Drive heels into floor, lift hips, squeeze glutes. Maintain a steady isometric hold for 30s, take a 5s floor tap rest, repeat twice.',
            partnerTip: 'Strengthening the glutes directly takes pressure off the lower back muscles.',
            target: 'Gluteus Maximus, Hamstrings, Pelvic Balance'
          },
          {
            name: 'Forearm Plank with Alternating Knee Taps',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'In forearm plank, gently tap right knee to floor without moving hips, straighten, tap left knee. Move like clockwork. Rest knees fully whenever needed.',
            partnerTip: 'Keep your torso as steady as a glass of water on your back.',
            target: 'Transverse Abdominis, Obliques, Quad Stabilizers'
          },
          {
            name: 'Prone Locust Pose Lower Back Nourishment',
            duration: 95,
            rest: 25,
            type: 'back',
            instructions: 'Lie face down, arms back palms up. Inhale peel chest and legs 2 inches off mat, hold for 5s, exhale lower down and rest for 3s. Repeat gently.',
            partnerTip: 'Think about lengthening your body from head to toe rather than arching high.',
            target: 'Erector Spinae, Glutes, Hamstrings'
          }
        ]
      },
      {
        id: 'mobility',
        title: 'Stretching & Mobility',
        durationSec: 900,
        color: '#8b5cf6',
        icon: 'Sparkles',
        description: 'Restorative lumbar decompression and gentle hamstring lengthening.',
        exercises: [
          {
            name: 'Knees-to-Chest (Apanasana) & Sacrum Circles',
            duration: 155,
            rest: 25,
            type: 'back',
            instructions: 'Lie on back, hug both knees into chest. Gently circle knees together clockwise for 60s, counterclockwise for 60s, then hug tightly and hold for 30s.',
            partnerTip: 'Massages the sacrum and lumbar vertebrae against the floor mat.',
            target: 'Lumbar Spine, Sacroiliac Joint, Digestive Rest'
          },
          {
            name: 'Reclined Single-Leg Hamstring Stretch (Both Sides)',
            duration: 155,
            rest: 25,
            type: 'hamstrings',
            instructions: 'Lie on back, extend right leg toward ceiling, holding behind hamstring or calf for 75s. Keep left knee bent. Switch gently to left leg for 75s.',
            partnerTip: 'Keep the back of your head on the mat. Never lock the knee — keep a soft micro-bend.',
            target: 'Biceps Femoris, Semitendinosus, Calves'
          },
          {
            name: 'Sphinx Pose & Lumbar Disc Nourishment',
            duration: 155,
            rest: 25,
            type: 'spine',
            instructions: 'Lie face down, forearms parallel on mat. Press into forearms and let belly sink heavy into the floor. Inhale spaciousness into the lower back.',
            partnerTip: 'Allows the lumbar discs to settle back into their natural curve after sitting.',
            target: 'Lumbar Lordosis, Abdominal Stretch, Heart Opening'
          },
          {
            name: 'Supine Spinal Twist with Straight Leg Option',
            duration: 155,
            rest: 25,
            type: 'back',
            instructions: 'Hug right knee to chest, guide it across torso to left side, extend right arm right for 75s. Draw back to center, repeat with left knee to right for 75s.',
            partnerTip: 'Feel the stretch along your outer glute and lower back. Breathe out slowly.',
            target: 'Quadratus Lumborum, Glute Medius, Spine'
          },
          {
            name: 'Happy Baby Pose & Sacral Grounding',
            duration: 155,
            rest: 25,
            type: 'hips',
            instructions: 'Grab outer edges of feet or shins, draw knees down toward armpits, ankles stacked over knees. Gently sway side-to-side or hold stillness.',
            partnerTip: 'Keep tailbone weighted toward the mat so the entire spine remains grounded.',
            target: 'Inner Groin, Hamstrings, Sacral Decompression'
          }
        ]
      },
      {
        id: 'windDown',
        title: 'Wind-Down & Meditation',
        durationSec: 300,
        color: '#ec4899',
        icon: 'Moon',
        description: 'Lengthened exhalations to soothe the lumbar nerves.',
        exercises: [
          {
            name: 'Lengthened Exhale Breathing (4 In, 8 Out)',
            duration: 135,
            rest: 15,
            type: 'breath',
            instructions: 'Inhale gently through nose for 4 seconds, exhale smoothly and softly through mouth for 8 seconds. Twice as long on the exhale.',
            partnerTip: 'Each long exhale drops your heart rate and signals deep relaxation.',
            target: 'Parasympathetic Activation, Muscle Atonia'
          },
          {
            name: 'Warm Light Body Scan & Savasana',
            duration: 150,
            rest: 0,
            type: 'sleep',
            instructions: 'Visualize a soft warm light moving from the crown of your head down through your throat, chest, belly, hips, and out your feet.',
            partnerTip: 'Feel your body heavy and peaceful on the floor. Goodnight.',
            target: 'Delta Wave Transition, Complete Stillness'
          }
        ]
      }
    ]
  },
  {
    dayIndex: 5, // Friday
    dayName: 'Friday',
    title: 'Gentle Full-Body Unwinding',
    tagline: 'Melt away accumulated weekly fatigue and transition into restful weekend ease.',
    phases: [
      {
        id: 'strength',
        title: 'Strength Training',
        durationSec: 600,
        color: '#6366f1',
        icon: 'Flame',
        description: 'Gentle, full-body restorative isometric stability.',
        exercises: [
          {
            name: 'Mindful Slow Push-Ups & Chest Release',
            duration: 95,
            rest: 25,
            type: 'upper',
            instructions: 'Kneeling or full push-ups with a calm 3-second descent. Press up smoothly, or rest into child’s pose whenever you wish. Zero hurry.',
            partnerTip: 'Friday is about celebrating that you showed up on the mat. Honor how your body feels.',
            target: 'Pectorals, Triceps, Anterior Core'
          },
          {
            name: 'Forearm Plank Partner Synchronized Hold',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'Forearm plank side-by-side. Hold with smooth diaphragmatic breaths. If either rests knees down, take a breath and join back in when ready.',
            partnerTip: 'Exchange a smile — you made it through the work week!',
            target: 'Full Body Core, Glutes, Shoulders'
          },
          {
            name: 'Glute Bridge Elevation Hold & Squeeze',
            duration: 95,
            rest: 25,
            type: 'lower',
            instructions: 'Lift hips, squeeze glutes firmly at top. Hold for 35s, lower for 5s, hold for 35s. Feel strength in your posterior chain.',
            partnerTip: 'Keep neck and shoulders soft and relaxed on the floor.',
            target: 'Gluteus Maximus, Hamstrings, Lumbar Ease'
          },
          {
            name: 'Dead Bug Opposite Limb Slow Extension',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'Lie on back, lower opposite arm and leg toward floor while pressing lower back flat. Smooth 3-second tempo out, 3-second tempo in.',
            partnerTip: 'Coordination and calm deep core connection.',
            target: 'Transverse Abdominis, Pelvic Floor'
          },
          {
            name: 'Quadruped Cat Balance & Spine Stability',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'From table-top, alternate extending right arm and left leg, then left arm and right leg. Pause for 3 seconds at top with steady breath.',
            partnerTip: 'Feel the strength and balance you’ve cultivated this week.',
            target: 'Erector Spinae, Glutes, Balance'
          }
        ]
      },
      {
        id: 'mobility',
        title: 'Stretching & Mobility',
        durationSec: 900,
        color: '#8b5cf6',
        icon: 'Sparkles',
        description: 'Spacious full-body opening for deep physical unwinding.',
        exercises: [
          {
            name: 'Side-Lying Open Book Thoracic Expansion (Both Sides)',
            duration: 155,
            rest: 25,
            type: 'spine',
            instructions: 'Lie on right side with knees stacked at 90 degrees. Open left arm across like turning a book page for 75s. Switch to left side for 75s.',
            partnerTip: 'Follow your moving hand with your eyes to gently release the cervical spine.',
            target: 'Thoracic Rotation, Pectorals, Neck'
          },
          {
            name: 'Wide-Knee Extended Child’s Pose with Lat Reach',
            duration: 155,
            rest: 25,
            type: 'back',
            instructions: 'Knees wide, big toes touching. Walk hands out far. Walk both hands 1 foot to the right for 70s, walk through center and over to the left for 70s.',
            partnerTip: 'Deep opening all along the side body, lats, and ribcage.',
            target: 'Latissimus Dorsi, Spine, Hips'
          },
          {
            name: 'Low Dragon Lunge Hip Opening (Both Sides)',
            duration: 155,
            rest: 25,
            type: 'hips',
            instructions: 'Step right foot forward into a cushioned low lunge. Rest hands on front knee or floor blocks. Sink hips gently forward for 75s. Switch to left side for 75s.',
            partnerTip: 'Allows the front of the hip to unwind after hours of Friday sitting.',
            target: 'Psoas, Hip Flexors, Quadriceps'
          },
          {
            name: 'Reclined Gentle Spinal Twist Flow',
            duration: 155,
            rest: 25,
            type: 'back',
            instructions: 'Lie on back, hug knees, drop them gently to right side for 75s. Look left. Float knees across center and drop to left side for 75s.',
            partnerTip: 'Allow gravity to draw your knees down toward the floor.',
            target: 'Lumbar Spine, Obliques, Chest'
          },
          {
            name: 'Supported Mat Butterfly with Pillows',
            duration: 155,
            rest: 25,
            type: 'hips',
            instructions: 'Soles of feet together, knees open wide. Place hands gently on belly. Inhale spaciousness, exhale weekly fatigue.',
            partnerTip: 'Feel the floor supporting you completely. You have nowhere else you need to be.',
            target: 'Adductors, Sacrum, Diaphragm'
          }
        ]
      },
      {
        id: 'windDown',
        title: 'Wind-Down & Meditation',
        durationSec: 300,
        color: '#ec4899',
        icon: 'Moon',
        description: 'Vagus nerve reset to welcome the weekend.',
        exercises: [
          {
            name: '4-7-8 Deep Parasympathetic Sleep Trigger',
            duration: 135,
            rest: 15,
            type: 'breath',
            instructions: 'Inhale through nose for 4 seconds, hold gently for 7 seconds, exhale completely through mouth for 8 seconds with an audible sigh.',
            partnerTip: 'Let the sigh carry away every bit of tension from the week.',
            target: 'Autonomic Nervous System, Melatonin Release'
          },
          {
            name: 'Weekend Transition Savasana Stillness',
            duration: 150,
            rest: 0,
            type: 'sleep',
            instructions: 'Lie flat, arms and legs open comfortably. Let go of all breath control. Float in stillness beside each other.',
            partnerTip: 'Sleep deeply and wake up refreshed for your weekend.',
            target: 'Delta Wave Sleep Transition'
          }
        ]
      }
    ]
  },
  {
    dayIndex: 6, // Saturday
    dayName: 'Saturday',
    title: 'Deep Cellular Rest & Restorative Yin',
    tagline: 'Deep, slow yin holds and nourishing heart-opening to reset your nervous system.',
    phases: [
      {
        id: 'strength',
        title: 'Strength Training',
        durationSec: 600,
        color: '#6366f1',
        icon: 'Flame',
        description: 'Grounded, mindful core holds with no rushing.',
        exercises: [
          {
            name: 'Isometric Floor Push & Core Brace Hold',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'Lie on back with knees at 90 degrees. Press hands firmly against knees while knees press back into hands. Brace core firmly for 15s, rest 5s, repeat 4 times.',
            partnerTip: 'An incredible zero-impact core exercise that strengthens the deep wall safely.',
            target: 'Transverse Abdominis, Anterior Chain'
          },
          {
            name: 'Bird-Dog Slow Alternating Rhythm',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'On hands and knees, reach opposite arm and leg out in slow motion. Hold for 4 seconds, return softly, switch sides. Maintain steady breath.',
            partnerTip: 'Move like you are underwater: smooth, balanced, and graceful.',
            target: 'Erector Spinae, Glutes, Core'
          },
          {
            name: 'Glute Bridge Sustained Hold & Pulses',
            duration: 95,
            rest: 25,
            type: 'lower',
            instructions: 'Drive heels down, lift hips into bridge. Hold still for 30s, do 10 soft micro-pulses, hold still for 30s. Squeeze glutes firmly.',
            partnerTip: 'Check that your neck and jaw stay relaxed as your glutes work.',
            target: 'Glutes, Hamstrings, Lumbar Balance'
          },
          {
            name: 'Low Plank Center Hold with Deep Breathing',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'Forearm plank on mat. Engage glutes and belly button to spine. Hold with calm, slow breaths. Drop knees down for 5s pauses whenever needed.',
            partnerTip: 'Count 5 slow deep breaths, take a knee-down breather, then count 5 more.',
            target: 'Core, Shoulders, Full Body Stability'
          },
          {
            name: 'Hollow Body Gentle Bend & Hold',
            duration: 95,
            rest: 25,
            type: 'core',
            instructions: 'Lie on back, press lumbar spine flat into mat. Lift shoulder blades and hug knees to chest or extend slightly. Maintain lower back contact.',
            partnerTip: 'Final strength posture of the week! Breathe with ease.',
            target: 'Deep Core, Hip Flexors'
          }
        ]
      },
      {
        id: 'mobility',
        title: 'Stretching & Mobility',
        durationSec: 900,
        color: '#8b5cf6',
        icon: 'Sparkles',
        description: 'Deep restorative Yin holds for total joint and fascial release.',
        exercises: [
          {
            name: 'Supported Supine Chest & Heart Opener',
            duration: 155,
            rest: 25,
            type: 'chest',
            instructions: 'Lie on back with a rolled towel or pillow along your spine. Let arms drape open wide. Let gravity open your heart and chest effortlessly.',
            partnerTip: 'Close your eyes. Feel the spacious expansion across your lungs and collarbones.',
            target: 'Pectoralis Major, Intercostal Muscles, Heart'
          },
          {
            name: 'Melting Heart Pose into Sphinx',
            duration: 155,
            rest: 25,
            type: 'spine',
            instructions: 'Spend 75s in Puppy Pose melting chest toward the mat, then slide forward into Sphinx Pose for 75s resting on forearms.',
            partnerTip: 'Deep, slow unwinding of the thoracic spine and front abdominal line.',
            target: 'Thoracic Spine, Pectorals, Lumbar Nourishment'
          },
          {
            name: 'Reclined Figure-4 Glute Softening (Both Sides)',
            duration: 155,
            rest: 25,
            type: 'hips',
            instructions: 'Cross right ankle over left knee, hug left thigh toward chest for 75s. Switch legs and melt into the left hip for 75s.',
            partnerTip: 'Notice any areas of gripping in your hip and consciously exhale warmth into them.',
            target: 'Piriformis, Gluteus Medius, Outer Hip'
          },
          {
            name: 'Two-Knee Supine Spinal Twist',
            duration: 155,
            rest: 25,
            type: 'back',
            instructions: 'Hug knees to chest, drop them to right side for 75s, opening left arm. Float across center and drop to left side for 75s.',
            partnerTip: 'Let your eyes remain closed. Soften your belly completely.',
            target: 'Spinal Decompression, Obliques, Chest'
          },
          {
            name: 'Reclined Hero / Gentle Quad & Psoas Softening',
            duration: 155,
            rest: 25,
            type: 'hips',
            instructions: 'Lie on back with knees bent or extend one leg at a time to open the quadriceps and hip flexors for 75s each side.',
            partnerTip: 'Gentle release for the front of the legs and hips before sleep.',
            target: 'Quadriceps, Hip Flexors, Psoas'
          }
        ]
      },
      {
        id: 'windDown',
        title: 'Wind-Down & Meditation',
        durationSec: 300,
        color: '#ec4899',
        icon: 'Moon',
        description: 'Moon breath and deep cellular stillness.',
        exercises: [
          {
            name: 'Left-Nostril Moon Breath (Chandra Bhedana)',
            duration: 135,
            rest: 15,
            type: 'breath',
            instructions: 'Gently block right nostril, inhale solely through left nostril. Exhale softly through mouth or right nostril. Left nostril breathing directly activates cooling sleep energy.',
            partnerTip: 'Ancient yogic technique specifically designed for deep sleep initiation.',
            target: 'Parasympathetic Nervous System, Pineal Activation'
          },
          {
            name: 'Deep Sleep Savasana Surrender',
            duration: 150,
            rest: 0,
            type: 'sleep',
            instructions: 'Lie flat, palms up, eyes closed. Soft ambient sound. Sink down into the earth. You are completely relaxed, peaceful, and ready for sleep.',
            partnerTip: 'Roll off your mat and head straight to bed. Sweet dreams.',
            target: 'Deep Rest, Sleep Transition'
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
