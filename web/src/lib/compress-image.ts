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

/** Vùng cắt (từ hộp Cắt ảnh): xoay `rotate` độ trước, rồi lấy khung x, y, w, h — tính bằng pixel của ảnh ĐÃ xoay. */
export type Crop = { rotate: 0 | 90 | 180 | 270; x: number; y: number; w: number; h: number };

/**
 * Nén ảnh: cạnh dài tối đa `max` px, JPEG ~80%. Có `watermark` thì đóng chữ ký lên ảnh; có `crop` thì xoay + cắt trước.
 * `alpha`: giữ nền trong suốt (ảnh PNG banner đặt trên nền riêng) — xuất WebP thay vì JPEG.
 */
export async function compressImage(file: Blob, max = 1600, watermark?: string, crop?: Crop, alpha = false): Promise<File> {
  const bmp = await createImageBitmap(file);
  const rot = crop?.rotate ?? 0;
  const side = rot % 180 !== 0;
  const iw = side ? bmp.height : bmp.width, ih = side ? bmp.width : bmp.height;
  // kẹp khung cắt vào trong ảnh (làm tròn ở hộp cắt có thể lệch nửa pixel)
  const x = Math.max(0, Math.min(iw - 1, crop?.x ?? 0)), y = Math.max(0, Math.min(ih - 1, crop?.y ?? 0));
  const w = Math.max(1, Math.min(iw - x, crop?.w ?? iw)), h = Math.max(1, Math.min(ih - y, crop?.h ?? ih));
  const scale = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const g = canvas.getContext('2d')!;
  // nền trắng: ảnh PNG nền trong suốt đổi sang JPEG không bị thành nền đen
  if (!alpha) {
    g.fillStyle = '#fff';
    g.fillRect(0, 0, canvas.width, canvas.height);
  }
  g.imageSmoothingQuality = 'high';
  g.save();
  g.scale(canvas.width / w, canvas.height / h);
  g.translate(iw / 2 - x, ih / 2 - y);
  g.rotate((rot * Math.PI) / 180);
  g.drawImage(bmp, -bmp.width / 2, -bmp.height / 2);
  g.restore();
  bmp.close();
  if (watermark) drawWatermark(g, canvas.width, canvas.height, watermark);
  // Trình duyệt không xuất được WebP (Safari cũ) thì trả PNG — vẫn giữ nền trong suốt.
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, alpha ? 'image/webp' : 'image/jpeg', alpha ? 0.85 : 0.8));
  if (!blob) throw new Error('Không đọc được ảnh');
  const ext = { 'image/webp': 'webp', 'image/png': 'png' }[blob.type] ?? 'jpg';
  return new File([blob], `photo.${ext}`, { type: blob.type });
}
