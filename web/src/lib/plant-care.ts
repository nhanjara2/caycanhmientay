// Nội dung "Cách chăm sóc / Lưu ý / Câu hỏi thường gặp" ở trang cây, dựng từ thông số của cây (migration 0037 điền ~15 dòng cho mỗi cây).
// Cây chưa có thông số chăm sóc thì không sinh gì thêm (trang dùng lại 4 dòng thông số đầu như trước).
import { specKeyVi } from './i18n-content';
import type { Product } from './catalog';

/** Dòng thông số dùng cho mục "Cách chăm sóc", theo thứ tự hiện. */
const CARE_KEYS = ['Ánh sáng', 'Tưới nước', 'Đất trồng', 'Bón phân', 'Nhiệt độ, độ ẩm', 'Cách nhân giống'];

const specMap = (p: Pick<Product, 'specs'>) => new Map(p.specs.map(([k, v]) => [specKeyVi(k).trim(), v.trim()]));
const sentence = (v: string) => (/[.!?…]$/.test(v) ? v : `${v}.`);
const lower = (v: string) => v.charAt(0).toLowerCase() + v.slice(1);

export function careSteps(p: Pick<Product, 'specs'>): [string, string][] {
  const m = specMap(p);
  return CARE_KEYS.flatMap((k) => (m.get(k) ? [[k, m.get(k)!] as [string, string]] : []));
}

/** Việc cần làm khi cây mới về + lưu ý riêng của cây (sâu bệnh, thú cưng). */
export function careNotes(p: Pick<Product, 'specs'>, lang: 'vi' | 'en' = 'vi'): string[] {
  const m = specMap(p);
  if (lang === 'en') {
    const out = [
      'Unpack as soon as it arrives and water lightly if the soil is dry; keep it in gentle light for the first week before moving it to its final spot.',
      'Do not fertilise or repot for the first 2–3 weeks; a few old leaves dropping or slight wilting on arrival is normal.',
      'Water in the early morning or late afternoon, at the base; use a pot with drainage holes and do not leave water in the saucer.',
    ];
    const pests = m.get('Sâu bệnh thường gặp');
    if (pests) out.push(`Common problems: ${sentence(lower(pests))} Check the undersides of leaves weekly.`);
    return out;
  }
  const notes = [
    'Mở hộp ngay khi nhận, tưới nhẹ nếu đất khô; tuần đầu để cây chỗ sáng nhẹ, thoáng gió cho quen môi trường rồi mới chuyển ra vị trí chính.',
    'Chưa bón phân, chưa thay chậu trong 2–3 tuần đầu; cây rụng vài lá già hoặc hơi rũ lúc mới về là bình thường.',
    'Tưới vào sáng sớm hoặc chiều mát, tưới vào gốc; chậu phải có lỗ thoát nước, không để nước đọng trong đĩa lót.',
  ];
  const pests = m.get('Sâu bệnh thường gặp');
  if (pests) notes.push(`Hay gặp: ${sentence(lower(pests))} Kiểm tra mặt dưới lá mỗi tuần để xử lý sớm.`);
  const pet = m.get('An toàn thú cưng');
  if (pet && /^không/i.test(pet)) notes.push(`Để xa tầm với của trẻ nhỏ và chó mèo: ${sentence(lower(pet.replace(/^không\s*[—–-]\s*/i, '')))}`);
  return notes;
}

/** Câu hỏi thường gặp tự sinh từ thông số; câu admin nhập (bảng faqs) vẫn hiện trước. */
export function careFaqs(p: Pick<Product, 'name' | 'specs'>, lang: 'vi' | 'en' = 'vi'): { question: string; answer: string }[] {
  const m = specMap(p);
  const n = p.name;
  const out: { question: string; answer: string }[] = [];
  const add = (key: string, question: string, answer = (v: string) => sentence(v)) => {
    const v = m.get(key);
    if (v) out.push({ question, answer: answer(v) });
  };
  if (lang === 'en') {
    add('Tưới nước', `How often should I water ${n}?`);
    add('Ánh sáng', `Where should I place ${n}?`);
    add('Sâu bệnh thường gặp', `${n} has yellow leaves or rotting stems — what should I do?`, (v) =>
      `${sentence(v)} Most cases come from overwatering or too little light: water less, let the topsoil dry before watering again, move the plant to a brighter spot and remove damaged leaves. Send us a photo on Zalo for advice.`);
    add('Bón phân', `What fertiliser does ${n} need, and how often?`);
    add('An toàn thú cưng', `Is ${n} toxic to cats, dogs or children?`);
    add('Cách nhân giống', `Can I propagate ${n} myself?`);
    return out;
  }
  add('Tưới nước', `Bao lâu tưới ${n} một lần?`);
  add('Ánh sáng', `${n} đặt ở đâu thì hợp?`);
  add('Sâu bệnh thường gặp', `${n} bị vàng lá, thối gốc phải làm sao?`, (v) =>
    `${sentence(v)} Đa số do tưới quá nhiều hoặc thiếu sáng: giảm tưới, để đất khô mặt rồi mới tưới lại, chuyển cây ra chỗ sáng hơn; cắt bỏ lá hỏng. Gửi ảnh qua Zalo để kỹ sư tư vấn thuốc nếu có sâu, rệp.`);
  add('Bón phân', `${n} bón phân gì, bao lâu một lần?`);
  add('An toàn thú cưng', `${n} có độc với chó mèo, trẻ nhỏ không?`);
  add('Cách nhân giống', `Có tự nhân giống ${n} được không?`);
  return out;
}
