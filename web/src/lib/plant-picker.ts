/**
 * Bảng chọn cây (/bang-chon-cay): 60 loại cây vườn có sẵn, khách chọn cây + số lượng rồi gửi qua Zalo hoặc
 * chuyển sang form Yêu cầu báo giá sỉ. Cây có `slug` lấy ảnh thật + giá từ sản phẩm trên web; cây khác dùng ảnh
 * minh họa Wikimedia Commons (giấy phép tự do, ghi tác giả cuối trang) trong public/images/bang-chon-cay/.
 */

export type PickerPlant = {
  /** Mã cây trong bảng (STT) — khách và nhân viên gọi theo mã này. */
  n: number;
  name: string;
  size: string;
  form: string;
  place: string;
  light: string;
  /** Trồng làm tường nhiệt đới được không. */
  wall: 'Có' | 'Có điều kiện' | 'Không';
  /** Sản phẩm trên web — trang lấy ảnh thật + giá từ đây. */
  slug?: string;
  /** Ảnh minh họa khi chưa có sản phẩm trên web; không có cả hai thì hiện "Đang cập nhật ảnh". */
  img?: string;
  credit?: { author: string; license: string; page: string };
};

/** Cây đã ghép dữ liệu sản phẩm thật (server) — gửi xuống trình duyệt. */
export type PickerItem = PickerPlant & { photo?: string; real?: boolean; price?: number; unit?: string };

export const PICKER_URL = '/bang-chon-cay';
export const PICKER_STORE_KEY = 'ccmt-bang-chon-cay';

export const PICKER_PLANTS: PickerPlant[] = [
  { n: 1, name: 'Bàng Singapore', size: 'Lớn', form: 'Cây thân gỗ', place: 'Góc mặt tiền, sàn', light: 'Bán râm', wall: 'Không', img: '/images/bang-chon-cay/bang-singapore.webp', credit: { author: 'Diogo Luiz', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Ficus_lyrata_98162192.jpg' } },
  { n: 2, name: 'Trúc quân tử', size: 'Lớn', form: 'Cây bụi, thân thẳng', place: 'Hai bên cửa', light: 'Nắng', wall: 'Không', img: '/images/bang-chon-cay/truc-quan-tu.webp', credit: { author: 'Vis M', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Bambusa_multiplex_12.jpg' } },
  { n: 3, name: 'Cau tiểu trâm', size: 'Nhỏ', form: 'Cây bụi', place: 'Để bàn, kệ, sàn', light: 'Bóng râm sáng', wall: 'Có', img: '/images/bang-chon-cay/cau-tieu-tram.webp', credit: { author: 'Bachelot Pierre J-P', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Chamaedorea_elegans_Mart.JPG' } },
  { n: 4, name: 'Kim ngân', size: 'Trung bình', form: 'Cây thân gỗ', place: 'Để sàn, góc quán', light: 'Bán râm', wall: 'Không', img: '/images/bang-chon-cay/kim-ngan.webp', credit: { author: 'DC', license: 'CC BY 2.5', page: 'https://commons.wikimedia.org/wiki/File:Pachira_aquatica_france.jpg' } },
  { n: 5, name: 'Phát tài núi', size: 'Lớn', form: 'Cây thân gỗ', place: 'Góc mặt tiền', light: 'Nắng, bán râm', wall: 'Không', img: '/images/bang-chon-cay/phat-tai-nui.webp', credit: { author: 'H. Zell', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Dracaena_draco_-_Jard%C3%ADn_Bot%C3%A1nico_Canario_Viera_y_Clavijo_-_Gran_Canaria_-_02.jpg' } },
  { n: 6, name: 'Lưỡi hổ', size: 'Nhỏ – lớn', form: 'Cây bụi', place: 'Để bàn, sàn, lối đi', light: 'Nắng, bán râm', wall: 'Không', slug: 'luoi-ho' },
  { n: 7, name: 'Trúc mây', size: 'Trung bình – lớn', form: 'Cây bụi', place: 'Góc quán, sàn', light: 'Bóng râm sáng', wall: 'Không', img: '/images/bang-chon-cay/truc-may.webp', credit: { author: 'Eric in SF', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Rhapis_excelsa.jpg' } },
  { n: 8, name: 'Mật cật', size: 'Trung bình – lớn', form: 'Cây bụi', place: 'Góc quán', light: 'Bán râm', wall: 'Không', img: '/images/bang-chon-cay/mat-cat.webp', credit: { author: 'RuB (Ruddy Bénézet)', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:P1170911_Rhapis_humilis.jpg' } },
  { n: 9, name: 'Trầu bà thanh xuân', size: 'Lớn', form: 'Cây thân thảo', place: 'Góc sàn', light: 'Bán râm', wall: 'Không', slug: 'thanh-xuan' },
  { n: 10, name: 'Đại phú gia', size: 'Lớn', form: 'Cây thân thảo', place: 'Góc sàn', light: 'Bóng râm sáng', wall: 'Không', img: '/images/bang-chon-cay/dai-phu-gia.webp', credit: { author: 'Aritra Bhawani', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Aglaonema_commutatum_(lipstick).jpg' } },
  { n: 11, name: 'Nguyệt quế', size: 'Trung bình – lớn', form: 'Cây bụi, thân gỗ', place: 'Trước cửa', light: 'Nắng', wall: 'Không', img: '/images/bang-chon-cay/nguyet-que.webp', credit: { author: 'Chiring chandan', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Murraya_paniculata_3.jpg' } },
  { n: 12, name: 'Hoa giấy', size: 'Trung bình – lớn', form: 'Cây leo, thân gỗ', place: 'Cổng, giàn', light: 'Nắng', wall: 'Có điều kiện', img: '/images/bang-chon-cay/hoa-giay.webp', credit: { author: 'Kuldeepburjbhalaike', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Bougainvillea_at_Guru_Ram_Rai_Darbar,_Dehradun.jpg' } },
  { n: 13, name: 'Chuỗi ngọc', size: 'Nhỏ – trung bình', form: 'Cây bụi', place: 'Viền bồn', light: 'Nắng', wall: 'Có điều kiện', img: '/images/bang-chon-cay/chuoi-ngoc.webp', credit: { author: 'Gaurav Dhwaj Khadka', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Duranta_erecta_5.jpg' } },
  { n: 14, name: 'Trang đỏ', size: 'Trung bình', form: 'Cây bụi', place: 'Bồn cây', light: 'Nắng', wall: 'Có điều kiện', img: '/images/bang-chon-cay/trang-do.webp', credit: { author: 'Challiyan at Malayalam Wikipedia', license: 'CC BY-SA 2.5', page: 'https://commons.wikimedia.org/wiki/File:%E0%B4%9A%E0%B5%86%E0%B4%A4%E0%B5%8D%E0%B4%A4%E0%B4%BF%E0%B4%AA%E0%B5%8D%E0%B4%AA%E0%B5%82.jpg' } },
  { n: 15, name: 'Mai vạn phúc', size: 'Trung bình', form: 'Cây bụi', place: 'Hai bên lối vào', light: 'Nắng, bán râm', wall: 'Không', img: '/images/bang-chon-cay/mai-van-phuc.webp', credit: { author: 'Prenn', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Wrightia_antidysenterica_(2).JPG' } },
  { n: 16, name: 'Ngũ gia bì', size: 'Trung bình – lớn', form: 'Cây bụi', place: 'Sàn, góc quán', light: 'Bán râm', wall: 'Có điều kiện', img: '/images/bang-chon-cay/ngu-gia-bi.webp', credit: { author: 'Dandy1022', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Dwarf_umbrella_tree_(Schefflera_arboricola).jpg' } },
  { n: 17, name: 'Kim tiền', size: 'Nhỏ – trung bình', form: 'Cây thân thảo', place: 'Để bàn, sàn', light: 'Bóng râm sáng', wall: 'Không', img: '/images/bang-chon-cay/kim-tien.webp', credit: { author: 'User:WeFt', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Zamioculcas_zamiifolia_1.jpg' } },
  { n: 18, name: 'Thiết mộc lan', size: 'Lớn', form: 'Cây thân gỗ', place: 'Góc sàn', light: 'Bán râm', wall: 'Không', img: '/images/bang-chon-cay/thiet-moc-lan.webp', credit: { author: 'Mokkie', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Corn_Plant_(Dracaena_fragrans_%27Massangeana%27).jpg' } },
  { n: 19, name: 'Hạnh phúc', size: 'Trung bình – lớn', form: 'Cây thân gỗ', place: 'Góc quán', light: 'Bán râm', wall: 'Không', img: '/images/bang-chon-cay/hanh-phuc.webp', credit: { author: 'Wikimedia Commons', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Radermachera_sinica.jpg' } },
  { n: 20, name: 'Cau vàng', size: 'Lớn – rất lớn', form: 'Cây bụi thân cột', place: 'Mặt tiền, sàn', light: 'Nắng, bán râm', wall: 'Không', img: '/images/bang-chon-cay/cau-vang.webp', credit: { author: 'KENPEI', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Dypsis_lutescens1.jpg' } },
  { n: 21, name: 'Trầu bà xanh', size: 'Nhỏ – trung bình', form: 'Cây leo, dây rủ', place: 'Tường, chậu treo', light: 'Bóng râm sáng', wall: 'Có', img: '/images/bang-chon-cay/trau-ba-xanh.webp', credit: { author: 'Mokkie', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Money_Plant_(Epipremnum_aureum)_4.jpg' } },
  { n: 22, name: 'Trầu bà cẩm thạch', size: 'Nhỏ – trung bình', form: 'Cây leo, dây rủ', place: 'Tường, kệ', light: 'Bán râm', wall: 'Có', img: '/images/bang-chon-cay/trau-ba-cam-thach.webp', credit: { author: 'Spnq', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Epipremnum_aureum_(Marble_Queen)_houseplant.png' } },
  { n: 23, name: 'Trầu bà lá xẻ', size: 'Trung bình – lớn', form: 'Cây leo, thân bụi', place: 'Sàn, tường', light: 'Bán râm', wall: 'Có điều kiện', img: '/images/bang-chon-cay/trau-ba-la-xe.webp', credit: { author: 'Kittykittymaomao', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:New_Monstera_Deliciosa_Leaf.jpg' } },
  { n: 24, name: 'Trầu bà tim', size: 'Nhỏ', form: 'Cây dây leo', place: 'Chậu treo, tường', light: 'Bóng râm sáng', wall: 'Có', img: '/images/bang-chon-cay/trau-ba-tim.webp', credit: { author: 'Moheen Reeyad', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Philodendron_hederaceum,_Singapore_Botanic_Gardens_(141542).jpg' } },
  { n: 25, name: 'Cúc tần Ấn Độ', size: 'Dây dài', form: 'Cây dây rủ', place: 'Ban công, giàn', light: 'Nắng', wall: 'Có điều kiện', img: '/images/bang-chon-cay/cuc-tan-an-do.webp', credit: { author: 'Vinayaraj', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Tarlmounia_elliptica_at_Peravoor_(2).jpg' } },
  { n: 26, name: 'Lan tim', size: 'Nhỏ', form: 'Cây dây rủ', place: 'Chậu treo', light: 'Bán râm', wall: 'Có', img: '/images/bang-chon-cay/lan-tim.webp', credit: { author: 'Agnieszka Kwiecień, Nova', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Ceropegia_woodii_Ceropegia_Wooda_2024-04-26_02.jpg' } },
  { n: 27, name: 'Dương xỉ Boston', size: 'Nhỏ – trung bình', form: 'Cây bụi', place: 'Chậu treo, tường', light: 'Bóng râm', wall: 'Có', slug: 'duong-xi' },
  { n: 28, name: 'Dương xỉ lá me', size: 'Nhỏ', form: 'Cây bụi', place: 'Tường, kệ', light: 'Bóng râm', wall: 'Có', img: '/images/bang-chon-cay/duong-xi-la-me.webp', credit: { author: 'Forest & Kim Starr', license: 'CC BY 3.0', page: 'https://commons.wikimedia.org/wiki/File:Starr_070221-4863_Nephrolepis_cordifolia.jpg' } },
  { n: 29, name: 'Lan chi', size: 'Nhỏ', form: 'Cây bụi', place: 'Để bàn, tường', light: 'Bán râm', wall: 'Có', slug: 'lan-chi' },
  { n: 30, name: 'Thường xuân', size: 'Nhỏ', form: 'Cây dây leo', place: 'Tường, chậu treo', light: 'Bán râm', wall: 'Có', img: '/images/bang-chon-cay/thuong-xuan.webp', credit: { author: 'Photo by and (c)2007 Derek Ramsey (Ram-Man)', license: 'GFDL 1.2', page: 'https://commons.wikimedia.org/wiki/File:Ivy_Hedera_Red_Brick_Wall_2892px.jpg' } },
  { n: 31, name: 'Cây đô la', size: 'Nhỏ', form: 'Cây dây rủ', place: 'Chậu treo', light: 'Bán râm', wall: 'Có điều kiện', img: '/images/bang-chon-cay/cay-do-la.webp', credit: { author: 'Krzysztof Ziarnek, Kenraiz', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Dischidia_ovata_kz1.jpg' } },
  { n: 32, name: 'Vảy ốc', size: 'Nhỏ', form: 'Cây leo bám', place: 'Tường xanh', light: 'Bán râm, nắng', wall: 'Có', img: '/images/bang-chon-cay/vay-oc.webp', credit: { author: 'Ixitixel', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Ficus_pumila_(Leafs).jpg' } },
  { n: 33, name: 'Hồng môn', size: 'Nhỏ – trung bình', form: 'Cây thân thảo', place: 'Để bàn, kệ', light: 'Bóng râm sáng', wall: 'Có điều kiện', img: '/images/bang-chon-cay/hong-mon.webp', credit: { author: 'Hatem Moushir', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Anthurium_andraeanum_hatem_moushir.JPG' } },
  { n: 34, name: 'Lan ý', size: 'Nhỏ – trung bình', form: 'Cây thân thảo', place: 'Để bàn, sàn', light: 'Bóng râm sáng', wall: 'Có điều kiện', slug: 'lan-y' },
  { n: 35, name: 'Đuôi công', size: 'Nhỏ – trung bình', form: 'Cây thân thảo', place: 'Kệ, tường', light: 'Bóng râm', wall: 'Có', slug: 'duoi-cong-xanh' },
  { n: 36, name: 'Cẩm tú mai', size: 'Nhỏ', form: 'Cây bụi thấp', place: 'Viền bồn, chậu', light: 'Nắng', wall: 'Có điều kiện', img: '/images/bang-chon-cay/cam-tu-mai.webp', credit: { author: 'Agnieszka Kwiecień, Nova', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Cuphea_hyssopifolia_2009-07-20_02.jpg' } },
  { n: 37, name: 'Mắt nai', size: 'Nhỏ', form: 'Cây bụi thấp', place: 'Viền bồn', light: 'Nắng', wall: 'Có điều kiện', img: '/images/bang-chon-cay/mat-nai.webp', credit: { author: 'Krzysztof Ziarnek, Kenraiz', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Alternanthera_ficoidea_%27Snow_Carpet%27_kz01.jpg' } },
  { n: 38, name: 'Dền kiểng', size: 'Nhỏ – trung bình', form: 'Cây thân thảo', place: 'Bồn cây, chậu', light: 'Nắng', wall: 'Có điều kiện', img: '/images/bang-chon-cay/den-kieng.webp', credit: { author: 'Meganesia', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:LittleRuby.jpg' } },
  { n: 39, name: 'Cỏ lá gừng', size: 'Thấp', form: 'Cây phủ nền', place: 'Sân, bồn', light: 'Nắng', wall: 'Không', img: '/images/bang-chon-cay/co-la-gung.webp', credit: { author: 'Forest & Kim Starr', license: 'CC BY 3.0', page: 'https://commons.wikimedia.org/wiki/File:Starr_040812-0041_Axonopus_compressus.jpg' } },
  { n: 40, name: 'Cỏ nhung Nhật', size: 'Thấp', form: 'Cây phủ nền', place: 'Tiểu cảnh, sân', light: 'Nắng', wall: 'Không', img: '/images/bang-chon-cay/co-nhung-nhat.webp', credit: { author: 'Yercaud-elango', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Zoysia_tenuifolia-yercaud-salem-India.JPG' } },
  { n: 41, name: 'Cỏ lan chi', size: 'Nhỏ', form: 'Cây bụi thấp', place: 'Viền bồn, tường', light: 'Bán râm', wall: 'Có', img: '/images/bang-chon-cay/co-lan-chi.webp', credit: { author: 'Photo by David J. Stang', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Chlorophytum_bichetii_0zz.jpg' } },
  { n: 42, name: 'Thài lài tím', size: 'Nhỏ', form: 'Cây bò lan', place: 'Viền bồn, tường', light: 'Nắng, bán râm', wall: 'Có', img: '/images/bang-chon-cay/thai-lai-tim.webp', credit: { author: 'Krzysztof Ziarnek, Kenraiz', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Tradescantia_pallida_%27Purpurea%27_kz01.jpg' } },
  { n: 43, name: 'Lá gấm', size: 'Nhỏ', form: 'Cây bụi thấp', place: 'Bồn cây, tường', light: 'Bán râm', wall: 'Có', img: '/images/bang-chon-cay/la-gam.webp', credit: { author: 'Wilfredor', license: 'CC0', page: 'https://commons.wikimedia.org/wiki/File:Coleus_scutellarioides_(cultivars)_-_Jardin_universitaire_Roger-Van_den_Hende,_Quebec_36.jpg' } },
  { n: 44, name: 'Hoa mười giờ', size: 'Thấp', form: 'Cây bò lan', place: 'Bồn hoa, chậu', light: 'Nắng', wall: 'Không', img: '/images/bang-chon-cay/hoa-muoi-gio.webp', credit: { author: 'Joydeep', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Portulaca_grandiflora_26032014.jpg' } },
  { n: 45, name: 'Dừa cạn', size: 'Nhỏ', form: 'Cây bụi thấp', place: 'Chậu, bồn hoa', light: 'Nắng', wall: 'Không', img: '/images/bang-chon-cay/dua-can.webp', credit: { author: 'Joydeep', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Catharanthus_roseus24_08_2012_(2).JPG' } },
  { n: 46, name: 'Ngọc thảo', size: 'Nhỏ', form: 'Cây thân thảo', place: 'Chậu, kệ', light: 'Bóng râm sáng', wall: 'Có điều kiện', img: '/images/bang-chon-cay/ngoc-thao.webp', credit: { author: 'Sabina Bajracharya', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Pink_Impatiens_walleriana_(1).jpg' } },
  { n: 47, name: 'Sống đời', size: 'Nhỏ', form: 'Cây mọng nước', place: 'Để bàn, bệ cửa', light: 'Nắng, bán râm', wall: 'Không', img: '/images/bang-chon-cay/song-doi.webp', credit: { author: 'Luis Miguel Bugallo Sánchez', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:2025_Kalanchoe_blossfeldiana_Poelin._Santiago_de_Compostela._Galiza.jpg' } },
  { n: 48, name: 'Sen đá', size: 'Nhỏ', form: 'Cây mọng nước', place: 'Để bàn', light: 'Nắng sáng', wall: 'Không', img: '/images/bang-chon-cay/sen-da.webp', credit: { author: 'Didier Descouens', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:(MHNT)_Echeveria_secunda.jpg' } },
  { n: 49, name: 'Xương rồng', size: 'Nhỏ', form: 'Cây mọng nước', place: 'Để bàn, bệ cửa', light: 'Nắng', wall: 'Không', img: '/images/bang-chon-cay/xuong-rong.webp', credit: { author: 'Rationalobserver', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Mammillaria_spinosissima_by_RO.jpg' } },
  { n: 50, name: 'Ngọc ngân', size: 'Nhỏ – trung bình', form: 'Cây thân thảo', place: 'Để bàn, kệ', light: 'Bóng râm sáng', wall: 'Có điều kiện', slug: 'ngoc-ngan' },
  { n: 51, name: 'Vạn lộc', size: 'Nhỏ – trung bình', form: 'Cây thân thảo', place: 'Để bàn, kệ', light: 'Bán râm', wall: 'Có điều kiện', slug: 'van-loc' },
  { n: 52, name: 'Phú quý', size: 'Nhỏ – trung bình', form: 'Cây thân thảo', place: 'Để bàn, sàn', light: 'Bóng râm sáng', wall: 'Có điều kiện', slug: 'phu-quy' },
  { n: 53, name: 'Bạch mã hoàng tử', size: 'Trung bình', form: 'Cây thân thảo', place: 'Góc sàn', light: 'Bóng râm sáng', wall: 'Có điều kiện', slug: 'bach-ma-hoang-tu' },
  { n: 54, name: 'Trầu bà đế vương xanh', size: 'Trung bình', form: 'Cây thân thảo', place: 'Sàn, góc quán', light: 'Bóng râm sáng', wall: 'Có điều kiện', slug: 'trau-ba-de-vuong-xanh' },
  { n: 55, name: 'Trầu bà đế vương đỏ', size: 'Trung bình', form: 'Cây thân thảo', place: 'Sàn, góc quán', light: 'Bóng râm sáng', wall: 'Có điều kiện', slug: 'trau-ba-de-vuong-do' },
  { n: 56, name: 'Đa búp đỏ', size: 'Lớn', form: 'Cây thân gỗ', place: 'Góc mặt tiền', light: 'Nắng, bán râm', wall: 'Không', img: '/images/bang-chon-cay/da-bup-do.webp', credit: { author: 'Photo by David J. Stang', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Ficus_elastica_Burgundy_0zz.jpg' } },
  { n: 57, name: 'Si Nhật', size: 'Nhỏ – trung bình', form: 'Cây bonsai', place: 'Để bàn, tiểu cảnh', light: 'Nắng', wall: 'Không', img: '/images/bang-chon-cay/si-nhat.webp', credit: { author: 'Sarah Stierch', license: 'CC BY 4.0', page: 'https://commons.wikimedia.org/wiki/File:Chinese_Banyan_-_National_Bonsai_%26_Penjing_Museum_-_Washington,_D.C._-_Sarah_Stierch.jpg' } },
  { n: 58, name: 'Tùng thơm', size: 'Trung bình', form: 'Cây thân gỗ', place: 'Hai bên cửa', light: 'Nắng', wall: 'Không', slug: 'tung-thom' },
  { n: 59, name: 'Linh sam', size: 'Nhỏ – trung bình', form: 'Cây bonsai', place: 'Để bàn, tiểu cảnh', light: 'Nắng', wall: 'Không' },
  { n: 60, name: 'Mai chiếu thủy', size: 'Nhỏ – trung bình', form: 'Cây bonsai', place: 'Bàn, tiểu cảnh', light: 'Nắng', wall: 'Không', img: '/images/bang-chon-cay/mai-chieu-thuy.webp', credit: { author: 'Dinesh Valke from Thane, India', license: 'CC BY-SA 2.0', page: 'https://commons.wikimedia.org/wiki/File:Wrightia_religiosa_(4631592924).jpg' } },
];

type Opt = [key: string, label: string, match: (p: PickerPlant) => boolean];
export type FilterGroup = { key: string; label: string; opts: Opt[] };

const has = (re: RegExp) => (s: string) => re.test(s.toLowerCase());

function sizes(p: PickerPlant) {
  const s = p.size.toLowerCase(), out = new Set<string>();
  if (/nhỏ|thấp/.test(s)) out.add('s');
  if (/trung bình/.test(s)) out.add('m');
  if (/lớn/.test(s)) out.add('l');
  if (/dây dài/.test(s)) { out.add('m'); out.add('l'); }
  if (out.has('s') && out.has('l')) out.add('m'); // "Nhỏ – lớn" gồm cả trung bình
  return out;
}

/** Nhóm lọc suy ra từ đúng chữ trong bảng cây: trong nhóm là HOẶC, giữa các nhóm là VÀ. */
export const FILTER_GROUPS: FilterGroup[] = [
  { key: 'place', label: 'Đặt ở đâu', opts: [
    ['front', 'Mặt tiền, cửa', (p) => has(/mặt tiền|cửa|lối vào|cổng/)(p.place)],
    ['floor', 'Góc quán, sàn', (p) => has(/sàn|góc quán|lối đi/)(p.place)],
    ['table', 'Bàn, kệ', (p) => has(/bàn|kệ/)(p.place)],
    ['wall', 'Treo, tường', (p) => has(/treo|tường|ban công|giàn/)(p.place)],
    ['bed', 'Bồn, sân, tiểu cảnh', (p) => has(/bồn|viền|sân|tiểu cảnh/)(p.place)],
  ] },
  { key: 'light', label: 'Ánh sáng', opts: [
    ['sun', 'Nắng', (p) => has(/nắng/)(p.light)],
    ['half', 'Bán râm', (p) => has(/bán râm/)(p.light)],
    ['shade', 'Bóng râm', (p) => has(/bóng râm/)(p.light)],
  ] },
  { key: 'size', label: 'Kích thước', opts: [
    ['s', 'Nhỏ', (p) => sizes(p).has('s')],
    ['m', 'Trung bình', (p) => sizes(p).has('m')],
    ['l', 'Lớn', (p) => sizes(p).has('l')],
  ] },
  { key: 'form', label: 'Dạng cây', opts: [
    ['wood', 'Thân gỗ', (p) => has(/thân gỗ/)(p.form)],
    ['shrub', 'Cây bụi', (p) => has(/bụi/)(p.form)],
    ['herb', 'Thân thảo', (p) => has(/thân thảo/)(p.form)],
    ['vine', 'Leo, rủ', (p) => has(/leo|rủ|bò lan/)(p.form)],
    ['succ', 'Mọng nước', (p) => has(/mọng nước/)(p.form)],
    ['ground', 'Cỏ, phủ nền', (p) => has(/phủ nền/)(p.form)],
    ['bonsai', 'Bonsai', (p) => has(/bonsai/)(p.form)],
  ] },
  { key: 'wall', label: 'Tường cây', opts: [
    ['yes', 'Làm tường nhiệt đới', (p) => p.wall !== 'Không'],
  ] },
];

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** Tin nhắn gửi shop (Zalo) / ghi chú form báo giá: mỗi cây một dòng kèm mã. */
export function pickerMessage(items: PickerItem[], picked: Map<number, number>, contact?: { name?: string; phone?: string; note?: string }) {
  const rows = items.filter((p) => picked.has(p.n));
  const total = rows.reduce((s, p) => s + picked.get(p.n)!, 0);
  return [
    'Chào Cây Cảnh Miền Tây, mình muốn hỏi giá và đặt các cây sau:',
    ...rows.map((p, i) => `${i + 1}. ${p.name} (mã ${pad2(p.n)}): ${picked.get(p.n)} cây`),
    `Tổng: ${rows.length} loại, ${total} cây`,
    ...(contact?.name?.trim() ? [`Tên: ${contact.name.trim()}`] : []),
    ...(contact?.phone?.trim() ? [`SĐT: ${contact.phone.trim()}`] : []),
    ...(contact?.note?.trim() ? [`Ghi chú: ${contact.note.trim()}`] : []),
  ].join('\n');
}
