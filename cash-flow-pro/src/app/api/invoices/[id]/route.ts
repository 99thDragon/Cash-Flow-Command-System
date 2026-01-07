import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { GET as authGET } from "../../auth/[...nextauth]/route";

// Validation schema for updating an invoice
const updateInvoiceSchema = z.object({
    clientName: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    dateSent: z.string().transform((str) => new Date(str)).optional(),
    dueDate: z.string().transform((str) => new Date(str)).optional(),
    status: z.enum(["sent", "paid", "overdue"]).optional(),
    invoiceNumber: z.string().optional(),
});

// PATCH /api/invoices/[id] - Update an invoice
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
        // Verify invoice belongs to user's org
        const existingInvoice = await prisma.invoice.findUnique({
            where: { id: params.id },
        });

        if (!existingInvoice || existingInvoice.orgId !== user.orgId) {
            return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
        }

        const body = await req.json();
        const result = updateInvoiceSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { message: "Invalid input", errors: result.error.errors },
                { status: 400 }
            );
        }

        const updatedInvoice = await prisma.invoice.update({
            where: { id: params.id },
            data: result.data,
        });

        return NextResponse.json(updatedInvoice);
    } catch (error) {
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}

// DELETE /api/invoices/[id] - Delete an invoice
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
        // Verify invoice belongs to user's org
        const existingInvoice = await prisma.invoice.findUnique({
            where: { id: params.id },
        });

        if (!existingInvoice || existingInvoice.orgId !== user.orgId) {
            return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
        }

        await prisma.invoice.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: "Invoice deleted" });
    } catch (error) {
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
