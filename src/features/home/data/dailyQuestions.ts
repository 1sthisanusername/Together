export interface DailyQuestion {
  id: string;
  text: string;
  category: 'memories' | 'dreams' | 'deep' | 'fun' | 'love';
  emoji: string;
}

export const DAILY_QUESTIONS: DailyQuestion[] = [
  {
    id: 'q1',
    text: 'What was the exact moment you realized you had real feelings for me?',
    category: 'memories',
    emoji: '💭',
  },
  {
    id: 'q2',
    text: 'If we could teleport to anywhere in the world right now for 1 hour, where would we go?',
    category: 'dreams',
    emoji: '✈️',
  },
  {
    id: 'q3',
    text: 'What is your favorite little habit or quirk of mine that always makes you smile?',
    category: 'love',
    emoji: '🥰',
  },
  {
    id: 'q4',
    text: 'What song always makes you think of us when you hear it on your playlist?',
    category: 'memories',
    emoji: '🎵',
  },
  {
    id: 'q5',
    text: 'If we were living together tomorrow morning, who would make the coffee and who would choose the music?',
    category: 'fun',
    emoji: '☕',
  },
  {
    id: 'q6',
    text: 'What is one dream or personal goal you want us to accomplish together in the next 3 years?',
    category: 'dreams',
    emoji: '🌟',
  },
  {
    id: 'q7',
    text: 'What is something you learned about yourself since we started our relationship?',
    category: 'deep',
    emoji: '🌱',
  },
  {
    id: 'q8',
    text: 'What is your absolute favorite outfit or photo of me?',
    category: 'love',
    emoji: '📸',
  },
  {
    id: 'q9',
    text: 'When you are having a tough day, what is the best thing I can say or do to comfort you?',
    category: 'deep',
    emoji: '🫂',
  },
  {
    id: 'q10',
    text: 'What is the funniest or most awkward memory from when we first met or started talking?',
    category: 'fun',
    emoji: '😂',
  },
  {
    id: 'q11',
    text: 'If we could adopt any pet right now, what would it be and what would we name it?',
    category: 'fun',
    emoji: '🐾',
  },
  {
    id: 'q12',
    text: 'What is one thing about our future reunion that you are most excited about?',
    category: 'love',
    emoji: '💌',
  },
  {
    id: 'q13',
    text: 'What is your favorite meal or treat we have ever shared together?',
    category: 'memories',
    emoji: '🍕',
  },
  {
    id: 'q14',
    text: 'What is a small compliment I gave you that stuck with you for days?',
    category: 'love',
    emoji: '💖',
  },
  {
    id: 'q15',
    text: 'If our love story was turned into a movie, what genre would it be and what would be the title?',
    category: 'fun',
    emoji: '🎬',
  },
];

/**
 * Returns a deterministic daily question based on the calendar date (YYYY-MM-DD).
 * Ensures both partners always receive the exact same question on any given day.
 */
export function getDailyQuestionForDate(dateStr: string): DailyQuestion {
  // Simple deterministic hash from date string
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_QUESTIONS.length;
  return DAILY_QUESTIONS[index];
}

