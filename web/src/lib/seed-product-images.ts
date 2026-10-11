// Ảnh minh họa tạm cho sản phẩm cây cảnh chưa có ảnh: ảnh giấy phép mở trên Wikimedia Commons (đúng loài hoặc loài gần
// giống), đã cắt khung vuông và thu nhỏ 1000×1000. File ở web/seed/san-pham/, được `seedProductImages` (server/db/seed.ts) nạp
// vào product_images MỘT lần khi chạy db:setup, chỉ cho sản phẩm còn chưa có ảnh. `file` = md5 nội dung ảnh → tên cố định, nên
// trang sản phẩm nhận ra ảnh minh họa (thay dấu "Ảnh thật" bằng "Ảnh minh họa") và /chinh-sach/nguon-anh liệt kê nguồn —
// nơi duy nhất ghi tác giả + giấy phép. Chủ shop xóa ảnh minh họa trong admin rồi tải ảnh tự chụp lên là thay xong; ảnh tự tải có tên ngẫu nhiên → không ghi công.

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

export const SEED_PRODUCT_IMAGES: SeedProductImage[] = [
  { product: 'luoi-ho', name: 'Lưỡi hổ', source: 'luoi-ho.jpg', file: 'fe33d88751c8946eb56f532a8102bfa9.jpg',
    author: 'Enzo Rippa', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Sansevieria_Trifasciata_.jpg' },
  { product: 'van-nien-thanh', name: 'Vạn niên thanh', source: 'van-nien-thanh.jpg', file: '8f74c7f4f226d5400a76d80756cbd821.jpg',
    author: 'Forest & Kim Starr', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:Starr_061212-2331_Dieffenbachia_seguine.jpg' },
  { product: 'duoi-cong', name: 'Đuôi công', source: 'duoi-cong.jpg', file: '04129ace59a940c1635e5251d01e2ba4.jpg',
    author: 'Chhe', license: 'phạm vi công cộng', url: 'https://commons.wikimedia.org/wiki/File:CalatheaMakoyana.jpg' },
  { product: 'phu-quy', name: 'Phú quý', source: 'phu-quy.jpg', file: '6d2458bfe7c6828d9c83e1faa8428481.jpg',
    author: 'Yercaud-elango', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Aglaonema_commutatum_cv.King_Red-3-ladies_seat-yercaud-salem-India.jpg' },
  { product: 'ngoc-ngan', name: 'Ngọc ngân', source: 'ngoc-ngan.jpg', file: 'be493ad461c1d5037b9913d1f4289475.jpg',
    author: 'Yercaud-elango', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Aglaonema_snow_white-3-jayanti_nagar-bengaluru-India.jpg' },
  { product: 'duong-xi', name: 'Dương xỉ', source: 'duong-xi.jpg', file: 'c3b014c680d02bfbd6a908ebfc2ba611.jpg',
    author: 'Billjones94', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Nephrolepis_exaltata_at_the_campus_of_Ramakrishna_Mission_Shikshanamandira.jpg' },
  { product: 'van-loc', name: 'Vạn lộc', source: 'van-loc.jpg', file: '076469c27f3054338152cf07bd0aab19.jpg',
    author: 'Yercaud-elango', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Aglaonema_commutatum_cv_pink-3-jayanti_nagar-begaloru-India.jpg' },
  { product: 'ngoc-but', name: 'Ngọc bút', source: 'ngoc-but.jpg', file: 'efb6705382dc91fdf0bd41d1953275b7.jpg',
    author: 'Brihaspati', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Pinwheel_Flower_in_Gujarat,_India.jpg' },
  { product: 'chuoi-re-quat', name: 'Chuối rẻ quạt', source: 'chuoi-re-quat.jpg', file: '9595d2e3cab5ecfe7edbedf3b685faf2.jpg',
    author: 'CEphoto, Uwe Aranas', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Penang_Malaysia_Ravenala-madagascariensis-01.jpg' },
  { product: 'bach-ma-hoang-tu', name: 'Bạch mã hoàng tử', source: 'bach-ma-hoang-tu.jpg', file: '982ab93a23adf0460b248e21239de806.jpg',
    author: 'Cfunateoow', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:HK_CWB_%E9%8A%85%E9%91%BC%E7%81%A3_Causeway_Bay_%E5%B8%8C%E6%85%8E%E5%BB%A3%E5%A0%B4_Hysan_Place_Sky_Garden_plant_white_stem_%E5%AD%94%E9%9B%80%E7%AB%B9%E8%8A%8B_Calathea_makoyana_%E8%82%96%E7%AB%B9%E8%8A%8B%E5%B1%AC_Calathea_zebrina_October_2017_IX1_02.jpg' },
  { product: 'trau-ba-de-vuong-xanh', name: 'Trầu bà đế vương xanh', source: 'trau-ba-de-vuong-xanh.jpg', file: '7ca58e7abd45bd468ae21fa791280b14.jpg',
    author: 'Elavarasi.v', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Philodendron_erubescens_Plant.jpg' },
  { product: 'trau-ba-de-vuong-do', name: 'Trầu bà đế vương đỏ', source: 'trau-ba-de-vuong-do.jpg', file: '32445c17d6181af49f2f57c5d435a9ad.jpg',
    author: 'Yercaud-elango', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Philodendron_Imperial_Red-2-R.M.Nagar-bengaluru-India.jpg' },
  { product: 'duoi-phung', name: 'Đuôi công phụng', source: 'duoi-phung.jpg', file: 'e5698f6a12425067426a47e7fca959fe.jpg',
    author: 'Mike like0708', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Calathea_lancifolia_Mos.jpg' },
  { product: 'ngan-hau', name: 'Ngân hậu', source: 'ngan-hau.jpg', file: '5f94a62ba80125bc15e5182aa6ae87a3.jpg',
    author: 'Digigalos', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Aglaonema_commutatum_%27Silver_Queen%27_01.jpg' },
  { product: 'ngoc-bich', name: 'Ngọc bích', source: 'ngoc-bich.jpg', file: 'e38cb82db89e8987786e4ffeaec6369b.jpg',
    author: 'Atlas Þə Biologist', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Crassula_ovata_Plant.jpg' },
  { product: 'tung-thom', name: 'Tùng thơm', source: 'tung-thom.jpg', file: 'b9effa0666471c8b44efa0be4b73d724.jpg',
    author: 'Yogdes', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Hesperocyparis_macrocarpa_%27Goldcrest%27_at_Akola1.jpg' },
  { product: 'duoi-cong-xanh', name: 'Đuôi công xanh', source: 'duoi-cong-xanh.jpg', file: 'e48e93109e03e8a207dcfd634a15fa7a.jpg',
    author: '3steph14', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Calathea_freddie.jpg' },
  { product: 'duoi-cong-tim', name: 'Đuôi công tím', source: 'duoi-cong-tim.jpg', file: 'd04afae52aa25f6e183ad7c4bb7ce80e.jpg',
    author: 'Mokkie', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Rose_Painted_Calathea_(Calathea_roseopicta)_2.jpg' },
  { product: 'hoa-lai', name: 'Hoa lài', source: 'hoa-lai.jpg', file: '03df376c7e27c0e49a28e6cf4327a101.jpg',
    author: 'Dinkun Chen', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Jasminum_sambac_in_China.jpg' },
];

const files = new Set(SEED_PRODUCT_IMAGES.map((x) => x.file));

/** Ảnh minh họa nạp sẵn (không phải ảnh shop tự tải lên) → trang sản phẩm hiện nhãn "Ảnh minh họa" thay dấu "Ảnh thật". */
export const isStockProductImage = (file?: string) => !!file && files.has(file);
