
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const LoadingSpinner = ({ className, size = "default", text }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-6 rounded-lg", className)}>
      <Loader2 className={cn("animate-spin text-primary mb-3", sizeClasses[size])} />
      {text && <p className="text-sm font-medium text-muted-foreground animate-pulse">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
