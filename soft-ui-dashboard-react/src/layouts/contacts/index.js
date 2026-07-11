/**
=========================================================
* CRM Inmobiliario — Pantalla de Contactos/Leads
=========================================================
* Placeholder generado durante la limpieza inicial del template.
* Pendiente de construir: listado de contactos (reutilizar el componente
* `Table` de examples/Tables/Table, como en layouts/tables), con columnas
* nombre, teléfono, tipo, origen, agente asignado (ver tabla `contacts`
* en crm_schema.sql y RF-06/RF-07 del ERS).
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

function Contacts() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Card>
          <SoftBox p={3}>
            <SoftTypography variant="h6">Contactos</SoftTypography>
            <SoftTypography variant="body2" color="text">
              Próximamente: listado de contactos/leads (nombre, teléfono, origen, agente
              asignado), filtros y detalle con historial de actividades.
            </SoftTypography>
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Contacts;
