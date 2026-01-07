"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, Activity } from "lucide-react";

interface KPI {
    cash: number;
    ar: number;
    ap: number;
    runway: number;
}

export default function KPIGrid() {
    const [data, setData] = useState<KPI | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/dashboard/kpis")
            .then((res) => res.json())
            .then((data) => {
                setData(data);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-slate-900 h-32 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    const cards = [
        {
            title: "Cash Balance",
            value: data?.cash || 0,
            icon: Wallet,
            color: "text-indigo-400",
            bg: "bg-indigo-400/10",
            formatter: formatCurrency,
        },
        {
            title: "Incoming (AR)",
            value: data?.ar || 0,
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            formatter: formatCurrency,
        },
        {
            title: "Outgoing (AP)",
            value: data?.ap || 0,
            icon: TrendingDown,
            color: "text-rose-400",
            bg: "bg-rose-400/10",
            formatter: formatCurrency,
        },
        {
            title: "Runway",
            value: data?.runway || 0,
            icon: Activity,
            color: "text-cyan-400",
            bg: "bg-cyan-400/10",
            formatter: (val: number) => (val >= 999 ? "∞ Weeks" : `${val} Weeks`),
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card) => (
                <div
                    key={card.title}
                    className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:shadow-lg transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 font-medium">{card.title}</h3>
                        <div className={`p-2 rounded-lg ${card.bg}`}>
                            <card.icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {card.formatter(card.value)}
                    </div>
                </div>
            ))}
        </div>
    );
}
