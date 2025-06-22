
import { X } from "lucide-react";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal = ({ isOpen, onClose }: PrivacyPolicyModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Политика конфиденциальности</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] text-gray-300 space-y-4">
          <section>
            <h3 className="text-lg font-semibold text-white mb-2">1. Сбор информации</h3>
            <p className="text-sm leading-relaxed mb-2">
              Мы собираем следующие типы информации:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              <li>Информацию учетной записи (имя пользователя, email)</li>
              <li>Игровую статистику (монеты, предметы, достижения)</li>
              <li>Техническую информацию (IP-адрес, тип устройства, браузер)</li>
              <li>Данные об использовании приложения</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">2. Использование информации</h3>
            <p className="text-sm leading-relaxed mb-2">
              Собранная информация используется для:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              <li>Предоставления и улучшения наших услуг</li>
              <li>Персонализации пользовательского опыта</li>
              <li>Обеспечения безопасности и предотвращения мошенничества</li>
              <li>Анализа использования приложения</li>
              <li>Связи с пользователями по важным вопросам</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">3. Защита данных</h3>
            <p className="text-sm leading-relaxed">
              Мы применяем современные технологии шифрования и безопасности для защиты ваших данных. 
              Все персональные данные хранятся на защищенных серверах с ограниченным доступом.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">4. Передача данных третьим лицам</h3>
            <p className="text-sm leading-relaxed">
              Мы не продаем и не передаем ваши персональные данные третьим лицам без вашего согласия, 
              за исключением случаев, предусмотренных законом или необходимых для работы приложения 
              (например, платежные системы, аналитические сервисы).
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">5. Файлы cookie</h3>
            <p className="text-sm leading-relaxed">
              Мы используем файлы cookie для улучшения функциональности приложения, запоминания ваших предпочтений 
              и анализа трафика. Вы можете отключить cookie в настройках браузера, но это может повлиять на работу приложения.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">6. Права пользователей</h3>
            <p className="text-sm leading-relaxed mb-2">
              Вы имеете право:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              <li>Запросить доступ к своим персональным данным</li>
              <li>Требовать исправления неточных данных</li>
              <li>Запросить удаление своих данных</li>
              <li>Отозвать согласие на обработку данных</li>
              <li>Подать жалобу в надзорный орган</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">7. Хранение данных</h3>
            <p className="text-sm leading-relaxed">
              Мы храним ваши данные только в течение времени, необходимого для достижения целей, 
              для которых они были собраны, или в соответствии с требованиями законодательства.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">8. Дети и конфиденциальность</h3>
            <p className="text-sm leading-relaxed">
              Мы не собираем намеренно персональные данные детей младше 13 лет. Если вы считаете, 
              что мы случайно собрали такую информацию, пожалуйста, свяжитесь с нами для ее удаления.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">9. Изменения политики</h3>
            <p className="text-sm leading-relaxed">
              Мы можем обновлять данную политику конфиденциальности. О существенных изменениях мы уведомим 
              пользователей через приложение или по электронной почте.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">10. Контакты</h3>
            <p className="text-sm leading-relaxed">
              По вопросам конфиденциальности и защиты данных вы можете связаться с нами через 
              раздел поддержки в приложении или по электронной почте.
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

export default PrivacyPolicyModal;
