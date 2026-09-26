// Sinh tự động từ design-system/components/AdminReports/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.

export function AdminReportsView() {
  return (
    <>
      <div className="ad-body">
        <div className="ad-title">
          <h1>Báo cáo</h1>
          <span className="acts">
            <span className="ad-sel">
              6 tháng qua
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
            <span className="ad-sel">
              Tất cả cửa hàng
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
            <button className="vx-btn vx-btn--outline">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
              </svg>
              Xuất Excel
            </button>
          </span>
        </div>{' '}
        <div className="ad-kpis k5">
          <div className="ad-kpi ">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
              Doanh thu
            </span>
            <b>486 tr</b>
            <small>
              <span className="ad-up">▲ 18%</span>
              {' cùng kỳ'}
            </small>
          </div>
          <div className="ad-kpi ">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M3 7 12 3l9 4v10l-9 4-9-4z" />
                <path d="M3 7l9 4 9-4M12 11v10" />
              </svg>
              Số đơn
            </span>
            <b>3.912</b>
            <small>Giá trị TB 124k</small>
          </div>
          <div className="ad-kpi ">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <circle cx="9" cy="8" r="3.5" />
                <path d="M3 20c.8-3.5 3-5 6-5s5.2 1.5 6 5" />
                <circle cx="17" cy="9" r="2.5" />
                <path d="M16 14c2.5 0 4.2 1.4 5 4" />
              </svg>
              Khách quay lại
            </span>
            <b>41%</b>
            <small>
              <span className="ad-up">▲ 6 điểm</span>
            </small>
          </div>
          <div className="ad-kpi ">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Tỉ lệ bảo hành cây
            </span>
            <b>3,2%</b>
            <small>Mục tiêu dưới 4%</small>
          </div>
          <div className="ad-kpi ">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M6 3h9l4 4v14H6z" />
                <path d="M9 12h7M9 16h7" />
              </svg>
              Đơn từ nội dung
            </span>
            <b>17%</b>
            <small>Góc chăm cây, bệnh cây</small>
          </div>
        </div>{' '}
        <div className="ad-grid2">
          <div className="ad-card">
            <div className="ad-card__h">
              Doanh thu theo tháng
              <span className="ad-legend">
                <span>Năm nay</span>
                <span className="b">Năm trước</span>
              </span>
            </div>
            <div className="ad-card__b" style={{ paddingBottom: '28px' }}>
              <div className="ad-chart2">
                <div>
                  <i style={{ height: '62%' }} />
                  <i className="b" style={{ height: '48%' }} />
                  <span>T4</span>
                </div>
                <div>
                  <i style={{ height: '70%' }} />
                  <i className="b" style={{ height: '52%' }} />
                  <span>T5</span>
                </div>
                <div>
                  <i style={{ height: '58%' }} />
                  <i className="b" style={{ height: '55%' }} />
                  <span>T6</span>
                </div>
                <div>
                  <i style={{ height: '81%' }} />
                  <i className="b" style={{ height: '60%' }} />
                  <span>T7</span>
                </div>
                <div>
                  <i style={{ height: '76%' }} />
                  <i className="b" style={{ height: '58%' }} />
                  <span>T8</span>
                </div>
                <div>
                  <i style={{ height: '90%' }} />
                  <i className="b" style={{ height: '64%' }} />
                  <span>T9</span>
                </div>
              </div>
            </div>
          </div>{' '}
          <div className="ad-card">
            <div className="ad-card__h">Tỉ lệ bảo hành theo loại cây</div>
            <div className="ad-card__b">
              <div className="ad-bars">
                <div>
                  <span>Lan, cây hoa</span>
                  <i>
                    <em style={{ width: '54.4%' }} />
                  </i>
                  <b>6.8%</b>
                </div>
                <div>
                  <span>Kiểng lá</span>
                  <i>
                    <em style={{ width: '24.8%' }} />
                  </i>
                  <b>3.1%</b>
                </div>
                <div>
                  <span>Sen đá</span>
                  <i>
                    <em style={{ width: '19.2%' }} />
                  </i>
                  <b>2.4%</b>
                </div>
                <div>
                  <span>Bonsai</span>
                  <i>
                    <em style={{ width: '9.6%' }} />
                  </i>
                  <b>1.2%</b>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
                Nguyên nhân hàng đầu: úng rễ (38%), sốc môi trường (24%), dập khi giao (11%).
              </span>
            </div>
          </div>
        </div>{' '}
        <div className="ad-grid3">
          <div className="ad-card">
            <div className="ad-card__h">Kênh bán</div>
            <div className="ad-card__b">
              <div className="ad-bars">
                <div>
                  <span>Website</span>
                  <i>
                    <em style={{ width: '52%' }} />
                  </i>
                  <b>52%</b>
                </div>
                <div>
                  <span>Tại cửa hàng</span>
                  <i>
                    <em style={{ width: '31%' }} />
                  </i>
                  <b>31%</b>
                </div>
                <div>
                  <span>Zalo</span>
                  <i>
                    <em style={{ width: '17%' }} />
                  </i>
                  <b>17%</b>
                </div>
              </div>
            </div>
          </div>{' '}
          <div className="ad-card">
            <div className="ad-card__h">Bán kèm với cây</div>
            <div className="ad-card__b">
              <div className="ad-bars">
                <div>
                  <span>Có mua đất</span>
                  <i>
                    <em style={{ width: '46%' }} />
                  </i>
                  <b>46%</b>
                </div>
                <div>
                  <span>Có mua phân</span>
                  <i>
                    <em style={{ width: '33%' }} />
                  </i>
                  <b>33%</b>
                </div>
                <div>
                  <span>Có mua thuốc</span>
                  <i>
                    <em style={{ width: '21%' }} />
                  </i>
                  <b>21%</b>
                </div>
              </div>
            </div>
          </div>{' '}
          <div className="ad-card">
            <div className="ad-card__h">Bắt bệnh cho cây</div>
            <div className="ad-card__b">
              <div className="ad-kv">
                <span>Yêu cầu</span>
                <span>
                  <b>612</b>
                </span>
                <span>{'Trả lời < 2 giờ'}</span>
                <span>
                  <b>91%</b>
                </span>
                <span>Mua sau tư vấn</span>
                <span>
                  <b>38%</b>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
