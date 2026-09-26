// Sinh tự động từ design-system/components/AdminPromotions/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.

export function AdminPromotionsView() {
  return (
    <>
      <div className="ad-body">
        <div className="ad-title">
          <h1>Khuyến mãi</h1>
          <span className="acts">
            <button className="vx-btn vx-btn--outline">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
              </svg>
              Quy tắc dùng chung
            </button>
            <button className="vx-btn vx-btn--primary">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              Tạo khuyến mãi
            </button>
          </span>
        </div>{' '}
        <div className="ad-kpis">
          <div className="ad-kpi ">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M3 12V4h8l10 10-8 8z" />
                <circle cx="7.5" cy="8.5" r="1.5" />
              </svg>
              Đang chạy
            </span>
            <b>4</b>
            <small>Lên lịch: 1 · Đã kết thúc: 28</small>
          </div>
          <div className="ad-kpi ">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
              Doanh thu có khuyến mãi
            </span>
            <b>126 tr</b>
            <small>42% tổng doanh thu tháng</small>
          </div>
          <div className="ad-kpi ">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <circle cx="9" cy="8" r="3.5" />
                <path d="M3 20c.8-3.5 3-5 6-5s5.2 1.5 6 5" />
                <circle cx="17" cy="9" r="2.5" />
                <path d="M16 14c2.5 0 4.2 1.4 5 4" />
              </svg>
              Lượt dùng tháng này
            </span>
            <b>1.724</b>
            <small>Voucher, flash sale, freeship</small>
          </div>
          <div className="ad-kpi ">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3" />
              </svg>
              Chi phí khuyến mãi
            </span>
            <b>14,8 tr</b>
            <small>11,7% doanh thu có KM</small>
          </div>
        </div>{' '}
        <div className="ad-card">
          <div className="ad-stabs">
            <a aria-current="true">Tất cả</a>
            <a>Flash sale</a>
            <a>Voucher</a>
            <a>Tự động</a>
            <a>Combo</a>
            <a>Điểm thưởng</a>
          </div>
          <div className="ad-filters">
            <div className="vx-sfind__search">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <span>Tên, mã khuyến mãi</span>
            </div>
            <span className="ad-sel">
              Trạng thái
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
            <span className="ad-sel">
              Thời gian
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </div>
          <div className="ad-tablewrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Khuyến mãi</th>
                  <th>Loại</th>
                  <th>Điều kiện</th>
                  <th>Thời gian</th>
                  <th>Đã dùng</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="ad-prod">
                      <span className="vx-voucher__ic sale" style={{ width: '36px', height: '36px' }}>
                        <svg className="vx-ico" viewBox="0 0 24 24">
                          <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
                        </svg>
                      </span>
                      <span>
                        Flash sale giờ vàng 8h–12h<small>Tự động</small>
                      </span>
                    </span>
                  </td>
                  <td>Giảm % theo SP</td>
                  <td>8 sản phẩm · 50 suất/SP</td>
                  <td>Hằng ngày đến 30/09</td>
                  <td>
                    <span className="ad-usage">
                      214/400 suất
                      <i>
                        <em style={{ width: '54%' }} />
                      </i>
                    </span>
                  </td>
                  <td>
                    <span className="ad-pill ship">Đang chạy</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="ad-prod">
                      <span className="vx-voucher__ic ship" style={{ width: '36px', height: '36px' }}>
                        <svg className="vx-ico" viewBox="0 0 24 24">
                          <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
                          <circle cx="7" cy="18" r="1.8" />
                          <circle cx="17" cy="18" r="1.8" />
                        </svg>
                      </span>
                      <span>
                        Miễn phí giao cây sống<small>FREESHIPCAY</small>
                      </span>
                    </span>
                  </td>
                  <td>Miễn phí giao</td>
                  <td>Đơn có cây ≥ 500k · nội thành</td>
                  <td>01–30/09</td>
                  <td>
                    <span className="ad-usage">
                      1.032 lượt
                      <i>
                        <em style={{ width: '80%' }} />
                      </i>
                    </span>
                  </td>
                  <td>
                    <span className="ad-pill ship">Đang chạy</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="ad-prod">
                      <span className="vx-voucher__ic " style={{ width: '36px', height: '36px' }}>
                        <svg className="vx-ico" viewBox="0 0 24 24">
                          <path d="M3 12V4h8l10 10-8 8z" />
                          <circle cx="7.5" cy="8.5" r="1.5" />
                        </svg>
                      </span>
                      <span>
                        Giảm 10% phân, thuốc mua kèm cây<small>Tự động</small>
                      </span>
                    </span>
                  </td>
                  <td>Giảm % nhóm hàng</td>
                  <td>Giỏ có cây sống · tối đa 30k</td>
                  <td>01/09–15/10</td>
                  <td>
                    <span className="ad-usage">
                      386 lượt
                      <i>
                        <em style={{ width: '30%' }} />
                      </i>
                    </span>
                  </td>
                  <td>
                    <span className="ad-pill ship">Đang chạy</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="ad-prod">
                      <span className="vx-voucher__ic " style={{ width: '36px', height: '36px' }}>
                        <svg className="vx-ico" viewBox="0 0 24 24">
                          <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
                        </svg>
                      </span>
                      <span>
                        Voucher hạng Bạc 50k<small>BAC50</small>
                      </span>
                    </span>
                  </td>
                  <td>Giảm tiền</td>
                  <td>Hạng Bạc · đơn ≥ 800k</td>
                  <td>Đến 31/10</td>
                  <td>
                    <span className="ad-usage">
                      92/500
                      <i>
                        <em style={{ width: '18%' }} />
                      </i>
                    </span>
                  </td>
                  <td>
                    <span className="ad-pill ship">Đang chạy</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="ad-prod">
                      <span className="vx-voucher__ic " style={{ width: '36px', height: '36px' }}>
                        <svg className="vx-ico" viewBox="0 0 24 24">
                          <circle cx="12" cy="9" r="2" />
                          <path d="M12 5a2 2 0 1 1 0-.1M16 9a2 2 0 1 1 .1 0M12 13a2 2 0 1 1 0 .1M8 9a2 2 0 1 1-.1 0" />
                          <path d="M12 13v8M12 17c-2 0-3-1-4-2" />
                        </svg>
                      </span>
                      <span>
                        Cây Tết 2027 – đặt trước<small>CAYTET27</small>
                      </span>
                    </span>
                  </td>
                  <td>Đặt cọc 30%</td>
                  <td>Danh mục Cây Tết</td>
                  <td>15/11–20/01</td>
                  <td>
                    <span className="ad-usage">
                      —
                      <i>
                        <em style={{ width: '0%' }} />
                      </i>
                    </span>
                  </td>
                  <td>
                    <span className="ad-pill wait">Lên lịch</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
