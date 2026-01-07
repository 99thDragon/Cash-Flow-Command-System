import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100">
            <Sidebar />
            <main className="flex-1 lg:p-8 p-4 pt-20 lg:pt-8 w-full max-w-7xl mx-auto overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
