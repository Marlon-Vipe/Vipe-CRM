import { lazy } from 'react';
import { Navigate, createBrowserRouter } from "react-router";
import Loadable from 'src/layouts/full/shared/loadable/Loadable';
import ProtectedRoute from 'src/components/ProtectedRoute';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

// CRM
const Dashboard = Loadable(lazy(() => import('../views/dashboards/Dashboard')));
const Contacts = Loadable(lazy(() => import('../views/contacts/Contacts')));
const Properties = Loadable(lazy(() => import('../views/properties/Properties')));
const Deals = Loadable(lazy(() => import('../views/deals/Deals')));
const Inbox = Loadable(lazy(() => import('../views/inbox/Inbox')));
const Profile = Loadable(lazy(() => import('../views/profile/Profile')));
const Billing = Loadable(lazy(() => import('../views/billing/Billing')));

// authentication
const Login = Loadable(lazy(() => import('../views/auth/login/Login')));
const Register = Loadable(lazy(() => import('../views/auth/register/Register')));
const Error = Loadable(lazy(() => import('../views/auth/error/Error')));

const Router = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <FullLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/', exact: true, element: <Dashboard /> },
      { path: '/contacts', exact: true, element: <Contacts /> },
      { path: '/properties', exact: true, element: <Properties /> },
      { path: '/deals', exact: true, element: <Deals /> },
      { path: '/inbox', exact: true, element: <Inbox /> },
      { path: '/profile', exact: true, element: <Profile /> },
      { path: '/billing', exact: true, element: <Billing /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: '/auth/login', element: <Login /> },
      { path: '/auth/register', element: <Register /> },
      { path: '404', element: <Error /> },
      { path: '/auth/404', element: <Error /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
];

const router = createBrowserRouter(Router)

export default router;
