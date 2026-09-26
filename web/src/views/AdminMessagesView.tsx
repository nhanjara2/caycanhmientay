// Sinh tự động từ design-system/components/MessageTemplates/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.

export function AdminMessagesView() {
  return (
    <>
      <div className="ad-body">
        <div className="ad-title">
          <h1>Mẫu tin nhắn</h1>
          <span className="acts">
            <span className="ad-sel">
              Kênh: Tất cả
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
            <button className="vx-btn vx-btn--primary">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              Tạo mẫu
            </button>
          </span>
        </div>
        <div className="mt">
          <div className="mt-list">
            <h4>ĐƠN HÀNG</h4>
            <a>
              Xác nhận đơn<small className="z">ZALO</small>
            </a>
            <a aria-current="true">
              Ảnh cây trước khi giao<small className="z">ZALO</small>
            </a>
            <a>
              Đang giao / tài xế đã đến<small className="z">ZALO</small>
            </a>
            <a>
              Đã giao + mời đánh giá<small className="e">EMAIL</small>
            </a>
            <h4>CHĂM CÂY</h4>
            <a>
              Việc chăm cây hôm nay<small className="z">ZALO</small>
            </a>
            <a>
              Dời lịch do mưa<small className="z">ZALO</small>
            </a>
            <h4>BẢO HÀNH</h4>
            <a>
              Đã nhận yêu cầu<small className="z">ZALO</small>
            </a>
            <a>
              Kết quả bảo hành<small className="e">EMAIL</small>
            </a>
          </div>
          <div className="mt-edit">
            <div className="vx-label-row">
              <b style={{ fontSize: '15px' }}>Ảnh cây trước khi giao</b>
              <span className="vx-badge vx-badge--success">Đang dùng · Zalo ZNS</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
              Gửi tự động khi kho lưu ảnh cây (AdminOrderDetail). Mẫu Zalo cần được Zalo duyệt trước khi dùng.
            </span>{' '}
            <div className="ad-f">
              <label>Biến có thể chèn</label>
              <div className="mt-vars">
                <span>{'{ten_khach}'}</span>
                <span>{'{ma_don}'}</span>
                <span>{'{ten_cay}'}</span>
                <span>{'{khung_gio}'}</span>
                <span>{'{link_anh}'}</span>
                <span>{'{hotline}'}</span>
              </div>
            </div>{' '}
            <div className="mt-body">
              {'Chào '}
              <code>{'{ten_khach}'}</code>
              {', Cây Cảnh Miền Tây đã chuẩn bị xong '}
              <code>{'{ten_cay}'}</code>
              {' cho đơn '}
              <code>{'{ma_don}'}</code>
              {'. Mời bạn xem ảnh cây thật trước khi giao. Cây sẽ đến trong khung giờ '}
              <code>{'{khung_gio}'}</code>.
            </div>{' '}
            <div className="ad-frow two">
              <div className="ad-f">
                <label>Nút 1</label>
                <input
                  className="vx-input"
                  style={{ padding: '7px 10px', fontSize: '13px' }}
                  defaultValue="Xem ảnh cây → {link_anh}"
                />
              </div>
              <div className="ad-f">
                <label>Nút 2</label>
                <input
                  className="vx-input"
                  style={{ padding: '7px 10px', fontSize: '13px' }}
                  defaultValue="Gọi shop → {hotline}"
                />
              </div>
            </div>{' '}
            <div className="ad-f">
              <label>Nếu gửi Zalo thất bại</label>
              <div className="vx-input vx-input--select" style={{ padding: '7px 10px', fontSize: '13px' }}>
                <span>Gửi SMS rút gọn</span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
              <button className="vx-btn vx-btn--outline vx-btn--sm">Gửi thử cho tôi</button>
              <button className="vx-btn vx-btn--primary vx-btn--sm">Lưu mẫu</button>
            </div>
          </div>{' '}
          <div className="mt-phone">
            <span className="oa">
              <span className="vx-avatar vx-avatar--sm">
                <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                  <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" />
                  <path d="M5 19 13 11" />
                </svg>
              </span>
              Cây Cảnh Miền Tây · Zalo OA
            </span>
            <div className="mt-bubble">
              <div className="img">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="9" r="2" />
                  <path d="M12 5a2 2 0 1 1 0-.1M16 9a2 2 0 1 1 .1 0M12 13a2 2 0 1 1 0 .1M8 9a2 2 0 1 1-.1 0" />
                  <path d="M12 13v8M12 17c-2 0-3-1-4-2" />
                </svg>
              </div>
              <div className="tx">
                <b>Ảnh cây trước khi giao</b>Chào Chị Ngọc, Cây Cảnh Miền Tây đã chuẩn bị xong Lan hồ điệp 2 cành trắng
                cho đơn MT0095398. Mời bạn xem ảnh cây thật trước khi giao. Cây sẽ đến trong khung giờ 14:00 – 18:00.
              </div>
              <div className="btns">
                <a>Xem ảnh cây</a>
                <a>Gọi shop</a>
              </div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ink-muted)', textAlign: 'center' }}>
              Xem trước với dữ liệu mẫu
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
