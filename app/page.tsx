

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/components/ui/sidebar/app-sidebar";
import Header from "./components/Header";
import dynamic from "next/dynamic";

const NewsSection = dynamic(
  () => import("./components/NewsSection").then((mod) => mod.default),
  { ssr: true }
);

interface HomeProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function  Home(props: HomeProps)  {
  const query = await props.searchParams

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <Header />
        <AppSidebar />
        <SidebarInset>
          {/* NewsSection is now a server component */}
          <NewsSection searchParams={query} />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export default Home;