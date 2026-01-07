"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard,
    FileText,
    CreditCard,
    Repeat,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import { useState } from "react";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Invoices (AR)", href: "/dashboard/invoices", icon: FileText },
    { name: "Bills (AP)", href: "/dashboard/bills", icon: CreditCard },
    { name: "Templates", href: "/dashboard/templates", icon: Repeat },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <div className="lg:hidden fixed top-0 left-0 w-full bg-slate-900 border-b border-slate-800 p-4 z-50 flex justify-between items-center">
                <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                    Cash Flow Command
                </div>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? (
                        <X className="text-slate-400" />
                    ) : (
                        <Menu className="text-slate-400" />
                    )}
                </button>
            </div>

            <div
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    } lg:static lg:block flex-shrink-0`}
            >
                <div className="h-full flex flex-col">
                    <div className="h-16 flex items-center px-6 border-b border-slate-800">
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                            Cash Flow
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center px-3 py-2.5 rounded-lg transition-colors group ${isActive
                                            ? "bg-indigo-600/10 text-indigo-400"
                                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                        }`}
                                >
                                    <item.icon
                                        className={`h-5 w-5 mr-3 flex-shrink-0 ${isActive
                                                ? "text-indigo-400"
                                                : "text-slate-500 group-hover:text-slate-300"
                                            }`}
                                    />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="p-4 border-t border-slate-800">
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="flex items-center w-full px-3 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <LogOut className="h-5 w-5 mr-3 text-slate-500" />
                            <span className="font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
