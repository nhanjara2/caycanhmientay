// Sinh tự động từ design-system/components/AdminShippingSettings/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.

export function AdminShippingView() {
  return (
    <>
      <div className="ad-body">
        <div className="ad-title">
          <h1>Cài đặt giao hàng</h1>
          <span className="acts">
            <button className="vx-btn vx-btn--outline">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
                <circle cx="7" cy="18" r="1.8" />
                <circle cx="17" cy="18" r="1.8" />
              </svg>
              Hãng vận chuyển
            </button>
            <button className="vx-btn vx-btn--primary">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                <path d="m5 12 5 5 9-10" />
              </svg>
              Lưu thay đổi
            </button>
          </span>
        </div>
        <div className="zn">
          <div className="zn-map">
            <svg viewBox="0 0 600 340" preserveAspectRatio="xMidYMid slice">
              <rect x="0" y="0" width="600" height="340" fill="#e9efe6" />
              <path d="M0 170H600M300 0V340M0 90H600M150 0V340M450 0V340" stroke="#fff" strokeWidth="6" />
              <path className="z3" d="M40 30 L560 20 L580 320 L30 330 Z" />
              <path className="z2" d="M110 60 L500 50 L520 290 L90 300 Z" />
              <path className="z1" d="M200 110 L400 100 L420 240 L190 250 Z" />
              <circle className="st" cx="300" cy="175" r="9" />
              <circle className="st" cx="360" cy="140" r="7" />
              <circle className="st" cx="240" cy="210" r="7" />
            </svg>
            <div className="zn-legend">
              <span>
                <i style={{ background: 'var(--primary)' }} />
                Vùng 1 · nội thành · giao trong ngày
              </span>
              <span>
                <i style={{ background: 'var(--sun)' }} />
                Vùng 2 · ngoại thành · 1–2 ngày
              </span>
              <span>
                <i style={{ background: 'var(--ink-muted)' }} />
                Vùng 3 · tỉnh lân cận · chỉ vật tư
              </span>
            </div>
          </div>
          <div className="ad-card">
            <div className="ad-card__h">
              Phí và điều kiện theo vùng<a>+ Thêm vùng</a>
            </div>
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Vùng</th>
                  <th>Cây sống</th>
                  <th>Vật tư</th>
                  <th>Freeship từ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <b>Vùng 1</b>
                    <small>18 phường</small>
                  </td>
                  <td>
                    35.000đ<small>Trong ngày</small>
                  </td>
                  <td>
                    20.000đ<small>2 giờ</small>
                  </td>
                  <td>500k / 300k</td>
                </tr>
                <tr>
                  <td>
                    <b>Vùng 2</b>
                    <small>24 phường, xã</small>
                  </td>
                  <td>
                    60.000đ<small>1–2 ngày</small>
                  </td>
                  <td>30.000đ</td>
                  <td>1 tr / 500k</td>
                </tr>
                <tr>
                  <td>
                    <b>Vùng 3</b>
                    <small>Bình Dương, Đồng Nai</small>
                  </td>
                  <td>
                    <span className="ad-pill cancel">Không giao</span>
                  </td>
                  <td>Theo hãng vận chuyển</td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
            <div className="ad-card__b">
              <div className="ad-f">
                <label>Phụ phí cây lớn (size L trở lên)</label>
                <div className="ao-input">
                  <input className="vx-input" defaultValue="+80.000đ / cây · cần xe tải" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="ad-card">
          <div className="ad-card__h">
            Khung giờ giao và số đơn tối đa (Vườn Q7)<a>Ngày lễ, Tết</a>
          </div>
          <div className="ad-card__b">
            <div className="cap-grid">
              <span />
              <span className="h">T2</span>
              <span className="h">T3</span>
              <span className="h">T4</span>
              <span className="h">T5</span>
              <span className="h">T6</span>
              <span className="h">T7</span>
              <span className="h">CN</span>
              <span className="l">8–12h</span>
              <span className="c ">6</span>
              <span className="c ">6</span>
              <span className="c ">6</span>
              <span className="c ">6</span>
              <span className="c ">6</span>
              <span className="c hi">10</span>
              <span className="c hi">10</span>
              <span className="l">14–18h</span>
              <span className="c ">8</span>
              <span className="c ">8</span>
              <span className="c ">8</span>
              <span className="c ">8</span>
              <span className="c ">8</span>
              <span className="c hi">10</span>
              <span className="c hi">10</span>
              <span className="l">18–20h</span>
              <span className="c ">4</span>
              <span className="c ">4</span>
              <span className="c ">4</span>
              <span className="c ">4</span>
              <span className="c ">4</span>
              <span className="c off">–</span>
              <span className="c off">–</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
              {'Khi đủ số đơn, khung giờ tự đóng trên trang thanh toán (hiện "Đã kín").'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
