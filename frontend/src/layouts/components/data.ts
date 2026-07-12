import { type MenuItemType } from '@/types'

/**
 * Menú lateral del CRM Inmobiliario.
 * Reescrito a partir del menú original de UBold: se quitaron las secciones
 * de demostración del template (Layouts, Components/Icons, Menu Items) y se
 * agregó la sección "CRM Inmobiliario" con las 4 pantallas principales.
 * Ver CRM_PROMPT.md sección 5 para el detalle de cada pantalla.
 */
export const menuItems: MenuItemType[] = [
  {
    'icon': 'layout-dashboard',
    'slug': 'main',
    'label': 'Principal',
    'isTitle': true,
    'children': [
      {
        'url': '/dashboard',
        'slug': 'pages:dashboard',
        'label': 'Dashboard',
        'icon': 'layout-dashboard',
      },
    ],
  },
  {
    'icon': 'building-2',
    'slug': 'crm-inmobiliario',
    'label': 'CRM Inmobiliario',
    'isTitle': true,
    'children': [
      {
        'url': '/crm/contactos',
        'slug': 'pages:crm-contactos',
        'label': 'Contactos',
        'icon': 'contact',
      },
      {
        'url': '/crm/propiedades',
        'slug': 'pages:crm-propiedades',
        'label': 'Propiedades',
        'icon': 'building-2',
      },
      {
        'url': '/crm/negociaciones',
        'slug': 'pages:crm-negociaciones',
        'label': 'Negociaciones',
        'icon': 'kanban-square',
      },
      {
        'url': '/crm/mensajes',
        'slug': 'pages:crm-mensajes',
        'label': 'Mensajes',
        'icon': 'message-circle',
      },
    ],
  },
  {
    'icon': 'user-lock',
    'slug': 'cuenta',
    'label': 'Cuenta',
    'isTitle': true,
    'children': [
      {
        'url': '/equipo',
        'slug': 'pages:equipo',
        'label': 'Equipo',
        'icon': 'users',
      },
      {
        'icon': 'user-lock',
        'slug': 'authentication',
        'label': 'Autenticación',
        'children': [
          {
            'url': '/auth/sign-in',
            'slug': 'pages:auth-sign-in',
            'label': 'Iniciar sesión',
          },
          {
            'url': '/auth/sign-up',
            'slug': 'pages:auth-sign-up',
            'label': 'Registrarse',
          },
          {
            'url': '/auth/reset-pass',
            'slug': 'pages:auth-reset-pass',
            'label': 'Restablecer contraseña',
          },
          {
            'url': '/auth/new-pass',
            'slug': 'pages:auth-new-pass',
            'label': 'Nueva contraseña',
          },
        ],
      },
      {
        'icon': 'alert-triangle',
        'slug': 'error-pages',
        'label': 'Páginas de error',
        'children': [
          {
            'url': '/error/404',
            'slug': 'pages:error-404',
            'label': '404 No encontrado',
          },
          {
            'url': '/error/500',
            'slug': 'pages:error-500',
            'label': '500 Error del servidor',
          },
          {
            'url': '/error/maintenance',
            'slug': 'pages:error-maintenance',
            'label': 'Mantenimiento',
          },
        ],
      },
    ],
  },
]
