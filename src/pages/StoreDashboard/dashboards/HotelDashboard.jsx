
import React from 'react';

import { LayoutDashboard, BedDouble, CalendarCheck, Users, DollarSign, Settings, CreditCard } from 'lucide-react';
import BaseStoreDashboard from './BaseStoreDashboard';

// Logic Components (Tabs)
import HotelReceptionTab from '../HotelReceptionTab';
import HotelReservationsTab from '../HotelReservationsTab';
import HotelRoomsTab from '../HotelRoomsTab';
import FinancialsTab from '../FinancialsTab';
import GenericPOSView from '../views/GenericPOSView'; // POS View
// Base Model Components
import StoreSettingsTab from '../views/StoreSettingsTab';
import StoreCustomersTab from '../views/StoreCustomersTab';

import { withStoreCategory } from '@/components/shared/withStoreCategory';
import { useHotelStore } from '@/stores/useHotelStore';

const HotelDashboard = ({ store }) => {
  const tabs = [
    { path: '', label: 'Recepción', icon: LayoutDashboard, element: <HotelReceptionTab storeId={store.id} /> },
    { path: 'caja', label: 'Caja / Servicios', icon: CreditCard, element: <GenericPOSView useStore={useHotelStore} title="Hotel - Servicios" /> },
    { path: 'reservas', label: 'Reservas', icon: CalendarCheck, element: <HotelReservationsTab storeId={store.id} /> },
    { path: 'habitaciones', label: 'Habitaciones', icon: BedDouble, element: <HotelRoomsTab storeId={store.id} /> },
    // Extension: Hotel specific guests view could be kept if it has passport info etc, but trying to use Base where possible. 
    // However, HotelGuestsTab has history. Let's keep it as an override or use Base if HotelGuestsTab is just a clone.
    // Looking at file analysis, HotelGuestsTab was specific. But user asked for Base Model "Usuarios".
    // I will use the Base StoreCustomersTab for "Clientes" generic, and maybe keep "Huéspedes" for in-house specific?
    // User instruction: "Usuario... Extender... agregar UNICAMENTE lo que tiene sentido".
    // Hotel Customers = Guests. I should probably replace HotelGuestsTab with StoreCustomersTab OR have HotelGuestsTab EXTEND standard customer data.
    // For now, I will add "Usuarios" (Users) as the Base Model Users tab.
    { path: 'clientes', label: 'Clientes (Base)', icon: Users, element: <StoreCustomersTab /> },
    { path: 'finanzas', label: 'Caja', icon: DollarSign, element: <FinancialsTab storeId={store.id} /> },
    { path: 'configuracion', label: 'Configuración', icon: Settings, element: <StoreSettingsTab /> },
  ];

  return <BaseStoreDashboard store={store} tabs={tabs} />;
};

export default withStoreCategory(HotelDashboard, ['Hotel']);
