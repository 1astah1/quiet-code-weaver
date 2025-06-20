
import { X, ExternalLink, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImprovedSteamConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    username: string;
  };
}

const ImprovedSteamConnectionModal = ({ isOpen, onClose, currentUser }: ImprovedSteamConnectionModalProps) => {
  if (!isOpen) return null;

  const steps = [
    {
      number: 1,
      title: "Откройте Steam в браузере",
      description: "Перейдите на сайт Steam и войдите в свой аккаунт",
      icon: ExternalLink
    },
    {
      number: 2,
      title: "Настройте приватность профиля",
      description: "Убедитесь, что ваш профиль и инвентарь открыты для просмотра",
      icon: Shield
    },
    {
      number: 3,
      title: "Скопируйте Trade URL",
      description: "В настройках Steam найдите Trade URL и скопируйте его",
      icon: CheckCircle
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-2xl border border-slate-700/50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Подключение Steam</h3>
              <p className="text-slate-400">Настройте вывод скинов в ваш инвентарь</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-700/50 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Benefits */}
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold mb-1">Преимущества подключения Steam</h4>
                <p className="text-slate-300 text-sm">Моментальный вывод выигранных скинов прямо в ваш Steam инвентарь без задержек и комиссий.</p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-6">
            <h4 className="text-lg font-semibold text-white mb-4">Инструкция по подключению:</h4>
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h5 className="text-white font-medium mb-1">{step.title}</h5>
                    <p className="text-slate-400 text-sm">{step.description}</p>
                  </div>
                  <Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </div>
              );
            })}
          </div>

          {/* Warning */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-orange-300 text-sm">
                  <strong>Важно:</strong> Мы никогда не запрашиваем ваш пароль от Steam. 
                  Используется только публичный Trade URL для безопасной передачи предметов.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={() => window.open('https://steamcommunity.com/', '_blank')}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Открыть Steam
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Закрыть
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovedSteamConnectionModal;
