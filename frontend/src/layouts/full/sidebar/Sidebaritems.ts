export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: any;
  children?: ChildItem[];
  item?: any;
  url?: any;
  color?: string;
  isPro?: boolean
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: any;
  id?: number;
  to?: string;
  items?: MenuItem[];
  children?: ChildItem[];
  url?: any;
  isPro?: boolean
}

import { uniqueId } from "lodash";

const SidebarContent: MenuItem[] = [
  {
    heading: "CRM",
    children: [
      {
        name: "Dashboard",
        icon: "solar:widget-add-line-duotone",
        id: uniqueId(),
        url: "/",
        isPro: false,
      },
      {
        name: "Contactos",
        icon: "solar:phone-line-duotone",
        id: uniqueId(),
        url: "/contacts",
        isPro: false,
      },
      {
        name: "Propiedades",
        icon: "solar:home-2-line-duotone",
        id: uniqueId(),
        url: "/properties",
        isPro: false,
      },
      {
        name: "Negociaciones",
        icon: "solar:chart-2-line-duotone",
        id: uniqueId(),
        url: "/deals",
        isPro: false,
      },
      {
        name: "Mensajes",
        icon: "solar:chat-round-line-line-duotone",
        id: uniqueId(),
        url: "/inbox",
        isPro: false,
      },
    ],
  },
  {
    heading: "Cuenta",
    children: [
      {
        name: "Perfil",
        icon: "solar:user-circle-outline",
        id: uniqueId(),
        url: "/profile",
        isPro: false,
      },
      {
        name: "Facturación",
        icon: "solar:bill-check-outline",
        id: uniqueId(),
        url: "/billing",
        isPro: false,
      },
    ],
  },
];

export default SidebarContent;
