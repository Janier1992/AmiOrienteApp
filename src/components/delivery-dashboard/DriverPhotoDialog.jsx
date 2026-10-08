import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import PhotoCapture from '@/components/delivery/PhotoCapture';
import { driverDeclarationService } from '@/services/driverDeclarationService';

/**
 * Para domiciliarios que ya firmaron su declaración pero aún no tienen foto de perfil
 * (o quieren cambiarla): la foto la ve el cliente de cada pedido que atiendan.
 */
const DriverPhotoDialog = ({ open, onOpenChange, onSaved }) => {
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await driverDeclarationService.actualizarFoto(photo);
      toast({ title: 'Fotografía guardada', description: 'Tus clientes la verán en los pedidos que atiendas.' });
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'No se pudo guardar la fotografía', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tómate tu fotografía</DialogTitle>
          <DialogDescription>
            Es obligatoria para aceptar pedidos: el cliente ve tu foto, tu nombre y tu placa para saber quién le lleva el pedido.
          </DialogDescription>
        </DialogHeader>
        <PhotoCapture value={photo} onChange={setPhoto} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Ahora no</Button>
          <Button onClick={save} disabled={saving || !photo}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DriverPhotoDialog;
