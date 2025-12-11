import React, { useState, useEffect } from 'react';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mic, MicOff, Package, Plus, ArrowLeft, Loader2, Camera } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const FarmerDashboard = () => {
    const navigate = useNavigate();
    const { store, fetchStoreData, addProduct, isLoadingStore } = useStoreDashboard();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [view, setView] = useState('menu'); // 'menu', 'add-product'

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: '1',
        description: ''
    });

    useEffect(() => {
        // Mock user ID for now or get from auth context in real app
        // Assuming auth is handled by wrapper, but we need store data
        const user = JSON.parse(localStorage.getItem('sb-kvkjeru...-auth-token'))?.user;
        if (user) fetchStoreData(user.id);
    }, [fetchStoreData]);

    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window)) {
            toast({ title: "Error", description: "Tu navegador no soporta entrada de voz.", variant: "destructive" });
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'es-CO';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            setTranscript(text);
            setFormData(prev => ({ ...prev, description: prev.description + ' ' + text }));
        };

        recognition.start();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!store) return;

        try {
            await addProduct({
                ...formData,
                store_id: store.id,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                category: 'Cosecha',
                image_url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=2070' // Placeholder for now
            });
            toast({ title: "¡Cosecha Agregada!", description: "Tu producto ya está visible para los clientes.", className: "bg-green-600 text-white" });
            setView('menu');
            setFormData({ name: '', price: '', stock: '1', description: '' });
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" });
        }
    };

    if (isLoadingStore) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-green-600" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-green-800">Mi Cosecha</h1>
                <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-slate-600">{navigator.onLine ? 'En línea' : 'Sin señal'}</span>
                </div>
            </div>

            {view === 'menu' && (
                <div className="grid grid-cols-1 gap-4">
                    <Card
                        className="bg-green-600 text-white border-none shadow-lg active:scale-95 transition-transform cursor-pointer"
                        onClick={() => setView('add-product')}
                    >
                        <CardContent className="flex flex-col items-center justify-center h-48 gap-4">
                            <Plus className="h-16 w-16" />
                            <span className="text-2xl font-bold">Tengo Cosecha</span>
                            <span className="text-sm opacity-90">Agregar nuevo producto</span>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-green-100 shadow-md active:scale-95 transition-transform cursor-pointer">
                        <CardContent className="flex flex-col items-center justify-center h-40 gap-3">
                            <Package className="h-12 w-12 text-green-700" />
                            <span className="text-xl font-semibold text-green-800">Ver Mis Pedidos</span>
                        </CardContent>
                    </Card>
                </div>
            )}

            {view === 'add-product' && (
                <div className="animate-in slide-in-from-bottom duration-300">
                    <Button variant="ghost" onClick={() => setView('menu')} className="mb-4 pl-0 hover:bg-transparent text-slate-600">
                        <ArrowLeft className="mr-2 h-6 w-6" /> Volver
                    </Button>

                    <Card className="border-none shadow-lg">
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-lg">¿Qué cosechaste?</Label>
                                <Input
                                    className="h-14 text-lg"
                                    placeholder="Ej: Yuca, Plátano..."
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-lg">Precio</Label>
                                    <Input
                                        type="number"
                                        className="h-14 text-lg"
                                        placeholder="$0"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-lg">Cantidad</Label>
                                    <Input
                                        type="number"
                                        className="h-14 text-lg"
                                        placeholder="1"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-lg">Descripción (Opcional)</Label>
                                <div className="relative">
                                    <Input
                                        className="h-14 text-lg pr-12"
                                        placeholder="Diga cómo es su producto..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                    <Button
                                        size="icon"
                                        variant={isListening ? "destructive" : "secondary"}
                                        className="absolute right-1 top-1 h-12 w-12"
                                        onClick={handleVoiceInput}
                                    >
                                        {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500 text-center">Toque el micrófono para dictar</p>
                            </div>

                            <div className="pt-4">
                                <Button
                                    className="w-full h-16 text-xl bg-green-600 hover:bg-green-700 shadow-xl"
                                    onClick={handleSubmit}
                                >
                                    Publicar Cosecha
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default FarmerDashboard;
