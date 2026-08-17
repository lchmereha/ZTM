import dashboard from './dashboard';
import rfid from './rfid';

import type { MenuGroup } from './types';

// ==============================|| MENU ITEMS ||============================== //

const menuItems: MenuGroup = {
  items: [dashboard, rfid]
};

export default menuItems;
