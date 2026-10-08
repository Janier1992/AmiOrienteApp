import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const ProfileTab = ({ profile, onInputChange, onProfileUpdate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onProfileUpdate} className="space-y-4">
          <div>
            <label htmlFor="profile-full_name" className="block text-sm font-medium text-foreground mb-1">Nombre</label>
            <Input id="profile-full_name" name="full_name" value={profile.full_name} onChange={onInputChange} />
          </div>
          <div>
            <label htmlFor="profile-email" className="block text-sm font-medium text-foreground mb-1">Email</label>
            <Input id="profile-email" name="email" type="email" value={profile.email} onChange={onInputChange} readOnly />
          </div>
          <div>
            <label htmlFor="profile-phone" className="block text-sm font-medium text-foreground mb-1">Teléfono</label>
            <Input id="profile-phone" name="phone" type="tel" value={profile.phone} onChange={onInputChange} />
          </div>
          <div>
            <label htmlFor="profile-address" className="block text-sm font-medium text-foreground mb-1">Dirección de Entrega</label>
            <Input id="profile-address" name="address" type="text" value={profile.address} onChange={onInputChange} placeholder="Ej: Calle 123 #45-67, Apto 890" />
          </div>
          <Button type="submit">Guardar Cambios</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileTab;