// Sinh tự động từ design-system/components/AdminCustomers/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.

export function AdminCustomersView() {
  return (
    <>
      <div className="ad-body">
        <div className="ad-title">
          <h1>Khách hàng</h1>
          <span className="acts">
            <button className="vx-btn vx-btn--outline">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
              </svg>
              Xuất danh sách
            </button>
            <button className="vx-btn vx-btn--primary">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              Thêm khách
            </button>
          </span>
        </div>
        <div className="ad-split">
          <div className="ad-card">
            <div className="ad-filters">
              <div className="vx-sfind__search">
                <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <span>Tên, SĐT, email</span>
              </div>
              <span className="ad-sel">
                Hạng
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
              <span className="ad-sel">
                Quan tâm
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
              <span className="ad-sel">
                Có cây đang bảo hành
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </div>
            <div className="ad-tablewrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Hạng</th>
                    <th className="num">Đơn</th>
                    <th className="num">Chi tiêu</th>
                    <th>Mua gần nhất</th>
                    <th>Nhãn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="sel">
                    <td>
                      <span className="ad-prod">
                        <span className="vx-avatar vx-avatar--sm">LN</span>
                        <span>
                          Lê Hoài Nhân<small>0703 xxx 001</small>
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="vx-tier">Bạc</span>
                    </td>
                    <td className="num">8</td>
                    <td className="num">
                      <b>4,6 tr</b>
                    </td>
                    <td>22/09 · Monstera</td>
                    <td>
                      <span className="ad-tags">
                        <span className="vx-badge vx-badge--info">Kiểng lá</span>
                        <span className="vx-badge vx-badge--info">Nhận nhắc Zalo</span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="ad-prod">
                        <span className="vx-avatar vx-avatar--sm">AP</span>
                        <span>
                          Công ty An Phát<small>0287 xxx 900</small>
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="vx-tier">Vàng</span>
                    </td>
                    <td className="num">14</td>
                    <td className="num">
                      <b>38,2 tr</b>
                    </td>
                    <td>23/09 · Cây văn phòng x12</td>
                    <td>
                      <span className="ad-tags">
                        <span className="vx-badge vx-badge--info">Doanh nghiệp</span>
                        <span className="vx-badge vx-badge--info">Chăm định kỳ</span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="ad-prod">
                        <span className="vx-avatar vx-avatar--sm">CN</span>
                        <span>
                          Chị Ngọc<small>0982 xxx 714</small>
                        </span>
                      </span>
                    </td>
                    <td>
                      <span
                        className="vx-tier"
                        style={{ background: 'var(--surface-sunken)', color: 'var(--ink-muted)' }}
                      >
                        Thành viên
                      </span>
                    </td>
                    <td className="num">2</td>
                    <td className="num">
                      <b>0,9 tr</b>
                    </td>
                    <td>23/09 · Lan hồ điệp</td>
                    <td>
                      <span className="ad-tags">
                        <span className="vx-badge vx-badge--info">Lan</span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="ad-prod">
                        <span className="vx-avatar vx-avatar--sm">TB</span>
                        <span>
                          Trần Quốc Bảo<small>0913 xxx 220</small>
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="vx-tier">Bạc</span>
                    </td>
                    <td className="num">5</td>
                    <td className="num">
                      <b>1,8 tr</b>
                    </td>
                    <td>24/09 · Trichoderma</td>
                    <td>
                      <span className="ad-tags">
                        <span className="vx-badge vx-badge--info">Rau sạch</span>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <aside className="ad-drawer">
            <div className="head">
              <span className="vx-avatar">LN</span>
              <span>
                <b>Lê Hoài Nhân</b>
                <small>0703 005 001 · Bạc · từ 03/2025</small>
              </span>
            </div>{' '}
            <div className="sec">
              <div className="ad-mini">
                <div>
                  <b>8</b>Đơn
                </div>
                <div>
                  <b>4,6 tr</b>Chi tiêu
                </div>
                <div>
                  <b>1.250</b>Điểm
                </div>
              </div>
            </div>{' '}
            <div className="sec">
              <h4>VƯỜN CỦA KHÁCH (6 CÂY)</h4>
              <div className="ad-plants">
                <div>
                  <span className="ad-thumb" style={{ width: '28px', height: '28px' }}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 12h12l-1.5 8h-9z" />
                      <path d="M12 12V7" />
                      <path d="M12 9c-2-3-5-3-6-2 1 2 4 3 6 2z" />
                      <path d="M12 8c1.5-3 4.5-3.5 6-2.5-1 2-4 3.5-6 2.5z" />
                    </svg>
                  </span>
                  Monstera · M<small>Bảo hành còn 5 ngày</small>
                </div>
                <div>
                  <span className="ad-thumb" style={{ width: '28px', height: '28px' }}>
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
                  Lan hồ điệp<small>Đến hạn bón phân</small>
                </div>
              </div>
            </div>{' '}
            <div className="sec">
              <h4>QUAN TÂM</h4>
              <span className="ad-tags">
                <span className="vx-badge vx-badge--info">Kiểng lá</span>
                <span className="vx-badge vx-badge--info">Sen đá</span>
                <span className="vx-badge vx-badge--info">Rau sạch</span>
              </span>
            </div>{' '}
            <div className="sec">
              <h4>GHI CHÚ NỘI BỘ</h4>
              <span>Nhà hướng tây, hay hỏi về cháy lá. Ưu tiên tư vấn cây chịu nắng.</span>
            </div>{' '}
            <div className="sec" style={{ border: '0', flexDirection: 'row', gap: '6px' }}>
              <button className="vx-btn vx-btn--outline vx-btn--sm">
                <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '13px', height: '13px' }}>
                  <path d="M4 5h16v11H9l-5 4z" />
                </svg>
                Nhắn Zalo
              </button>
              <button className="vx-btn vx-btn--outline vx-btn--sm">Tặng voucher</button>
              <button className="vx-btn vx-btn--primary vx-btn--sm">Tạo đơn</button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
