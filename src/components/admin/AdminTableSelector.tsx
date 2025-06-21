
import { TableName } from "@/types/admin";

interface AdminTableSelectorProps {
  activeTable: TableName;
  onTableChange: (table: TableName) => void;
}

const AdminTableSelector = ({ activeTable, onTableChange }: AdminTableSelectorProps) => {
  const tables: { key: TableName; label: string }[] = [
    { key: "cases", label: "Кейсы" },
    { key: "skins", label: "Скины" },
    { key: "users", label: "Пользователи" },
    { key: "tasks", label: "Задания" },
    { key: "quiz_questions", label: "Вопросы викторины" },
    { key: "banners", label: "Баннеры" },
    { key: "daily_rewards", label: "Ежедневные награды" },
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        {tables.map((table) => (
          <button
            key={table.key}
            onClick={() => onTableChange(table.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTable === table.key
                ? "bg-orange-500 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {table.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminTableSelector;
