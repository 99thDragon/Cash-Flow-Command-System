import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { GET as authGET } from "../../auth/[...nextauth]/route";

const updateBillSchema = z.object({
    vendorName: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    dueDate: z.string().transform((str) => new Date(str)).optional(),
    priority: z.enum(["high", "medium", "low"]).optional(),
    category: z.string().optional(),
    status: z.enum(["unpaid", "paid"]).optional(),
    billNumber: z.string().optional(),
});

// PATCH /api/bills/[id]
export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
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
        const existingBill = await prisma.bill.findUnique({
            where: { id: params.id },
        });

        if (!existingBill || existingBill.orgId !== user.orgId) {
            return NextResponse.json({ message: "Bill not found" }, { status: 404 });
        }

        const body = await req.json();
        const result = updateBillSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { message: "Invalid input", errors: result.error.errors },
                { status: 400 }
            );
        }

        const updatedBill = await prisma.bill.update({
            where: { id: params.id },
            data: result.data,
        });

        return NextResponse.json(updatedBill);
    } catch (error) {
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}

// DELETE /api/bills/[id]
export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
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
        const existingBill = await prisma.bill.findUnique({
            where: { id: params.id },
        });

        if (!existingBill || existingBill.orgId !== user.orgId) {
            return NextResponse.json({ message: "Bill not found" }, { status: 404 });
        }

        await prisma.bill.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: "Bill deleted" });
    } catch (error) {
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
