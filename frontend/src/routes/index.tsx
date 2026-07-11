import { lazy } from 'react'
import { Navigate, type RouteObject } from 'react-router'
import MainLayout from '@/layouts/MainLayout'

export const routes: RouteObject[] = [
  { path: '', element: <Navigate to="/dashboard" /> },
  {
    element: <MainLayout />,
    children: [
      // Dashboard (KPIs) — placeholder de ecommerce, adaptar a datos reales del CRM (ver CRM_PROMPT.md sección 5)
      { path: '/dashboard', Component: lazy(() => import('@/views/admin/dashboard/ecommerce')) },

      // Pantallas del CRM Inmobiliario — ver CRM_PROMPT.md sección 5 y crm_schema.sql
      { path: '/crm/contactos', Component: lazy(() => import('@/views/admin/apps/crm-inmobiliario/contacts')) },
      { path: '/crm/contactos/:id', Component: lazy(() => import('@/views/admin/apps/crm-inmobiliario/contacts/detail')) },
      { path: '/crm/propiedades', Component: lazy(() => import('@/views/admin/apps/crm-inmobiliario/properties')) },
      { path: '/crm/propiedades/nueva', Component: lazy(() => import('@/views/admin/apps/crm-inmobiliario/properties/form')) },
      { path: '/crm/propiedades/:id/editar', Component: lazy(() => import('@/views/admin/apps/crm-inmobiliario/properties/form')) },
      { path: '/crm/negociaciones', Component: lazy(() => import('@/views/admin/apps/crm-inmobiliario/deals')) },
      { path: '/crm/mensajes', Component: lazy(() => import('@/views/admin/apps/crm-inmobiliario/inbox')) },
    ],
  },
  { path: '/auth/delete-account', Component: lazy(() => import('@/views/auth/basic/delete-account')) },
  { path: '/auth/lock-screen', Component: lazy(() => import('@/views/auth/basic/lock-screen')) },
  { path: '/auth/login-pin', Component: lazy(() => import('@/views/auth/basic/login-pin')) },
  { path: '/auth/new-pass', Component: lazy(() => import('@/views/auth/basic/new-pass')) },
  { path: '/auth/reset-pass', Component: lazy(() => import('@/views/auth/basic/reset-pass')) },
  { path: '/auth/sign-in', Component: lazy(() => import('@/views/auth/basic/sign-in')) },
  { path: '/auth/sign-up', Component: lazy(() => import('@/views/auth/basic/sign-up')) },
  { path: '/auth/split/delete-account', Component: lazy(() => import('@/views/auth/split/delete-account')) },
  { path: '/auth/split/lock-screen', Component: lazy(() => import('@/views/auth/split/lock-screen')) },
  { path: '/auth/split/login-pin', Component: lazy(() => import('@/views/auth/split/login-pin')) },
  { path: '/auth/split/new-pass', Component: lazy(() => import('@/views/auth/split/new-pass')) },
  { path: '/auth/split/reset-pass', Component: lazy(() => import('@/views/auth/split/reset-pass')) },
  { path: '/auth/split/sign-in', Component: lazy(() => import('@/views/auth/split/sign-in')) },
  { path: '/auth/split/sign-up', Component: lazy(() => import('@/views/auth/split/sign-up')) },
  { path: '/auth/split/success-mail', Component: lazy(() => import('@/views/auth/split/success-mail')) },
  { path: '/auth/split/two-factor', Component: lazy(() => import('@/views/auth/split/two-factor')) },
  { path: '/auth/success-mail', Component: lazy(() => import('@/views/auth/basic/success-mail')) },
  { path: '/auth/two-factor', Component: lazy(() => import('@/views/auth/basic/two-factor')) },
  { path: '/error/400', Component: lazy(() => import('@/views/error/400')) },
  { path: '/error/401', Component: lazy(() => import('@/views/error/401')) },
  { path: '/error/403', Component: lazy(() => import('@/views/error/403')) },
  { path: '/error/404', Component: lazy(() => import('@/views/error/404')) },
  { path: '/error/408', Component: lazy(() => import('@/views/error/408')) },
  { path: '/error/500', Component: lazy(() => import('@/views/error/500')) },
  { path: '/error/maintenance', Component: lazy(() => import('@/views/error/maintenance')) },
]
