import { FC } from 'react';
import { Outlet } from "react-router";
import ScrollToTop from 'src/components/shared/ScrollToTop';
import Sidebar from './sidebar/Sidebar';
import Header from './header/Header';



const FullLayout: FC = () => {
  return (
    <>
      <div className="flex w-full bg-background min-h-[calc(100vh-65px)]">
        <div className="page-wrapper flex w-full">
          {/* Header/sidebar */}
          <Sidebar />
          <div className="page-wrapper-sub flex flex-col w-full ">
            {/* Top Header  */}
            <Header />
            <div className={`h-full`}>
              {/* Body Content  */}
              <div className={`w-full`}>
                <ScrollToTop>
                  <div className="container py-30">
                    <Outlet />
                  </div>
                </ScrollToTop>
              </div>
            </div>
            <div className="bg-background text-center mt-auto">
              <p className="text-base pb-10 opacity-60">© {new Date().getFullYear()} Vipe CRM</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FullLayout;
