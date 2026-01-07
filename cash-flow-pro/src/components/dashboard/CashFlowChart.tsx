"use client";

import { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { formatCurrency } from "@/lib/utils";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface ChartDataPoint {
    label: string;
    ar: number;
    ap: number;
    net: number;
}

export default function CashFlowChart() {
    const [data, setData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/dashboard/chart")
            .then((res) => res.json())
            .then((data) => {
                setData(data);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
        );
    }

    const chartData = {
        labels: data.map((d) => d.label),
        datasets: [
            {
                label: "Money In (AR)",
                data: data.map((d) => d.ar),
                borderColor: "#34d399",
                backgroundColor: "rgba(52, 211, 153, 0.1)",
                tension: 0.4,
                fill: true,
            },
            {
                label: "Money Out (AP)",
                data: data.map((d) => d.ap),
                borderColor: "#f87171",
                backgroundColor: "rgba(248, 113, 113, 0.1)",
                tension: 0.4,
                fill: true,
            },
            {
                label: "Net Flow",
                data: data.map((d) => d.net),
                borderColor: "#818cf8",
                borderDash: [5, 5],
                tension: 0.4,
                fill: false,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top" as const,
                labels: {
                    color: "#94a3b8",
                    usePointStyle: true,
                },
            },
            tooltip: {
                mode: "index" as const,
                intersect: false,
                backgroundColor: "#1e293b",
                titleColor: "#f1f5f9",
                bodyColor: "#cbd5e1",
                borderColor: "#334155",
                borderWidth: 1,
                callbacks: {
                    label: function (context: any) {
                        let label = context.dataset.label || "";
                        if (label) {
                            label += ": ";
                        }
                        if (context.parsed.y !== null) {
                            label += formatCurrency(context.parsed.y);
                        }
                        return label;
                    },
                },
            },
        },
        scales: {
            y: {
                grid: {
                    color: "#334155",
                },
                ticks: {
                    color: "#94a3b8",
                    callback: function (value: any) {
                        return formatCurrency(value).split(".")[0]; // Compact currency
                    },
                },
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: "#94a3b8",
                },
            },
        },
        interaction: {
            mode: "nearest" as const,
            axis: "x" as const,
            intersect: false,
        },
    };

    return <Line options={options} data={chartData} />;
}
