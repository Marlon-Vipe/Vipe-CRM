import { Link } from "react-router";

const FullLogo = () => {
  return (
    <Link to={"/"} className="flex items-center gap-2">
      <span className="text-xl font-bold text-primary">Vipe CRM</span>
    </Link>
  );
};

export default FullLogo;
