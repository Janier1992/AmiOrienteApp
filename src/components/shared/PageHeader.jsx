
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PageHeader = ({ 
    title, 
    description, 
    showBack = false, 
    action, 
    className 
}) => {
    const navigate = useNavigate();

    return (
        <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6", className)}>
            <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                    {showBack && (
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8 -ml-2">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                </div>
                {description && (
                    <p className="text-muted-foreground">{description}</p>
                )}
            </div>
            {action && (
                <div className="flex items-center gap-2">
                    {action}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
