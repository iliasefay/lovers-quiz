import { Question, QuestionPack } from "./types";

// All questions in the bank
export const questions: Question[] = [
  // TEXT questions - Cute Basics
  {
    id: "text-1",
    type: "TEXT",
    prompt: "What's my go-to comfort food when I'm tired?",
    maxLen: 100,
  },
  {
    id: "text-2",
    type: "TEXT",
    prompt: "What's the first thing I do when I wake up?",
    maxLen: 100,
  },
  {
    id: "text-3",
    type: "TEXT",
    prompt: "What's my 'order at a cafe' default?",
    maxLen: 100,
  },
  {
    id: "text-4",
    type: "TEXT",
    prompt: "What's a tiny habit of mine you find adorable?",
    maxLen: 100,
  },
  {
    id: "text-5",
    type: "TEXT",
    prompt: "What emoji do I overuse when texting you?",
    maxLen: 50,
  },

  // TEXT questions - Daily Life
  {
    id: "text-6",
    type: "TEXT",
    prompt: "What's my most used app besides messaging?",
    maxLen: 100,
  },
  {
    id: "text-7",
    type: "TEXT",
    prompt: "If I had a completely free day, what would I actually do?",
    maxLen: 150,
  },
  {
    id: "text-8",
    type: "TEXT",
    prompt: "What do I complain about most often?",
    maxLen: 100,
  },
  {
    id: "text-9",
    type: "TEXT",
    prompt: "What's my 'I need cheering up' song or activity?",
    maxLen: 100,
  },
  {
    id: "text-10",
    type: "TEXT",
    prompt: "What's the weirdest thing I do when I'm home alone?",
    maxLen: 100,
  },

  // TEXT questions - Memories
  {
    id: "text-11",
    type: "TEXT",
    prompt: "What was I wearing on our first date?",
    helper: "Take your best guess!",
    maxLen: 100,
  },
  {
    id: "text-12",
    type: "TEXT",
    prompt: "What's my favorite memory of us together?",
    maxLen: 150,
  },
  {
    id: "text-13",
    type: "TEXT",
    prompt: "What's the funniest thing that happened to us?",
    maxLen: 150,
  },
  {
    id: "text-14",
    type: "TEXT",
    prompt: "What song reminds me most of you?",
    maxLen: 100,
  },
  {
    id: "text-15",
    type: "TEXT",
    prompt: "What's the best gift you've ever given me?",
    maxLen: 100,
  },

  // TEXT questions - Preferences
  {
    id: "text-16",
    type: "TEXT",
    prompt: "What's a nickname I secretly like being called?",
    maxLen: 50,
  },
  {
    id: "text-17",
    type: "TEXT",
    prompt: "What's my dream vacation destination with you?",
    maxLen: 100,
  },
  {
    id: "text-18",
    type: "TEXT",
    prompt: "What movie could I watch over and over?",
    maxLen: 100,
  },
  {
    id: "text-19",
    type: "TEXT",
    prompt: "What's my secret talent that not everyone knows about?",
    maxLen: 100,
  },
  {
    id: "text-20",
    type: "TEXT",
    prompt: "What's the one thing I can't live without?",
    maxLen: 100,
  },

  // TEXT questions - Future / Dreams
  {
    id: "text-21",
    type: "TEXT",
    prompt: "If I could teleport right now, where would I go with you?",
    maxLen: 100,
  },
  {
    id: "text-22",
    type: "TEXT",
    prompt: "What's something I've always wanted to try with you?",
    maxLen: 100,
  },
  {
    id: "text-23",
    type: "TEXT",
    prompt: "What would be my dream date night?",
    maxLen: 150,
  },
  {
    id: "text-24",
    type: "TEXT",
    prompt: "What do I want us to do together in the next year?",
    maxLen: 150,
  },
  {
    id: "text-25",
    type: "TEXT",
    prompt: "What's a skill or hobby I want to learn someday?",
    maxLen: 100,
  },

  // THIS_OR_THAT questions
  {
    id: "tot-1",
    type: "THIS_OR_THAT",
    prompt: "I'd rather have...",
    options: ["Movie night 🎬", "Game night 🎮"],
  },
  {
    id: "tot-2",
    type: "THIS_OR_THAT",
    prompt: "I'm more of a...",
    options: ["Planner 🗓️", "Spontaneous 🎲"],
  },
  {
    id: "tot-3",
    type: "THIS_OR_THAT",
    prompt: "I prefer...",
    options: ["Beach 🌊", "Mountains ⛰️"],
  },
  {
    id: "tot-4",
    type: "THIS_OR_THAT",
    prompt: "My messages are usually...",
    options: ["Short and sweet 😶", "Long essays 🧾"],
  },
  {
    id: "tot-5",
    type: "THIS_OR_THAT",
    prompt: "Best date for me:",
    options: ["Cozy at home 🛋️", "Going out ✨"],
  },
  {
    id: "tot-6",
    type: "THIS_OR_THAT",
    prompt: "When upset, I need...",
    options: ["Space to process 🌙", "Immediate comfort 🤗"],
  },
  {
    id: "tot-7",
    type: "THIS_OR_THAT",
    prompt: "I express love more through...",
    options: ["Words 💬", "Actions 💝"],
  },
  {
    id: "tot-8",
    type: "THIS_OR_THAT",
    prompt: "For a snack, I'd pick...",
    options: ["Sweet treats 🍫", "Savory bites 🧀"],
  },
  {
    id: "tot-9",
    type: "THIS_OR_THAT",
    prompt: "On weekends I prefer...",
    options: ["Sleeping in 😴", "Early adventures ☀️"],
  },
  {
    id: "tot-10",
    type: "THIS_OR_THAT",
    prompt: "I'd rather receive...",
    options: ["Surprise gifts 🎁", "Planned experiences 🎫"],
  },

  // MULTI_CHOICE questions
  {
    id: "mc-1",
    type: "MULTI_CHOICE",
    prompt: "Which gift would make me happiest?",
    options: [
      "Something handmade 🎨",
      "A surprise trip 🌍",
      "My favorite food 🍕",
      "Quality time together 💕",
    ],
  },
  {
    id: "mc-2",
    type: "MULTI_CHOICE",
    prompt: "When do I feel most alive?",
    options: ["Morning ☀️", "Afternoon 🌤️", "Evening 🌙", "2am Goblin Mode 👹"],
  },
  {
    id: "mc-3",
    type: "MULTI_CHOICE",
    prompt: "My ideal way to spend a rainy day:",
    options: [
      "Watching movies 📺",
      "Reading a book 📚",
      "Cooking together 👨‍🍳",
      "Taking a nap 😴",
    ],
  },
  {
    id: "mc-4",
    type: "MULTI_CHOICE",
    prompt: "What I value most in our relationship:",
    options: ["Trust 🤝", "Laughter 😄", "Communication 💬", "Adventure 🚀"],
  },
  {
    id: "mc-5",
    type: "MULTI_CHOICE",
    prompt: "My go-to stress relief is:",
    options: [
      "Exercise 🏃",
      "Talking to you 💕",
      "Music & alone time 🎧",
      "Comfort food 🍦",
    ],
  },

  // SCALE questions
  {
    id: "scale-1",
    type: "SCALE",
    prompt: "How much do I like surprises?",
    helper: "1 = hate them, 5 = love them",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    id: "scale-2",
    type: "SCALE",
    prompt: "How social am I feeling this month?",
    helper: "1 = total hermit, 5 = party animal",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    id: "scale-3",
    type: "SCALE",
    prompt: "How adventurous am I with food?",
    helper: "1 = stick to favorites, 5 = try everything",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    id: "scale-4",
    type: "SCALE",
    prompt: "How much do I need personal space?",
    helper: "1 = always together, 5 = need lots of me-time",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    id: "scale-5",
    type: "SCALE",
    prompt: "How romantic am I on a daily basis?",
    helper: "1 = practical love, 5 = hopeless romantic",
    options: ["1", "2", "3", "4", "5"],
  },
];

// Question packs
export const questionPacks: QuestionPack[] = [
  {
    id: "cute-basics",
    name: "Cute Basics",
    emoji: "💕",
    description: "Sweet everyday questions to start with",
    questionIds: [
      "text-1",
      "text-2",
      "text-3",
      "text-4",
      "text-5",
      "tot-1",
      "tot-2",
      "tot-3",
      "mc-1",
      "scale-1",
    ],
  },
  {
    id: "daily-life",
    name: "Daily Life",
    emoji: "☀️",
    description: "How well do you know their routines?",
    questionIds: [
      "text-6",
      "text-7",
      "text-8",
      "text-9",
      "text-10",
      "tot-4",
      "tot-5",
      "tot-6",
      "mc-2",
      "scale-2",
    ],
  },
  {
    id: "memories",
    name: "Memories",
    emoji: "📸",
    description: "Revisit your favorite moments together",
    questionIds: [
      "text-11",
      "text-12",
      "text-13",
      "text-14",
      "text-15",
      "tot-7",
      "tot-8",
      "mc-3",
      "mc-4",
      "scale-3",
    ],
  },
  {
    id: "preferences",
    name: "Preferences",
    emoji: "✨",
    description: "Discover each other's favorites",
    questionIds: [
      "text-16",
      "text-17",
      "text-18",
      "text-19",
      "text-20",
      "tot-9",
      "tot-10",
      "mc-5",
      "scale-4",
      "scale-5",
    ],
  },
  {
    id: "future-dreams",
    name: "Future & Dreams",
    emoji: "🌟",
    description: "Where are you headed together?",
    questionIds: [
      "text-21",
      "text-22",
      "text-23",
      "text-24",
      "text-25",
      "tot-1",
      "tot-3",
      "tot-5",
      "mc-1",
      "scale-1",
    ],
  },
];

// Helper function to get questions by IDs
export function getQuestionsByIds(ids: string[]): Question[] {
  return ids
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is Question => q !== undefined);
}

// Helper function to get a pack by ID
export function getPackById(packId: string): QuestionPack | undefined {
  return questionPacks.find((p) => p.id === packId);
}

// Helper function to get questions for a pack
export function getQuestionsForPack(packId: string): Question[] {
  const pack = getPackById(packId);
  if (!pack) return [];
  return getQuestionsByIds(pack.questionIds);
}

// Helper function to get random questions (mixed from all packs)
export function getRandomQuestions(count: number = 10): Question[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
