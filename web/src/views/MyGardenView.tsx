// Sinh tự động từ design-system/components/MyGardenLayout/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.
import Link from 'next/link';
import { AccountSidebar } from '@/components/AccountSidebar';

export function MyGardenView() {
  return (
    <>
      <div className="vx-acctpage">
        <div className="vx-crumb">
          <Link href="/">Trang chủ</Link>/<Link href="/tai-khoan">Tài khoản</Link>/<span>Vườn của tôi</span>
        </div>
        <div className="vx-acctgrid">
          <AccountSidebar />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '0' }}>
            <div className="gd-head">
              <h2>Vườn của tôi</h2>
              <span className="acts">
                <button className="vx-btn vx-btn--outline">
                  <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Thêm cây tự trồng
                </button>
              </span>
            </div>{' '}
            <div className="gd-sum">
              <div>
                <b>6</b>Cây đang chăm
              </div>
              <div className="warn">
                <b>3</b>Việc cần làm hôm nay
              </div>
              <div>
                <b>1</b>Cây đang bảo hành
              </div>
              <div>
                <b>42</b>Ngày chăm liên tục
              </div>
            </div>{' '}
            <div className="gd-grid">
              <div className="gd-card">
                <div className="gd-card__img">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 12h12l-1.5 8h-9z" />
                    <path d="M12 12V7" />
                    <path d="M12 9c-2-3-5-3-6-2 1 2 4 3 6 2z" />
                    <path d="M12 8c1.5-3 4.5-3.5 6-2.5-1 2-4 3.5-6 2.5z" />
                  </svg>
                  <span className="hl ok h">Khỏe</span>
                  <span className="age">3 ngày</span>
                </div>
                <div className="gd-card__b">
                  <b>Monstera Deliciosa</b>
                  <small>Phòng khách · mua 22/09</small>
                  <div className="gd-next due">
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" />
                      <path d="M10 20a2 2 0 0 0 4 0" />
                    </svg>
                    Hôm nay: Tưới nước<a>Xong</a>
                  </div>
                  <small>Bảo hành còn 4 ngày</small>
                </div>
                <div className="gd-card__f">
                  <button className="vx-btn vx-btn--outline">
                    <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '13px', height: '13px' }}>
                      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                    Cập nhật ảnh
                  </button>
                  <Link href="/tai-khoan/lich-cham-cay" className="vx-btn vx-btn--soft">
                    Lịch chăm
                  </Link>
                </div>
              </div>
              <div className="gd-card">
                <div className="gd-card__img sick">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="9" r="2" />
                    <path d="M12 5a2 2 0 1 1 0-.1M16 9a2 2 0 1 1 .1 0M12 13a2 2 0 1 1 0 .1M8 9a2 2 0 1 1-.1 0" />
                    <path d="M12 13v8M12 17c-2 0-3-1-4-2" />
                  </svg>
                  <span className="hl watch h">Cần chú ý</span>
                  <span className="age">1 tháng</span>
                </div>
                <div className="gd-card__b">
                  <b>Lan hồ điệp trắng</b>
                  <small>Ban công · mua 10/08</small>
                  <div className="gd-next due">
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" />
                      <path d="M10 20a2 2 0 0 0 4 0" />
                    </svg>
                    Hôm nay: Kiểm tra rễ, lá vàng<a>Xong</a>
                  </div>
                </div>
                <div className="gd-card__f">
                  <button className="vx-btn vx-btn--outline">
                    <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '13px', height: '13px' }}>
                      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                    Cập nhật ảnh
                  </button>
                  <Link href="/tai-khoan/lich-cham-cay" className="vx-btn vx-btn--soft">
                    Lịch chăm
                  </Link>
                </div>
              </div>
              <div className="gd-card">
                <div className="gd-card__img">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 21V5a2 2 0 0 1 4 0v8M12 13H9a2 2 0 0 1-2-2V8" />
                    <path d="M8 21h8" />
                  </svg>
                  <span className="hl ok h">Khỏe</span>
                  <span className="age">5 tháng</span>
                </div>
                <div className="gd-card__b">
                  <b>Sen đá kim tuyến</b>
                  <small>Bàn làm việc · tự trồng</small>
                  <div className="gd-next">
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="8" />
                      <path d="M12 8v4l3 2" />
                    </svg>
                    28/09: Bón phân loãng
                    <a />
                  </div>
                </div>
                <div className="gd-card__f">
                  <button className="vx-btn vx-btn--outline">
                    <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '13px', height: '13px' }}>
                      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                    Cập nhật ảnh
                  </button>
                  <Link href="/tai-khoan/lich-cham-cay" className="vx-btn vx-btn--soft">
                    Lịch chăm
                  </Link>
                </div>
              </div>
              <div className="gd-card">
                <div className="gd-card__img">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" />
                    <path d="M5 19 13 11" />
                  </svg>
                  <span className="hl ok h">Khỏe</span>
                  <span className="age">4 tháng</span>
                </div>
                <div className="gd-card__b">
                  <b>Trầu bà Nam Mỹ</b>
                  <small>Kệ sách · mua 02/05</small>
                  <div className="gd-next due">
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" />
                      <path d="M10 20a2 2 0 0 0 4 0" />
                    </svg>
                    Hôm nay: Xoay chậu<a>Xong</a>
                  </div>
                </div>
                <div className="gd-card__f">
                  <button className="vx-btn vx-btn--outline">
                    <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '13px', height: '13px' }}>
                      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                    Cập nhật ảnh
                  </button>
                  <Link href="/tai-khoan/lich-cham-cay" className="vx-btn vx-btn--soft">
                    Lịch chăm
                  </Link>
                </div>
              </div>
              <div className="gd-card">
                <div className="gd-card__img">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 21v-7" />
                    <path d="M12 14c0-4 3-7 7-7 0 4-3 7-7 7zM12 14c0-3-2-5-5-5 0 3 2 5 5 5z" />
                  </svg>
                  <span className="hl ok h">Khỏe</span>
                  <span className="age">24 ngày</span>
                </div>
                <div className="gd-card__b">
                  <b>Rau húng quế</b>
                  <small>Ban công · mua hạt 01/09</small>
                  <div className="gd-next">
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="8" />
                      <path d="M12 8v4l3 2" />
                    </svg>
                    30/09: Tỉa ngọn
                    <a />
                  </div>
                </div>
                <div className="gd-card__f">
                  <button className="vx-btn vx-btn--outline">
                    <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '13px', height: '13px' }}>
                      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                    Cập nhật ảnh
                  </button>
                  <Link href="/tai-khoan/lich-cham-cay" className="vx-btn vx-btn--soft">
                    Lịch chăm
                  </Link>
                </div>
              </div>
              <div className="gd-add">
                <span>
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
                <b>Thêm cây vào vườn</b>Cây mua ở nơi khác cũng được nhắc lịch chăm
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
