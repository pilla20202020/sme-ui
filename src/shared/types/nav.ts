import type { IconType } from 'react-icons';

export interface NavItem {
  id: string;
  label?: string;
  icon?: IconType;
  badge?: string;
  separator?: boolean;
}



