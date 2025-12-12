
import React from 'react';
import { GroceryDashboard as GroceryDashboardComponent } from './RetailDashboards';

const GroceryDashboard = ({ store }) => {
  return <GroceryDashboardComponent store={store} />;
};

export default GroceryDashboard;
