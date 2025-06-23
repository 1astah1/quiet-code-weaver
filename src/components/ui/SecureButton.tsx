
import React from 'react';
import { Button } from '@/components/ui/button';
import { useSecureAction } from '@/hooks/useSecureAction';
import { cn } from '@/lib/utils';

interface SecureButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onSecureClick: () => Promise<void> | void;
  debounceMs?: number;
  cooldownMs?: number;
  maxAttempts?: number;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loadingText?: string;
  blockedText?: string;
}

const SecureButton: React.FC<SecureButtonProps> = ({
  onSecureClick,
  debounceMs = 300,
  cooldownMs = 1000,
  maxAttempts = 3,
  children,
  variant = 'default',
  size = 'default',
  loadingText,
  blockedText,
  className,
  disabled,
  ...props
}) => {
  const { executeAction, isLoading, isBlocked, canExecute } = useSecureAction(
    onSecureClick,
    { debounceMs, cooldownMs, maxAttempts }
  );

  const isDisabled = disabled || isLoading || isBlocked || !canExecute;

  const getButtonText = () => {
    if (isLoading && loadingText) return loadingText;
    if (isBlocked && blockedText) return blockedText;
    return children;
  };

  const getLoadingIndicator = () => {
    if (!isLoading) return null;
    
    return (
      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
    );
  };

  return (
    <Button
      {...props}
      variant={variant}
      size={size}
      disabled={isDisabled}
      onClick={executeAction}
      className={cn(
        'transition-all duration-150',
        isBlocked && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="flex items-center">
        {getLoadingIndicator()}
        {getButtonText()}
      </div>
    </Button>
  );
};

export default SecureButton;
