import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            Cash Flow Command
          </div>
          <div className="space-x-4">
            <Link
              href="/login"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          Master Your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Cash Flow
          </span>
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          The professional cash flow management system for founders. Track
          invoices, manage bills, and forecast your runway with confidence.
        </p>

        <div className="flex justify-center gap-4 mb-16">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105"
          >
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all"
          >
            Live Demo
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
            <CheckCircle2 className="w-10 h-10 text-indigo-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">12-Week Forecast</h3>
            <p className="text-slate-400">
              See 3 months into the future. Identify cash gaps before they
              happen.
            </p>
          </div>
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
            <CheckCircle2 className="w-10 h-10 text-pink-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Auto-Pilot Templates</h3>
            <p className="text-slate-400">
              Automate recurring invoices and bills. Never miss a payment entry
              again.
            </p>
          </div>
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
            <CheckCircle2 className="w-10 h-10 text-cyan-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Multi-User Access</h3>
            <p className="text-slate-400">
              Collaborate with your team. Secure, role-based permissions standard.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
