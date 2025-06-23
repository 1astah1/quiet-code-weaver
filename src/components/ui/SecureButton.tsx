
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface SecureButtonProps extends React.ComponentProps<typeof Button> {
  onSecureClick?: () => Promise<void> | void;
  cooldownMs?: number;
  children: React.ReactNode;
}

const SecureButton = ({ 
  onSecureClick, 
  cooldownMs = 1000, 
  disabled, 
  children, 
  ...props 
}: SecureButtonProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    if (isProcessing || disabled) return;
    
    setIsProcessing(true);
    
    try {
      if (onSecureClick) {
        await onSecureClick();
      }
    } catch (error) {
      console.error('Secure button error:', error);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, cooldownMs);
    }
  };

  return (
    <Button
      {...props}
      disabled={disabled || isProcessing}
      onClick={handleClick}
    >
      {isProcessing ? 'Обработка...' : children}
    </Button>
  );
};

export default SecureButton;
