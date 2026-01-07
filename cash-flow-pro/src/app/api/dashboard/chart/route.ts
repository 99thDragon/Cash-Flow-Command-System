import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { GET as authGET } from "../../auth/[...nextauth]/route";

export async function GET(req: Request) {
    const session = await getServerSession(authGET);

    if (!session || !session.user?.email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { orgId: true },
    });

    if (!user?.orgId) {
        return NextResponse.json({ message: "Organization not found" }, { status: 404 });
    }

    try {
        // Logic for 8-week historical chart
        // Getting raw data for transactions
        const endDate = new Date(); // Today
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 56); // 8 weeks ago

        const paidInvoices = await prisma.invoice.findMany({
            where: {
                orgId: user.orgId,
                status: "paid",
                updatedAt: { gte: startDate, lte: endDate },
            },
        });

        const paidBills = await prisma.bill.findMany({
            where: {
                orgId: user.orgId,
                status: "paid",
                updatedAt: { gte: startDate, lte: endDate },
            },
        });

        // Bucket into weeks
        const weeks = [];
        for (let i = 0; i < 8; i++) {
            const weekStart = new Date(startDate);
            weekStart.setDate(startDate.getDate() + (i * 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const weekAR = paidInvoices
                .filter(inv => inv.updatedAt >= weekStart && inv.updatedAt <= weekEnd)
                .reduce((sum, inv) => sum + Number(inv.amount), 0);

            const weekAP = paidBills
                .filter(bill => bill.updatedAt >= weekStart && bill.updatedAt <= weekEnd)
                .reduce((sum, bill) => sum + Number(bill.amount), 0);

            weeks.push({
                label,
                ar: weekAR,
                ap: weekAP,
                net: weekAR - weekAP
            });
        }

        return NextResponse.json(weeks);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
