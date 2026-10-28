import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clothingService } from '../clothingService';
import { storeService } from '../storeService';

vi.mock('../storeService', () => ({
  storeService: {
    obtenerProductos: vi.fn(),
    crearProducto: vi.fn(),
    actualizarProducto: vi.fn(),
    eliminarProducto: vi.fn(),
  },
}));

beforeEach(() => vi.clearAllMocks());

describe('clothingService', () => {
  it('lista los productos de la tienda', async () => {
    storeService.obtenerProductos.mockResolvedValue([{ id: 'p1' }]);
    expect(await clothingService.getClothingProducts('s1')).toEqual([{ id: 'p1' }]);
    expect(storeService.obtenerProductos).toHaveBeenCalledWith('s1');
  });

  it('crea el producto cuando no trae id', async () => {
    storeService.crearProducto.mockResolvedValue({ id: 'nuevo' });
    await clothingService.saveClothingProduct({ name: 'Camisa', store_id: 's1' });
    expect(storeService.crearProducto).toHaveBeenCalledWith({ name: 'Camisa', store_id: 's1' });
    expect(storeService.actualizarProducto).not.toHaveBeenCalled();
  });

  it('actualiza el producto cuando trae id, sin enviar el id como campo', async () => {
    storeService.actualizarProducto.mockResolvedValue({ id: 'p1' });
    await clothingService.saveClothingProduct({ id: 'p1', name: 'Camisa' });
    expect(storeService.actualizarProducto).toHaveBeenCalledWith('p1', { name: 'Camisa' });
    expect(storeService.crearProducto).not.toHaveBeenCalled();
  });

  it('elimina por id', async () => {
    await clothingService.deleteClothingProduct('p1');
    expect(storeService.eliminarProducto).toHaveBeenCalledWith('p1');
  });
});
