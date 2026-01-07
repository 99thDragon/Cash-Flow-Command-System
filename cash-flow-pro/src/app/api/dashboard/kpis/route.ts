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
        // Fetch latest cash snapshot
        const latestSnapshot = await prisma.cashSnapshot.findFirst({
            where: { orgId: user.orgId },
            orderBy: { recordedAt: "desc" },
        });

        const currentCash = latestSnapshot ? Number(latestSnapshot.balance) : 0;

        // Calculate AR (Total Unpaid Invoices)
        const unpaidInvoices = await prisma.invoice.findMany({
            where: {
                orgId: user.orgId,
                status: { not: "paid" },
            },
        });
        const totalAR = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

        // Calculate AP (Total Unpaid Bills)
        const unpaidBills = await prisma.bill.findMany({
            where: {
                orgId: user.orgId,
                status: { not: "paid" },
            },
        });
        const totalAP = unpaidBills.reduce((sum, bill) => sum + Number(bill.amount), 0);

        // Calculate Runway
        // Estimate burn rate based on average weekly AP (simplified for MVP)
        // For now, just using totalAP as a rough proxy of "monthly expenses" if usually paid monthly
        // A better metric would be historical average. Implementing simple calculation for now.

        // Simple Runway: Cash / Weekly AP (if AP > 0)
        // We'll calculate "Weekly Burn" by looking at bills paid in last 30 days / 4
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const paidBillsLast30Days = await prisma.bill.findMany({
            where: {
                orgId: user.orgId,
                status: "paid",
                updatedAt: { gte: thirtyDaysAgo },
            },
        });

        const totalBurn30Days = paidBillsLast30Days.reduce((sum, bill) => sum + Number(bill.amount), 0);
        const weeklyBurn = totalBurn30Days / 4 || (totalAP / 4); // Fallback to current AP/4 if no history

        const runwayWeeks = weeklyBurn > 0 ? (currentCash / weeklyBurn) : 999;

        return NextResponse.json({
            cash: currentCash,
            ar: totalAR,
            ap: totalAP,
            runway: Math.min(Math.round(runwayWeeks * 10) / 10, 999),
        });
    } catch (error) {
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
