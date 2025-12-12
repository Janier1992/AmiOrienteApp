import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

const PrivacyPolicyPage = () => {
  return (
    <>
      <Helmet>
        <title>Política de Privacidad - Domicilios MiOriente</title>
      </Helmet>
      <div className="bg-background min-h-screen">
        <header className="bg-card shadow-md sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center space-x-2">
                <ShoppingBag className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">Domicilios - MiOriente</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-card text-card-foreground p-8 rounded-lg shadow border border-border">
            <h1 className="text-3xl font-bold mb-6">Política de Privacidad</h1>
            <div className="prose max-w-none text-muted-foreground">
              <p><strong>Última actualización:</strong> 18 de julio de 2025</p>
              
              <p>En Domicilios MiOriente, respetamos su privacidad y nos comprometemos a proteger sus datos personales. Esta política de privacidad le informará sobre cómo cuidamos sus datos personales cuando visita nuestra plataforma y le informará sobre sus derechos de privacidad y cómo la ley lo protege, en cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013 en Colombia.</p>

              <h2 className="text-xl font-semibold mt-6">1. Qué datos recopilamos</h2>
              <p>Podemos recopilar, usar, almacenar y transferir diferentes tipos de datos personales sobre usted, que hemos agrupado de la siguiente manera:</p>
              <ul>
                <li><strong>Datos de Identidad:</strong> Incluye nombre, apellido, nombre de usuario o identificador similar.</li>
                <li><strong>Datos de Contacto:</strong> Incluye dirección de facturación, dirección de entrega, dirección de correo electrónico y números de teléfono.</li>
                <li><strong>Datos Financieros:</strong> Incluye detalles de la cuenta bancaria y la tarjeta de pago, gestionados de forma segura por nuestro procesador de pagos Stripe.</li>
                <li><strong>Datos de Transacción:</strong> Incluye detalles sobre los pagos hacia y desde usted y otros detalles de productos y servicios que nos ha comprado.</li>
                <li><strong>Datos Técnicos:</strong> Incluye la dirección del protocolo de Internet (IP), sus datos de inicio de sesión, el tipo y la versión del navegador.</li>
                <li><strong>Datos de Geolocalización:</strong> Para los domiciliarios, recopilamos datos de ubicación en tiempo real para facilitar las entregas.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6">2. Cómo usamos sus datos personales</h2>
              <p>Usaremos sus datos personales en las siguientes circunstancias:</p>
              <ul>
                <li>Para registrarlo como un nuevo cliente, tienda o domiciliario.</li>
                <li>Para procesar y entregar su pedido, incluyendo la gestión de pagos, tarifas y cargos.</li>
                <li>Para gestionar nuestra relación con usted, lo que incluirá notificarle sobre cambios en nuestros términos o política de privacidad.</li>
                <li>Para permitirle participar en sorteos, concursos o completar una encuesta.</li>
                <li>Para administrar y proteger nuestro negocio y este sitio web (incluida la resolución de problemas, el análisis de datos, las pruebas, el mantenimiento del sistema, el soporte, la generación de informes y el alojamiento de datos).</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6">3. Divulgación de sus datos personales</h2>
              <p>Es posible que tengamos que compartir sus datos personales con las partes que se detallan a continuación para los fines establecidos en la tabla del párrafo 2 anterior:</p>
              <ul>
                <li>Proveedores de servicios externos que actúan como procesadores, que brindan servicios de TI y administración de sistemas.</li>
                <li>Asesores profesionales que actúan como procesadores o controladores conjuntos, incluidos abogados, banqueros, auditores y aseguradores que brindan servicios de consultoría, bancarios, legales, de seguros y contables.</li>
                <li>Stripe, nuestro proveedor de servicios de pago.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6">4. Seguridad de los datos</h2>
              <p>Hemos implementado medidas de seguridad apropiadas para evitar que sus datos personales se pierdan, usen o accedan de forma accidental de manera no autorizada, se alteren o se divulguen. Además, limitamos el acceso a sus datos personales a aquellos empleados, agentes, contratistas y otros terceros que tienen una necesidad comercial de conocerlos.</p>

              <h2 className="text-xl font-semibold mt-6">5. Sus derechos legales</h2>
              <p>Bajo ciertas circunstancias, usted tiene derechos bajo las leyes de protección de datos en relación con sus datos personales, incluyendo el derecho a solicitar acceso, corrección, eliminación, restricción, transferencia, y a oponerse al procesamiento.</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;