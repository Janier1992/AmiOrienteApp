
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Download, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const BulkUploadTab = ({ onProductsUploaded, storeId }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        parsePreview(selectedFile);
      } else {
        toast({ title: "Formato incorrecto", description: "Por favor, sube un archivo .csv", variant: "destructive" });
      }
    }
  };

  const parsePreview = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target.result;
      const lines = csvData.split('\n').slice(1).filter(line => line.trim() !== '').slice(0, 3);
      setPreview(lines);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,name,description,price,category,stock,discount\nEjemplo Producto,Descripción del producto,15000,General,50,0";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_inventario.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkUpload = async () => {
    if (!file || !storeId) return;

    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvData = event.target.result;
        const lines = csvData.split('\n').slice(1);
        const productsToInsert = [];
        
        for (const line of lines) {
            if (line.trim() === '') continue;
            const [name, description, price, category, stock, discount] = line.split(',');
            
            if (name && price && stock) {
            productsToInsert.push({
                store_id: storeId,
                name: name.trim(),
                description: description?.trim() || '',
                price: parseFloat(price) || 0,
                category: category?.trim() || 'General',
                stock: parseInt(stock, 10) || 0,
                discount: discount ? parseFloat(discount) : 0,
                product_type: 'physical',
                requires_shipping: true,
                created_at: new Date().toISOString()
            });
            }
        }

        if (productsToInsert.length > 0) {
            const { error } = await supabase.from('products').insert(productsToInsert);
            
            if (error) {
            toast({ title: "Error en la carga", description: error.message, variant: "destructive" });
            } else {
            toast({ 
                title: "¡Carga Exitosa!", 
                description: `${productsToInsert.length} productos han sido añadidos a tu inventario.`,
                className: "bg-green-50 border-green-200 text-green-800"
            });
            if(onProductsUploaded) onProductsUploaded();
            setFile(null);
            setPreview([]);
            }
        } else {
            toast({ title: "Archivo vacío", description: "No se encontraron datos válidos.", variant: "destructive" });
        }
      } catch (err) {
          toast({ title: "Error al procesar", description: "El archivo no tiene el formato correcto.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importación Masiva de Inventario
        </CardTitle>
        <p className="text-sm text-muted-foreground">Sube tu inventario completo usando un archivo Excel (.csv).</p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Instrucciones</AlertTitle>
            <AlertDescription className="text-blue-700 text-sm mt-1">
                1. Descarga la plantilla de ejemplo.<br/>
                2. Llena los datos de tus productos.<br/>
                3. Guarda el archivo como .CSV.<br/>
                4. Sube el archivo aquí.
            </AlertDescription>
        </Alert>

        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-8 bg-gray-50/50 hover:bg-gray-50 transition-colors">
          <Upload className="h-10 w-10 text-gray-400 mb-4" />
          
          <div className="flex gap-4 mb-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" className="pointer-events-none" tabIndex={-1}>
                    Seleccionar Archivo
                </Button>
                <input id="file-upload" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
              </label>
              <Button variant="ghost" onClick={downloadTemplate} className="text-primary hover:text-primary/90">
                <Download className="mr-2 h-4 w-4" /> Descargar Plantilla
              </Button>
          </div>

          {file && (
            <div className="w-full max-w-sm bg-white p-4 rounded border shadow-sm mt-4">
                <div className="flex items-center gap-2 font-medium text-sm mb-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    {file.name}
                </div>
                {preview.length > 0 && (
                    <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded font-mono">
                        {preview.map((line, i) => <div key={i} className="truncate">{line}</div>)}
                    </div>
                )}
            </div>
          )}
        </div>

        <div className="flex justify-end">
            <Button onClick={handleBulkUpload} disabled={!file || loading} className="w-full sm:w-auto">
                {loading ? "Procesando..." : `Importar Productos`}
            </Button>
        </div>

      </CardContent>
    </Card>
  );
};
