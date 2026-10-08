import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WIDTH = 480;
const HEIGHT = 160;

/**
 * Recuadro para firmar con el dedo, el mouse o un lápiz.
 * Entrega la firma como imagen PNG (data URL) o null si está vacía.
 */
const SignaturePad = ({ onChange, disabled = false }) => {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const strokes = useRef(0);
  const [hasInk, setHasInk] = useState(false);

  const reset = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111827';
    strokes.current = 0;
    setHasInk(false);
  }, []);

  useEffect(() => { reset(); }, [reset]);

  const point = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * HEIGHT,
    };
  };

  const start = (e) => {
    if (disabled) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y + 0.01); // un toque suelto también deja marca
    ctx.stroke();
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    strokes.current += 1;
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    // Exigimos un trazo real (no solo un punto) para aceptar la firma.
    if (strokes.current >= 5) {
      setHasInk(true);
      onChange(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clear = () => {
    reset();
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        role="img"
        aria-label="Recuadro de firma: dibuja tu firma con el dedo o el mouse"
        className="w-full rounded-md border-2 border-dashed border-input bg-white touch-none cursor-crosshair"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{hasInk ? 'Firma registrada.' : 'Firma aquí con el dedo o el mouse.'}</span>
        <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={disabled}>
          <Eraser className="h-4 w-4 mr-1" /> Borrar y repetir
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
