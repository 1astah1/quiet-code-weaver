
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const ReferralHandler = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (code) {
      console.log('🔗 Сохраняем реферальный код:', code);
      
      // Сохраняем реферальный код в localStorage до регистрации
      localStorage.setItem('pending_referral_code', code);
      
      toast({
        title: "Реферальный код активирован!",
        description: "При регистрации вы получите бонус за приглашение",
        duration: 5000,
      });
      
      // Перенаправляем на главную страницу
      navigate('/', { replace: true });
    }
  }, [code, navigate, toast]);

  return null;
};

export default ReferralHandler;
