import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';

/**
 * Botón de corazón para guardar/quitar un producto de la lista de deseos
 * (tabla `wishlist`, que se muestra en el panel del cliente).
 * Sin sesión invita a iniciar sesión y vuelve a la página actual.
 */
const WishlistButton = ({ productId, className }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wishlistId, setWishlistId] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setWishlistId(null);
    if (!user || !productId) return undefined;
    supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle()
      .then(({ data }) => { if (active) setWishlistId(data?.id ?? null); });
    return () => { active = false; };
  }, [user, productId]);

  const handleClick = async (e) => {
    // Puede estar dentro de una tarjeta que enlaza al producto
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({ title: "Inicia sesión", description: "Inicia sesión para guardar productos en tu lista de deseos." });
      const here = window.location.hash.replace(/^#/, '') || '/productos';
      navigate(`/cliente/login?redirect=${encodeURIComponent(here)}`);
      return;
    }

    setBusy(true);
    try {
      if (wishlistId) {
        const { error } = await supabase.from('wishlist').delete().eq('id', wishlistId);
        if (error) throw error;
        setWishlistId(null);
        toast({ title: "Quitado de tu lista de deseos" });
      } else {
        const { data, error } = await supabase
          .from('wishlist')
          .insert({ user_id: user.id, product_id: productId })
          .select('id')
          .single();
        if (error) throw error;
        setWishlistId(data?.id ?? 'saved');
        toast({ title: "Guardado en tu lista de deseos" });
      }
    } catch (error) {
      console.error('[WishlistButton]', error);
      toast({ variant: "destructive", title: "No se pudo actualizar", description: "Intenta de nuevo en unos segundos." });
    } finally {
      setBusy(false);
    }
  };

  const saved = Boolean(wishlistId);

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? 'Quitar de la lista de deseos' : 'Guardar en la lista de deseos'}
      className={cn('rounded-full bg-white/90 hover:bg-white', className)}
    >
      <Heart className={cn('h-5 w-5', saved ? 'fill-red-500 text-red-500' : 'text-slate-600')} />
    </Button>
  );
};

export default WishlistButton;
