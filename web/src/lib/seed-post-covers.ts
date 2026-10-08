// Ảnh bìa cho 3 bài Góc chăm cây mẫu (lib/seed-posts.ts): ảnh CC0 / phạm vi công cộng trên Wikimedia Commons (không bắt buộc ghi nguồn),
// cắt 16:9, 1280×720. File ở web/seed/bai-viet/, `seedPostCovers` (server/db/seed.ts) nạp MỘT lần (dấu `seeded:post-covers`), chỉ cho
// bài còn đúng slug mẫu và chưa có ảnh bìa — admin đã tự chọn ảnh bìa thì giữ nguyên. `file` = md5 nội dung ảnh.

export const SEED_POST_COVERS: { post: string; source: string; file: string }[] = [
  { post: '5-dau-hieu-thoi-re-mua-mua', source: '5-dau-hieu-thoi-re-mua-mua.jpg', file: '957202b2e1acca434062c017fbc45b7f.jpg' },
  { post: 'tuoi-cay-trong-nha-dung-cach', source: 'tuoi-cay-trong-nha-dung-cach.jpg', file: '7d098ad38ce6d6cd429e4b6e790c82c6.jpg' },
  { post: 'trong-rau-muong-thung-xop', source: 'trong-rau-muong-thung-xop.jpg', file: '8413be893e896418e4bcb65e1b133b0d.jpg' },
];
