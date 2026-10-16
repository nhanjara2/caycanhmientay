import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Khóa nội bộ để src/proxy.ts gửi lượt máy tìm kiếm sang /api/giam-sat/crawl (proxy không ghi database trực tiếp).
 * = HMAC của AUTH_SECRET → không lộ AUTH_SECRET, người ngoài không giả được lượt "Googlebot đã xác minh". Thiếu AUTH_SECRET → null (không ghi).
 */
export function monitorKey() {
  const secret = process.env.AUTH_SECRET;
  return secret ? createHmac('sha256', secret).update('ccmt-crawl-log').digest('hex') : null;
}

export function monitorKeyOk(given: string | null) {
  const key = monitorKey();
  if (!key || !given || given.length !== key.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(key));
}
