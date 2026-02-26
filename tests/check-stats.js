const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const accounts = await prisma.account.count();
    const messages = await prisma.message.count();
    console.log(`Accounts: ${accounts}`);
    console.log(`Messages: ${messages}`);

    const allAccounts = await prisma.account.findMany();
    console.log('Accounts:', allAccounts);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
