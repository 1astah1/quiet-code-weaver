import { Button } from "@/components/ui/button";
import { TableName } from "@/types/admin";

interface AdminTableSelectorProps {
  activeTable: TableName;
  onTableChange: (table: TableName) => void;
}

const AdminTableSelector = ({ activeTable, onTableChange }: AdminTableSelectorProps) => {
  const tables: { name: TableName; label: string; icon: string }[] = [
    { name: "cases", label: "Кейсы", icon: "📦" },
    { name: "skins", label: "Скины", icon: "🎨" },
    { name: "users", label: "Пользователи", icon: "👥" },
    { name: "banners", label: "Баннеры", icon: "🖼️" },
    { name: "tasks", label: "Задания", icon: "📋" },
    { name: "watermelon_fruits", label: "Фрукты игры", icon: "🍉" },
    { name: "promo_codes", label: "Промокоды", icon: "🎫" },
    { name: "coin_rewards", label: "Монетные награды", icon: "🪙" },
    { name: "daily_rewards", label: "Ежедневные награды", icon: "🎁" },
    { name: "faq_items", label: "FAQ", icon: "ℹ️" },
    // ДОБАВЛЕНО: Новая опция для управления подозрительной активностью
    { name: "suspicious_activities", label: "Подозрительная активность", icon: "🚨" }
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        {tables.map((table) => (
          <Button
            key={table.name}
            variant={activeTable === table.name ? "default" : "outline"}
            onClick={() => onTableChange(table.name)}
            className="text-xs sm:text-sm"
          >
            <span className="mr-2">{table.icon}</span>
            {table.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default AdminTableSelector;
