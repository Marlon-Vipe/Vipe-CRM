/**
=========================================================
* CRM Inmobiliario — Pantalla de Negociaciones (Pipeline)
=========================================================
* Placeholder generado durante la limpieza inicial del template.
* Pendiente de construir: vista tipo kanban por etapa (pipeline_stages),
* componiendo `Cards` + `Lists` del template — sin introducir librerías de
* UI nuevas, según lo definido en la sección 6 del ERS. Ver tablas `deals`
* y `deal_stage_history` en crm_schema.sql y RF-08/RF-09 del ERS.
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

function Deals() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Card>
          <SoftBox p={3}>
            <SoftTypography variant="h6">Negociaciones</SoftTypography>
            <SoftTypography variant="body2" color="text">
              Próximamente: pipeline visual (kanban) por etapa, con arrastrar y soltar
              entre columnas configurables por agencia.
            </SoftTypography>
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Deals;
