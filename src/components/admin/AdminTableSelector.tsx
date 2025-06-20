
import { Button } from "@/components/ui/button";
import { TableName } from "@/types/admin";

interface AdminTableSelectorProps {
  activeTable: TableName;
  onTableChange: (table: TableName) => void;
}

const AdminTableSelector = ({ activeTable, onTableChange }: AdminTableSelectorProps) => {
  const tables: { key: TableName; label: string }[] = [
    { key: "banners", label: "Банеры" },
    { key: "cases", label: "Кейсы" },
    { key: "skins", label: "Скины" },
    { key: "users", label: "Пользователи" },
    { key: "tasks", label: "Задания" },
    { key: "quiz_questions", label: "Вопросы викторины" },
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        {tables.map((table) => (
          <Button
            key={table.key}
            onClick={() => onTableChange(table.key)}
            variant={activeTable === table.key ? "default" : "outline"}
            className={
              activeTable === table.key
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "border-slate-600 text-slate-300 hover:bg-slate-800"
            }
          >
            {table.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default AdminTableSelector;
