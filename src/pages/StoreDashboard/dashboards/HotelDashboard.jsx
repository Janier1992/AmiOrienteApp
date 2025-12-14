
import React from 'react';

import { LayoutDashboard, BedDouble, CalendarCheck, Users, DollarSign, Settings } from 'lucide-react';
import BaseStoreDashboard from './BaseStoreDashboard';

// Logic Components (Tabs)
import HotelReceptionTab from '../HotelReceptionTab';
import HotelReservationsTab from '../HotelReservationsTab';
import HotelRoomsTab from '../HotelRoomsTab';
import HotelGuestsTab from '../HotelGuestsTab';
import FinancialsTab from '../FinancialsTab';
import ProfileTab from '../ProfileTab';

const HotelDashboard = ({ store }) => {
  const tabs = [
    { path: '', label: 'Recepción', icon: LayoutDashboard, element: <HotelReceptionTab storeId={store.id} /> },
    { path: 'reservas', label: 'Reservas', icon: CalendarCheck, element: <HotelReservationsTab storeId={store.id} /> },
    { path: 'habitaciones', label: 'Habitaciones', icon: BedDouble, element: <HotelRoomsTab storeId={store.id} /> },
    { path: 'huespedes', label: 'Huéspedes', icon: Users, element: <HotelGuestsTab storeId={store.id} /> },
    { path: 'finanzas', label: 'Caja', icon: DollarSign, element: <FinancialsTab storeId={store.id} /> },
    { path: 'configuracion', label: 'Configuración', icon: Settings, element: <ProfileTab /> },
  ];

  return <BaseStoreDashboard store={store} tabs={tabs} />;
};

export default HotelDashboard;
