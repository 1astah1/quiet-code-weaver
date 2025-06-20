
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order_index: number;
}

const FAQModal = ({ isOpen, onClose }: FAQModalProps) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const { data: faqItems, isLoading } = useQuery({
    queryKey: ['faq-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      
      if (error) throw error;
      return data as FAQItem[];
    },
    enabled: isOpen
  });

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-2xl border border-slate-700/50 shadow-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Поддержка</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-700/50 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <p className="text-slate-300 mb-6">
            Часто задаваемые вопросы и ответы
          </p>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-slate-800/50 rounded-lg h-12 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {faqItems?.map((item) => (
                <div key={item.id} className="bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <button
                    onClick={() => toggleExpanded(item.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/30 transition-colors"
                  >
                    <span className="text-white font-medium">{item.question}</span>
                    {expandedItems.includes(item.id) ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  {expandedItems.includes(item.id) && (
                    <div className="px-4 pb-4">
                      <div className="text-slate-300 leading-relaxed whitespace-pre-line">
                        {item.answer}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {(!faqItems || faqItems.length === 0) && (
                <div className="text-center py-8">
                  <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">FAQ пока не добавлены</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FAQModal;
