import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import SignaturePad from '@/components/auth/SignaturePad';
import {
  DECLARATION_STATEMENTS,
  DOCUMENT_TYPES,
  VEHICLE_TYPES,
  isMotorized,
} from '@/lib/driverDeclaration';

const selectClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';

const Field = ({ id, label, children, hint }) => (
  <div className="space-y-1">
    <Label htmlFor={id}>{label}</Label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

/**
 * Formulario de la declaración y compromiso del domiciliario independiente
 * (datos, documentos al día, afiliaciones, declaraciones y firma digital).
 * Es controlado: el padre guarda `value` (ver emptyDeclaration) y `signature`.
 */
const DriverDeclarationForm = ({ fullName, value, onChange, signature, onSignatureChange }) => {
  const set = (field) => (e) => onChange({ ...value, [field]: e.target.value });
  const motor = isMotorized(value.vehicleType);

  return (
    <fieldset className="space-y-4 rounded-lg border border-border p-4">
      <legend className="px-2 text-sm font-semibold">Declaración y compromiso del domiciliario independiente</legend>
      <p className="text-xs text-muted-foreground">
        Este documento queda firmado y guardado como soporte para el equipo de administración. Completa tus datos reales:
        tus documentos deben estar vigentes.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="dd-doctype" label="Tipo de documento">
          <select id="dd-doctype" className={selectClass} value={value.documentType} onChange={set('documentType')}>
            {DOCUMENT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </Field>
        <Field id="dd-docnum" label="Número de documento">
          <Input id="dd-docnum" value={value.documentNumber} onChange={set('documentNumber')} inputMode="numeric" autoComplete="off" />
        </Field>
      </div>

      <Field id="dd-vehicle" label="¿Cómo haces las entregas?">
        <select id="dd-vehicle" className={selectClass} value={value.vehicleType} onChange={set('vehicleType')}>
          {VEHICLE_TYPES.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
        </select>
      </Field>

      {motor && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="dd-plate" label="Placa del vehículo">
            <Input id="dd-plate" value={value.plate} onChange={set('plate')} placeholder="ABC12D" autoComplete="off" />
          </Field>
          <Field id="dd-license" label="Licencia de conducción No.">
            <Input id="dd-license" value={value.licenseNumber} onChange={set('licenseNumber')} autoComplete="off" />
          </Field>
          <Field id="dd-license-exp" label="Vencimiento de la licencia">
            <Input id="dd-license-exp" type="date" value={value.licenseExpiry} onChange={set('licenseExpiry')} />
          </Field>
          <Field id="dd-soat" label="Aseguradora del SOAT">
            <Input id="dd-soat" value={value.soatInsurer} onChange={set('soatInsurer')} autoComplete="off" />
          </Field>
          <Field id="dd-soat-exp" label="Vencimiento del SOAT">
            <Input id="dd-soat-exp" type="date" value={value.soatExpiry} onChange={set('soatExpiry')} />
          </Field>
          <Field id="dd-tech-exp" label="Vencimiento de la revisión técnico-mecánica" hint="Si tu vehículo aún no la requiere, escribe la fecha en que debes hacerla.">
            <Input id="dd-tech-exp" type="date" value={value.techExpiry} onChange={set('techExpiry')} />
          </Field>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="dd-health" label="Salud (EPS)">
          <Input id="dd-health" value={value.health} onChange={set('health')} autoComplete="off" />
        </Field>
        <Field id="dd-pension" label="Fondo de pensión">
          <Input id="dd-pension" value={value.pension} onChange={set('pension')} autoComplete="off" />
        </Field>
        <Field id="dd-arl" label="Riesgos laborales (ARL)">
          <Input id="dd-arl" value={value.arl} onChange={set('arl')} autoComplete="off" />
        </Field>
      </div>

      <div className="space-y-3 rounded-md bg-muted/40 p-3">
        <p className="text-sm font-medium">
          {fullName?.trim() ? `Yo, ${fullName.trim()}, ` : 'Yo '}declaro bajo la gravedad del juramento que:
        </p>
        {DECLARATION_STATEMENTS.map((s) => (
          <div key={s.key} className="flex items-start gap-3 text-sm">
            <Checkbox
              id={`dd-st-${s.key}`}
              checked={value.statements[s.key]}
              onCheckedChange={(v) => onChange({ ...value, statements: { ...value.statements, [s.key]: v === true } })}
              className="mt-0.5"
            />
            <label htmlFor={`dd-st-${s.key}`} className="cursor-pointer">{s.text}</label>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Firma</Label>
        <SignaturePad onChange={onSignatureChange} />
        {signature && <p className="sr-only">Firma capturada</p>}
      </div>
    </fieldset>
  );
};

export default DriverDeclarationForm;
