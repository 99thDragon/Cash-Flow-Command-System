import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { GET as authGET } from "../auth/[...nextauth]/route";

const createTemplateSchema = z.object({
    type: z.enum(["invoice", "bill"]),
    name: z.string().min(1),
    amount: z.number().positive(),
    frequency: z.enum(["weekly", "monthly", "quarterly"]),
    startDate: z.string().transform((str) => new Date(str)),
});

// GET /api/templates
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
        const templates = await prisma.recurringTemplate.findMany({
            where: { orgId: user.orgId, active: true },
        });
        return NextResponse.json(templates);
    } catch (error) {
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}

// POST /api/templates
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
        const result = createTemplateSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { message: "Invalid input", errors: result.error.errors },
                { status: 400 }
            );
        }

        const template = await prisma.recurringTemplate.create({
            data: {
                orgId: user.orgId,
                ...result.data,
                createdBy: user.id
            },
        });

        return NextResponse.json(template, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
