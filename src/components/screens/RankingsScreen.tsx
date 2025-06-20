
import RankingsTab from "@/components/rankings/RankingsTab";

interface RankingsScreenProps {
  currentUser?: {
    id: string;
    username: string;
  };
}

const RankingsScreen = ({ currentUser }: RankingsScreenProps) => {
  return (
    <div className="container mx-auto px-4 py-6">
      <RankingsTab currentUser={currentUser} />
    </div>
  );
};

export default RankingsScreen;
