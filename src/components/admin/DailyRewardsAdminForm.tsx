
import React from 'react';
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DailyReward } from "@/utils/supabaseTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import 'react/jsx-runtime';

interface Props {
  initial?: Partial<DailyReward>;
  onSave: () => void;
  onCancel: () => void;
  existingDays: number[];
}

const rewardTypes = [
  { value: "coins", label: "Монеты" },
  { value: "case", label: "Кейс" },
  { value: "skin", label: "Скин" },
];

const DailyRewardsAdminForm = ({ initial = {}, onSave, onCancel, existingDays }: Props) => {
  const [form, setForm] = useState<Partial<DailyReward>>({
    day_number: initial.day_number || undefined,
    reward_type: initial.reward_type || "coins",
    reward_coins: initial.reward_coins || 0,
    is_active: initial.is_active ?? true,
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!form.day_number || form.day_number < 1 || form.day_number > 30) {
      setError("День должен быть от 1 до 30");
      return false;
    }
    if (existingDays.includes(form.day_number) && form.day_number !== initial.day_number) {
      setError("Награда для этого дня уже существует");
      return false;
    }
    if (!rewardTypes.some(rt => rt.value === form.reward_type)) {
      setError("Некорректный тип награды");
      return false;
    }
    if (form.reward_type === "coins" && (!form.reward_coins || form.reward_coins < 1)) {
      setError("Количество монет должно быть больше 0");
      return false;
    }
    setError("");
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
      const { name, value, type } = e.target;
      const checked = (e.target instanceof HTMLInputElement) ? e.target.checked : undefined;
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : name === "day_number" || name === "reward_coins" ? Number(value) : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (!form.day_number || !form.reward_type || (form.reward_type === 'coins' && !form.reward_coins)) {
        setError('Пожалуйста, заполните все обязательные поля');
        setLoading(false);
        return;
      }
      
      // Создаем объект с обязательными полями
      const updateData = {
        day_number: form.day_number,
        reward_type: form.reward_type,
        reward_coins: form.reward_coins || 0,
        is_active: form.is_active ?? true
      };
      
      if (initial.id) {
        // update
        await supabase.from("daily_rewards").update(updateData).eq("id", initial.id);
      } else {
        // create
        await supabase.from("daily_rewards").insert(updateData);
      }
      onSave();
    } catch (e: any) {
      setError(e.message || "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-800 rounded-lg border border-gray-700 max-w-md mx-auto">
      <div>
        <label className="block text-sm text-gray-300 mb-1">День (1-30)</label>
        <Input
          name="day_number"
          type="number"
          min={1}
          max={30}
          value={form.day_number ?? ""}
          onChange={handleChange}
          disabled={!!initial.id}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-300 mb-1">Тип награды</label>
        <select
          name="reward_type"
          value={form.reward_type}
          onChange={handleChange}
          className="w-full rounded border-gray-600 bg-gray-900 text-gray-100 p-2"
        >
          {rewardTypes.map(rt => (
            <option key={rt.value} value={rt.value}>{rt.label}</option>
          ))}
        </select>
      </div>
      {form.reward_type === "coins" && (
        <div>
          <label className="block text-sm text-gray-300 mb-1">Количество монет</label>
          <Input
            name="reward_coins"
            type="number"
            min={1}
            value={form.reward_coins ?? ""}
            onChange={handleChange}
          />
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_active"
          checked={!!form.is_active}
          onChange={handleChange}
          id="is_active"
        />
        <label htmlFor="is_active" className="text-gray-300 text-sm">Активна</label>
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div className="flex gap-2 mt-2">
        <Button type="submit" disabled={loading}>{initial.id ? "Сохранить" : "Добавить"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Отмена</Button>
      </div>
    </form>
  );
};

export default DailyRewardsAdminForm; 
