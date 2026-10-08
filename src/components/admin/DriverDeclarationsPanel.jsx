import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileSignature, Loader2, Printer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { driverDeclarationService } from '@/services/driverDeclarationService';
import { printDocument, safeSignatureSrc } from '@/lib/printDocument';

const fmt = (iso) => new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

/**
 * Soporte para administración: declaraciones firmadas por los domiciliarios.
 * Son inmodificables; aquí solo se consultan, imprimen o guardan como PDF.
 */
export const DriverDeclarationsPanel = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [opening, setOpening] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      setRows(await driverDeclarationService.listarParaAdmin());
    } catch (error) {
      toast({ title: 'No se pudieron cargar las declaraciones', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => [r.full_name, r.email, r.document_number].some((v) => (v || '').toLowerCase().includes(term)));
  }, [rows, search]);

  const open = async (row) => {
    setOpening(row.id);
    try {
      setSelected(await driverDeclarationService.obtenerCompleta(row.id));
    } catch (error) {
      toast({ title: 'No se pudo abrir el documento', description: error.message, variant: 'destructive' });
    } finally {
      setOpening(null);
    }
  };

  const print = (d) => {
    const ok = printDocument({
      title: 'Declaración y compromiso de domiciliario independiente',
      text: d.document_text,
      signatureSrc: d.signature_png,
      photoSrc: d.photo_jpeg,
      footerLines: [
        `Firmante: ${d.full_name} · ${d.document_type} ${d.document_number} · ${d.email}`,
        `Firmado: ${fmt(d.signed_at)} · Versión de los Términos: ${d.legal_version}`,
        `Huella SHA-256: ${d.document_hash}`,
      ],
    });
    if (!ok) toast({ title: 'Permite las ventanas emergentes para imprimir', variant: 'destructive' });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileSignature className="h-5 w-5" /> Declaraciones de domiciliarios</CardTitle>
          <CardDescription>
            Documento firmado por cada domiciliario (independencia, documentos al día y afiliación a seguridad social).
            Es soporte ante cualquier incidente y no se puede modificar.
          </CardDescription>
          <Input
            placeholder="Buscar por nombre, correo o documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm mt-2"
            aria-label="Buscar declaraciones"
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Aún no hay declaraciones firmadas.</p>
          ) : (
            filtered.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.document_type} {r.document_number} · {r.email} · {fmt(r.signed_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r.claimed_at ? <Badge>Cuenta creada</Badge> : <Badge variant="secondary">Sin cuenta</Badge>}
                  <Button size="sm" variant="outline" onClick={() => open(r)} disabled={opening === r.id}>
                    {opening === r.id && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Ver documento
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Declaración de {selected?.full_name}</DialogTitle>
            <DialogDescription>
              Firmada el {selected && fmt(selected.signed_at)} · Versión {selected?.legal_version}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {selected.photo_jpeg && (
                <img src={selected.photo_jpeg} alt={`Fotografía de ${selected.full_name}`} className="h-28 w-28 rounded-full border object-cover" />
              )}
              <pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm font-sans">{selected.document_text}</pre>
              {safeSignatureSrc(selected.signature_png) && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Firma</p>
                  <img src={safeSignatureSrc(selected.signature_png)} alt={`Firma de ${selected.full_name}`} className="max-w-xs rounded border bg-white" />
                </div>
              )}
              <p className="text-xs text-muted-foreground break-all">Huella SHA-256: {selected.document_hash}</p>
              <Button onClick={() => print(selected)}>
                <Printer className="h-4 w-4 mr-2" /> Imprimir / guardar como PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DriverDeclarationsPanel;
