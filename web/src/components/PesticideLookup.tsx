import Link from 'next/link';
import { Icon } from './Icon';

/** Khung "Tra cứu thuốc BVTV" đầu trang danh mục Thuốc BVTV: tìm theo tên / hoạt chất / số đăng ký + lối tắt tới bắt bệnh, hướng dẫn an toàn, kỹ sư. */
export function PesticideLookup({ slug }: { slug: string }) {
  return (
    <section className="pv-look" aria-label="Tra cứu thuốc BVTV">
      <div className="pv-look__main">
        <b>Tra cứu thuốc BVTV</b>
        <span>Gõ tên thuốc, hoạt chất hoặc số đăng ký. Mỗi thuốc ghi rõ hoạt chất, liều pha và thời gian cách ly trong trang sản phẩm.</span>
        <form className="pv-look__form" action="/tim-kiem" method="get" role="search">
          <input type="hidden" name="nhom" value={slug} />
          <label className="vx-search" style={{ border: '1px solid var(--field-border, var(--border))' }}>
            <Icon name="search" />
            <input name="q" type="search" required maxLength={80} placeholder="Tên thuốc hoặc hoạt chất…" aria-label="Tên thuốc hoặc hoạt chất" autoComplete="off" />
          </label>
          <button type="submit" className="vx-btn vx-btn--primary">Tra cứu</button>
        </form>
      </div>
      <div className="pv-look__links">
        <Link href="/benh-cay"><Icon name="bug" /><span>Chưa biết cây bị bệnh gì? <u>Bắt bệnh cho cây</u></span></Link>
        <Link href="/chinh-sach/thuoc-bvtv-an-toan"><Icon name="shield" /><span>Trước khi pha, phun: <u>Hướng dẫn dùng thuốc an toàn</u></span></Link>
        <a href="tel:0927291989"><Icon name="phone" /><span>Hỏi kỹ sư: <u>0927 291 989</u> (8:00 – 21:00)</span></a>
      </div>
    </section>
  );
}
