import { createCipheriv } from 'node:crypto';

export const TELEMETRY_ID_PLACEHOLDER = '{{TELEMETRY_ID}}';

// One AES block: 8 zero bytes + tId. The zero half lets the decoder reject forged ids.
export function encryptTelemetryId(tId: bigint, keyHex: string): string {
    const block = Buffer.alloc(16);
    block.writeBigUInt64BE(tId, 8);

    const cipher = createCipheriv('aes-128-ecb', Buffer.from(keyHex, 'hex'), null);
    cipher.setAutoPadding(false);

    return Buffer.concat([cipher.update(block), cipher.final()]).toString('hex');
}
