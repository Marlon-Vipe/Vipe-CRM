import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "src/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";

const Notification = () => {
    return (
        <div className="relative group/menu">
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={(props) => (
                        <span
                            {...props}
                            className="h-10 w-10 hover:text-primary group-hover/menu:bg-lightprimary group-hover/menu:text-primary hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer relative focus:outline-hidden"
                            aria-label="Notificaciones"
                        >
                            <Icon icon="solar:bell-linear" height={20} />
                        </span>
                    )}
                />
                <DropdownMenuContent className="rounded-sm w-56 p-1" align="start">
                    <div className="px-3 py-3 text-sm opacity-60">No tienes notificaciones nuevas.</div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default Notification;
