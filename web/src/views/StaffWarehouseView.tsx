// Sinh tự động từ design-system/components/StaffWarehouseApp/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.

export function StaffWarehouseView() {
  return (
    <>
      {' '}
      <div className="m-stage">
        <div>
          <div className="m-phone">
            <div className="m-status deep">
              <span>9:41</span>
              <span>5G · 100%</span>
            </div>
            <div className="s-head">
              <div className="row">
                <span>
                  <b>Soạn hàng · Vườn Q7</b>
                  <small>Ca chiều · 7 đơn</small>
                </span>
                <span className="pill">3/7 xong</span>
              </div>
            </div>
            <div className="m-scroll" style={{ paddingTop: '12px', gap: '10px' }}>
              {' '}
              <div className="m-order">
                <div className="m-order__h">
                  <b>MT0095398</b>· Xe máy 03 · 14–18h
                  <span className="ad-pill prep" style={{ marginLeft: 'auto' }}>
                    Đang soạn
                  </span>
                </div>
              </div>{' '}
              <div className="s-pick">
                <div>
                  <span className="ad-cb on">
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                  </span>
                  <span className="ad-thumb" style={{ width: '44px', height: '44px' }}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 3h4v3l2 3v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z" />
                      <path d="M8 13h8" />
                    </svg>
                  </span>
                  <span>
                    <b>Trichoderma 500ml x2</b>
                    <small>Lô 0325 · HSD 10/2026</small>
                  </span>
                  <span className="loc">K2-04</span>
                </div>
                <div>
                  <span className="ad-cb on">
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                  </span>
                  <span className="ad-thumb" style={{ width: '44px', height: '44px' }}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 7h12l1 13H5z" />
                      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
                    </svg>
                  </span>
                  <span>
                    <b>Đất kiểng lá 20dm³ x2</b>
                    <small />
                  </span>
                  <span className="loc">K3-11</span>
                </div>
                <div>
                  <span className="ad-cb" />
                  <span className="ad-thumb" style={{ width: '44px', height: '44px' }}>
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
                  </span>
                  <span>
                    <b>Lan hồ điệp 2 cành</b>
                    <small>Chọn cây hoa nở 60–70%</small>
                  </span>
                  <span className="loc">Nhà lưới B</span>
                </div>
              </div>{' '}
              <div className="m-pad">
                <div className="s-bigbtn">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                  Chụp ảnh cây trước khi giao<small>2–3 ảnh rõ lá, gốc, chậu · tự gửi cho khách</small>
                </div>
              </div>
            </div>
            <span className="s-scan">
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M7 12h10" />
              </svg>
            </span>
            <nav className="s-tabbar">
              <a aria-current="true">
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M3 7 12 3l9 4v10l-9 4-9-4z" />
                  <path d="M3 7l9 4 9-4M12 11v10" />
                </svg>
                Soạn hàng
              </a>
              <a>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M7 12h10" />
                </svg>
                Kiểm kê
              </a>
              <a>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
                  <circle cx="7" cy="18" r="1.8" />
                  <circle cx="17" cy="18" r="1.8" />
                </svg>
                Nhập hàng
              </a>
              <a>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
                </svg>
                Tôi
              </a>
            </nav>
          </div>
        </div>
      </div>{' '}
    </>
  );
}
