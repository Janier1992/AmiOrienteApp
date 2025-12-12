
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboards/DashboardLayout';
import { LayoutDashboard, BedDouble, CalendarCheck, Users, DollarSign, Settings } from 'lucide-react';
import HotelReceptionTab from '../HotelReceptionTab';
import HotelReservationsTab from '../HotelReservationsTab';
import HotelRoomsTab from '../HotelRoomsTab';
import HotelGuestsTab from '../HotelGuestsTab';
import FinancialsTab from '../FinancialsTab';
import ProfileTab from '../ProfileTab';

const HotelDashboard = ({ store }) => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Recepción', path: '' },
    { icon: CalendarCheck, label: 'Reservas', path: 'reservas' },
    { icon: BedDouble, label: 'Habitaciones', path: 'habitaciones' },
    { icon: Users, label: 'Huéspedes', path: 'huespedes' }, 
    { icon: DollarSign, label: 'Caja', path: 'finanzas' },
    { icon: Settings, label: 'Configuración', path: 'configuracion' },
  ];

  return (
    <DashboardLayout title={store.name} navItems={navItems}>
      <Routes>
        <Route path="/" element={<HotelReceptionTab storeId={store.id} />} />
        <Route path="reservas" element={<HotelReservationsTab storeId={store.id} />} />
        <Route path="habitaciones" element={<HotelRoomsTab storeId={store.id} />} />
        <Route path="huespedes" element={<HotelGuestsTab storeId={store.id} />} /> 
        <Route path="finanzas" element={<FinancialsTab storeId={store.id} />} />
        <Route path="configuracion" element={<ProfileTab />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default HotelDashboard;
