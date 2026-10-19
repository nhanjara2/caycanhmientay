import { llmsText, textResponse } from '@/server/llms';

/** /llms.txt — giới thiệu shop + danh sách trang chính cho trợ lý AI (server/llms.ts). */
export async function GET() {
  return textResponse(await llmsText(false));
}
