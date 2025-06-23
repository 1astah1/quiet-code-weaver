
import { useState } from "react";
import { Plus } from "lucide-react";
import { useBannerManagement } from "@/hooks/useBannerManagement";
import { uploadBannerImage } from "@/utils/bannerUpload";
import BannerForm from "./banner/BannerForm";
import BannerCard from "./banner/BannerCard";

const BannerManagement = () => {
  const [uploadingImage, setUploadingImage] = useState(false);
  const {
    banners,
    isLoading,
    editingBanner,
    isCreating,
    handleSave,
    handleEdit,
    handleDelete,
    handleCancel,
    startCreating,
    isSaving
  } = useBannerManagement();

  const handleImageUpload = async (file: File): Promise<string> => {
    setUploadingImage(true);
    try {
      return await uploadBannerImage(file);
    } finally {
      setUploadingImage(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-white">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Управление баннерами</h2>
        <button
          onClick={startCreating}
          disabled={isCreating || isSaving}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить баннер</span>
        </button>
      </div>

      {(isCreating || editingBanner) && (
        <BannerForm
          banner={editingBanner}
          onSave={handleSave}
          onCancel={handleCancel}
          onImageUpload={handleImageUpload}
          uploadingImage={uploadingImage}
          isSaving={isSaving}
        />
      )}

      <div className="grid gap-4">
        {banners?.map((banner) => (
          <BannerCard
            key={banner.id}
            banner={banner}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerManagement;
