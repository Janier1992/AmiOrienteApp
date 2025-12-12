import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

const TermsPage = () => {
  return (
    <>
      <Helmet>
        <title>Términos y Condiciones - Domicilios MiOriente</title>
      </Helmet>
      <div className="bg-gray-50 min-h-screen">
        <header className="bg-white shadow-md sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center space-x-2">
                <ShoppingBag className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-gray-800">Domicilios - MiOriente</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white p-8 rounded-lg shadow">
            <h1 className="text-3xl font-bold mb-6">Términos y Condiciones</h1>
            <div className="prose max-w-none">
              <p><strong>Última actualización:</strong> 18 de julio de 2025</p>
              
              <h2 className="text-xl font-semibold mt-6">1. Aceptación de los Términos</h2>
              <p>Al acceder y utilizar la plataforma Domicilios MiOriente, usted acepta estar sujeto a estos Términos y Condiciones y a nuestra Política de Privacidad. Si no está de acuerdo con alguno de estos términos, no debe utilizar nuestros servicios.</p>

              <h2 className="text-xl font-semibold mt-6">2. Descripción del Servicio</h2>
              <p>Domicilios MiOriente es una plataforma tecnológica que conecta a Clientes, Tiendas y Domiciliarios para facilitar la compra y entrega de productos en la región del Oriente Antioqueño.</p>

              <h2 className="text-xl font-semibold mt-6">3. Cuentas de Usuario</h2>
              <p>Para utilizar ciertas funciones de la plataforma, debe registrarse y crear una cuenta. Usted es responsable de mantener la confidencialidad de su contraseña y de todas las actividades que ocurran en su cuenta.</p>

              <h2 className="text-xl font-semibold mt-6">4. Pagos y Comisiones</h2>
              <p>Los pagos se procesan a través de nuestro proveedor de pagos externo, Stripe. Al realizar una compra, usted acepta los términos de servicio de Stripe. Domicilios MiOriente cobrará una comisión por cada transacción realizada a través de la plataforma, la cual se deducirá automáticamente del pago.</p>

              <h2 className="text-xl font-semibold mt-6">5. Obligaciones de las Partes</h2>
              <ul>
                <li><strong>Clientes:</strong> Se comprometen a proporcionar información veraz y a realizar los pagos correspondientes por los productos y servicios solicitados.</li>
                <li><strong>Tiendas:</strong> Son responsables de la calidad, disponibilidad y descripción de sus productos, así como de preparar los pedidos para su recolección.</li>
                <li><strong>Domiciliarios:</strong> Son responsables de recolectar y entregar los pedidos de manera segura y oportuna.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6">6. Propiedad Intelectual</h2>
              <p>Todo el contenido de la plataforma, incluyendo logos, textos y software, es propiedad de Domicilios MiOriente y está protegido por las leyes de propiedad intelectual.</p>

              <h2 className="text-xl font-semibold mt-6">7. Limitación de Responsabilidad</h2>
              <p>Domicilios MiOriente actúa como un intermediario y no se hace responsable por la calidad de los productos, disputas entre usuarios o cualquier incidente que ocurra durante la entrega. Nuestra responsabilidad se limita al funcionamiento de la plataforma tecnológica.</p>

              <h2 className="text-xl font-semibold mt-6">8. Modificaciones a los Términos</h2>
              <p>Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento. Le notificaremos de cualquier cambio material. El uso continuado de la plataforma después de dichos cambios constituirá su aceptación de los nuevos términos.</p>

              <h2 className="text-xl font-semibold mt-6">9. Ley Aplicable</h2>
              <p>Estos términos se regirán e interpretarán de acuerdo con las leyes de la República de Colombia.</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default TermsPage;