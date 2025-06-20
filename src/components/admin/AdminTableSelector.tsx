
import { TableName } from "@/types/admin";

interface AdminTableSelectorProps {
  activeTable: TableName;
  onTableChange: (table: TableName) => void;
}

const AdminTableSelector = ({ activeTable, onTableChange }: AdminTableSelectorProps) => {
  const tables: TableName[] = ['cases', 'skins', 'users', 'tasks', 'quiz_questions'];

  return (
    <div className="mb-6">
      <div className="flex space-x-2 bg-gray-800 p-2 rounded-lg">
        {tables.map(table => (
          <button
            key={table}
            onClick={() => onTableChange(table)}
            className={`px-4 py-2 rounded ${
              activeTable === table
                ? 'bg-orange-500 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            {table}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminTableSelector;
