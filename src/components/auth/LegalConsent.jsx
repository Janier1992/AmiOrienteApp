import React from 'react';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * Casillas de aceptación legal para los registros.
 * - Siempre: Términos + Política de Privacidad y Tratamiento de Datos (Ley 1581 de 2012).
 * - Domiciliarios (`driver`): además, la declaración de trabajador independiente y de
 *   afiliación a seguridad social.
 * La aceptación se guarda en el servidor (tabla legal_consents) con la versión vigente.
 */
const LegalConsent = ({ accepted, onAcceptedChange, driver = false, driverDeclared, onDriverDeclaredChange }) => (
  <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
    <div className="flex items-start gap-3">
      <Checkbox
        id="legal-accept"
        checked={accepted}
        onCheckedChange={(v) => onAcceptedChange(v === true)}
        className="mt-0.5"
        aria-required="true"
      />
      <label htmlFor="legal-accept" className="cursor-pointer">
        He leído y acepto los{' '}
        <Link to="/terminos" target="_blank" rel="noopener noreferrer" className="text-primary underline">Términos y Condiciones</Link>{' '}
        y autorizo el tratamiento de mis datos personales según la{' '}
        <Link to="/privacidad" target="_blank" rel="noopener noreferrer" className="text-primary underline">Política de Privacidad y Tratamiento de Datos</Link>.
      </label>
    </div>

    {driver && (
      <div className="flex items-start gap-3">
        <Checkbox
          id="legal-driver"
          checked={driverDeclared}
          onCheckedChange={(v) => onDriverDeclaredChange(v === true)}
          className="mt-0.5"
          aria-required="true"
        />
        <label htmlFor="legal-driver" className="cursor-pointer">
          Declaro que presto el servicio como <strong>trabajador independiente</strong> con mis propios medios, que cuento con
          licencia, SOAT y los documentos del vehículo que use, y que estoy afiliado (o me afiliaré antes de operar) a
          salud, pensión y riesgos laborales, conforme a los Términos.
        </label>
      </div>
    )}
  </div>
);

export default LegalConsent;
