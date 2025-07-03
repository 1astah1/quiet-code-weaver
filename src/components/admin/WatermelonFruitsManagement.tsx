import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WatermelonFruit {
  level: number;
  name: string;
  radius: number;
  color: string;
  image_url?: string;
}

const WatermelonFruitsManagement: React.FC = () => {
  const [fruits, setFruits] = useState<WatermelonFruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFruit, setEditingFruit] = useState<WatermelonFruit | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadFruits();
  }, []);

  const loadFruits = async () => {
    try {
      const { data, error } = await supabase.rpc('get_watermelon_fruits');
      if (error) throw error;
      setFruits(data || []);
    } catch (error) {
      console.error('Error loading fruits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, level: number) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `watermelon-fruit-${level}.${fileExt}`;
      const filePath = `watermelon-fruits/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lovable-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('lovable-uploads')
        .getPublicUrl(filePath);

      await updateFruit(level, { image_url: publicUrl });
      await loadFruits();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Ошибка загрузки изображения');
    } finally {
      setUploading(false);
    }
  };

  const updateFruit = async (level: number, updates: Partial<WatermelonFruit>) => {
    try {
      const { error } = await supabase.rpc('update_watermelon_fruit', {
        p_level: level,
        p_name: updates.name,
        p_radius: updates.radius,
        p_color: updates.color,
        p_image_url: updates.image_url
      });

      if (error) throw error;
      await loadFruits();
    } catch (error) {
      console.error('Error updating fruit:', error);
      alert('Ошибка обновления фрукта');
    }
  };

  if (loading) {
    return <div>Загрузка фруктов...</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>Управление фруктами Watermelon Game</h2>
      
      <div style={{ display: 'grid', gap: 16 }}>
        {fruits.map((fruit) => (
          <div key={fruit.level} style={{ 
            border: '1px solid #ddd', 
            borderRadius: 8, 
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}>
            {/* Предпросмотр фрукта */}
            <div style={{
              width: fruit.radius * 2,
              height: fruit.radius * 2,
              borderRadius: '50%',
              backgroundColor: fruit.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: 'white',
              fontWeight: 'bold',
              border: '2px solid #333'
            }}>
              {fruit.level}
            </div>

            {/* Информация о фрукте */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                Уровень {fruit.level}: {fruit.name}
              </div>
              <div style={{ fontSize: 14, color: '#666' }}>
                Радиус: {fruit.radius}px | Цвет: {fruit.color}
              </div>
              {fruit.image_url && (
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  Изображение: {fruit.image_url.split('/').pop()}
                </div>
              )}
            </div>

            {/* Кнопки редактирования */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, fruit.level);
                }}
                style={{ display: 'none' }}
                id={`upload-${fruit.level}`}
              />
              <label htmlFor={`upload-${fruit.level}`} style={{
                padding: '4px 8px',
                background: '#2196f3',
                color: 'white',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12
              }}>
                {uploading ? 'Загрузка...' : 'Изменить картинку'}
              </label>

              <button
                onClick={() => setEditingFruit(fruit)}
                style={{
                  padding: '4px 8px',
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                Редактировать
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно редактирования */}
      {editingFruit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 8,
            minWidth: 300
          }}>
            <h3>Редактировать фрукт: {editingFruit.name}</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label>Название:</label>
              <input
                type="text"
                value={editingFruit.name}
                onChange={(e) => setEditingFruit({...editingFruit, name: e.target.value})}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>Радиус (px):</label>
              <input
                type="number"
                value={editingFruit.radius}
                onChange={(e) => setEditingFruit({...editingFruit, radius: parseInt(e.target.value)})}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>Цвет:</label>
              <input
                type="color"
                value={editingFruit.color}
                onChange={(e) => setEditingFruit({...editingFruit, color: e.target.value})}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingFruit(null)}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  await updateFruit(editingFruit.level, editingFruit);
                  setEditingFruit(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatermelonFruitsManagement; 