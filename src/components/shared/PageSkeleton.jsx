
import React from 'react';
import { Loader2 } from 'lucide-react';

// Replaced the heavy "card/shadow" skeleton with a minimal spinner
// This prevents the visual "glitch" or "ghost elements" during fast navigation
const PageSkeleton = () => {
  return (
    <div className="flex items-center justify-center min-h-[50vh] w-full animate-fade-in">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Cargando...</span>
      </div>
    </div>
  );
};

export default PageSkeleton;
