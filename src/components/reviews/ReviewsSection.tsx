
import { ExternalLink, Flame } from "lucide-react";
import { useReviews, useCompleteReview } from "@/hooks/useReviews";

interface ReviewsSectionProps {
  currentUser: {
    id: string;
    username: string;
    coins: number;
  };
  onCoinsUpdate: (newCoins: number) => void;
}

const ReviewsSection = ({ currentUser, onCoinsUpdate }: ReviewsSectionProps) => {
  const { data: reviews, isLoading } = useReviews();
  const completeMutation = useCompleteReview();

  const handleCompleteReview = async (reviewId: string) => {
    try {
      const result = await completeMutation.mutateAsync({
        reviewId,
        userId: currentUser.id,
        currentCoins: currentUser.coins
      });
      onCoinsUpdate(result.newCoins);
    } catch (error) {
      console.error('Error completing review:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Отзывы и задания</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800/60 rounded-lg p-4 animate-pulse">
              <div className="h-16 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-white mb-4">Отзывы и задания</h2>
      <div className="space-y-3">
        {reviews?.slice(0, 6).map((review) => (
          <div
            key={review.id}
            className={`rounded-lg p-4 border transition-all ${
              review.is_hot
                ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/50"
                : "bg-gray-800/60 border-gray-700/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className="text-2xl">{review.platform_logo}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-white font-semibold">{review.platform}</h3>
                    {review.is_hot && (
                      <div className="flex items-center space-x-1 text-orange-400">
                        <Flame className="w-4 h-4" />
                        <span className="text-xs font-bold">HOT</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">{review.title}</p>
                  {review.description && (
                    <p className="text-gray-500 text-xs mt-1">{review.description}</p>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-yellow-400 font-bold text-lg mb-2">
                  +{review.reward_coins?.toLocaleString() || 0}
                </div>
                <button
                  onClick={() => handleCompleteReview(review.id)}
                  disabled={completeMutation.isPending || review.is_completed}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    review.is_completed
                      ? "bg-green-600 text-white cursor-not-allowed"
                      : "bg-orange-500 hover:bg-orange-600 text-white"
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{review.is_completed ? "Выполнено" : "Выполнить"}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsSection;
