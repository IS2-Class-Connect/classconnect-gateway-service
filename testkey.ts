import * as fs from 'fs';
import 'dotenv/config';
import { Logger } from '@nestjs/common';

const logger = new Logger('Key resolution');

const keyRaw = process.env.FIREBASE_PRIVATE_KEY;

if (!keyRaw) {
  logger.error('❌ FIREBASE_PRIVATE_KEY is undefined');
  process.exit(1);
}

const parsed = keyRaw.replaceAll('\\n', '\n').trim();

fs.writeFileSync('test-key.pem', parsed);

logger.log('✅ Key written to test-key.pem');
