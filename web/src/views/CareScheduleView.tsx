// Sinh tự động từ design-system/components/CareScheduleLayout/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.
import Link from 'next/link';
import { AccountSidebar } from '@/components/AccountSidebar';

export function CareScheduleView() {
  return (
    <>
      <div className="vx-acctpage">
        <div className="vx-crumb">
          <Link href="/">Trang chủ</Link>/<Link href="/tai-khoan">Tài khoản</Link>/<span>Lịch chăm cây</span>
        </div>
        <div className="vx-acctgrid">
          <AccountSidebar />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '0' }}>
            <div className="cs-top">
              <h2>Lịch chăm cây</h2>
              <span className="vx-seg" style={{ marginLeft: 'auto' }}>
                <button className="vx-chip" aria-pressed="true">
                  Tuần
                </button>
                <button className="vx-chip">Tháng</button>
                <button className="vx-chip">Theo cây</button>
              </span>
            </div>
            <div className="cs-week">
              <div className="cs-day">
                T2<b>23</b>
                <span className="dots">
                  <i className="" />
                  <i className="f" />
                </span>
              </div>
              <div className="cs-day">
                T3<b>24</b>
                <span className="dots">
                  <i className="" />
                </span>
              </div>
              <div className="cs-day" aria-current="true">
                T4<b>25</b>
                <span className="dots">
                  <i className="" />
                  <i className="" />
                  <i className="r" />
                </span>
              </div>
              <div className="cs-day">
                T5<b>26</b>
                <span className="dots">
                  <i className="" />
                </span>
              </div>
              <div className="cs-day">
                T6<b>27</b>
                <span className="dots">
                  <i className="f" />
                </span>
              </div>
              <div className="cs-day">
                T7<b>28</b>
                <span className="dots">
                  <i className="" />
                  <i className="" />
                </span>
              </div>
              <div className="cs-day">
                CN<b>29</b>
                <span className="dots">
                  <i className="" />
                </span>
              </div>
            </div>
            <div
              style={{ display: 'grid', '--cols': 'minmax(0,1fr) 260px', gap: '12px', alignItems: 'start' }}
              className="app-cols"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="cs-list">
                  <h3>
                    Hôm nay, 25/09<small>2/4 việc đã xong</small>
                  </h3>
                  <div className="cs-task">
                    <span className="cs-check" />
                    <span className="t ">
                      <svg className="vx-ico" viewBox="0 0 24 24">
                        <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />
                      </svg>
                    </span>
                    <span>
                      <b>Tưới Monstera Deliciosa</b>
                      <small>Tưới đẫm đến khi nước chảy ra đáy · khoảng 400ml</small>
                    </span>
                    <button className="vx-btn vx-btn--ghost vx-btn--sm">Dời lịch</button>
                  </div>
                  <div className="cs-task">
                    <span className="cs-check" />
                    <span className="t r">
                      <svg className="vx-ico" viewBox="0 0 24 24">
                        <rect x="8" y="7" width="8" height="12" rx="4" />
                        <path d="M12 7V4M8 11H4M16 11h4M8 16H5M16 16h3M9 4l1 2M15 4l-1 2" />
                      </svg>
                    </span>
                    <span>
                      <b>Kiểm tra Lan hồ điệp</b>
                      <small>Lá dưới vàng 2 ngày nay. Nhấc chậu xem rễ có mềm, thâm không</small>
                    </span>
                    <Link href="/benh-cay" className="vx-btn vx-btn--primary vx-btn--sm">
                      Bắt bệnh
                    </Link>
                  </div>
                  <div className="cs-task done">
                    <span className="cs-check on">
                      <svg className="vx-ico" viewBox="0 0 24 24">
                        <path d="m5 12 5 5 9-10" />
                      </svg>
                    </span>
                    <span className="t ">
                      <svg className="vx-ico" viewBox="0 0 24 24">
                        <path d="M20 12a8 8 0 1 1-2.3-5.7L20 8" />
                        <path d="M20 3v5h-5" />
                      </svg>
                    </span>
                    <span>
                      <b>Xoay chậu Trầu bà Nam Mỹ</b>
                      <small>Xoay 1/4 vòng để cây mọc đều</small>
                    </span>
                  </div>
                  <div className="cs-task done">
                    <span className="cs-check on">
                      <svg className="vx-ico" viewBox="0 0 24 24">
                        <path d="m5 12 5 5 9-10" />
                      </svg>
                    </span>
                    <span className="t ">
                      <svg className="vx-ico" viewBox="0 0 24 24">
                        <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />
                      </svg>
                    </span>
                    <span>
                      <b>Phun sương cho Calathea</b>
                      <small>Sáng sớm, tránh đọng nước ở nách lá</small>
                    </span>
                  </div>
                </div>{' '}
                <div className="cs-list">
                  <h3>
                    Sắp tới<small>7 ngày</small>
                  </h3>
                  <div className="cs-task">
                    <span className="cs-check" />
                    <span className="t f">
                      <svg className="vx-ico" viewBox="0 0 24 24">
                        <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />
                      </svg>
                    </span>
                    <span>
                      <b>Bón phân cho Sen đá kim tuyến · 28/09</b>
                      <small>Phân tan chậm, lượng bằng nửa thìa cà phê</small>
                    </span>
                    <Link href="/danh-muc/phan-bon" className="vx-btn vx-btn--outline vx-btn--sm">
                      Mua phân · 42k
                    </Link>
                  </div>
                  <div className="cs-task">
                    <span className="cs-check" />
                    <span className="t ">
                      <svg className="vx-ico" viewBox="0 0 24 24">
                        <circle cx="6" cy="6" r="3" />
                        <circle cx="6" cy="18" r="3" />
                        <path d="M8.5 8.5 20 20M8.5 15.5 20 4" />
                      </svg>
                    </span>
                    <span>
                      <b>Tỉa ngọn Húng quế · 30/09</b>
                      <small>Tỉa trên đốt lá thứ 3 để cây ra nhánh</small>
                    </span>
                  </div>
                </div>
              </div>
              <div className="cs-side">
                <div className="cs-weather">
                  <small>TP. Hồ Chí Minh · hôm nay</small>
                  <b>31° · Mưa chiều</b>
                  <span>
                    {'Độ ẩm 82%. Đã '}
                    <b>dời lịch tưới</b>
                    {' 2 cây ngoài ban công sang ngày mai.'}
                  </span>
                </div>{' '}
                <div className="ad-card" style={{ borderRadius: '16px' }}>
                  <div className="ad-card__h">Nhắc việc</div>
                  <div className="ad-card__b" style={{ gap: '10px', fontSize: '13px' }}>
                    <div className="vx-label-row">
                      <span>Qua Zalo lúc 7:00</span>
                      <button className="vx-switch" aria-checked="true" />
                    </div>
                    <div className="vx-label-row">
                      <span>Thông báo trên app</span>
                      <button className="vx-switch" aria-checked="true" />
                    </div>
                    <div className="vx-label-row">
                      <span>Tự dời lịch tưới khi mưa</span>
                      <button className="vx-switch" aria-checked="true" />
                    </div>
                  </div>
                </div>{' '}
                <div className="cs-legend">
                  <span>
                    <i style={{ background: 'var(--primary)' }} />
                    Tưới, chăm
                  </span>
                  <span>
                    <i style={{ background: 'var(--sun)' }} />
                    Bón phân
                  </span>
                  <span>
                    <i style={{ background: 'var(--sale)' }} />
                    Kiểm tra
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
