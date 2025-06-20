
import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  color: "blue" | "yellow" | "green" | "purple";
}

const StatCard = ({ icon, label, value, color }: StatCardProps) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    yellow: "from-yellow-500 to-yellow-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600"
  };

  return (
    <div className={`bg-gradient-to-r ${colorClasses[color]} p-3 rounded-lg text-white text-center`}>
      <div className="flex justify-center mb-1">
        {icon}
      </div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs opacity-90">{label}</div>
    </div>
  );
};

export default StatCard;
