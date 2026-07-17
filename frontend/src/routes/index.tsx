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
      { path: '/crm/negociaciones/:id', Component: lazy(() => import('@/views/admin/apps/crm-inmobiliario/deals/detail')) },
      { path: '/crm/mensajes', Component: lazy(() => import('@/views/admin/apps/crm-inmobiliario/inbox')) },

      // Equipo (RF-02: invitar agentes)
      { path: '/equipo', Component: lazy(() => import('@/views/admin/team')) },

      // Perfil y facturación (RF-11/RF-12, RF-13 conexión de canal de WhatsApp)
      { path: '/perfil', Component: lazy(() => import('@/views/admin/profile-billing')) },
    ],
  },
  { path: '/auth/new-pass', Component: lazy(() => import('@/views/auth/basic/new-pass')) },
  { path: '/auth/reset-pass', Component: lazy(() => import('@/views/auth/basic/reset-pass')) },
  { path: '/auth/sign-in', Component: lazy(() => import('@/views/auth/basic/sign-in')) },
  { path: '/auth/sign-up', Component: lazy(() => import('@/views/auth/basic/sign-up')) },
  { path: '/auth/invite-callback', Component: lazy(() => import('@/views/auth/basic/invite-callback')) },
  { path: '/error/400', Component: lazy(() => import('@/views/error/400')) },
  { path: '/error/401', Component: lazy(() => import('@/views/error/401')) },
  { path: '/error/403', Component: lazy(() => import('@/views/error/403')) },
  { path: '/error/404', Component: lazy(() => import('@/views/error/404')) },
  { path: '/error/408', Component: lazy(() => import('@/views/error/408')) },
  { path: '/error/500', Component: lazy(() => import('@/views/error/500')) },
  { path: '/error/maintenance', Component: lazy(() => import('@/views/error/maintenance')) },
]
