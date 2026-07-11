import { useRef, useState, type FormEvent } from "react";
import { Button } from "src/components/ui/button";
import { Label } from "src/components/ui/label";
import { Input } from "src/components/ui/input";
import { Checkbox } from "src/components/ui/checkbox";
import { Link, useNavigate } from "react-router";

import { useAuth } from "src/context/AuthContext";
import { completeSignup } from "src/lib/api";
import { setPendingTenantName } from "src/lib/pendingTenant";

interface AuthRegisterProps {
  onPendingConfirmation: (email: string) => void;
}

const AuthRegister = ({ onPendingConfirmation }: AuthRegisterProps) => {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [agencyName, setAgencyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreement, setAgreement] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Guardia inmediata contra un doble clic disparando dos signups
    // concurrentes para el mismo usuario.
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
        navigate("/");
      } else {
        // El proyecto exige confirmar el email primero: el tenant se crea en
        // el primer sign-in exitoso (ver AuthContext.completePendingSignup).
        setPendingTenantName(email, agencyName);
        onPendingConfirmation(email);
      }
    } catch (error) {
      setErrorMessage((error as Error).message || "No se pudo completar el registro.");
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="agencyName">Nombre de la agencia</Label>
          </div>
          <Input
            id="agencyName"
            type="text"
            required
            value={agencyName}
            onChange={(event) => setAgencyName(event.target.value)}
            className="form-control form-rounded-xl"
          />
        </div>
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="name">Tu nombre completo</Label>
          </div>
          <Input
            id="name"
            type="text"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="form-control form-rounded-xl"
          />
        </div>
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="emadd">Email</Label>
          </div>
          <Input
            id="emadd"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="form-control form-rounded-xl"
          />
        </div>
        <div className="mb-6">
          <div className="mb-2 block">
            <Label htmlFor="userpwd">Contraseña</Label>
          </div>
          <Input
            id="userpwd"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="form-control form-rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2 mb-6">
          <Checkbox
            id="agreement"
            checked={agreement}
            onCheckedChange={(checked) => setAgreement(checked === true)}
          />
          <Label htmlFor="agreement" className="opacity-90 font-normal cursor-pointer">
            Acepto los <Link to="#" className="text-primary">Términos y Condiciones</Link>
          </Label>
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-white hover:bg-primary/90"
        >
          {submitting ? "Creando agencia..." : "Crear agencia"}
        </Button>
      </form>
    </>
  );
};

export default AuthRegister;
