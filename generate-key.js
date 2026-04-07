const crypto = require('crypto');
console.log('Generating ENCRYPTION_KEY (32 bytes hex)...');
console.log(crypto.randomBytes(32).toString('hex'));
console.log('\nCopy this to your .env file as: ENCRYPTION_KEY=your_key_here');
