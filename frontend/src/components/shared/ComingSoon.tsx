import { Icon } from "@iconify/react";
import CardBox from "src/components/shared/CardBox";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: string;
}

const ComingSoon = ({ title, description, icon }: ComingSoonProps) => {
  return (
    <CardBox>
      <div className="flex items-center gap-3 mb-3">
        <span className="w-12 h-12 rounded-full flex items-center justify-center bg-lightprimary text-primary">
          <Icon icon={icon} height={24} />
        </span>
        <h5 className="text-xl font-semibold">{title}</h5>
      </div>
      <p className="opacity-70">{description}</p>
    </CardBox>
  );
};

export default ComingSoon;
