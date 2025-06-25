
export interface QuizScreenProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
    quiz_lives: number;
    quiz_streak: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
  onBack: () => void;
  onLivesUpdate: (newLives: number) => void;
  onStreakUpdate: (newStreak: number) => void;
}

export interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  image_url?: string;
}
