
import React from 'react';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

// Компонент отображения статуса безопасности
const SecurityStatus: React.FC = () => {
  const { isSecurityVerified, securityWarnings } = useSecureAuth();

  if (isSecurityVerified && securityWarnings.length === 0) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Alert className="border-green-500 bg-green-50 max-w-sm">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">
            Безопасность проверена
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (securityWarnings.length > 0) {
    return (
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
        {securityWarnings.map((warning, index) => (
          <Alert key={index} className="border-orange-500 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <AlertDescription className="text-orange-700">
              {warning}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    );
  }

  return null;
};

export default SecurityStatus;
