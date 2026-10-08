import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import DriverDeclarationForm from '@/components/delivery/DriverDeclarationForm';
import { driverDeclarationService } from '@/services/driverDeclarationService';
import { emptyDeclaration, validateDeclaration } from '@/lib/driverDeclaration';

/**
 * Para domiciliarios que ya tenían cuenta antes de la declaración firmada:
 * la firman desde su panel y queda guardada para administración.
 */
const DriverDeclarationDialog = ({ open, onOpenChange, user, onSigned }) => {
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [declaration, setDeclaration] = useState(emptyDeclaration);
  const [signature, setSignature] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSign = async () => {
    const problem = !fullName.trim() ? 'Escribe tu nombre completo.' : validateDeclaration(declaration, signature);
    if (problem) {
      toast({ title: 'Revisa tu declaración', description: problem, variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await driverDeclarationService.firmar({ email: user.email, fullName, values: declaration, signature });
      toast({ title: 'Declaración firmada', description: 'Quedó guardada. Ya puedes aceptar pedidos.' });
      onSigned();
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'No se pudo guardar', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Firma tu declaración de domiciliario independiente</DialogTitle>
          <DialogDescription>
            Es obligatoria para aceptar pedidos. Queda firmada y guardada como soporte para el equipo de administración.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <label htmlFor="dd-fullname" className="text-sm font-medium">Nombre completo</label>
          <input
            id="dd-fullname"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            autoComplete="name"
          />
        </div>
        <DriverDeclarationForm
          fullName={fullName}
          value={declaration}
          onChange={setDeclaration}
          signature={signature}
          onSignatureChange={setSignature}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Ahora no</Button>
          <Button onClick={handleSign} disabled={saving || !signature}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Firmar y enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DriverDeclarationDialog;
