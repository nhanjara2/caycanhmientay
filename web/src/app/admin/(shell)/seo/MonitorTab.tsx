import Link from 'next/link';
import { botLabel, ERROR_KINDS, pageGroupLabel, VITALS, type VitalName } from '@/lib/monitor';
import { seoTime } from '@/lib/seo-cms';
import { crawlStats, listErrors, listNotFound, topSearches, vitalsStats, type VitalCell } from '@/server/monitor';
import { pruneMonitor } from '@/server/monitor-store';

const muted = { color: 'var(--ink-muted)' } as const;
const empty = (cols: number, text: string) => <tr><td colSpan={cols} data-wide style={{ textAlign: 'center', padding: 24, ...muted }}>{text}</td></tr>;
const fmt = (m: VitalName, v: number) => (m === 'CLS' ? v.toFixed(2) : `${(v / 1000).toFixed(2)}s`);

/**
 * Tab "Theo dõi" của /admin/seo (giám sát SEO mục 19): đường dẫn 404 (link hỏng, backlink hỏng), lỗi máy chủ / trình duyệt,
 * máy tìm kiếm tải trang (Googlebot thật đã xác minh DNS vs giả mạo), tốc độ đo trên máy khách thật. Số liệu ghi tự động.
 */
export async function MonitorTab() {
  await pruneMonitor();
  const [nf, errs, crawl, vitals, searches] = await Promise.all([listNotFound(30, 100), listErrors(14, 100), crawlStats(), vitalsStats(28), topSearches(30, 50)]);
  const dayAgo = Date.now() - 86_400_000;
  const nf24 = nf.filter((n) => n.lastSeen.getTime() > dayAgo).length;
  const err24 = errs.filter((e) => e.lastSeen.getTime() > dayAgo);
  const google = crawl.byBot.filter((b) => b.bot === 'google');
  const gReal = google.find((b) => b.verified)?.week ?? 0;
  const gFake = google.find((b) => !b.verified)?.week ?? 0;
  const paramHits = crawl.byGroup.filter((g) => g.section.endsWith('?')).reduce((n, g) => n + g.hits, 0);
  const allHits = crawl.byGroup.reduce((n, g) => n + g.hits, 0);
  const groups = [...vitals.keys()].sort((a, b) => (a === '*' ? -1 : b === '*' ? 1 : a.localeCompare(b)));

  const vcell = (c: VitalCell | undefined, m: VitalName) => {
    if (!c || !c.hits) return <span style={muted}>—</span>;
    const good = Math.round((c.good / c.hits) * 100);
    return (
      <span title={`${c.hits} lượt · trung bình ${fmt(m, c.avg)} · kém ${Math.round((c.poor / c.hits) * 100)}%`}>
        <b style={{ color: good >= 75 ? 'var(--primary-hover)' : c.poor / c.hits > 0.25 ? 'var(--danger, #c62828)' : undefined }}>{good}% tốt</b>
        <small style={{ display: 'block', ...muted }}>TB {fmt(m, c.avg)} · {c.hits}</small>
      </span>
    );
  };

  return (
    <div style={{ display: 'grid', gap: 16, padding: '12px 0' }}>
      <div className="ad-kpis">
        <div className="ad-kpi"><span>Đường dẫn 404 (24 giờ)</span><b>{nf24}</b><small>{nf.length} trong 30 ngày</small></div>
        <div className="ad-kpi"><span>Lỗi (24 giờ)</span><b>{err24.length}</b><small>{err24.filter((e) => !['client', 'hydration'].includes(e.kind)).length} lỗi máy chủ</small></div>
        <div className="ad-kpi"><span>Googlebot thật (7 ngày)</span><b>{gReal}</b><small>{gFake ? `${gFake} lượt xưng Googlebot nhưng không phải` : 'Không thấy Googlebot giả'}</small></div>
        <div className="ad-kpi"><span>Google tải URL có tham số</span><b>{allHits ? Math.round((paramHits / allHits) * 100) : 0}%</b><small>{paramHits > allHits * 0.3 ? 'Cao — xem bộ lọc / tìm kiếm' : 'Bình thường'}</small></div>
      </div>

      <section>
        <h2 className="ad-card__h" style={{ padding: 0, marginBottom: 6 }}>Khách tìm gì (30 ngày)</h2>
        <p className="hint" style={{ margin: '0 0 8px', ...muted }}>Từ khóa khách gõ ở ô tìm kiếm. Dòng đỏ = không tìm ra sản phẩm nào: shop chưa bán, hoặc nên thêm tên gọi đó vào ô &ldquo;Tên gọi khác&rdquo; của sản phẩm. Từ khóa được tìm từ 2 ngày trở lên tự lên dải &ldquo;Xu hướng tìm kiếm&rdquo; ở đầu trang (cập nhật mỗi giờ).</p>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead><tr><th>Từ khóa</th><th className="num">Lượt</th><th className="num">Số ngày</th><th className="num">Sản phẩm tìm ra</th><th>Gần nhất</th></tr></thead>
            <tbody>
              {searches.map((s) => (
                <tr key={s.q}>
                  <td><Link href={`/tim-kiem?q=${encodeURIComponent(s.q)}`} target="_blank" style={{ color: 'var(--primary)', fontWeight: 600 }}>{s.q}</Link></td>
                  <td className="num" data-label="Lượt" data-m="third">{s.hits}</td>
                  <td className="num" data-label="Số ngày" data-m="third">{s.days}</td>
                  <td className="num" data-label="Tìm ra" data-m="third">{s.results ? s.results : <b style={{ color: 'var(--danger, #c62828)' }}>0 — chưa có</b>}</td>
                  <td data-label="Gần nhất">{s.lastDay.split('-').reverse().join('/')}</td>
                </tr>
              ))}
              {!searches.length && empty(5, 'Chưa có lượt tìm nào trong 30 ngày.')}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="ad-card__h" style={{ padding: 0, marginBottom: 6 }}>Trang không tìm thấy (404)</h2>
        <p className="hint" style={{ margin: '0 0 8px', ...muted }}>Có link từ web khác hoặc Google đã ghé thì nên thêm chuyển hướng sang trang thay thế. Đường dẫn rác (bot dò lỗi) bỏ qua được.</p>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead><tr><th>Đường dẫn</th><th className="num">Lượt</th><th>Dẫn từ</th><th>Gần nhất</th><th /></tr></thead>
            <tbody>
              {nf.map((n) => (
                <tr key={n.path}>
                  <td style={{ wordBreak: 'break-all' }}>
                    <b>{n.path}</b>
                    <small style={{ display: 'block', ...muted }}>
                      {[n.external && 'Có link từ web khác', n.botHits && `Máy tìm kiếm ${n.botHits} lượt`, n.redirect && `Đã chuyển → ${n.redirect}`].filter(Boolean).join(' · ')}
                    </small>
                  </td>
                  <td className="num" data-label="Lượt" data-m="third">{n.hits}</td>
                  <td data-label="Dẫn từ" style={{ wordBreak: 'break-all' }}>{n.referrer ? <a href={n.referrer} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{n.referrer.replace(/^https?:\/\//, '')}</a> : <span style={muted}>Gõ tay / không rõ</span>}</td>
                  <td data-label="Gần nhất">{seoTime(n.lastSeen)}<small style={{ display: 'block', ...muted }}>Lần đầu {seoTime(n.firstSeen)}</small></td>
                  <td data-m="foot end">{!n.redirect && <Link href={`/admin/seo?tab=chuyen-huong&tu=${encodeURIComponent(n.path)}`} className="vx-btn vx-btn--ghost vx-btn--sm">Chuyển hướng</Link>}</td>
                </tr>
              ))}
              {!nf.length && empty(5, 'Chưa ghi nhận đường dẫn 404 nào trong 30 ngày.')}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="ad-card__h" style={{ padding: 0, marginBottom: 6 }}>Lỗi máy chủ & trình duyệt (14 ngày)</h2>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead><tr><th>Lỗi</th><th>Loại</th><th>Trang</th><th className="num">Lượt</th><th>Gần nhất</th></tr></thead>
            <tbody>
              {errs.map((e) => (
                <tr key={`${e.kind}${e.path}${e.message}`}>
                  <td style={{ wordBreak: 'break-word' }}><b>{e.message}</b>{e.digest && <small style={{ display: 'block', ...muted }}>Mã {e.digest} (tra trong Vercel → Logs)</small>}</td>
                  <td data-label="Loại" data-m="aside"><span className={`ad-pill ${['client', 'hydration'].includes(e.kind) ? 'wait' : 'new'}`}>{ERROR_KINDS[e.kind] ?? e.kind}</span></td>
                  <td data-label="Trang" style={{ wordBreak: 'break-all' }}>{e.path}</td>
                  <td className="num" data-label="Lượt" data-m="third">{e.hits}</td>
                  <td data-label="Gần nhất">{seoTime(e.lastSeen)}</td>
                </tr>
              ))}
              {!errs.length && empty(5, 'Không có lỗi nào trong 14 ngày.')}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="ad-card__h" style={{ padding: 0, marginBottom: 6 }}>Máy tìm kiếm tải trang</h2>
        <p className="hint" style={{ margin: '0 0 8px', ...muted }}>"Đã xác minh" = tra ngược DNS đúng máy chủ của Google / Bing. Ai cũng giả được tên Googlebot, không giả được DNS.</p>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead><tr><th>Máy</th><th className="num">Hôm nay</th><th className="num">7 ngày</th><th className="num">28 ngày</th></tr></thead>
            <tbody>
              {crawl.byBot.map((b) => (
                <tr key={`${b.bot}${b.verified}`}>
                  <td><b>{botLabel(b.bot)}</b>{(b.bot === 'google' || b.bot === 'bing') && <small style={{ display: 'block', ...muted }}>{b.verified ? 'Đã xác minh' : 'Chưa xác minh / giả mạo'}</small>}</td>
                  <td className="num" data-label="Hôm nay" data-m="third">{b.today}</td>
                  <td className="num" data-label="7 ngày" data-m="third">{b.week}</td>
                  <td className="num" data-label="28 ngày" data-m="third">{b.month}</td>
                </tr>
              ))}
              {!crawl.byBot.length && empty(4, 'Chưa ghi nhận lượt máy tìm kiếm nào.')}
            </tbody>
          </table>
        </div>
        {crawl.byGroup.length > 0 && (
          <p style={{ margin: '8px 0 0', fontSize: '0.875rem' }}>
            <b>Googlebot thật 7 ngày theo nhóm trang:</b> {crawl.byGroup.map((g) => `${pageGroupLabel(g.section)} ${g.hits}`).join(' · ')}
            <br /><b>Theo ngày (14 ngày):</b> {crawl.byDay.map((d) => `${d.day.slice(8)}/${d.day.slice(5, 7)}: ${d.hits}`).join(' · ')}
          </p>
        )}
      </section>

      <section>
        <h2 className="ad-card__h" style={{ padding: 0, marginBottom: 6 }}>Tốc độ trên máy khách thật (28 ngày)</h2>
        <p className="hint" style={{ margin: '0 0 8px', ...muted }}>Google đánh giá đạt khi ≥ 75% lượt "tốt". Số chi tiết hơn: Vercel → Speed Insights, Search Console → Chỉ số Web Quan trọng.</p>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead><tr><th>Nhóm trang</th><th>Máy</th>{(['LCP', 'INP', 'CLS'] as const).map((m) => <th key={m} title={VITALS[m].label}>{m}</th>)}</tr></thead>
            <tbody>
              {groups.flatMap((g) => ['mobile', 'desktop'].filter((d) => vitals.get(g)?.has(d)).map((d) => (
                <tr key={`${g}${d}`}>
                  <td><b>{g === '*' ? 'Cả web' : pageGroupLabel(g)}</b></td>
                  <td data-label="Máy" data-m="aside">{d === 'mobile' ? 'Điện thoại' : 'Máy tính'}</td>
                  {(['LCP', 'INP', 'CLS'] as const).map((m) => <td key={m} data-label={m} data-m="third">{vcell(vitals.get(g)?.get(d)?.get(m), m)}</td>)}
                </tr>
              )))}
              {!groups.length && empty(5, 'Chưa có số đo (chỉ đo trên tên miền chính, sau khi khách tải trang).')}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
