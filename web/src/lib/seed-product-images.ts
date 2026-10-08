// Ảnh minh họa tạm cho sản phẩm cây cảnh chưa có ảnh (đang chuẩn bị — danh sách trống thì seedProductImages bỏ qua).

export type SeedProductImage = {
  /** Slug sản phẩm. */
  product: string;
  /** Tên sản phẩm lúc nạp (dùng ở trang nguồn ảnh). */
  name: string;
  /** Tên file trong web/seed/san-pham/. */
  source: string;
  /** Tên lưu trong product_images (md5 nội dung + đuôi). */
  file: string;
  author: string;
  license: string;
  /** Trang ảnh trên Wikimedia Commons. */
  url: string;
};

export const SEED_PRODUCT_IMAGES: SeedProductImage[] = [];

const byFile = new Map(SEED_PRODUCT_IMAGES.map((x) => [x.file, x]));

/** Ảnh minh họa nạp sẵn thì trả về tác giả (rút gọn) + giấy phép để ghi dưới ảnh; ảnh shop tự tải lên → undefined. */
export function productImageCredit(file?: string) {
  const x = file ? byFile.get(file) : undefined;
  return x && { author: x.author.split(',')[0], license: x.license, url: x.url };
}
