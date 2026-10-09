'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition, type FormEvent, type ReactNode } from 'react';
import { deleteProjectAction, saveProjectAction, uploadProjectImageAction } from '@/app/actions/projects';
import { compressImage } from '@/lib/compress-image';
import {
  MAX_PROJECT_IMAGES, MAX_PROJECT_METRICS, MAX_PROJECT_PLANTS, MAX_PROJECT_SCOPE, PROJECT_ROLES, PROJECT_TYPES, projectImageUrl, projectPath,
  type ProjectImage, type ProjectMetric, type ProjectQuote, type ProjectRole, type ProjectType,
} from '@/lib/projects';
import { Select } from '@/components/Select';

export type ProjectFormValue = {
  id?: number; slug?: string; title: string; type: ProjectType; roles: ProjectRole[]; client: string; clientLogo: string | null;
  location: string; year: number | null; duration: string; summary: string; body: string; scope: string[]; plants: string[];
  metrics: ProjectMetric[]; quote: ProjectQuote | null; images: ProjectImage[]; featured: boolean; published: boolean;
};

const hintStyle = { fontSize: '0.6875rem', color: 'var(--ink-muted)' } as const;

/** Thu nhỏ logo ≤ 600px, giữ nền trong suốt (PNG) — không dùng compressImage vì JPEG làm nền trong suốt thành đen. */
async function shrinkLogo(f: File): Promise<File> {
  const bmp = await createImageBitmap(f);
  const scale = Math.min(1, 600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));
  if (!blob) throw new Error('Không đọc được ảnh');
  return new File([blob], 'logo.png', { type: 'image/png' });
}

function Card({ title, extra, children }: { title: ReactNode; extra?: ReactNode; children: ReactNode }) {
  return (
    <div className="ad-card">
      <div className="ad-card__h"><span>{title}</span>{extra}</div>
      <div className="ad-card__b">{children}</div>
    </div>
  );
}

export function ProjectForm({ initial, canEdit }: { initial: ProjectFormValue; canEdit: boolean }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [plants, setPlants] = useState(initial.plants.join(', '));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState('');
  const [pending, start] = useTransition();
  const photoInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const set = <K extends keyof ProjectFormValue>(k: K, val: ProjectFormValue[K]) => { setV((x) => ({ ...x, [k]: val })); setSaved(false); };

  const upload = async (file: File, logo: boolean) => {
    const fd = new FormData();
    fd.set('id', String(v.id));
    fd.set('photo', logo ? await shrinkLogo(file) : await compressImage(file, 1600));
    return uploadProjectImageAction(fd);
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length || !v.id) return;
    setError('');
    const list = [...files].slice(0, MAX_PROJECT_IMAGES - v.images.length);
    if (list.length < files.length) setError(`Mỗi dự án tối đa ${MAX_PROJECT_IMAGES} ảnh — đã bỏ bớt ảnh thừa`);
    for (const [i, f] of list.entries()) {
      setBusy(`Đang tải ảnh ${i + 1}/${list.length}…`);
      try {
        const r = await upload(f, false);
        if (!r.ok) { setError(r.error); break; }
        setV((x) => ({ ...x, images: [...x.images, { file: r.file, caption: '' }] }));
        setSaved(false);
      } catch {
        setError('Không đọc được ảnh này, vui lòng chọn ảnh khác (JPG, PNG, WebP)');
        break;
      }
    }
    setBusy('');
    if (photoInput.current) photoInput.current.value = '';
  };

  const pickLogo = async (f?: File) => {
    if (!f || !v.id) return;
    setError('');
    setBusy('Đang tải logo…');
    try {
      const r = await upload(f, true);
      if (r.ok) set('clientLogo', r.file); else setError(r.error);
    } catch {
      setError('Không đọc được ảnh logo, vui lòng chọn ảnh khác (PNG, JPG, WebP)');
    }
    setBusy('');
    if (logoInput.current) logoInput.current.value = '';
  };

  const moveImage = (i: number, to: number) => {
    const a = [...v.images];
    const [x] = a.splice(i, 1);
    a.splice(to, 0, x);
    set('images', a);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...v,
      slug: undefined,
      plants: plants.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean),
      scope: v.scope.map((s) => s.trim()).filter(Boolean),
      metrics: v.metrics.filter((m) => m.value.trim() || m.label.trim()),
      quote: v.quote && (v.quote.quote.trim() || v.quote.name.trim()) ? v.quote : null,
    };
    start(async () => {
      const r = await saveProjectAction(payload).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setSaved(true);
      if (!v.id) { router.push(`/admin/du-an/${r.id}?moi=1`); return; }
      router.refresh();
    });
  };

  const remove = () => {
    if (!v.id || !confirm(`Xóa vĩnh viễn dự án “${v.title}”?\nẢnh của dự án cũng bị xóa. Không thể hoàn tác — muốn tạm ẩn thì tắt “Hiện trên web”.`)) return;
    start(async () => {
      const r = await deleteProjectAction(v.id).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      router.push('/admin/du-an');
      router.refresh();
    });
  };

  const viewHref = v.slug ? (initial.published ? projectPath(v.slug) : `${projectPath(v.slug)}?xem-truoc=1`) : null;

  return (
    <form className="ad-body" onSubmit={submit} style={{ paddingBottom: 0 }}>
      <div className="ad-title">
        <h1>{v.id ? 'Sửa dự án' : 'Thêm dự án'}</h1>
        <span className="vx-crumb"><Link href="/admin/du-an">Dự án doanh nghiệp</Link>/<span>{v.id ? v.title : 'Mới'}</span></span>
        {viewHref && <span className="acts"><Link href={viewHref} target="_blank" className="vx-btn vx-btn--outline">{initial.published ? 'Xem trên web' : 'Xem trước'}</Link></span>}
      </div>
      <fieldset disabled={!canEdit} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <div className="ad-form">
          <div className="ad-fcol">
            <Card title="Thông tin dự án">
              <div className="ad-f">
                <label htmlFor="pj-title">Tên dự án <i>*</i></label>
                <input id="pj-title" className="vx-input" value={v.title} onChange={(e) => set('title', e.target.value)} maxLength={150} required
                  placeholder="Cung cấp cây xanh cảnh quan khu dân cư …" />
                {!v.id && <span className="hint">Đường dẫn trang tạo từ tên lúc lưu lần đầu và không đổi về sau.</span>}
              </div>
              <div className="ad-frow app-pair">
                <div className="ad-f">
                  <label htmlFor="pj-type">Loại công trình <i>*</i></label>
                  <Select id="pj-type" className="vx-input" value={v.type} onChange={(e) => set('type', e.target.value as ProjectType)}>
                    {PROJECT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
                  </Select>
                </div>
                <div className="ad-f">
                  <label htmlFor="pj-loc">Địa điểm</label>
                  <input id="pj-loc" className="vx-input" value={v.location} onChange={(e) => set('location', e.target.value)} maxLength={120} placeholder="TP. Hồ Chí Minh" />
                </div>
              </div>
              <div className="ad-frow app-pair">
                <div className="ad-f">
                  <label htmlFor="pj-year">Năm thực hiện</label>
                  <input id="pj-year" className="vx-input" type="number" inputMode="numeric" min={1990} max={2100} value={v.year ?? ''} placeholder="Để trống nếu chưa rõ"
                    onChange={(e) => set('year', e.target.value ? Number(e.target.value) : null)} />
                </div>
                <div className="ad-f">
                  <label htmlFor="pj-dur">Thời gian thực hiện</label>
                  <input id="pj-dur" className="vx-input" value={v.duration} onChange={(e) => set('duration', e.target.value)} maxLength={60} placeholder="45 ngày · 03 – 05/2024" />
                </div>
              </div>
              <div className="ad-f">
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Phần việc shop đã làm <i style={{ color: 'var(--danger)', fontStyle: 'normal' }}>*</i></span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {PROJECT_ROLES.map((r) => {
                    const on = v.roles.includes(r.key);
                    return (
                      <button key={r.key} type="button" className="vx-chip" aria-pressed={on}
                        onClick={() => set('roles', on ? v.roles.filter((x) => x !== r.key) : PROJECT_ROLES.map((o) => o.key).filter((k) => k === r.key || v.roles.includes(k)))}>
                        {r.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="ad-f">
                <label htmlFor="pj-sum">Tóm tắt <i>*</i></label>
                <textarea id="pj-sum" className="vx-input" style={{ minHeight: 72 }} value={v.summary} onChange={(e) => set('summary', e.target.value)} maxLength={400} required
                  placeholder="Một – hai câu: shop đã làm gì, cho ai, quy mô ra sao. Hiện trên thẻ dự án." />
                <span className="hint">{v.summary.length}/400 ký tự</span>
              </div>
              <div className="ad-f">
                <label htmlFor="pj-body">Mô tả chi tiết</label>
                <textarea id="pj-body" className="vx-input" style={{ minHeight: 160 }} value={v.body} onChange={(e) => set('body', e.target.value)} maxLength={6000}
                  placeholder={'Yêu cầu của khách, khó khăn của công trình (đất, nắng gió, thời gian gấp…), cách shop chọn cây và triển khai, kết quả sau bàn giao.\n\nXuống dòng để tách đoạn.'} />
              </div>
            </Card>

            <Card title="Ảnh công trình" extra={<small style={hintStyle}>{v.images.length}/{MAX_PROJECT_IMAGES}</small>}>
              {!v.id ? (
                <span className="hint">Bấm <b>Lưu dự án</b> trước, sau đó tải ảnh lên ở trang sửa.</span>
              ) : (
                <>
                  <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => void addPhotos(e.target.files)} />
                  <div className="pi-grid">
                    {v.images.map((img, i) => {
                      const main = i === 0;
                      return (
                        <div key={img.file} style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: main ? 'span 2' : undefined }}>
                          <figure className="pi-tile" style={main ? { aspectRatio: '4 / 3', border: '3px solid var(--primary)' } : { aspectRatio: '4 / 3' }}>
                            <img src={projectImageUrl(img.file)} alt={img.caption || (main ? 'Ảnh bìa' : `Ảnh ${i + 1}`)} loading="lazy" />
                            <span className={main ? 'pi-tag pi-tag--main' : 'pi-tag'}>{main ? '★ Ảnh bìa' : `Ảnh ${i + 1}`}</span>
                            {canEdit && (
                              <figcaption>
                                {!main && <button type="button" className="pi-primary" onClick={() => moveImage(i, 0)}>★ Làm ảnh bìa</button>}
                                <span className="pi-tools">
                                  {i > 1 && <button type="button" onClick={() => moveImage(i, i - 1)} aria-label="Dời lên trước" title="Dời lên trước">‹</button>}
                                  {i > 0 && i < v.images.length - 1 && <button type="button" onClick={() => moveImage(i, i + 1)} aria-label="Dời ra sau" title="Dời ra sau">›</button>}
                                  <button type="button" onClick={() => set('images', v.images.filter((_, j) => j !== i))} aria-label="Bỏ ảnh" title="Bỏ ảnh">✕</button>
                                </span>
                              </figcaption>
                            )}
                          </figure>
                          <input className="vx-input" style={{ padding: '6px 8px', fontSize: '0.75rem' }} value={img.caption} maxLength={160} placeholder="Chú thích (không bắt buộc)"
                            aria-label={`Chú thích ảnh ${i + 1}`} onChange={(e) => set('images', v.images.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))} />
                        </div>
                      );
                    })}
                    {canEdit && v.images.length < MAX_PROJECT_IMAGES && (
                      <button type="button" className={v.images.length ? 'pi-tile pi-tile--add' : 'pi-tile pi-tile--add pi-tile--main'} style={{ aspectRatio: '4 / 3' }}
                        disabled={!!busy} onClick={() => photoInput.current?.click()}>
                        <b>{busy || (v.images.length ? '+ Thêm ảnh' : '+ Tải ảnh công trình')}</b>
                        {!busy && <small>Chọn được nhiều ảnh một lần</small>}
                      </button>
                    )}
                  </div>
                  <span className="hint" style={hintStyle}>
                    Ảnh chụp thật tại công trình (trước – trong – sau khi làm càng tốt). Ảnh đầu là <b>ảnh bìa</b> trên thẻ dự án. Ảnh tự thu nhỏ khi tải; thứ tự,
                    chú thích và ảnh bỏ đi chỉ được ghi khi bấm <b>Lưu dự án</b>.
                  </span>
                </>
              )}
            </Card>

            <Card title="Hạng mục công việc" extra={v.scope.length < MAX_PROJECT_SCOPE && <a style={{ cursor: 'pointer' }} onClick={() => set('scope', [...v.scope, ''])}>+ Thêm dòng</a>}>
              {v.scope.map((s, i) => (
                <div key={i} className="ad-frow app-rowx">
                  <input className="vx-input" value={s} maxLength={200} placeholder="Cung cấp 120 cây bóng mát cao 3 – 4m, đường kính gốc 10cm"
                    aria-label={`Hạng mục ${i + 1}`} onChange={(e) => set('scope', v.scope.map((x, j) => (j === i ? e.target.value : x)))} />
                  <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" aria-label="Xóa dòng" onClick={() => set('scope', v.scope.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
              {!v.scope.length && <span className="hint" style={hintStyle}>Chưa có dòng nào. Mỗi dòng một việc cụ thể, có số lượng / quy cách nếu được.</span>}
            </Card>

            <Card title="Số liệu nổi bật" extra={v.metrics.length < MAX_PROJECT_METRICS && <a style={{ cursor: 'pointer' }} onClick={() => set('metrics', [...v.metrics, { value: '', label: '' }])}>+ Thêm dòng</a>}>
              {v.metrics.map((m, i) => (
                <div key={i} className="ad-frow app-rowx">
                  <div className="ad-frow app-pair">
                    <input className="vx-input" value={m.value} maxLength={30} placeholder="1.200" aria-label={`Con số ${i + 1}`}
                      onChange={(e) => set('metrics', v.metrics.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                    <input className="vx-input" value={m.label} maxLength={60} placeholder="cây xanh các loại" aria-label={`Ý nghĩa con số ${i + 1}`}
                      onChange={(e) => set('metrics', v.metrics.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  </div>
                  <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" aria-label="Xóa dòng" onClick={() => set('metrics', v.metrics.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
              <span className="hint" style={hintStyle}>Tối đa {MAX_PROJECT_METRICS} con số hiện to trên thẻ và trang dự án, ví dụ “1.200 · cây xanh”, “3 ha · diện tích”, “45 ngày · thi công”. Chỉ ghi số đúng thực tế.</span>
            </Card>

            <Card title="Ý kiến khách hàng"
              extra={v.quote
                ? <a style={{ cursor: 'pointer' }} onClick={() => set('quote', null)}>Bỏ</a>
                : <a style={{ cursor: 'pointer' }} onClick={() => set('quote', { quote: '', name: '', title: '' })}>+ Thêm</a>}>
              {v.quote ? (
                <>
                  <div className="ad-f">
                    <label htmlFor="pj-q">Lời nhận xét <i>*</i></label>
                    <textarea id="pj-q" className="vx-input" style={{ minHeight: 72 }} value={v.quote.quote} maxLength={600}
                      onChange={(e) => set('quote', { ...v.quote!, quote: e.target.value })} />
                  </div>
                  <div className="ad-frow app-pair">
                    <div className="ad-f">
                      <label htmlFor="pj-qn">Người nhận xét <i>*</i></label>
                      <input id="pj-qn" className="vx-input" value={v.quote.name} maxLength={80} placeholder="Anh Minh" onChange={(e) => set('quote', { ...v.quote!, name: e.target.value })} />
                    </div>
                    <div className="ad-f">
                      <label htmlFor="pj-qt">Chức vụ, đơn vị</label>
                      <input id="pj-qt" className="vx-input" value={v.quote.title} maxLength={120} placeholder="Trưởng ban quản lý tòa nhà" onChange={(e) => set('quote', { ...v.quote!, title: e.target.value })} />
                    </div>
                  </div>
                </>
              ) : (
                <span className="hint" style={hintStyle}>Lời nhận xét thật của khách (đã được khách đồng ý đăng). Không bắt buộc.</span>
              )}
            </Card>
          </div>

          <div className="ad-fcol">
            <Card title="Hiển thị">
              <label className="vx-check" style={{ alignItems: 'center' }}>
                <input type="checkbox" checked={v.published} disabled={!v.id} onChange={(e) => { set('published', e.target.checked); if (!e.target.checked) set('featured', false); }} />
                Hiện trên trang Đối tác sỉ
              </label>
              <label className="vx-check" style={{ alignItems: 'center' }}>
                <input type="checkbox" checked={v.featured} disabled={!v.published || !v.images.length} onChange={(e) => set('featured', e.target.checked)} />
                Nổi bật (lên đầu trang, ảnh bìa ở khung lớn)
              </label>
              <span className="hint" style={hintStyle}>
                {!v.id
                  ? 'Dự án mới lưu ở trạng thái ẩn; lưu xong mới bật hiện và tải ảnh được.'
                  : v.images.length
                    ? 'Có ảnh: hiện thành thẻ ảnh trong mục “Dự án đã triển khai”.'
                    : 'Chưa có ảnh: chỉ hiện một dòng trong bảng “Danh sách công trình”. Thêm ảnh để thành thẻ ảnh và chọn được Nổi bật.'}
              </span>
            </Card>

            <Card title="Khách hàng / chủ đầu tư">
              <div className="ad-f">
                <label htmlFor="pj-client">Tên hiển thị</label>
                <input id="pj-client" className="vx-input" value={v.client} onChange={(e) => set('client', e.target.value)} maxLength={120} placeholder="Công ty … / Một khu nghỉ dưỡng tại …" />
                <span className="hint">Chỉ ghi tên thật khi khách <b>đồng ý công khai</b>. Không thì ghi chung hoặc để trống.</span>
              </div>
              <div className="ad-f">
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Logo khách hàng</span>
                {!v.id ? (
                  <span className="hint">Lưu dự án trước rồi mới tải logo.</span>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {v.clientLogo
                      ? <img src={projectImageUrl(v.clientLogo)} alt="Logo khách hàng" style={{ width: 96, height: 48, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--border)', background: '#fff' }} />
                      : <span style={{ width: 96, height: 48, borderRadius: 6, border: '1px dashed var(--border)', display: 'grid', placeItems: 'center', ...hintStyle }}>Chưa có logo</span>}
                    <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => void pickLogo(e.target.files?.[0])} />
                    {canEdit && <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={!!busy} onClick={() => logoInput.current?.click()}>{v.clientLogo ? 'Đổi logo' : '+ Tải logo'}</button>}
                    {canEdit && v.clientLogo && <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => set('clientLogo', null)}>Bỏ logo</button>}
                  </div>
                )}
                <span className="hint">Logo hiện ở dải “Đơn vị đã tin chọn” — cũng chỉ đăng khi khách đồng ý. Nên dùng PNG nền trong suốt.</span>
              </div>
            </Card>

            <Card title="Các loại cây đã cung cấp">
              <div className="ad-f">
                <textarea className="vx-input" style={{ minHeight: 88 }} value={plants} onChange={(e) => { setPlants(e.target.value); setSaved(false); }}
                  placeholder="Sao đen, Lim xẹt, Muồng hoàng yến, Cỏ lá gừng" aria-label="Các loại cây đã cung cấp" />
                <span className="hint">Cách nhau bằng dấu phẩy, tối đa {MAX_PROJECT_PLANTS} loại.</span>
              </div>
            </Card>
          </div>
        </div>
      </fieldset>
      <div className="ad-sticky" style={{ margin: '0 calc(-1 * var(--space-4))' }}>
        <span className="note">
          {error ? <span className="vx-err" role="alert">{error}</span> : busy || (saved ? 'Đã lưu' : canEdit ? 'Lưu xong trang Đối tác sỉ cập nhật ngay' : 'Bạn chỉ có quyền xem')}
        </span>
        {canEdit && v.id && <button type="button" className="vx-btn vx-btn--ghost" style={{ color: 'var(--danger)' }} disabled={pending} onClick={remove}>Xóa</button>}
        <Link href="/admin/du-an" className="vx-btn vx-btn--outline">{canEdit ? 'Hủy' : 'Quay lại'}</Link>
        {canEdit && <button className="vx-btn vx-btn--primary" disabled={pending || !!busy}>{pending ? 'Đang lưu…' : 'Lưu dự án'}</button>}
      </div>
    </form>
  );
}
