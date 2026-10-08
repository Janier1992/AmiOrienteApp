import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage, { LegalEntityBlock, LegalSection, LegalValue } from '@/components/legal/LegalPage';
import { LEGAL_ENTITY, PLATFORM_NAME } from '@/config/legal';

const TermsPage = () => (
  <LegalPage
    title="Términos y Condiciones"
    description="Condiciones de uso de la plataforma AmiOriente para clientes, negocios aliados y domiciliarios."
  >
    <p>
      Estos Términos y Condiciones regulan el uso de la plataforma tecnológica {PLATFORM_NAME} (sitio web y
      aplicación) por parte de clientes, negocios aliados y domiciliarios. Al crear una cuenta o usar la plataforma
      usted declara que los leyó y los acepta. Si no está de acuerdo, no la utilice.
    </p>

    <LegalSection title="1. Quién es el responsable de la plataforma">
      <p>La plataforma es operada por:</p>
      <LegalEntityBlock />
      <p>En adelante, «{PLATFORM_NAME}» o «la Plataforma».</p>
    </LegalSection>

    <LegalSection title="2. Qué es y qué no es la Plataforma">
      <p>
        {PLATFORM_NAME} es una plataforma tecnológica de intermediación que conecta a tres tipos de usuarios: (a)
        <strong> clientes</strong>, que piden productos o servicios; (b) <strong>negocios aliados</strong>, que los
        ofrecen y los preparan o proveen; y (c) <strong>domiciliarios</strong>, personas independientes que realizan
        la entrega.
      </p>
      <p>
        La Plataforma no fabrica, prepara ni vende los productos: el vendedor de cada producto es el negocio aliado
        que lo ofrece. La Plataforma tampoco presta por sí misma el servicio de transporte: lo prestan los domiciliarios
        de manera independiente. {PLATFORM_NAME} pone la tecnología que permite el encuentro y el seguimiento del pedido.
      </p>
    </LegalSection>

    <LegalSection title="3. Cuentas de usuario">
      <ul className="list-disc pl-6 space-y-1">
        <li>Debe ser mayor de 18 años y tener capacidad legal para contratar.</li>
        <li>La información que suministre debe ser veraz, completa y estar actualizada.</li>
        <li>Usted es responsable de la confidencialidad de su contraseña y de lo que se haga con su cuenta. Avise de inmediato si sospecha de un uso no autorizado.</li>
        <li>El tipo de cuenta (cliente, negocio o domiciliario) se define al registrarse y no puede modificarse por el usuario. La Plataforma puede suspender cuentas por incumplimiento de estos Términos o por riesgo de fraude.</li>
        <li>Cada persona puede tener una cuenta por correo electrónico.</li>
      </ul>
    </LegalSection>

    <LegalSection title="4. Pedidos, precios y pagos">
      <ul className="list-disc pl-6 space-y-1">
        <li>Los precios de los productos los fija cada negocio aliado y se muestran en pesos colombianos (COP), con los impuestos que correspondan.</li>
        <li>
          Antes de confirmar un pedido la Plataforma muestra el valor total que usted pagará. Cuando el pedido es para
          domicilio, el costo de la entrega hace parte de ese valor total (se muestre incluido en el precio o
          discriminado) y no se cobran valores adicionales que no hayan sido informados antes de confirmar.
        </li>
        <li>Hoy los pedidos se pagan en efectivo o por transferencia directa acordada con el negocio, al momento de la entrega. Cuando se habiliten pagos en línea, se informarán el medio y las condiciones antes de pagar.</li>
        <li>El pedido se entiende aceptado cuando el negocio lo confirma. Si un producto no está disponible, el negocio o la Plataforma se lo informarán.</li>
        <li>Los tiempos de entrega son estimados y pueden variar por clima, tráfico, disponibilidad de domiciliarios u otras causas ajenas a la Plataforma.</li>
      </ul>
    </LegalSection>

    <LegalSection title="5. Derecho de retracto, cancelaciones y garantías (Estatuto del Consumidor)">
      <ul className="list-disc pl-6 space-y-1">
        <li>
          En las ventas a distancia, el consumidor puede ejercer el <strong>derecho de retracto</strong> dentro de los
          cinco (5) días hábiles siguientes a la entrega del producto, devolviéndolo en las condiciones previstas en
          la Ley 1480 de 2011. El dinero se reintegra dentro de los treinta (30) días calendario siguientes al ejercicio
          del derecho.
        </li>
        <li>
          El retracto no aplica en los casos que la ley exceptúa, por ejemplo productos perecederos o que por su
          naturaleza no puedan ser devueltos, productos personalizados o cuyo servicio ya haya comenzado con su
          consentimiento. Esto incluye normalmente alimentos preparados.
        </li>
        <li>Puede cancelar un pedido sin costo mientras el negocio no lo haya empezado a preparar. Después, la cancelación depende de lo que el negocio ya haya hecho.</li>
        <li>Si el producto llega en mal estado, incompleto o distinto a lo ofrecido, tiene derecho a las garantías legales y a que se corrija, se cambie o se devuelva el dinero. Repórtelo en las primeras horas por los canales de la sección 12.</li>
        <li>Cuando existan pagos electrónicos, podrá solicitar la reversión del pago en los casos del Decreto 587 de 2016 (fraude, operación no solicitada, producto no recibido o no conforme).</li>
      </ul>
    </LegalSection>

    <LegalSection title="6. Negocios aliados">
      <ul className="list-disc pl-6 space-y-1">
        <li>El negocio es el vendedor y responde por la calidad, idoneidad, inocuidad, información, garantía y legalidad de lo que ofrece, así como por contar con los permisos sanitarios, de comercio y de funcionamiento que su actividad exija (por ejemplo, registro mercantil, concepto sanitario, licencias de farmacia o veterinaria).</li>
        <li>Debe mantener actualizados precios, existencias, horarios y datos de contacto, y entregar al cliente los documentos tributarios que la ley le exija.</li>
        <li>Es responsable de sus propias obligaciones tributarias, laborales y de seguridad social.</li>
        <li>Debe tratar los datos personales de los clientes que reciba solo para atender el pedido, y cumplir la Política de Privacidad.</li>
        <li>
          Por el uso de la Plataforma se aplican los planes, la comisión por venta y los límites vigentes, publicados en
          la página de <Link to="/precios" className="text-primary underline">planes y precios</Link>. La comisión de
          cada venta se registra con la tasa del plan que tenga el negocio al momento del pedido. Los planes pueden cambiar;
          los cambios aplican hacia el futuro y se informan con antelación razonable.
        </li>
      </ul>
    </LegalSection>

    <LegalSection title="7. Domiciliarios independientes">
      <ul className="list-disc pl-6 space-y-1">
        <li>
          El domiciliario actúa como <strong>trabajador independiente y autónomo</strong>. Usar la Plataforma y recibir
          pedidos no crea contrato de trabajo, subordinación, exclusividad ni horario mínimo con {PLATFORM_NAME} ni con los negocios.
          Decide libremente si se conecta, cuándo y qué pedidos acepta o rechaza.
        </li>
        <li>Pone sus propios medios: vehículo, equipos, combustible y mantenimiento. Debe contar con licencia de conducción vigente, SOAT, revisión técnico-mecánica y demás documentos que la ley exija para el vehículo que use, y cumplir las normas de tránsito.</li>
        <li>
          Debe estar afiliado y cotizar al Sistema de Seguridad Social Integral (salud, pensión y riesgos laborales) como
          independiente, y conservar los soportes. Es responsable de sus obligaciones tributarias. La Plataforma
          cumplirá los aportes, afiliaciones, reportes y retenciones que la ley y sus reglamentos pongan a cargo de las
          plataformas digitales de reparto, incluida la Ley 2466 de 2025 y las normas que la desarrollen, en la forma y
          plazos que estas establezcan.
        </li>
        <li>Debe entregar el pedido completo, en buen estado y de forma segura, y dar un trato respetuoso. No puede abrir, consumir ni alterar los productos ni cobrar valores distintos a los informados por la Plataforma.</li>
        <li>La ubicación del domiciliario se comparte con el cliente solo durante el pedido en curso, como explica la Política de Privacidad.</li>
        <li>La Plataforma puede suspender el acceso por incumplimientos graves, fraude o quejas comprobadas, garantizando que pueda dar su versión.</li>
      </ul>
    </LegalSection>

    <LegalSection title="8. Conductas prohibidas">
      <p>Está prohibido: suplantar a otra persona, dar información falsa, usar la Plataforma para actividades ilícitas, intentar acceder a cuentas o datos de otros, alterar precios o pedidos por medios no autorizados, interferir con el funcionamiento técnico, usar datos de otros usuarios para fines distintos al pedido, y publicar contenido ofensivo, discriminatorio o que infrinja derechos de terceros.</p>
    </LegalSection>

    <LegalSection title="9. Propiedad intelectual">
      <p>El software, la marca, el diseño y los contenidos de la Plataforma son de su titular o están licenciados. Los negocios conservan los derechos sobre sus marcas, fotos y descripciones y autorizan a la Plataforma a mostrarlos para prestar el servicio.</p>
    </LegalSection>

    <LegalSection title="10. Limitación de responsabilidad">
      <p>
        {PLATFORM_NAME} responde por el correcto funcionamiento de la Plataforma como intermediario. No responde por la
        calidad o idoneidad de los productos (que corresponde al negocio vendedor) ni por los actos del domiciliario
        independiente, salvo en los casos en que la ley disponga otra cosa. Nada de lo aquí dispuesto limita los
        derechos irrenunciables que la ley reconoce a los consumidores.
      </p>
    </LegalSection>

    <LegalSection title="11. Datos personales">
      <p>El tratamiento de datos personales se rige por la <Link to="/privacidad" className="text-primary underline">Política de Privacidad y Tratamiento de Datos Personales</Link>, que hace parte de estos Términos.</p>
    </LegalSection>

    <LegalSection title="12. Peticiones, quejas, reclamos y contacto">
      <p>
        Puede presentar peticiones, quejas, reclamos o sugerencias (PQRS) por el formulario de{' '}
        <Link to="/contacto" className="text-primary underline">contacto</Link> o al correo <LegalValue value={LEGAL_ENTITY.email} />.
        Responderemos dentro de los plazos legales. Si no queda conforme, puede acudir a la Superintendencia de Industria
        y Comercio (SIC), autoridad de protección al consumidor y de datos personales.
      </p>
    </LegalSection>

    <LegalSection title="13. Cambios a estos Términos">
      <p>Podemos actualizar estos Términos. Publicaremos la nueva versión con su fecha y, cuando el cambio sea importante, se lo informaremos por la Plataforma o por correo. Si sigue usando la Plataforma después de la fecha de entrada en vigor, se entiende que acepta la nueva versión; si no está de acuerdo, puede cerrar su cuenta.</p>
    </LegalSection>

    <LegalSection title="14. Ley aplicable y jurisdicción">
      <p>Estos Términos se rigen por las leyes de la República de Colombia. Las controversias se someterán a los jueces colombianos competentes y a las autoridades administrativas que la ley señale, sin perjuicio de los mecanismos de solución de conflictos de consumo.</p>
    </LegalSection>
  </LegalPage>
);

export default TermsPage;
