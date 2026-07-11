/**
=========================================================
* CRM Inmobiliario — Bandeja unificada de mensajería
=========================================================
* Placeholder generado durante la limpieza inicial del template.
* Pendiente de construir: bandeja de conversaciones (WhatsApp vía Twilio,
* Instagram, Messenger), componiendo `Lists` + `Timeline` del template.
* Ver tablas `channels`/`conversations`/`messages` en crm_schema.sql y
* RF-13 a RF-16 (sección 10.6) del ERS.
=========================================================
*/

// @mui material components
import Card from "@mui/material/Card";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Soft UI Dashboard React examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function Inbox() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Card>
          <SoftBox p={3}>
            <SoftTypography variant="h6">Bandeja de mensajes</SoftTypography>
            <SoftTypography variant="body2" color="text">
              Próximamente: conversaciones de WhatsApp, Instagram y Facebook en un solo
              lugar, vinculadas automáticamente al contacto correspondiente.
            </SoftTypography>
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Inbox;
