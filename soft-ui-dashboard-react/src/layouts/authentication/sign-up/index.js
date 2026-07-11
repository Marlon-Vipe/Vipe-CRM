import { useRef, useState } from "react";

// react-router-dom components
import { Link, Navigate, useNavigate } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import SoftAlert from "components/SoftAlert";

// Authentication layout components
import BasicLayout from "layouts/authentication/components/BasicLayout";
import Separator from "layouts/authentication/components/Separator";

// CRM Inmobiliario
import { useAuth } from "context/AuthContext";
import { completeSignup } from "lib/api";
import { setPendingTenantName } from "lib/pendingTenant";

// Images
import curved6 from "assets/images/curved-images/curved14.jpg";

function SignUp() {
  const { signUp, session } = useAuth();
  const navigate = useNavigate();

  const [agencyName, setAgencyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreement, setAgreement] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const isSubmittingRef = useRef(false);

  const handleSetAgreement = () => setAgreement(!agreement);

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Guardia inmediata (no depende del re-render de `submitting`) contra un
    // doble clic disparando dos signups concurrentes para el mismo usuario.
    if (isSubmittingRef.current) return;

    setErrorMessage("");

    if (!agreement) {
      setErrorMessage("Debes aceptar los Términos y Condiciones para continuar.");
      return;
    }
    if (!agencyName.trim()) {
      setErrorMessage("Ingresa el nombre de tu agencia.");
      return;
    }

    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      const { data, error } = await signUp(email, password, {
        data: { full_name: fullName },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.session) {
        // Confirmación de email deshabilitada: ya hay sesión, terminamos el
        // signup creando el tenant de una vez.
        await completeSignup({ accessToken: data.session.access_token, tenantName: agencyName });
        navigate("/dashboard");
      } else {
        // El proyecto exige confirmar el email primero: el tenant se crea en
        // el primer sign-in exitoso (ver AuthContext.completePendingSignup).
        setPendingTenantName(email, agencyName);
        setPendingConfirmation(true);
      }
    } catch (error) {
      setErrorMessage(error.message || "No se pudo completar el registro.");
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (pendingConfirmation) {
    return (
      <BasicLayout title="¡Ya casi!" description="Confirma tu correo para continuar" image={curved6}>
        <Card>
          <SoftBox p={3} textAlign="center">
            <SoftTypography variant="body2" color="text">
              Te enviamos un correo de confirmación a <b>{email}</b>. Confírmalo y luego inicia
              sesión para terminar de crear tu agencia.
            </SoftTypography>
            <SoftBox mt={3}>
              <SoftTypography
                component={Link}
                to="/authentication/sign-in"
                variant="button"
                color="info"
                fontWeight="medium"
              >
                Ir a iniciar sesión
              </SoftTypography>
            </SoftBox>
          </SoftBox>
        </Card>
      </BasicLayout>
    );
  }

  return (
    <BasicLayout
      title="¡Bienvenido!"
      description="Crea tu agencia y empieza a gestionar tus contactos, propiedades y negociaciones."
      image={curved6}
    >
      <Card>
        <SoftBox p={3} mb={1} textAlign="center">
          <SoftTypography variant="h5" fontWeight="medium">
            Crear una agencia nueva
          </SoftTypography>
        </SoftBox>
        <Separator />
        <SoftBox pt={2} pb={3} px={3}>
          {errorMessage && (
            <SoftBox mb={2}>
              <SoftAlert color="error" dismissible>
                {errorMessage}
              </SoftAlert>
            </SoftBox>
          )}
          <SoftBox component="form" role="form" onSubmit={handleSubmit}>
            <SoftBox mb={2}>
              <SoftInput
                placeholder="Nombre de la agencia"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
              />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftInput
                placeholder="Tu nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftInput
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftInput
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </SoftBox>
            <SoftBox display="flex" alignItems="center">
              <Checkbox checked={agreement} onChange={handleSetAgreement} />
              <SoftTypography
                variant="button"
                fontWeight="regular"
                onClick={handleSetAgreement}
                sx={{ cursor: "pointer", userSelect: "none" }}
              >
                &nbsp;&nbsp;Acepto los&nbsp;
              </SoftTypography>
              <SoftTypography component="a" href="#" variant="button" fontWeight="bold" textGradient>
                Términos y Condiciones
              </SoftTypography>
            </SoftBox>
            <SoftBox mt={4} mb={1}>
              <SoftButton type="submit" variant="gradient" color="dark" fullWidth disabled={submitting}>
                {submitting ? "creando agencia..." : "crear agencia"}
              </SoftButton>
            </SoftBox>
            <SoftBox mt={3} textAlign="center">
              <SoftTypography variant="button" color="text" fontWeight="regular">
                ¿Ya tienes una cuenta?&nbsp;
                <SoftTypography
                  component={Link}
                  to="/authentication/sign-in"
                  variant="button"
                  color="dark"
                  fontWeight="bold"
                  textGradient
                >
                  Iniciar sesión
                </SoftTypography>
              </SoftTypography>
            </SoftBox>
          </SoftBox>
        </SoftBox>
      </Card>
    </BasicLayout>
  );
}

export default SignUp;
