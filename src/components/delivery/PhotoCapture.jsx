import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { canvasToJpeg, drawSquare, fileToSquareJpeg } from '@/lib/driverPhoto';

/**
 * Toma la fotografía del domiciliario con la cámara del dispositivo (selfie).
 * Si no hay cámara o se niega el permiso, ofrece abrir la cámara del celular con
 * el selector de archivos (en el celular abre la cámara directamente).
 * `value` es la foto (data URL JPEG) o null; `onChange` recibe la foto nueva o null.
 */
const PhotoCapture = ({ value, onChange }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState('');

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no permite abrir la cámara aquí. Usa «Tomar con la cámara del celular».');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 960 } }, audio: false });
      streamRef.current = stream;
      setCameraOn(true);
      // el <video> existe después de este render
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play?.().catch(() => {});
        }
      });
    } catch {
      setError('No pudimos abrir la cámara. Permite el acceso a la cámara en tu navegador o usa «Tomar con la cámara del celular».');
    }
  };

  const snap = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError('La cámara aún no está lista, espera un segundo e inténtalo de nuevo.');
      return;
    }
    onChange(canvasToJpeg(drawSquare(video, video.videoWidth, video.videoHeight)));
    stopCamera();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      onChange(await fileToSquareJpeg(file));
    } catch (err) {
      setError(err.message || 'No se pudo usar esa foto.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="mx-auto h-56 w-56 overflow-hidden rounded-full border-4 border-primary/30 bg-muted flex items-center justify-center">
        {cameraOn ? (
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover [transform:scaleX(-1)]" aria-label="Vista de la cámara" />
        ) : value ? (
          <img src={value} alt="Tu fotografía" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {cameraOn ? (
          <>
            <Button type="button" onClick={snap}><Camera className="h-4 w-4 mr-2" /> Tomar foto</Button>
            <Button type="button" variant="outline" onClick={stopCamera}>Cancelar</Button>
          </>
        ) : (
          <>
            <Button type="button" onClick={startCamera}>
              {value ? <><RefreshCw className="h-4 w-4 mr-2" /> Repetir foto</> : <><Camera className="h-4 w-4 mr-2" /> Abrir cámara</>}
            </Button>
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" /> Tomar con la cámara del celular
            </Button>
          </>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="user" className="sr-only" aria-label="Elegir o tomar la foto con el celular" onChange={onFile} />

      {error && <p role="alert" className="text-center text-sm text-destructive">{error}</p>}
      <p className="text-center text-xs text-muted-foreground">
        Foto de frente, con buena luz, sin gafas oscuras ni gorra. Tu cliente la verá para saber quién le lleva el pedido.
      </p>
    </div>
  );
};

export default PhotoCapture;
