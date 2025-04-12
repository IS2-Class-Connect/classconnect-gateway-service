import * as fs from 'fs';
import 'dotenv/config';

const keyRaw = process.env.FIREBASE_PRIVATE_KEY;

if (!keyRaw) {
  console.error('❌ FIREBASE_PRIVATE_KEY is undefined');
  process.exit(1);
}

const parsed = keyRaw.replaceAll('\\n', '\n').trim();

fs.writeFileSync('test-key.pem', parsed);

console.log('✅ Key written to test-key.pem');
