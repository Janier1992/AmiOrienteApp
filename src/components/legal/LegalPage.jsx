import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LEGAL_ENTITY, LEGAL_VERSION, PLATFORM_NAME } from '@/config/legal';

/** Marca los datos que aún no se han definido para que sean imposibles de pasar por alto. */
export const LegalValue = ({ value }) =>
  value === '[POR DEFINIR]' ? (
    <mark className="rounded bg-yellow-200 px-1 text-yellow-900">{value}</mark>
  ) : (
    <strong>{value}</strong>
  );

export const LegalEntityBlock = () => (
  <ul className="list-disc pl-6 space-y-1">
    <li>Razón social: <LegalValue value={LEGAL_ENTITY.name} /></li>
    <li>NIT: <LegalValue value={LEGAL_ENTITY.nit} /></li>
    <li>Dirección de notificación: <LegalValue value={LEGAL_ENTITY.address} /></li>
    <li>Teléfono: <LegalValue value={LEGAL_ENTITY.phone} /></li>
    <li>Correo electrónico: <LegalValue value={LEGAL_ENTITY.email} /></li>
  </ul>
);

export const LegalSection = ({ title, children }) => (
  <section className="mt-8 space-y-3">
    <h2 className="text-xl font-semibold text-foreground">{title}</h2>
    {children}
  </section>
);

const LegalPage = ({ title, description, children }) => (
  <>
    <Helmet>
      <title>{title} - {PLATFORM_NAME}</title>
      {description && <meta name="description" content={description} />}
    </Helmet>
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link to="/" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio
        </Link>
        <article className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-10 text-card-foreground leading-relaxed space-y-3 text-[15px]">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">Versión {LEGAL_VERSION}</p>
          {children}
        </article>
        <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground" aria-label="Documentos legales">
          <Link to="/terminos" className="hover:text-primary hover:underline">Términos y Condiciones</Link>
          <Link to="/privacidad" className="hover:text-primary hover:underline">Política de Privacidad y Tratamiento de Datos</Link>
          <Link to="/datos-personales" className="hover:text-primary hover:underline">Ejercer mis derechos sobre mis datos</Link>
          <Link to="/contacto" className="hover:text-primary hover:underline">Contacto</Link>
        </nav>
      </div>
    </div>
  </>
);

export default LegalPage;
