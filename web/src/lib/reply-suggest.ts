// Gợi ý trả lời cho nhân viên (AdminReviews: "nháp để nhân viên sửa, không tự gửi").
// Không dùng AI: lấy câu trả lời cũ cho câu hỏi giống nhau, hoặc ghép câu từ thông số sản phẩm theo chủ đề câu hỏi.
import { normalize } from './catalog';
import { SALES_PHONE } from './contact';
import { PLANT_ZONE_KM } from './stock';

// ---- Độ giống nhau giữa 2 câu hỏi ------------------------------------------------------------

/** Từ không mang nghĩa khi so câu hỏi (đã bỏ dấu). */
const STOP = new Set((
  'a ah ak da oi shop sop ad admin em minh anh chi ban cho hoi xin cam on vay the nao la thi va co khong ko k kh duoc dc '
  + 'cay nay do nhe nha voi cua o trong nhu can muon biet giup gi sao roi luon mot cai con di len ra vao se dang bi lai nua '
  + 'qua rat hay hoac neu khi de ma vi tai san pham sp ben minh toi tui').split(' '));

/** Tập từ + cặp từ liền nhau (đã bỏ dấu, bỏ từ vô nghĩa). */
export function termsOf(text: string) {
  const words = normalize(text).split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w));
  const out = new Set(words);
  for (let i = 1; i < words.length; i++) out.add(`${words[i - 1]} ${words[i]}`);
  return out;
}

/** Hệ số Dice 0–1 giữa 2 tập từ. */
export function similarity(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let common = 0;
  for (const t of a) if (b.has(t)) common++;
  return (2 * common) / (a.size + b.size);
}

/** Từ ngưỡng này coi là cùng một câu hỏi (dùng lại câu trả lời cũ, đếm "được hỏi lại"). */
export const SIMILAR_MIN = 0.45;

// ---- Soạn câu -----------------------------------------------------------------------------------

/** Bỏ câu chào đầu ("Chào chị Thư, …") để dùng lại câu trả lời cho người khác / đưa lên FAQ. */
export function stripGreeting(text: string) {
  const t = text.trim().replace(/^(dạ,?\s*)?(xin\s+)?chào[^,.!\n]{0,40}[,.!]\s*/i, '');
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

const phone = SALES_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
const lc = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const dot = (s: string) => s.replace(/[.\s]+$/, '') + '.';

/** "Nguyễn Minh Thư" → "Chào anh/chị Thư"; không có tên → "Chào anh/chị" (dấu câu do nơi gọi thêm). */
export function greet(name: string) {
  const w = name.trim().split(/\s+/).filter(Boolean);
  const given = name === 'Khách hàng' || !w.length ? '' : ` ${w[w.length - 1]}`;
  return `Chào anh/chị${given}`;
}

type ProductInfo = { name: string; ship: 'plant' | 'supply'; pesticide: boolean; specs: [string, string][] };

type Topic = { re: RegExp; say: (p: ProductInfo, spec: (...keys: string[]) => string | null, text: string) => string | null };

/** Chủ đề câu hỏi (so trên chữ đã bỏ dấu) → câu trả lời từ thông số sản phẩm. Thứ tự = thứ tự trong câu trả lời. */
const TOPICS: Topic[] = [
  {
    re: /\b(lieu|pha|bao nhieu (ml|g|gram|lit)|may ml|phun|tuoi goc|cach dung|su dung|dung the nao)\b/,
    say: (p, spec) => {
      const v = spec('Liều pha', 'Liều dùng');
      if (!v) return null;
      return `Liều dùng: ${dot(lc(v))}` + (p.pesticide ? ' Anh/chị pha đúng liều, không tự tăng liều, đeo găng tay và khẩu trang khi pha.' : '');
    },
  },
  {
    re: /\b(cach ly|thu hoach|an duoc|rau an|trai an)\b/,
    say: (_p, spec) => {
      const v = spec('Thời gian cách ly');
      return v ? `Thời gian cách ly: ${dot(lc(v))} Cần đủ thời gian này sau lần phun cuối mới thu hoạch.` : null;
    },
  },
  {
    re: /\b(hoat chat|thanh phan|npk|chua gi|goc gi)\b/,
    say: (_p, spec) => { const v = spec('Hoạt chất', 'Thành phần'); return v ? `Thành phần: ${dot(v)}` : null; },
  },
  {
    re: /\b(tuoi|nuoc|ung nuoc|ung re|kho dat)\b/,
    say: (_p, spec) => { const v = spec('Tưới nước'); return v ? `Tưới nước: ${dot(lc(v))} Tránh để nước đọng dưới đáy chậu làm thối rễ.` : null; },
  },
  {
    re: /\b(nang|anh sang|bong ram|thieu sang|it sang|trong nha|phong|may lanh|dieu hoa|van phong|ban cong|cua so|huong)\b/,
    say: (_p, spec, text) => {
      const v = spec('Ánh sáng');
      if (!v) return null;
      return `Ánh sáng: cây hợp ${dot(lc(v))}`
        + (/may lanh|dieu hoa/.test(text) ? ' Để phòng máy lạnh thì tránh hướng gió thổi thẳng và phun sương cho lá 2–3 lần/tuần.' : '');
    },
  },
  {
    re: /\b(cho meo|con cho|nuoi cho|meo|cun|thu cung|tre em|tre nho|co doc|doc khong|doc hai|ngo doc|an toan)\b/,
    say: (_p, spec) => {
      const v = spec('An toàn thú cưng');
      if (!v) return null;
      return /^khong/.test(normalize(v))
        ? `Cây không an toàn cho thú cưng (${lc(v).replace(/^không\s*[–-]?\s*/i, '') || 'có thể gây ngứa, khó chịu nếu nhai lá'}), anh/chị nên đặt cây xa tầm với của chó mèo và trẻ nhỏ.`
        : 'Cây an toàn với thú cưng, anh/chị yên tâm đặt trong nhà.';
    },
  },
  {
    re: /\b(thay chau|doi chau|sang chau)\b/,
    say: (p) => (p.ship === 'plant' ? 'Khoảng 12–18 tháng nên thay chậu một lần, hoặc khi thấy rễ mọc ra lỗ thoát nước; nên thay vào đầu mùa mưa.' : null),
  },
  {
    re: /\b(cao|kich thuoc|bao lon|to khong|lon khong|size|chau)\b/,
    say: (_p, spec, text) => {
      if (/thay chau|doi chau|sang chau/.test(text)) return null;
      const h = spec('Chiều cao', 'Kích thước');
      const pot = spec('Chậu');
      if (!h && !pot) return null;
      return `Kích thước: ${[h && `cao ${lc(h)}`, pot && `chậu ${lc(pot)}`].filter(Boolean).join(', ')}. Mỗi cây là một cá thể nên dáng lá có thể khác đôi chút so với ảnh.`;
    },
  },
  {
    re: /\b(nguon goc|xuat xu|nhap khau|nhap tu|trong o dau|lay tu dau)\b/,
    say: (_p, spec) => { const v = spec('Nguồn gốc'); return v ? `Nguồn gốc: ${dot(v)}` : null; },
  },
  {
    re: /\b(bon phan|phan bon|bon gi|dinh duong)\b/,
    say: (p) => (p.ship === 'plant' ? 'Nên bón phân tan chậm NPK 14-14-14 khoảng 2 tháng/lần, hoặc trộn phân trùn quế vào giá thể; không bón khi cây mới về hoặc đang yếu.' : null),
  },
  {
    re: /\b(sau benh|con sau|bi sau|rep|bi nam|nam moc|nam trang|benh|thoi re|dom la|chay la|bo tri|nhen do)\b/,
    say: () => 'Anh/chị xem thêm mục Bệnh cây trên web, hoặc gửi ảnh lá/rễ qua Zalo để kỹ sư bắt bệnh giúp.',
  },
  {
    re: /\b(bao hanh|doi tra|doi cay|heo|vang la|rung la|chet|hu)\b/,
    say: (p) => (p.ship === 'plant'
      ? 'Cây được bảo hành 7 ngày kể từ khi nhận: nếu cây héo, bệnh anh/chị chụp ảnh và gửi yêu cầu trong mục Tài khoản → Bảo hành cây, kỹ sư phản hồi trong 24 giờ.'
      : 'Hàng lỗi anh/chị nhắn Zalo kèm ảnh sản phẩm và mã đơn để shop hỗ trợ đổi trả theo chính sách.'),
  },
  {
    re: /\b(giao|ship|van chuyen|nhan hang|tinh khac|ngoai tinh|cac tinh|ve tinh|ngoai thanh)\b/,
    say: (p) => (p.ship === 'plant'
      ? `Cây sống shop giao trong bán kính ${PLANT_ZONE_KM} km quanh cửa hàng gần nhất, đóng khung chống dập; anh/chị cũng có thể chọn Nhận tại vườn (không tính phí giao).`
      : 'Nội thành giao nhanh 2 giờ; tỉnh khác 2–4 ngày qua đơn vị vận chuyển.'),
  },
  {
    re: /\b(nhan tai|tai vuon|cua hang|den lay|den xem|xem truc tiep|dia chi)\b/,
    say: () => 'Anh/chị có thể ghé xem trực tiếp tại cửa hàng (xem trang Hệ thống cửa hàng) hoặc chọn Nhận tại vườn khi thanh toán.',
  },
  {
    re: /\b(con hang|het hang|co san|khi nao ve|con khong)\b/,
    say: () => 'Số lượng còn hàng hiện ngay ở phần chọn quy cách; nếu tạm hết, anh/chị nhắn Zalo để shop báo ngày có hàng.',
  },
  {
    re: /\b(si|so luong lon|mua nhieu|chiet khau|bao gia|cong trinh)\b/,
    say: () => `Mua số lượng lớn anh/chị nhắn Zalo ${phone} để shop báo giá tốt nhất.`,
  },
  {
    re: /\b(hoa don|vat|xuat hd)\b/,
    say: () => 'Shop có xuất hóa đơn điện tử: anh/chị bật "Yêu cầu xuất hóa đơn điện tử" ở bước thanh toán và điền thông tin công ty.',
  },
];

export type Suggestion = { text: string; basis: string };

/** Câu hỏi đã có trả lời (của shop hoặc FAQ) để dùng lại. */
export type AnsweredQA = { question: string; answer: string; terms: Set<string>; sameProduct: boolean };

/**
 * Gợi ý trả lời câu hỏi: ưu tiên câu trả lời cũ cho câu hỏi giống nhau (cùng sản phẩm được cộng điểm),
 * không có thì ghép từ thông số sản phẩm theo chủ đề câu hỏi. Không đoán được thì trả null (không gợi ý bừa).
 */
export function suggestQuestionReply(q: { content: string; customer: string }, p: ProductInfo, answered: AnsweredQA[]): Suggestion | null {
  const terms = termsOf(q.content);
  let best: AnsweredQA | null = null;
  let bestScore = 0;
  for (const a of answered) {
    const s = similarity(terms, a.terms) + (a.sameProduct ? 0.1 : 0);
    if (s > bestScore) { best = a; bestScore = s; }
  }
  if (best && bestScore >= SIMILAR_MIN) {
    const body = stripGreeting(best.answer);
    if (body) return { text: `${greet(q.customer)}! ${body}`, basis: `Câu trả lời trước cho câu hỏi tương tự: “${best.question}”` };
  }

  const text = normalize(q.content);
  const spec = (...keys: string[]) => {
    for (const k of keys) {
      const v = p.specs.find(([sk]) => sk === k)?.[1]?.trim();
      if (v) return v;
    }
    return null;
  };
  const parts: string[] = [];
  for (const t of TOPICS) {
    if (parts.length >= 3) break;
    if (!t.re.test(text)) continue;
    const s = t.say(p, spec, text);
    if (s && !parts.includes(s)) parts.push(s);
  }
  if (!parts.length) return null;
  return { text: `${greet(q.customer)}! ${parts.join(' ')} Cần tư vấn thêm, anh/chị nhắn Zalo ${phone} nhé!`, basis: 'Ghép từ thông số sản phẩm — kiểm tra lại trước khi gửi' };
}

/** Gợi ý trả lời đánh giá theo số sao; đánh giá nghi quảng cáo thì không gợi ý (nên ẩn). */
export function suggestReviewReply(r: {
  stars: number; customer: string; verified: boolean; isPlant: boolean; shipping: boolean; ad: boolean;
  /** Nhân viên đã tạo yêu cầu bảo hành thay khách từ đánh giá này. */
  warrantyCode?: string | null;
}): Suggestion | null {
  if (r.ad) return null;
  const hi = `${greet(r.customer)},`;
  const ship = r.shipping ? 'Shop xin lỗi vì khâu giao hàng chưa làm anh/chị hài lòng, shop đã nhắc bộ phận giao hàng rút kinh nghiệm. ' : '';
  const zalo = `nhắn Zalo ${phone}`;
  let text: string;
  if (r.stars >= 5) {
    text = `${hi} cảm ơn anh/chị đã tin chọn Cây Cảnh Miền Tây và dành thời gian đánh giá! `
      + (r.isPlant ? `Chúc cây luôn xanh tốt — cần tư vấn chăm cây anh/chị cứ ${zalo} nhé.` : `Cần hỗ trợ thêm về cách dùng anh/chị cứ ${zalo} nhé.`);
  } else if (r.stars === 4) {
    text = `${hi} cảm ơn anh/chị đã đánh giá! ${ship || 'Shop ghi nhận góp ý để phục vụ tốt hơn. '}Cần hỗ trợ gì thêm anh/chị cứ ${zalo} nhé.`;
  } else if (r.stars === 3) {
    text = `${hi} cảm ơn anh/chị đã góp ý. ${ship || 'Shop rất muốn biết thêm điều gì chưa làm anh/chị hài lòng để khắc phục. '}Anh/chị ${zalo} giúp shop nhé.`;
  } else {
    const fix = r.warrantyCode
      ? `Shop đã tạo yêu cầu bảo hành #${r.warrantyCode} cho anh/chị (xem trong mục Tài khoản → Bảo hành cây), kỹ sư sẽ liên hệ trong 24 giờ để đổi cây hoặc hướng dẫn cứu cây. `
      : r.isPlant
      ? (r.verified
        ? 'Cây được bảo hành 7 ngày: anh/chị chụp ảnh cây và gửi yêu cầu trong mục Tài khoản → Bảo hành cây, kỹ sư sẽ xem và đổi cây hoặc hướng dẫn cứu cây trong 24 giờ. '
        : `Anh/chị ${zalo} kèm ảnh cây và mã đơn để kỹ sư kiểm tra giúp. `)
      : `Anh/chị ${zalo} kèm ảnh sản phẩm và mã đơn để shop hỗ trợ đổi trả theo chính sách. `;
    text = `${hi} shop thành thật xin lỗi vì trải nghiệm chưa tốt. ${ship}${fix}Shop sẽ liên hệ anh/chị sớm nhất.`;
  }
  return { text, basis: `Mẫu cho đánh giá ${r.stars} sao — sửa cho đúng trường hợp trước khi gửi` };
}
