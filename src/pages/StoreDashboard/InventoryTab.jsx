import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle } from 'lucide-react';

const LOW_STOCK_THRESHOLD = 10;

export const InventoryTab = ({ products }) => {
  const getStockStatus = (stock) => {
    if (stock === 0) return <Badge variant="destructive">Agotado</Badge>;
    if (stock <= LOW_STOCK_THRESHOLD) return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">Bajo Stock</Badge>;
    return <Badge variant="secondary" className="bg-green-400 text-green-900">En Stock</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Control de Inventario</CardTitle>
        <CardDescription>Supervisa los niveles de stock de tus productos.</CardDescription>
      </CardHeader>
      <CardContent>
        {(!products || products.length === 0) ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay productos para mostrar en el inventario.</p>
          </div>
        ) : (
          <>
            <div className="border rounded-lg mb-6 p-4 bg-blue-50 border-blue-200 flex items-start">
              <AlertTriangle className="h-5 w-5 text-blue-600 mr-3 mt-1" />
              <div>
                <h4 className="font-semibold text-blue-800">Alertas de Stock</h4>
                <p className="text-sm text-blue-700">
                  Recibirás una notificación cuando el stock de un producto sea igual o inferior a {LOW_STOCK_THRESHOLD} unidades.
                </p>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Stock Actual</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-center">{product.stock}</TableCell>
                      <TableCell className="text-center">{getStockStatus(product.stock)}</TableCell>
                      <TableCell className="text-right">${Number(product.price).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};