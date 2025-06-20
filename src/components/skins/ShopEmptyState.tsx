
import { Package } from "lucide-react";

const ShopEmptyState = () => {
  return (
    <div className="text-center py-12">
      <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
      <p className="text-slate-400">Скины не найдены</p>
    </div>
  );
};

export default ShopEmptyState;
