// Chỉ chạy ở trình duyệt: nén ảnh trước khi gửi lên (Vercel giới hạn thân request 4,5MB).

/** Chữ ký đóng lên ảnh sản phẩm. */
export const WATERMARK = 'caycanhmientay';

/** Lưới chữ chéo mờ phủ kín ảnh — cắt góc hay xóa một chỗ vẫn còn dấu (không đặt chữ ở góc: khung vuông trên web cắt mất mép ảnh). */
function drawWatermark(g: CanvasRenderingContext2D, w: number, h: number, text: string) {
  const size = Math.max(14, Math.round(Math.min(w, h) / 20));
  g.save();
  g.font = `600 ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';

  // Lưới: xoay -30°, hàng so le, chữ trắng viền tối để thấy được trên cả nền sáng lẫn nền tối
  const stepX = g.measureText(text).width + size * 3;
  const stepY = size * 4.5;
  const diag = Math.hypot(w, h);
  g.translate(w / 2, h / 2);
  g.rotate(-Math.PI / 6);
  g.lineWidth = Math.max(1, size / 14);
  g.strokeStyle = 'rgba(0, 0, 0, 0.14)';
  g.fillStyle = 'rgba(255, 255, 255, 0.24)';
  for (let row = 0, y = -diag / 2; y < diag / 2; y += stepY, row++) {
    for (let x = -diag / 2 + (row % 2 ? stepX / 2 : 0); x < diag / 2; x += stepX) {
      g.strokeText(text, x, y);
      g.fillText(text, x, y);
    }
  }
  g.restore();
}

/** Nén ảnh: cạnh dài tối đa `max` px, JPEG ~80%. Có `watermark` thì đóng chữ ký lên ảnh. */
export async function compressImage(file: File, max = 1600, watermark?: string): Promise<File> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const g = canvas.getContext('2d')!;
  g.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  if (watermark) drawWatermark(g, canvas.width, canvas.height, watermark);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.8));
  if (!blob) throw new Error('Không đọc được ảnh');
  return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
}
