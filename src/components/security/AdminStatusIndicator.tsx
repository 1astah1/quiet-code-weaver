
import React from 'react';
import { Crown, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminStatusIndicatorProps {
  isAdmin: boolean;
  username?: string;
}

const AdminStatusIndicator: React.FC<AdminStatusIndicatorProps> = ({ isAdmin, username }) => {
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-50 max-w-xs">
      <Alert className="border-yellow-500 bg-yellow-50">
        <Crown className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="flex items-center space-x-2">
            <Shield className="h-3 w-3" />
            <span className="text-xs font-medium">
              Администратор: {username}
            </span>
          </div>
          <span className="block text-xs mt-1 opacity-70">
            Система безопасности отключена
          </span>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default AdminStatusIndicator;
