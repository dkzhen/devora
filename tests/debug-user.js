const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking Prisma Client...');
    if (prisma.user) {
        console.log('✅ prisma.user is defined.');
        const count = await prisma.user.count();
        console.log(`User count: ${count}`);
    } else {
        console.error('❌ prisma.user is UNDEFINED.');
        console.log('Available models:', Object.keys(prisma).filter(key => key[0] !== '_' && key[0] !== '$'));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
