import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

/**
 * Pide confirmación (y un motivo opcional) antes de cancelar un pedido.
 * `onConfirm(motivo)` debe devolver una promesa; si falla, el diálogo queda abierto.
 */
const CancelOrderDialog = ({ order, isOpen, onClose, onConfirm, audience = 'cliente' }) => {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm(reason.trim() || null);
      setReason('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar pedido #{order?.id?.substring(0, 8)}</DialogTitle>
          <DialogDescription>
            {audience === 'cliente'
              ? 'El negocio será avisado y los productos volverán al inventario. Esta acción no se puede deshacer.'
              : 'El cliente verá el pedido como cancelado y los productos volverán al inventario. Esta acción no se puede deshacer.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Motivo (opcional)</Label>
          <Textarea id="cancel-reason" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} placeholder="Cuéntanos qué pasó" />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Volver</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={busy}>
            {busy ? 'Cancelando...' : 'Sí, cancelar pedido'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelOrderDialog;
