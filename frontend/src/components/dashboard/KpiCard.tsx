import { Icon } from "@iconify/react";

interface KpiCardProps {
  title: string;
  count: number | string;
  icon: string;
}

const KpiCard = ({ title, count, icon }: KpiCardProps) => {
  return (
    <div className="bg-lightprimary rounded-lg p-6 relative w-full">
      <div className="flex items-center gap-3">
        <span className="w-14 h-10 rounded-full flex items-center justify-center bg-primary text-white">
          <Icon icon={icon} height={22} />
        </span>
        <h5 className="text-base opacity-70">{title}</h5>
      </div>
      <h2 className="text-3xl mt-4 font-semibold">{count}</h2>
    </div>
  );
};

export default KpiCard;
