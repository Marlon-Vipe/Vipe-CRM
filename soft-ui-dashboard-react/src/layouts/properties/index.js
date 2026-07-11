/**
=========================================================
* CRM Inmobiliario — Pantalla de Propiedades
=========================================================
* Placeholder generado durante la limpieza inicial del template.
* Pendiente de construir: listado de propiedades con fotos, filtros por
* estatus/tipo/sector, y detalle de propiedad (galería + historial de
* visitas). Ver tabla `properties`/`property_images` en crm_schema.sql
* y RF-04/RF-05 del ERS.
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

function Properties() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Card>
          <SoftBox p={3}>
            <SoftTypography variant="h6">Propiedades</SoftTypography>
            <SoftTypography variant="body2" color="text">
              Próximamente: listado de propiedades (precio, tipo, estatus, sector),
              galería de fotos y detalle individual.
            </SoftTypography>
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Properties;
