import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { GET as authGET, POST as authPOST } from "../auth/[...nextauth]/route";

// Validation schema for creating an invoice
const createInvoiceSchema = z.object({
    clientName: z.string().min(1, "Client name is required"),
    amount: z.number().positive("Amount must be positive"),
    dateSent: z.string().transform((str) => new Date(str)),
    dueDate: z.string().transform((str) => new Date(str)),
    status: z.enum(["sent", "paid", "overdue"]).optional(),
    invoiceNumber: z.string().optional(),
});

// GET /api/invoices - List all invoices for the user's organization
export async function GET(req: Request) {
    const session = await getServerSession(authGET);

    if (!session || !session.user?.email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user to find their orgId
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { orgId: true },
    });

    if (!user?.orgId) {
        return NextResponse.json({ message: "Organization not found" }, { status: 404 });
    }

    try {
        const invoices = await prisma.invoice.findMany({
            where: { orgId: user.orgId },
            orderBy: { dueDate: "asc" },
        });

        return NextResponse.json(invoices);
    } catch (error) {
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}

// POST /api/invoices - Create a new invoice
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
        const result = createInvoiceSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { message: "Invalid input", errors: result.error.errors },
                { status: 400 }
            );
        }

        const { clientName, amount, dateSent, dueDate, status, invoiceNumber } = result.data;

        const invoice = await prisma.invoice.create({
            data: {
                orgId: user.orgId,
                clientName,
                amount,
                dateSent,
                dueDate,
                status: status || "sent",
                invoiceNumber,
                createdBy: user.id,
            },
        });

        return NextResponse.json(invoice, { status: 201 });
    } catch (error) {
        console.error("Create invoice error:", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
