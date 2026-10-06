// Ảnh minh họa triệu chứng nạp sẵn cho bài bệnh mẫu: ảnh giấy phép mở trên Wikimedia Commons, đã cắt khung 4:3 và thu nhỏ
// 1000×750. File ảnh nằm ở web/seed/benh-cay/, được `seedDiseaseImages` (server/db/seed.ts) nạp vào bảng disease_images
// MỘT lần khi chạy db:setup. `file` = md5 nội dung ảnh → tên cố định, nên trang bệnh tra được tác giả để ghi công
// (diseaseImageCredit) và trang /chinh-sach/nguon-anh liệt kê đủ nguồn. Ảnh admin tự tải lên có tên ngẫu nhiên → không ghi công.

export type SeedDiseaseImage = {
  /** Slug bài bệnh. */
  disease: string;
  /** Đúng chữ triệu chứng trong bài mẫu (lib/seed-diseases.ts) — admin đã sửa chữ thì không gắn ảnh. */
  symptom: string;
  /** Tên file trong web/seed/benh-cay/. */
  source: string;
  /** Tên lưu trong disease_images (md5 nội dung + đuôi). */
  file: string;
  author: string;
  license: string;
  /** Trang ảnh trên Wikimedia Commons. */
  url: string;
};

export const SEED_DISEASE_IMAGES: SeedDiseaseImage[] = [
  { disease: 'thoi-re', symptom: 'Lá dưới vàng, mềm, rũ; lan dần lên lá non', source: 'thoi-re-1.jpg', file: 'dc0bd9d061382deb5a67eb510e5eba00.jpg',
    author: 'Scot Nelson', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Awa_Pythium_Root_Rot_--_wilt_on_young_plant.jpg' },
  { disease: 'thoi-re', symptom: 'Gốc thâm, mềm, ấn vào lõm; có thể có mùi hôi', source: 'thoi-re-2.jpg', file: 'e4cfad6f6636bff0bba1a9f9337c8512.jpg',
    author: 'Hrabetova', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:CSFO3.jpg' },
  { disease: 'thoi-re', symptom: 'Rễ nâu đen, nhũn, vỏ rễ tuột khi kéo nhẹ', source: 'thoi-re-3.jpg', file: 'ed39f9b19d13ef0db9f4735d6e9bbbbe.jpg',
    author: 'Jerzy Opioła', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Rhododendron-Phytophthora_Root_Rot_(2).jpg' },
  { disease: 'dom-la-nam', symptom: 'Đốm tròn nâu hoặc đen, thường có quầng vàng bao quanh', source: 'dom-la-nam-1.jpg', file: 'b6f75acaa30ef79d1dbd6a1a9a9fb4d3.jpg',
    author: 'David B. Langston, University of Georgia', license: 'CC BY 3.0 US', url: 'https://commons.wikimedia.org/wiki/File:%27Cercospora_capsici.jpg' },
  { disease: 'than-thu', symptom: 'Vết cháy nâu xám ở mép hoặc chóp lá, có vòng đồng tâm', source: 'than-thu-1.jpg', file: '79c227d1011b6bce56c214de26410cab.jpg',
    author: 'Nancy Gregory, University of Delaware, Bugwood.org', license: 'CC BY 3.0 US', url: 'https://commons.wikimedia.org/wiki/File:Apiognomonia_errabunda_Fagus_grandifolia_leaves.jpg' },
  { disease: 'than-thu', symptom: 'Vết lõm đen trên quả, sau có chấm hồng cam (bào tử)', source: 'than-thu-2.jpg', file: '0639e97a89943f38e349448d28f02ed8.jpg',
    author: 'Plant pests and diseases', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Anthracnose_of_banana.jpg' },
  { disease: 'phan-trang', symptom: 'Lớp bột trắng xám trên mặt lá, lau được bằng tay', source: 'phan-trang-1.jpg', file: 'd104cc2c84a4116a1eaca640b28cbe5d.jpg',
    author: 'Dmitry Brant', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Powdery_mildew_9.jpg' },
  { disease: 'phan-trang', symptom: 'Lá non quăn, biến dạng, sau vàng và khô', source: 'phan-trang-2.jpg', file: '8dd2f98d164646311ca874bb86777911.jpg',
    author: 'Jerzy Opioła', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Podosphaera_pannosa_G44_(5).jpg' },
  { disease: 'phan-trang', symptom: 'Nụ, hoa bị phủ phấn, không nở hoặc rụng sớm', source: 'phan-trang-3.jpg', file: '09e607dc0d39d94bf3e6998d664223be.jpg',
    author: 'Wilhelm Zimmerling PAR', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Ruhland,_Grenzstr._3,_Echter_Rosentaupilz_auf_Rosenknospen,_Fr%C3%BChsommer,_02.jpg' },
  { disease: 'gi-sat', symptom: 'Mặt dưới lá có ụ nhỏ màu cam hoặc nâu đỏ, quệt tay thấy bụi màu', source: 'gi-sat-1.jpg', file: 'e42c5c9e277820c5f88dffbc4c6ed3cb.jpg',
    author: 'Jerzy Opioła', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Melampsora_caprearum_a1_(7).jpg' },
  { disease: 'gi-sat', symptom: 'Mặt trên lá tương ứng có đốm vàng nhạt', source: 'gi-sat-2.jpg', file: 'b9cfbb813c494534a55843fd62828287.jpg',
    author: 'Jerzy Opioła', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Phragmidium_mucronatum_a1_(3).jpg' },
  { disease: 'thoi-goc-nam-hach', symptom: 'Tơ nấm trắng như sợi bông bám quanh gốc và mặt đất', source: 'thoi-goc-nam-hach-1.jpg', file: 'e1042595c6a5bc1d3d73c8a03d58c7fe.jpg',
    author: 'Gerlach W', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Athelia.jpg' },
  { disease: 'thoi-goc-nam-hach', symptom: 'Hạt tròn nhỏ màu trắng rồi nâu như hạt cải trên tơ nấm', source: 'thoi-goc-nam-hach-2.jpg', file: '244dec113986cb6b35e85c4ff21194f1.jpg',
    author: 'Plant pests and diseases', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Taro-_Southern_blight_caused_by_Sclerotium_rolfsii.jpg' },
  { disease: 'muoi-den', symptom: 'Lớp đen như bồ hóng phủ mặt lá, lau được', source: 'muoi-den-1.jpg', file: '6e210867f53c16372fb03dc23fbb7ee4.jpg',
    author: 'Amnon Shavit', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Sooty_mold_Schefflera_1.JPG' },
  { disease: 'chay-la-vi-khuan', symptom: 'Đốm nhỏ úng nước như vết dầu, sau chuyển nâu đen', source: 'chay-la-vi-khuan-1.jpg', file: '9b09f4bfe950ffd15d29330a3c58a16a.jpg',
    author: 'Scot Nelson', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Bacterial_blight_of_orchid_leaf_at_a_nursery_on_the_island_of_Hawaii_(8251192670).jpg' },
  { disease: 'chay-la-vi-khuan', symptom: 'Viền đốm có quầng vàng; mép lá cháy lan theo gân', source: 'chay-la-vi-khuan-2.jpg', file: 'd052b6d604a7d92b53400697f76b5fb4.jpg',
    author: 'Scot Nelson', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Hibiscus_Bacterial_leaf_spot_caused_by_Pseudomonas_cichorii_(5684575818).jpg' },
  { disease: 'thoi-nhun', symptom: 'Vết úng nước trong suốt, lan nhanh, lá nhũn như bị luộc', source: 'thoi-nhun-1.jpg', file: '321e41694f8edd9f1892b278ca7e20f1.jpg',
    author: 'Scot Nelson', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Leaf_blight_of_aglaonema_caused_by_Erwinia_sp._(9775997522).jpg' },
  { disease: 'thoi-nhun', symptom: 'Thân, đọt mềm nhũn, chảy dịch', source: 'thoi-nhun-2.jpg', file: '6dc3591ff230d284e21dfd5ff969d48c.jpg',
    author: 'Scot Nelson', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Kale_Bacterial_soft_rot_of_stem_(39935058221).jpg' },
  { disease: 'heo-xanh-vi-khuan', symptom: 'Cây héo rũ đột ngột buổi trưa, lá vẫn còn xanh', source: 'heo-xanh-vi-khuan-1.jpg', file: 'a8011cf247eb8a40b9f701bf2cbf1b25.jpg',
    author: 'Scot Nelson', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Bacterial_wilt_of_pepper_(9159744719).jpg' },
  { disease: 'heo-xanh-vi-khuan', symptom: 'Cắt ngang thân thấy mạch nâu; ngâm vào cốc nước thấy dòng dịch trắng đục chảy ra', source: 'heo-xanh-vi-khuan-2.jpg', file: '62cb7af334211b67adf0ea62167ea184.jpg',
    author: 'Scot Nelson', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Bacterial_streaming_from_diseased_rhizome_of_edible_ginger_(9672419943).jpg' },
  { disease: 'kham-la', symptom: 'Lá loang lổ mảng xanh đậm xen xanh nhạt hoặc vàng', source: 'kham-la-1.jpg', file: '9d05a3ad4069bcb5d84419415ddee799.jpg',
    author: 'Plant pests and diseases', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Papaya_ringspot_(leaf_symptoms).jpg' },
  { disease: 'kham-la', symptom: 'Lá nhăn, gồ ghề, nhỏ hơn bình thường', source: 'kham-la-2.jpg', file: '3589f984bf24f41ee842a82b9b4633b2.jpg',
    author: 'R.J. Reynolds Tobacco Company Slide Set', license: 'CC BY 3.0 US', url: 'https://commons.wikimedia.org/wiki/File:Tobacco_mosaic_virus_symptoms_tobacco.jpg' },
  { disease: 'xoan-la-virus', symptom: 'Lá non xoăn lên, cuộn mép, nhỏ lại', source: 'xoan-la-virus-1.jpg', file: '4556c546b0ce086d13c16f6b2c464ea4.jpg',
    author: 'Kembangraps', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Kuning_cabai.JPG' },
  { disease: 'rep-sap', symptom: 'Cục bông trắng ở nách lá, gân lá; chọc vào có dịch hồng hoặc vàng', source: 'rep-sap-1.jpg', file: 'a387d7f8574c2b3bc88cf3715ccf2440.jpg',
    author: 'Alexlutor', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Mealybugs_feeding_on_hibiscus_plant.jpg' },
  { disease: 'nhen-do', symptom: 'Mặt lá lấm tấm chấm trắng li ti, lá mất màu, bạc dần', source: 'nhen-do-1.jpg', file: '6b9d4e5d1a7dfe03bf9e4d1c5cae2273.jpg',
    author: 'Natalka Ukraine (baby-bear.org)', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Solanum_lycopersicum_leaves_with_spider_mite_or_thrips_damage_in_Dnipro_by_baby-bear.org.jpg' },
  { disease: 'nhen-do', symptom: 'Mặt dưới lá có tơ mảnh, chấm đỏ nhỏ di chuyển', source: 'nhen-do-2.jpg', file: 'e43b69a90a235d2f7807add67d910ecb.jpg',
    author: 'Toby Young', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Spider_mites_on_a_pepino_leaf.png' },
  { disease: 'bo-tri', symptom: 'Vệt bạc, trắng xám trên lá, kèm chấm đen nhỏ (phân bọ trĩ)', source: 'bo-tri-1.jpg', file: 'cb0a95fe3ab4502035acda120a6f084e.jpg',
    author: 'Scot Nelson', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Mango_trhips.jpg' },
  { disease: 'bo-tri', symptom: 'Đọt non cong queo, lá mới nhỏ', source: 'bo-tri-2.jpg', file: '19614ff843232f7f916bbc7a39896776.jpg',
    author: 'Forest and Kim Starr', license: 'CC BY 3.0 US', url: 'https://commons.wikimedia.org/wiki/File:Starr-170621-0614-Ficus_microcarpa-leaves_with_Cuban_Laurel_thrips_damage-West_Beach_Sand_Island-Midway_Atoll_(36410078616).jpg' },
  { disease: 'rep-muoi', symptom: 'Đám rệp nhỏ bám đọt non, mặt dưới lá non', source: 'rep-muoi-1.jpg', file: 'ca1fad96cb2b98a059e5887563ab2f06.jpg',
    author: 'Brandon Antonio Segura Torres & Priscilla Vieto Bonilla', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Pulgones_del_rosal_de_varios_colores.jpg' },
  { disease: 'rep-muoi', symptom: 'Nụ bị bám, hoa nở méo hoặc rụng', source: 'rep-muoi-2.jpg', file: '5f4887978a3affa3301e99395c8106fb.jpg',
    author: 'merve.obekci', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Aphids_on_a_Rosebud.jpg' },
  { disease: 'sau-an-la', symptom: 'Lá thủng lỗ, khuyết mép, có khi chỉ còn gân', source: 'sau-an-la-1.jpg', file: '747718d1f5f4563b3650a143c8bbd672.jpg',
    author: 'Bernard Dupont', license: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Unidentified_Caterpillars_feeding_on_Large_Fever-Berry_(Croton_megalobotrys)_leaves_..._(53020371771).jpg' },
  { disease: 'sau-an-la', symptom: 'Phân sâu dạng viên đen nhỏ trên lá hoặc mặt đất', source: 'sau-an-la-2.jpg', file: '320749ad21240c7c6bb645164ebe0465.jpg',
    author: 'Forest and Kim Starr', license: 'CC BY 3.0 US', url: 'https://commons.wikimedia.org/wiki/File:Starr-100315-3721-Cocculus_orbiculatus-leaf_with_Oraesia_excavata_caterpillar_frass-Olinda-Maui_(24644850159).jpg' },
  { disease: 'sau-an-la', symptom: 'Ổ trứng hoặc sâu non ở mặt dưới lá', source: 'sau-an-la-3.jpg', file: 'e85c2c66019e2cb5fae541eea8c39c07.jpg',
    author: 'Jidanni', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Caterpillars_on_Chinese_yam_vine.jpg' },
  { disease: 'sau-duc-than', symptom: 'Lỗ nhỏ trên thân, cành, có mạt cưa hoặc phân sâu đùn ra', source: 'sau-duc-than-1.jpg', file: 'b393c6c31396dff39773bac245976c41.jpg',
    author: 'Forest and Kim Starr', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Starr-220412-5722-Aleurites_moluccana-with_Plumeria_Borer_damage_exit_holes_and_frass-Iao-Maui_(52496324183).jpg' },
  { disease: 'tuyen-trung-sung-re', symptom: 'Rễ có nhiều u sưng tròn hoặc chuỗi hạt, không gỡ ra được', source: 'tuyen-trung-sung-re-1.jpg', file: '9baa2a1a3a8305f7f874e4d64c39c608.jpg',
    author: 'Jeffrey W. Lotz, Florida Department of Agriculture and Consumer Services, Bugwood.org', license: 'CC BY 3.0 US', url: 'https://commons.wikimedia.org/wiki/File:Root-knot_nematode_(Meloidogyne_enterolobii)_5384315.jpg' },
  { disease: 'oc-sen', symptom: 'Lá bị ăn khuyết lỗ lớn, mép không đều', source: 'oc-sen-1.jpg', file: 'b23e055ff875a36b9bcd6fdf848229cd.jpg',
    author: 'Josef Schlaghecken', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Endivien-Schnecken-Josef_Schlaghecken.jpg' },
  { disease: 'vang-la-thieu-dam', symptom: 'Lá non nhỏ, xanh nhạt', source: 'vang-la-thieu-dam-1.jpg', file: '80552341d0270b3eb877820e0915a966.jpg',
    author: 'Rasbak', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Phaseolus_vulgaris_nitrogen_deficiency.jpg' },
  { disease: 'vang-la-thieu-sat', symptom: 'Lá non vàng nhạt hoặc trắng, gân vẫn xanh rõ', source: 'vang-la-thieu-sat-1.jpg', file: 'af4dc36855399cc8fe78c965fba9b44c.jpg',
    author: 'Moinats', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Chlorose_rubus_ulmifolius.jpg' },
  { disease: 'vang-la-thieu-sat', symptom: 'Lá già phía dưới vẫn xanh bình thường', source: 'vang-la-thieu-sat-2.jpg', file: '444ae17b37660352f35cb7971fafe088.jpg',
    author: 'Frank Vincentz', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Banksia_integrifolia_02_ies.jpg' },
  { disease: 'vang-la-thieu-sat', symptom: 'Nặng: lá non gần trắng, mép khô', source: 'vang-la-thieu-sat-3.jpg', file: '4a653a15c582804c0f8f6c8fe8ef06c6.jpg',
    author: 'Pierre.hamelin', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Chlorose_hortensia.jpg' },
  { disease: 'chay-la-do-nang', symptom: 'Mảng trắng bạc hoặc nâu khô ở phần lá hứng nắng', source: 'chay-la-do-nang-1.jpg', file: '40e7616bf5c28b1da88013cf12b8b2ab.jpg',
    author: 'Josef Schlaghecken', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Paprika_Sonnenbrand-4-Schlaghecken.jpg' },
  { disease: 'chay-la-do-nang', symptom: 'Mép, chóp lá khô giòn, ranh giới rõ', source: 'chay-la-do-nang-2.jpg', file: 'd3de1c6d74db75ccae5f2dd2a6069ec7.jpg',
    author: 'Velotopist', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Diervilla_Honeybee_Blaetter_mit_Sonnenbrand.JPG' },
  { disease: 'heo-thieu-nuoc', symptom: 'Lá rũ, cuộn hoặc quăn, sờ thấy mỏng và giòn', source: 'heo-thieu-nuoc-1.jpg', file: '31b960a53c171a915a1335f290b10679.jpg',
    author: 'Famartin', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:2023-06-04_16_12_41_A_forsythia_bush_wilting_during_a_dry_spell_along_Barbara_Lane_in_the_Mountainview_section_of_Ewing_Township,_Mercer_County,_New_Jersey.jpg' },
  { disease: 'rung-la-soc-moi-truong', symptom: 'Lá vàng rồi rụng nhiều trong 1–2 tuần sau khi đổi chỗ', source: 'rung-la-soc-moi-truong-1.jpg', file: 'fff6310f19de528ac254ad28e2874557.jpg',
    author: 'Maja Dumat', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Blattfall_beim_Ficus_benjamina_(10577273353).jpg' },
  { disease: 'chay-re-do-phan', symptom: 'Mép và chóp lá cháy nâu đều trên nhiều lá cùng lúc', source: 'chay-re-do-phan-1.jpg', file: '4d8e0c2d9ca48224a4398ae434e66e0b.jpg',
    author: 'Fenrisulfir', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Fertilizer-Burn.jpg' },
];

const byFile = new Map(SEED_DISEASE_IMAGES.map((x) => [x.file, x]));

/** Nguồn ảnh minh họa (chỉ ảnh nạp sẵn); tên tác giả ngắn gọn để ghi dưới ảnh. */
export function diseaseImageCredit(file?: string) {
  const x = file ? byFile.get(file) : undefined;
  return x && { author: x.author.split(',')[0], license: x.license, url: x.url };
}
