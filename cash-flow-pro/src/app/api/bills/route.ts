import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { GET as authGET } from "../auth/[...nextauth]/route";

const createBillSchema = z.object({
    vendorName: z.string().min(1, "Vendor name is required"),
    amount: z.number().positive("Amount must be positive"),
    dueDate: z.string().transform((str) => new Date(str)),
    priority: z.enum(["high", "medium", "low"]).optional(),
    category: z.string().optional(),
    status: z.enum(["unpaid", "paid"]).optional(),
    billNumber: z.string().optional(),
});

// GET /api/bills - List all bills
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
        const bills = await prisma.bill.findMany({
            where: { orgId: user.orgId },
            orderBy: { dueDate: "asc" },
        });

        return NextResponse.json(bills);
    } catch (error) {
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}

// POST /api/bills - Create a new bill
export async function POST(req: Request) {
    const session = await getServerSession(authGET);

    if (!session || !session.user?.email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, orgId: true },
    });

    if (!user?.orgId) {
        return NextResponse.json({ message: "Organization not found" }, { status: 404 });
    }

    try {
        const body = await req.json();
        const result = createBillSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { message: "Invalid input", errors: result.error.errors },
                { status: 400 }
            );
        }

        const { vendorName, amount, dueDate, priority, category, status, billNumber } = result.data;

        const bill = await prisma.bill.create({
            data: {
                orgId: user.orgId,
                vendorName,
                amount,
                dueDate,
                priority: priority || "medium",
                category,
                status: status || "unpaid",
                billNumber,
                createdBy: user.id,
            },
        });

        return NextResponse.json(bill, { status: 201 });
    } catch (error) {
        console.error("Create bill error:", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
