import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Ensure User and Organization exist
    const user = await prisma.user.upsert({
        where: { email: 'demo@example.com' },
        update: {},
        create: {
            email: 'demo@example.com',
            name: 'Demo User',
            passwordHash: hashedPassword,
            role: 'owner',
            organization: {
                create: {
                    name: 'Demo Corp',
                },
            },
        },
        include: {
            organization: true,
        },
    });

    console.log(`User ensured: ${user.email}`);

    // Fetch orgId (needed if user already existed and wasn't created in this run)
    const userWithOrg = await prisma.user.findUnique({
        where: { email: 'demo@example.com' },
        include: { organization: true }
    });

    if (!userWithOrg?.organization) {
        console.error("Organization not found for user");
        process.exit(1);
    }

    const orgId = userWithOrg.organization.id;
    const userId = userWithOrg.id;

    // 2. Load Sample Data
    const dataPath = path.join(__dirname, '../../sample_data.json');
    if (!fs.existsSync(dataPath)) {
        console.error(`Sample data file not found at: ${dataPath}`);
        // Try looking in the root workspace if the relative path is wrong
        // But based on file exploration, this should be correct.
        process.exit(1);
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const sampleData = JSON.parse(rawData);

    console.log("Clearing existing data for organization...");
    // Clean up to prevent duplicates
    await prisma.cashSnapshot.deleteMany({ where: { orgId } });
    await prisma.invoice.deleteMany({ where: { orgId } });
    await prisma.bill.deleteMany({ where: { orgId } });

    console.log("Seeding new data...");

    // 3. Cash Snapshot
    if (sampleData.cashBalance !== undefined) {
        await prisma.cashSnapshot.create({
            data: {
                orgId,
                balance: sampleData.cashBalance,
                recordedBy: userId,
            }
        });
        console.log(`Added Cash Snapshot: ${sampleData.cashBalance}`);
    }

    // 4. Invoices
    if (Array.isArray(sampleData.invoices)) {
        for (const inv of sampleData.invoices) {
            await prisma.invoice.create({
                data: {
                    orgId,
                    invoiceNumber: inv.id,
                    clientName: inv.client,
                    amount: inv.amount,
                    dateSent: new Date(inv.dateSent),
                    dueDate: new Date(inv.dueDate),
                    status: inv.status.toLowerCase(),
                    createdBy: userId,
                }
            });
        }
        console.log(`Added ${sampleData.invoices.length} invoices`);
    }

    // 5. Bills
    if (Array.isArray(sampleData.bills)) {
        for (const bill of sampleData.bills) {
            await prisma.bill.create({
                data: {
                    orgId,
                    billNumber: bill.id,
                    vendorName: bill.vendor,
                    amount: bill.amount,
                    dueDate: new Date(bill.dueDate),
                    priority: bill.priority.toLowerCase(),
                    status: bill.status.toLowerCase(),
                    createdBy: userId,
                }
            });
        }
        console.log(`Added ${sampleData.bills.length} bills`);
    }

    console.log("Seeding finished.");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
