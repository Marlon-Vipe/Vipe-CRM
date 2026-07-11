/**
=========================================================
* Soft UI Dashboard React - v4.0.1
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

/**
 * ---------------------------------------------------------------------------
 * NOTA — CRM Inmobiliario
 * ---------------------------------------------------------------------------
 * Este archivo fue limpiado a partir del template original de Creative Tim:
 *   - Se eliminaron las páginas demo "RTL" y "Virtual Reality" (no aplican
 *     al producto).
 *   - Se agregaron las rutas placeholder de las pantallas propias del CRM
 *     (Contactos, Propiedades, Negociaciones, Mensajes), cada una en su
 *     propia carpeta bajo src/layouts, lista para desarrollarse.
 *   - Se dejó fuera del menú la página demo "Tables" (el código sigue en
 *     src/layouts/tables como referencia de cómo usar el componente Table,
 *     pero ya no aparece en el Sidenav — su función la reemplazan
 *     Contactos y Propiedades).
 *
 * El resto del comentario original del template se conserva para quien
 * necesite agregar más rutas siguiendo la misma convención.
 * ---------------------------------------------------------------------------
 */

/** 
  All of the routes for the Soft UI Dashboard React are added here,
  You can add a new route, customize the routes and delete the routes here.

  Once you add a new route on this file it will be visible automatically on
  the Sidenav.

  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `collapse` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav. 
  3. The `type` key with the `divider` value is used for a divider between Sidenav items.
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `collapse` key is used for making a collapsible item on the Sidenav that has other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  8. The `route` key is used to store the route location which is used for the react router.
  9. The `href` key is used to store the external links location.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  10. The `component` key is used to store the component of its route.
*/

// Soft UI Dashboard React layouts
import Dashboard from "layouts/dashboard";
import Contacts from "layouts/contacts";
import Properties from "layouts/properties";
import Deals from "layouts/deals";
import Inbox from "layouts/inbox";
import Billing from "layouts/billing";
import Profile from "layouts/profile";
import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up";

// Soft UI Dashboard React icons
import Shop from "examples/Icons/Shop";
import Office from "examples/Icons/Office";
import Basket from "examples/Icons/Basket";
import CustomerSupport from "examples/Icons/CustomerSupport";
import Document from "examples/Icons/Document";
import SpaceShip from "examples/Icons/SpaceShip";
import CreditCard from "examples/Icons/CreditCard";

const routes = [
  { type: "title", title: "CRM", key: "crm-pages" },
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    route: "/dashboard",
    icon: <Shop size="12px" />,
    component: <Dashboard />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Contactos",
    key: "contacts",
    route: "/contacts",
    icon: <CustomerSupport size="12px" />,
    component: <Contacts />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Propiedades",
    key: "properties",
    route: "/properties",
    icon: <Office size="12px" />,
    component: <Properties />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Negociaciones",
    key: "deals",
    route: "/deals",
    icon: <Basket size="12px" />,
    component: <Deals />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Mensajes",
    key: "inbox",
    route: "/inbox",
    icon: <Document size="12px" />,
    component: <Inbox />,
    noCollapse: true,
  },
  { type: "title", title: "Cuenta", key: "account-pages" },
  {
    type: "collapse",
    name: "Perfil",
    key: "profile",
    route: "/profile",
    icon: <CustomerSupport size="12px" />,
    component: <Profile />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Facturación",
    key: "billing",
    route: "/billing",
    icon: <CreditCard size="12px" />,
    component: <Billing />,
    noCollapse: true,
  },
  {
    type: "route",
    name: "Iniciar sesión",
    key: "sign-in",
    route: "/authentication/sign-in",
    icon: <Document size="12px" />,
    component: <SignIn />,
    noCollapse: true,
    public: true,
  },
  {
    type: "route",
    name: "Registrarse",
    key: "sign-up",
    route: "/authentication/sign-up",
    icon: <SpaceShip size="12px" />,
    component: <SignUp />,
    noCollapse: true,
    public: true,
  },
];

export default routes;
