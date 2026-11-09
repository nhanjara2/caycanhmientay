// English version of lib/policy-content.ts (shown at /en/chinh-sach/…). Translated from the Vietnamese pages —
// when the Vietnamese content changes, update the matching section here too. Links keep the Vietnamese paths
// (LocaleLink adds /en automatically).
import { CARE_PHONE, formatPhone, SALES_PHONE, SHOP_ADDRESS, SHOP_EMAIL, SUPPORT_PHONE, ZALO_URL } from './contact';
import { money } from './format';
import { SLOT_CLOSE_BEFORE_END_MIN, slotTime, type ShippingConfig } from './shipping';
import { SUPPLY_RETURN_DAYS, WARRANTY_DAYS } from './warranty-labels';
import type { Block, PolicyContext, Section } from './policy-content';

type Body = Section[] | ((ctx: PolicyContext) => Section[]);

const phone = (p: string) => `[${formatPhone(p)}](tel:${p})`;
const zalo = `[Zalo ${formatPhone(SALES_PHONE)}](${ZALO_URL})`;
const HOURS = '8:00 – 21:00 (Vietnam time)';

const contact = (who: 'sales' | 'care' | 'support' = 'support'): Block => ({
  note: who === 'sales'
    ? `Need buying advice? Call ${phone(SALES_PHONE)} (Nhân) or message ${zalo}, ${HOURS}.`
    : who === 'care'
      ? `Need plant-care or disease advice? Call ${phone(CARE_PHONE)} (Thịnh) or message ${zalo}, ${HOURS}.`
      : `Need help, feedback or want to make a complaint? Call ${phone(SUPPORT_PHONE)} (Trâm), message ${zalo} or email ${SHOP_EMAIL}, ${HOURS}.`,
});

const GIAY_PHEP: Section[] = [
  { h: 'Business registration', blocks: [
    'Cây Cảnh Miền Tây publishes its business registration details so you can buy with confidence.',
    { table: { head: ['Item', 'Details'], rows: [
      ['Trading name', 'Cây Cảnh Miền Tây'],
      ['Responsible person', 'Lê Hoài Nhân'],
      ['Business registration no.', '087096010726, issued 04/2026'],
      ['Tax authority', 'Grassroots Tax Office 6, Đồng Tháp Province'],
      ['Address', SHOP_ADDRESS],
      ['Phone', `${phone(SALES_PHONE)} (sales)`],
      ['Email', SHOP_EMAIL],
    ] } },
  ] },
  { h: 'Lines of business', blocks: [
    { ul: [
      '**Ornamental plants:** landscape plants, office plants and young plants.',
      '**Pesticides, fertilisers and garden supplies:** pots, soil and growing media, tools, seeds.',
      '**Wholesale supply:** plants and supplies for landscaping, construction and trade partners ([Wholesale partners page](/doi-tac)). Since October 2026 we no longer offer installation, maintenance or plant rental.',
    ] },
  ] },
  { h: 'Specialised licences', blocks: [
    '**Plant protection products.** Cây Cảnh Miền Tây meets the requirements to trade plant protection products. Every pesticide on the website lists its registration number, active ingredient, mixing rate and pre-harvest interval; products without this information are not listed for sale.',
    '**E-commerce website.** The website has been notified to the Ministry of Industry and Trade as required.',
    { note: `Want to check the original documents? Call ${phone(SUPPORT_PHONE)} or visit our nursery at ${SHOP_ADDRESS} ([map and opening hours](/he-thong-cua-hang)).` },
  ] },
  { h: 'Further reading', blocks: [
    { ul: [
      '[Operating rules](/chinh-sach/quy-che-hoat-dong): ordering process, payment safety, complaint handling.',
      '[Privacy policy](/chinh-sach/bao-mat): how we use and protect your data.',
    ] },
  ] },
];

const QUY_CHE: Section[] = [
  { h: 'General principles', blocks: [
    'These rules apply to the website **caycanhmientay.com** (the "website") operated by **Cây Cảnh Miền Tây** (the "shop"); the responsible person is Mr Lê Hoài Nhân. Business registration details: [Business licence](/chinh-sach/giay-phep-kinh-doanh).',
    { ul: [
      'The website is where the shop **sells wholesale** plants, fertilisers and garden supplies to partners (landscaping firms, contractors, shops and resellers) and receives wholesale quote requests. All goods are sold by the shop; the website is not a marketplace for other sellers.',
      'Partner supply points listed on [Stores & nursery](/he-thong-cua-hang) are shown for reference only and do not sell through this website.',
      'The shop operates under Vietnamese law on e-commerce, consumer protection, plant protection and personal data protection.',
    ] },
  ] },
  { h: 'General rules for using the website', blocks: [
    { ul: [
      'You can browse and order without an account. Writing reviews, asking questions, saving favourites, submitting warranty requests or using My garden require signing in with a Google account.',
      'Information you provide (name, phone number, address) must be accurate so the shop can deliver and support you.',
      'Not allowed: fake orders; creating multiple accounts to claim gifts or discount codes repeatedly; posting advertising, phone numbers or links, abusive or false content; interfering with the system or scraping data in bulk.',
      'The shop may refuse service, cancel orders or lock accounts when violations are found.',
    ] },
    'Details: [Terms of use](/chinh-sach/dieu-khoan).',
  ] },
  { h: 'Ordering process', blocks: [
    { ol: [
      '**Choose items:** pick the product, size and quantity, then tap **Add to cart** or **Buy now**.',
      '**Checkout:** open the cart, enter your name and phone number, choose **Home delivery** (with an address) or **Pick up at the nursery**, add a discount code if you have one, then tap **Place order**. Orders containing pesticides require confirming you have read the safety guide.',
      '**Order placed:** the system creates an order with an order code. Prices, shipping fees, discount codes and stock are recalculated at this point; the final amount is shown before you confirm.',
      '**Shop confirms:** the shop calls or messages you within 30 minutes (' + HOURS + '). The order takes effect once the shop confirms it.',
      '**Preparation and delivery:** the shop prepares your goods, sends real photos of live plants before delivery, then delivers or holds the goods for nursery pickup.',
      '**Receiving:** check your goods and earn reward points. Live plants come with a ' + WARRANTY_DAYS + '-day [warranty](/chinh-sach/bao-hanh-cay).',
    ] },
    'Track your order under **Account → Orders**: Placed → Confirmed → Preparing → Shipping → Delivered. Important changes are notified on the website (bell icon) and possibly via Zalo or email.',
    { ul: [
      'The shop may refuse or cancel an order when out of stock, when a price is shown incorrectly due to a system error, when you cannot be reached or when fraud is suspected. Paid orders are refunded.',
      'To cancel, contact the shop before the order changes to "Shipping". See the [Returns policy](/chinh-sach/doi-tra).',
    ] },
  ] },
  { h: 'Prices, payment, delivery, warranty', blocks: [
    { ul: [
      'Prices are in Vietnamese dong (VND). Products show their type, size and price; pesticides also show registration number, active ingredient, mixing rate and pre-harvest interval.',
      'Payment methods: [Payment policy](/chinh-sach/thanh-toan). Fees and delivery times: [Delivery policy](/chinh-sach/giao-hang).',
      'Live plants: ' + WARRANTY_DAYS + '-day [Plant warranty policy](/chinh-sach/bao-hanh-cay). Supplies, pesticides and fertilisers: [Returns policy](/chinh-sach/doi-tra).',
      'Large pre-ordered plants and landscape projects: [Deposit policy](/chinh-sach/dat-coc).',
    ] },
  ] },
  { h: 'Transaction safety', blocks: [
    { ul: [
      'You sign in with your Google account (the website never holds your password); sessions are protected by a dedicated cookie.',
      'The website does not collect or store card numbers, CVV codes, passwords or bank OTP codes. The shop will never ask you for them.',
      'Photos you send for warranty or quote requests are visible only to you and the staff handling them.',
      'Staff can access only their own area of work (customer care, warehouse, agronomist, delivery) according to their role.',
      'Sign out when using a shared device. If you suspect someone else is using your account, call the hotline below immediately.',
    ] },
  ] },
  { h: 'Personal data protection', blocks: [
    'The shop collects only the information needed for selling, delivery, warranty and customer care, and never sells your personal data. Full details: [Privacy policy](/chinh-sach/bao-mat).',
  ] },
  { h: 'Complaints and disputes', blocks: [
    { ol: [
      `**Contact us:** call ${phone(SUPPORT_PHONE)} (Trâm), message ${zalo} or email ${SHOP_EMAIL} (${HOURS}) with your order code and photos if any. For damaged live plants, use **Account → Plant warranty** and an agronomist will reply within 24 hours.`,
      '**Shop review:** staff contact you to clarify what happened and propose a solution (exchange, support, refund, or an explanation if the request is declined).',
      '**No agreement:** both sides keep negotiating in good faith. If still unresolved, you may complain to the competent state authority or file a lawsuit in court under Vietnamese law.',
    ] },
    contact('support'),
  ] },
  { h: 'Effect and amendments', blocks: [
    'These rules take effect from the date they are posted. When amended, the shop posts the new version on this page with the update date; continuing to use the website after that means you accept the new version.',
  ] },
];

const DOI_NGU: Section[] = [
  { h: 'Who is behind Cây Cảnh Miền Tây', blocks: [
    'Cây Cảnh Miền Tây is run by **Lê Hoài Nhân** (responsible for the website content), operating since 2007 in Sa Đéc Flower Village, Đồng Tháp, together with nearly 200 partner nurseries across southern and south-central Vietnam ([read About us](/chinh-sach/gioi-thieu)).',
    'Each need has its own contact so you are never passed around:',
    { table: { head: ['You need', 'Call', 'Contact person'], rows: [
      ['Buying advice', phone(SALES_PHONE), 'Nhân'],
      ['Plant care, diagnosing disease', phone(CARE_PHONE), 'Thịnh'],
      ['Feedback, complaints, warranty', phone(SUPPORT_PHONE), 'Trâm'],
    ] } },
    `Working hours ${HOURS}. You can also message us on ${zalo}.`,
  ] },
  { h: 'Agronomists who review content', blocks: [
    'All plant-care, disease and pesticide guidance on the website is reviewed by an agricultural engineer before publishing. Reviewed articles carry a **Reviewed** label with the engineer\'s name.',
    { ul: [
      '[Plant care corner](/goc-cham-cay): guides and videos for each type of plant.',
      '[Plant disease finder](/benh-cay): a library of symptoms, causes and treatments.',
      '[Safe pesticide use guide](/chinh-sach/thuoc-bvtv-an-toan).',
    ] },
    'Review rules in detail: [Content policy](/chinh-sach/noi-dung).',
  ] },
  { h: 'How to get advice', blocks: [
    { ul: [
      '**Ask on a product page:** post a question in the Q&A section; an agronomist answers within 2 working hours and notifies you.',
      '**Ask via Zalo:** free advice for every plant you have bought from us.',
      '**Diseased, wilting or leaf-dropping plants:** send photos under **Account → Plant warranty** (within ' + WARRANTY_DAYS + ' days of receipt); an agronomist replies within 24 hours.',
      '**Large quantities, projects:** [send a wholesale quote request](/bao-gia-si) with your plant list or bill of quantities.',
      '**In person:** bring a leaf sample or photos to the nursery for an agronomist to look at ([address and hours](/he-thong-cua-hang)).',
    ] },
    contact('care'),
  ] },
];

const plantVaries = (s: ShippingConfig) => new Set(Object.values(s.plant.regionFee)).size > 1 || new Set(Object.values(s.plant.regionFree)).size > 1;

function plantFeeRows(s: ShippingConfig): string[][] {
  const { regionFee: fee, regionFree: free } = s.plant;
  if (!plantVaries(s)) return [['Live plants', money(fee.hcm), money(free.hcm)]];
  const { hcm, west } = s.regionProvinces;
  return [
    ...(hcm.length ? [[`Live plants — to ${hcm.join(', ')}`, money(fee.hcm), money(free.hcm)]] : []),
    ...(west.length ? [[`Live plants — to the Mekong Delta (${west.join(', ')})`, money(fee.west), money(free.west)]] : []),
    ['Live plants — to all other provinces / cities', money(fee.far), money(free.far)],
  ];
}

function giaoHang({ shipping: s }: PolicyContext): Section[] {
  const zone = s.plantZoneEnabled
    ? `**Live plants** are delivered within **${s.plantZoneKm} km** of the nearest store. For addresses further away, choose **Pick up at the nursery** or contact the shop for advice.`
    : '**Live plants** are delivered **nationwide** in a protective frame.';
  const days = s.daysAhead <= 1 ? 'today' : `within the next ${s.daysAhead} days`;
  return [
    { h: 'Delivery coverage', blocks: [
      { ul: [
        zone,
        '**Pesticides, fertilisers, pots, soil and growing media, tools and seeds** are delivered nationwide.',
        `**Nursery pickup:** choose **Pick up at the nursery** at checkout — no shipping fee. Cây Cảnh Miền Tây nursery, ${SHOP_ADDRESS} ([map, opening hours](/he-thong-cua-hang)). We hold your goods for 3 days and message you on Zalo when they are ready.`,
      ] },
    ] },
    { h: 'Retail price, 2-plant combo, project wholesale price', blocks: [
      `${s.minOrder > 0 ? `**Delivery** orders need at least **${money(s.minOrder)} worth of goods** (after combo, before discount codes); with **nursery pickup** you can buy a single plant.` : 'You can order a single plant.'} Each item is charged at the **retail price**; every 2 plants of the same size are charged at the **2-plant combo price** — the cart does this automatically, no code needed. Larger orders can use [current discount codes](/khuyen-mai) (choose them in the cart or at checkout). For large project quantities or special sizes, [send a wholesale quote request](/bao-gia-si).`,
    ] },
    { h: 'Shipping fees', blocks: [
      { table: { head: ['Goods', 'Shipping fee', 'Free when goods total from'], rows: [
        ...plantFeeRows(s),
        ['Supplies (pesticides, fertilisers, pots, soil, tools, seeds)', money(s.supply.fee), money(s.supply.freeFrom)],
        ['Nursery pickup', 'Free', '—'],
      ] } },
      { ul: [
        ...(plantVaries(s) ? ['**Live-plant shipping depends on the province / city of the delivery address.** Until you choose an address, the cart estimates the lowest rate; the exact amount appears at checkout before you order.'] : []),
        ...(s.plant.bulky > 0 ? [`**Large, bulky plants** (tall plants, big pots — noted on the product page under Shipping): surcharge of **${money(s.plant.bulky)} per plant**, charged even when the order qualifies for free shipping.`] : []),
        'Orders with both live plants and supplies: fees are charged separately per group; each group that reaches its free threshold ships free.',
        'Free-shipping thresholds are based on that group\'s goods total, before discount codes.',
        'Fees are shown in the cart and at checkout before you place the order; there are no hidden charges.',
      ] },
    ] },
    { h: 'Delivery time', blocks: [
      s.slotsEnabled
        ? `At checkout you choose a delivery day ${days} and one of the time slots below. Full slots show **Full**; each slot stops taking orders ${SLOT_CLOSE_BEFORE_END_MIN / 60} hours before it ends.`
        : `The shop calls or messages you within 30 minutes (${HOURS}) to confirm the order and give an estimated delivery time. Actual timing depends on distance and the carrier; we do not book fixed time slots for each order.`,
      ...(s.slotsEnabled ? [{ ul: s.slots.map((x) => slotTime(x)) } as Block] : []),
    ] },
    { h: 'Packing and delivering live plants', blocks: [
      { ul: [
        'Plants are packed in a protective frame for transport.',
        'We send **real photos of your plant** before delivery; you receive exactly the type and size you ordered.',
        'Large plants are delivered by small truck, carried in and placed where you want (see the [Deposit policy](/chinh-sach/dat-coc) for pre-ordered large plants).',
      ] },
    ] },
    { h: 'Checking your goods on arrival', blocks: [
      { ul: [
        '**Record a video or take photos while unpacking**, especially for live plants. This lets our agronomists act quickly if a plant is bruised, broken or differs from the order.',
        'Bruised or broken plants on arrival: submit a request under **Account → Plant warranty** on the day you receive them ([Warranty policy](/chinh-sach/bao-hanh-cay)).',
        'Wrong, missing or damaged supplies: see the [Returns policy](/chinh-sach/doi-tra).',
      ] },
    ] },
    { h: 'Tracking, changes and failed delivery', blocks: [
      { ul: [
        'Track your order under **Account → Orders**: Placed → Confirmed → Preparing → Shipping → Delivered. You are notified when delivery starts and when the courier arrives.',
        'To change the address or time, call the shop **before the order changes to "Shipping"**.',
        'If the courier cannot reach you or nobody is there to receive the goods, the order returns to the shop and staff contact you to rearrange.',
      ] },
      contact('sales'),
    ] },
  ];
}

const BAO_HANH: Section[] = [
  { h: 'Scope and period', blocks: [
    { ul: [
      `The warranty covers **live plants** bought from Cây Cảnh Miền Tây for **${WARRANTY_DAYS} days** from when the order becomes "Delivered".`,
      'Pesticides, fertilisers, pots, soil, tools and other supplies are not covered by this policy; see the [Returns policy](/chinh-sach/doi-tra).',
      'Each plant can have one open warranty request at a time.',
    ] },
  ] },
  { h: 'What is covered', blocks: [
    'The plant shows one of these signs after delivery:',
    { ul: ['Unusual yellowing leaves', 'Soft, drooping or wilting leaves', 'Brown spots on leaves', 'Leaf drop', 'Rotting at the base', 'Insects or aphids', 'Bruised or broken on arrival'] },
    'An agronomist reviews the photos to find the cause. If the damage comes from care after delivery (e.g. overwatering, sunburn, unsuitable placement) or external factors (extreme weather, pets), the agronomist may decline the claim and will **explain the reason** to you.',
  ] },
  { h: 'How to submit a request', blocks: [
    { ol: [
      'Sign in with the account you ordered with and go to **Account → [Plant warranty](/tai-khoan/bao-hanh)**.',
      'Choose the plant (only plants still under warranty are shown).',
      'Take **3 photos** as suggested: the whole plant (including pot), close-ups of affected leaves (top and underside), and the base and soil. At least 1 photo is required. Then select the symptoms and add a description.',
      'Tap **Submit request**. You get a request code such as BH-0012 and can follow the result on the same page.',
    ] },
    { note: 'Leave the plant as it is — do not cut affected leaves or change the soil before the agronomist has seen the photos. Keep the video or photos taken on arrival.' },
  ] },
  { h: 'How we resolve claims', blocks: [
    'An agronomist reviews the photos and **replies within 24 hours**. The outcome is one of four:',
    { table: { head: ['Resolution', 'What you get'], rows: [
      ['New replacement plant', 'The shop creates a 0đ replacement order and delivers to the same address.'],
      ['Plant rescue', 'Step-by-step rescue instructions plus free supplies (Trichoderma biological product) in a 0đ order.'],
      ['Refund', 'The shop records the refund amount, transfers it to you and notifies you when done.'],
      ['Declined', 'The agronomist explains the reason so you can care for the plant correctly.'],
    ] } },
    'Every change to your request is notified on the website (bell icon), and via Zalo or email where configured.',
  ] },
  { h: 'Notes', blocks: [
    { ul: [
      'Refunds follow the [Payment policy](/chinh-sach/thanh-toan).',
      'To discuss in person, bring the plant or invoice to the nursery ([see address](/he-thong-cua-hang)).',
    ] },
    contact('support'),
  ] },
];

const DOI_TRA: Section[] = [
  { h: 'Scope', blocks: [
    { ul: [
      '**Supplies:** pesticides, fertilisers, pots, soil and growing media, tools, seeds, decorative items.',
      '**Live plants:** damage, wilting and disease are handled under the [Plant warranty policy](/chinh-sach/bao-hanh-cay) (' + WARRANTY_DAYS + ' days). As fresh goods, delivered plants cannot be returned for a change of mind.',
    ] },
  ] },
  { h: 'Conditions for returning supplies', blocks: [
    `You may return or exchange within **${SUPPLY_RETURN_DAYS} days** of receipt if:`,
    { ul: [
      'The product still has its seals and labels, is unopened and unused.',
      'You have the order code (or invoice) for us to check.',
      'Opened or used products are handled only when the product itself is faulty (next section).',
    ] },
  ] },
  { h: 'Wrong, missing or faulty items', blocks: [
    'In these cases, tell the shop **as soon as you receive the goods** (with photos, the unboxing video and order code):',
    { ul: [
      'Wrong product or size compared with the order.',
      'Items missing from the order.',
      'Damaged product, torn packaging, expired, or not as described on the website.',
    ] },
    'The shop exchanges for the correct product or refunds, and pays return shipping when the error is ours.',
  ] },
  { h: 'How to request a return', blocks: [
    { ol: [
      `Message ${zalo} or call ${phone(SUPPORT_PHONE)} (Trâm) with your order code and product photos.`,
      'Staff confirm the request and explain how to send the goods back or exchange them directly.',
      'You can also bring the product and invoice to the nursery ([address, opening hours](/he-thong-cua-hang)).',
      'The shop checks the returned goods, then exchanges or refunds.',
    ] },
  ] },
  { h: 'Refunds', blocks: [
    { ul: [
      'Refunds are made by bank transfer to the account you provide.',
      'Refunds take **3–5 working days** from when the shop confirms the refund.',
    ] },
  ] },
  { h: 'Cancelling an order', blocks: [
    { ul: [
      'Call the shop to cancel **before the order changes to "Shipping"**. Goods already handed to the carrier are treated as a return.',
      'Paid orders are refunded within 3–5 working days of cancellation.',
      'The shop cancels orders when out of stock or when you cannot be reached; we let you know first and refund any payment.',
    ] },
    contact('support'),
  ] },
];

const THANH_TOAN: Section[] = [
  { h: 'Payment methods', blocks: [
    { table: { head: ['Method', 'How it works', 'Notes'], rows: [
      ['Deposit (shop contacts you)', 'You order on the website; the shop calls or messages you on Zalo to confirm, then explains how to transfer the deposit (see the [Deposit policy](/chinh-sach/dat-coc)).', 'No payment needed when ordering. The order is marked "Paid" once the shop receives the full amount.'],
      ['Bank transfer, MoMo / ZaloPay wallets, international cards', 'Pay following staff instructions when the order is confirmed.', 'Online payment on the website is being integrated.'],
    ] } },
    'For deposit or prepaid orders, staff contact you within 30 minutes (' + HOURS + ') after you order to confirm and explain how to pay. When the shop confirms receipt, you get a "Payment received" notification.',
    'When buying in store, you can pay in cash, by QR bank transfer or by card.',
  ] },
  { h: 'Prices and discounts', blocks: [
    { ul: [
      'Website prices are **retail prices** in Vietnamese dong; 2 plants of the same size are charged at the **2-plant combo price**. Project wholesale prices are quoted separately via a [quote request](/bao-gia-si). Prices, shipping, partner discounts and discount codes are recalculated when you tap Place order; the amount to pay is shown clearly before you confirm.',
      'Partners registered and approved on the [Wholesale partners page](/doi-tac) may receive a personal % discount on goods, applied automatically when signed in.',
      'Discount codes are entered at checkout and the discount is shown immediately. Each code has its own conditions (minimum order, number of uses, validity, uses per customer).',
      'Flash sale products have limited quantities and time.',
    ] },
  ] },
  { h: 'Refunds', blocks: [
    { ul: [
      'Refunds apply to cancelled orders, returns or warranty claims resolved by refund, under the [Returns policy](/chinh-sach/doi-tra) and the [Plant warranty policy](/chinh-sach/bao-hanh-cay).',
      'Money is refunded by bank transfer to the account you provide within 3–5 working days of the shop confirming the refund. We notify you once transferred.',
    ] },
  ] },
  { h: 'Paying safely', blocks: [
    { ul: [
      'The website does not collect or store your card number, CVV, password or bank OTP.',
      'The shop will never ask for your card number, password or bank OTP by phone or message.',
      'Only transfer money using details sent by shop staff via the hotline, Zalo or the official email on this page. If you suspect fraud, call the hotline to verify.',
    ] },
  ] },
  { h: 'Payment problems', blocks: [
    'Wrong transfer, charged twice, or paid but the order is not updated: call the shop with your order code and a screenshot of the transaction, and staff will check and resolve it.',
    contact('support'),
  ] },
];

const DAT_COC: Section[] = [
  { h: 'When a deposit is required', blocks: [
    { ul: [
      '**Deposit required:** pre-ordered large plants and landscape projects.',
      '**Website orders:** after you tap Place order, the shop calls or messages you on Zalo to confirm, tells you the deposit amount and explains the transfer. The shop does not collect cash on delivery; see also the [Payment policy](/chinh-sach/thanh-toan).',
    ] },
  ] },
  { h: 'Deposit amount and balance', blocks: [
    { ul: [
      'The deposit is **30% of the order value** (or of the project value in the quote).',
      'The balance is paid when you receive the plants or when the project is handed over.',
    ] },
  ] },
  { h: 'Process', blocks: [
    { ol: [
      'Order on the website (the shop will contact you), or contact us by hotline, Zalo, or [send a wholesale quote request](/bao-gia-si) with your plant list / bill of quantities; the shop confirms and sends a quote via Zalo.',
      'The shop confirms plants, sizes, quantities, prices and delivery time in a quote or message.',
      'You transfer the deposit; the shop confirms receipt.',
      'The shop prepares the plants or carries out the project as agreed.',
      'You pay the balance on receipt or handover.',
    ] },
  ] },
  { h: 'Changes or cancellation after paying a deposit', blocks: [
    'Whether the deposit is refundable, and how plants or items can be changed, is stated in the quote or deposit confirmation message for each order. The shop makes these conditions clear **before you transfer the deposit**.',
  ] },
  { h: 'Safety note', blocks: [
    { note: `Only transfer a deposit using details sent by shop staff via hotline ${phone(SALES_PHONE)}, ${zalo} or email ${SHOP_EMAIL}. If you suspect fraud, call the hotline to verify before transferring.` },
    contact('sales'),
  ] },
];

const BAO_MAT: Section[] = [
  { h: 'Who processes your data', blocks: [
    `Personal data on **caycanhmientay.com** is collected and processed by **Cây Cảnh Miền Tây** (responsible person: Mr Lê Hoài Nhân, ${SHOP_ADDRESS}). Data protection contact: ${SHOP_EMAIL} or ${phone(SUPPORT_PHONE)}.`,
    'This policy applies when you visit the website, sign in, buy, submit warranty claims, book services or post content.',
  ] },
  { h: 'Data we collect', blocks: [
    { table: { head: ['Data group', 'Includes', 'When'], rows: [
      ['Account', 'Name, email and profile picture from your Google account; the phone number you enter', 'When signing in or updating your profile'],
      ['Delivery', 'Recipient name, phone number, address, map pin, notes for the courier', 'When ordering or saving an address'],
      ['Transactions', 'Orders, products bought, payment method, discount codes, reward points', 'When ordering. The website does not store card numbers'],
      ['Photos and content you send', 'Warranty photos, garden photos, review photos and text, questions, answers', 'When you send them'],
      ['Your plants', 'Plants you have bought, care schedule, photos you add in My garden', 'After the order is delivered'],
      ['Technical', 'Device type, browser, IP address and pages viewed recorded by the server; cookies (see Cookies)', 'When you visit'],
    ] } },
    { ul: [
      '**Current location:** only when you tap "Use my current location" or "Near you" and allow it in your browser. For "Near you", the location is used only in your browser to sort stores by distance. When used to fill in an address, it is stored only if you save that address.',
      'Addresses you type or pin on the map are sent to the map service to display the map and suggest addresses.',
    ] },
  ] },
  { h: 'How we use it', blocks: [
    { ul: [
      'Processing orders, payments, delivery, warranty, returns and refunds.',
      'Contacting you about orders, warranty, questions and reviews (website notifications, Zalo or email).',
      'Plant-care reminders and after-sales advice; handling wholesale quote requests and partner registrations.',
      'Preventing fraud and abuse of promotions; keeping the system secure.',
      'Improving the website, when you allow analytics.',
      'Meeting legal obligations (transaction records, requests from authorities).',
    ] },
    'We only send promotional messages if you agree to receive them.',
  ] },
  { h: 'Sharing data', blocks: [
    'We **do not sell** your personal data. It is shared only in these cases:',
    { ul: [
      '**Carriers and couriers:** name, phone number, delivery address and order contents to deliver your goods.',
      '**Technical service providers** that help run the website: server and database hosting, Zalo / email messaging, Google sign-in, maps and address search, visit measurement (Google Analytics — only if you allow the Analytics group). They receive only the data needed and must keep it confidential.',
      '**Competent state authorities** when legally required.',
    ] },
    { note: 'Some technical providers host servers outside Vietnam, so your data may be stored and processed abroad.' },
    'The display name in your profile (without phone number or email) appears with reviews, questions and answers you post publicly. Change it under **Account → Personal information**.',
  ] },
  { h: 'Cookies', blocks: [
    'On your first visit you are asked about cookies and can choose each group:',
    { table: { head: ['Group', 'Used for', 'Can be turned off'], rows: [
      ['Necessary', 'Sign-in, cart, checkout, security', 'No (always on)'],
      ['Personalisation', 'Plant suggestions based on your interests and history', 'Yes'],
      ['Analytics', 'Measuring visits to improve the website (Google Analytics)', 'Yes'],
      ['Advertising', 'Showing relevant ads on social networks', 'Yes'],
    ] } },
    'Analytics and advertising code runs only with your permission. To choose again, clear this site\'s data in your browser so the dialog reappears. The website also stores the delivery location you chose ("Deliver to") in your browser.',
  ] },
  { h: 'Retention', blocks: [
    'Data is kept while you use your account and for the period the law requires for transaction records (orders, payments, warranty). When no longer needed or when you make a valid deletion request, we delete or anonymise the data, except what the law requires us to keep.',
  ] },
  { h: 'Your rights', blocks: [
    { ul: [
      '**View and edit:** profile under Account → Personal information; addresses under Account → Address book.',
      '**Withdraw consent:** change cookie choices or stop promotional messages at any time.',
      '**Request access, deletion, restriction or objection** to processing: email or call the hotline at the top of this page; we verify your identity and reply within the legal time limit.',
      '**Complaints:** if you believe your data is mishandled, contact us under the [Operating rules](/chinh-sach/quy-che-hoat-dong) or the competent authority.',
    ] },
  ] },
  { h: 'Security measures', blocks: [
    { ul: [
      'Connections to the website are encrypted (HTTPS).',
      'You sign in via Google so the website never holds your password; sessions use a dedicated cookie that scripts on the page cannot read.',
      'Warranty photos and photos sent with quote requests are visible only to the account owner and staff handling them.',
      'Staff access only the data in their own area of work.',
      'No system is perfectly secure. If an incident affects your data, we will notify you and handle it as the law requires.',
    ] },
  ] },
  { h: 'Changes to this policy', blocks: [
    'When we change it, we post the new version here with the update date. Significant changes (new purposes, sharing with new parties) will be clearly announced on the website.',
  ] },
];

const NOI_DUNG: Section[] = [
  { h: 'Articles and videos', blocks: [
    { ul: [
      'Plant-care, disease and pesticide articles in the [Plant care corner](/goc-cham-cay) and [Plant disease finder](/benh-cay) are written by the shop and reviewed by an agricultural engineer before publishing. Reviewed articles carry a **Reviewed** label and the engineer\'s name.',
      'Articles mentioning pesticides always include a safety note ([safe pesticide use guide](/chinh-sach/thuoc-bvtv-an-toan)).',
      'Content is general guidance; every garden is different. For serious or unclear problems, ask an agronomist. See [Our experts](/chinh-sach/doi-ngu-chuyen-mon).',
    ] },
  ] },
  { h: 'Customer Q&A and reviews', blocks: [
    { ul: [
      'You need to sign in to ask, answer or review.',
      'The shop answers questions; customers who bought the product can also share experience. Customer answers are for reference only and do not replace an agronomist\'s advice, especially for pesticides.',
      'Content containing advertising, phone numbers, links, other people\'s personal information, abuse, falsehoods or anything illegal may be hidden or removed. The shop does not remove reviews just because they criticise a product or service.',
      'You allow the shop to display the content and photos you post (with your display name) on the website. Warranty photos and photos sent with quote requests are never made public.',
    ] },
  ] },
  { h: 'Photos and videos on the website', blocks: [
    { ul: [
      'Product photos taken by the shop carry a watermark; please do not copy or repost them commercially without the shop\'s consent.',
      'Plant-disease symptom photos from open sources are credited on [Image credits](/chinh-sach/nguon-anh).',
    ] },
  ] },
  { h: 'Reporting incorrect or infringing content', blocks: [
    'If you see false, infringing or outdated content, let the shop know so we can review and fix it.',
    contact('support'),
  ] },
];

const DIEU_KHOAN: Section[] = [
  { h: 'Acceptance of terms', blocks: [
    'By visiting **caycanhmientay.com**, signing in or ordering, you agree to these Terms of use, the [Privacy policy](/chinh-sach/bao-mat) and the [Operating rules](/chinh-sach/quy-che-hoat-dong) of Cây Cảnh Miền Tây (the "shop"). If you do not agree, please stop using the website.',
    'These terms apply to all visitors and buyers on the website.',
  ] },
  { h: 'Accounts', blocks: [
    { ul: [
      'You sign in with a Google account. Your phone number and other details must be accurate.',
      'Keep your device and account secure; you are responsible for activity on your account. Report any unauthorised use to the shop immediately.',
      'Use one account per person. Creating several accounts to claim gifts or discount codes repeatedly is a violation.',
    ] },
  ] },
  { h: 'Orders, prices and promotions', blocks: [
    { ul: [
      'An order takes effect when the shop confirms it (usually by phone or Zalo within 30 minutes, ' + HOURS + ').',
      'The shop may refuse or cancel orders when out of stock, when prices or details are shown incorrectly due to a system error, when you cannot be reached or when fraud is suspected. Paid orders are refunded.',
      'Discount codes and gifts follow their conditions (minimum order, number of uses, validity, uses per account or delivery phone number) and cannot be exchanged for cash.',
      'Flash sale products have limited quantities and time.',
      'Orders containing pesticides require confirming you have read the safety guide.',
    ] },
    'Details: [Payment](/chinh-sach/thanh-toan), [delivery](/chinh-sach/giao-hang), [plant warranty](/chinh-sach/bao-hanh-cay), [returns](/chinh-sach/doi-tra).',
  ] },
  { h: 'Content you post', blocks: [
    { ul: [
      'You are responsible for the reviews, questions, answers and photos you send. Do not post advertising, phone numbers or links, abusive, false or illegal content.',
      'You allow the shop to display that content (with your display name) on the website. The shop may edit, hide or remove infringing content.',
      'Warranty photos and garden photos are used only to handle your request and are never made public.',
    ] },
    'Details: [Content policy](/chinh-sach/noi-dung).',
  ] },
  { h: 'Plant care and pesticide information', blocks: [
    'Plant-care, disease and dosage information is general guidance only, as every garden is different. Always read the pesticide label, use the correct dose and pre-harvest interval, and wear protection when mixing and spraying ([see the guide](/chinh-sach/thuoc-bvtv-an-toan)). Other customers\' answers in Q&A are for reference only and do not replace an agronomist\'s advice.',
  ] },
  { h: 'Intellectual property', blocks: [
    'Logos, images, articles, videos, design and data on the website belong to Cây Cảnh Miền Tây or are used under their owners\' licences (see [Image credits](/chinh-sach/nguon-anh)). Do not copy, repost or use them commercially without the shop\'s written consent.',
  ] },
  { h: 'Limitation of liability', blocks: [
    'The shop works to keep the website running smoothly but cannot guarantee it will never be interrupted (maintenance, network problems, force majeure). The shop is not liable for indirect damage arising from use of the website, unless the law provides otherwise.',
    'These terms do not affect your rights under the shop\'s warranty and returns policies or under consumer protection law.',
  ] },
  { h: 'Governing law, disputes and changes', blocks: [
    { ul: [
      'These terms are governed by Vietnamese law.',
      'Disputes are first resolved by negotiation under the [Operating rules](/chinh-sach/quy-che-hoat-dong); failing that, by a competent court.',
      'The shop may update these terms; the new version is posted here with the update date. Continuing to use the website afterwards means you accept it.',
    ] },
    contact('support'),
  ] },
];

const NGUON_ANH: Section[] = [
  { h: 'Illustrative images', blocks: [
    'Symptom photos in the Plant disease library are illustrations under open licences (Creative Commons or public domain), taken on various plants so you can compare signs; your plant may look slightly different.',
    'The author, licence and link to the original of each image are listed below.',
  ] },
];

const BVTV_AN_TOAN: Section[] = [
  { h: 'Quick summary', blocks: [
    'Plant protection products (pesticides) can save plants from serious pests and diseases, but misuse can kill plants and harm people, pets and the environment. This page summarises what to remember when using them on ornamental plants, home-grown vegetables and small gardens.',
    { note: '**Remember 6 things:** only use pesticides when you know the plant\'s actual problem · read the label before mixing · follow the "4 rights" · wear gloves and a mask when mixing and spraying · keep away from children, pets and food · never pour leftovers into water sources. When a product label differs from the general guidance here, **follow the label**.' },
  ] },
  { h: 'Before buying and before using', blocks: [
    { ul: [
      '**Identify the real problem.** Yellowing, wilting and leaf drop are often caused by wrong watering, low light or waterlogged soil, not always pests or disease — spraying then does not help and harms the plant. Check the [Plant disease finder](/benh-cay) or send photos to our agronomists before buying.',
      '**Try gentle steps first:** remove diseased leaves and branches, move the sick plant away from others, improve airflow and drainage. Only use pesticides if the problem keeps spreading or these steps are not enough.',
      '**Buy only products of clear origin** on Vietnam\'s list of permitted plant protection products: intact packaging with a Vietnamese label showing registration number, active ingredient and expiry date. Do not buy unlabelled, repackaged or expired products, or anything not on the permitted list.',
      '**Not sure which product to choose?** Read the [Pesticides & Fertilisers](/goc-cham-cay?chuyen-muc=thuoc-phan-bon) articles in the Plant care corner or send plant photos to our agronomists on Zalo.',
    ] },
  ] },
  { h: 'The "4 rights" rule', blocks: [
    'This is the basic rule plant-protection authorities teach growers to follow every time they use a pesticide.',
    { table: { head: ['Rule', 'Meaning', 'Common mistake'], rows: [
      ['**Right product**', 'Choose a product for the pest or disease you actually have and for the plant listed on the label.', 'Spraying fungicide on yellow leaves when the plant is only overwatered or short of light.'],
      ['**Right time**', 'Spray when the problem first appears or when the label says; spray early morning or late afternoon.', 'Spraying in harsh midday sun (leaf burn) or just before rain (washed off).'],
      ['**Right dose**', 'Measure product and water exactly as the label says; never increase the dose.', 'Adding extra "to be sure": leaf burn, resistant pests, more residue.'],
      ['**Right method**', 'Use a suitable sprayer, cover leaf undersides evenly, follow the number of sprays and interval.', 'Spraying once and stopping, or mixing several products in one tank when the label does not allow it.'],
    ] } },
    '**Avoid resistance:** using the same active ingredient over and over makes pests used to it. If several sprays are needed, ask an agronomist to rotate products from different groups.',
  ] },
  { h: 'Reading the label', blocks: [
    'Before opening, find all of this on the label:',
    { ul: [
      '**Product name and active ingredient**, expiry date, batch number.',
      '**Crops and pests / diseases** the product is registered for (a fungicide will not kill insects, and vice versa).',
      '**Dose and water volume** per tank or area, number of sprays and interval.',
      '**Pre-harvest interval:** the minimum days between the last spray and harvesting to eat. For leafy greens, herbs and home fruit trees you must wait the full period.',
      '**Hazard symbols and signal words** (e.g. "Danger", "Warning"), first aid and storage instructions.',
    ] },
  ] },
  { h: 'Preparing and mixing', blocks: [
    { ol: [
      '**Put on protective gear before opening:** chemical-resistant gloves, a mask rated for pesticides (ordinary cloth masks are not enough), eye protection, long sleeves, long trousers, boots or closed shoes.',
      'Mix in a ventilated place, away from drinking water, children and pets. Do not eat, drink or smoke while mixing or spraying.',
      'Measure with a dedicated cylinder or cap — never by eye, and never with food utensils.',
      'Put about half the water in the tank, add the product, stir with a dedicated stick (not bare hands), then top up. Do not mix several products unless the label allows — wrong mixes can burn leaves or stop working.',
      'Mix only what you will use that day.',
    ] },
  ] },
  { h: 'When spraying', blocks: [
    { ul: [
      'Spray early morning or late afternoon; avoid harsh sun, strong wind and imminent rain.',
      'Stand upwind, spray both sides of leaves evenly, and not so wet that it drips down to the base.',
      '**Indoor and balcony plants:** take them outside to spray and bring them back only when fully dry. Never spray in a closed room, an air-conditioned room, or near the kitchen or dining area.',
      'Keep children and pets away while spraying and until plants are dry; move pet bowls and food elsewhere.',
      'If you feel dizzy or nauseous, or your eyes or skin sting, stop immediately, get fresh air and follow "If exposed or poisoning is suspected" below.',
    ] },
  ] },
  { h: 'After spraying', blocks: [
    { ul: [
      'Remove gloves and mask, then wash hands with soap; shower, wash your hair and change clothes. Wash protective clothing separately from the family laundry.',
      'Rinse the sprayer and tools away from ponds, lakes, wells and canals. Do not pour leftovers into drains or water; mix just enough from the start.',
      '**Note the spray date and product name** (in a notebook or on your phone) to know when the pre-harvest interval ends and when to spray again.',
      'For edible plants: wait the full pre-harvest interval, then wash thoroughly before eating.',
    ] },
  ] },
  { h: 'Storage and disposal of packaging', blocks: [
    { ul: [
      'Keep products in their **original labelled** bottles or packs; never pour into soft-drink or water bottles or food containers.',
      'Store in a dry, cool place out of the sun, **locked or up high**, away from children, pets, food and animal feed.',
      'Used packaging is hazardous waste: triple-rinse bottles (pour the rinse water into the sprayer to use), then take them to your local pesticide-packaging collection point. Do not burn, bury carelessly, throw into ponds or reuse bottles.',
      'Expired or unused products: do not pour them away; ask the shop that sold them or your local agricultural officer where to hand them in.',
    ] },
  ] },
  { h: 'If exposed or poisoning is suspected', blocks: [
    { ol: [
      'Move the person to fresh air, away from the sprayed area; helpers must also wear gloves.',
      '**On skin:** remove contaminated clothing immediately and wash skin with plenty of clean water and soap. **In eyes:** rinse with gently running clean water for at least 15 minutes.',
      '**Inhaled:** let the person rest in fresh air. **Swallowed:** rinse the mouth; do not induce vomiting unless the label or medical staff say so.',
      'Call emergency **115** or go straight to the nearest medical facility, **taking the label or packaging** so doctors know the active ingredient. For children and pets, do not wait for symptoms.',
    ] },
    { note: 'This page summarises general principles for reference; it does not replace each product\'s label, official guidance or a doctor\'s instructions.' },
  ] },
  { h: 'Need more help?', blocks: [
    { ul: [
      'Not sure what is wrong or which product to use: send photos to an agronomist on Zalo or call, ' + HOURS + '.',
      'Read more in the [Plant care corner · Pesticides & Fertilisers](/goc-cham-cay?chuyen-muc=thuoc-phan-bon).',
      'Returning pesticides or fertilisers: see the [Returns policy](/chinh-sach/doi-tra).',
    ] },
    contact('care'),
  ] },
];

export const BODIES_EN: Record<string, Body> = {
  'giay-phep-kinh-doanh': GIAY_PHEP,
  'quy-che-hoat-dong': QUY_CHE,
  'doi-ngu-chuyen-mon': DOI_NGU,
  'giao-hang': giaoHang,
  'bao-hanh-cay': BAO_HANH,
  'doi-tra': DOI_TRA,
  'thanh-toan': THANH_TOAN,
  'dat-coc': DAT_COC,
  'bao-mat': BAO_MAT,
  'noi-dung': NOI_DUNG,
  'thuoc-bvtv-an-toan': BVTV_AN_TOAN,
  'dieu-khoan': DIEU_KHOAN,
  'nguon-anh': NGUON_ANH,
};
