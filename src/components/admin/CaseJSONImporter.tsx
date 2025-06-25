import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Upload, FileText, AlertCircle } from "lucide-react";

interface CaseJSONImporterProps {
  onImportSuccess?: () => void;
}

interface JSONCaseItem {
  count: number;
  price: number;
  coef: number;
  id: string;
}

interface JSONCaseData {
  price: number;
  commission?: number;
  algorithm?: string;
  type: string;
  published?: boolean;
  regenerationIsDisabled?: boolean;
  enabled?: boolean;
  items: JSONCaseItem[];
  cuttingPrice?: number;
}

const CaseJSONImporter = ({ onImportSuccess }: CaseJSONImporterProps) => {
  const [jsonInput, setJsonInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const validateJSON = (data: any): data is JSONCaseData => {
    const errors: string[] = [];
    
    if (!data.price || typeof data.price !== 'number') {
      errors.push("Поле 'price' обязательно и должно быть числом");
    }
    
    if (!data.type || typeof data.type !== 'string') {
      errors.push("Поле 'type' обязательно и должно быть строкой");
    }
    
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.push("Поле 'items' обязательно и должно содержать массив предметов");
    } else {
      data.items.forEach((item: any, index: number) => {
        if (!item.id || typeof item.id !== 'string') {
          errors.push(`Предмет ${index + 1}: поле 'id' обязательно и должно быть строкой`);
        }
        if (!item.price || typeof item.price !== 'number') {
          errors.push(`Предмет ${index + 1}: поле 'price' обязательно и должно быть числом`);
        }
        if (!item.count || typeof item.count !== 'number') {
          errors.push(`Предмет ${index + 1}: поле 'count' обязательно и должно быть числом`);
        }
      });
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const calculateProbability = (count: number, totalCount: number): number => {
    return Math.max(0.001, count / totalCount);
  };

  const parseWeaponName = (fullName: string) => {
    const parts = fullName.split(' | ');
    if (parts.length >= 2) {
      const weapon = parts[0].trim();
      const skinParts = parts[1].split(' (');
      const skinName = skinParts[0].trim();
      const condition = skinParts[1] ? skinParts[1].replace(')', '').trim() : 'Factory New';
      
      return {
        weapon_type: weapon,
        name: `${weapon} | ${skinName}`,
        rarity: getRarityFromPrice(parseFloat(parts[1]) || 0)
      };
    }
    
    return {
      weapon_type: 'Unknown',
      name: fullName,
      rarity: 'Consumer Grade'
    };
  };

  const getRarityFromPrice = (price: number): string => {
    if (price >= 10000) return 'Covert';
    if (price >= 5000) return 'Classified';
    if (price >= 1000) return 'Restricted';
    if (price >= 100) return 'Mil-Spec';
    return 'Consumer Grade';
  };

  const importCase = async () => {
    try {
      setIsProcessing(true);
      
      const parsedData: JSONCaseData = JSON.parse(jsonInput);
      
      if (!validateJSON(parsedData)) {
        return;
      }

      // Создаем кейс
      const caseName = `Импортированный кейс ${new Date().toLocaleDateString()}`;
      const { data: newCase, error: caseError } = await supabase
        .from('cases')
        .insert({
          name: caseName,
          description: `Автоматически импортированный кейс. Тип: ${parsedData.type}`,
          price: parsedData.price,
          is_free: parsedData.type === 'free',
          case_type: parsedData.type === 'paid' ? 'premium' : 'classic'
        })
        .select()
        .single();

      if (caseError) throw caseError;

      console.log('Case created:', newCase);

      // Подсчитываем общее количество для расчета вероятностей
      const totalCount = parsedData.items.reduce((sum, item) => sum + item.count, 0);

      // Создаем скины и связываем их с кейсом
      for (const item of parsedData.items) {
        const weaponInfo = parseWeaponName(item.id);
        
        // Проверяем, существует ли уже такой скин
        let { data: existingSkin } = await supabase
          .from('skins')
          .select('id')
          .eq('name', weaponInfo.name)
          .single();

        let skinId: string;

        if (!existingSkin) {
          // Создаем новый скин
          const { data: newSkin, error: skinError } = await supabase
            .from('skins')
            .insert({
              name: weaponInfo.name,
              weapon_type: weaponInfo.weapon_type,
              rarity: weaponInfo.rarity,
              price: item.price,
              probability: calculateProbability(item.count, totalCount)
            })
            .select()
            .single();

          if (skinError) throw skinError;
          skinId = newSkin.id;
        } else {
          skinId = existingSkin.id;
        }

        // Связываем скин с кейсом
        const probability = calculateProbability(item.count, totalCount);
        const { error: caseSkinError } = await supabase
          .from('case_skins')
          .insert({
            case_id: newCase.id,
            skin_id: skinId,
            probability: probability,
            custom_probability: probability,
            never_drop: false
          });

        if (caseSkinError) throw caseSkinError;
      }

      // Обновляем кеши
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['skins'] });
      queryClient.invalidateQueries({ queryKey: ['all_skins'] });
      
      toast({
        title: "Кейс успешно импортирован!",
        description: `Создан кейс "${caseName}" с ${parsedData.items.length} предметами`,
      });

      setJsonInput("");
      setValidationErrors([]);
      onImportSuccess?.();

    } catch (error: any) {
      console.error('Import error:', error);
      if (error instanceof SyntaxError) {
        toast({
          title: "Ошибка JSON",
          description: "Неверный формат JSON. Проверьте синтаксис.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Ошибка импорта",
          description: error.message || "Не удалось импортировать кейс",
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex items-center space-x-2 mb-4">
        <FileText className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-semibold">Импорт кейса из JSON</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-gray-300 text-sm mb-2">
            JSON данные кейса:
          </label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Вставьте JSON данные кейса здесь..."
            className="w-full bg-gray-700 text-white px-3 py-2 rounded min-h-[300px] font-mono text-sm"
            disabled={isProcessing}
          />
        </div>

        {validationErrors.length > 0 && (
          <div className="bg-red-900/50 border border-red-700 rounded p-3">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-medium">Ошибки валидации:</span>
            </div>
            <ul className="text-red-300 text-sm space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={importCase}
            disabled={!jsonInput.trim() || isProcessing}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>{isProcessing ? "Импортируем..." : "Импортировать кейс"}</span>
          </button>

          <button
            onClick={() => {
              setJsonInput("");
              setValidationErrors([]);
            }}
            disabled={isProcessing}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            Очистить
          </button>
        </div>

        <div className="bg-gray-700/50 p-4 rounded">
          <h4 className="text-gray-300 font-medium mb-2">Формат JSON:</h4>
          <div className="text-gray-400 text-sm space-y-1">
            <p>• <code className="text-blue-300">price</code> - цена кейса (обязательно)</p>
            <p>• <code className="text-blue-300">type</code> - тип кейса: "paid" или "free" (обязательно)</p>
            <p>• <code className="text-blue-300">items</code> - массив предметов (обязательно)</p>
            <p className="ml-4">◦ <code className="text-green-300">id</code> - название предмета (обязательно)</p>
            <p className="ml-4">◦ <code className="text-green-300">price</code> - цена предмета (обязательно)</p>
            <p className="ml-4">◦ <code className="text-green-300">count</code> - количество для расчета вероятности (обязательно)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseJSONImporter;
