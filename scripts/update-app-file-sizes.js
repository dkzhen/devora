/**
 * Script to update file sizes for existing app versions
 * This fetches file size from Telegram API and updates the database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import decrypt function from lib
const path = require('path');
const { decrypt } = require(path.join(__dirname, '../src/lib/encryption.js'));

async function updateFileSizes() {
    console.log('🚀 Starting file size update process...\n');

    try {
        // Get Bot Token
        const botTokenConfig = await prisma.globalConfig.findUnique({
            where: { key: 'BOT_TOKEN_TELEGRAM' }
        });

        if (!botTokenConfig) {
            console.error('❌ BOT_TOKEN_TELEGRAM not found in global config');
            process.exit(1);
        }

        const botToken = decrypt(botTokenConfig.value);
        if (!botToken) {
            console.error('❌ Failed to decrypt bot token');
            process.exit(1);
        }

        console.log('✅ Bot token loaded successfully\n');

        // Get all app versions without file size
        const versions = await prisma.appVersion.findMany({
            where: {
                fileSize: null
            },
            include: {
                app: {
                    select: {
                        name: true
                    }
                }
            }
        });

        console.log(`📦 Found ${versions.length} versions without file size\n`);

        if (versions.length === 0) {
            console.log('✨ All versions already have file size!');
            return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const version of versions) {
            try {
                console.log(`Processing: ${version.app.name} v${version.version}...`);

                // Fetch file info from Telegram
                const fileInfoRes = await fetch(
                    `https://api.telegram.org/bot${botToken}/getFile?file_id=${version.apkUrl}`
                );
                const fileInfoData = await fileInfoRes.json();

                if (fileInfoData.ok && fileInfoData.result && fileInfoData.result.file_size) {
                    const fileSize = BigInt(fileInfoData.result.file_size);
                    
                    // Update database
                    await prisma.appVersion.update({
                        where: { id: version.id },
                        data: { fileSize: fileSize }
                    });

                    const sizeMB = (Number(fileSize) / (1024 * 1024)).toFixed(2);
                    console.log(`  ✅ Updated: ${sizeMB} MB\n`);
                    successCount++;
                } else {
                    console.log(`  ⚠️  Failed to get file info from Telegram`);
                    console.log(`  Response:`, fileInfoData);
                    failCount++;
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.log(`  ❌ Error: ${error.message}\n`);
                failCount++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('📊 Summary:');
        console.log(`  ✅ Successfully updated: ${successCount}`);
        console.log(`  ❌ Failed: ${failCount}`);
        console.log(`  📦 Total processed: ${versions.length}`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
updateFileSizes()
    .then(() => {
        console.log('\n✨ Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
