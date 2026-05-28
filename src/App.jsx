// FORGE v2.6 — Rank system + tab restructure. If you see this comment, this is the correct file.
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { storage } from './lib/storage';
import { callClaude } from './lib/api';
import {
  Dumbbell, Apple, Flame, Home, ChevronRight, ChevronLeft, Plus, Check, X, Send,
  Sparkles, TrendingUp, Zap, Activity, ArrowRight, ArrowLeft, User, Trash2,
  Search, Trophy, BarChart3, Loader2, CheckCircle2, Circle, RotateCcw,
  Droplet, Scale, Heart, RefreshCw, Shield, AlertCircle, Moon, Smile,
  Settings, Clock, Pause, Play, SkipForward, Repeat, Camera, Calendar, Pencil, Save,
} from 'lucide-react';

/* ============================================================
   FORGE v2 — Built for everyone who actually trains.
   Acid lime on iron black. Teen-safe by default.
   ============================================================ */

// ============================================================
// STATIC DATA
// ============================================================

const WORKOUT_TYPES = [
  { id: 'gym', name: 'IRON', sub: 'Gym / Weights',
    blurb: 'Barbells, dumbbells, machines. Progressive overload, the classic path to size and strength.' },
  { id: 'calisthenics', name: 'BODYWEIGHT', sub: 'Calisthenics',
    blurb: 'No equipment, no excuses. Pull-ups, dips, levers. Build a body that moves like an athlete.' },
  { id: 'mix', name: 'HYBRID', sub: 'Mixed Discipline',
    blurb: 'Iron when you have it, bodyweight when you don\'t. Maximum adaptability, no plateaus.' },
];

const GOALS_ADULT = [
  { id: 'muscle',     name: 'Build Muscle',         tag: 'HYPERTROPHY',   surplus:  300, proteinPerKg: 2.0 },
  { id: 'fat_loss',   name: 'Lose Fat',             tag: 'CUTTING',       surplus: -500, proteinPerKg: 2.2 },
  { id: 'strength',   name: 'Get Stronger',         tag: 'POWER',         surplus:  150, proteinPerKg: 2.0 },
  { id: 'endurance',  name: 'Build Endurance',      tag: 'CONDITIONING',  surplus:    0, proteinPerKg: 1.6 },
  { id: 'recomp',     name: 'Body Recomp',          tag: 'LEAN GAINS',    surplus:  -50, proteinPerKg: 2.2 },
  { id: 'general',    name: 'Stay Healthy',         tag: 'WELLNESS',      surplus:    0, proteinPerKg: 1.4 },
  { id: 'mass',       name: 'Mass / Bulk',          tag: 'SIZE',          surplus:  500, proteinPerKg: 1.8 },
  { id: 'athletic',   name: 'Athletic Performance', tag: 'SPORTS',        surplus:  100, proteinPerKg: 1.8 },
  { id: 'functional', name: 'Functional Strength',  tag: 'REAL WORLD',    surplus:  100, proteinPerKg: 1.8 },
  { id: 'mobility',   name: 'Mobility & Flex',      tag: 'SUPPLENESS',    surplus:    0, proteinPerKg: 1.4 },
];

const GOALS_TEEN = [
  { id: 'muscle',     name: 'Build Strength & Size', tag: 'GROWTH',       surplus:  400, proteinPerKg: 1.8 },
  { id: 'strength',   name: 'Get Stronger',          tag: 'STRENGTH',     surplus:  200, proteinPerKg: 1.8 },
  { id: 'recomp',     name: 'Lean Up (Mild)',        tag: 'RECOMP',       surplus: -150, proteinPerKg: 1.8 },
  { id: 'endurance',  name: 'Build Endurance',       tag: 'CONDITIONING', surplus:    0, proteinPerKg: 1.4 },
  { id: 'general',    name: 'Healthy & Athletic',    tag: 'WELLNESS',     surplus:    0, proteinPerKg: 1.4 },
  { id: 'athletic',   name: 'Sports Performance',    tag: 'ATHLETIC',     surplus:  200, proteinPerKg: 1.6 },
  { id: 'functional', name: 'Functional Strength',   tag: 'REAL WORLD',   surplus:  200, proteinPerKg: 1.6 },
  { id: 'mobility',   name: 'Mobility & Flex',       tag: 'SUPPLENESS',   surplus:  100, proteinPerKg: 1.4 },
];

// Compute age from ISO birthday string (YYYY-MM-DD)
function computeAge(birthday) {
  if (!birthday) return null;
  const today = new Date();
  const bd = new Date(birthday);
  if (isNaN(bd.getTime())) return null;
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
}

// Maximum birthday (must be at least 13 years old) — for date input "max" attr
function maxBirthday() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 13);
  return d.toISOString().split('T')[0];
}

// Minimum birthday (max 80 years old) — for date input "min" attr
function minBirthday() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 80);
  return d.toISOString().split('T')[0];
}

// Population averages — used as smart starting defaults on the body step
function avgBody(age, sex) {
  const a = Math.max(13, Math.min(80, +age || 18));
  if (sex === 'female') {
    if (a <= 13) return { height: 157, weight: 48 };
    if (a <= 14) return { height: 159, weight: 52 };
    if (a <= 15) return { height: 161, weight: 55 };
    if (a <= 16) return { height: 162, weight: 57 };
    if (a <= 17) return { height: 163, weight: 58 };
    if (a <= 30) return { height: 163, weight: 65 };
    if (a <= 45) return { height: 163, weight: 70 };
    if (a <= 60) return { height: 162, weight: 72 };
    return { height: 161, weight: 70 };
  }
  // male / other
  if (a <= 13) return { height: 157, weight: 50 };
  if (a <= 14) return { height: 164, weight: 55 };
  if (a <= 15) return { height: 169, weight: 61 };
  if (a <= 16) return { height: 173, weight: 66 };
  if (a <= 17) return { height: 175, weight: 70 };
  if (a <= 30) return { height: 178, weight: 78 };
  if (a <= 45) return { height: 178, weight: 84 };
  if (a <= 60) return { height: 177, weight: 86 };
  return { height: 175, weight: 80 };
}

const ACTIVITY_LEVELS = [
  { id: 'sedentary', name: 'Sedentary', mult: 1.2,   desc: 'School/desk, little movement' },
  { id: 'light',     name: 'Light',     mult: 1.375, desc: '1–3 sessions / week' },
  { id: 'moderate',  name: 'Moderate',  mult: 1.55,  desc: '3–5 sessions / week' },
  { id: 'high',      name: 'High',      mult: 1.725, desc: '6–7 sessions / week' },
  { id: 'athlete',   name: 'Athlete',   mult: 1.9,   desc: 'Daily training / sport' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner',     name: 'Beginner',     desc: 'New to training or under 6 months in' },
  { id: 'intermediate', name: 'Intermediate', desc: '6 months – 2 years consistent' },
  { id: 'advanced',     name: 'Advanced',     desc: '2+ years, know your numbers' },
];

const EQUIPMENT_OPTIONS = [
  { id: 'full_gym',   name: 'Full gym',        desc: 'Barbells, racks, machines' },
  { id: 'home_db',    name: 'Home (dumbbells)',desc: 'DBs, maybe a bench' },
  { id: 'home_min',   name: 'Home (minimal)',  desc: 'Pull-up bar + bands' },
  { id: 'bodyweight', name: 'Bodyweight only', desc: 'Just me, the floor, a doorway' },
];

const DAYS_PER_WEEK = [3, 4, 5, 6];
const SESSION_LENGTHS = [30, 45, 60, 90];

const WEEK_DAYS = [
  { id: 'monday',    short: 'MON', long: 'Monday',    jsIdx: 1 },
  { id: 'tuesday',   short: 'TUE', long: 'Tuesday',   jsIdx: 2 },
  { id: 'wednesday', short: 'WED', long: 'Wednesday', jsIdx: 3 },
  { id: 'thursday',  short: 'THU', long: 'Thursday',  jsIdx: 4 },
  { id: 'friday',    short: 'FRI', long: 'Friday',    jsIdx: 5 },
  { id: 'saturday',  short: 'SAT', long: 'Saturday',  jsIdx: 6 },
  { id: 'sunday',    short: 'SUN', long: 'Sunday',    jsIdx: 0 },
];

const DEFAULT_TRAINING_DAYS = {
  3: ['monday','wednesday','friday'],
  4: ['monday','tuesday','thursday','friday'],
  5: ['monday','tuesday','wednesday','friday','saturday'],
  6: ['monday','tuesday','wednesday','thursday','friday','saturday'],
};

const DIETS = [
  { id: 'omnivore',   name: 'No restriction' },
  { id: 'vegetarian', name: 'Vegetarian' },
  { id: 'vegan',      name: 'Vegan' },
  { id: 'pescatarian',name: 'Pescatarian' },
  { id: 'halal',      name: 'Halal' },
  { id: 'kosher',     name: 'Kosher' },
];

const ALLERGENS = ['Dairy', 'Gluten', 'Nuts', 'Eggs', 'Shellfish', 'Soy'];

const COMMON_INJURIES = ['Lower back', 'Knees', 'Shoulders', 'Elbows', 'Wrists', 'Hips', 'Neck'];

// ============================================================
// STRENGTH RANK SYSTEM
// ============================================================
// Ranks based on estimated 1-rep-max relative to bodyweight.

const RANK_TIERS = [
  { id: 0, name: 'IRON',     color: '#9a9a9a', glow: 'rgba(154,154,154,0.4)' },
  { id: 1, name: 'BRONZE',   color: '#cd7f32', glow: 'rgba(205,127,50,0.4)' },
  { id: 2, name: 'STEEL',    color: '#aebfd4', glow: 'rgba(174,191,212,0.4)' },
  { id: 3, name: 'SILVER',   color: '#d4d4dc', glow: 'rgba(212,212,220,0.4)' },
  { id: 4, name: 'GOLD',     color: '#ffd23f', glow: 'rgba(255,210,63,0.45)' },
  { id: 5, name: 'TITANIUM', color: '#7fe7ff', glow: 'rgba(127,231,255,0.45)' },
  { id: 6, name: 'MYTHIC',   color: '#d8ff36', glow: 'rgba(216,255,54,0.5)' },
];

// The lifts we rank. Each has a label and which equipment it needs.
const RANK_LIFTS = [
  { id: 'bench',    name: 'Bench Press' },
  { id: 'squat',    name: 'Back Squat' },
  { id: 'deadlift', name: 'Deadlift' },
  { id: 'ohp',      name: 'Overhead Press' },
  { id: 'row',      name: 'Barbell Row' },
  { id: 'pullup',   name: 'Weighted Pull-up' },
];

// Bodyweight-ratio thresholds to REACH each tier (index 0=IRON ... 6=MYTHIC).
// For pull-up, ratio = (bodyweight + added weight) / bodyweight.
const STRENGTH_STANDARDS = {
  male: {
    bench:    [0.40, 0.60, 0.85, 1.10, 1.40, 1.70, 2.00],
    squat:    [0.60, 0.90, 1.20, 1.50, 1.85, 2.20, 2.60],
    deadlift: [0.80, 1.10, 1.40, 1.80, 2.20, 2.60, 3.00],
    ohp:      [0.30, 0.45, 0.60, 0.75, 0.90, 1.10, 1.30],
    row:      [0.40, 0.60, 0.80, 1.00, 1.25, 1.50, 1.75],
    pullup:   [1.00, 1.10, 1.25, 1.40, 1.60, 1.80, 2.00],
  },
  female: {
    bench:    [0.25, 0.40, 0.55, 0.70, 0.90, 1.10, 1.30],
    squat:    [0.40, 0.60, 0.80, 1.05, 1.30, 1.60, 1.90],
    deadlift: [0.50, 0.75, 1.00, 1.25, 1.60, 1.95, 2.30],
    ohp:      [0.20, 0.30, 0.40, 0.50, 0.65, 0.80, 0.95],
    row:      [0.25, 0.40, 0.55, 0.70, 0.90, 1.10, 1.30],
    pullup:   [1.00, 1.05, 1.15, 1.30, 1.45, 1.60, 1.75],
  },
};

// Rewards unlocked at each tier (titles + perks + unlocks).
const RANK_REWARDS = [
  { tier: 'IRON',     title: 'Initiate',   perk: 'Lift logging unlocked',        unlock: 'The basics. Everyone starts here.' },
  { tier: 'BRONZE',   title: 'Apprentice', perk: 'Bronze badge',                 unlock: 'Accessory rotation insights' },
  { tier: 'STEEL',    title: 'Forged',     perk: 'Steel badge',                  unlock: 'Tempo & time-under-tension tips' },
  { tier: 'SILVER',   title: 'Striker',    perk: 'Silver badge',                 unlock: 'Advanced exercise variations' },
  { tier: 'GOLD',     title: 'Champion',   perk: 'Gold badge + profile flair',   unlock: 'Periodization deep-dives' },
  { tier: 'TITANIUM', title: 'Titan',      perk: 'Titanium badge',               unlock: 'Elite programming protocols' },
  { tier: 'MYTHIC',   title: 'Mythic',     perk: 'Mythic status — the summit',   unlock: 'You are the standard others chase.' },
];

// Match a workout exercise name to a rankable lift id (or null)
function matchRankLift(exerciseName) {
  const n = (exerciseName || '').toLowerCase();
  if (n.includes('bench')) return 'bench';
  if (n.includes('deadlift')) return 'deadlift';
  if (n.includes('squat') && !n.includes('split') && !n.includes('pistol') && !n.includes('goblet')) return 'squat';
  if ((n.includes('overhead') || n.includes('military') || n.includes('shoulder press')) && n.includes('press')) return 'ohp';
  if (n.includes('row') && (n.includes('barbell') || n.includes('bent'))) return 'row';
  if (n.includes('pull-up') || n.includes('pullup') || n.includes('pull up')) return 'pullup';
  return null;
}

// Estimate 1-rep max from weight and reps (Epley formula, capped at 12 reps).
function estimate1RM(weight, reps) {
  const w = +weight || 0;
  const r = Math.max(1, Math.min(12, +reps || 1));
  if (r === 1) return w;
  return Math.round(w * (1 + r / 30));
}

// Given a lift, the user's est 1RM, bodyweight, and sex → tier index (0-6) + progress to next.
function tierForLift(liftId, e1rm, bodyweight, sex) {
  const standards = (STRENGTH_STANDARDS[sex] || STRENGTH_STANDARDS.male)[liftId];
  if (!standards || !bodyweight) return { tier: 0, ratio: 0, toNext: 0 };
  // For pull-ups, the "weight" lifted is bodyweight + added; ratio includes bodyweight.
  const ratio = liftId === 'pullup'
    ? (bodyweight + e1rm) / bodyweight
    : e1rm / bodyweight;
  let tier = 0;
  for (let i = 0; i < standards.length; i++) {
    if (ratio >= standards[i]) tier = i;
  }
  // progress toward next tier (0-1)
  let toNext = 1;
  if (tier < standards.length - 1) {
    const cur = standards[tier];
    const nxt = standards[tier + 1];
    toNext = Math.max(0, Math.min(1, (ratio - cur) / (nxt - cur)));
  }
  return { tier, ratio: +ratio.toFixed(2), toNext };
}

// Overall rank = the rounded average tier across all lifts the user has logged.
function overallRank(bestLifts, bodyweight, sex) {
  const entries = Object.entries(bestLifts || {});
  if (entries.length === 0) return { tier: 0, count: 0 };
  let sum = 0;
  for (const [liftId, e1rm] of entries) {
    sum += tierForLift(liftId, e1rm, bodyweight, sex).tier;
  }
  return { tier: Math.round(sum / entries.length), count: entries.length };
}

const GOAL_SCHEMES = {
  muscle:     { sets: 4, reps: '8–12',  rest: 90,  tempo: 'Controlled' },
  strength:   { sets: 5, reps: '3–5',   rest: 180, tempo: 'Explosive' },
  fat_loss:   { sets: 3, reps: '12–15', rest: 45,  tempo: 'Steady' },
  endurance:  { sets: 3, reps: '15–20', rest: 30,  tempo: 'Continuous' },
  recomp:     { sets: 4, reps: '8–12',  rest: 75,  tempo: 'Controlled' },
  general:    { sets: 3, reps: '10–12', rest: 60,  tempo: 'Controlled' },
  mass:       { sets: 5, reps: '6–10',  rest: 120, tempo: 'Controlled' },
  athletic:   { sets: 4, reps: '5–8',   rest: 90,  tempo: 'Explosive' },
  functional: { sets: 3, reps: '8–12',  rest: 60,  tempo: 'Controlled' },
  mobility:   { sets: 3, reps: '12–15', rest: 30,  tempo: 'Slow + full ROM' },
};

const WORKOUT_PLANS = {
  gym: {
    name: 'Iron Path', split: '4-day Upper/Lower', blockLength: 4,
    days: [
      { name: 'Upper Power', focus: 'Chest · Back · Shoulders',
        core: ['Barbell Bench Press','Bent-Over Row','Overhead Press','Pull-Ups (weighted)'],
        accessoryRotation: [
          ['Dumbbell Lateral Raise','Barbell Curl'],
          ['Cable Lateral Raise','Hammer Curl'],
          ['Face Pulls','EZ-Bar Curl'],
        ],
      },
      { name: 'Lower Power', focus: 'Quads · Glutes · Hamstrings',
        core: ['Back Squat','Romanian Deadlift','Walking Lunges'],
        accessoryRotation: [
          ['Leg Press','Standing Calf Raise','Hanging Leg Raise'],
          ['Hack Squat','Seated Calf Raise','Cable Crunch'],
          ['Goblet Squat','Single-Leg Calf Raise','Ab Wheel Rollout'],
        ],
      },
      { name: 'Upper Volume', focus: 'Chest · Back · Arms',
        core: ['Incline DB Press','Lat Pulldown','Cable Row'],
        accessoryRotation: [
          ['Arnold Press','Tricep Pushdown','Hammer Curl'],
          ['DB Shoulder Press','Skull Crushers','EZ-Bar Curl'],
          ['Landmine Press','Overhead Tricep Extension','Cable Curl'],
        ],
      },
      { name: 'Lower Volume', focus: 'Posterior · Core',
        core: ['Deadlift','Bulgarian Split Squat','Hip Thrust'],
        accessoryRotation: [
          ['Leg Curl','Seated Calf Raise','Cable Crunch'],
          ['Nordic Curls','Standing Calf Raise','Plank'],
          ['Glute-Ham Raise','Single-Leg Calf Raise','Hanging Knee Raise'],
        ],
      },
    ],
  },
  calisthenics: {
    name: 'Bodyweight Forge', split: '4-day Push/Pull/Legs/Skill', blockLength: 4,
    days: [
      { name: 'Push', focus: 'Chest · Shoulders · Triceps',
        core: ['Pseudo Planche Push-Ups','Pike Push-Ups','Dips'],
        accessoryRotation: [
          ['Diamond Push-Ups','Decline Push-Ups','Hollow Body Hold'],
          ['Wide-Grip Push-Ups','Archer Push-Ups','Plank'],
          ['Tempo Push-Ups (3sec down)','Spiderman Push-Ups','Side Plank'],
        ],
      },
      { name: 'Pull', focus: 'Back · Biceps · Grip',
        core: ['Pull-Ups','Chin-Ups','Australian Rows'],
        accessoryRotation: [
          ['Archer Pull-Ups','Towel Hangs','L-Sit Hold'],
          ['Wide-Grip Pull-Ups','Dead Hangs','Tuck L-Sit'],
          ['Commando Pull-Ups','Active Hangs','V-Sit'],
        ],
      },
      { name: 'Legs', focus: 'Quads · Glutes · Hamstrings',
        core: ['Pistol Squats','Bulgarian Split Squat','Nordic Curls'],
        accessoryRotation: [
          ['Jump Squats','Single-Leg Glute Bridge','Calf Raises'],
          ['Box Jumps','Glute Bridge March','Single-Leg Calf Raises'],
          ['Broad Jumps','B-Stance Glute Bridge','Wall Sit'],
        ],
      },
      { name: 'Skill', focus: 'Levers · Handstands · Core',
        core: ['Handstand Practice','Muscle-Up Progressions'],
        accessoryRotation: [
          ['Tuck Front Lever','Tuck Planche','Dragon Flag','V-Ups'],
          ['Inverted Hang','Planche Lean','Hollow Body Hold','Toes-to-Bar'],
          ['Skin the Cat','Pseudo Planche Push-Ups','Hanging Leg Raise','L-Sit Hold'],
        ],
      },
    ],
  },
  mix: {
    name: 'Hybrid Engine', split: '4-day Mixed Modalities', blockLength: 4,
    days: [
      { name: 'Push (Weighted)', focus: 'Strength foundation',
        core: ['Bench Press','Overhead Press','Weighted Dips'],
        accessoryRotation: [
          ['Push-Up Burnout (AMRAP)','Lateral Raise','Plank'],
          ['Diamond Push-Up AMRAP','Cable Lateral Raise','Side Plank'],
          ['Pike Push-Up AMRAP','Face Pulls','Hollow Body Hold'],
        ],
      },
      { name: 'Pull (Bodyweight)', focus: 'Calisthenics mastery',
        core: ['Weighted Pull-Ups','Bent-Over Row','Archer Rows'],
        accessoryRotation: [
          ['Face Pulls','Tuck Lever Hold','Hanging Knee Raise'],
          ['Band Pull-Aparts','Skin the Cat','Hanging Leg Raise'],
          ['Rear Delt Fly','Inverted Hang','Toes-to-Bar'],
        ],
      },
      { name: 'Legs (Heavy)', focus: 'Compound strength',
        core: ['Back Squat','Romanian Deadlift','Walking Lunges'],
        accessoryRotation: [
          ['Pistol Squat (1-leg)','Calf Raise','Hollow Hold'],
          ['Bulgarian Split Squat','Standing Calf Raise','Plank'],
          ['Jump Squats','Single-Leg Calf Raise','V-Ups'],
        ],
      },
      { name: 'Conditioning', focus: 'Engine + skill',
        core: ['Kettlebell Swings','Burpees'],
        accessoryRotation: [
          ['Box Jumps','Handstand Practice','Muscle-Up Work','Farmer\'s Carry'],
          ['Broad Jumps','Wall Walks','Explosive Pull-Ups','Suitcase Carry'],
          ['Jump Squats','Crow Pose','Band-Assisted Muscle-Ups','Dumbbell Carry'],
        ],
      },
    ],
  },
};

// Comprehensive swap suggestions: every exercise in every plan
// diff: 'easier' (regression / beginner-friendly), 'similar' (different gear, same difficulty), 'harder' (progression)
const EXERCISE_SWAPS = {
  // ===== GYM =====
  'Barbell Bench Press': [
    { name: 'Dumbbell Bench Press', diff: 'similar' },
    { name: 'Push-Ups', diff: 'easier' },
    { name: 'Machine Chest Press', diff: 'easier' },
    { name: 'Floor Press', diff: 'similar' },
  ],
  'Bench Press': [
    { name: 'Dumbbell Bench Press', diff: 'similar' },
    { name: 'Push-Ups', diff: 'easier' },
    { name: 'Machine Chest Press', diff: 'easier' },
    { name: 'Floor Press', diff: 'similar' },
  ],
  'Incline DB Press': [
    { name: 'Incline Push-Ups', diff: 'easier' },
    { name: 'Incline Barbell Press', diff: 'similar' },
    { name: 'Incline Machine Press', diff: 'easier' },
    { name: 'Landmine Press', diff: 'similar' },
  ],
  'Bent-Over Row': [
    { name: 'Single-Arm DB Row', diff: 'easier' },
    { name: 'Chest-Supported Row', diff: 'easier' },
    { name: 'Inverted Rows', diff: 'easier' },
    { name: 'Seated Cable Row', diff: 'similar' },
  ],
  'Cable Row': [
    { name: 'Inverted Rows', diff: 'easier' },
    { name: 'Single-Arm DB Row', diff: 'similar' },
    { name: 'Chest-Supported Row', diff: 'easier' },
    { name: 'Bent-Over Row', diff: 'harder' },
  ],
  'Overhead Press': [
    { name: 'Seated DB Press', diff: 'easier' },
    { name: 'Landmine Press', diff: 'easier' },
    { name: 'Pike Push-Ups', diff: 'similar' },
    { name: 'Push Press', diff: 'harder' },
  ],
  'Arnold Press': [
    { name: 'DB Shoulder Press', diff: 'easier' },
    { name: 'Seated DB Press', diff: 'easier' },
    { name: 'Landmine Press', diff: 'easier' },
    { name: 'Overhead Press', diff: 'similar' },
  ],
  'Pull-Ups (weighted)': [
    { name: 'Pull-Ups', diff: 'easier' },
    { name: 'Band-Assisted Pull-Ups', diff: 'easier' },
    { name: 'Lat Pulldown', diff: 'easier' },
    { name: 'Inverted Rows', diff: 'easier' },
  ],
  'Weighted Pull-Ups': [
    { name: 'Pull-Ups', diff: 'easier' },
    { name: 'Band-Assisted Pull-Ups', diff: 'easier' },
    { name: 'Lat Pulldown', diff: 'easier' },
    { name: 'Negative Pull-Ups', diff: 'easier' },
  ],
  'Lat Pulldown': [
    { name: 'Band Pulldowns', diff: 'easier' },
    { name: 'Inverted Rows', diff: 'easier' },
    { name: 'Single-Arm Pulldown', diff: 'similar' },
    { name: 'Pull-Ups', diff: 'harder' },
  ],
  'Dumbbell Lateral Raise': [
    { name: 'Band Lateral Raise', diff: 'easier' },
    { name: 'Cable Lateral Raise', diff: 'similar' },
    { name: 'Machine Lateral Raise', diff: 'easier' },
    { name: 'Plate Lateral Raise', diff: 'similar' },
  ],
  'Lateral Raise': [
    { name: 'Band Lateral Raise', diff: 'easier' },
    { name: 'Cable Lateral Raise', diff: 'similar' },
    { name: 'Machine Lateral Raise', diff: 'easier' },
    { name: 'Plate Lateral Raise', diff: 'similar' },
  ],
  'Barbell Curl': [
    { name: 'Resistance Band Curl', diff: 'easier' },
    { name: 'Cable Curl', diff: 'easier' },
    { name: 'Dumbbell Curl', diff: 'similar' },
    { name: 'EZ-Bar Curl', diff: 'similar' },
  ],
  'Hammer Curl': [
    { name: 'Band Hammer Curl', diff: 'easier' },
    { name: 'Cable Hammer Curl', diff: 'similar' },
    { name: 'Cross-Body Hammer Curl', diff: 'similar' },
    { name: 'DB Curl (neutral grip)', diff: 'similar' },
  ],
  'Tricep Pushdown': [
    { name: 'Bench Dips', diff: 'easier' },
    { name: 'Band Pushdown', diff: 'easier' },
    { name: 'Diamond Push-Ups', diff: 'similar' },
    { name: 'Overhead Tricep Extension', diff: 'similar' },
  ],
  'Back Squat': [
    { name: 'Goblet Squat', diff: 'easier' },
    { name: 'Leg Press', diff: 'easier' },
    { name: 'Bulgarian Split Squat', diff: 'similar' },
    { name: 'Front Squat', diff: 'harder' },
  ],
  'Romanian Deadlift': [
    { name: 'Stiff-Leg DB Deadlift', diff: 'easier' },
    { name: 'Cable Pull-Through', diff: 'easier' },
    { name: 'Good Mornings', diff: 'easier' },
    { name: 'Single-Leg RDL', diff: 'harder' },
  ],
  'Deadlift': [
    { name: 'Hip Hinge with KB', diff: 'easier' },
    { name: 'Trap Bar Deadlift', diff: 'easier' },
    { name: 'Romanian Deadlift', diff: 'easier' },
    { name: 'Sumo Deadlift', diff: 'similar' },
  ],
  'Walking Lunges': [
    { name: 'Reverse Lunges', diff: 'easier' },
    { name: 'Step-Ups', diff: 'easier' },
    { name: 'Stationary Lunges', diff: 'easier' },
    { name: 'Bulgarian Split Squat', diff: 'harder' },
  ],
  'Leg Press': [
    { name: 'Goblet Squat', diff: 'easier' },
    { name: 'Wall Sit', diff: 'easier' },
    { name: 'Bulgarian Split Squat', diff: 'similar' },
    { name: 'Hack Squat', diff: 'similar' },
  ],
  'Bulgarian Split Squat': [
    { name: 'Step-Ups', diff: 'easier' },
    { name: 'Reverse Lunges', diff: 'easier' },
    { name: 'Goblet Squat', diff: 'easier' },
    { name: 'Walking Lunges', diff: 'similar' },
  ],
  'Hip Thrust': [
    { name: 'Glute Bridge', diff: 'easier' },
    { name: 'Cable Pull-Through', diff: 'easier' },
    { name: 'Single-Leg Glute Bridge', diff: 'similar' },
    { name: 'B-Stance Hip Thrust', diff: 'harder' },
  ],
  'Leg Curl': [
    { name: 'Stability Ball Hamstring Curl', diff: 'easier' },
    { name: 'Romanian Deadlift', diff: 'similar' },
    { name: 'Nordic Curl', diff: 'harder' },
    { name: 'Glute-Ham Raise', diff: 'harder' },
  ],
  'Standing Calf Raise': [
    { name: 'Bodyweight Calf Raise', diff: 'easier' },
    { name: 'Seated Calf Raise', diff: 'easier' },
    { name: 'Single-Leg Calf Raise', diff: 'similar' },
    { name: 'Jump Rope', diff: 'similar' },
  ],
  'Seated Calf Raise': [
    { name: 'Bodyweight Calf Raise', diff: 'easier' },
    { name: 'Standing Calf Raise', diff: 'similar' },
    { name: 'Single-Leg Calf Raise', diff: 'harder' },
  ],
  'Calf Raises': [
    { name: 'Seated Calf Raise', diff: 'easier' },
    { name: 'Standing Calf Raise', diff: 'similar' },
    { name: 'Single-Leg Calf Raise', diff: 'harder' },
  ],
  'Calf Raise': [
    { name: 'Seated Calf Raise', diff: 'easier' },
    { name: 'Standing Calf Raise', diff: 'similar' },
    { name: 'Single-Leg Calf Raise', diff: 'harder' },
  ],
  'Hanging Leg Raise': [
    { name: 'Lying Leg Raise', diff: 'easier' },
    { name: 'Hanging Knee Raise', diff: 'easier' },
    { name: 'Captain\'s Chair Knee Raise', diff: 'easier' },
    { name: 'Toes-to-Bar', diff: 'harder' },
  ],
  'Hanging Knee Raise': [
    { name: 'Lying Knee Raise', diff: 'easier' },
    { name: 'Captain\'s Chair Knee Raise', diff: 'easier' },
    { name: 'Hanging Leg Raise', diff: 'harder' },
  ],
  'Cable Crunch': [
    { name: 'Crunches', diff: 'easier' },
    { name: 'Sit-Ups', diff: 'easier' },
    { name: 'Decline Crunch', diff: 'similar' },
    { name: 'Weighted Crunch', diff: 'similar' },
  ],

  // ===== CALISTHENICS =====
  'Pseudo Planche Push-Ups': [
    { name: 'Standard Push-Ups', diff: 'easier' },
    { name: 'Incline Push-Ups', diff: 'easier' },
    { name: 'Diamond Push-Ups', diff: 'similar' },
    { name: 'Decline Push-Ups', diff: 'harder' },
  ],
  'Pike Push-Ups': [
    { name: 'Wall-Supported Pike Push-Ups', diff: 'easier' },
    { name: 'Incline Push-Ups', diff: 'easier' },
    { name: 'Standard Push-Ups', diff: 'easier' },
    { name: 'DB Shoulder Press', diff: 'similar' },
    { name: 'Handstand Push-Ups', diff: 'harder' },
  ],
  'Dips': [
    { name: 'Bench Dips', diff: 'easier' },
    { name: 'Band-Assisted Dips', diff: 'easier' },
    { name: 'Push-Ups', diff: 'easier' },
    { name: 'Ring Dips', diff: 'harder' },
  ],
  'Weighted Dips': [
    { name: 'Dips', diff: 'easier' },
    { name: 'Bench Dips', diff: 'easier' },
    { name: 'Band-Assisted Dips', diff: 'easier' },
    { name: 'Ring Dips', diff: 'similar' },
  ],
  'Diamond Push-Ups': [
    { name: 'Standard Push-Ups', diff: 'easier' },
    { name: 'Incline Diamond Push-Ups', diff: 'easier' },
    { name: 'Tricep Pushdown', diff: 'easier' },
    { name: 'Close-Grip Bench Press', diff: 'similar' },
  ],
  'Decline Push-Ups': [
    { name: 'Standard Push-Ups', diff: 'easier' },
    { name: 'Incline Push-Ups', diff: 'easier' },
    { name: 'Pike Push-Ups', diff: 'similar' },
    { name: 'Handstand Push-Ups', diff: 'harder' },
  ],
  'Push-Up Burnout (AMRAP)': [
    { name: 'Knee Push-Ups', diff: 'easier' },
    { name: 'Incline Push-Ups', diff: 'easier' },
    { name: 'Diamond Push-Ups', diff: 'harder' },
    { name: 'Decline Push-Ups', diff: 'harder' },
  ],
  'Hollow Body Hold': [
    { name: 'Tuck Hollow Hold', diff: 'easier' },
    { name: 'Dead Bug', diff: 'easier' },
    { name: 'Plank', diff: 'easier' },
    { name: 'V-Ups', diff: 'harder' },
  ],
  'Hollow Hold': [
    { name: 'Tuck Hollow Hold', diff: 'easier' },
    { name: 'Dead Bug', diff: 'easier' },
    { name: 'Plank', diff: 'easier' },
    { name: 'V-Ups', diff: 'harder' },
  ],
  'Plank': [
    { name: 'Knee Plank', diff: 'easier' },
    { name: 'Wall Plank', diff: 'easier' },
    { name: 'Side Plank', diff: 'similar' },
    { name: 'Plank with Reach', diff: 'harder' },
  ],
  'Pull-Ups': [
    { name: 'Band-Assisted Pull-Ups', diff: 'easier' },
    { name: 'Inverted Rows', diff: 'easier' },
    { name: 'Negative Pull-Ups', diff: 'easier' },
    { name: 'Lat Pulldown', diff: 'easier' },
  ],
  'Chin-Ups': [
    { name: 'Band-Assisted Chin-Ups', diff: 'easier' },
    { name: 'Negative Chin-Ups', diff: 'easier' },
    { name: 'Inverted Rows (underhand)', diff: 'easier' },
    { name: 'Pull-Ups', diff: 'harder' },
  ],
  'Australian Rows': [
    { name: 'Band Pulldowns', diff: 'easier' },
    { name: 'Inverted Rows', diff: 'similar' },
    { name: 'DB Row', diff: 'similar' },
    { name: 'Pull-Ups', diff: 'harder' },
  ],
  'Archer Pull-Ups': [
    { name: 'Pull-Ups', diff: 'easier' },
    { name: 'Band-Assisted Archer Pull-Ups', diff: 'easier' },
    { name: 'Wide-Grip Pull-Ups', diff: 'easier' },
    { name: 'One-Arm Pull-Up Progression', diff: 'harder' },
  ],
  'Archer Rows': [
    { name: 'Inverted Rows', diff: 'easier' },
    { name: 'Single-Arm DB Row', diff: 'similar' },
    { name: 'Australian Rows', diff: 'easier' },
    { name: 'Pull-Ups', diff: 'harder' },
  ],
  'Towel Hangs': [
    { name: 'Dead Hangs', diff: 'easier' },
    { name: 'Active Hangs', diff: 'similar' },
    { name: 'Farmer\'s Carry', diff: 'similar' },
    { name: 'Thick Bar Hang', diff: 'harder' },
  ],
  'L-Sit Hold': [
    { name: 'Tuck L-Sit', diff: 'easier' },
    { name: 'One-Leg L-Sit', diff: 'easier' },
    { name: 'Hanging Knee Raise', diff: 'easier' },
    { name: 'V-Sit', diff: 'harder' },
  ],
  'Face Pulls': [
    { name: 'Band Pull-Aparts', diff: 'easier' },
    { name: 'Band Face Pulls', diff: 'easier' },
    { name: 'Reverse Pec Deck', diff: 'easier' },
    { name: 'Rear Delt Fly', diff: 'similar' },
  ],
  'Pistol Squats': [
    { name: 'Box Pistol Squat (sit & stand)', diff: 'easier' },
    { name: 'Assisted Pistol (hold a pole)', diff: 'easier' },
    { name: 'Bulgarian Split Squat', diff: 'easier' },
    { name: 'Walking Lunges', diff: 'easier' },
  ],
  'Pistol Squat (1-leg)': [
    { name: 'Box Pistol Squat', diff: 'easier' },
    { name: 'Assisted Pistol', diff: 'easier' },
    { name: 'Bulgarian Split Squat', diff: 'easier' },
    { name: 'Step-Ups', diff: 'easier' },
  ],
  'Nordic Curls': [
    { name: 'Band-Assisted Nordic', diff: 'easier' },
    { name: 'Stability Ball Hamstring Curl', diff: 'easier' },
    { name: 'Romanian Deadlift', diff: 'easier' },
    { name: 'Glute-Ham Raise', diff: 'similar' },
  ],
  'Jump Squats': [
    { name: 'Bodyweight Squats', diff: 'easier' },
    { name: 'Squat to Calf Raise', diff: 'easier' },
    { name: 'Box Jumps', diff: 'similar' },
    { name: 'Broad Jumps', diff: 'harder' },
  ],
  'Single-Leg Glute Bridge': [
    { name: 'Glute Bridge (two legs)', diff: 'easier' },
    { name: 'B-Stance Glute Bridge', diff: 'similar' },
    { name: 'Hip Thrust', diff: 'harder' },
  ],
  'Handstand Practice': [
    { name: 'Wall Handstand Hold', diff: 'easier' },
    { name: 'Pike Push-Ups', diff: 'easier' },
    { name: 'Wall Walks', diff: 'easier' },
    { name: 'Crow Pose', diff: 'easier' },
  ],
  'Tuck Front Lever': [
    { name: 'Inverted Hang', diff: 'easier' },
    { name: 'Hanging Tuck Hold', diff: 'easier' },
    { name: 'Skin the Cat', diff: 'easier' },
    { name: 'Advanced Tuck Lever', diff: 'harder' },
  ],
  'Tuck Planche': [
    { name: 'Planche Lean', diff: 'easier' },
    { name: 'Pseudo Planche Push-Ups', diff: 'easier' },
    { name: 'Crow Pose', diff: 'easier' },
    { name: 'Advanced Tuck Planche', diff: 'harder' },
  ],
  'Tuck Lever Hold': [
    { name: 'Inverted Hang', diff: 'easier' },
    { name: 'Hanging Tuck Hold', diff: 'easier' },
    { name: 'Skin the Cat', diff: 'easier' },
  ],
  'Muscle-Up Progressions': [
    { name: 'Explosive Pull-Ups', diff: 'easier' },
    { name: 'Straight Bar Dips', diff: 'easier' },
    { name: 'Band-Assisted Muscle-Ups', diff: 'easier' },
    { name: 'Full Muscle-Up', diff: 'harder' },
  ],
  'Muscle-Up Work': [
    { name: 'Explosive Pull-Ups', diff: 'easier' },
    { name: 'Straight Bar Dips', diff: 'easier' },
    { name: 'Band-Assisted Muscle-Ups', diff: 'easier' },
    { name: 'Full Muscle-Up', diff: 'harder' },
  ],
  'Dragon Flag': [
    { name: 'Lying Leg Raise', diff: 'easier' },
    { name: 'Tuck Dragon Flag', diff: 'easier' },
    { name: 'Negative Dragon Flag', diff: 'easier' },
    { name: 'Hollow Body Hold', diff: 'easier' },
  ],
  'V-Ups': [
    { name: 'Tuck Ups', diff: 'easier' },
    { name: 'Sit-Ups', diff: 'easier' },
    { name: 'Hollow Body Hold', diff: 'easier' },
    { name: 'Toes-to-Bar', diff: 'harder' },
  ],

  // ===== HYBRID / CONDITIONING =====
  'Kettlebell Swings': [
    { name: 'Hip Hinge (no weight)', diff: 'easier' },
    { name: 'Dumbbell Swings', diff: 'similar' },
    { name: 'Goblet Squat', diff: 'similar' },
    { name: 'Romanian Deadlift', diff: 'similar' },
  ],
  'Burpees': [
    { name: 'Half Burpees (no jump)', diff: 'easier' },
    { name: 'Step-Back Burpees', diff: 'easier' },
    { name: 'Squat Thrust', diff: 'easier' },
    { name: 'Burpee Pull-Ups', diff: 'harder' },
  ],
  'Box Jumps': [
    { name: 'Step-Ups', diff: 'easier' },
    { name: 'Low Box Jumps', diff: 'easier' },
    { name: 'Jump Squats', diff: 'similar' },
    { name: 'Broad Jumps', diff: 'similar' },
  ],
  'Farmer\'s Carry': [
    { name: 'Dumbbell Hold', diff: 'easier' },
    { name: 'Suitcase Carry (1-arm)', diff: 'similar' },
    { name: 'Dead Hang', diff: 'similar' },
    { name: 'Trap Bar Hold', diff: 'similar' },
  ],
};

// Generic fallback — used if an exercise has no specific mapping
const GENERIC_SWAPS = [
  { name: 'Ask the Coach for an alternative', diff: 'similar' },
];

const FOOD_DB = [
  { name: 'Chicken Breast, cooked', kcal: 165, p: 31,  c: 0,    f: 3.6, unit: '100g', tags: [] },
  { name: 'Lean Ground Beef (90/10)', kcal: 176, p: 20, c: 0,    f: 10,  unit: '100g', tags: [] },
  { name: 'Salmon, cooked',         kcal: 208, p: 22,  c: 0,    f: 13,  unit: '100g', tags: ['pescatarian'] },
  { name: 'Tuna, canned in water',  kcal: 116, p: 26,  c: 0,    f: 1,   unit: '100g', tags: ['pescatarian'] },
  { name: 'Tofu, firm',             kcal: 144, p: 17,  c: 3,    f: 9,   unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Tempeh',                 kcal: 192, p: 20,  c: 8,    f: 11,  unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Lentils, cooked',        kcal: 116, p: 9,   c: 20,   f: 0.4, unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Chickpeas, cooked',      kcal: 164, p: 9,   c: 27,   f: 2.6, unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Whole Egg, large',       kcal: 78,  p: 6,   c: 0.6,  f: 5,   unit: '1 egg', tags: ['vegetarian'] },
  { name: 'Egg Whites',             kcal: 52,  p: 11,  c: 0.7,  f: 0.2, unit: '100g', tags: ['vegetarian'] },
  { name: 'Greek Yogurt, 0%',       kcal: 59,  p: 10,  c: 3.6,  f: 0.4, unit: '100g', tags: ['vegetarian'] },
  { name: 'Cottage Cheese, 2%',     kcal: 81,  p: 11,  c: 4.3,  f: 2.3, unit: '100g', tags: ['vegetarian'] },
  { name: 'Whey Protein, 1 scoop',  kcal: 120, p: 24,  c: 3,    f: 1.5, unit: 'scoop (30g)', tags: ['vegetarian'] },
  { name: 'Plant Protein, 1 scoop', kcal: 110, p: 22,  c: 4,    f: 1.5, unit: 'scoop (30g)', tags: ['vegan','vegetarian'] },
  { name: 'White Rice, cooked',     kcal: 130, p: 2.7, c: 28,   f: 0.3, unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Brown Rice, cooked',     kcal: 112, p: 2.6, c: 24,   f: 0.9, unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Oats, dry',              kcal: 379, p: 13,  c: 68,   f: 7,   unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Sweet Potato, baked',    kcal: 90,  p: 2,   c: 21,   f: 0.2, unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Pasta, cooked',          kcal: 158, p: 5.8, c: 31,   f: 0.9, unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Bread, whole wheat',     kcal: 247, p: 13,  c: 41,   f: 3.4, unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Quinoa, cooked',         kcal: 120, p: 4.4, c: 21.3, f: 1.9, unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Banana',                 kcal: 89,  p: 1.1, c: 23,   f: 0.3, unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Apple',                  kcal: 52,  p: 0.3, c: 14,   f: 0.2, unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Blueberries',            kcal: 57,  p: 0.7, c: 14,   f: 0.3, unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Almonds',                kcal: 579, p: 21,  c: 22,   f: 50,  unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Peanut Butter',          kcal: 588, p: 25,  c: 20,   f: 50,  unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Olive Oil',              kcal: 884, p: 0,   c: 0,    f: 100, unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Avocado',                kcal: 160, p: 2,   c: 9,    f: 15,  unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Broccoli, cooked',       kcal: 35,  p: 2.4, c: 7,    f: 0.4, unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Spinach, raw',           kcal: 23,  p: 2.9, c: 3.6,  f: 0.4, unit: '100g', tags: ['vegan','vegetarian'] },
  { name: 'Milk, 2%',               kcal: 50,  p: 3.3, c: 4.8,  f: 2,   unit: '100ml', tags: ['vegetarian'] },
  { name: 'Soy Milk, unsweetened',  kcal: 33,  p: 3.3, c: 1.8,  f: 1.8, unit: '100ml', tags: ['vegan','vegetarian'] },
  { name: 'Black Coffee',           kcal: 2,   p: 0.3, c: 0,    f: 0,   unit: '100ml', tags: ['vegan','vegetarian'] },
];

// ============================================================
// STYLE TOKENS
// ============================================================

const C = {
  bg: '#08080a',
  panel: '#111114',
  panel2: '#16161b',
  line: '#22222a',
  text: '#f5f5f0',
  dim: '#7a7a82',
  accent: '#d8ff36',
  accent2: '#ff5c2b',
  blue: '#5cc8ff',
  danger: '#ff3355',
};
const fontDisplay = "'Anton', 'Arial Narrow', sans-serif";
const fontBody = "'DM Sans', system-ui, sans-serif";
const fontMono = "'JetBrains Mono', ui-monospace, monospace";

// ============================================================
// HELPERS
// ============================================================

const todayStr = () => new Date().toISOString().split('T')[0];
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; };
const isTeen = (p) => p && p.age >= 13 && p.age < 18;
const goalsFor = (p) => isTeen(p) ? GOALS_TEEN : GOALS_ADULT;

function calculateBMR(weight, height, age, sex) {
  // Mifflin-St Jeor
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'female' ? base - 161 : base + 5;
}

function calculateNutrition(profile) {
  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.sex);
  const activity = ACTIVITY_LEVELS.find(a => a.id === profile.activity);
  const tdee = Math.round(bmr * activity.mult);
  const allGoals = goalsFor(profile);
  const goal = allGoals.find(g => g.id === profile.goal) || allGoals[0];

  let surplus = goal.surplus;

  // Teen safety: cap any deficit, add growth allowance
  if (isTeen(profile)) {
    if (surplus < -200) surplus = -200;
    surplus += 50; // small growth allowance
  }

  let target = Math.round(tdee + surplus);

  // Calorie floors (especially important for teens)
  if (isTeen(profile)) {
    const floor = profile.sex === 'female' ? 1800 : 2000;
    if (target < floor) target = floor;
  } else {
    const floor = profile.sex === 'female' ? 1300 : 1500;
    if (target < floor) target = floor;
  }

  const protein = Math.round(profile.weight * goal.proteinPerKg);
  const fat = Math.round((target * (isTeen(profile) ? 0.30 : 0.27)) / 9);
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));
  const waterLiters = Math.round((profile.weight * 0.035) * 10) / 10; // ~35ml per kg
  const waterCups = Math.max(6, Math.round(waterLiters * 1000 / 250));

  return {
    bmr: Math.round(bmr), tdee, target,
    protein, carbs, fat,
    waterCups, waterLiters,
    isTeenMode: isTeen(profile),
  };
}

async function loadKey(key, fallback) {
  try {
    const r = await storage.get(key);
    if (r && r.value) return JSON.parse(r.value);
  } catch (_) {}
  return fallback;
}

function computeStreak(completedDays) {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().split('T')[0];
    if (completedDays[key] !== undefined) streak += 1;
    else if (i !== 0) break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// === Periodization: rotate accessories every block, deload last week of block ===
function getProgramWeek(createdAt) {
  if (!createdAt) return 0;
  const diff = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)));
}

function getBlockInfo(profile, plan) {
  const blockLength = plan.blockLength || 4;
  const week = getProgramWeek(profile.createdAt);
  const blockIndex = Math.floor(week / blockLength);
  const weekInBlock = week % blockLength;
  const isDeload = weekInBlock === blockLength - 1;
  return { week, blockIndex, weekInBlock, blockLength, isDeload };
}

function getExercisesForDay(day, blockIndex) {
  if (!day.core) return day.exercises || [];
  const accessories = day.accessoryRotation[blockIndex % day.accessoryRotation.length] || [];
  return [...day.core, ...accessories];
}

function adjustScheme(scheme, isDeload) {
  if (!isDeload) return scheme;
  return { ...scheme, sets: Math.max(2, scheme.sets - 1), rest: scheme.rest + 15 };
}

// Map today's calendar day to a plan day index, or signal rest
function getTodaysPlanDay(profile, plan) {
  const dayIds = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const todayId = dayIds[new Date().getDay()];
  const trainingDays = (profile && profile.trainingDays && profile.trainingDays.length)
    ? profile.trainingDays
    : DEFAULT_TRAINING_DAYS[profile?.daysPerWeek] || DEFAULT_TRAINING_DAYS[4];
  // Order training days by week order, then map to plan days
  const ordered = WEEK_DAYS.filter(d => trainingDays.includes(d.id)).map(d => d.id);
  const idx = ordered.indexOf(todayId);
  if (idx < 0) return { isRest: true, planDay: 0, schedule: ordered };
  return { isRest: false, planDay: idx % plan.days.length, schedule: ordered };
}

// ============================================================
// ROOT
// ============================================================

export default function ForgeApp() {
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState(null);
  const [foodLog, setFoodLog] = useState({ date: todayStr(), items: [] });
  const [water, setWater] = useState({ date: todayStr(), cups: 0 });
  const [weights, setWeights] = useState([]); // [{date, kg}]
  const [wellness, setWellness] = useState({}); // { 'YYYY-MM-DD': {sleep, energy, mood} }
  const [physiqueLog, setPhysiqueLog] = useState([]); // [{at, date, thumb, rating, strengths[], focus[], encouragement}]
  const [liftLog, setLiftLog] = useState([]); // [{id, exercise, weight, reps, e1rm, at, source}]
  const [completedDays, setCompletedDays] = useState({});
  const [tab, setTab] = useState('home');
  const [editing, setEditing] = useState(false);

  // Fonts
  useEffect(() => {
    if (document.getElementById('forge-fonts')) return;
    const link = document.createElement('link');
    link.id = 'forge-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap';
    document.head.appendChild(link);
  }, []);

  // Load state
  useEffect(() => {
    (async () => {
      const [p, f, w, wt, wl, cd, pq, ll] = await Promise.all([
        loadKey('forge2:profile', null),
        loadKey('forge2:foodLog', null),
        loadKey('forge2:water', null),
        loadKey('forge2:weights', []),
        loadKey('forge2:wellness', {}),
        loadKey('forge2:completedDays', {}),
        loadKey('forge2:physique', []),
        loadKey('forge2:lifts', []),
      ]);
      if (p) {
        // Migration: older profiles don't have trainingDays
        if (!p.trainingDays) {
          p.trainingDays = DEFAULT_TRAINING_DAYS[p.daysPerWeek] || DEFAULT_TRAINING_DAYS[4];
        }
        // Migration: older profiles have `goal` (single) but not `goals` (array)
        if (!p.goals || p.goals.length === 0) {
          p.goals = p.goal ? [p.goal] : [];
        }
        setProfile(p);
      }
      if (f && f.date === todayStr()) setFoodLog(f);
      else setFoodLog({ date: todayStr(), items: [] });
      if (w && w.date === todayStr()) setWater(w);
      else setWater({ date: todayStr(), cups: 0 });
      if (wt) setWeights(wt);
      if (wl) setWellness(wl);
      if (cd) setCompletedDays(cd);
      if (pq) setPhysiqueLog(pq);
      if (ll) setLiftLog(ll);
      setLoaded(true);
    })();
  }, []);

  // Persist
  useEffect(() => { if (loaded && profile) storage.set('forge2:profile', JSON.stringify(profile)).catch(()=>{}); }, [profile, loaded]);
  useEffect(() => { if (loaded) storage.set('forge2:foodLog', JSON.stringify(foodLog)).catch(()=>{}); }, [foodLog, loaded]);
  useEffect(() => { if (loaded) storage.set('forge2:water', JSON.stringify(water)).catch(()=>{}); }, [water, loaded]);
  useEffect(() => { if (loaded) storage.set('forge2:weights', JSON.stringify(weights)).catch(()=>{}); }, [weights, loaded]);
  useEffect(() => { if (loaded) storage.set('forge2:wellness', JSON.stringify(wellness)).catch(()=>{}); }, [wellness, loaded]);
  useEffect(() => { if (loaded) storage.set('forge2:completedDays', JSON.stringify(completedDays)).catch(()=>{}); }, [completedDays, loaded]);
  useEffect(() => { if (loaded) storage.set('forge2:physique', JSON.stringify(physiqueLog)).catch(()=>{}); }, [physiqueLog, loaded]);
  useEffect(() => { if (loaded) storage.set('forge2:lifts', JSON.stringify(liftLog)).catch(()=>{}); }, [liftLog, loaded]);

  const reset = async () => {
    setProfile(null);
    setFoodLog({ date: todayStr(), items: [] });
    setWater({ date: todayStr(), cups: 0 });
    setWeights([]);
    setWellness({});
    setPhysiqueLog([]);
    setLiftLog([]);
    setCompletedDays({});
    setTab('home');
    try {
      for (const k of ['forge2:profile','forge2:foodLog','forge2:water','forge2:weights','forge2:wellness','forge2:completedDays','forge2:physique','forge2:lifts']) {
        await storage.delete(k);
      }
    } catch(_){}
  };

  if (!loaded) {
    return (
      <div style={{ background: C.bg, color: C.text, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontBody }}>
        <Loader2 className="animate-spin" size={32} style={{ color: C.accent }} />
      </div>
    );
  }

  if (!profile) return <Onboarding onDone={setProfile} />;

  const nutrition = calculateNutrition(profile);
  const consumed = foodLog.items.reduce((a, it) => ({
    kcal: a.kcal + it.kcal, p: a.p + it.p, c: a.c + it.c, f: a.f + it.f,
  }), { kcal: 0, p: 0, c: 0, f: 0 });
  const streak = computeStreak(completedDays);

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: fontBody }}>
      <Header profile={profile} streak={streak} onEdit={() => setEditing(true)} nutrition={nutrition} />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 120px' }}>
        {tab === 'home' && (
          <Dashboard profile={profile} nutrition={nutrition} consumed={consumed}
            completedDays={completedDays} streak={streak} weights={weights}
            water={water} wellness={wellness} liftLog={liftLog} setTab={setTab} />
        )}
        {tab === 'workouts' && (
          <Workouts profile={profile} completedDays={completedDays} setCompletedDays={setCompletedDays}
            liftLog={liftLog} setLiftLog={setLiftLog} />
        )}
        {tab === 'rank' && (
          <RankTab profile={profile} liftLog={liftLog} setLiftLog={setLiftLog}
            physiqueLog={physiqueLog} setPhysiqueLog={setPhysiqueLog} />
        )}
        {tab === 'nutrition' && (
          <Nutrition profile={profile} nutrition={nutrition} consumed={consumed}
            foodLog={foodLog} setFoodLog={setFoodLog} />
        )}
        {tab === 'coach' && (
          <Coach profile={profile} nutrition={nutrition} consumed={consumed}
            water={water} weights={weights} wellness={wellness}
            completedDays={completedDays} />
        )}
      </main>

      <BottomNav tab={tab} setTab={setTab} />
      <InstallPrompt />
      {editing && (
        <EditProfile
          profile={profile}
          onSave={(updated) => { setProfile(updated); storage.set('forge2:profile', updated); }}
          onClose={() => setEditing(false)}
          onReset={() => { setEditing(false); reset(); }}
        />
      )}
    </div>
  );
}

// ============================================================
// EDIT PROFILE
// ============================================================
// Full-screen overlay for editing profile data without losing
// food logs, weight history, streak, etc.
function EditProfile({ profile, onSave, onClose, onReset }) {
  const [d, setD] = useState({ ...profile });
  const set = (patch) => setD(prev => ({ ...prev, ...patch }));
  const isTeenAge = d.age >= 13 && d.age < 18;
  const allGoals = isTeenAge ? GOALS_TEEN : GOALS_ADULT;
  const [confirmReset, setConfirmReset] = useState(false);

  const toggleGoal = (id) => {
    const has = d.goals?.includes(id);
    const next = has ? d.goals.filter(g => g !== id) : [...(d.goals || []), id];
    set({ goals: next, goal: next[0] || null });
  };
  const toggle = (key, val) => {
    const arr = d[key] || [];
    const has = arr.includes(val);
    set({ [key]: has ? arr.filter(x => x !== val) : [...arr, val] });
  };

  const save = () => {
    if (!d.goals || d.goals.length === 0) {
      alert('Pick at least one goal before saving.');
      return;
    }
    onSave({ ...d, goal: d.goals[0] });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: C.bg, color: C.text,
      zIndex: 300, overflow: 'auto', fontFamily: fontBody,
    }}>
      {/* Sticky top bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        borderBottom: `1px solid ${C.line}`, background: 'rgba(8,8,10,0.96)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: fontMono, fontSize: 10, color: C.accent, letterSpacing: 2 }}>/ EDIT PROFILE</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 22, letterSpacing: 1, lineHeight: 1, marginTop: 2 }}>YOUR SETUP</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            border: `1px solid ${C.line}`, background: 'transparent', color: C.text,
            padding: '6px 8px', cursor: 'pointer',
          }}><X size={16} /></button>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 140px' }}>

        {/* ===== BASICS ===== */}
        <SectionTitle>BASICS</SectionTitle>
        <Field label="Name">
          <input value={d.name || ''} onChange={e => set({ name: e.target.value })}
            style={inputStyle} placeholder="What should we call you?" />
        </Field>
        <Field label="Birthday">
          <input type="date" value={d.birthday || ''}
            min={minBirthday()} max={maxBirthday()}
            onChange={e => {
              const bd = e.target.value;
              const a = computeAge(bd);
              set({ birthday: bd, age: a || d.age });
            }}
            style={{ ...inputStyle, colorScheme: 'dark' }} />
          {d.birthday && d.age && (
            <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 2, marginTop: 6 }}>
              / {d.age} YEARS OLD
            </div>
          )}
        </Field>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, letterSpacing: 2, marginBottom: 8 }}>SEX</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['male', 'female'].map(s => (
              <button key={s} onClick={() => set({ sex: s })} style={{
                padding: '10px 16px', cursor: 'pointer',
                background: d.sex === s ? C.accent : 'transparent',
                border: `1px solid ${d.sex === s ? C.accent : C.line}`,
                color: d.sex === s ? '#000' : C.text,
                fontFamily: fontMono, fontSize: 12, letterSpacing: 1,
              }}>{s.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {/* ===== BODY ===== */}
        <SectionTitle>BODY</SectionTitle>
        <NumberSlider label="Height" value={d.height} onChange={v => set({ height: v })} min={120} max={220} unit=" cm" />
        <div style={{ marginTop: 18 }}>
          <NumberSlider label="Weight" value={d.weight} onChange={v => set({ weight: v })} min={30} max={200} unit=" kg" />
        </div>

        {/* ===== GOALS ===== */}
        <SectionTitle>GOALS</SectionTitle>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, marginBottom: 12 }}>
          Tap any. First tap = primary (drives calorie target).
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {allGoals.map((g) => {
            const on = (d.goals || []).includes(g.id);
            const isPrimary = (d.goals || [])[0] === g.id;
            return (
              <button key={g.id} onClick={() => toggleGoal(g.id)} style={{
                position: 'relative', textAlign: 'left', padding: '12px 14px',
                background: on ? C.panel : 'transparent', cursor: 'pointer',
                border: `${isPrimary ? 2 : 1}px solid ${on ? C.accent : C.line}`,
              }}>
                {isPrimary && (
                  <div style={{
                    position: 'absolute', top: 6, right: 8,
                    fontFamily: fontMono, fontSize: 9, color: C.accent, letterSpacing: 1.5,
                  }}>★ PRIMARY</div>
                )}
                <div style={{ fontFamily: fontMono, fontSize: 10, color: on ? C.accent : C.dim, letterSpacing: 2 }}>{g.tag}</div>
                <div style={{ fontFamily: fontDisplay, fontSize: 22, letterSpacing: 0.5, marginTop: 2 }}>{g.name.toUpperCase()}</div>
                <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, marginTop: 4 }}>
                  {g.surplus > 0 ? '+' : ''}{g.surplus} kcal · {g.proteinPerKg}g/kg protein
                </div>
              </button>
            );
          })}
        </div>

        {/* ===== GOAL DETAILS ===== */}
        <SectionTitle>GOAL DETAILS</SectionTitle>
        {!isTeenAge && (
          <div style={{ marginBottom: 18 }}>
            <NumberSlider label="Dream weight" value={d.targetWeight ?? d.weight}
              onChange={v => set({ targetWeight: v })} min={30} max={200} unit=" kg" />
            <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 2, marginTop: 6 }}>
              {(() => {
                const target = d.targetWeight ?? d.weight;
                const diff = +(target - d.weight).toFixed(1);
                if (Math.abs(diff) < 0.5) return '/ MAINTAINING';
                if (diff < 0) return `/ LOSING ${Math.abs(diff)} KG`;
                return `/ GAINING ${diff} KG`;
              })()}
            </div>
          </div>
        )}

        <Field label="Timeline">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[{ id: '3mo', label: '3 MONTHS' }, { id: '6mo', label: '6 MONTHS' },
              { id: '12mo', label: '1 YEAR' }, { id: 'norush', label: 'NO RUSH' }].map(t => {
              const on = d.timeline === t.id;
              return (
                <button key={t.id} onClick={() => set({ timeline: t.id })} style={{
                  padding: '8px 14px', cursor: 'pointer',
                  background: on ? C.accent : 'transparent',
                  border: `1px solid ${on ? C.accent : C.line}`,
                  color: on ? '#000' : C.text,
                  fontFamily: fontMono, fontSize: 12, letterSpacing: 1,
                }}>{t.label}</button>
              );
            })}
          </div>
        </Field>

        <Field label="Focus areas">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Chest','Back','Shoulders','Arms','Legs','Glutes','Core'].map(a => {
              const on = (d.focusAreas || []).includes(a);
              return (
                <button key={a} onClick={() => toggle('focusAreas', a)} style={{
                  padding: '6px 12px', cursor: 'pointer',
                  background: on ? C.accent : 'transparent',
                  border: `1px solid ${on ? C.accent : C.line}`,
                  color: on ? '#000' : C.text, fontSize: 13, fontFamily: fontMono, letterSpacing: 1,
                }}>{a.toUpperCase()}</button>
              );
            })}
          </div>
        </Field>

        <Field label="Specific milestones">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['First pull-up','10 pull-ups','Bench bodyweight','Squat 1.5x bw',
              'Deadlift 2x bw','Handstand 30s','Muscle-up','Run 5K','Run 10K',
              'Visible abs','Touch toes','Splits','Pistol squat'].map(g => {
              const on = (d.strengthGoals || []).includes(g);
              return (
                <button key={g} onClick={() => toggle('strengthGoals', g)} style={{
                  padding: '6px 12px', cursor: 'pointer',
                  background: on ? C.accent : 'transparent',
                  border: `1px solid ${on ? C.accent : C.line}`,
                  color: on ? '#000' : C.text, fontSize: 13, fontFamily: fontMono, letterSpacing: 1,
                }}>{g.toUpperCase()}</button>
              );
            })}
          </div>
        </Field>

        {/* ===== TRAINING ===== */}
        <SectionTitle>TRAINING</SectionTitle>
        <Field label="Experience">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { id: 'beginner', label: 'BEGINNER' },
              { id: 'intermediate', label: 'INTERMEDIATE' },
              { id: 'advanced', label: 'ADVANCED' },
            ].map(e => (
              <button key={e.id} onClick={() => set({ experience: e.id })} style={{
                padding: '8px 14px', cursor: 'pointer',
                background: d.experience === e.id ? C.accent : 'transparent',
                border: `1px solid ${d.experience === e.id ? C.accent : C.line}`,
                color: d.experience === e.id ? '#000' : C.text,
                fontFamily: fontMono, fontSize: 12, letterSpacing: 1,
              }}>{e.label}</button>
            ))}
          </div>
        </Field>

        <Field label="Days per week">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[3, 4, 5, 6].map(n => (
              <button key={n} onClick={() => set({
                daysPerWeek: n,
                trainingDays: DEFAULT_TRAINING_DAYS[n] || d.trainingDays,
              })} style={{
                padding: '8px 16px', cursor: 'pointer',
                background: d.daysPerWeek === n ? C.accent : 'transparent',
                border: `1px solid ${d.daysPerWeek === n ? C.accent : C.line}`,
                color: d.daysPerWeek === n ? '#000' : C.text,
                fontFamily: fontMono, fontSize: 14,
              }}>{n}</button>
            ))}
          </div>
        </Field>

        <Field label="Session length (minutes)">
          <NumberSlider label="" value={d.sessionLength} onChange={v => set({ sessionLength: v })}
            min={20} max={120} step={5} unit=" min" />
        </Field>

        {/* ===== NUTRITION ===== */}
        <SectionTitle>NUTRITION</SectionTitle>
        <Field label="Diet">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['omnivore','vegetarian','vegan','pescatarian','halal','kosher'].map(diet => (
              <button key={diet} onClick={() => set({ diet })} style={{
                padding: '8px 14px', cursor: 'pointer',
                background: d.diet === diet ? C.accent : 'transparent',
                border: `1px solid ${d.diet === diet ? C.accent : C.line}`,
                color: d.diet === diet ? '#000' : C.text,
                fontFamily: fontMono, fontSize: 12, letterSpacing: 1,
              }}>{diet.toUpperCase()}</button>
            ))}
          </div>
        </Field>

        <Field label="Allergens / avoid">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['dairy','gluten','nuts','eggs','soy','shellfish'].map(a => {
              const on = (d.allergens || []).includes(a);
              return (
                <button key={a} onClick={() => toggle('allergens', a)} style={{
                  padding: '6px 12px', cursor: 'pointer',
                  background: on ? C.accent : 'transparent',
                  border: `1px solid ${on ? C.accent : C.line}`,
                  color: on ? '#000' : C.text, fontSize: 13, fontFamily: fontMono, letterSpacing: 1,
                }}>{a.toUpperCase()}</button>
              );
            })}
          </div>
        </Field>

        {/* ===== HEALTH ===== */}
        <SectionTitle>HEALTH & RECOVERY</SectionTitle>
        <Field label="Injuries / sensitivities">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['lower back','knees','shoulders','wrists','elbows','neck'].map(i => {
              const on = (d.injuries || []).includes(i);
              return (
                <button key={i} onClick={() => toggle('injuries', i)} style={{
                  padding: '6px 12px', cursor: 'pointer',
                  background: on ? C.accent : 'transparent',
                  border: `1px solid ${on ? C.accent : C.line}`,
                  color: on ? '#000' : C.text, fontSize: 13, fontFamily: fontMono, letterSpacing: 1,
                }}>{i.toUpperCase()}</button>
              );
            })}
          </div>
        </Field>

        <Field label="Average sleep (hours)">
          <NumberSlider label="" value={d.sleep || 7} onChange={v => set({ sleep: v })}
            min={4} max={12} step={1} unit=" h" />
        </Field>

        <Field label="What drives you">
          <textarea value={d.motivation || ''}
            onChange={e => set({ motivation: e.target.value })}
            placeholder="Coach uses this to push you on hard days." rows={3}
            style={{ ...inputStyle, fontFamily: fontBody, resize: 'vertical' }} />
        </Field>

        {/* ===== DANGER ZONE ===== */}
        <div style={{ marginTop: 48, padding: 18, border: `1px dashed ${C.danger}` }}>
          <div style={{ fontFamily: fontMono, fontSize: 10, color: C.danger, letterSpacing: 2, marginBottom: 6 }}>/ DANGER ZONE</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 22, letterSpacing: 0.5, marginBottom: 6 }}>RESET EVERYTHING</div>
          <div style={{ fontFamily: fontBody, fontSize: 13, color: C.dim, marginBottom: 14 }}>
            Wipes your entire profile, food log, water, weights, wellness check-ins, and streak. You'll start fresh from onboarding. <strong style={{ color: C.text }}>This can't be undone.</strong>
          </div>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} style={{
              background: 'transparent', color: C.danger, border: `1px solid ${C.danger}`,
              padding: '10px 14px', cursor: 'pointer',
              fontFamily: fontMono, fontSize: 11, letterSpacing: 2, fontWeight: 700,
            }}>RESET PROFILE</button>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={onReset} style={{
                background: C.danger, color: '#000', border: 0,
                padding: '10px 14px', cursor: 'pointer',
                fontFamily: fontMono, fontSize: 11, letterSpacing: 2, fontWeight: 700,
              }}>YES, WIPE EVERYTHING</button>
              <button onClick={() => setConfirmReset(false)} style={{
                background: 'transparent', color: C.text, border: `1px solid ${C.line}`,
                padding: '10px 14px', cursor: 'pointer',
                fontFamily: fontMono, fontSize: 11, letterSpacing: 2,
              }}>CANCEL</button>
            </div>
          )}
        </div>
      </main>

      {/* Sticky save bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
        background: 'rgba(8,8,10,0.96)', backdropFilter: 'blur(10px)',
        borderTop: `1px solid ${C.line}`, padding: '12px 20px',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, background: 'transparent', color: C.text, border: `1px solid ${C.line}`,
            padding: '14px', cursor: 'pointer',
            fontFamily: fontMono, fontSize: 12, letterSpacing: 2,
          }}>CANCEL</button>
          <button onClick={save} style={{
            flex: 2, background: C.accent, color: '#000', border: 0,
            padding: '14px', cursor: 'pointer',
            fontFamily: fontMono, fontSize: 12, letterSpacing: 2, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Save size={14} /> SAVE CHANGES
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: fontMono, fontSize: 10, color: C.accent, letterSpacing: 3,
      marginTop: 36, marginBottom: 14, paddingBottom: 8,
      borderBottom: `1px solid ${C.line}`,
    }}>/ {children}</div>
  );
}

// ============================================================
// PWA INSTALL PROMPT
// ============================================================
// Shows a banner offering to install FORGE as an app.
// - Android/Chrome/Edge: triggers the native install prompt
// - iOS Safari: shows instructions (no API available)
// - Hides if already installed, or if user dismissed it
function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferred, setDeferred] = useState(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Already installed? → don't show
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;
    // Already dismissed? → don't show again for 14 days
    const dismissedAt = +(localStorage.getItem('forge2:installDismissedAt') || 0);
    if (dismissedAt && Date.now() - dismissedAt < 14 * 24 * 3600 * 1000) return;

    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isAndroidChrome = /Android/.test(ua);

    // iOS: no install API, so just show the prompt and let user open instructions
    if (isIOS) {
      setShow(true);
      return;
    }

    // Android / Chrome / Edge: wait for the install prompt event
    const onBefore = (e) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onBefore);
    return () => window.removeEventListener('beforeinstallprompt', onBefore);
  }, []);

  const dismiss = () => {
    localStorage.setItem('forge2:installDismissedAt', String(Date.now()));
    setShow(false);
  };

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') setShow(false);
      else dismiss();
      setDeferred(null);
    } else {
      // iOS path — show the instructional modal
      setShowIOSGuide(true);
    }
  };

  if (!show) return null;

  return (
    <>
      <div style={{
        position: 'fixed', bottom: 86, left: 16, right: 16, zIndex: 100,
        maxWidth: 520, margin: '0 auto',
        background: C.panel, border: `1px solid ${C.accent}`,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          width: 40, height: 40, background: C.accent, color: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: fontDisplay, fontSize: 26, flexShrink: 0,
        }}>F</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: fontMono, fontSize: 10, color: C.accent, letterSpacing: 2 }}>/ INSTALL APP</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 18, letterSpacing: 0.5, marginTop: 2 }}>
            ADD FORGE TO HOME SCREEN
          </div>
        </div>
        <button onClick={install} style={{
          background: C.accent, color: '#000', border: 0, cursor: 'pointer',
          padding: '10px 14px', fontFamily: fontMono, fontSize: 11, letterSpacing: 2, fontWeight: 700,
          flexShrink: 0,
        }}>INSTALL</button>
        <button onClick={dismiss} aria-label="Dismiss" style={{
          background: 'transparent', color: C.dim, border: 0, cursor: 'pointer',
          fontSize: 20, padding: '4px 8px', flexShrink: 0,
        }}>×</button>
      </div>

      {showIOSGuide && (
        <div onClick={() => setShowIOSGuide(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: C.bg, border: `1px solid ${C.accent}`, padding: 24, maxWidth: 420,
          }}>
            <div style={{ fontFamily: fontMono, fontSize: 10, color: C.accent, letterSpacing: 2, marginBottom: 8 }}>/ INSTALL FORGE ON iOS</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 26, letterSpacing: 0.5, marginBottom: 18, lineHeight: 1 }}>3 STEPS.</div>
            <ol style={{ paddingLeft: 20, lineHeight: 1.6, fontSize: 14 }}>
              <li>Tap the <strong>Share</strong> button at the bottom of Safari (a square with an arrow pointing up).</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
              <li>Tap <strong>"Add"</strong> in the top-right corner.</li>
            </ol>
            <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, marginTop: 18, letterSpacing: 1 }}>
              ↳ Must be in Safari. Won't work in Chrome on iOS.
            </div>
            <button onClick={() => { setShowIOSGuide(false); dismiss(); }} style={{
              marginTop: 20, background: C.accent, color: '#000', border: 0, cursor: 'pointer',
              padding: '12px 18px', fontFamily: fontMono, fontSize: 11, letterSpacing: 2, fontWeight: 700, width: '100%',
            }}>GOT IT</button>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// HEADER
// ============================================================

function Header({ profile, streak, onEdit, nutrition }) {
  const teen = nutrition.isTeenMode;
  return (
    <header style={{
      borderBottom: `1px solid ${C.line}`, background: 'rgba(8,8,10,0.92)',
      backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 30,
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: fontDisplay, fontSize: 32, letterSpacing: 2, lineHeight: 1 }}>FORGE</div>
          <div style={{ fontFamily: fontMono, fontSize: 10, color: C.accent, letterSpacing: 2 }}>
            / {profile.type.toUpperCase()} · {profile.goal.toUpperCase().replace('_',' ')}
          </div>
          {teen && (
            <div style={{ fontFamily: fontMono, fontSize: 9, color: C.accent2, letterSpacing: 2, border: `1px solid ${C.accent2}`, padding: '2px 6px' }}>
              TEEN MODE
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Streak">
            <Flame size={16} style={{ color: streak > 0 ? C.accent2 : C.dim }} />
            <span style={{ fontFamily: fontMono, fontSize: 13 }}>{streak}d</span>
          </div>
          <button onClick={onEdit} title="Edit profile" style={{
            border: `1px solid ${C.line}`, background: 'transparent', color: C.text,
            padding: '6px 8px', cursor: 'pointer',
          }}>
            <Pencil size={12} />
          </button>
        </div>
      </div>
    </header>
  );
}

// ============================================================
// BOTTOM NAV
// ============================================================

function BottomNav({ tab, setTab }) {
  const items = [
    { id: 'home',      label: 'Home',     Icon: Home },
    { id: 'workouts',  label: 'Train',    Icon: Dumbbell },
    { id: 'rank',      label: 'Rank',     Icon: Trophy },
    { id: 'nutrition', label: 'Fuel',     Icon: Apple },
    { id: 'coach',     label: 'Coach',    Icon: Sparkles },
  ];
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(8,8,10,0.96)', borderTop: `1px solid ${C.line}`,
      backdropFilter: 'blur(10px)', zIndex: 30,
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {items.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              background: 'transparent', border: 0, padding: '14px 4px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: active ? C.accent : C.dim, cursor: 'pointer',
              borderTop: active ? `2px solid ${C.accent}` : '2px solid transparent', marginTop: -1,
            }}>
              <Icon size={20} />
              <span style={{ fontFamily: fontMono, fontSize: 9, letterSpacing: 1.5 }}>{label.toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ============================================================
// ONBOARDING
// ============================================================

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: '', age: 18, sex: 'male', birthday: '',
    height: 175, weight: 75,
    type: null, goal: null, goals: [],
    targetWeight: null, timeline: null,
    focusAreas: [], strengthGoals: [],
    experience: 'beginner', equipment: 'full_gym',
    activity: 'moderate', daysPerWeek: 4, sessionLength: 60,
    trainingDays: DEFAULT_TRAINING_DAYS[4],
    diet: 'omnivore', allergens: [],
    injuries: [], sleep: 7, motivation: '',
    teenAcknowledged: false,
    createdAt: Date.now(),
  });
  const set = (patch) => setData(d => ({ ...d, ...patch }));
  const [bodyAutoSet, setBodyAutoSet] = useState(false);
  const setDaysPerWeek = (n) => {
    setData(d => ({ ...d, daysPerWeek: n, trainingDays: DEFAULT_TRAINING_DAYS[n] || d.trainingDays }));
  };

  useEffect(() => {
    if (document.getElementById('forge-fonts')) return;
    const link = document.createElement('link');
    link.id = 'forge-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap';
    document.head.appendChild(link);
  }, []);

  // Teen branch: insert safety screen at step 2 if teen
  const isTeenAge = data.age >= 13 && data.age < 18;
  const tooYoung = data.age < 13;
  const stepCount = isTeenAge ? 11 : 10;

  // Step order:
  // 0 welcome
  // 1 basics (name, age, sex)
  // 2 teen safety (only if teen)
  // 3 body (height, weight)
  // 4 type
  // 5 goal
  // 6 experience + equipment
  // 7 schedule (days, length, activity)
  // 8 diet + allergens
  // 9 injuries + sleep
  // 10 motivation + finish

  // We'll handle ordering with a mapping function based on isTeenAge
  const stepKeys = isTeenAge
    ? ['welcome','basics','teenSafety','body','type','goal','goalDetails','expEquip','schedule','diet','health','motivation']
    : ['welcome','basics','body','type','goal','goalDetails','expEquip','schedule','diet','health','motivation'];

  const currentKey = stepKeys[step];

  const canAdvance = () => {
    switch (currentKey) {
      case 'welcome': return true;
      case 'basics': return data.name.trim().length > 0 && !!data.birthday && data.age >= 13 && data.age <= 100;
      case 'teenSafety': return data.teenAcknowledged;
      case 'body': return data.height > 100 && data.height < 250 && data.weight > 25 && data.weight < 300;
      case 'type': return !!data.type;
      case 'goal': return !!data.goal;
      case 'goalDetails': return !!data.timeline;
      case 'expEquip': return !!data.experience && !!data.equipment;
      case 'schedule': return !!data.activity && !!data.daysPerWeek && !!data.sessionLength && data.trainingDays.length === data.daysPerWeek;
      case 'diet': return !!data.diet;
      case 'health': return data.sleep >= 3 && data.sleep <= 14;
      case 'motivation': return true;
      default: return true;
    }
  };

  const finish = () => onDone({ ...data });

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: fontBody, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.line}` }}>
        <div style={{ fontFamily: fontDisplay, fontSize: 28, letterSpacing: 2 }}>FORGE</div>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, letterSpacing: 2 }}>
          STEP {step + 1} / {stepKeys.length}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: C.line }}>
        <div style={{ height: '100%', background: C.accent, width: `${((step+1)/stepKeys.length)*100}%`, transition: 'width 300ms' }}/>
      </div>

      <div style={{ flex: 1, maxWidth: 720, width: '100%', margin: '0 auto', padding: '40px 24px 140px' }}>

        {currentKey === 'welcome' && (
          <div>
            <Crumb>WELCOME</Crumb>
            <h1 style={{ fontFamily: fontDisplay, fontSize: 'clamp(56px, 11vw, 120px)', lineHeight: 0.92, letterSpacing: 1, margin: 0 }}>
              BUILD <span style={{ color: C.accent }}>THE</span><br/>
              BODY <span style={{ color: C.accent }}>YOU</span><br/>
              WANT.
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: C.dim, maxWidth: 520, marginTop: 28 }}>
              FORGE is your training operating system. Built for teens and adults — we'll ask the right questions, build your plan, and stay with you.
            </p>
            <div style={{ marginTop: 40 }}>
              <Btn primary onClick={() => setStep(1)}>BEGIN <ArrowRight size={16}/></Btn>
            </div>
            <div style={{ marginTop: 60, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12 }}>
              {[
                { n: '01', t: 'Tell us about you', d: 'Body, training, lifestyle' },
                { n: '02', t: 'Pick your goal', d: 'Muscle, strength, lean, endurance' },
                { n: '03', t: 'Get your plan', d: 'Workouts, calories, macros' },
                { n: '04', t: 'Train & track', d: 'AI coach, food, water, sleep' },
              ].map(b => (
                <div key={b.n} style={{ border: `1px solid ${C.line}`, padding: 16 }}>
                  <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 2 }}>{b.n}</div>
                  <div style={{ fontFamily: fontDisplay, fontSize: 18, marginTop: 8, letterSpacing: 0.5 }}>{b.t.toUpperCase()}</div>
                  <div style={{ fontSize: 13, color: C.dim, marginTop: 4 }}>{b.d}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentKey === 'basics' && (
          <div>
            <Crumb>01 · BASICS</Crumb>
            <H1>WHO ARE YOU?</H1>
            <Sub>We need a few essentials to calculate your numbers.</Sub>
            <div style={{ display: 'grid', gap: 18, marginTop: 28 }}>
              <Field label="Name">
                <input value={data.name} onChange={e => set({ name: e.target.value })} placeholder="What should we call you?" style={inputStyle} />
              </Field>
              <Field label="Sex (used for BMR formula)">
                <SegmentedTabs value={data.sex} onChange={v => set({ sex: v })} options={[
                  { id: 'male', label: 'MALE' }, { id: 'female', label: 'FEMALE' },
                ]}/>
              </Field>
              <Field label="Birthday">
                <input type="date" value={data.birthday || ''}
                  min={minBirthday()} max={maxBirthday()}
                  onChange={e => {
                    const bd = e.target.value;
                    const a = computeAge(bd);
                    set({ birthday: bd, age: a || data.age });
                  }}
                  style={{ ...inputStyle, colorScheme: 'dark' }} />
                {data.birthday && data.age && (
                  <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 2, marginTop: 8 }}>
                    / YOU ARE {data.age} YEARS OLD
                  </div>
                )}
              </Field>
              {data.age >= 13 && data.age < 18 && (
                <Note color={C.accent2} icon={<Shield size={12}/>}>
                  Teen Mode will be enabled. We'll adjust nutrition and goals for safe, healthy development.
                </Note>
              )}
            </div>
          </div>
        )}

        {currentKey === 'teenSafety' && (
          <div>
            <Crumb>SAFETY FIRST</Crumb>
            <H1>A QUICK <span style={{ color: C.accent2 }}>NOTE</span><br/>FOR TEENS.</H1>
            <Sub>You're growing. We've tuned FORGE so it helps, not hurts.</Sub>
            <div style={{ marginTop: 28, display: 'grid', gap: 12 }}>
              {[
                { t: 'We won\'t let you eat too little.', d: 'Calorie targets have a hard floor. Aggressive cuts are disabled in Teen Mode.' },
                { t: 'Strength > the scale.', d: 'We highlight strength, skill, and consistency — not just weight loss.' },
                { t: 'Talk to the adults in your life.', d: 'Loop in a parent or guardian. If something hurts or feels off, see a doctor before training through it.' },
                { t: 'Form before weight.', d: 'Master the move, then add load. Ego lifting is how teens get injured. Don\'t do it.' },
                { t: 'Sleep and food matter most.', d: 'You\'ll grow more from 9 hours of sleep and full meals than from another workout.' },
              ].map((it, i) => (
                <div key={i} style={{ border: `1px solid ${C.line}`, padding: 16, display: 'grid', gridTemplateColumns: '32px 1fr', gap: 12 }}>
                  <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent }}>0{i+1}</div>
                  <div>
                    <div style={{ fontFamily: fontDisplay, fontSize: 18, letterSpacing: 0.5 }}>{it.t.toUpperCase()}</div>
                    <div style={{ color: C.dim, fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{it.d}</div>
                  </div>
                </div>
              ))}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 12, cursor: 'pointer', padding: 14, border: `1px solid ${data.teenAcknowledged ? C.accent : C.line}` }}>
                <input type="checkbox" checked={data.teenAcknowledged}
                  onChange={e => set({ teenAcknowledged: e.target.checked })} style={{ marginTop: 3 }} />
                <span style={{ fontSize: 14, lineHeight: 1.5 }}>
                  I understand. I'll talk to a parent/guardian, train with good form, and use this as a tool — not a rulebook.
                </span>
              </label>
            </div>
          </div>
        )}

        {currentKey === 'body' && (
          <div>
            <Crumb>02 · BODY</Crumb>
            <H1>YOUR FRAME.</H1>
            <Sub>Used to calculate calories. Estimate if you don't know exactly.</Sub>
            {bodyAutoSet && (
              <div style={{
                fontFamily: fontMono, fontSize: 10, color: C.accent, letterSpacing: 2,
                marginTop: 14, padding: '8px 12px', border: `1px solid ${C.line}`,
                background: C.panel, display: 'inline-block',
              }}>
                / PRE-FILLED FOR A {data.age}YO {data.sex === 'female' ? 'FEMALE' : 'MALE'} — ADJUST AS NEEDED
              </div>
            )}
            <div style={{ display: 'grid', gap: 24, marginTop: 28 }}>
              <NumberSlider label="Height" value={data.height} onChange={v => set({ height: v })}
                min={120} max={220} unit=" cm" />
              <NumberSlider label="Weight" value={data.weight} onChange={v => set({ weight: v })}
                min={30} max={200} unit=" kg" />
            </div>
            <div style={{ marginTop: 16, padding: 14, border: `1px solid ${C.line}`, background: C.panel }}>
              <div style={{ fontFamily: fontMono, fontSize: 10, color: C.accent, letterSpacing: 2 }}>/ PREVIEW</div>
              <div style={{ fontFamily: fontDisplay, fontSize: 32, marginTop: 8, letterSpacing: 0.5 }}>
                BMR · <span style={{ color: C.accent }}>{Math.round(calculateBMR(data.weight, data.height, data.age, data.sex))}</span> kcal
              </div>
              <div style={{ fontSize: 13, color: C.dim, marginTop: 4 }}>
                Calories your body burns at complete rest. We'll add activity next.
              </div>
            </div>
          </div>
        )}

        {currentKey === 'type' && (
          <div>
            <Crumb>03 · DISCIPLINE</Crumb>
            <H1>HOW DO YOU TRAIN?</H1>
            <Sub>Pick your style. You can change it later.</Sub>
            <div style={{ display: 'grid', gap: 12, marginTop: 28 }}>
              {WORKOUT_TYPES.map(t => (
                <SelectCard key={t.id} active={data.type === t.id} onClick={() => set({ type: t.id })}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontFamily: fontDisplay, fontSize: 32, letterSpacing: 1 }}>{t.name}</div>
                    <div style={{ fontFamily: fontMono, fontSize: 10, color: data.type === t.id ? C.accent : C.dim, letterSpacing: 2 }}>{t.sub.toUpperCase()}</div>
                  </div>
                  <div style={{ color: C.dim, fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>{t.blurb}</div>
                </SelectCard>
              ))}
            </div>
          </div>
        )}

        {currentKey === 'goal' && (
          <div>
            <Crumb>04 · OBJECTIVE</Crumb>
            <H1>WHAT'S THE MISSION?</H1>
            <Sub>Pick one or more. Your <span style={{ color: C.accent }}>first pick</span> is your <strong>primary</strong> — it drives your calorie target and rep scheme. Extra picks add flavor to your plan and coach.</Sub>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 12, marginTop: 28 }}>
              {goalsFor(data).map(g => {
                const idx = data.goals.indexOf(g.id);
                const isSelected = idx >= 0;
                const isPrimary = idx === 0;
                return (
                  <button key={g.id} onClick={() => {
                    const newGoals = isSelected
                      ? data.goals.filter(x => x !== g.id)
                      : [...data.goals, g.id];
                    set({ goals: newGoals, goal: newGoals[0] || null });
                  }} style={{
                    textAlign: 'left', cursor: 'pointer', width: '100%',
                    background: isSelected ? C.panel2 : 'transparent',
                    border: isPrimary
                      ? `2px solid ${C.accent}`
                      : `1px solid ${isSelected ? C.accent : C.line}`,
                    padding: 20, color: C.text, position: 'relative',
                  }}>
                    {isPrimary && (
                      <div style={{
                        position: 'absolute', top: 0, right: 0,
                        background: C.accent, color: '#000',
                        fontFamily: fontMono, fontSize: 9, letterSpacing: 2,
                        padding: '3px 8px',
                      }}>★ PRIMARY</div>
                    )}
                    <div style={{ fontFamily: fontMono, fontSize: 10, color: isSelected ? C.accent : C.dim, letterSpacing: 2 }}>{g.tag}</div>
                    <div style={{ fontFamily: fontDisplay, fontSize: 22, marginTop: 14, lineHeight: 1, letterSpacing: 0.5 }}>{g.name.toUpperCase()}</div>
                    <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, marginTop: 14 }}>
                      {g.surplus > 0 ? `+${g.surplus}` : g.surplus} kcal · {g.proteinPerKg}g/kg protein
                    </div>
                  </button>
                );
              })}
            </div>

            {data.goals.length > 0 && (
              <div style={{
                marginTop: 18, padding: '12px 14px',
                border: `1px solid ${C.accent}`, background: C.panel,
                fontFamily: fontMono, fontSize: 11, color: C.text, letterSpacing: 1.5,
              }}>
                <div style={{ color: C.accent, marginBottom: 4 }}>
                  / {data.goals.length} GOAL{data.goals.length > 1 ? 'S' : ''} SELECTED
                </div>
                {data.goals.map((gid, i) => {
                  const g = goalsFor(data).find(x => x.id === gid);
                  return (
                    <div key={gid} style={{ fontSize: 12, marginTop: 4 }}>
                      {i === 0 ? '★ PRIMARY · ' : `${String(i+1).padStart(2,'0')} · `}
                      {g?.name?.toUpperCase()}
                    </div>
                  );
                })}
              </div>
            )}

            {isTeenAge && (
              <Note color={C.accent2} icon={<Shield size={12}/>} style={{ marginTop: 18 }}>
                Aggressive fat loss and bulk are hidden in Teen Mode. "Lean Up" uses a small deficit so you can still grow and perform.
              </Note>
            )}
          </div>
        )}

        {currentKey === 'goalDetails' && (
          <div>
            <Crumb>05 · GET SPECIFIC</Crumb>
            <H1>GIVE US THE<br/>FULL PICTURE.</H1>
            <Sub>The more we know, the sharper your plan and your coach can be.</Sub>

            <div style={{ display: 'grid', gap: 28, marginTop: 28 }}>
              {!isTeenAge && (
                <div>
                  <NumberSlider
                    label="Dream weight"
                    value={data.targetWeight ?? data.weight}
                    onChange={v => set({ targetWeight: v })}
                    min={30} max={200} unit=" kg" />
                  <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 2, marginTop: 6 }}>
                    {(() => {
                      const target = data.targetWeight ?? data.weight;
                      const diff = +(target - data.weight).toFixed(1);
                      if (Math.abs(diff) < 0.5) return '/ MAINTAINING CURRENT WEIGHT';
                      if (diff < 0) return `/ LOSING ${Math.abs(diff)} KG`;
                      return `/ GAINING ${diff} KG`;
                    })()}
                  </div>
                </div>
              )}

              <Field label="Timeline">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { id: '3mo',    label: '3 MONTHS' },
                    { id: '6mo',    label: '6 MONTHS' },
                    { id: '12mo',   label: '1 YEAR' },
                    { id: 'norush', label: 'NO RUSH' },
                  ].map(t => {
                    const on = data.timeline === t.id;
                    return (
                      <button key={t.id} onClick={() => set({ timeline: t.id })} style={{
                        padding: '10px 16px', cursor: 'pointer',
                        background: on ? C.accent : 'transparent',
                        border: `1px solid ${on ? C.accent : C.line}`,
                        color: on ? '#000' : C.text,
                        fontFamily: fontMono, fontSize: 13, letterSpacing: 1,
                      }}>{t.label}</button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Focus areas — tap any (optional)">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['Chest','Back','Shoulders','Arms','Legs','Glutes','Core'].map(a => {
                    const on = data.focusAreas.includes(a);
                    return (
                      <button key={a} onClick={() => set({
                        focusAreas: on ? data.focusAreas.filter(x => x !== a) : [...data.focusAreas, a]
                      })} style={{
                        padding: '6px 12px', cursor: 'pointer',
                        background: on ? C.accent : 'transparent',
                        border: `1px solid ${on ? C.accent : C.line}`,
                        color: on ? '#000' : C.text, fontSize: 13, fontFamily: fontMono, letterSpacing: 1,
                      }}>{a.toUpperCase()}</button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Specific milestones — tap any (optional)">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    'First pull-up','10 pull-ups','Bench bodyweight','Squat 1.5x bw',
                    'Deadlift 2x bw','Handstand 30s','Muscle-up','Run 5K','Run 10K',
                    'Visible abs','Touch toes','Splits','Pistol squat',
                  ].map(g => {
                    const on = data.strengthGoals.includes(g);
                    return (
                      <button key={g} onClick={() => set({
                        strengthGoals: on ? data.strengthGoals.filter(x => x !== g) : [...data.strengthGoals, g]
                      })} style={{
                        padding: '6px 12px', cursor: 'pointer',
                        background: on ? C.accent : 'transparent',
                        border: `1px solid ${on ? C.accent : C.line}`,
                        color: on ? '#000' : C.text, fontSize: 13, fontFamily: fontMono, letterSpacing: 1,
                      }}>{g.toUpperCase()}</button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </div>
        )}

        {currentKey === 'expEquip' && (
          <div>
            <Crumb>05 · EXPERIENCE & GEAR</Crumb>
            <H1>WHAT'S YOUR LEVEL?</H1>
            <Sub>And what equipment do you actually have access to?</Sub>
            <div style={{ marginTop: 28, display: 'grid', gap: 22 }}>
              <Field label="Experience">
                <div style={{ display: 'grid', gap: 8 }}>
                  {EXPERIENCE_LEVELS.map(e => (
                    <SelectCard key={e.id} active={data.experience === e.id} onClick={() => set({ experience: e.id })} small>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontFamily: fontDisplay, fontSize: 18, letterSpacing: 0.5 }}>{e.name.toUpperCase()}</div>
                      </div>
                      <div style={{ color: C.dim, fontSize: 13, marginTop: 2 }}>{e.desc}</div>
                    </SelectCard>
                  ))}
                </div>
              </Field>
              <Field label="Equipment">
                <div style={{ display: 'grid', gap: 8 }}>
                  {EQUIPMENT_OPTIONS.map(e => (
                    <SelectCard key={e.id} active={data.equipment === e.id} onClick={() => set({ equipment: e.id })} small>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontFamily: fontDisplay, fontSize: 18, letterSpacing: 0.5 }}>{e.name.toUpperCase()}</div>
                      </div>
                      <div style={{ color: C.dim, fontSize: 13, marginTop: 2 }}>{e.desc}</div>
                    </SelectCard>
                  ))}
                </div>
              </Field>
            </div>
          </div>
        )}

        {currentKey === 'schedule' && (
          <div>
            <Crumb>06 · SCHEDULE</Crumb>
            <H1>HOW MUCH TIME?</H1>
            <Sub>Daily activity outside training, plus how often you can train.</Sub>
            <div style={{ marginTop: 28, display: 'grid', gap: 22 }}>
              <Field label="Activity Level">
                <div style={{ display: 'grid', gap: 8 }}>
                  {ACTIVITY_LEVELS.map(a => (
                    <SelectCard key={a.id} active={data.activity === a.id} onClick={() => set({ activity: a.id })} small>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontFamily: fontDisplay, fontSize: 18, letterSpacing: 0.5 }}>{a.name.toUpperCase()}</div>
                        <div style={{ fontFamily: fontMono, fontSize: 11, color: data.activity === a.id ? C.accent : C.dim }}>×{a.mult}</div>
                      </div>
                      <div style={{ color: C.dim, fontSize: 13, marginTop: 2 }}>{a.desc}</div>
                    </SelectCard>
                  ))}
                </div>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Days per week">
                  <ChipRow value={data.daysPerWeek} options={DAYS_PER_WEEK} onChange={setDaysPerWeek} suffix="" />
                </Field>
                <Field label="Minutes per session">
                  <ChipRow value={data.sessionLength} options={SESSION_LENGTHS} onChange={v => set({ sessionLength: v })} suffix="" />
                </Field>
              </div>
              <Field label={`Which days do you train? (pick ${data.daysPerWeek})`}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {WEEK_DAYS.map(d => {
                    const on = data.trainingDays.includes(d.id);
                    const canAdd = on || data.trainingDays.length < data.daysPerWeek;
                    return (
                      <button key={d.id} disabled={!canAdd}
                        onClick={() => set({
                          trainingDays: on
                            ? data.trainingDays.filter(x => x !== d.id)
                            : [...data.trainingDays, d.id]
                        })}
                        style={{
                          padding: '14px 4px',
                          background: on ? C.accent : 'transparent',
                          border: `1px solid ${on ? C.accent : C.line}`,
                          color: on ? '#000' : (canAdd ? C.text : C.dim),
                          cursor: canAdd ? 'pointer' : 'not-allowed',
                          opacity: canAdd ? 1 : 0.35,
                          fontFamily: fontMono, fontSize: 11, letterSpacing: 1,
                        }}>{d.short}</button>
                    );
                  })}
                </div>
                <div style={{ fontFamily: fontMono, fontSize: 10, color: data.trainingDays.length === data.daysPerWeek ? C.accent : C.dim, marginTop: 8, letterSpacing: 1 }}>
                  {data.trainingDays.length} / {data.daysPerWeek} SELECTED
                  {data.trainingDays.length === data.daysPerWeek && ' · LOCKED IN'}
                </div>
              </Field>
            </div>
          </div>
        )}

        {currentKey === 'diet' && (
          <div>
            <Crumb>07 · DIET</Crumb>
            <H1>WHAT DO YOU EAT?</H1>
            <Sub>Helps the coach suggest realistic meals.</Sub>
            <div style={{ marginTop: 28, display: 'grid', gap: 22 }}>
              <Field label="Diet">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 8 }}>
                  {DIETS.map(d => (
                    <button key={d.id} onClick={() => set({ diet: d.id })} style={{
                      cursor: 'pointer', padding: '12px 14px',
                      background: data.diet === d.id ? C.panel2 : 'transparent',
                      border: `1px solid ${data.diet === d.id ? C.accent : C.line}`,
                      color: C.text, fontSize: 14, textAlign: 'left',
                    }}>{d.name}</button>
                  ))}
                </div>
              </Field>
              <Field label="Allergies / avoid (tap any)">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ALLERGENS.map(a => {
                    const on = data.allergens.includes(a);
                    return (
                      <button key={a} onClick={() => set({
                        allergens: on ? data.allergens.filter(x => x !== a) : [...data.allergens, a]
                      })} style={{
                        cursor: 'pointer', padding: '6px 12px',
                        background: on ? C.accent : 'transparent',
                        border: `1px solid ${on ? C.accent : C.line}`,
                        color: on ? '#000' : C.text, fontSize: 13, fontFamily: fontMono, letterSpacing: 1,
                      }}>{a.toUpperCase()}</button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </div>
        )}

        {currentKey === 'health' && (
          <div>
            <Crumb>08 · HEALTH</Crumb>
            <H1>ANYTHING TO WATCH?</H1>
            <Sub>Old injuries or aches we should program around.</Sub>
            <div style={{ marginTop: 28, display: 'grid', gap: 22 }}>
              <Field label="Injuries / sensitivities (tap any)">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {COMMON_INJURIES.map(inj => {
                    const on = data.injuries.includes(inj);
                    return (
                      <button key={inj} onClick={() => set({
                        injuries: on ? data.injuries.filter(x => x !== inj) : [...data.injuries, inj]
                      })} style={{
                        cursor: 'pointer', padding: '6px 12px',
                        background: on ? C.accent2 : 'transparent',
                        border: `1px solid ${on ? C.accent2 : C.line}`,
                        color: on ? '#000' : C.text, fontSize: 13, fontFamily: fontMono, letterSpacing: 1,
                      }}>{inj.toUpperCase()}</button>
                    );
                  })}
                </div>
              </Field>
              <Field label={`Average sleep: ${data.sleep} hours`}>
                <input type="range" min="4" max="11" step="0.5" value={data.sleep}
                  onChange={e => set({ sleep: +e.target.value })}
                  style={{ width: '100%', accentColor: C.accent }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: fontMono, fontSize: 10, color: C.dim, marginTop: 6 }}>
                  <span>4h</span><span>7h</span><span>11h</span>
                </div>
                {data.sleep < 6 && (
                  <Note color={C.accent2} icon={<Moon size={12}/>}>
                    Under 6 hours seriously hurts recovery. Try to get to 7+ before chasing PRs.
                  </Note>
                )}
              </Field>
            </div>
          </div>
        )}

        {currentKey === 'motivation' && (
          <div>
            <Crumb>09 · YOUR WHY</Crumb>
            <H1>WHY ARE YOU<br/>HERE?</H1>
            <Sub>Optional. But on hard days, this is what the coach will remind you of.</Sub>
            <div style={{ marginTop: 28 }}>
              <textarea value={data.motivation} onChange={e => set({ motivation: e.target.value })}
                placeholder="Get strong for a sport. Feel confident. Lift my kid without grunting. Run a 10k. Whatever it is — put it here."
                rows={5}
                style={{
                  width: '100%', background: C.bg, color: C.text,
                  border: `1px solid ${C.line}`, padding: 14, fontSize: 14,
                  fontFamily: fontBody, outline: 'none', resize: 'vertical',
                }}/>
            </div>
            <div style={{ marginTop: 28, border: `1px solid ${C.accent}`, padding: 18, background: C.panel }}>
              <div style={{ fontFamily: fontMono, fontSize: 10, color: C.accent, letterSpacing: 2 }}>/ READY TO FORGE</div>
              <div style={{ fontFamily: fontDisplay, fontSize: 28, marginTop: 8, letterSpacing: 0.5 }}>
                YOUR PLAN IS BUILT.
              </div>
              <PlanPreview data={data} />
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: C.bg, borderTop: `1px solid ${C.line}`, padding: '16px 24px',
      }}>
        <div style={{ maxWidth: 720, width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
          {step > 0
            ? <Btn onClick={() => setStep(s => s - 1)}><ArrowLeft size={16}/> BACK</Btn>
            : <div />}
          {step < stepKeys.length - 1
            ? <Btn primary disabled={!canAdvance() || tooYoung} onClick={() => {
                if (!canAdvance()) return;
                const nextKey = stepKeys[step + 1];
                if (nextKey === 'body' && !bodyAutoSet) {
                  const avg = avgBody(data.age, data.sex);
                  set({ height: avg.height, weight: avg.weight });
                  setBodyAutoSet(true);
                }
                setStep(s => s + 1);
              }}>
                CONTINUE <ArrowRight size={16}/>
              </Btn>
            : <Btn primary onClick={finish}>FORGE MY PLAN <ArrowRight size={16}/></Btn>}
        </div>
      </div>
    </div>
  );
}

function PlanPreview({ data }) {
  const nutrition = useMemo(() => {
    try { return calculateNutrition(data); } catch(_) { return null; }
  }, [data]);
  if (!nutrition) return null;
  const plan = WORKOUT_PLANS[data.type];
  const goal = goalsFor(data).find(g => g.id === data.goal);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12, marginTop: 16 }}>
      <PreviewStat label="Plan" value={plan?.name || '—'} />
      <PreviewStat label="Goal" value={goal?.name || '—'} />
      <PreviewStat label="Calories" value={`${nutrition.target} kcal`} accent />
      <PreviewStat label="Protein" value={`${nutrition.protein} g`} />
      <PreviewStat label="Water" value={`${nutrition.waterLiters} L`} />
      <PreviewStat label="Days/wk" value={`${data.daysPerWeek}`} />
    </div>
  );
}
function PreviewStat({ label, value, accent }) {
  return (
    <div style={{ borderLeft: `2px solid ${accent ? C.accent : C.line}`, paddingLeft: 12 }}>
      <div style={{ fontFamily: fontMono, fontSize: 9, color: C.dim, letterSpacing: 2 }}>{label.toUpperCase()}</div>
      <div style={{ fontFamily: fontDisplay, fontSize: 16, marginTop: 4, letterSpacing: 0.5, color: accent ? C.accent : C.text }}>{value}</div>
    </div>
  );
}

// ============================================================
// DASHBOARD
// ============================================================

function Dashboard({ profile, nutrition, consumed, completedDays, streak, weights, water, wellness, liftLog, setTab }) {
  const dashBestLifts = useMemo(() => {
    const best = {};
    for (const l of (liftLog || [])) {
      if (!best[l.exercise] || l.e1rm > best[l.exercise]) best[l.exercise] = l.e1rm;
    }
    return best;
  }, [liftLog]);
  const dashRank = overallRank(dashBestLifts, profile.weight, profile.sex);
  const dashTier = RANK_TIERS[dashRank.tier];
  const goalsList = goalsFor(profile);
  const goal = goalsList.find(g => g.id === profile.goal) || goalsList[0];
  const plan = WORKOUT_PLANS[profile.type];
  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'still up' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const todayInfo = getTodaysPlanDay(profile, plan);
  const dayIdx = todayInfo.planDay;
  const today = plan.days[dayIdx];
  const block = getBlockInfo(profile, plan);
  const todayExercises = getExercisesForDay(today, block.blockIndex);
  const todayDone = completedDays[todayStr()] !== undefined;
  const isRestDay = todayInfo.isRest;

  // Achievements
  const achievements = useMemo(() => buildAchievements({ completedDays, weights, water, foodLogStreak: 0, streak }), [completedDays, weights, water, streak]);

  // Last weight + trend
  const sortedW = [...weights].sort((a,b) => a.date.localeCompare(b.date));
  const latestW = sortedW[sortedW.length - 1];
  const weekAgo = sortedW.find(w => w.date <= daysAgo(7));
  const weightChange = latestW && weekAgo ? +(latestW.kg - weekAgo.kg).toFixed(1) : null;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 3 }}>
          / {greeting.toUpperCase()}, {(profile.name || 'ATHLETE').toUpperCase()}
        </div>
        <h1 style={{ fontFamily: fontDisplay, fontSize: 'clamp(40px, 7vw, 72px)', lineHeight: 0.95, margin: '12px 0 0', letterSpacing: 1 }}>
          {isRestDay
            ? <>REST <span style={{ color: C.accent }}>DAY.</span></>
            : todayDone
              ? <>SESSION <span style={{ color: C.accent }}>LOCKED IN.</span></>
              : <>LET'S GET<br/><span style={{ color: C.accent }}>TO WORK.</span></>}
        </h1>
        {isRestDay && (
          <p style={{ color: C.dim, fontSize: 14, marginTop: 12, maxWidth: 520 }}>
            Not scheduled to train today. Recover, eat well, hydrate. Want to lift anyway? Open Train and pick any day.
          </p>
        )}
      </section>

      {/* Stat strip */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1, border: `1px solid ${C.line}`, background: C.line }}>
        <StatTile label="Streak" value={`${streak}`} unit="days" accent={streak > 0} />
        <StatTile label="Calories" value={`${Math.round(consumed.kcal)}`} unit={`/ ${nutrition.target}`} />
        <StatTile label="Protein" value={`${Math.round(consumed.p)}g`} unit={`/ ${nutrition.protein}g`} />
        <StatTile label="Rank" value={dashTier.name} unit={dashRank.count > 0 ? `${dashRank.count} lifts` : 'unranked'} accent={dashRank.count > 0} />
      </section>

      {/* Today's session or rest-day overview */}
      {!isRestDay ? (
      <section style={{ border: `1px solid ${C.line}`, padding: 24, background: C.panel, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: -20, right: -10, fontFamily: fontDisplay,
          fontSize: 180, lineHeight: 1, color: C.panel2, letterSpacing: -4, pointerEvents: 'none',
        }}>{String(dayIdx + 1).padStart(2, '0')}</div>
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 2 }}>
            / TODAY'S SESSION · WEEK {block.week + 1} · BLOCK {block.blockIndex + 1}{block.isDeload ? ' · DELOAD' : ''}
          </div>
          <h2 style={{ fontFamily: fontDisplay, fontSize: 'clamp(36px, 6vw, 56px)', lineHeight: 1, margin: '12px 0 6px', letterSpacing: 1 }}>
            {today.name.toUpperCase()}
          </h2>
          <div style={{ color: C.dim, fontSize: 14, marginBottom: 18 }}>{today.focus}</div>
          <div style={{ display: 'grid', gap: 4, marginBottom: 20 }}>
            {todayExercises.slice(0, 4).map((ex, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, fontSize: 14 }}>
                <span style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, minWidth: 24 }}>0{i+1}</span>
                <span>{ex}</span>
              </div>
            ))}
            {todayExercises.length > 4 && (
              <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, marginTop: 4 }}>+ {todayExercises.length - 4} more</div>
            )}
          </div>
          <Btn primary onClick={() => setTab('workouts')}>
            {todayDone ? 'VIEW SESSION' : 'START TRAINING'} <ArrowRight size={16}/>
          </Btn>
        </div>
      </section>
      ) : (
      <WeeklySchedule profile={profile} plan={plan} block={block} setTab={setTab} />
      )}

      {/* Two cards row */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card>
          <CardLabel>FUEL</CardLabel>
          <div style={{ fontFamily: fontDisplay, fontSize: 48, lineHeight: 1, letterSpacing: 1, marginTop: 8 }}>
            {Math.round(consumed.kcal)}<span style={{ color: C.dim, fontSize: 24 }}> / {nutrition.target}</span>
          </div>
          <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, marginTop: 4, letterSpacing: 1 }}>KCAL TODAY</div>
          <MacroBar consumed={consumed} target={nutrition} />
          <Btn onClick={() => setTab('nutrition')} style={{ marginTop: 16 }}>LOG FOOD <Plus size={14}/></Btn>
        </Card>

        <Card>
          <CardLabel>COACH</CardLabel>
          <div style={{ fontFamily: fontDisplay, fontSize: 28, lineHeight: 1.1, letterSpacing: 0.5, marginTop: 10 }}>
            ASK ME<br/>ANYTHING.
          </div>
          <p style={{ color: C.dim, fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
            Form check, swap an exercise, plan a deload, dial in your macros. Your AI coach knows your full profile.
          </p>
          <Btn onClick={() => setTab('coach')} style={{ marginTop: 16 }}>
            <Sparkles size={14}/> OPEN COACH
          </Btn>
        </Card>
      </section>

      {/* Mini stats row */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <MiniStatCard
          icon={<Trophy size={14}/>} label="Strength rank"
          value={dashTier.name}
          sub={dashRank.count > 0 ? `${RANK_REWARDS[dashRank.tier].title}` : 'Log a lift to rank up'} />
        <MiniStatCard
          icon={<Dumbbell size={14}/>} label="Lifts logged"
          value={`${(liftLog || []).length}`}
          sub={(liftLog || []).length > 0 ? 'Keep stacking PRs' : 'Open Rank to start'} />
        <MiniStatCard
          icon={<Flame size={14}/>} label="Streak"
          value={`${streak}`}
          sub={streak > 0 ? 'days in a row' : 'Train today to start'} />
        <MiniStatCard
          icon={<Apple size={14}/>} label="Calories today"
          value={`${Math.round(consumed.kcal)}`}
          sub={`of ${nutrition.target} target`} />
      </section>

      {/* Achievements */}
      <section>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, letterSpacing: 2, marginBottom: 12 }}>
          / ACHIEVEMENTS · {achievements.filter(a => a.unlocked).length} / {achievements.length}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {achievements.map(a => (
            <div key={a.id} style={{
              border: `1px solid ${a.unlocked ? C.accent : C.line}`,
              padding: 14, background: a.unlocked ? C.panel : 'transparent',
              opacity: a.unlocked ? 1 : 0.55,
            }}>
              <Trophy size={14} style={{ color: a.unlocked ? C.accent : C.dim }} />
              <div style={{ fontFamily: fontDisplay, fontSize: 16, marginTop: 8, letterSpacing: 0.5 }}>{a.name.toUpperCase()}</div>
              <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function WeeklySchedule({ profile, plan, block, setTab }) {
  const trainingDays = profile.trainingDays || DEFAULT_TRAINING_DAYS[profile.daysPerWeek] || [];
  const ordered = WEEK_DAYS.filter(d => trainingDays.includes(d.id)).map(d => d.id);
  const todayId = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
  return (
    <section style={{ border: `1px solid ${C.line}`, padding: 24, background: C.panel }}>
      <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 2 }}>
        / YOUR WEEK · WEEK {block.week + 1}{block.isDeload ? ' · DELOAD' : ''}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 16 }}>
        {WEEK_DAYS.map(d => {
          const isTraining = trainingDays.includes(d.id);
          const isToday = d.id === todayId;
          const planIdx = isTraining ? ordered.indexOf(d.id) % plan.days.length : null;
          const planDay = planIdx !== null ? plan.days[planIdx] : null;
          return (
            <div key={d.id} style={{
              border: `1px solid ${isToday ? C.accent : C.line}`,
              background: isToday ? C.panel2 : 'transparent',
              padding: '10px 6px', textAlign: 'center', minHeight: 92,
              opacity: isTraining ? 1 : 0.45,
            }}>
              <div style={{ fontFamily: fontMono, fontSize: 9, color: isToday ? C.accent : C.dim, letterSpacing: 1.5 }}>
                {d.short}{isToday && ' ·'}
              </div>
              {isTraining
                ? <>
                    <div style={{ fontFamily: fontDisplay, fontSize: 13, marginTop: 8, lineHeight: 1.1, letterSpacing: 0.3 }}>
                      {planDay.name.toUpperCase()}
                    </div>
                    <div style={{ fontFamily: fontMono, fontSize: 9, color: C.dim, marginTop: 4 }}>D{planIdx + 1}</div>
                  </>
                : <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, marginTop: 18, letterSpacing: 1 }}>REST</div>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 16 }}>
        <Btn onClick={() => setTab('workouts')}>OPEN TRAIN <ArrowRight size={14}/></Btn>
      </div>
    </section>
  );
}

function buildAchievements({ completedDays, weights, water, streak }) {
  const completed = Object.keys(completedDays).length;
  return [
    { id: 'first',   name: 'First Rep',      desc: 'Complete your first session',     unlocked: completed >= 1 },
    { id: 'week',    name: 'Week Warrior',   desc: 'Hit a 7-day streak',              unlocked: streak >= 7 },
    { id: 'ten',     name: 'Iron Ten',       desc: 'Lock in 10 sessions',             unlocked: completed >= 10 },
    { id: 'thirty',  name: 'Built',          desc: 'Lock in 30 sessions',             unlocked: completed >= 30 },
    { id: 'water',   name: 'Hydrated',       desc: 'Hit your water goal once',        unlocked: (water?.cups || 0) >= 8 },
    { id: 'tracker', name: 'Self-Aware',     desc: 'Log your weight 3 times',         unlocked: weights.length >= 3 },
  ];
}

// ============================================================
// WORKOUTS
// ============================================================

function Workouts({ profile, completedDays, setCompletedDays, liftLog, setLiftLog }) {
  const plan = WORKOUT_PLANS[profile.type];
  const baseScheme = GOAL_SCHEMES[profile.goal] || GOAL_SCHEMES.muscle;
  const block = getBlockInfo(profile, plan);
  const scheme = adjustScheme(baseScheme, block.isDeload);

  const [activeDay, setActiveDay] = useState(() => getTodaysPlanDay(profile, plan).planDay);
  const [doneEx, setDoneEx] = useState({});
  const [swapEx, setSwapEx] = useState(null);
  const [timer, setTimer] = useState({ active: false, remaining: 0, total: scheme.rest });
  const [logInputs, setLogInputs] = useState({}); // { exerciseIndex: { weight, reps } }
  const [loggedSets, setLoggedSets] = useState({}); // { exerciseIndex: true } once logged this session

  const logTopSet = (i, liftId, exName) => {
    const inp = logInputs[i] || {};
    const w = +inp.weight, r = +inp.reps;
    if (!w || !r) return;
    const e1rm = estimate1RM(w, r);
    setLiftLog(prev => [...(prev || []), {
      id: Math.random().toString(36).slice(2),
      exercise: liftId, weight: w, reps: r, e1rm,
      at: Date.now(), source: 'workout',
    }]);
    setLoggedSets(s => ({ ...s, [i]: true }));
  };

  // Reset done when changing day or block
  useEffect(() => { setDoneEx({}); setLogInputs({}); setLoggedSets({}); }, [activeDay, block.blockIndex]);

  useEffect(() => {
    if (!timer.active || timer.remaining <= 0) return;
    const id = setInterval(() => setTimer(t => ({ ...t, remaining: t.remaining - 1 })), 1000);
    return () => clearInterval(id);
  }, [timer.active, timer.remaining]);

  useEffect(() => {
    if (timer.active && timer.remaining === 0) setTimer(t => ({ ...t, active: false }));
  }, [timer.active, timer.remaining]);

  const day = plan.days[activeDay];
  const exercises = getExercisesForDay(day, block.blockIndex);
  const coreCount = (day.core || []).length;

  const toggleEx = (i) => {
    const wasDone = doneEx[i];
    setDoneEx(d => ({ ...d, [i]: !d[i] }));
    if (!wasDone) setTimer({ active: true, remaining: scheme.rest, total: scheme.rest });
  };

  const finishSession = () => {
    setCompletedDays(c => ({ ...c, [todayStr()]: activeDay }));
    setDoneEx({});
    setTimer({ active: false, remaining: 0, total: scheme.rest });
  };

  const allDone = exercises.every((_, i) => doneEx[i]);
  const isCompletedToday = completedDays[todayStr()] !== undefined;
  const completedToday = isCompletedToday && completedDays[todayStr()] === activeDay;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 3 }}>
          / TRAINING · {plan.split.toUpperCase()}
        </div>
        <h1 style={{ fontFamily: fontDisplay, fontSize: 'clamp(40px, 7vw, 72px)', lineHeight: 0.95, margin: '12px 0 0', letterSpacing: 1 }}>
          {plan.name.toUpperCase()}
        </h1>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <Pill accent>WEEK {block.week + 1} · BLOCK {block.blockIndex + 1}</Pill>
          {block.isDeload && <Pill accent={false} style={{ color: C.accent2, borderColor: C.accent2 }}>DELOAD</Pill>}
          <Pill>SETS · {scheme.sets}</Pill>
          <Pill>REPS · {scheme.reps}</Pill>
          <Pill>REST · {scheme.rest}s</Pill>
        </div>
      </section>

      {block.isDeload && (
        <Note color={C.accent2} icon={<AlertCircle size={12}/>}>
          <strong>Deload week.</strong> One fewer set, lighter weights (~70% of normal), focus on form and recovery. Next week new accessories rotate in.
        </Note>
      )}
      {!block.isDeload && block.weekInBlock === 0 && block.blockIndex > 0 && (
        <Note color={C.accent} icon={<RefreshCw size={12}/>}>
          <strong>New block.</strong> Accessories just rotated. Core lifts stay — keep pushing the weight on those.
        </Note>
      )}

      {/* Day selector */}
      <section style={{ display: 'grid', gridTemplateColumns: `repeat(${plan.days.length}, 1fr)`, gap: 1, border: `1px solid ${C.line}`, background: C.line }}>
        {plan.days.map((d, i) => (
          <button key={i} onClick={() => setActiveDay(i)} style={{
            background: activeDay === i ? C.panel2 : C.bg, border: 0,
            padding: '14px 8px', cursor: 'pointer',
            color: activeDay === i ? C.text : C.dim, textAlign: 'center',
          }}>
            <div style={{ fontFamily: fontMono, fontSize: 9, color: activeDay === i ? C.accent : C.dim, letterSpacing: 2 }}>
              DAY {i+1}
            </div>
            <div style={{ fontFamily: fontDisplay, fontSize: 16, marginTop: 4, letterSpacing: 0.5 }}>
              {d.name.toUpperCase()}
            </div>
          </button>
        ))}
      </section>

      {/* Active day */}
      <section style={{ border: `1px solid ${C.line}`, background: C.panel, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, letterSpacing: 2 }}>{day.focus.toUpperCase()}</div>
            <h2 style={{ fontFamily: fontDisplay, fontSize: 36, margin: '6px 0 0', letterSpacing: 0.5 }}>{day.name.toUpperCase()}</h2>
          </div>
          {completedToday && <Pill accent><CheckCircle2 size={12}/> COMPLETED TODAY</Pill>}
        </div>

        <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, marginTop: 16, marginBottom: 8, letterSpacing: 1 }}>
          Don't know an exercise or it's too hard? Tap <span style={{ color: C.accent }}>SWAP</span> for alternatives.
        </div>

        <div style={{ display: 'grid', gap: 1, background: C.line, border: `1px solid ${C.line}` }}>
          {exercises.map((ex, i) => {
            const checked = !!doneEx[i];
            const isAccessory = i >= coreCount;
            const rankLift = !isAccessory ? matchRankLift(ex) : null;
            const inp = logInputs[i] || {};
            const wasLogged = loggedSets[i];
            return (
              <div key={`${block.blockIndex}-${i}-${ex}`} style={{
                background: checked ? C.panel2 : C.bg,
              }}>
                <div style={{
                  padding: '14px 14px',
                  display: 'grid', gridTemplateColumns: '28px 1fr auto auto auto', gap: 12,
                  alignItems: 'center', opacity: checked ? 0.55 : 1,
                }}>
                  <button onClick={() => toggleEx(i)} style={{ background: 'transparent', border: 0, cursor: 'pointer', color: C.text, padding: 0, display: 'flex' }}>
                    {checked
                      ? <CheckCircle2 size={20} style={{ color: C.accent }} />
                      : <Circle size={20} style={{ color: C.dim }} />}
                  </button>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, textDecoration: checked ? 'line-through' : 'none' }}>
                      {ex}
                    </div>
                    <div style={{ fontFamily: fontMono, fontSize: 9, color: isAccessory ? C.dim : C.accent, letterSpacing: 1.5, marginTop: 2 }}>
                      {isAccessory ? 'ACCESSORY' : 'CORE LIFT'}{rankLift ? ' · RANKED' : ''}
                    </div>
                  </div>
                  <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 1, whiteSpace: 'nowrap' }}>
                    {scheme.sets} × {scheme.reps}
                  </div>
                  <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, whiteSpace: 'nowrap' }}>
                    {scheme.rest}s
                  </div>
                  <button onClick={() => setSwapEx(ex)} title="See alternatives" style={{
                    background: 'transparent', border: `1px solid ${C.line}`, color: C.dim,
                    padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                    fontFamily: fontMono, fontSize: 10, letterSpacing: 1,
                  }}>
                    <RefreshCw size={12}/> SWAP
                  </button>
                </div>

                {/* Inline rank logger for ranked core lifts */}
                {rankLift && (
                  <div style={{ padding: '0 14px 14px 54px' }}>
                    {wasLogged ? (
                      <div style={{ fontFamily: fontMono, fontSize: 10, color: C.accent, letterSpacing: 1 }}>
                        ✓ TOP SET LOGGED TO YOUR RANK
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: fontMono, fontSize: 9, color: C.dim, letterSpacing: 1.5 }}>LOG TOP SET →</span>
                        <input type="number" inputMode="decimal" placeholder={rankLift === 'pullup' ? '+kg' : 'kg'}
                          value={inp.weight || ''} onChange={e => setLogInputs(s => ({ ...s, [i]: { ...inp, weight: e.target.value } }))}
                          style={{ width: 60, background: 'transparent', border: `1px solid ${C.line}`, color: C.text, padding: '6px 8px', fontFamily: fontMono, fontSize: 12, outline: 'none' }} />
                        <span style={{ color: C.dim, fontFamily: fontMono, fontSize: 12 }}>×</span>
                        <input type="number" inputMode="numeric" placeholder="reps"
                          value={inp.reps || ''} onChange={e => setLogInputs(s => ({ ...s, [i]: { ...inp, reps: e.target.value } }))}
                          style={{ width: 56, background: 'transparent', border: `1px solid ${C.line}`, color: C.text, padding: '6px 8px', fontFamily: fontMono, fontSize: 12, outline: 'none' }} />
                        <button onClick={() => logTopSet(i, rankLift, ex)} disabled={!inp.weight || !inp.reps} style={{
                          background: (!inp.weight || !inp.reps) ? C.line : C.accent,
                          color: (!inp.weight || !inp.reps) ? C.dim : '#000', border: 0,
                          padding: '6px 12px', cursor: (!inp.weight || !inp.reps) ? 'not-allowed' : 'pointer',
                          fontFamily: fontMono, fontSize: 10, letterSpacing: 1.5, fontWeight: 700,
                        }}>LOG</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!completedToday && !isCompletedToday && (
          <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Btn primary disabled={!allDone} onClick={finishSession}>
              {allDone ? 'LOCK IN SESSION' : 'CHECK OFF ALL TO FINISH'} <Check size={16}/>
            </Btn>
          </div>
        )}
        {isCompletedToday && !completedToday && (
          <div style={{ marginTop: 20, fontFamily: fontMono, fontSize: 12, color: C.dim }}>
            You already locked in a different day today. Come back tomorrow.
          </div>
        )}

        <div style={{ marginTop: 24, padding: 14, border: `1px dashed ${C.line}`, fontFamily: fontMono, fontSize: 11, color: C.dim, lineHeight: 1.6 }}>
          <span style={{ color: C.accent }}>// PROGRAM CYCLE:</span> Core lifts stay every week — that's where you progress (add weight/reps). Accessories rotate every {plan.blockLength} weeks so you keep adapting. Week {plan.blockLength} of each block is a deload.
        </div>
      </section>

      {/* Rest Timer */}
      {timer.active && (
        <div style={{
          position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 40,
          background: C.panel, border: `1px solid ${C.accent}`,
          padding: 16, display: 'flex', alignItems: 'center', gap: 16,
          maxWidth: 560, margin: '0 auto',
        }}>
          <Clock size={20} style={{ color: C.accent }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: fontMono, fontSize: 10, color: C.accent, letterSpacing: 2 }}>REST</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 36, lineHeight: 1, letterSpacing: 1 }}>
              {String(Math.floor(timer.remaining/60)).padStart(2,'0')}:{String(timer.remaining%60).padStart(2,'0')}
            </div>
            <div style={{ height: 3, background: C.line, marginTop: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((timer.total - timer.remaining)/timer.total)*100}%`, background: C.accent, transition: 'width 200ms linear' }}/>
            </div>
          </div>
          <button onClick={() => setTimer(t => ({ ...t, active: false }))} style={{
            background: 'transparent', border: `1px solid ${C.line}`, color: C.text,
            padding: '8px 12px', cursor: 'pointer', fontFamily: fontMono, fontSize: 11, letterSpacing: 1,
          }}>
            SKIP
          </button>
        </div>
      )}

      {/* Swap Modal */}
      {swapEx && (() => {
        const alts = EXERCISE_SWAPS[swapEx] || GENERIC_SWAPS;
        const order = { easier: 0, similar: 1, harder: 2 };
        const sorted = [...alts].sort((a, b) => order[a.diff] - order[b.diff]);
        const diffColor = (d) => d === 'easier' ? C.accent : d === 'harder' ? C.accent2 : C.dim;
        const diffLabel = (d) => d === 'easier' ? 'EASIER' : d === 'harder' ? 'HARDER' : 'SIMILAR';
        return (
          <Modal onClose={() => setSwapEx(null)}>
            <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 2 }}>/ SWAP EXERCISE</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 24, marginTop: 8, letterSpacing: 0.5 }}>{swapEx.toUpperCase()}</div>
            <p style={{ color: C.dim, fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
              Don't know it or it's too hard? Pick something below. <span style={{ color: C.accent }}>EASIER</span> options hit similar muscles with less skill or strength needed.
            </p>
            <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
              {sorted.map((alt, i) => (
                <div key={i} style={{
                  padding: '12px 14px', border: `1px solid ${C.line}`, background: C.bg,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{alt.name}</span>
                  <span style={{
                    fontFamily: fontMono, fontSize: 9, letterSpacing: 2,
                    padding: '3px 8px',
                    color: diffColor(alt.diff),
                    border: `1px solid ${diffColor(alt.diff)}`,
                    whiteSpace: 'nowrap',
                  }}>{diffLabel(alt.diff)}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: 12, color: C.dim, lineHeight: 1.5 }}>
              Swaps are suggestions — your plan stays the same. If nothing here fits your gear, ask the Coach.
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}

// ============================================================
// NUTRITION / FUEL
// ============================================================

function Nutrition({ profile, nutrition, consumed, foodLog, setFoodLog }) {
  const goal = goalsFor(profile).find(g => g.id === profile.goal);
  const mealSplits = useMemo(() => buildMealPlan(nutrition, profile.goal, profile.diet), [nutrition, profile.goal, profile.diet]);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 3 }}>
          / NUTRITION · {goal.tag}
        </div>
        <h1 style={{ fontFamily: fontDisplay, fontSize: 'clamp(40px, 7vw, 72px)', lineHeight: 0.95, margin: '12px 0 0', letterSpacing: 1 }}>
          YOUR <span style={{ color: C.accent }}>FUEL</span><br/>PLAN.
        </h1>
        <p style={{ color: C.dim, fontSize: 15, maxWidth: 540, marginTop: 14 }}>
          Calculated from your stats using Mifflin–St Jeor, then adjusted for your goal{nutrition.isTeenMode ? ', with Teen Mode floors and growth bonus' : ''}.
          Adjust if scale moves too fast or too slow.
        </p>
      </section>

      <section style={{ border: `1px solid ${C.line}`, background: C.panel, padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 20 }}>
          <BigStat label="BMR" value={nutrition.bmr} unit="kcal" hint="At rest" />
          <BigStat label="TDEE" value={nutrition.tdee} unit="kcal" hint="With activity" />
          <BigStat label="TARGET" value={nutrition.target} unit="kcal" hint={(goal.surplus >= 0 ? '+' : '') + goal.surplus + ' kcal'} accent />
        </div>
      </section>

      <section>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, letterSpacing: 2, marginBottom: 12 }}>/ DAILY MACROS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12 }}>
          <MacroCard name="Protein" grams={nutrition.protein} kcalPer={4} target={nutrition.target} color={C.accent} />
          <MacroCard name="Carbs"   grams={nutrition.carbs}   kcalPer={4} target={nutrition.target} color={C.blue} />
          <MacroCard name="Fat"     grams={nutrition.fat}     kcalPer={9} target={nutrition.target} color={C.accent2} />
        </div>
      </section>

      <section style={{ border: `1px solid ${C.line}`, background: C.panel, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Droplet size={16} style={{ color: C.blue }}/>
          <div style={{ fontFamily: fontDisplay, fontSize: 24, letterSpacing: 0.5 }}>
            {nutrition.waterLiters}L · {nutrition.waterCups} CUPS
          </div>
        </div>
        <p style={{ color: C.dim, fontSize: 13, marginTop: 6 }}>
          Hydration target based on body weight. Track cups in the Track tab.
        </p>
      </section>

      <section>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, letterSpacing: 2, marginBottom: 12 }}>/ SAMPLE MEAL SPLIT · {profile.diet.toUpperCase()}</div>
        <div style={{ display: 'grid', gap: 12 }}>
          {mealSplits.map((m, i) => (
            <div key={i} style={{ border: `1px solid ${C.line}`, padding: 18, background: C.panel }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontFamily: fontMono, fontSize: 10, color: C.accent, letterSpacing: 2 }}>{String(i+1).padStart(2,'0')} · {m.name.toUpperCase()}</div>
                  <div style={{ fontFamily: fontDisplay, fontSize: 22, marginTop: 4, letterSpacing: 0.5 }}>{m.idea}</div>
                </div>
                <div style={{ fontFamily: fontMono, fontSize: 13 }}>{m.kcal} kcal</div>
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 8, fontFamily: fontMono, fontSize: 11, color: C.dim }}>
                <span>P {m.p}g</span><span>C {m.c}g</span><span>F {m.f}g</span>
              </div>
            </div>
          ))}
        </div>
        <p style={{ color: C.dim, fontSize: 12, marginTop: 16, fontStyle: 'italic' }}>
          Templates only — log what you actually eat below. That's where the real data lives.
        </p>
      </section>

      {/* Live calorie + macro logging (moved from old Track tab) */}
      <section style={{ borderTop: `1px solid ${C.line}`, paddingTop: 20 }}>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 3, marginBottom: 4 }}>
          / TODAY'S LOG · {todayStr()}
        </div>
        <FoodTracker nutrition={nutrition} consumed={consumed}
          foodLog={foodLog} setFoodLog={setFoodLog} profile={profile} />
      </section>
    </div>
  );
}

function buildMealPlan(n, goalId, diet) {
  const meals = [
    { name: 'Breakfast', share: 0.25 },
    { name: 'Lunch',     share: 0.30 },
    { name: 'Dinner',    share: 0.30 },
    { name: 'Snack',     share: 0.15 },
  ];
  const ideasOmni = {
    muscle: {
      Breakfast: 'Oats + whey + banana + peanut butter',
      Lunch:     'Rice, chicken breast, olive oil, broccoli',
      Dinner:    'Pasta with lean ground beef and tomato sauce',
      Snack:     'Greek yogurt with almonds and blueberries',
    },
    fat_loss: {
      Breakfast: 'Egg whites + 2 whole eggs + spinach + 1 toast',
      Lunch:     'Chicken breast, big salad, light dressing',
      Dinner:    'Salmon, sweet potato, broccoli',
      Snack:     'Cottage cheese + apple',
    },
    strength: {
      Breakfast: '4 eggs, oats, banana, coffee',
      Lunch:     'Ground beef bowl with rice and avocado',
      Dinner:    'Steak, baked potato, asparagus',
      Snack:     'Whey + peanut butter rice cakes',
    },
    endurance: {
      Breakfast: 'Oats, berries, honey, almonds',
      Lunch:     'Whole wheat pasta with tuna and olive oil',
      Dinner:    'Chicken stir fry with brown rice and veggies',
      Snack:     'Banana + handful of trail mix',
    },
    recomp: {
      Breakfast: 'Greek yogurt parfait with oats and berries',
      Lunch:     'Grilled chicken, quinoa, mixed greens, avocado',
      Dinner:    'Salmon, sweet potato, asparagus',
      Snack:     'Whey shake + apple + almonds',
    },
    general: {
      Breakfast: 'Eggs, toast, fruit, coffee',
      Lunch:     'Chicken wrap with veggies and hummus',
      Dinner:    'Salmon, rice, salad',
      Snack:     'Greek yogurt with honey',
    },
  };
  const ideasVeg = {
    muscle: {
      Breakfast: 'Oats + plant whey + peanut butter + banana',
      Lunch:     'Tofu rice bowl with avocado and edamame',
      Dinner:    'Lentil pasta with marinara and chickpeas',
      Snack:     'Greek yogurt with almonds (or soy yogurt if vegan)',
    },
    fat_loss: {
      Breakfast: 'Tofu scramble with spinach and 1 toast',
      Lunch:     'Big salad with chickpeas, quinoa, olive oil',
      Dinner:    'Tempeh stir fry with veggies and brown rice',
      Snack:     'Cottage cheese + apple (or hummus + carrots if vegan)',
    },
    strength: {
      Breakfast: 'Oats, plant whey, peanut butter, banana',
      Lunch:     'Lentil and chickpea bowl with rice and avocado',
      Dinner:    'Tofu steak, baked potato, broccoli',
      Snack:     'Plant whey + peanut butter rice cakes',
    },
    endurance: {
      Breakfast: 'Oats, berries, almond butter, soy milk',
      Lunch:     'Whole wheat pasta with lentil bolognese',
      Dinner:    'Tofu stir fry with brown rice and veggies',
      Snack:     'Banana + trail mix',
    },
    recomp: {
      Breakfast: 'Soy yogurt parfait with oats and berries',
      Lunch:     'Tempeh quinoa bowl with greens and avocado',
      Dinner:    'Tofu, sweet potato, asparagus',
      Snack:     'Plant whey shake + apple + almonds',
    },
    general: {
      Breakfast: 'Avocado toast with eggs (or tofu scramble if vegan)',
      Lunch:     'Hummus wrap with veggies and quinoa',
      Dinner:    'Lentil curry with rice and salad',
      Snack:     'Yogurt with honey (or fruit + nuts if vegan)',
    },
  };
  const isVeg = diet === 'vegan' || diet === 'vegetarian';
  const ideas = isVeg ? ideasVeg : ideasOmni;
  const goalIdeas = ideas[goalId] || ideas.general;
  return meals.map(m => ({
    ...m,
    kcal: Math.round(n.target * m.share),
    p: Math.round(n.protein * m.share),
    c: Math.round(n.carbs * m.share),
    f: Math.round(n.fat * m.share),
    idea: goalIdeas[m.name],
  }));
}

// ============================================================
// TRACKER (tabs: food, water, weight, wellness)
// ============================================================

function Tracker(props) {
  const [sub, setSub] = useState('food');
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 3 }}>/ DAILY TRACKING · {todayStr()}</div>
        <h1 style={{ fontFamily: fontDisplay, fontSize: 'clamp(40px, 7vw, 72px)', lineHeight: 0.95, margin: '12px 0 0', letterSpacing: 1 }}>
          TRACK <span style={{ color: C.accent }}>IT</span><br/>ALL.
        </h1>
      </section>

      {/* Sub-tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, border: `1px solid ${C.line}`, background: C.line }}>
        {[
          { id: 'food',     label: 'FOOD',     Icon: Apple },
          { id: 'water',    label: 'WATER',    Icon: Droplet },
          { id: 'weight',   label: 'WEIGHT',   Icon: Scale },
          { id: 'wellness', label: 'WELLNESS', Icon: Heart },
          { id: 'physique', label: 'PHYSIQUE', Icon: Camera },
        ].map(({ id, label, Icon }) => {
          const active = sub === id;
          return (
            <button key={id} onClick={() => setSub(id)} style={{
              background: active ? C.panel2 : C.bg, border: 0,
              padding: '14px 6px', cursor: 'pointer',
              color: active ? C.accent : C.dim,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              <Icon size={16} />
              <div style={{ fontFamily: fontMono, fontSize: 10, letterSpacing: 2 }}>{label}</div>
            </button>
          );
        })}
      </section>

      {sub === 'food' && <FoodTracker {...props} />}
      {sub === 'water' && <WaterTracker {...props} />}
      {sub === 'weight' && <WeightTracker {...props} />}
      {sub === 'wellness' && <WellnessTracker {...props} />}
      {sub === 'physique' && <PhysiqueTracker {...props} />}
    </div>
  );
}

function EditField({ label, v, onChange, small }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontFamily: fontMono, fontSize: 9, color: C.dim, letterSpacing: 1.5 }}>{label.toUpperCase()}</div>
      <input type="number" value={v ?? 0} onChange={e => onChange(e.target.value)} style={{
        width: '100%', background: 'transparent', border: 0, borderBottom: `1px solid ${C.line}`,
        color: C.text, padding: '4px 0', fontSize: small ? 12 : 14, fontFamily: fontMono, outline: 'none',
      }}/>
    </label>
  );
}

function FoodCamera({ onAdd }) {
  const fileRef = useRef(null);
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const reset = () => {
    setImage(null); setResult(null); setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('That doesn\'t look like an image.'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image too large (max 10MB).'); return;
    }
    setError(null); setResult(null);

    const previewReader = new FileReader();
    previewReader.onload = (ev) => setImage({ file, dataUrl: ev.target.result });
    previewReader.readAsDataURL(file);

    setAnalyzing(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result.split(',')[1]);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const media_type = file.type === 'image/jpg' ? 'image/jpeg' : file.type;

      const data = await callClaude({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: `You are a precise nutrition analyst. Given a food photo, identify every visible food item and estimate calories and macros as accurately as possible.

RULES:
- Account for ALL visible ingredients including oils, sauces, dressings, butter, cheese, cooking fats. These add significant calories.
- Estimate portion size from visual cues: plate diameter (usually 25–28cm), utensils, hands, packaging.
- Account for cooking method (fried > baked > grilled, oil absorption).
- Be honest about uncertainty: set confidence="low" when portion or ingredients are ambiguous.
- When in doubt, lean toward the higher calorie estimate.
- Round to sensible whole numbers.
- If the image clearly shows no food, return items: [] with a notes message.

Return ONLY valid JSON, no markdown fencing:
{
  "items": [
    { "name": "string (specific, e.g. 'Grilled chicken thigh with skin')", "estimatedGrams": number, "kcal": number, "protein": number, "carbs": number, "fat": number, "confidence": "high"|"medium"|"low" }
  ],
  "notes": "short string with caveats, e.g. 'Assumed olive oil dressing' or 'Portion unclear without reference'"
}`,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type, data: base64 } },
            { type: 'text', text: 'Analyze this food photo. Identify every item and estimate macros. JSON only.' }
          ]
        }]
      });
      const text = (data.content || []).map(b => b.type === 'text' ? b.text : '').join('');
      const cleaned = text.replace(/```json|```/g, '').trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      const jsonStr = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
      const parsed = JSON.parse(jsonStr);
      setResult(parsed);
    } catch (err) {
      setError(`Couldn't analyze: ${err.message}. Try a clearer photo or add foods manually below.`);
    } finally {
      setAnalyzing(false);
    }
  };

  const editItem = (i, field, value) => {
    setResult(r => ({
      ...r,
      items: r.items.map((it, idx) => idx === i ? { ...it, [field]: +value || 0 } : it)
    }));
  };
  const removeItem = (i) => setResult(r => ({ ...r, items: r.items.filter((_, idx) => idx !== i) }));

  const totals = result && result.items ? result.items.reduce((a, it) => ({
    kcal: a.kcal + (+it.kcal || 0),
    p: a.p + (+it.protein || 0),
    c: a.c + (+it.carbs || 0),
    f: a.f + (+it.fat || 0),
  }), { kcal: 0, p: 0, c: 0, f: 0 }) : null;

  const addAll = () => {
    if (!result || !result.items.length) return;
    const items = result.items.map(it => ({
      id: Math.random().toString(36).slice(2),
      name: it.name + ' 📷',
      qty: it.estimatedGrams || 100,
      unit: '100g',
      kcal: Math.round(+it.kcal || 0),
      p: +(+it.protein || 0).toFixed(1),
      c: +(+it.carbs || 0).toFixed(1),
      f: +(+it.fat || 0).toFixed(1),
      at: Date.now(),
    }));
    onAdd(items);
    reset();
  };

  return (
    <section style={{ border: `1px solid ${C.accent2}`, background: C.panel, padding: 20 }}>
      <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent2, letterSpacing: 2, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Camera size={14}/> SNAP YOUR FOOD
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        onChange={handleFile} style={{ display: 'none' }} />

      {!image && (
        <>
          <p style={{ color: C.dim, fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>
            Take a photo (or pick one). Claude identifies each item and estimates macros. You can edit any number before saving.
          </p>
          <Btn primary onClick={() => fileRef.current?.click()}>
            <Camera size={14}/> TAKE PHOTO / UPLOAD
          </Btn>
        </>
      )}

      {image && (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14, alignItems: 'start' }}>
            <img src={image.dataUrl} alt="meal" style={{ width: '100%', border: `1px solid ${C.line}`, aspectRatio: '1', objectFit: 'cover' }}/>
            <div>
              {analyzing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.dim, fontSize: 13 }}>
                  <Loader2 size={14} className="animate-spin"/> Analyzing your meal…
                </div>
              )}
              {error && <div style={{ color: C.danger, fontSize: 13, lineHeight: 1.5 }}>{error}</div>}
              {totals && (
                <div>
                  <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, letterSpacing: 2 }}>ESTIMATED TOTAL</div>
                  <div style={{ fontFamily: fontDisplay, fontSize: 36, lineHeight: 1, letterSpacing: 0.5, marginTop: 4 }}>
                    {Math.round(totals.kcal)} <span style={{ color: C.dim, fontSize: 14 }}>kcal</span>
                  </div>
                  <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, marginTop: 6 }}>
                    P {Math.round(totals.p)}g · C {Math.round(totals.c)}g · F {Math.round(totals.f)}g
                  </div>
                </div>
              )}
            </div>
          </div>

          {result && result.items && result.items.length > 0 && (
            <div>
              <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, letterSpacing: 2, marginBottom: 8 }}>
                ITEMS DETECTED · TAP NUMBERS TO EDIT
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {result.items.map((it, i) => (
                  <div key={i} style={{ padding: 12, border: `1px solid ${C.line}`, background: C.bg }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}>{it.name}</div>
                      <button onClick={() => removeItem(i)} style={{ background: 'transparent', border: 0, color: C.dim, cursor: 'pointer', padding: 0 }}>
                        <Trash2 size={14}/>
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                      <EditField label="grams" v={it.estimatedGrams} onChange={v => editItem(i, 'estimatedGrams', v)}/>
                      <EditField label="kcal" v={it.kcal} onChange={v => editItem(i, 'kcal', v)}/>
                      <EditField label="P" v={it.protein} onChange={v => editItem(i, 'protein', v)}/>
                      <EditField label="C" v={it.carbs} onChange={v => editItem(i, 'carbs', v)}/>
                      <EditField label="F" v={it.fat} onChange={v => editItem(i, 'fat', v)}/>
                    </div>
                    {it.confidence && (
                      <div style={{ marginTop: 8, fontFamily: fontMono, fontSize: 9, letterSpacing: 1.5,
                        color: it.confidence === 'high' ? C.accent : it.confidence === 'low' ? C.accent2 : C.dim }}>
                        CONFIDENCE · {it.confidence.toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {result.notes && (
                <Note color={C.dim} icon={<AlertCircle size={12}/>} style={{ marginTop: 12 }}>
                  {result.notes}
                </Note>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                <Btn primary onClick={addAll}>ADD ALL TO LOG <Plus size={14}/></Btn>
                <Btn onClick={reset}>RETRY / CANCEL</Btn>
              </div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 10, fontStyle: 'italic', lineHeight: 1.5 }}>
                Photo estimates have ±20–30% error built in (hidden oils, portion ambiguity). For precise tracking, weigh it and use the search below.
              </div>
            </div>
          )}
          {result && (!result.items || result.items.length === 0) && (
            <div style={{ color: C.dim, fontSize: 13 }}>
              No food detected. Try a clearer shot with the whole plate in frame.
              <div style={{ marginTop: 10 }}><Btn onClick={reset}>TRY AGAIN</Btn></div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function FoodTracker({ nutrition, consumed, foodLog, setFoodLog, profile }) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(null);
  const [grams, setGrams] = useState(100);

  // Filter foods by diet
  const dietFiltered = useMemo(() => {
    if (profile.diet === 'vegan') return FOOD_DB.filter(f => f.tags.includes('vegan'));
    if (profile.diet === 'vegetarian') return FOOD_DB.filter(f => f.tags.includes('vegetarian'));
    if (profile.diet === 'pescatarian') return FOOD_DB.filter(f => f.tags.includes('vegetarian') || f.tags.includes('pescatarian'));
    return FOOD_DB;
  }, [profile.diet]);

  const results = query
    ? dietFiltered.filter(f => f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : dietFiltered.slice(0, 8);

  const addFood = () => {
    if (!picked) return;
    const factor = (picked.unit === '1 egg' || picked.unit.startsWith('scoop')) ? grams : grams / 100;
    setFoodLog(log => ({
      date: todayStr(),
      items: [{
        id: Math.random().toString(36).slice(2),
        name: picked.name, qty: grams, unit: picked.unit,
        kcal: Math.round(picked.kcal * factor),
        p: +(picked.p * factor).toFixed(1),
        c: +(picked.c * factor).toFixed(1),
        f: +(picked.f * factor).toFixed(1),
        at: Date.now(),
      }, ...log.items],
    }));
    setPicked(null); setQuery(''); setGrams(100);
  };

  const addItemsBulk = (newItems) => {
    setFoodLog(log => ({ date: todayStr(), items: [...newItems, ...log.items] }));
  };

  const removeItem = (id) => setFoodLog(log => ({ ...log, items: log.items.filter(i => i.id !== id) }));
  const clearAll = () => setFoodLog({ date: todayStr(), items: [] });
  const pctK = Math.min(100, (consumed.kcal / nutrition.target) * 100);
  const remaining = Math.max(0, nutrition.target - Math.round(consumed.kcal));

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section>
        <div style={{ fontFamily: fontDisplay, fontSize: 'clamp(40px, 8vw, 64px)', lineHeight: 0.95, letterSpacing: 1 }}>
          {Math.round(consumed.kcal)} <span style={{ color: C.dim }}>/ {nutrition.target}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Pill accent>{remaining} kcal left</Pill>
          <Pill>{Math.round(pctK)}%</Pill>
        </div>
      </section>

      <section>
        <div style={{ height: 10, background: C.panel, position: 'relative', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pctK}%`, background: C.accent, transition: 'width 400ms' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
          <MacroProgress name="Protein" cur={consumed.p} target={nutrition.protein} color={C.accent} />
          <MacroProgress name="Carbs"   cur={consumed.c} target={nutrition.carbs}   color={C.blue} />
          <MacroProgress name="Fat"     cur={consumed.f} target={nutrition.fat}     color={C.accent2} />
        </div>
      </section>

      <FoodCamera onAdd={addItemsBulk} />

      <section style={{ border: `1px solid ${C.line}`, background: C.panel, padding: 20 }}>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 2, marginBottom: 12 }}>/ OR SEARCH FOOD</div>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.dim }} />
          <input value={query} onChange={e => { setQuery(e.target.value); setPicked(null); }}
            placeholder="Search foods (chicken, rice, eggs…)"
            style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 6, marginTop: 14 }}>
          {results.map(f => (
            <button key={f.name} onClick={() => setPicked(f)} style={{
              textAlign: 'left', cursor: 'pointer',
              background: picked?.name === f.name ? C.panel2 : 'transparent',
              border: `1px solid ${picked?.name === f.name ? C.accent : C.line}`,
              padding: 10, color: C.text,
            }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</div>
              <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, marginTop: 4 }}>
                {f.kcal} kcal / {f.unit} · P{f.p} C{f.c} F{f.f}
              </div>
            </button>
          ))}
        </div>
        {picked && (
          <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
            <Field label={`Quantity (${picked.unit === '1 egg' ? 'eggs' : picked.unit.startsWith('scoop') ? 'scoops' : 'grams'})`}>
              <input type="number" value={grams} onChange={e => setGrams(+e.target.value || 0)} style={{ ...inputStyle, maxWidth: 150 }} />
            </Field>
            <Btn primary onClick={addFood}>ADD <Plus size={14}/></Btn>
            <Btn onClick={() => { setPicked(null); setQuery(''); }}>CANCEL</Btn>
          </div>
        )}
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, letterSpacing: 2 }}>/ TODAY · {foodLog.items.length} ITEMS</div>
          {foodLog.items.length > 0 && (
            <button onClick={clearAll} style={{ background: 'transparent', border: 0, color: C.dim, fontFamily: fontMono, fontSize: 11, cursor: 'pointer' }}>CLEAR</button>
          )}
        </div>
        {foodLog.items.length === 0 ? (
          <div style={{ border: `1px dashed ${C.line}`, padding: 32, textAlign: 'center', color: C.dim }}>
            No food logged yet today.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 1, background: C.line, border: `1px solid ${C.line}` }}>
            {foodLog.items.map(it => (
              <div key={it.id} style={{
                background: C.panel, padding: '14px 16px',
                display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 14, alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{it.name}</div>
                  <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, marginTop: 3 }}>
                    {it.qty}{it.unit === '1 egg' ? ' eggs' : it.unit.startsWith('scoop') ? ' scoops' : 'g'} · P{it.p} C{it.c} F{it.f}
                  </div>
                </div>
                <div style={{ fontFamily: fontMono, fontSize: 13, color: C.accent }}>{it.kcal} kcal</div>
                <button onClick={() => removeItem(it.id)} style={{ background: 'transparent', border: 0, color: C.dim, cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={14}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function WaterTracker({ nutrition, water, setWater }) {
  const cups = water.cups || 0;
  const target = nutrition.waterCups;
  const pct = Math.min(100, (cups / target) * 100);

  const setCups = (n) => setWater({ date: todayStr(), cups: Math.max(0, n) });

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section>
        <div style={{ fontFamily: fontDisplay, fontSize: 'clamp(40px, 8vw, 64px)', lineHeight: 0.95, letterSpacing: 1 }}>
          {cups} <span style={{ color: C.dim }}>/ {target}</span> <span style={{ fontSize: 18, color: C.dim }}>CUPS</span>
        </div>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, marginTop: 8 }}>
          {((cups * 250) / 1000).toFixed(1)}L of {nutrition.waterLiters}L · {Math.round(pct)}%
        </div>
      </section>

      <section>
        <div style={{ height: 10, background: C.panel, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: C.blue, transition: 'width 400ms' }} />
        </div>
      </section>

      {/* Cup grid */}
      <section style={{ border: `1px solid ${C.line}`, background: C.panel, padding: 24 }}>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, letterSpacing: 2, marginBottom: 14 }}>/ TAP A CUP</div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(56px, 1fr))`, gap: 10 }}>
          {Array.from({ length: target }).map((_, i) => {
            const filled = i < cups;
            return (
              <button key={i} onClick={() => setCups(filled ? i : i + 1)} style={{
                aspectRatio: '1 / 1', background: filled ? C.blue : 'transparent',
                border: `2px solid ${filled ? C.blue : C.line}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: filled ? '#000' : C.dim, transition: 'all 150ms',
              }}>
                <Droplet size={20} fill={filled ? '#000' : 'none'} />
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <Btn onClick={() => setCups(cups + 1)}>+1 CUP <Plus size={14}/></Btn>
          <Btn onClick={() => setCups(cups - 1)} disabled={cups === 0}>-1 CUP</Btn>
          <Btn onClick={() => setCups(0)} disabled={cups === 0}>RESET</Btn>
        </div>
      </section>

      <Note color={C.blue} icon={<Droplet size={12}/>}>
        Each cup is ~250ml. Goal scales with your body weight (~35ml/kg).
      </Note>
    </div>
  );
}

function WeightTracker({ profile, weights, setWeights }) {
  const [newKg, setNewKg] = useState(profile.weight);

  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const log = (kg) => {
    const v = +kg;
    if (!v || v < 20 || v > 400) return;
    const today = todayStr();
    setWeights(w => {
      const without = w.filter(x => x.date !== today);
      return [...without, { date: today, kg: v }];
    });
  };
  const removeAt = (date) => setWeights(w => w.filter(x => x.date !== date));

  const last = sorted[sorted.length - 1];
  const first = sorted[0];
  const change = last && first && last.date !== first.date
    ? +(last.kg - first.kg).toFixed(1) : null;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section>
        <div style={{ fontFamily: fontDisplay, fontSize: 'clamp(40px, 8vw, 64px)', lineHeight: 0.95, letterSpacing: 1 }}>
          {last ? last.kg : profile.weight}<span style={{ color: C.dim }}> kg</span>
        </div>
        {change !== null && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Pill accent={change <= 0}>
              <TrendingUp size={12}/> {change > 0 ? '+' : ''}{change} kg overall
            </Pill>
          </div>
        )}
      </section>

      <section style={{ border: `1px solid ${C.line}`, background: C.panel, padding: 20 }}>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 2, marginBottom: 14 }}>/ LOG TODAY</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
          <Field label="Weight (kg)">
            <input type="number" step="0.1" value={newKg} onChange={e => setNewKg(e.target.value)}
              style={{ ...inputStyle, maxWidth: 180 }} />
          </Field>
          <Btn primary onClick={() => log(newKg)}>SAVE <Check size={14}/></Btn>
        </div>
        {weights.find(x => x.date === todayStr()) && (
          <div style={{ marginTop: 12, fontSize: 12, color: C.dim }}>
            Today's entry will be overwritten if you save again.
          </div>
        )}
      </section>

      {sorted.length > 1 && <WeightSparkline data={sorted} />}

      <section>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, letterSpacing: 2, marginBottom: 10 }}>/ HISTORY · {sorted.length} ENTRIES</div>
        {sorted.length === 0 ? (
          <div style={{ border: `1px dashed ${C.line}`, padding: 32, textAlign: 'center', color: C.dim }}>
            No weights logged yet. Track weekly, same time of day, after the bathroom, before food.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 1, background: C.line, border: `1px solid ${C.line}` }}>
            {[...sorted].reverse().map(w => (
              <div key={w.date} style={{
                background: C.panel, padding: '12px 16px',
                display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 14, alignItems: 'center',
              }}>
                <div style={{ fontFamily: fontMono, fontSize: 12, color: C.dim }}>{w.date}</div>
                <div style={{ fontSize: 15, fontFamily: fontMono }}>{w.kg} kg</div>
                <button onClick={() => removeAt(w.date)} style={{ background: 'transparent', border: 0, color: C.dim, cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={14}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function WeightSparkline({ data }) {
  // Tiny SVG line chart
  const padding = 30;
  const w = 600, h = 180;
  const kgs = data.map(d => d.kg);
  const min = Math.min(...kgs), max = Math.max(...kgs);
  const range = (max - min) || 1;
  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(1, data.length - 1)) * (w - padding * 2);
    const y = padding + (1 - (d.kg - min) / range) * (h - padding * 2);
    return { x, y, d };
  });
  const path = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  return (
    <section style={{ border: `1px solid ${C.line}`, background: C.panel, padding: 14 }}>
      <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, letterSpacing: 2, marginBottom: 8 }}>/ TREND</div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
        <line x1={padding} y1={h - padding} x2={w - padding} y2={h - padding} stroke={C.line} />
        <path d={path} stroke={C.accent} strokeWidth="2" fill="none" />
        {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill={C.accent}/>)}
        <text x={padding} y={padding - 8} fill={C.dim} fontSize="11" fontFamily={fontMono}>{max} kg</text>
        <text x={padding} y={h - padding + 18} fill={C.dim} fontSize="11" fontFamily={fontMono}>{min} kg</text>
      </svg>
    </section>
  );
}

function WellnessTracker({ wellness, setWellness }) {
  const today = todayStr();
  const entry = wellness[today] || { sleep: 7, energy: 5, mood: 5, soreness: 3 };

  const update = (patch) => setWellness(w => ({ ...w, [today]: { ...entry, ...patch } }));

  const last7 = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = daysAgo(i);
      days.push({ date: d, ...(wellness[d] || {}) });
    }
    return days;
  }, [wellness]);

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section style={{ border: `1px solid ${C.line}`, background: C.panel, padding: 20 }}>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 2, marginBottom: 4 }}>/ DAILY CHECK-IN</div>
        <div style={{ fontFamily: fontDisplay, fontSize: 28, letterSpacing: 0.5 }}>HOW WAS LAST NIGHT?</div>

        <div style={{ display: 'grid', gap: 22, marginTop: 22 }}>
          <Field label={`Sleep: ${entry.sleep ?? 0}h`}>
            <input type="range" min="3" max="12" step="0.5" value={entry.sleep ?? 7}
              onChange={e => update({ sleep: +e.target.value })}
              style={{ width: '100%', accentColor: C.accent }} />
            <Scale10 v={entry.sleep ?? 0} min={3} max={12} suffix="h"/>
          </Field>

          <Field label={`Energy: ${entry.energy ?? 0} / 10`}>
            <input type="range" min="1" max="10" value={entry.energy ?? 5}
              onChange={e => update({ energy: +e.target.value })}
              style={{ width: '100%', accentColor: C.accent }} />
            <Scale10 v={entry.energy ?? 0} />
          </Field>

          <Field label={`Mood: ${entry.mood ?? 0} / 10`}>
            <input type="range" min="1" max="10" value={entry.mood ?? 5}
              onChange={e => update({ mood: +e.target.value })}
              style={{ width: '100%', accentColor: C.accent }} />
            <Scale10 v={entry.mood ?? 0} />
          </Field>

          <Field label={`Muscle Soreness: ${entry.soreness ?? 0} / 10`}>
            <input type="range" min="0" max="10" value={entry.soreness ?? 3}
              onChange={e => update({ soreness: +e.target.value })}
              style={{ width: '100%', accentColor: C.accent2 }} />
            <Scale10 v={entry.soreness ?? 0} />
          </Field>
        </div>
      </section>

      <section>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, letterSpacing: 2, marginBottom: 10 }}>/ LAST 7 DAYS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {last7.map((d, i) => {
            const logged = d.energy !== undefined;
            return (
              <div key={i} style={{
                border: `1px solid ${logged ? C.line : C.line}`,
                background: logged ? C.panel : 'transparent',
                padding: 8, textAlign: 'center',
                opacity: logged ? 1 : 0.4,
              }}>
                <div style={{ fontFamily: fontMono, fontSize: 9, color: C.dim, letterSpacing: 1 }}>
                  {d.date.slice(5)}
                </div>
                <div style={{ fontFamily: fontDisplay, fontSize: 16, marginTop: 4 }}>
                  {logged ? `${d.energy}` : '—'}
                </div>
                <div style={{ fontFamily: fontMono, fontSize: 8, color: C.dim, marginTop: 2 }}>ENERGY</div>
              </div>
            );
          })}
        </div>
      </section>

      {(entry.energy && entry.energy <= 3) && (
        <Note color={C.accent2} icon={<AlertCircle size={12}/>}>
          Energy in the basement. Consider an easier session today or pure recovery — sleep, food, hydration.
        </Note>
      )}
    </div>
  );
}

function Scale10({ v, min = 1, max = 10, suffix = '' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: fontMono, fontSize: 9, color: C.dim, marginTop: 4 }}>
      <span>{min}{suffix}</span><span>{Math.round((min+max)/2)}{suffix}</span><span>{max}{suffix}</span>
    </div>
  );
}

// ============================================================
// PHYSIQUE TRACKER — monthly progress photos + AI rating
// ============================================================

// Resize an image file to max width and return base64 data URL
function resizeImageFile(file, maxWidth = 600, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];
        resolve({ dataUrl, base64, mediaType: 'image/jpeg' });
      } catch (err) { reject(err); }
    };
    img.onerror = () => reject(new Error('Could not load image.'));
    img.src = url;
  });
}

function PhysiqueTracker({ profile, physiqueLog, setPhysiqueLog }) {
  const fileRef = useRef(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(null); // pending upload preview
  const [showHistoryItem, setShowHistoryItem] = useState(null);

  const sortedLog = useMemo(() =>
    [...(physiqueLog || [])].sort((a, b) => b.at - a.at),
    [physiqueLog]
  );
  const lastCheck = sortedLog[0];
  const COOLDOWN_DAYS = 28;
  const daysSinceLast = lastCheck ? Math.floor((Date.now() - lastCheck.at) / (1000 * 60 * 60 * 24)) : null;
  const canCheckIn = !lastCheck || daysSinceLast >= COOLDOWN_DAYS;
  const daysUntilNext = lastCheck && !canCheckIn ? COOLDOWN_DAYS - daysSinceLast : 0;

  const teen = profile.age >= 13 && profile.age < 18;

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError("That doesn't look like an image."); return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('Image too large (max 15MB).'); return;
    }
    setError(null);
    try {
      const resized = await resizeImageFile(file, 600, 0.78);
      setCurrent(resized);
    } catch (err) {
      setError(`Couldn't process photo: ${err.message}`);
    }
  };

  const cancelPhoto = () => {
    setCurrent(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const analyze = async () => {
    if (!current) return;
    setAnalyzing(true);
    setError(null);
    try {
      const goalsList = (profile.goals || [])
        .map(gid => {
          const g = (teen ? GOALS_TEEN : GOALS_ADULT).find(x => x.id === gid);
          return g ? g.name : gid;
        })
        .join(', ') || 'general fitness';

      const system = `You analyze physique progress photos for the FORGE fitness app. Be honest, kind, and useful. Never body-shame.

USER PROFILE:
- Age: ${profile.age}${teen ? ' (TEEN — extra care, see below)' : ''}
- Sex: ${profile.sex}
- Goals: ${goalsList}
- Focus areas they care about: ${(profile.focusAreas || []).join(', ') || 'none specified'}
- Specific milestones they want: ${(profile.strengthGoals || []).join(', ') || 'none specified'}
- Training experience: ${profile.experience}

${teen ? `TEEN-SPECIFIC RULES (NON-NEGOTIABLE):
- DO NOT comment on body fat, leanness, or weight in any way.
- DO NOT compare them to "ideal" physiques or athletes.
- Focus ONLY on: posture, visible form/symmetry, muscle development (in terms of strength potential, not size).
- Reframe rating as "development score" — about progress, not appearance.
- Be encouraging — teens are still developing, their body will change a lot.
- If anything in the photo concerns you (visible signs of disordered eating, excessive thinness), set rating to null and use 'encouragement' to gently suggest they talk to a trusted adult.
` : `ADULT RULES:
- You can be honest about body composition, muscle development, posture.
- Never use shaming language. Frame everything constructively.
- Use specific, observable details — not generic praise.
`}

RETURN ONLY VALID JSON, no markdown, no preamble:
{
  "rating": number 1-10 (or null if concerned),
  "strengths": [1-3 short observations about what's progressing well, max 80 chars each],
  "focus": [1-3 short actionable areas to focus on next, max 80 chars each],
  "encouragement": "one short, specific sentence — not generic"
}`;

      const data = await callClaude({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: current.mediaType, data: current.base64 } },
            { type: 'text', text: 'Analyze this physique progress photo. JSON only.' }
          ]
        }]
      });
      const text = (data.content || []).map(b => b.type === 'text' ? b.text : '').join('');
      const cleaned = text.replace(/```json|```/g, '').trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      const jsonStr = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
      const parsed = JSON.parse(jsonStr);

      const entry = {
        id: Math.random().toString(36).slice(2),
        at: Date.now(),
        date: todayStr(),
        thumb: current.dataUrl,
        rating: parsed.rating,
        strengths: parsed.strengths || [],
        focus: parsed.focus || [],
        encouragement: parsed.encouragement || '',
      };
      setPhysiqueLog(prev => [...(prev || []), entry]);
      setCurrent(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(`Couldn't analyze: ${err.message}. Try a clearer, well-lit photo.`);
    } finally {
      setAnalyzing(false);
    }
  };

  const deleteEntry = (id) => {
    if (!confirm('Delete this physique check permanently?')) return;
    setPhysiqueLog(prev => (prev || []).filter(e => e.id !== id));
    setShowHistoryItem(null);
  };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ border: `1px solid ${C.line}`, padding: 20, background: C.panel }}>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 2, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Camera size={14}/> MONTHLY PHYSIQUE CHECK
        </div>
        <div style={{ fontFamily: fontDisplay, fontSize: 28, letterSpacing: 0.5, lineHeight: 1, marginBottom: 8 }}>
          {canCheckIn ? 'READY FOR A NEW CHECK.' : `NEXT CHECK IN ${daysUntilNext} DAY${daysUntilNext === 1 ? '' : 'S'}.`}
        </div>
        <div style={{ fontFamily: fontBody, fontSize: 13, color: C.dim, lineHeight: 1.5 }}>
          Once a month, snap a progress photo. The AI gives you an honest rating and tells you what to focus on. Photos stay on your device — they're only sent to the AI for analysis, never stored anywhere else.
        </div>

        {/* Tips for a good photo */}
        {canCheckIn && !current && (
          <div style={{ marginTop: 16, padding: 14, border: `1px solid ${C.line}`, fontFamily: fontMono, fontSize: 11, color: C.dim, lineHeight: 1.7 }}>
            <div style={{ color: C.text, letterSpacing: 2, marginBottom: 6 }}>FOR BEST RESULTS</div>
            · Good lighting, plain background<br/>
            · Same pose each month (front, relaxed)<br/>
            · Same time of day<br/>
            · Wear the same thing if you can
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          onChange={handleFile} style={{ display: 'none' }} />

        {canCheckIn && !current && (
          <button onClick={() => fileRef.current?.click()} style={{
            marginTop: 16, background: C.accent, color: '#000', border: 0,
            padding: '14px 20px', cursor: 'pointer',
            fontFamily: fontMono, fontSize: 12, letterSpacing: 2, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <Camera size={16}/> TAKE PROGRESS PHOTO
          </button>
        )}

        {!canCheckIn && (
          <div style={{ marginTop: 14, fontFamily: fontMono, fontSize: 11, color: C.dim, letterSpacing: 1 }}>
            Last check: {lastCheck.date} · Rating: {lastCheck.rating != null ? `${lastCheck.rating}/10` : '—'}
          </div>
        )}

        {error && (
          <div style={{ marginTop: 14, padding: 12, border: `1px solid ${C.danger}`, color: C.danger, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Pending photo preview */}
        {current && (
          <div style={{ marginTop: 18 }}>
            <img src={current.dataUrl} alt="Preview" style={{
              width: '100%', maxWidth: 280, display: 'block',
              border: `1px solid ${C.line}`,
            }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={analyze} disabled={analyzing} style={{
                background: C.accent, color: '#000', border: 0, cursor: analyzing ? 'wait' : 'pointer',
                padding: '12px 18px', fontFamily: fontMono, fontSize: 12, letterSpacing: 2, fontWeight: 700,
                opacity: analyzing ? 0.6 : 1,
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                {analyzing ? <><Loader2 size={14} className="spin"/> ANALYZING…</> : <><Sparkles size={14}/> ANALYZE</>}
              </button>
              <button onClick={cancelPhoto} disabled={analyzing} style={{
                background: 'transparent', color: C.text, border: `1px solid ${C.line}`,
                padding: '12px 18px', cursor: analyzing ? 'wait' : 'pointer',
                fontFamily: fontMono, fontSize: 12, letterSpacing: 2,
              }}>CANCEL</button>
            </div>
          </div>
        )}
      </div>

      {/* Latest result */}
      {lastCheck && !current && (
        <div>
          <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, letterSpacing: 2, marginBottom: 10 }}>
            / LATEST · {lastCheck.date}
          </div>
          <PhysiqueResultCard entry={lastCheck} expanded onDelete={() => deleteEntry(lastCheck.id)} />
        </div>
      )}

      {/* History */}
      {sortedLog.length > 1 && (
        <div>
          <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, letterSpacing: 2, marginBottom: 10 }}>
            / HISTORY · {sortedLog.length - 1} EARLIER CHECK{sortedLog.length - 1 === 1 ? '' : 'S'}
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {sortedLog.slice(1).map(entry => (
              <button key={entry.id}
                onClick={() => setShowHistoryItem(showHistoryItem === entry.id ? null : entry.id)}
                style={{
                  textAlign: 'left', cursor: 'pointer', padding: 0,
                  border: `1px solid ${C.line}`, background: C.panel, color: C.text,
                }}>
                {showHistoryItem === entry.id ? (
                  <div style={{ padding: 16 }}>
                    <PhysiqueResultCard entry={entry} expanded onDelete={() => deleteEntry(entry.id)} embedded />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
                    <img src={entry.thumb} alt="" style={{ width: 56, height: 56, objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, letterSpacing: 2 }}>{entry.date}</div>
                      <div style={{ fontFamily: fontDisplay, fontSize: 22, lineHeight: 1, marginTop: 2 }}>
                        <span style={{ color: C.accent }}>{entry.rating != null ? entry.rating : '—'}</span>
                        <span style={{ color: C.dim, fontSize: 14 }}> / 10</span>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: C.dim }} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  );
}

function PhysiqueResultCard({ entry, expanded, onDelete, embedded }) {
  return (
    <div style={{
      border: embedded ? 0 : `1px solid ${C.accent}`,
      background: embedded ? 'transparent' : C.panel,
      padding: embedded ? 0 : 20,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'start' }}>
        <img src={entry.thumb} alt="Physique check" style={{
          width: '100%', display: 'block', border: `1px solid ${C.line}`,
        }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, letterSpacing: 2 }}>RATING</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 56, color: C.accent, lineHeight: 1, letterSpacing: 1 }}>
            {entry.rating != null ? entry.rating : '—'}
            <span style={{ fontSize: 20, color: C.dim }}> / 10</span>
          </div>
        </div>
      </div>

      {entry.strengths && entry.strengths.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontFamily: fontMono, fontSize: 10, color: C.accent, letterSpacing: 2, marginBottom: 6 }}>/ WHAT'S PROGRESSING</div>
          {entry.strengths.map((s, i) => (
            <div key={i} style={{ fontFamily: fontBody, fontSize: 14, lineHeight: 1.5, padding: '4px 0' }}>· {s}</div>
          ))}
        </div>
      )}

      {entry.focus && entry.focus.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: fontMono, fontSize: 10, color: C.accent2, letterSpacing: 2, marginBottom: 6 }}>/ FOCUS NEXT</div>
          {entry.focus.map((s, i) => (
            <div key={i} style={{ fontFamily: fontBody, fontSize: 14, lineHeight: 1.5, padding: '4px 0' }}>→ {s}</div>
          ))}
        </div>
      )}

      {entry.encouragement && (
        <div style={{ marginTop: 14, padding: 12, borderLeft: `2px solid ${C.accent}`, fontFamily: fontBody, fontSize: 13, color: C.text, fontStyle: 'italic', lineHeight: 1.5 }}>
          "{entry.encouragement}"
        </div>
      )}

      {onDelete && (
        <button onClick={onDelete} style={{
          marginTop: 16, background: 'transparent', color: C.dim, border: `1px solid ${C.line}`,
          padding: '6px 10px', cursor: 'pointer',
          fontFamily: fontMono, fontSize: 10, letterSpacing: 1.5,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <Trash2 size={11}/> DELETE
        </button>
      )}
    </div>
  );
}

// ============================================================
// RANK TAB — strength ranking + rewards + physique
// ============================================================

function RankEmblem({ tier, size = 120 }) {
  const t = RANK_TIERS[tier] || RANK_TIERS[0];
  return (
    <div style={{
      width: size, height: size, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        background: `linear-gradient(135deg, ${t.color}, ${t.color}88)`,
        boxShadow: `0 0 30px ${t.glow}`,
      }} />
      <div style={{
        position: 'absolute', inset: 4,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        background: C.bg,
      }} />
      <div style={{
        position: 'relative', fontFamily: fontDisplay, fontSize: size * 0.34,
        color: t.color, letterSpacing: 1, lineHeight: 1, textAlign: 'center',
      }}>{t.id + 1}</div>
    </div>
  );
}

function RankTab({ profile, liftLog, setLiftLog, physiqueLog, setPhysiqueLog }) {
  const bodyweight = profile.weight;
  const sex = profile.sex;
  const [form, setForm] = useState({ exercise: 'bench', weight: '', reps: '' });
  const [celebrate, setCelebrate] = useState(null);
  const [section, setSection] = useState('rank'); // 'rank' | 'physique'

  const bestLifts = useMemo(() => {
    const best = {};
    for (const l of (liftLog || [])) {
      if (!best[l.exercise] || l.e1rm > best[l.exercise]) best[l.exercise] = l.e1rm;
    }
    return best;
  }, [liftLog]);

  const overall = overallRank(bestLifts, bodyweight, sex);
  const overallTier = RANK_TIERS[overall.tier];
  const reward = RANK_REWARDS[overall.tier];

  const previewE1RM = form.weight && form.reps ? estimate1RM(form.weight, form.reps) : null;

  const logLift = () => {
    const w = +form.weight, r = +form.reps;
    if (!w || !r) return;
    const e1rm = estimate1RM(w, r);
    const beforeTier = overallRank(bestLifts, bodyweight, sex).tier;
    const newBest = { ...bestLifts };
    if (!newBest[form.exercise] || e1rm > newBest[form.exercise]) newBest[form.exercise] = e1rm;
    const afterTier = overallRank(newBest, bodyweight, sex).tier;

    setLiftLog(prev => [...(prev || []), {
      id: Math.random().toString(36).slice(2),
      exercise: form.exercise, weight: w, reps: r, e1rm,
      at: Date.now(), source: 'manual',
    }]);
    setForm({ exercise: form.exercise, weight: '', reps: '' });
    if (afterTier > beforeTier) setCelebrate(RANK_TIERS[afterTier]);
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 3 }}>/ YOUR RANK</div>
        <h1 style={{ fontFamily: fontDisplay, fontSize: 'clamp(40px, 7vw, 72px)', lineHeight: 0.95, margin: '12px 0 0', letterSpacing: 1 }}>
          THE <span style={{ color: C.accent }}>CLIMB</span>.
        </h1>
      </section>

      {/* Section toggle */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, border: `1px solid ${C.line}`, background: C.line }}>
        {[{ id: 'rank', label: 'STRENGTH', Icon: Trophy }, { id: 'physique', label: 'PHYSIQUE', Icon: Camera }].map(({ id, label, Icon }) => {
          const active = section === id;
          return (
            <button key={id} onClick={() => setSection(id)} style={{
              background: active ? C.panel2 : C.bg, border: 0, padding: '14px 6px', cursor: 'pointer',
              color: active ? C.accent : C.dim,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Icon size={16} />
              <div style={{ fontFamily: fontMono, fontSize: 11, letterSpacing: 2 }}>{label}</div>
            </button>
          );
        })}
      </section>

      {section === 'rank' && (
        <>
          {/* Hero rank */}
          <section style={{
            border: `1px solid ${overallTier.color}`, background: C.panel, padding: 24,
            display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
          }}>
            <RankEmblem tier={overall.tier} size={110} />
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, letterSpacing: 2 }}>CURRENT RANK</div>
              <div style={{ fontFamily: fontDisplay, fontSize: 44, color: overallTier.color, letterSpacing: 1, lineHeight: 1 }}>
                {overallTier.name}
              </div>
              <div style={{ fontFamily: fontMono, fontSize: 12, color: C.text, letterSpacing: 1, marginTop: 4 }}>
                "{reward.title}"
              </div>
              <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, marginTop: 8 }}>
                {overall.count === 0
                  ? 'Log your first lift to get ranked.'
                  : `Based on ${overall.count} lift${overall.count === 1 ? '' : 's'} · BW ${bodyweight}kg`}
              </div>
            </div>
          </section>

          {/* Log a lift */}
          <section style={{ border: `1px solid ${C.line}`, padding: 20 }}>
            <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 2, marginBottom: 14 }}>/ LOG A LIFT</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, letterSpacing: 1.5, marginBottom: 6 }}>EXERCISE</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {RANK_LIFTS.map(l => (
                    <button key={l.id} onClick={() => setForm(f => ({ ...f, exercise: l.id }))} style={{
                      padding: '8px 12px', cursor: 'pointer',
                      background: form.exercise === l.id ? C.accent : 'transparent',
                      border: `1px solid ${form.exercise === l.id ? C.accent : C.line}`,
                      color: form.exercise === l.id ? '#000' : C.text,
                      fontFamily: fontMono, fontSize: 11, letterSpacing: 1,
                    }}>{l.name.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, letterSpacing: 1.5, marginBottom: 6 }}>
                    {form.exercise === 'pullup' ? 'ADDED WEIGHT (KG)' : 'WEIGHT (KG)'}
                  </div>
                  <input type="number" inputMode="decimal" value={form.weight}
                    onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                    placeholder={form.exercise === 'pullup' ? '0 = bodyweight' : 'e.g. 60'} style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, letterSpacing: 1.5, marginBottom: 6 }}>REPS</div>
                  <input type="number" inputMode="numeric" value={form.reps}
                    onChange={e => setForm(f => ({ ...f, reps: e.target.value }))}
                    placeholder="e.g. 5" style={inputStyle} />
                </div>
              </div>
              {previewE1RM != null && (
                <div style={{ fontFamily: fontMono, fontSize: 12, color: C.accent, letterSpacing: 1 }}>
                  / EST. 1-REP MAX: {previewE1RM} KG
                </div>
              )}
              <button onClick={logLift} disabled={!form.weight || !form.reps} style={{
                background: (!form.weight || !form.reps) ? C.line : C.accent,
                color: (!form.weight || !form.reps) ? C.dim : '#000', border: 0,
                padding: '14px', cursor: (!form.weight || !form.reps) ? 'not-allowed' : 'pointer',
                fontFamily: fontMono, fontSize: 12, letterSpacing: 2, fontWeight: 700,
              }}>LOG LIFT</button>
            </div>
          </section>

          {/* Per-lift breakdown */}
          <section>
            <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, letterSpacing: 2, marginBottom: 12 }}>/ LIFT BREAKDOWN</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {RANK_LIFTS.map(l => {
                const e1rm = bestLifts[l.id];
                const info = e1rm ? tierForLift(l.id, e1rm, bodyweight, sex) : null;
                const t = info ? RANK_TIERS[info.tier] : null;
                return (
                  <div key={l.id} style={{ border: `1px solid ${C.line}`, padding: 14, background: C.panel }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ fontFamily: fontDisplay, fontSize: 18, letterSpacing: 0.5 }}>{l.name.toUpperCase()}</div>
                      {t ? (
                        <div style={{ fontFamily: fontMono, fontSize: 12, color: t.color, letterSpacing: 1 }}>{t.name}</div>
                      ) : (
                        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, letterSpacing: 1 }}>NOT LOGGED</div>
                      )}
                    </div>
                    {info && (
                      <>
                        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, marginTop: 4 }}>
                          {e1rm}kg 1RM · {info.ratio}× bodyweight
                        </div>
                        {info.tier < RANK_TIERS.length - 1 && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ height: 4, background: C.line, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.round(info.toNext * 100)}%`, background: t.color }} />
                            </div>
                            <div style={{ fontFamily: fontMono, fontSize: 9, color: C.dim, marginTop: 4, letterSpacing: 1 }}>
                              {Math.round(info.toNext * 100)}% TO {RANK_TIERS[info.tier + 1].name}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Rewards ladder */}
          <section>
            <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, letterSpacing: 2, marginBottom: 12 }}>/ REWARDS LADDER</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {RANK_REWARDS.map((r, i) => {
                const t = RANK_TIERS[i];
                const unlocked = i <= overall.tier && overall.count > 0;
                const isCurrent = i === overall.tier && overall.count > 0;
                return (
                  <div key={r.tier} style={{
                    border: `1px solid ${isCurrent ? t.color : C.line}`,
                    background: unlocked ? C.panel : 'transparent',
                    padding: 14, opacity: unlocked ? 1 : 0.5,
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}>
                    <div style={{
                      width: 30, height: 30, flexShrink: 0,
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                      background: unlocked ? t.color : C.line,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: fontDisplay, fontSize: 13, color: unlocked ? '#000' : C.dim,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: fontDisplay, fontSize: 17, letterSpacing: 0.5, color: unlocked ? t.color : C.dim }}>
                        {r.tier} {isCurrent && <span style={{ fontSize: 10, color: C.accent }}>· YOU ARE HERE</span>}
                      </div>
                      <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, marginTop: 2, letterSpacing: 1 }}>
                        "{r.title}" · {r.perk}
                      </div>
                      <div style={{ fontFamily: fontBody, fontSize: 12, color: unlocked ? C.text : C.dim, marginTop: 3 }}>
                        {unlocked ? r.unlock : '🔒 ' + r.unlock}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recent lifts */}
          {(liftLog || []).length > 0 && (
            <section>
              <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, letterSpacing: 2, marginBottom: 12 }}>/ RECENT LIFTS</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {[...liftLog].sort((a, b) => b.at - a.at).slice(0, 10).map(l => {
                  const lift = RANK_LIFTS.find(x => x.id === l.exercise);
                  return (
                    <div key={l.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      border: `1px solid ${C.line}`, padding: '10px 14px',
                    }}>
                      <div>
                        <div style={{ fontFamily: fontMono, fontSize: 13, letterSpacing: 0.5 }}>{lift ? lift.name : l.exercise}</div>
                        <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, marginTop: 2 }}>
                          {l.weight}kg × {l.reps} · {l.source === 'workout' ? 'from workout' : 'manual'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontFamily: fontMono, fontSize: 12, color: C.accent }}>{l.e1rm}kg 1RM</div>
                        <button onClick={() => setLiftLog(prev => prev.filter(x => x.id !== l.id))} style={{
                          background: 'transparent', border: 0, color: C.dim, cursor: 'pointer', padding: 4,
                        }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {section === 'physique' && (
        <PhysiqueTracker profile={profile} physiqueLog={physiqueLog} setPhysiqueLog={setPhysiqueLog} />
      )}

      {/* Rank-up celebration */}
      {celebrate && (
        <div onClick={() => setCelebrate(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(8,8,10,0.94)', zIndex: 400,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            textAlign: 'center', maxWidth: 360,
          }}>
            <div style={{ fontFamily: fontMono, fontSize: 12, color: C.accent, letterSpacing: 4, marginBottom: 20 }}>RANK UP</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <RankEmblem tier={celebrate.id} size={160} />
            </div>
            <div style={{ fontFamily: fontDisplay, fontSize: 56, color: celebrate.color, letterSpacing: 1, lineHeight: 1 }}>
              {celebrate.name}
            </div>
            <div style={{ fontFamily: fontMono, fontSize: 13, color: C.text, letterSpacing: 1, marginTop: 10 }}>
              "{RANK_REWARDS[celebrate.id].title}" unlocked
            </div>
            <div style={{ fontFamily: fontBody, fontSize: 14, color: C.dim, marginTop: 8 }}>
              {RANK_REWARDS[celebrate.id].unlock}
            </div>
            <button onClick={() => setCelebrate(null)} style={{
              marginTop: 24, background: C.accent, color: '#000', border: 0,
              padding: '14px 28px', cursor: 'pointer',
              fontFamily: fontMono, fontSize: 12, letterSpacing: 2, fontWeight: 700,
            }}>KEEP CLIMBING</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// AI COACH
// ============================================================

function Coach({ profile, nutrition, consumed, water, weights, wellness, completedDays }) {
  const goal = goalsFor(profile).find(g => g.id === profile.goal);
  const wtype = WORKOUT_TYPES.find(t => t.id === profile.type);
  const plan = WORKOUT_PLANS[profile.type];
  const block = getBlockInfo(profile, plan);

  const sortedW = [...weights].sort((a,b)=>a.date.localeCompare(b.date));
  const latestW = sortedW[sortedW.length - 1];
  const today = wellness[todayStr()] || {};

  const [messages, setMessages] = useState([
    { role: 'assistant', content:
      `What's up ${profile.name || 'champ'}. I'm your coach. I know your plan (${wtype.sub.toLowerCase()}, ${goal.name.toLowerCase()}), I know your numbers (${nutrition.target} kcal, ${nutrition.protein}g protein), and I'm here for whatever you need — form, swaps, food, recovery. Fire away.`
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const teen = nutrition.isTeenMode;

  const systemPrompt = `You are FORGE Coach — a direct, knowledgeable, no-fluff fitness and nutrition coach. You speak with the voice of an experienced strength coach: brief, confident, encouraging but not coddling. Plain language, no emoji unless the athlete uses one first.

${teen ? `CRITICAL — THIS ATHLETE IS A TEENAGER (age ${profile.age}). Apply these rules absolutely:
- Never recommend aggressive calorie deficits or rapid weight loss.
- Never suggest skipping meals or extreme restriction.
- Prioritize strength, skill, sleep, full meals, and consistency over weight or appearance.
- If they bring up weight loss, gently steer toward body recomposition, performance, and feeling good in their body.
- Encourage involving a parent/guardian and consulting a doctor for any pain, illness, or significant body change goals.
- Never test or recommend 1-rep max attempts.
- If they describe any signs of restrictive eating, body image distress, or unhealthy comparison — do NOT engage with diet detail; instead express concern, validate them, and encourage talking to a trusted adult or professional.
` : ''}
ATHLETE PROFILE:
- Name: ${profile.name || 'Athlete'}
- Age: ${profile.age} ${teen ? '(TEEN)' : '(ADULT)'}
- Sex: ${profile.sex}, Height: ${profile.height}cm, Weight: ${profile.weight}kg
- Discipline: ${wtype.sub} (${profile.type})
- Goal: ${goal.name} (${goal.tag})${profile.goals && profile.goals.length > 1 ? `
- Secondary goals (give these context too, but don't change the math): ${profile.goals.slice(1).map(gid => { const sg = goalsFor(profile).find(x => x.id === gid); return sg ? sg.name : gid; }).join(', ')}` : ''}
${profile.targetWeight ? `- Target weight: ${profile.targetWeight}kg (${profile.targetWeight - profile.weight > 0 ? '+' : ''}${(profile.targetWeight - profile.weight).toFixed(1)}kg from current)` : ''}
${profile.timeline ? `- Timeline: ${profile.timeline === '3mo' ? '3 months' : profile.timeline === '6mo' ? '6 months' : profile.timeline === '12mo' ? '1 year' : 'no rush'}` : ''}
${profile.focusAreas && profile.focusAreas.length ? `- Focus areas: ${profile.focusAreas.join(', ')}` : ''}
${profile.strengthGoals && profile.strengthGoals.length ? `- Specific milestones they want to hit: ${profile.strengthGoals.join(', ')}` : ''}
- Experience: ${profile.experience}
- Equipment: ${profile.equipment}
- Schedule: ${profile.daysPerWeek}x/week, ${profile.sessionLength}min per session
- Activity outside training: ${profile.activity}
- Diet: ${profile.diet}${profile.allergens.length ? ', avoids: ' + profile.allergens.join(', ') : ''}
- Injuries / sensitivities: ${profile.injuries.length ? profile.injuries.join(', ') : 'none reported'}
- Average sleep: ${profile.sleep}h
- Motivation: ${profile.motivation || '(none provided)'}

TARGETS:
- Calories: ${nutrition.target} kcal/day (${goal.surplus >= 0 ? '+' : ''}${goal.surplus} from TDEE of ${nutrition.tdee})
- Protein: ${nutrition.protein}g | Carbs: ${nutrition.carbs}g | Fat: ${nutrition.fat}g
- Water: ${nutrition.waterCups} cups (~${nutrition.waterLiters}L)

TODAY:
- Calories eaten: ${Math.round(consumed.kcal)} (remaining: ${Math.max(0, nutrition.target - Math.round(consumed.kcal))})
- Protein eaten: ${Math.round(consumed.p)}g
- Water: ${water.cups || 0}/${nutrition.waterCups} cups
- Sleep last night: ${today.sleep ? today.sleep + 'h' : 'not logged'}
- Energy: ${today.energy ? today.energy + '/10' : 'not logged'}, Mood: ${today.mood ? today.mood + '/10' : 'not logged'}, Soreness: ${today.soreness ?? '—'}/10
- Latest weight: ${latestW ? latestW.kg + 'kg (' + latestW.date + ')' : 'not logged'}
- Sessions completed this week: ${countCompletedThisWeek(completedDays)}

PROGRAM CYCLE:
- Currently on week ${block.week + 1} of program — block ${block.blockIndex + 1}, week ${block.weekInBlock + 1} of ${block.blockLength}
- ${block.isDeload ? 'THIS IS A DELOAD WEEK — recommend lighter loads (~70%), fewer sets, focus on form, sleep, recovery. Reassure that deloads are how strength is built.' : 'Building week — encourage pushing reps or weight on core lifts. Accessories rotate at the start of each new block.'}

RULES:
- Keep responses tight — 2 to 4 short paragraphs, or a short list when the question warrants one.
- Reference real numbers when relevant; don't invent stats.
- If asked something outside fitness/nutrition/recovery/training mindset, redirect gently.
- For pain, injury, medical, or mental health — recommend a professional and avoid prescribing.`;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const data = await callClaude({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: apiMessages,
      });
      const reply = (data.content || [])
        .map(b => (b.type === 'text' ? b.text : ''))
        .filter(Boolean)
        .join('\n');
      setMessages(m => [...m, { role: 'assistant', content: reply || '(silence)' }]);
    } catch (e) {
      setError(e.message || 'Something went wrong.');
      setMessages(m => [...m, { role: 'assistant', content: 'Comms dropped. Try again in a sec.' }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = teen
    ? [
        'I want to get stronger — what should I focus on?',
        'How do I tell if my form is right?',
        'I have a lot of school stress — how do I still train?',
        'What\'s a good high-protein snack after school?',
      ]
    : [
        'No gym today — give me a home version',
        'My shoulder hurts on bench, what should I swap?',
        'Build me a high-protein meal under 600 kcal',
        'Should I deload this week?',
      ];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section>
        <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 3 }}>/ AI COACH</div>
        <h1 style={{ fontFamily: fontDisplay, fontSize: 'clamp(40px, 7vw, 72px)', lineHeight: 0.95, margin: '12px 0 0', letterSpacing: 1 }}>
          IN YOUR <span style={{ color: C.accent }}>CORNER.</span>
        </h1>
      </section>

      <div style={{ display: 'grid', gridTemplateRows: '1fr auto', gap: 12, border: `1px solid ${C.line}`, background: C.panel, minHeight: 480 }}>
        <div ref={scrollRef} style={{ padding: 20, overflowY: 'auto', maxHeight: 560, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%',
                background: m.role === 'user' ? C.accent : C.panel2,
                color: m.role === 'user' ? '#000' : C.text,
                padding: '12px 14px', fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap',
                border: m.role === 'user' ? 0 : `1px solid ${C.line}`,
              }}>
                {m.role === 'assistant' && (
                  <div style={{ fontFamily: fontMono, fontSize: 9, color: C.accent, letterSpacing: 2, marginBottom: 6 }}>COACH</div>
                )}
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ background: C.panel2, padding: '12px 14px', border: `1px solid ${C.line}`, color: C.dim, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={14} className="animate-spin" /> thinking…
              </div>
            </div>
          )}
        </div>
        <div style={{ borderTop: `1px solid ${C.line}`, padding: 14 }}>
          {messages.length <= 1 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => setInput(s)} style={{
                  border: `1px solid ${C.line}`, background: 'transparent', color: C.dim,
                  padding: '6px 10px', cursor: 'pointer', fontSize: 12, textAlign: 'left',
                }}>{s}</button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask the coach…" style={{ ...inputStyle, flex: 1 }} disabled={loading} />
            <button onClick={send} disabled={loading || !input.trim()} style={{
              background: C.accent, border: 0, padding: '0 16px',
              cursor: loading ? 'wait' : 'pointer', color: '#000',
              fontFamily: fontMono, fontSize: 12, letterSpacing: 1,
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: (loading || !input.trim()) ? 0.4 : 1,
            }}>SEND <Send size={14}/></button>
          </div>
          {error && <div style={{ marginTop: 8, color: C.danger, fontSize: 12 }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}

function countCompletedThisWeek(completedDays) {
  let n = 0;
  for (let i = 0; i < 7; i++) {
    if (completedDays[daysAgo(i)] !== undefined) n++;
  }
  return n;
}

// ============================================================
// SHARED UI
// ============================================================

const inputStyle = {
  width: '100%', background: C.bg, border: `1px solid ${C.line}`, color: C.text,
  padding: '12px 14px', fontSize: 14, fontFamily: fontBody, outline: 'none', borderRadius: 0,
};

function NumberSlider({ label, value, onChange, min, max, step = 1, unit = '', accent = C.accent }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        {label && <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, letterSpacing: 2 }}>{label.toUpperCase()}</div>}
        <div style={{ fontFamily: fontDisplay, fontSize: 40, color: accent, letterSpacing: 0.5, lineHeight: 1 }}>
          {value}<span style={{ fontSize: 16, color: C.dim, marginLeft: 4 }}>{unit.trim()}</span>
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        style={{ width: '100%', accentColor: accent, cursor: 'pointer' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: fontMono, fontSize: 9, color: C.dim, marginTop: 4 }}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

function Btn({ children, onClick, primary, disabled, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: primary ? C.accent : 'transparent',
      color: primary ? '#000' : C.text,
      border: primary ? 'none' : `1px solid ${C.line}`,
      padding: '12px 18px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: fontMono, fontSize: 12, letterSpacing: 2, fontWeight: 700,
      display: 'inline-flex', alignItems: 'center', gap: 8,
      opacity: disabled ? 0.35 : 1, ...style,
    }}>{children}</button>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontFamily: fontMono, fontSize: 10, letterSpacing: 2, color: C.dim, marginBottom: 6 }}>
        {label.toUpperCase()}
      </div>
      {children}
    </label>
  );
}

function Crumb({ children }) {
  return <div style={{ fontFamily: fontMono, fontSize: 11, color: C.accent, letterSpacing: 3, marginBottom: 14 }}>/ {children}</div>;
}
function H1({ children }) {
  return <h1 style={{ fontFamily: fontDisplay, fontSize: 'clamp(40px, 8vw, 80px)', lineHeight: 0.95, margin: 0, letterSpacing: 1 }}>{children}</h1>;
}
function Sub({ children }) {
  return <p style={{ color: C.dim, marginTop: 12, marginBottom: 0, fontSize: 16, lineHeight: 1.5 }}>{children}</p>;
}

function Card({ children, style }) {
  return <div style={{ border: `1px solid ${C.line}`, background: C.panel, padding: 22, ...style }}>{children}</div>;
}
function CardLabel({ children }) {
  return <div style={{ fontFamily: fontMono, fontSize: 10, color: C.accent, letterSpacing: 2 }}>/ {children}</div>;
}
function Pill({ children, accent }) {
  return (
    <span style={{
      fontFamily: fontMono, fontSize: 10, letterSpacing: 2,
      border: `1px solid ${accent ? C.accent : C.line}`,
      color: accent ? C.accent : C.dim,
      padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>{children}</span>
  );
}

function StatTile({ label, value, unit, accent }) {
  return (
    <div style={{ background: C.bg, padding: '18px 14px' }}>
      <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, letterSpacing: 2 }}>{label.toUpperCase()}</div>
      <div style={{ fontFamily: fontDisplay, fontSize: 32, marginTop: 6, lineHeight: 1, color: accent ? C.accent : C.text, letterSpacing: 0.5 }}>{value}</div>
      <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, marginTop: 4 }}>{unit}</div>
    </div>
  );
}
function MiniStatCard({ icon, label, value, sub }) {
  return (
    <div style={{ border: `1px solid ${C.line}`, padding: 14, background: C.panel }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: fontMono, fontSize: 10, color: C.dim, letterSpacing: 2 }}>
        <span style={{ color: C.accent }}>{icon}</span>
        {label.toUpperCase()}
      </div>
      <div style={{ fontFamily: fontDisplay, fontSize: 26, marginTop: 8, letterSpacing: 0.5 }}>{value}</div>
      <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, marginTop: 4 }}>{sub}</div>
    </div>
  );
}
function BigStat({ label, value, unit, hint, accent }) {
  return (
    <div>
      <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, letterSpacing: 2 }}>{label}</div>
      <div style={{ fontFamily: fontDisplay, fontSize: 56, lineHeight: 1, marginTop: 6, color: accent ? C.accent : C.text, letterSpacing: 0.5 }}>{value}</div>
      <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, marginTop: 6 }}>{unit} · {hint}</div>
    </div>
  );
}
function MacroCard({ name, grams, kcalPer, target, color }) {
  const kcal = grams * kcalPer;
  const pct = Math.round((kcal / target) * 100);
  return (
    <div style={{ border: `1px solid ${C.line}`, background: C.panel, padding: 18 }}>
      <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, letterSpacing: 2 }}>{name.toUpperCase()}</div>
      <div style={{ fontFamily: fontDisplay, fontSize: 36, lineHeight: 1, marginTop: 8, letterSpacing: 0.5 }}>
        {grams}<span style={{ fontSize: 18, color: C.dim }}>g</span>
      </div>
      <div style={{ fontFamily: fontMono, fontSize: 11, color: C.dim, marginTop: 6 }}>{kcal} kcal · {pct}% of total</div>
      <div style={{ height: 4, background: C.line, marginTop: 12, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
function MacroBar({ consumed, target }) {
  const items = [
    { name: 'P', cur: consumed.p, tgt: target.protein, color: C.accent },
    { name: 'C', cur: consumed.c, tgt: target.carbs, color: C.blue },
    { name: 'F', cur: consumed.f, tgt: target.fat, color: C.accent2 },
  ];
  return (
    <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
      {items.map(it => {
        const pct = Math.min(100, (it.cur / it.tgt) * 100 || 0);
        return (
          <div key={it.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: fontMono, fontSize: 11, color: C.dim, marginBottom: 4 }}>
              <span>{it.name}</span><span>{Math.round(it.cur)} / {it.tgt}g</span>
            </div>
            <div style={{ height: 4, background: C.line }}>
              <div style={{ height: '100%', width: `${pct}%`, background: it.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
function MacroProgress({ name, cur, target, color }) {
  const pct = Math.min(100, (cur / target) * 100 || 0);
  return (
    <div style={{ border: `1px solid ${C.line}`, padding: 14, background: C.panel }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: fontMono, fontSize: 10, color: C.dim, letterSpacing: 2 }}>{name.toUpperCase()}</div>
        <div style={{ fontFamily: fontMono, fontSize: 11 }}>{Math.round(cur)} / {target}g</div>
      </div>
      <div style={{ height: 4, background: C.line, marginTop: 10 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
function SelectCard({ active, onClick, children, small }) {
  return (
    <button onClick={onClick} style={{
      textAlign: 'left', cursor: 'pointer', width: '100%',
      background: active ? C.panel2 : 'transparent',
      border: `1px solid ${active ? C.accent : C.line}`,
      padding: small ? '14px 16px' : 20, color: C.text,
    }}>{children}</button>
  );
}
function SegmentedTabs({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          flex: 1, padding: 12, cursor: 'pointer',
          background: value === o.id ? C.accent : 'transparent',
          border: `1px solid ${value === o.id ? C.accent : C.line}`,
          color: value === o.id ? '#000' : C.text,
          fontFamily: fontMono, fontSize: 12, letterSpacing: 2,
        }}>{o.label}</button>
      ))}
    </div>
  );
}
function ChipRow({ value, options, onChange, suffix }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{
          padding: '10px 16px', cursor: 'pointer',
          background: value === o ? C.accent : 'transparent',
          border: `1px solid ${value === o ? C.accent : C.line}`,
          color: value === o ? '#000' : C.text,
          fontFamily: fontMono, fontSize: 13, letterSpacing: 1,
        }}>{o}{suffix}</button>
      ))}
    </div>
  );
}
function Note({ color, icon, children, style }) {
  return (
    <div style={{
      marginTop: 12, padding: '10px 12px',
      border: `1px solid ${color}`, background: C.panel,
      fontSize: 13, color: C.text, display: 'flex', gap: 8, alignItems: 'flex-start',
      ...style,
    }}>
      <span style={{ color, marginTop: 2 }}>{icon}</span>
      <span style={{ lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}
function Modal({ children, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.panel, border: `1px solid ${C.line}`,
        padding: 22, maxWidth: 480, width: '100%', position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12,
          background: 'transparent', border: 0, color: C.dim, cursor: 'pointer',
        }}><X size={18}/></button>
        {children}
      </div>
    </div>
  );
}
