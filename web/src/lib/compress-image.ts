// Chỉ chạy ở trình duyệt: nén ảnh trước khi gửi lên (Vercel giới hạn thân request 4,5MB).

/** Nén ảnh: cạnh dài tối đa `max` px, JPEG ~80%. */
export async function compressImage(file: File, max = 1600): Promise<File> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.8));
  if (!blob) throw new Error('Không đọc được ảnh');
  return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
}
