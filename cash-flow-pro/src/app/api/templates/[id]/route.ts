import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { GET as authGET } from "../../auth/[...nextauth]/route";

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
        const existing = await prisma.recurringTemplate.findUnique({
            where: { id: params.id },
        });

        if (!existing || existing.orgId !== user.orgId) {
            return NextResponse.json({ message: "Template not found" }, { status: 404 });
        }

        // Instead of hard delete, we might just set active = false, but user requested CRUD
        // Let's do DELETE for now
        await prisma.recurringTemplate.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: "Template deleted" });
    } catch (error) {
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
