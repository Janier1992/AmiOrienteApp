import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, User, Send, BookOpen, TrendingUp, DollarSign, Package, Users, Lightbulb, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

const AutomationTab = ({ storeId }) => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "¡Hola compañero del campo! 🌾 Soy tu Entrenador Virtual. Estoy aquí para ayudarte a que tu negocio crezca. No importa si es tu primera vez usando tecnología o administrando un negocio, aprenderemos juntos paso a paso.\n\nPuedo explicarte sobre:\n• Cómo manejar tu dinero y ganancias 💰\n• Cómo poner precios justos a tus productos 🏷️\n• Estrategias para vender más 📈\n• Cómo organizar tu inventario 📦\n\n¿Por dónde te gustaría empezar hoy?" 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const educationalTopics = [
    { icon: DollarSign, label: "Finanzas Básicas", query: "Explícame cómo manejar las cuentas de mi negocio de forma sencilla." },
    { icon: TrendingUp, label: "Estrategia de Precios", query: "¿Cómo calculo el precio correcto para mis productos?" },
    { icon: Users, label: "Clientes", query: "¿Cómo puedo hacer que mis clientes vuelvan a comprar?" },
    { icon: Package, label: "Inventario", query: "Dame consejos para que no se me pierdan los productos." },
  ];

  const getEducationalResponse = (text) => {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('dinero') || lowerText.includes('cuenta') || lowerText.includes('finan') || lowerText.includes('ganancia')) {
      return "Para manejar tus finanzas sanamente, sigue esta 'Regla de Oro del Campo':\n\n1. **Separa las cuentas**: No mezcles el dinero del negocio con el de tu casa. Asignate un 'sueldo' y deja el resto para el negocio.\n2. **Anota todo**: Usa un cuaderno o la sección de 'Analíticas' de esta app para registrar cada peso que entra y sale.\n3. **Fondo de emergencia**: Trata de guardar el 10% de tus ventas para imprevistos (una lluvia fuerte, una reparación).\n\n¿Quieres que te explique cómo usar la pestaña de 'Analíticas' para ver esto?";
    }
    if (lowerText.includes('administra') || lowerText.includes('negocio') || lowerText.includes('organiza')) {
      return "Administrar bien es como preparar la tierra antes de sembrar. Aquí tienes 3 pasos básicos:\n\n1. **Planifica tu día**: Antes de salir, revisa tus 'Pedidos' pendientes en la app.\n2. **Conoce tus costos**: Suma semilla, abono, agua y TU tiempo. Si no cuentas tu tiempo, no estás cobrando bien.\n3. **Registro**: Mantén tus productos actualizados en la plataforma.\n\nUna buena administración te da tranquilidad mental. ¿Te gustaría revisar cómo actualizar tu inventario hoy?";
    }
    if (lowerText.includes('inventario') || lowerText.includes('stock') || lowerText.includes('producto') || lowerText.includes('guardar')) {
      return "El inventario es dinero en forma de productos. Para cuidarlo:\n\n• **Lo primero que entra, es lo primero que sale (PEPS)**: Así evitas que se te dañen los productos más viejos.\n• **Rotación**: Si tienes productos perecederos (como frutas), véndelos o procésalos (mermeladas) antes de que se pierdan.\n• **Usa la App**: En la pestaña 'Productos', mantén el número de 'stock' real para no vender lo que no tienes.\n\n¿Quieres consejos sobre cómo conservar mejor tus productos frescos?";
    }
    if (lowerText.includes('analitica') || lowerText.includes('grafica') || lowerText.includes('dato') || lowerText.includes('entender')) {
      return "Las analíticas son como el pronóstico del clima, pero para tu negocio. Te dicen qué va a pasar:\n\n• **Gráfico de Ventas**: Si la línea sube, ¡vas bien! Si baja, hay que promocionar más.\n• **Productos Top**: Son tus 'estrellas'. Asegúrate de tener siempre esos productos disponibles.\n• **Horarios**: Fíjate a qué hora te compran más para estar atento al celular.\n\nNo te asustes con los números, ellos te cuentan la historia de tu esfuerzo.";
    }
    if (lowerText.includes('marketing') || lowerText.includes('vender') || lowerText.includes('promocion') || lowerText.includes('foto')) {
      return "¡Para vender más, hay que antojar al cliente! 📸\n\n1. **La foto lo es todo**: Limpia el producto, usa luz natural (la del sol de la mañana es la mejor) y toma la foto de cerca.\n2. **Cuenta tu historia**: En la descripción, di quién eres, de dónde viene el producto y con qué cariño lo cultivaste. La gente ama saber el origen.\n3. **Combos**: ¿Vendes limones y panela? ¡Vende el 'Kit de Limonada'! Aumentas la venta y facilitas la vida al cliente.";
    }
    if (lowerText.includes('precio') || lowerText.includes('cobrar') || lowerText.includes('valor') || lowerText.includes('costo')) {
      return "Poner precios no es adivinar. Sigue esta fórmula sencilla:\n\n**Costo Total** (Insumos + Trabajo + Transporte) + **Ganancia Deseada** = **Precio de Venta**.\n\n• No te compares solo con el supermercado; tu producto es fresco y local, eso vale más.\n• Si un cliente pide rebaja, mejor ofrécele una 'ñapa' (un poco más de producto) en lugar de bajar el precio. Así proteges el valor de tu trabajo.";
    }
    if (lowerText.includes('cliente') || lowerText.includes('atencion') || lowerText.includes('queja') || lowerText.includes('volver')) {
      return "Un cliente feliz es la mejor publicidad. 🌱\n\n• **Saluda con nombre**: Cuando respondas un pedido, usa el nombre del cliente.\n• **Pequeños detalles**: Una nota a mano en el pedido o una fruta extra de regalo crea lealtad eterna.\n• **Si algo sale mal**: Pide disculpas sinceramente y ofrece una solución rápida. Un error bien resuelto a veces fideliza más que una venta perfecta.\n\nRecuerda: no vendes solo comida, vendes salud y confianza.";
    }
    if (lowerText.includes('pedido') || lowerText.includes('envio')) {
      return "Para gestionar tus pedidos, ve a la pestaña con el icono del carrito 🛒 ('Pedidos').\n\nAllí verás qué tienes pendiente. Recuerda cambiar el estado a 'Listo' cuando ya lo tengas empacado para que el domiciliario sepa que puede pasar. ¡Mantener esto al día es clave para que no se acumule el trabajo!";
    }

    return "Esa es una excelente pregunta. Como tu entrenador, te sugiero que nos enfoquemos en fortalecer las bases de tu negocio. ¿Te gustaría aprender sobre cómo mejorar la presentación de tus productos para atraer más clientes, o prefieres revisar cómo calcular mejor tus costos?";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = inputMessage;
    const newMsg = { role: 'user', content: userMsg };
    
    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
        const responseText = getEducationalResponse(userMsg);
        setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
        setIsTyping(false);
    }, 1500);
  };

  const handleTopicClick = (query) => {
    setInputMessage(query);
  };

  return (
    <div className="h-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary">Entrenador Virtual Campesino 🚜</h2>
            <p className="text-muted-foreground">Tu guía personal para aprender a administrar y hacer crecer tu negocio agrícola.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[500px]">
        <Card className="lg:col-span-2 flex flex-col h-full border-primary/20 shadow-md">
            <CardHeader className="border-b bg-muted/20 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <GraduationCap className="h-6 w-6 text-primary" /> 
                    Aula Interactiva
                </CardTitle>
                <CardDescription>
                    Pregunta cualquier duda sobre tu negocio. Estoy aquí para explicarte pacientemente.
                </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden p-0 relative bg-slate-50/50">
                <div 
                    ref={scrollRef} 
                    className="h-full overflow-y-auto p-4 space-y-6"
                >
                    {messages.map((msg, idx) => (
                        <div 
                            key={idx} 
                            className={cn(
                                "flex w-full max-w-[85%] gap-3",
                                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm",
                                msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-white text-emerald-600"
                            )}>
                                {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-6 w-6" />}
                            </div>
                            <div className={cn(
                                "rounded-2xl p-4 text-sm shadow-sm whitespace-pre-line leading-relaxed",
                                msg.role === 'user' 
                                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                                    : "bg-white border text-foreground rounded-tl-none"
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex w-full max-w-[80%] gap-3">
                            <div className="h-10 w-10 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 border">
                                <Bot className="h-6 w-6" />
                            </div>
                            <div className="bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-1">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="p-4 border-t bg-background">
                <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
                    <Input 
                        placeholder="Escribe tu duda aquí... (ej: ¿Cómo mejoro mis ventas?)" 
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={isTyping || !inputMessage.trim()} className="shrink-0">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>

        <div className="flex flex-col gap-4 h-full overflow-hidden">
            <Card className="flex-1 flex flex-col overflow-hidden bg-emerald-50/50 border-emerald-100">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-emerald-600" />
                        Temas Sugeridos
                    </CardTitle>
                    <CardDescription>
                        Selecciona un tema para comenzar a aprender.
                    </CardDescription>
                </CardHeader>
                <CardContent className="overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid gap-3">
                        {educationalTopics.map((topic, i) => (
                            <button
                                key={i}
                                onClick={() => handleTopicClick(topic.query)}
                                className="flex items-start gap-3 p-3 text-left bg-white hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-all shadow-sm hover:shadow group"
                            >
                                <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:scale-110 transition-all">
                                    <topic.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-900">{topic.label}</h4>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {topic.query}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-white rounded-lg border border-dashed border-emerald-200">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-emerald-800">
                            <BookOpen className="h-4 w-4" />
                            Tip del Día
                        </h4>
                        <p className="text-sm text-muted-foreground italic">
                            "La constancia es la mejor herramienta del campesino. Revisa tus pedidos dos veces al día para que ningún cliente se quede esperando."
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default AutomationTab;