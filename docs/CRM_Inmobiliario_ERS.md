# CRM Inmobiliario — Especificación de Requisitos y Arquitectura

**Versión:** 0.3 (documento vivo, para iterar)
**Stack decidido:** React (Soft UI Dashboard React – Creative Tim) + Node.js + Supabase
**Proveedor de mensajería WhatsApp:** Twilio (decidido — ver sección 10)
**Modelo de negocio:** SaaS multi-tenant (uso propio primero, venta a otras inmobiliarias después)

---

## 1. Resumen ejecutivo

El objetivo es construir un CRM Inmobiliario que:

1. Sea usado primero internamente por ti y tu socio (agente inmobiliario).
2. Esté diseñado desde el día 1 como **producto multi-cliente (SaaS)**, para poder vender el acceso a otras inmobiliarias sin rehacer la arquitectura.
3. Use el template **Soft UI Dashboard React** como base de UI, sin desviarse del sistema de diseño existente.

Este documento cubre: modelo de negocio, arquitectura técnica, estrategia multi-tenant, modelo de datos, mapeo de la UI a las pantallas del CRM, especificación de requisitos (ERS), seguridad, hosting y roadmap.

---

## 2. Modelo de negocio

### 2.1 Tipo de producto
SaaS B2B vertical (CRM especializado en el sector inmobiliario), vendido por suscripción a inmobiliarias/agencias.

### 2.2 Unidad de venta
El **tenant** (la inmobiliaria) es la unidad de facturación. Dentro de cada tenant hay múltiples usuarios (agentes, administradores).

### 2.3 Modelo de precios sugerido (a validar con tu socio)
| Plan | Usuarios/agentes incluidos | Propiedades activas | Precio orientativo |
|---|---|---|---|
| Starter | 1–3 | Hasta 50 | Bajo, para captar agencias pequeñas |
| Pro | 4–10 | Hasta 300 | Precio medio, plan objetivo principal |
| Agencia | 11+ | Ilimitado | Precio alto, negociado |

Variables a decidir con tu socio (no técnicas, pero condicionan el diseño):
- ¿Cobro por agente activo, por rango de propiedades, o tarifa plana?
- ¿Trial gratuito? ¿Cuántos días?
- ¿Facturación mensual o anual con descuento?

### 2.4 Onboarding de nuevos tenants
Debe ser **autoservicio** desde el inicio (registro → creación automática del tenant → invitación de agentes), aunque al principio lo hagas manualmente para las primeras agencias. Diseñar el flujo de alta desde ya evita rehacerlo cuando llegue el primer cliente externo.

---

## 3. Arquitectura general

```
┌─────────────────────────────┐
│  Frontend (SPA)             │
│  React + MUI                │
│  Soft UI Dashboard React    │
│  Hosting: Vercel            │
└──────────────┬───────────────┘
               │ HTTPS / REST (JSON)
               ▼
┌─────────────────────────────┐
│  Backend API                │
│  Node.js + Express          │
│  Lógica de negocio,         │
│  validación multi-tenant,   │
│  integraciones (Stripe,     │
│  storage, notificaciones)   │
│  Hosting: Railway           │
└──────────────┬───────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Supabase                   │
│  - Postgres (datos)         │
│  - Auth (usuarios)          │
│  - Storage (fotos/documentos)│
│  - Row-Level Security       │
└─────────────────────────────┘
```

### 3.1 Por qué esta separación
- El template Soft UI Dashboard React es un **CRA (Create React App) puro**, sin backend embebido — es exactamente un frontend SPA, lo cual encaja perfecto con desplegarlo como sitio estático en Vercel.
- Tener un backend Node.js propio (en vez de que el frontend hable directo con Supabase) te da un lugar central para:
  - Validar reglas de negocio antes de tocar la base de datos.
  - Integrar Stripe/pagos sin exponer lógica sensible en el cliente.
  - Centralizar lógica multi-tenant compleja (ej. límites de plan, agregación de reportes).
- Supabase sigue haciendo el trabajo pesado de autenticación, base de datos y Row-Level Security, evitando que reinventes eso a mano.

### 3.2 Alternativa más simple (a considerar)
Si quieres avanzar más rápido al inicio, el frontend puede hablar **directo con Supabase** (usando su SDK JS) para operaciones CRUD simples, y reservar el backend Node.js solo para lo que Supabase no resuelve bien (webhooks de pago, envío de emails, lógica compleja de reportes). Esto reduce el código a mantener en la fase inicial. Lo puedes decidir por módulo, no es todo o nada.

---

## 4. Estrategia Multi-tenant

### 4.1 Opciones y por qué elegir una

| Estrategia | Descripción | Pros | Contras |
|---|---|---|---|
| **Base de datos por tenant** | Cada inmobiliaria tiene su propia base de datos | Aislamiento total | Caro y complejo de mantener a escala; migraciones x N bases |
| **Schema por tenant** | Una base, un schema Postgres por tenant | Buen aislamiento | Postgres no escala bien a cientos de schemas; complica migraciones |
| **Schema compartido + `tenant_id` + RLS** ✅ | Una sola base, una columna `tenant_id` en cada tabla, políticas de Row-Level Security que filtran automáticamente | Simple de mantener, escala bien, Supabase lo soporta nativamente | Requiere disciplina: **toda** query debe respetar el filtro de tenant |

**Recomendación:** Schema compartido + `tenant_id` + RLS. Es el estándar de facto para SaaS B2B de este tamaño, y Supabase está construido pensando exactamente en este patrón.

### 4.2 Cómo se implementa en Supabase (concepto, no código todavía)
1. Cada usuario autenticado tiene un `tenant_id` asociado (guardado en una tabla `memberships` o en los `custom claims` del JWT de Supabase Auth).
2. Cada tabla de negocio (`properties`, `contacts`, `deals`, etc.) tiene una columna `tenant_id`.
3. Se crean **políticas RLS** en Postgres del tipo: *"un usuario solo puede leer/escribir filas donde `tenant_id` = su propio tenant"*.
4. El backend Node.js, aunque use una service key con más privilegios, **replica esa misma validación** en su lógica como segunda capa de seguridad (nunca confiar solo en el frontend).

### 4.3 Roles dentro de un tenant
- **Owner/Admin de agencia**: gestiona usuarios, ve todo, configura la cuenta y facturación.
- **Agente**: ve y gestiona sus propios leads/propiedades (o todos, según configuración de la agencia).
- **(Futuro) Super-admin de la plataforma**: tu rol, para soporte y administración global entre tenants — vive fuera del esquema RLS normal.

---

## 5. Modelo de datos (entidades principales)

```
tenants
 ├─ id, nombre, plan, fecha_alta, estado (activo/suspendido)

users (Supabase Auth) ─┬─ memberships (user_id, tenant_id, rol)
                        │
properties
 ├─ id, tenant_id, titulo, tipo (venta/alquiler), precio,
 │  direccion, sector, ciudad, estatus (disponible/reservada/vendida),
 │  agente_asignado_id, creado_en
 └─ property_images (property_id, url, orden)

contacts (leads/clientes)
 ├─ id, tenant_id, nombre, telefono, email, origen (web/referido/portal),
 │  tipo (comprador/vendedor/arrendatario), agente_asignado_id

deals (negociaciones — vincula contact + property)
 ├─ id, tenant_id, contact_id, property_id, etapa_pipeline,
 │  valor_estimado, fecha_cierre_estimada

pipeline_stages
 ├─ id, tenant_id, nombre, orden (personalizable por agencia)

activities (tareas/seguimientos)
 ├─ id, tenant_id, deal_id o contact_id, tipo (llamada/visita/email),
 │  fecha, estado (pendiente/completada), asignado_a

documents
 ├─ id, tenant_id, deal_id, nombre, url_storage, tipo (contrato/cedula/etc.)

subscriptions (facturación SaaS)
 ├─ id, tenant_id, plan, estado, stripe_customer_id, renueva_en
```

Este modelo es el punto de partida para el ERD detallado; lo iteramos cuando quieras entrar a nivel de tablas SQL reales.

---

## 6. Mapeo del template Soft UI Dashboard React a pantallas del CRM

Basado en la estructura real del template (carpeta `src/layouts`):

| Pantalla del template | Uso en el CRM |
|---|---|
| `dashboard` | KPIs generales: leads nuevos, propiedades activas, negociaciones por etapa, ingresos estimados del pipeline |
| `tables` | Listados: propiedades, contactos/leads, negociaciones (usando los componentes `Tables` de `examples`) |
| `profile` | Perfil del agente (datos personales, propiedades asignadas, actividad reciente) |
| `billing` | Facturación de la suscripción SaaS de la agencia (plan actual, historial de pagos) — encaja perfecto ya que el template ya trae esta pantalla |
| `authentication/sign-in` y `sign-up` | Login y registro — aquí se debe insertar la lógica multi-tenant: sign-up crea un tenant nuevo o une al usuario a uno existente vía invitación |
| `rtl` | No aplica a tu caso (soporte de idiomas RTL), se puede eliminar del proyecto |
| `virtual-reality` | Página de ejemplo sin uso real, se elimina |

Pantallas **nuevas** que no vienen en el template y hay que construir reutilizando sus componentes (`SoftBox`, `SoftButton`, `SoftInput`, `Cards`, `Timeline`):
- Detalle de propiedad (galería de fotos, info, historial de visitas)
- Pipeline visual de negociaciones (tipo kanban, usando `Cards` + `Lists`)
- Detalle de contacto/lead (historial de actividades, usando el componente `Timeline` que ya trae el template)
- Configuración de la agencia (roles, pipeline personalizado, invitar agentes)

**Regla de diseño clave:** todo lo nuevo se construye componiendo `SoftBox`, `SoftButton`, `SoftTypography`, etc. ya existentes — no se introducen librerías de UI nuevas ni estilos por fuera del theme de MUI que trae el template. Esto es exactamente lo que pediste: no salirte del diseño base.

---

## 7. Especificación de Requisitos de Software (ERS) — versión inicial

### 7.1 Actores
- **Super-admin** (tú/plataforma)
- **Admin de agencia** (dueño/gerente de la inmobiliaria cliente)
- **Agente** (usuario final que gestiona leads y propiedades)

### 7.2 Requisitos funcionales (RF)

**Gestión de cuentas y acceso**
- RF-01: El sistema debe permitir el registro de una nueva agencia (tenant) con un usuario administrador.
- RF-02: El admin de agencia debe poder invitar agentes por email.
- RF-03: El sistema debe restringir el acceso a los datos exclusivamente al tenant del usuario autenticado.

**Gestión de propiedades**
- RF-04: El sistema debe permitir crear, editar, eliminar y listar propiedades con fotos.
- RF-05: El sistema debe permitir filtrar propiedades por estatus, tipo, sector y agente asignado.

**Gestión de contactos/leads**
- RF-06: El sistema debe permitir registrar contactos con su origen y tipo.
- RF-07: El sistema debe permitir asignar un contacto a un agente.

**Pipeline de negociaciones**
- RF-08: El sistema debe permitir mover una negociación entre etapas configurables del pipeline.
- RF-09: El sistema debe registrar el historial de cambios de etapa (auditoría básica).

**Actividades y seguimiento**
- RF-10: El sistema debe permitir crear tareas/actividades ligadas a un contacto o negociación, con fecha y responsable.

**Facturación SaaS**
- RF-11: El sistema debe mostrar el plan actual del tenant y su estado de pago.
- RF-12: El sistema debe restringir funcionalidades/límites según el plan contratado (ej. número de agentes o propiedades).

### 7.3 Requisitos no funcionales (RNF)
- RNF-01 (Seguridad): Aislamiento estricto de datos entre tenants mediante RLS, verificado en pruebas automatizadas antes de cada release.
- RNF-02 (Disponibilidad): Objetivo inicial de 99% de uptime (aceptable en fase inicial con Railway/Vercel/Supabase gestionados).
- RNF-03 (Escalabilidad): La arquitectura debe soportar crecimiento de tenants sin cambios estructurales (validado por el patrón `tenant_id` + RLS).
- RNF-04 (Usabilidad): Toda pantalla nueva debe usar exclusivamente los componentes del theme Soft UI Dashboard React.
- RNF-05 (Portabilidad de datos): Debe existir una forma de exportar los datos de un tenant (para cumplir buenas prácticas SaaS y dar confianza a clientes).
- RNF-06 (Cumplimiento): Manejo de datos personales de clientes conforme a buenas prácticas de protección de datos aplicables en República Dominicana.

---

## 8. Hosting y DevOps

| Componente | Servicio | Notas |
|---|---|---|
| Frontend (build estático de CRA) | **Vercel** | Deploy automático por push a `main`, preview deployments por PR |
| Backend Node.js/Express | **Railway** | Fácil de escalar verticalmente al inicio, variables de entorno por ambiente |
| Base de datos, Auth, Storage | **Supabase** | Plan gratuito alcanza para el MVP; upgrade cuando haya tenants reales |
| Pagos/Suscripciones | **Stripe** (a integrar en Fase 2) | Maneja planes, webhooks de estado de pago |
| CI/CD | **GitHub Actions** | Lint + tests antes de cada deploy |

### 8.1 Ambientes recomendados
- `development` (local)
- `staging` (para probar con tu socio antes de producción)
- `production`

Cada uno con su propio proyecto Supabase (o al menos su propio esquema/variables), para no mezclar datos de prueba con datos reales de agencias.

---

## 9. Roadmap por fases

**Fase 0 — Fundacional (1–2 semanas)**
- Setup del repo, template Soft UI limpio de páginas no usadas (`rtl`, `virtual-reality`).
- Setup de Supabase: esquema base con `tenant_id` en todas las tablas + políticas RLS.
- Autenticación con creación de tenant en el sign-up.

**Fase 1 — MVP funcional para uso interno**
- CRUD de propiedades, contactos, negociaciones (pipeline básico), actividades.
- Un solo tenant real (tu agencia) usándolo en producción.

**Fase 2 — Multi-tenant real + Billing**
- Onboarding autoservicio de nuevas agencias.
- Integración de Stripe y límites por plan.
- Invitación de agentes por email.

**Fase 3 — Diferenciación y venta**
- Reportes/dashboards avanzados.
- Integraciones con portales inmobiliarios (Supercasas, Encuentra24, etc., según tu mercado).
- Automatizaciones (recordatorios, notificaciones).

---

## 10. Integraciones de mensajería (Meta: WhatsApp, Instagram, Facebook)

Esto es un componente central del producto, no un "extra" — para una inmobiliaria, WhatsApp suele ser el canal donde realmente se cierran los leads. Lo trato con el mismo nivel de detalle que el resto de la arquitectura.

### 10.1 Qué ofrece Meta y cuál te conviene

Meta agrupa estos canales bajo su plataforma de mensajería para negocios:

| Canal | API relevante | Notas |
|---|---|---|
| WhatsApp | WhatsApp Business Platform — **Cloud API** | Es la única versión vigente recomendada por Meta; está alojada por Meta, por lo que <cite index="10-1">no necesitas servidores propios ni infraestructura compleja para operar</cite>. |
| Instagram | Instagram Messaging API (Messenger Platform) | Para DMs de Instagram vinculadas a la página/cuenta de negocio de la inmobiliaria |
| Facebook | Messenger Platform | Para mensajes de la página de Facebook de la inmobiliaria |

Los tres comparten el mismo modelo conceptual: **webhooks** para mensajes entrantes + **endpoints REST** para enviar mensajes, todo colgado del **Meta Business Manager / Portafolio del negocio** de cada agencia.

### 10.2 Decisión: Twilio como BSP

Tu arquitectura SaaS necesita que **cada agencia (tenant) conecte su propia cuenta de WhatsApp Business**, y aquí es donde Meta exige uno de dos caminos: ser Tech Provider directo ante Meta, o pasar por un BSP (Business Solution Provider). Un BSP no es "menos oficial": es un proveedor autorizado por Meta, y el número sigue siendo de la empresa cliente.

**Decisión tomada: Twilio.**

Se comparó Twilio contra 360dialog (el otro BSP evaluado) con una simulación de costos usando las tarifas vigentes de Meta en 2026 y el volumen esperado de mensajes de una agencia inmobiliaria típica (mezcla de mensajes de servicio gratuitos, notificaciones de tipo utility y campañas de marketing). Resultado:

- Twilio no cobra cuota fija mensual por número; cobra $0.005 por mensaje (entrante o saliente), además de la tarifa de plantilla de Meta que aplique.
- 360dialog cobra una licencia mensual fija por número (~$49/mes) más las tarifas de Meta sin markup.
- Con el volumen esperado por agencia en las primeras fases del producto (cientos a pocos miles de mensajes/mes), **el costo variable de Twilio resulta más bajo que la cuota fija de 360dialog** — el punto de equilibrio está alrededor de ~9,800 mensajes/mes por número, un volumen que la mayoría de agencias individuales no alcanza en el corto/mediano plazo.
- Twilio además unifica en la misma plataforma otros canales (SMS, Messenger) bajo su Conversations API, lo cual dejamos como opción abierta para el futuro (sección 10.1).

**Nota para revisar más adelante:** si alguna agencia cliente crece a un volumen muy alto de campañas de marketing masivas, vale la pena recalcular el costo real con su volumen específico — a esa escala 360dialog puede volver a ser competitivo. Esto no cambia la arquitectura, solo el proveedor de mensajería por tenant, así que el cambio de proveedor (si llegara a necesitarse) no debería requerir rediseño del modelo de datos de la sección 10.4.

### 10.3 Requisitos que cada agencia (tenant) deberá cumplir
- Estar legalmente constituida y completar la **verificación de negocio de Meta** — este proceso confirma que <cite index="2-1">el negocio es una entidad legal real</cite> antes de aprobar el portafolio comercial.
- Tener o crear un **Meta Business Manager (Portafolio del negocio)** con permisos de administrador.
- Un **número de teléfono dedicado** que no esté siendo usado en la app normal de WhatsApp o WhatsApp Business al momento de la migración (o usar la opción de *Coexistence* si quieren mantener el número actual con historial).
- Página de Facebook vinculada (para Messenger e Instagram Business).
- Plantillas de mensaje pre-aprobadas por Meta para poder iniciar conversaciones fuera de la ventana de 24 horas (por ejemplo: confirmaciones de citas de visita).

Importante para el discurso de venta a otras agencias: sin verificación de negocio, el límite de envíos es muy bajo (pensado para pruebas, no producción), así que conviene dejar claro desde el onboarding que la verificación es parte del setup, no opcional.

### 10.4 Cómo encaja en tu modelo de datos
Agregar al modelo de la sección 5:

```
channels (canales conectados por tenant)
 ├─ id, tenant_id, tipo (whatsapp/instagram/messenger),
 │  proveedor (bsp_twilio por defecto; se deja como campo abierto
 │  para no acoplar el esquema a un solo proveedor si más adelante
 │  se agrega 360dialog u otro para agencias de alto volumen),
 │  identificador_externo (phone_number_id / Twilio Sender SID, page_id, etc.), estado

conversations
 ├─ id, tenant_id, channel_id, contact_id, ultimo_mensaje_en, estado (abierta/cerrada)

messages
 ├─ id, tenant_id, conversation_id, direccion (entrante/saliente),
 │  tipo (texto/imagen/plantilla), contenido, enviado_por (agente_id o "bot"),
 │  estado_entrega (enviado/entregado/leido/fallido), creado_en
```

Cada `conversation` se vincula a un `contact` existente (o crea uno automáticamente si el número no está registrado — esto es clave para no perder leads que escriben primero por WhatsApp antes de existir en el CRM).

### 10.5 Cómo encaja en la arquitectura técnica (sección 3)
- El **backend Node.js** es donde vive el endpoint de webhook (`/webhooks/whatsapp`, `/webhooks/instagram`) que recibe los mensajes entrantes de Meta/BSP y los guarda en Supabase, asociándolos al `tenant_id` correcto según el número/canal que los recibió.
- El **frontend (Soft UI Dashboard)** necesita una nueva vista de **bandeja unificada** (inbox): esto se construye reutilizando los componentes de listas y chat-like UI del template (`Lists`, `SoftBox`, `Timeline`) — no requiere un componente nuevo fuera del sistema de diseño.
- Se recomienda un canal en **tiempo real** (Supabase Realtime, incluido de fábrica) para que los mensajes entrantes aparezcan en el inbox sin refrescar la página.

### 10.6 Actualización a la ERS (sección 7)
Nuevos requisitos funcionales:
- RF-13: El sistema debe permitir a cada agencia conectar su propia cuenta de WhatsApp Business (vía BSP o Embedded Signup).
- RF-14: El sistema debe mostrar una bandeja unificada de conversaciones (WhatsApp, Instagram, Facebook) por agente y por agencia.
- RF-15: El sistema debe vincular automáticamente cada conversación entrante a un contacto existente o crear uno nuevo.
- RF-16: El sistema debe permitir enviar plantillas aprobadas cuando la ventana de 24 horas de conversación gratuita haya expirado.

Nuevo requisito no funcional:
- RNF-07: El manejo de tokens y credenciales de Meta por tenant debe estar cifrado en reposo y nunca expuesto al frontend.

### 10.7 Costos a tener en cuenta en tu modelo de precios (sección 2)

Desde julio de 2025, Meta cobra **por mensaje de plantilla entregado** (no por conversación de 24h como antes). Los mensajes de servicio (el cliente escribe primero, tú respondes dentro de la ventana) siguen siendo gratis e ilimitados.

Con **Twilio** como proveedor decidido, el costo variable por tenant queda así (tarifas representativas, a validar con la calculadora oficial):
- Fee de Twilio: $0.005 por mensaje, entrante o saliente, sin importar la categoría.
- Fee de Meta: solo aplica a mensajes de plantilla (marketing/utility/authentication) que caen fuera de la ventana gratuita de servicio.
- No hay cuota fija mensual por número — el costo escala directamente con el volumen de cada agencia, lo cual conviene reflejar como "conversaciones/mensajes incluidos" por plan en la tabla de la sección 2 (ej. "Plan Starter incluye X mensajes de plantilla/mes, adicionales a $Y c/u").

Esto significa que tu costo variable por tenant **no es cero**, pero a los volúmenes esperados en las primeras fases es bajo (unos pocos dólares por agencia al mes) — no es un factor que deba inflar mucho el precio de los planes iniciales.

---

## 11. Casos de uso detallados

Los RF de la sección 7 dicen *qué* debe hacer el sistema; aquí se detalla *cómo se ve el flujo* para los casos más importantes.

**UC-01 — Registro de una nueva agencia**
- Actor: futuro admin de agencia.
- Precondición: no tiene cuenta.
- Flujo: (1) completa formulario de signup con datos de la agencia → (2) backend llama a `create_tenant_with_owner()` → (3) se crean tenant, membership 'owner', pipeline_stages por defecto y suscripción en trial → (4) usuario cae en el dashboard vacío.
- Postcondición: tenant activo en estado 'trial'.
- Alternativo: email ya registrado → error de validación antes de crear nada.

**UC-02 — Invitar a un agente**
- Actor: owner/admin de agencia.
- Flujo: (1) admin ingresa el email del agente en Configuración → (2) backend crea un registro de invitación y envía email → (3) el agente hace clic, crea su contraseña → (4) se crea su `membership` con rol 'agent' vinculada al mismo tenant.
- Postcondición: agente puede iniciar sesión y solo ve datos de ese tenant.

**UC-03 — Un lead escribe por WhatsApp por primera vez**
- Actor: sistema (automático, disparado por webhook).
- Precondición: la agencia ya conectó su número de WhatsApp (canal activo).
- Flujo: (1) Twilio recibe el mensaje y lo reenvía al webhook del backend → (2) backend busca un `contact` con ese teléfono en ese tenant → (3) si no existe, lo crea con `source='whatsapp'` → (4) crea o reabre la `conversation` → (5) inserta el `message` → (6) el trigger `update_conversation_on_new_message` actualiza `last_message_at` → (7) aparece en la bandeja unificada del agente asignado (o sin asignar, visible para todos según configuración).
- Postcondición: ningún lead que escribe primero se pierde sin registrar.

**UC-04 — Crear una negociación y moverla por el pipeline**
- Actor: agente.
- Flujo: (1) desde un contacto o propiedad, el agente crea un `deal` → (2) el trigger `log_deal_stage_initial` registra la etapa de entrada → (3) el agente arrastra la tarjeta a otra columna del kanban → (4) el trigger `log_deal_stage_change` registra el cambio en `deal_stage_history`.
- Postcondición: historial completo de avance de cada negociación, sin que el agente tenga que hacer nada extra.

**UC-05 — Enviar una plantilla fuera de la ventana de 24 horas**
- Actor: agente.
- Precondición: la última respuesta del lead fue hace más de 24h.
- Flujo: (1) el agente intenta escribir libremente → (2) la UI detecta que la ventana cerró y obliga a elegir una plantilla aprobada → (3) se envía vía Twilio → (4) Meta cobra la tarifa correspondiente a la categoría de la plantilla.
- Postcondición: se evita el error de "mensaje fuera de ventana" y el agente entiende por qué debe usar una plantilla.

**UC-06 — Pago/vencimiento de suscripción**
- Actor: owner de agencia / Stripe (webhook).
- Flujo: (1) Stripe cobra la renovación mensual → (2) webhook actualiza `subscriptions.status` → (3) si el pago falla, el estado pasa a 'vencida' y el backend restringe funciones según lo definido en RF-12.
- Postcondición: el acceso del tenant refleja su estado de pago real, sin intervención manual.

---

## 12. Criterios de aceptación (requisitos clave)

| Requisito | Criterio de aceptación |
|---|---|
| RF-01 | Dado un formulario de signup completo, al enviarlo se crea el tenant, el owner y las 4 etapas de pipeline por defecto en una sola operación atómica (si algo falla, no queda un tenant a medias). |
| RF-03 | Dado un usuario del tenant A autenticado, una consulta directa a la API nunca debe poder devolver filas con `tenant_id` del tenant B, ni manipulando parámetros desde el cliente. |
| RF-06 | Dado un mensaje entrante de un número no registrado, se crea un contacto con `source='whatsapp'` en menos de 5 segundos desde la recepción del webhook. |
| RF-08 | Dado un deal en la etapa "Visita agendada", al moverlo a "Oferta" debe existir un registro nuevo en `deal_stage_history` con el `from_stage_id` y `to_stage_id` correctos. |
| RF-12 | Dada una suscripción en estado 'vencida', el sistema debe bloquear la creación de nuevas propiedades/contactos pero permitir seguir viendo los datos existentes (nunca borrar nada por falta de pago). |
| RF-15 | Dado un mensaje entrante con un teléfono que coincide (exacto, con normalización de formato internacional) con un contacto existente, la conversación se vincula a ese contacto y no se crea uno duplicado. |
| RF-16 | Dado que la ventana de servicio expiró, un intento de enviar un mensaje libre (no plantilla) debe fallar de forma controlada y sugerir una plantilla aprobada, no un error genérico de la API. |

*(El resto de los RF de la sección 7 pueden documentarse con el mismo formato conforme se van implementando — este set cubre los que tienen más riesgo de implementarse "a medias".)*

---

## 13. Alcance del MVP — qué entra y qué no

**Dentro de la Fase 1 (uso interno):**
- CRUD de contactos, propiedades, negociaciones, actividades.
- Un solo tenant real, sin onboarding de terceros todavía.
- Autenticación básica (sin invitación de agentes aún, ya que son solo ustedes dos).

**Dentro de la Fase 2 (multi-tenant + venta):**
- Onboarding autoservicio, invitación de agentes, facturación con Stripe.
- Conexión de WhatsApp por agencia vía Twilio.

**Explícitamente fuera de alcance por ahora (para que tu socio no los espere pronto):**
- Chatbot o respuestas automáticas con IA en WhatsApp.
- Integraciones con portales inmobiliarios (Supercasas, Encuentra24) — quedó en Fase 3, sin fecha.
- Aplicación móvil nativa (solo web responsive).
- Reportes/analítica avanzada más allá de KPIs básicos del dashboard.
- Soporte multi-idioma (el producto es en español, sin i18n).
- Firma electrónica de contratos.
- Múltiples monedas por transacción (se maneja `currency` por propiedad, pero no conversión automática ni consolidación multi-moneda en reportes).

---

## 14. Registro de riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Meta suspende o restringe un número de WhatsApp de una agencia por incumplir políticas (spam, plantillas mal categorizadas) | Media | Alto (la agencia pierde su canal principal) | Validar plantillas antes de enviarlas a revisión; monitorear la calidad del número desde el dashboard de Twilio; documentar para el cliente qué NO debe hacer (mensajes masivos sin opt-in). |
| Bug en una política RLS expone datos de un tenant a otro | Baja (si se sigue el patrón de la sección 7 del ERD) | Muy alto (pérdida de confianza total) | Escribir tests automatizados que verifiquen aislamiento entre tenants antes de cada release (RNF-01). |
| Dependencia de Twilio (vendor lock-in) | Media | Medio | El campo `provider` en `channels` ya deja la puerta abierta a otro BSP sin rediseñar el esquema (sección 10.2). |
| Cambio de tarifas de Meta reduce el margen por tenant | Media (Meta ajusta tarifas trimestralmente) | Medio | Revisar el costo real cada trimestre contra los planes de precio vigentes. |
| Una agencia no completa la verificación de negocio de Meta y no puede operar en producción | Alta si no se explica bien en el onboarding | Medio | Dejar la verificación como paso obligatorio y explicado en el flujo de conexión de WhatsApp, no como nota al pie. |
| Supabase free tier se queda corto al crecer (límites de conexiones/almacenamiento) | Media, a mediano plazo | Bajo-medio (solución conocida: upgrade de plan) | Monitorear uso y presupuestar el upgrade a plan Pro desde la sección 16. |
| Dependencia del conocimiento del negocio inmobiliario en una sola persona (el socio) | Media | Alto para las decisiones de producto | Documentar reglas de negocio (como este ERS) en vez de dejarlas solo en la cabeza de una persona. |
| Competencia de CRMs inmobiliarios ya establecidos (kvCORE, Wise Agent, u otros locales) | Alta | Medio | Es un riesgo de negocio, no técnico — la integración profunda de WhatsApp para el mercado dominicano es la diferenciación a validar con clientes reales. |

---

## 15. Estimado de costos de infraestructura

Escenario: fase inicial, 1 a 5 agencias activas, volumen bajo-medio de mensajería (ver simulación de la sección 10).

| Servicio | Costo estimado/mes | Nota |
|---|---|---|
| Supabase | $0 (plan Free) inicialmente → ~$25/mes (plan Pro) al crecer | El Free tier alcanza para el MVP interno; el Pro se vuelve necesario por backups diarios y más almacenamiento. |
| Railway (backend Node.js) | ~$5–20/mes | Depende del uso de CPU/RAM del plan hobby/starter. |
| Vercel (frontend) | $0 (plan Hobby) | Suficiente para un sitio estático de este tamaño; solo se paga si se necesitan features de equipo. |
| Twilio (WhatsApp) | ~$5–30/mes por agencia según volumen | Ver simulación detallada en la sección 10. |
| Dominio | ~$1–2/mes (prorrateado) | Costo anual típico de un dominio .com o .do. |
| **Total estimado (1–5 agencias, fase inicial)** | **~$35–100/mes** | Escala principalmente con el número de agencias activas y su volumen de mensajería, no con el tráfico web. |

Este estimado es para validar márgenes junto con el modelo de precios de la sección 2 — no lo tomes como cotización final, los precios de Supabase/Railway/Vercel cambian y conviene reverificarlos antes de comprometerse.

---

## 16. Pendientes de decisión externa (no resolubles solo con este documento)

Estos dos puntos requieren una conversación de negocio/legal, no una decisión técnica — se documentan aquí para que el ERS quede completo, con un espacio claro para llenar cuando se resuelvan.

**16.1 Modelo de precios final**
Pendiente de decidir con tu socio (ver sección 2.3):
- [ ] ¿Cobro por agente activo, por rango de propiedades, o tarifa plana?
- [ ] ¿Trial gratuito? ¿Cuántos días?
- [ ] ¿Facturación mensual o anual con descuento?
- [ ] ¿Quién paga el costo variable de Twilio — se incluye en el plan o se cobra aparte?

**16.2 Aspectos legales y de cumplimiento**
Borrador inicial listo — ver `Terminos_de_Servicio_borrador.docx` y `Politica_de_Privacidad_borrador.docx`. **Esto no sustituye la revisión de un abogado licenciado en República Dominicana** antes de usarse con la primera agencia externa. Pendiente:
- [x] Términos de Servicio (borrador) para las agencias clientes.
- [x] Política de privacidad (borrador) — qué datos se recolectan, dónde se almacenan, tabla de sub-encargados (Supabase/AWS, Twilio, procesador de pagos).
- [x] Definición de responsable vs. encargado del tratamiento de datos, conforme a la **Ley 172-13 sobre Protección de Datos Personales** de República Dominicana (sección 2 de la Política de Privacidad).
- [ ] Revisión por un abogado dominicano de ambos borradores, en particular de la sección de transferencia internacional de datos (dónde aloja Supabase los datos exactamente) y de los plazos/montos entre corchetes `[ASÍ]` que hay que completar.
- [ ] Acuerdo de procesamiento de datos formal con Twilio/Supabase/Stripe como sub-encargados (más allá de lo descrito en la Política de Privacidad).
- [ ] Política de retención y eliminación de datos si una agencia cancela — ya está esbozada en el borrador (sección 9), falta validar los plazos con el abogado.

---

## 17. Próximos pasos sugeridos

1. Validar el modelo de precios y los límites por plan con tu socio — ver sección 16.1 (checklist listo para completar).
2. ~~Diseñar el ERD detallado a nivel SQL~~ — Resuelto: ver `crm_schema.sql` (tablas, tipos, políticas RLS, triggers de auditoría y la función de creación de tenant en el signup).
3. ~~Definir las políticas RLS exactas en Supabase~~ — Resuelto en el mismo archivo (sección 7).
4. ~~Limpiar el template Soft UI Dashboard React~~ — Resuelto: ver `soft-ui-dashboard-react-crm-base.zip` (se quitaron `rtl` y `virtual-reality`, se agregaron los layouts placeholder `contacts`, `properties`, `deals` e `inbox`, y además se removió la infraestructura de tema RTL que quedaba huérfana en `App.js` — `stylis-plugin-rtl`, `theme-rtl.js`, `CacheProvider`/`createCache` de emotion — ya que ningún control de la UI la activaba. Verificado con un build real (`npm run build`) sin errores.
5. ~~Decidir proveedor de mensajería~~ — Resuelto: **Twilio** (ver sección 10.2). Siguiente paso: iniciar el proceso de Tech Provider/ISV de Twilio (creación del Meta app + Partner Solution, sección 10.2) mientras se avanza en las Fases 0–1 del roadmap.
6. ~~Casos de uso, criterios de aceptación, alcance del MVP, riesgos y costos de infraestructura~~ — Resuelto: ver secciones 11 a 15.
7. Buscar asesoría legal local para resolver los puntos de la sección 16.2 antes de vender a la primera agencia externa.

---

*Documento en v0.3 — cubre negocio, arquitectura, ERD, ERS, mensajería, casos de uso, criterios de aceptación, alcance, riesgos y costos. Quedan dos pendientes que solo se resuelven fuera de este documento: el modelo de precios final (sección 16.1) y los aspectos legales (sección 16.2).*
