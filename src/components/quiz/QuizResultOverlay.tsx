
interface QuizResultOverlayProps {
  showResult: boolean;
  lastAnswerCorrect: boolean | null;
  livesLeft: number;
}

const QuizResultOverlay = ({ showResult, lastAnswerCorrect, livesLeft }: QuizResultOverlayProps) => {
  if (!showResult) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl p-8 text-center">
        <div className={`text-6xl mb-4 ${lastAnswerCorrect ? 'text-green-400' : 'text-red-400'}`}>
          {lastAnswerCorrect ? '✓' : '✗'}
        </div>
        <h3 className={`text-2xl font-bold mb-2 ${lastAnswerCorrect ? 'text-green-400' : 'text-red-400'}`}>
          {lastAnswerCorrect ? 'Правильно!' : 'Неправильно!'}
        </h3>
        {!lastAnswerCorrect && (
          <p className="text-gray-300">
            Жизней осталось: {livesLeft}
          </p>
        )}
      </div>
    </div>
  );
};

export default QuizResultOverlay;
