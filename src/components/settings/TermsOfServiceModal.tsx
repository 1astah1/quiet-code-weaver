
import { X } from "lucide-react";

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsOfServiceModal = ({ isOpen, onClose }: TermsOfServiceModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Условия использования</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] text-gray-300 space-y-4">
          <section>
            <h3 className="text-lg font-semibold text-white mb-2">1. Принятие условий</h3>
            <p className="text-sm leading-relaxed">
              Используя наше приложение для открытия кейсов CS:GO, вы соглашаетесь с данными условиями использования. 
              Если вы не согласны с какими-либо из этих условий, пожалуйста, не используйте наше приложение.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">2. Описание сервиса</h3>
            <p className="text-sm leading-relaxed">
              Наше приложение предоставляет развлекательную симуляцию открытия кейсов CS:GO с возможностью получения 
              виртуальных предметов. Все предметы имеют исключительно развлекательную ценность и не могут быть обменены 
              на реальные деньги или предметы в Steam.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">3. Возрастные ограничения</h3>
            <p className="text-sm leading-relaxed">
              Для использования приложения вам должно быть не менее 13 лет. Пользователи младше 18 лет должны получить 
              согласие родителей или законных представителей перед использованием приложения.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">4. Виртуальная валюта</h3>
            <p className="text-sm leading-relaxed">
              Монеты в приложении являются виртуальной валютой, предназначенной исключительно для развлечения. 
              Они не имеют денежной стоимости и не могут быть обменены на реальные деньги или товары.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">5. Поведение пользователей</h3>
            <p className="text-sm leading-relaxed">
              Запрещается использовать приложение для незаконной деятельности, попыток взлома, создания фейковых аккаунтов 
              или любых других действий, нарушающих нормальную работу сервиса.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">6. Интеллектуальная собственность</h3>
            <p className="text-sm leading-relaxed">
              Все материалы, изображения и контент в приложении защищены авторским правом. CS:GO является торговой маркой 
              Valve Corporation. Мы не аффилированы с Valve Corporation или Steam.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">7. Ограничение ответственности</h3>
            <p className="text-sm leading-relaxed">
              Приложение предоставляется "как есть". Мы не несем ответственности за любые убытки, возникшие в результате 
              использования приложения. Использование осуществляется на ваш собственный риск.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">8. Изменения условий</h3>
            <p className="text-sm leading-relaxed">
              Мы оставляем за собой право изменять данные условия в любое время. Уведомления об изменениях будут 
              опубликованы в приложении. Продолжение использования после изменений означает согласие с новыми условиями.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">9. Контактная информация</h3>
            <p className="text-sm leading-relaxed">
              По вопросам, касающимся данных условий использования, вы можете связаться с нами через раздел поддержки 
              в приложении.
            </p>
          </section>

          <div className="pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400">
              Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServiceModal;
