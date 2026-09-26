// Sinh tự động từ design-system/components/AdminPurchasing/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.
import Link from 'next/link';

export function AdminPurchasingView() {
  return (
    <>
      <div className="ad-body">
        <div className="ad-title">
          <h1>{'Nhập hàng & nhà cung cấp'}</h1>
          <span className="acts">
            <button className="vx-btn vx-btn--outline">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                <circle cx="9" cy="8" r="3.5" />
                <path d="M3 20c.8-3.5 3-5 6-5s5.2 1.5 6 5" />
                <circle cx="17" cy="9" r="2.5" />
                <path d="M16 14c2.5 0 4.2 1.4 5 4" />
              </svg>
              Nhà cung cấp (14)
            </button>
            <button className="vx-btn vx-btn--primary">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              Tạo phiếu nhập
            </button>
          </span>
        </div>
        <div className="ad-card">
          <div className="ad-stabs">
            <a aria-current="true">Phiếu nhập</a>
            <a>
              Đề xuất nhập<em>5</em>
            </a>
            <a>Nhà cung cấp</a>
            <a>Công nợ NCC</a>
          </div>
          <div className="ad-tablewrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Phiếu</th>
                  <th>Nhà cung cấp</th>
                  <th className="num">Số lượng</th>
                  <th className="num">Giá trị</th>
                  <th>Giao nhận</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <Link className="code" href="/admin/don-hang/PN-0412">
                      PN-0412
                    </Link>
                    <small>Tạo 22/09</small>
                  </td>
                  <td>
                    Vườn ươm Đà Lạt Xanh<small>Cây kiểng lá</small>
                  </td>
                  <td className="num">60 cây</td>
                  <td className="num">
                    <b>14,2 tr</b>
                  </td>
                  <td>Dự kiến 26/09</td>
                  <td>
                    <span className="ad-pill ship">Đang vận chuyển</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <Link className="code" href="/admin/don-hang/PN-0409">
                      PN-0409
                    </Link>
                    <small>Tạo 20/09</small>
                  </td>
                  <td>
                    Công ty Nông dược An Tâm<small>Thuốc BVTV, phân</small>
                  </td>
                  <td className="num">120 sp</td>
                  <td className="num">
                    <b>8,9 tr</b>
                  </td>
                  <td>Nhận 23/09</td>
                  <td>
                    <span className="ad-pill done">Đã nhận đủ</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <Link className="code" href="/admin/don-hang/PN-0405">
                      PN-0405
                    </Link>
                    <small>Tạo 18/09</small>
                  </td>
                  <td>
                    Gốm sứ Bình Dương<small>Chậu sứ</small>
                  </td>
                  <td className="num">80 chậu</td>
                  <td className="num">
                    <b>6,4 tr</b>
                  </td>
                  <td>Nhận 21/09 · thiếu 4</td>
                  <td>
                    <span className="ad-pill new">Nhận thiếu</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="ad-card">
          <div className="ad-card__h">
            Nhận hàng · PN-0409<a>In phiếu nhập</a>
          </div>
          <table className="ad-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th className="num">Đặt</th>
                <th className="num">Nhận</th>
                <th>Số lô</th>
                <th>Hạn dùng</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Trichoderma 500ml</td>
                <td className="num">48</td>
                <td className="num">
                  <input
                    className="vx-input"
                    style={{ width: '52px', padding: '4px 6px', fontSize: '12px', textAlign: 'right' }}
                    defaultValue="48"
                  />
                </td>
                <td>
                  <input
                    className="vx-input"
                    style={{ width: '80px', padding: '4px 6px', fontSize: '12px' }}
                    defaultValue="0925"
                  />
                </td>
                <td>
                  <input
                    className="vx-input"
                    style={{ width: '92px', padding: '4px 6px', fontSize: '12px' }}
                    defaultValue="09/2027"
                  />
                </td>
              </tr>
              <tr>
                <td>Phân bón lá lan 250ml</td>
                <td className="num">36</td>
                <td className="num">
                  <input
                    className="vx-input"
                    style={{ width: '52px', padding: '4px 6px', fontSize: '12px', textAlign: 'right' }}
                    defaultValue="36"
                  />
                </td>
                <td>
                  <input
                    className="vx-input"
                    style={{ width: '80px', padding: '4px 6px', fontSize: '12px' }}
                    defaultValue="0826"
                  />
                </td>
                <td>
                  <input
                    className="vx-input"
                    style={{ width: '92px', padding: '4px 6px', fontSize: '12px' }}
                    defaultValue="08/2028"
                  />
                </td>
              </tr>
              <tr>
                <td>Dầu khoáng trị rệp 250ml</td>
                <td className="num">36</td>
                <td className="num">
                  <input
                    className="vx-input"
                    style={{ width: '52px', padding: '4px 6px', fontSize: '12px', textAlign: 'right' }}
                    defaultValue="36"
                  />
                </td>
                <td>
                  <input
                    className="vx-input"
                    style={{ width: '80px', padding: '4px 6px', fontSize: '12px' }}
                    defaultValue="0718"
                  />
                </td>
                <td>
                  <input
                    className="vx-input"
                    style={{ width: '92px', padding: '4px 6px', fontSize: '12px' }}
                    defaultValue="07/2027"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div className="ad-card__b">
            <div className="vx-callout" style={{ fontSize: '12px', lineHeight: '17px' }}>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M9 3h6M10 3v6L5 19a1 1 0 0 0 1 2h12a1 1 0 0 0 1-1l-5-11V3" />
              </svg>
              <div>Thuốc BVTV bắt buộc nhập số lô và hạn dùng. Hạn dưới 6 tháng sẽ bị cảnh báo khi nhận.</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <button className="vx-btn vx-btn--outline vx-btn--sm">Báo thiếu / lỗi</button>
              <button className="vx-btn vx-btn--primary vx-btn--sm">Xác nhận nhập kho</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
