import {
  Home,
  Archive,
  Settings,
  PackageOpen,
  DollarSign,
  FileText,
  Warehouse,
  User2,
} from 'lucide-react';
import { NavItem } from '@/types/Navbar';

export const NAVBAR_ITEMS: NavItem[] = [
  {
    title: 'Home',
    path: '/home',
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: 'Stock Entry',
    path: '/records',
    icon: <Archive className="h-4 w-4" />,
  },
  {
    title: 'Clearance',
    path: '/clearance',
    icon: <PackageOpen className="h-4 w-4" />,
  },
  {
    title: 'Inventory',
    path: '/inventory',
    icon: <Warehouse className="h-4 w-4" />,
  },
  {
    title: 'Customers',
    path: '/customers',
    icon: <User2 className="h-4 w-4" />,
  },

  {
    title: 'Expenses',
    path: '/expenses',
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    title: 'Reports',
    path: '/reports',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: <Settings className="h-4 w-4" />,
  },
];
