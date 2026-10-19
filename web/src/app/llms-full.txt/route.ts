import { llmsText, textResponse } from '@/server/llms';

/** /llms-full.txt — như /llms.txt, thêm mô tả, giá từng quy cách và tóm tắt bài (server/llms.ts). */
export async function GET() {
  return textResponse(await llmsText(true));
}
