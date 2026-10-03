import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create } from 'zustand';
import { posService } from '@/services/posService';
import { createCartSlice } from '../createCartSlice';

vi.mock('@/services/posService', () => ({
    posService: { createPOSSale: vi.fn() },
}));

const productoConStock = { id: 'p1', name: 'Arroz', price: 5000, stock: 2 };
const productoSinStock = { id: 'p2', name: 'Servicio', price: 20000 };

const buildStore = (options) => create((set, get) => ({
    ...createCartSlice(set, get, options),
}));

describe('createCartSlice', () => {
    let useStore;

    beforeEach(() => {
        vi.clearAllMocks();
        posService.createPOSSale.mockResolvedValue({ id: 'order-1' });
        useStore = buildStore();
    });

    describe('addToCart', () => {
        it('agrega un producto nuevo con cantidad 1', () => {
            useStore.getState().addToCart(productoConStock);
            expect(useStore.getState().cart).toEqual([{ ...productoConStock, qty: 1 }]);
        });

        it('incrementa la cantidad si el producto ya está en el carrito', () => {
            useStore.getState().addToCart(productoConStock);
            useStore.getState().addToCart(productoConStock);
            expect(useStore.getState().cart[0].qty).toBe(2);
        });

        it('rechaza agregar más unidades que el stock disponible', () => {
            useStore.getState().addToCart(productoConStock); // qty 1
            useStore.getState().addToCart(productoConStock); // qty 2 (== stock)
            const added = useStore.getState().addToCart(productoConStock); // intenta qty 3

            expect(added).toBe(false);
            expect(useStore.getState().cart[0].qty).toBe(2);
        });

        it('permite agregar sin límite cuando el producto no trackea stock', () => {
            for (let i = 0; i < 5; i++) useStore.getState().addToCart(productoSinStock);
            expect(useStore.getState().cart[0].qty).toBe(5);
        });
    });

    describe('updateCartQty', () => {
        it('incrementa y decrementa respetando el mínimo de 1', () => {
            useStore.getState().addToCart(productoSinStock);
            useStore.getState().updateCartQty('p2', -5);
            expect(useStore.getState().cart[0].qty).toBe(1);
        });

        it('rechaza el salto completo si excede el stock (no lo topa al máximo)', () => {
            useStore.getState().addToCart(productoConStock); // qty 1, stock 2
            useStore.getState().updateCartQty('p1', 5); // 1+5=6 > stock(2) -> se ignora
            expect(useStore.getState().cart[0].qty).toBe(1);
        });

        it('sí permite subir un paso que se mantenga dentro del stock', () => {
            useStore.getState().addToCart(productoConStock); // qty 1, stock 2
            useStore.getState().updateCartQty('p1', 1); // 1+1=2 == stock -> permitido
            expect(useStore.getState().cart[0].qty).toBe(2);
        });
    });

    describe('removeFromCart / clearCart', () => {
        it('elimina un producto específico', () => {
            useStore.getState().addToCart(productoConStock);
            useStore.getState().addToCart(productoSinStock);
            useStore.getState().removeFromCart('p1');
            expect(useStore.getState().cart.map(i => i.id)).toEqual(['p2']);
        });

        it('vacía el carrito completo', () => {
            useStore.getState().addToCart(productoConStock);
            useStore.getState().clearCart();
            expect(useStore.getState().cart).toEqual([]);
        });
    });

    describe('processCheckout', () => {
        it('no hace nada si el carrito está vacío', async () => {
            await useStore.getState().processCheckout('store-1', 'Cliente', 'efectivo', 0);
            expect(posService.createPOSSale).not.toHaveBeenCalled();
        });

        it('llama a posService con el payload correcto y vacía el carrito', async () => {
            useStore.getState().addToCart(productoConStock);
            await useStore.getState().processCheckout('store-1', 'Juan Pérez', 'efectivo', 5000);

            expect(posService.createPOSSale).toHaveBeenCalledWith({
                storeId: 'store-1',
                cart: [{ ...productoConStock, qty: 1 }],
                guestInfo: { name: 'Juan Pérez', method: 'efectivo', type: 'POS' },
                total: 5000,
                status: 'Entregado',
            });
            expect(useStore.getState().cart).toEqual([]);
        });

        it('usa el defaultStatus configurado (ej. Confirmado para Agro)', async () => {
            useStore = buildStore({ defaultStatus: 'Confirmado' });
            useStore.getState().addToCart(productoConStock);
            await useStore.getState().processCheckout('store-1', 'Cliente', 'efectivo', 5000);

            expect(posService.createPOSSale).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'Confirmado' })
            );
        });

        it('llama a onCheckoutComplete después de una venta exitosa', async () => {
            const onCheckoutComplete = vi.fn();
            useStore = buildStore({ onCheckoutComplete });
            useStore.getState().addToCart(productoConStock);
            await useStore.getState().processCheckout('store-1', 'Cliente', 'efectivo', 5000);

            expect(onCheckoutComplete).toHaveBeenCalledWith(useStore.getState, 'store-1');
        });

        it('propaga el error y no vacía el carrito si la venta falla', async () => {
            posService.createPOSSale.mockRejectedValue(new Error('fallo de red'));
            useStore.getState().addToCart(productoConStock);

            await expect(
                useStore.getState().processCheckout('store-1', 'Cliente', 'efectivo', 5000)
            ).rejects.toThrow('fallo de red');

            expect(useStore.getState().cart).toHaveLength(1);
            expect(useStore.getState().isLoadingCheckout).toBe(false);
        });
    });
});
