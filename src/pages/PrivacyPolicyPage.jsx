import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage, { LegalEntityBlock, LegalSection, LegalValue } from '@/components/legal/LegalPage';
import { LEGAL_ENTITY, PLATFORM_NAME } from '@/config/legal';

const PrivacyPolicyPage = () => (
  <LegalPage
    title="Política de Privacidad y Tratamiento de Datos Personales"
    description="Cómo AmiOriente recolecta, usa y protege tus datos personales, y cómo ejercer tus derechos."
  >
    <p>
      Esta política explica cómo tratamos los datos personales de quienes usan {PLATFORM_NAME}, conforme a la Ley 1581 de
      2012, el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) y demás normas de protección de datos
      personales de Colombia.
    </p>

    <LegalSection title="1. Responsable del tratamiento">
      <LegalEntityBlock />
      <p>Para ejercer sus derechos puede escribir al correo <LegalValue value={LEGAL_ENTITY.email} /> o usar el <Link to="/datos-personales" className="text-primary underline">formulario de solicitudes sobre datos personales</Link>.</p>
    </LegalSection>

    <LegalSection title="2. Qué datos recolectamos">
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Identificación y contacto:</strong> nombre, correo electrónico, teléfono y dirección.</li>
        <li><strong>Cuenta:</strong> tipo de cuenta (cliente, negocio o domiciliario), contraseña (almacenada de forma cifrada, nunca en texto claro) y registros de sesión.</li>
        <li><strong>Pedidos y transacciones:</strong> productos pedidos, direcciones de entrega, valores, método de pago, estado y calificaciones. Si usted pide productos de farmacia o veterinaria, el pedido puede dar a conocer información sobre su salud o la de su mascota; solo la usamos para atender ese pedido y usted no está obligado a suministrarla.</li>
        <li><strong>Ubicación:</strong> si usted lo autoriza en el navegador, usamos su ubicación para sugerirle negocios cercanos. Durante una entrega en curso, la ubicación del domiciliario se comparte con el cliente de ese pedido.</li>
        <li><strong>Negocios:</strong> nombre y datos comerciales, productos, horarios, datos de contacto del negocio y de su equipo.</li>
        <li><strong>Domiciliarios:</strong> nombre, contacto, dirección, tipo y número de documento, <strong>fotografía de su rostro tomada con la cámara</strong>, placa del vehículo, datos de su licencia, SOAT y revisión técnico-mecánica (entidad y vencimiento), entidades de salud, pensión y riesgos laborales, y la declaración firmada (con su firma). No almacenamos copias escaneadas de documentos ni datos bancarios en la Plataforma.</li>
        <li><strong>Técnicos y de uso:</strong> tipo de dispositivo y navegador, y registros de errores. Guardamos en su dispositivo el carrito, el tema (claro u oscuro) y la sesión, para que la aplicación funcione.</li>
        <li><strong>Comunicaciones:</strong> los mensajes que nos envía por el formulario de contacto o de solicitudes.</li>
      </ul>
      <p><strong>Fotografía del domiciliario (dato sensible).</strong> La fotografía facial es un dato biométrico y, por tanto, sensible. Se trata únicamente con la autorización expresa, previa e informada del domiciliario, que puede negarse a darla, aunque sin ella no podrá operar como domiciliario. Se usa solo para identificarlo ante el cliente y la tienda del pedido y por seguridad, no para reconocimiento facial ni otros fines.</p>
      <p>No recolectamos de forma intencional datos de menores de 18 años; la Plataforma no está dirigida a ellos. No solicitamos datos sensibles (origen racial, orientación sexual, convicciones, datos biométricos, etc.).</p>
    </LegalSection>

    <LegalSection title="3. Para qué usamos sus datos (finalidades)">
      <ul className="list-disc pl-6 space-y-1">
        <li>Crear y administrar su cuenta, y verificar su identidad.</li>
        <li>Gestionar pedidos: compartir con el negocio y el domiciliario los datos necesarios para preparar y entregar.</li>
        <li>Mostrar el estado y la ubicación del pedido, y enviar avisos operativos.</li>
        <li>Mostrar al cliente que tiene un pedido en curso la identidad del domiciliario asignado (fotografía, nombre completo, últimos dígitos del documento y placa) para su seguridad y para que pueda seguir la entrega en tiempo real.</li>
        <li>Calcular y registrar pagos, comisiones, planes y aportes que la ley ponga a cargo de la Plataforma, y cumplir obligaciones tributarias, contables y de seguridad social.</li>
        <li>Atender solicitudes, peticiones, quejas y reclamos, y prestar soporte.</li>
        <li>Prevenir fraude, garantizar la seguridad y cumplir órdenes de autoridades.</li>
        <li>Mejorar la Plataforma con estadísticas agregadas y anónimas.</li>
        <li>Si usted lo autoriza de manera expresa, enviarle información comercial. Puede retirar esa autorización en cualquier momento.</li>
      </ul>
    </LegalSection>

    <LegalSection title="4. Autorización">
      <p>Al registrarse marca de forma expresa que acepta esta política y los Términos. Guardamos la fecha y la versión que aceptó, como prueba de la autorización. Puede solicitar una copia de esa prueba y revocar su autorización en cualquier momento, salvo cuando exista un deber legal o contractual de conservar los datos.</p>
    </LegalSection>

    <LegalSection title="5. Con quién compartimos sus datos">
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Negocios y domiciliarios</strong> que participan en su pedido, solo con los datos necesarios (por ejemplo, nombre, teléfono y dirección de entrega). A su vez, el <strong>cliente de un pedido</strong> y la tienda del pedido ven del domiciliario asignado su fotografía, nombre, documento enmascarado (solo los últimos dígitos) y placa; no ven su teléfono, dirección ni otros datos.</li>
        <li><strong>Proveedores tecnológicos (encargados del tratamiento)</strong> que nos prestan servicios de alojamiento de base de datos y autenticación, publicación del sitio, tipografías y mapas (por ejemplo, Supabase, GitHub, Google Fonts y OpenStreetMap), que pueden recibir datos técnicos como su dirección IP. Algunos tienen sus servidores fuera de Colombia, por lo que sus datos pueden ser transmitidos o transferidos al exterior; exigimos a estos proveedores niveles adecuados de seguridad y confidencialidad.</li>
        <li><strong>Autoridades</strong> cuando la ley o una orden judicial o administrativa lo exija.</li>
      </ul>
      <p>No vendemos sus datos personales.</p>
    </LegalSection>

    <LegalSection title="6. Sus derechos como titular">
      <ul className="list-disc pl-6 space-y-1">
        <li>Conocer, actualizar y rectificar sus datos.</li>
        <li>Solicitar prueba de la autorización que nos dio.</li>
        <li>Ser informado, previa solicitud, del uso que se ha dado a sus datos.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley, una vez agotado el trámite de consulta o reclamo ante nosotros.</li>
        <li>Revocar la autorización y/o solicitar la supresión de sus datos cuando no se respeten los principios, derechos y garantías, o cuando ya no sean necesarios.</li>
        <li>Acceder de forma gratuita a sus datos personales.</li>
      </ul>
    </LegalSection>

    <LegalSection title="7. Cómo ejercer sus derechos y en qué plazos">
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Consultas</strong> (conocer los datos que tenemos): respondemos en máximo diez (10) días hábiles, prorrogables por cinco (5) días hábiles más si le informamos el motivo.</li>
        <li><strong>Reclamos</strong> (corrección, actualización, supresión, revocatoria o presunto incumplimiento): respondemos en máximo quince (15) días hábiles, prorrogables por ocho (8) más. Si el reclamo está incompleto, le pediremos que lo complete dentro de los cinco (5) días siguientes.</li>
        <li>Envíe su solicitud con su nombre, correo de la cuenta y una descripción clara de lo que pide, por el <Link to="/datos-personales" className="text-primary underline">formulario</Link> o al correo <LegalValue value={LEGAL_ENTITY.email} />. Podemos pedirle un dato para verificar que es el titular.</li>
        <li>La supresión no procede mientras exista un deber legal o contractual de conservar la información (por ejemplo, soportes de transacciones).</li>
      </ul>
    </LegalSection>

    <LegalSection title="8. Seguridad">
      <p>Aplicamos medidas técnicas y organizativas razonables: cifrado de las comunicaciones, contraseñas cifradas, control de acceso por roles a nivel de base de datos, y revisión de los permisos de cada tipo de cuenta. Ningún sistema es infalible; si ocurre un incidente que afecte sus datos, lo gestionaremos y notificaremos a las autoridades y a los afectados conforme a la ley.</p>
    </LegalSection>

    <LegalSection title="9. Cuánto tiempo conservamos los datos">
      <p>Mientras su cuenta esté activa y durante el tiempo adicional que exijan las normas contables, tributarias y de protección al consumidor. Cumplido ese plazo, los suprimimos o anonimizamos.</p>
    </LegalSection>

    <LegalSection title="10. Almacenamiento local y cookies">
      <p>Usamos el almacenamiento del navegador para mantener su sesión, su carrito y sus preferencias. No usamos cookies de publicidad de terceros. Puede borrar estos datos desde la configuración de su navegador, aunque la sesión y el carrito se perderán.</p>
    </LegalSection>

    <LegalSection title="11. Cambios a esta política">
      <p>Si cambiamos esta política, publicaremos la nueva versión con su fecha y, cuando el cambio afecte las finalidades, le pediremos de nuevo su autorización.</p>
    </LegalSection>
  </LegalPage>
);

export default PrivacyPolicyPage;
