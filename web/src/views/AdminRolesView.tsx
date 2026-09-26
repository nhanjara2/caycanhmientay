// Sinh tự động từ design-system/components/AdminRoles/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.

export function AdminRolesView() {
  return (
    <>
      <div className="ad-body">
        <div className="ad-title">
          <h1>{'Cài đặt & phân quyền'}</h1>
          <span className="acts">
            <button className="vx-btn vx-btn--primary">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              Mời nhân viên
            </button>
          </span>
        </div>
        <div className="ad-grid2">
          <div className="ad-card">
            <div className="ad-card__h">
              Quyền theo vai trò
              <span className="ad-legend2">
                <span>
                  <span className="ad-perm full">✓</span>Toàn quyền
                </span>
                <span>
                  <span className="ad-perm view">
                    <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '12px', height: '12px' }}>
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </span>
                  Chỉ xem
                </span>
                <span>
                  <span className="ad-perm none">–</span>Ẩn
                </span>
              </span>
            </div>
            <div className="ad-tablewrap">
              <table className="ad-table ad-matrix">
                <thead>
                  <tr>
                    <th>Chức năng</th>
                    <th>Quản lý</th>
                    <th>CSKH</th>
                    <th>Kho</th>
                    <th>Kỹ sư</th>
                    <th>Giao hàng</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Tổng quan</td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm view">
                        <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '12px', height: '12px' }}>
                          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </span>
                    </td>
                    <td>
                      <span className="ad-perm view">
                        <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '12px', height: '12px' }}>
                          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </span>
                    </td>
                    <td>
                      <span className="ad-perm view">
                        <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '12px', height: '12px' }}>
                          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Đơn hàng</td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm view">
                        <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '12px', height: '12px' }}>
                          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Giao hàng</td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm view">
                        <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '12px', height: '12px' }}>
                          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </span>
                    </td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Bảo hành cây</td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm view">
                        <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '12px', height: '12px' }}>
                          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Khách hàng</td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                    <td>
                      <span className="ad-perm view">
                        <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '12px', height: '12px' }}>
                          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Khuyến mãi</td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm view">
                        <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '12px', height: '12px' }}>
                          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Sản phẩm</td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm view">
                        <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '12px', height: '12px' }}>
                          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </span>
                    </td>
                    <td>
                      <span className="ad-perm view">
                        <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '12px', height: '12px' }}>
                          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </span>
                    </td>
                    <td>
                      <span className="ad-perm view">
                        <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '12px', height: '12px' }}>
                          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Kho</td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                  </tr>
                  <tr>
                    <td>{'Bài viết & bệnh cây'}</td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Hỏi đáp</td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Báo cáo</td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Cài đặt</td>
                    <td>
                      <span className="ad-perm full">✓</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                    <td>
                      <span className="ad-perm none">–</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>{' '}
          <div className="ad-card">
            <div className="ad-card__h">
              Nhân viên<a>Xem tất cả</a>
            </div>
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Vai trò</th>
                  <th>Cửa hàng</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="ad-prod">
                      <span className="vx-avatar vx-avatar--sm">MA</span>
                      <span>
                        Minh Anh<small>Quản lý</small>
                      </span>
                    </span>
                  </td>
                  <td>Quản lý</td>
                  <td>Tất cả</td>
                </tr>
                <tr>
                  <td>
                    <span className="ad-prod">
                      <span className="vx-avatar vx-avatar--sm">TA</span>
                      <span>
                        Trần Minh An<small>Kỹ sư nông nghiệp</small>
                      </span>
                    </span>
                  </td>
                  <td>Kỹ sư</td>
                  <td>Tất cả</td>
                </tr>
                <tr>
                  <td>
                    <span className="ad-prod">
                      <span className="vx-avatar vx-avatar--sm">HL</span>
                      <span>
                        Hùng<small>Tài xế xe tải</small>
                      </span>
                    </span>
                  </td>
                  <td>Giao hàng</td>
                  <td>Vườn Q7</td>
                </tr>
                <tr>
                  <td>
                    <span className="ad-prod">
                      <span className="vx-avatar vx-avatar--sm">LT</span>
                      <span>
                        Lê Thảo<small>Nhân viên kho</small>
                      </span>
                    </span>
                  </td>
                  <td>Kho</td>
                  <td>Vườn Q7</td>
                </tr>
              </tbody>
            </table>
            <div className="ad-card__b">
              <div className="vx-callout" style={{ fontSize: '12px', lineHeight: '18px' }}>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                <div>
                  Thao tác nhạy cảm (hoàn tiền, xóa đơn, đổi giá hàng loạt) yêu cầu xác nhận OTP và được ghi nhật ký.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
