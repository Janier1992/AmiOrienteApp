import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const BarChart = ({ data, categories, index, colors, valueFormatter, className }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  if (!data || data.length === 0) return <div className="h-[300px] flex items-center justify-center text-gray-400">Sin datos</div>;

  const maxValue = Math.max(...data.map(item => item[categories[0]])) || 1;

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="min-w-[300px] h-full flex items-end gap-2 p-4 pt-12 relative">
         {/* Background Grid */}
         <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full border-t border-gray-400 h-0" />
            ))}
         </div>

        {data.map((item, i) => {
          const heightPercentage = (item[categories[0]] / maxValue) * 100;
          return (
            <div 
                key={i} 
                className="flex-1 flex flex-col justify-end group relative h-full"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
            >
              <div 
                className={cn(
                    "w-full rounded-t-sm relative transition-all duration-300",
                    hoveredIndex === i ? "bg-primary opacity-100" : "bg-primary/70"
                )}
                style={{ height: `${heightPercentage}%` }}
              />
               
              <AnimatePresence>
                {hoveredIndex === i && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none"
                    >
                        <div className="bg-popover text-popover-foreground text-xs rounded-md shadow-md p-2 border whitespace-nowrap">
                            <p className="font-semibold">{item[index]}</p>
                            <p>{valueFormatter ? valueFormatter(item[categories[0]]) : item[categories[0]]}</p>
                        </div>
                    </motion.div>
                )}
              </AnimatePresence>

              <p className="text-[10px] text-center mt-2 text-muted-foreground truncate w-full">{item[index]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const LineChart = ({ data, categories, index, valueFormatter, className }) => {
    const [hoveredPoint, setHoveredPoint] = useState(null);

    if (!data || data.length === 0) return <div className="h-[300px] flex items-center justify-center text-gray-400">Sin datos</div>;

    const maxValue = Math.max(...data.map(item => item[categories[0]])) || 1;
    
    // Calculate points coordinates
    const points = data.map((item, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((item[categories[0]] / maxValue) * 100);
        return { x, y, data: item };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    // Create fill area path
    const areaPathD = `${pathD} L 100 100 L 0 100 Z`;

    return (
        <div className={cn("w-full h-full relative select-none", className)}>
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 px-4 pb-6 pt-4">
                 {[100, 75, 50, 25, 0].map((percent, i) => (
                     <div key={i} className="w-full border-t border-dashed border-border h-0 relative">
                        <span className="absolute -top-3 -left-0 text-[10px] text-muted-foreground bg-background pr-1">
                            {valueFormatter ? valueFormatter((maxValue * percent) / 100) : (maxValue * percent) / 100}
                        </span>
                     </div>
                 ))}
            </div>

            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible z-10 relative">
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area Fill */}
                <path d={areaPathD} fill="url(#gradient)" stroke="none" />

                {/* Line Path */}
                <path
                    d={pathD}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                    className="drop-shadow-sm"
                />
                
                {/* Interactive Points */}
                {points.map((p, i) => (
                     <g key={i}>
                        {/* Invisible large hit area for better UX */}
                        <circle 
                            cx={p.x} cy={p.y} r="4" 
                            fill="transparent" 
                            className="cursor-pointer hover:r-6 transition-all"
                            onMouseEnter={() => setHoveredPoint({ ...p, index: i })}
                            onMouseLeave={() => setHoveredPoint(null)}
                        />
                        {/* Visible Dot */}
                        <circle 
                            cx={p.x} cy={p.y} r="1.5" 
                            className={cn(
                                "fill-background stroke-[0.5] transition-all duration-200",
                                hoveredPoint?.index === i ? "stroke-primary r-2 fill-primary" : "stroke-primary"
                            )}
                            pointerEvents="none"
                        />
                     </g>
                ))}
            </svg>

            {/* Tooltip Overlay */}
            <AnimatePresence>
                {hoveredPoint && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute z-50 pointer-events-none"
                        style={{
                            left: `${hoveredPoint.x}%`,
                            top: `${hoveredPoint.y}%`,
                            transform: 'translate(-50%, -120%)' // Shift up and center
                        }}
                    >
                         <div className="bg-popover border text-popover-foreground text-xs rounded-lg shadow-xl p-3 min-w-[120px] -translate-y-full -translate-x-1/2">
                            <p className="font-semibold mb-1">{hoveredPoint.data[index]}</p>
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Valor:</span>
                                <span className="font-bold font-mono">
                                    {valueFormatter ? valueFormatter(hoveredPoint.data[categories[0]]) : hoveredPoint.data[categories[0]]}
                                </span>
                            </div>
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* X Axis Labels */}
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground px-0">
                {data.map((item, i) => (
                    <span key={i} className="truncate w-8 text-center">{item[index]}</span>
                ))}
            </div>
        </div>
    )
};