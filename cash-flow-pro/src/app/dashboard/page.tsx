import KPIGrid from "@/components/dashboard/KPIGrid";
import CashFlowChart from "@/components/dashboard/CashFlowChart";

export default function DashboardPage() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 mt-2">
                    Your financial command center.
                </p>
            </div>

            {/* KPI Cards */}
            <KPIGrid />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 h-[400px]">
                    <h3 className="text-lg font-semibold text-white mb-4">Cash Flow Trend (8 Weeks)</h3>
                    <div className="h-[320px]">
                        <CashFlowChart />
                    </div>
                </div>

                {/* Recent Activity Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-[400px] flex flex-col">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                    <div className="flex-1 flex items-center justify-center text-slate-500">
                        Coming Soon
                    </div>
                </div>
            </div>
        </div>
    );
}
