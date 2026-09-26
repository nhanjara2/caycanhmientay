// Sinh tự động từ design-system/components/DiseaseLibraryLayout/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.
import Link from 'next/link';

export function DiseaseLibraryView() {
  return (
    <>
      {' '}
      <div className="vx-dlib">
        <div className="vx-crumb">
          <Link href="/">Trang chủ</Link>/<Link href="/goc-cham-cay">Góc chăm cây</Link>/<span>Bệnh cây trồng</span>
        </div>
        <h1>Tìm hiểu bệnh cây trồng</h1>
        <div className="vx-dlib__sub">
          {'Tra cứu theo bộ phận bị bệnh hoặc theo nguyên nhân. Chưa rõ bệnh gì? '}
          <Link href="/benh-cay" className="vx-link" style={{ display: 'inline' }}>
            Bắt bệnh cho cây
          </Link>
        </div>{' '}
        <div style={{ maxWidth: '560px', margin: '0 auto', width: '100%' }}>
          <label className="vx-search" style={{ border: '1px solid var(--border)' }}>
            <input placeholder="Nhập triệu chứng, ví dụ: lá vàng mép, đốm nâu…" />
            <button className="vx-btn vx-btn--primary">
              <svg className="vx-ico" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </label>
        </div>{' '}
        <h2 className="vx-dsec">
          <svg className="vx-ico" viewBox="0 0 24 24">
            <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" />
            <path d="M5 19 13 11" />
          </svg>
          Bộ phận của cây
        </h2>
        <section className="vx-pmap">
          <div className="vx-pmap__art">
            <svg viewBox="0 0 200 400" aria-label="Hình minh họa các bộ phận của cây">
              {' '}
              <rect className="pl-soil" x="0" y="300" width="200" height="100" rx="12" />{' '}
              <path
                className="pl-root"
                d="M100 300 V360 M100 318 L70 350 M100 318 L130 352 M100 336 L82 378 M100 336 L120 380 M70 350 L58 362 M130 352 L146 360"
              />{' '}
              <path className="pl-stem" d="M100 300 V70" />
              <path className="pl-stem" style={{ strokeWidth: '3' }} d="M100 190 L132 160 M100 150 L70 128" />{' '}
              <ellipse className="pl-leaf on" cx="128" cy="108" rx="30" ry="12" transform="rotate(-30 128 108)" />
              <ellipse className="pl-leaf on" cx="70" cy="98" rx="30" ry="12" transform="rotate(30 70 98)" />
              <ellipse className="pl-leaf" cx="132" cy="212" rx="30" ry="12" transform="rotate(-25 132 212)" />
              <ellipse className="pl-leaf" cx="66" cy="236" rx="30" ry="12" transform="rotate(25 66 236)" />
              <ellipse className="pl-leaf" cx="52" cy="122" rx="30" ry="12" transform="rotate(20 52 122)" />
              <ellipse className="pl-leaf" cx="142" cy="258" rx="30" ry="12" transform="rotate(-20 142 258)" />{' '}
              <circle className="pl-fruit" cx="138" cy="176" r="12" />{' '}
              <g>
                <circle className="pl-flower" cx="100" cy="42" r="12" />
                <circle className="pl-flower" cx="86" cy="54" r="12" />
                <circle className="pl-flower" cx="114" cy="54" r="12" />
                <circle className="pl-flower" cx="92" cy="68" r="10" />
                <circle className="pl-flower" cx="108" cy="68" r="10" />
                <circle className="pl-center" cx="100" cy="56" r="8" />
              </g>{' '}
              <path
                className="pl-line"
                d="M112 42 L200 26 M156 104 L200 80 M150 176 L200 134 M104 232 L200 188 M104 300 L200 242 M126 352 L200 296"
              />{' '}
              <circle className="pl-dot" cx="112" cy="42" r="3" />
              <circle className="pl-dot" cx="156" cy="104" r="3" />
              <circle className="pl-dot" cx="150" cy="176" r="3" />
              <circle className="pl-dot" cx="104" cy="232" r="3" />
              <circle className="pl-dot" cx="104" cy="300" r="3" />
              <circle className="pl-dot" cx="126" cy="352" r="3" />{' '}
            </svg>
            <small>*Hình minh họa mang tính tham khảo.</small>
          </div>
          <div className="vx-parts">
            <Link href="/benh-cay" className="vx-part">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <circle cx="12" cy="9" r="2" />
                  <path d="M12 5a2 2 0 1 1 0-.1M16 9a2 2 0 1 1 .1 0M12 13a2 2 0 1 1 0 .1M8 9a2 2 0 1 1-.1 0" />
                  <path d="M12 13v8M12 17c-2 0-3-1-4-2" />
                </svg>
              </span>
              <span style={{ all: 'unset' }}>
                Hoa<small>42 bệnh</small>
              </span>
            </Link>
            <Link href="/benh-cay" className="vx-part" aria-current="true">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" />
                  <path d="M5 19 13 11" />
                </svg>
              </span>
              <span style={{ all: 'unset' }}>
                Lá<small>128 bệnh</small>
              </span>
            </Link>
            <Link href="/benh-cay" className="vx-part">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <circle cx="12" cy="14" r="6" />
                  <path d="M12 8V4M12 6c1-2 3-2 4-1" />
                </svg>
              </span>
              <span style={{ all: 'unset' }}>
                Quả<small>56 bệnh</small>
              </span>
            </Link>
            <Link href="/benh-cay" className="vx-part">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M12 21V3M12 9l-4-3M12 14l4-3" />
                </svg>
              </span>
              <span style={{ all: 'unset' }}>
                Thân – Cành<small>47 bệnh</small>
              </span>
            </Link>
            <Link href="/benh-cay" className="vx-part">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M12 3v10M4 13h16M8 13l-2 7M16 13l2 7M12 13v7" />
                </svg>
              </span>
              <span style={{ all: 'unset' }}>
                Gốc – Cổ rễ<small>23 bệnh</small>
              </span>
            </Link>
            <Link href="/benh-cay" className="vx-part">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M12 3v8M12 11l-5 8M12 11l5 8M12 11v9M9 15l-3 1M15 15l3 1" />
                </svg>
              </span>
              <span style={{ all: 'unset' }}>
                Rễ<small>31 bệnh</small>
              </span>
            </Link>
            <Link href="/benh-cay" className="vx-part">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M12 21V9" />
                  <path d="M12 9c-5 0-7-3-7-6 4 0 7 2 7 6zM12 12c4 0 7-2 7-6-4 0-7 2-7 6z" />
                </svg>
              </span>
              <span style={{ all: 'unset' }}>
                Toàn cây<small>39 bệnh</small>
              </span>
            </Link>
          </div>
          <div className="vx-dpanel">
            <div className="vx-dpanel__head">
              <b>Bệnh trên Lá · 128 bệnh</b>
              <span className="vx-seg">
                <button className="vx-chip" aria-pressed="true">
                  Mọi loại cây
                </button>
                <button className="vx-chip">Kiểng lá</button>
                <button className="vx-chip">Lan</button>
                <button className="vx-chip">Rau</button>
              </span>
            </div>
            <div className="vx-dlist">
              <Link href="/benh-cay/thoi-re">
                Đốm lá do nấm<small>Nấm</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Thán thư<small>Nấm</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Phấn trắng<small>Nấm</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Gỉ sắt<small>Nấm</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Cháy lá vi khuẩn<small>Vi khuẩn</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Khảm lá<small>Virus</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Rệp sáp<small>Côn trùng</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Nhện đỏ<small>Nhện</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Bọ trĩ<small>Côn trùng</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Sâu ăn lá<small>Sâu hại</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Lá vàng do thiếu đạm<small>Dinh dưỡng</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Vàng gân do thiếu sắt<small>Dinh dưỡng</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Cháy mép lá do nắng<small>Sinh lý</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Lá quăn do thiếu nước<small>Sinh lý</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Muội đen<small>Nấm</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Ốc sên ăn lá<small>Động vật</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Đốm lá vi khuẩn<small>Vi khuẩn</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Lá thủng lỗ do sâu<small>Sâu hại</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Rầy phấn trắng<small>Côn trùng</small>
              </Link>
              <Link href="/benh-cay/thoi-re">
                Lá rụng hàng loạt do sốc môi trường<small>Sinh lý</small>
              </Link>
            </div>{' '}
            <div className="vx-pager">
              <a>
                <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                  <path d="m15 6-6 6 6 6" />
                </svg>
              </a>
              <a aria-current="true">1</a>
              <a>2</a>
              <a>3</a>
              <a>4</a>
              <a>…</a>
              <a>7</a>
              <a>
                <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </a>
            </div>
          </div>
        </section>
        <h2 className="vx-dsec">
          <svg className="vx-ico" viewBox="0 0 24 24">
            <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8" />
          </svg>
          Nhóm bệnh theo nguyên nhân
        </h2>
        <div className="vx-dgrid">
          <Link href="/benh-cay" className="vx-dtile">
            <span className="">
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M4 12a8 6 0 0 1 16 0z" />
                <path d="M10 12v7h4v-7" />
                <circle cx="9" cy="9" r=".8" />
                <circle cx="14" cy="8" r=".8" />
              </svg>
            </span>
            <b>Nấm bệnh</b>
            <small>186 bài viết</small>
            <p>Đốm lá, thán thư, phấn trắng, thối rễ</p>
          </Link>
          <Link href="/benh-cay" className="vx-dtile">
            <span className="">
              <svg className="vx-ico" viewBox="0 0 24 24">
                <rect x="5" y="8" width="14" height="8" rx="4" />
                <path d="M3 10l2 1M3 14l2-1M21 10l-2 1M21 14l-2-1" />
              </svg>
            </span>
            <b>Vi khuẩn</b>
            <small>48 bài viết</small>
            <p>Cháy lá, thối nhũn, héo xanh</p>
          </Link>
          <Link href="/benh-cay" className="vx-dtile">
            <span className="">
              <svg className="vx-ico" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
              </svg>
            </span>
            <b>Virus</b>
            <small>27 bài viết</small>
            <p>Khảm lá, xoăn lá, lùn cây</p>
          </Link>
          <Link href="/benh-cay" className="vx-dtile">
            <span className="warm">
              <svg className="vx-ico" viewBox="0 0 24 24">
                <rect x="8" y="7" width="8" height="12" rx="4" />
                <path d="M12 7V4M8 11H4M16 11h4M8 16H5M16 16h3M9 4l1 2M15 4l-1 2" />
              </svg>
            </span>
            <b>Sâu hại</b>
            <small>74 bài viết</small>
            <p>Sâu ăn lá, sâu đục thân</p>
          </Link>
          <Link href="/benh-cay" className="vx-dtile">
            <span className="warm">
              <svg className="vx-ico" viewBox="0 0 24 24">
                <circle cx="12" cy="13" r="5" />
                <path d="M7 11 3 9M7 14l-4 1M7 16l-3 3M17 11l4-2M17 14l4 1M17 16l3 3" />
              </svg>
            </span>
            <b>Nhện – Rệp – Bọ trĩ</b>
            <small>61 bài viết</small>
            <p>Nhện đỏ, rệp sáp, bọ trĩ</p>
          </Link>
          <Link href="/benh-cay" className="vx-dtile">
            <span className="">
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M5 18c3 0 3-12 7-12s4 12 7 12" />
              </svg>
            </span>
            <b>Tuyến trùng</b>
            <small>19 bài viết</small>
            <p>Sưng rễ, u rễ</p>
          </Link>
          <Link href="/benh-cay" className="vx-dtile">
            <span className="">
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M3 18h13a5 5 0 1 0-5-5v5" />
                <circle cx="11" cy="13" r="2" />
                <path d="M16 18l3-5M19 13l1-3M17 13l0-3" />
              </svg>
            </span>
            <b>Ốc sên – Động vật</b>
            <small>14 bài viết</small>
            <p>Ốc sên, chuột, kiến</p>
          </Link>
          <Link href="/benh-cay" className="vx-dtile">
            <span className="">
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />
                <path d="M9 14h6" />
              </svg>
            </span>
            <b>Thiếu dinh dưỡng</b>
            <small>38 bài viết</small>
            <p>Vàng lá, vàng gân, còi cọc</p>
          </Link>
          <Link href="/benh-cay" className="vx-dtile">
            <span className="">
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M10 4a2 2 0 0 1 4 0v10a4 4 0 1 1-4 0z" />
              </svg>
            </span>
            <b>Sinh lý – Môi trường</b>
            <small>52 bài viết</small>
            <p>Cháy nắng, úng, sốc nhiệt</p>
          </Link>
          <Link href="/benh-cay" className="vx-dtile">
            <span className="">
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M12 21V11M12 11c-3-1-5-4-5-8 3 1 5 4 5 8zM12 14c3-1 5-4 5-7-3 1-5 3-5 7M5 21h14" />
              </svg>
            </span>
            <b>Cỏ dại</b>
            <small>22 bài viết</small>
            <p>Cỏ trong chậu, luống rau</p>
          </Link>
          <Link href="/benh-cay" className="vx-dtile">
            <span className="warm">
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />
              </svg>
            </span>
            <b>Ngộ độc phân, thuốc</b>
            <small>16 bài viết</small>
            <p>Cháy rễ do bón quá liều</p>
          </Link>
          <Link href="/benh-cay" className="vx-dtile">
            <span className="">
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M12 21V9" />
                <path d="M12 9c-5 0-7-3-7-6 4 0 7 2 7 6zM12 12c4 0 7-2 7-6-4 0-7 2-7 6z" />
              </svg>
            </span>
            <b>Theo mùa</b>
            <small>40 bài viết</small>
            <p>Mùa mưa, mùa khô, nồm ẩm</p>
          </Link>
        </div>
      </div>{' '}
    </>
  );
}
