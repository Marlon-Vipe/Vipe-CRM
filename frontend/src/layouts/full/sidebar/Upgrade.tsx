import UpgradePlan from "/src/assets/images/backgrounds/upgrade.svg";
import { Button } from "src/components/ui/button";
import { Link } from "react-router";
import { useAuth } from "src/context/AuthContext";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  agencia: "Agencia",
};

const Upgrade = () => {
  const { tenant } = useAuth();
  const planLabel = tenant?.plan ? PLAN_LABELS[tenant.plan] || tenant.plan : "Starter";

  return (
    <>
      <div className="px-5 mt-2 relative">
        <div className="bg-lightprimary py-4 px-5 rounded-xl ">
          <div className="grid grid-cols-12">
            <div className="col-span-7">
              <h6 className="text-base text-dark">Plan {planLabel}</h6>
              <Button
                variant="default"
                className="mt-3 rounded-full font-medium"
                render={<Link to="/billing">Ver facturación</Link>}
              />
            </div>
            <img src={UpgradePlan} alt="" className="absolute h-24 w-24 inset-e-0" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Upgrade;
