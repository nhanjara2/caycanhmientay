// Sinh tự động từ design-system/components/QuoteRequestForm/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.
import Link from 'next/link';

export function QuoteView() {
  return (
    <>
      {' '}
      <div className="qf">
        <div className="qf-card">
          <div className="vx-crumb">
            <Link href="/dich-vu">Dịch vụ</Link>/<span>Đặt lịch khảo sát</span>
          </div>
          <h1>{'Đặt lịch khảo sát & báo giá'}</h1>{' '}
          <div className="qf-sec">
            <h3>
              <b>1</b>Bạn cần dịch vụ gì?
            </h3>
            <div className="qf-opts">
              <div className="qf-opt" aria-checked="true">
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M4 11 12 4l8 7v9H4z" />
                  <path d="M10 20v-5h4v5" />
                </svg>
                Sân vườn, ban công<small>{'Thiết kế & thi công'}</small>
              </div>
              <div className="qf-opt">
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <rect x="5" y="3" width="14" height="18" rx="1" />
                  <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" />
                </svg>
                Cây văn phòng<small>Cho thuê, bán</small>
              </div>
              <div className="qf-opt">
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M20 12a8 8 0 1 1-2.3-5.7L20 8" />
                  <path d="M20 3v5h-5" />
                </svg>
                Chăm sóc định kỳ<small>Tại nhà, văn phòng</small>
              </div>
              <div className="qf-opt">
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <rect x="8" y="7" width="8" height="12" rx="4" />
                  <path d="M12 7V4M8 11H4M16 11h4M8 16H5M16 16h3M9 4l1 2M15 4l-1 2" />
                </svg>
                Chữa cây tại nhà<small>Kỹ sư đến tận nơi</small>
              </div>
            </div>
          </div>{' '}
          <div className="qf-sec">
            <h3>
              <b>2</b>Không gian của bạn
            </h3>
            <div className="ad-frow">
              <div className="ad-f">
                <label>Loại không gian</label>
                <div className="vx-input vx-input--select" style={{ padding: '9px 12px', fontSize: '13px' }}>
                  <span>Ban công chung cư</span>
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
              <div className="ad-f">
                <label>Diện tích (m²)</label>
                <input className="vx-input" style={{ padding: '9px 12px', fontSize: '13px' }} defaultValue="8" />
              </div>
              <div className="ad-f">
                <label>Hướng / nắng</label>
                <div className="vx-input vx-input--select" style={{ padding: '9px 12px', fontSize: '13px' }}>
                  <span>Tây · nắng chiều</span>
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>{' '}
            <div className="ad-f">
              <label>Ảnh hiện trạng (giúp báo giá sát hơn)</label>
              <div className="qf-up">
                <span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 11 12 4l8 7v9H4z" />
                    <path d="M10 20v-5h4v5" />
                  </svg>
                </span>
                <span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 11 12 4l8 7v9H4z" />
                    <path d="M10 20v-5h4v5" />
                  </svg>
                </span>
                <span className="add">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                  <br />
                  Thêm ảnh
                </span>
              </div>
            </div>{' '}
            <div className="ad-f">
              <label>Phong cách mong muốn</label>
              <div className="vx-row">
                <button className="vx-chip" aria-pressed="true">
                  Nhiệt đới
                </button>
                <button className="vx-chip">Tối giản</button>
                <button className="vx-chip">Kiểu Nhật</button>
                <button className="vx-chip" aria-pressed="true">
                  Có góc trồng rau
                </button>
                <button className="vx-chip">Dễ chăm, ít tưới</button>
              </div>
            </div>
          </div>{' '}
          <div className="qf-sec">
            <h3>
              <b>3</b>Ngân sách dự kiến
            </h3>
            <div className="vx-row">
              <button className="vx-chip">Dưới 10 triệu</button>
              <button className="vx-chip" aria-pressed="true">
                10 – 30 triệu
              </button>
              <button className="vx-chip">30 – 100 triệu</button>
              <button className="vx-chip">Trên 100 triệu</button>
              <button className="vx-chip">Chưa rõ, cần tư vấn</button>
            </div>
          </div>{' '}
          <div className="qf-sec">
            <h3>
              <b>4</b>Chọn lịch khảo sát
            </h3>
            <div className="vx-slots2 app-cols" style={{ '--cols': 'repeat(4,1fr)' }}>
              <div className="vx-tslot">
                T6 27/09<small>9:00 – 11:00</small>
              </div>
              <div className="vx-tslot" aria-pressed="true">
                T7 28/09<small>9:00 – 11:00</small>
              </div>
              <div className="vx-tslot">
                T7 28/09<small>14:00 – 16:00</small>
              </div>
              <div className="vx-tslot" aria-disabled="true">
                CN 29/09<small>Đã kín</small>
              </div>
            </div>
          </div>{' '}
          <div className="qf-sec">
            <h3>
              <b>5</b>Thông tin liên hệ
            </h3>
            <div className="ad-frow">
              <div className="vx-fl">
                <label>Họ và tên</label>
                <input defaultValue="Lê Hoài Nhân" />
              </div>
              <div className="vx-fl">
                <label>Số điện thoại</label>
                <input defaultValue="0703 005 001" />
              </div>
              <div className="vx-fl">
                <label>Địa chỉ khảo sát</label>
                <input defaultValue="Chung cư Q7, Block B" />
              </div>
            </div>
          </div>{' '}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button className="vx-btn vx-btn--outline">Lưu nháp</button>
            <button className="vx-btn vx-btn--primary vx-btn--lg">Gửi yêu cầu</button>
          </div>
        </div>{' '}
        <aside className="qf-side">
          <div className="ar-cta">
            <b>Khảo sát miễn phí</b>
            <span>Kỹ sư gọi xác nhận trong 2 giờ làm việc. Báo giá gửi qua Zalo sau 48 giờ kể từ khảo sát.</span>
          </div>
          <div className="nw-box">
            <h3>Bạn sẽ nhận được</h3>
            <div className="au-why" style={{ fontSize: '13px' }}>
              <div>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M4 20h4L19 9l-4-4L4 16z" />
                </svg>
                Phối cảnh 3D không gian
              </div>
              <div>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M6 3h9l4 4v14H6z" />
                  <path d="M9 12h7M9 16h7" />
                </svg>
                Bảng vật tư, cây và chi phí chi tiết
              </div>
              <div>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <rect x="4" y="5" width="16" height="15" rx="2" />
                  <path d="M4 10h16M9 3v4M15 3v4" />
                </svg>
                Tiến độ thi công dự kiến
              </div>
              <div>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                Chính sách bảo hành cây 30 ngày
              </div>
            </div>
          </div>
        </aside>
      </div>{' '}
    </>
  );
}
