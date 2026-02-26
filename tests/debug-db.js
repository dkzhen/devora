const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking Account model...');
        const count = await prisma.account.count();
        console.log(`Accounts found: ${count}`);

        console.log('Checking Message model...');
        if (!prisma.message) {
            console.error('ERROR: prisma.message is undefined. Client not regenerated?');
        } else {
            const msgCount = await prisma.message.count();
            console.log(`Messages found: ${msgCount}`);
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
