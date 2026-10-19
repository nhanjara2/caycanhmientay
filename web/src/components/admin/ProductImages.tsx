'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { editProductImageAction, replaceProductImageAction, setProductImageAltAction, setProductImageOptionAction, uploadProductImageAction } from '@/app/actions/admin';
import { compressImage, WATERMARK } from '@/lib/compress-image';
import { imageAlt, MAX_IMAGE_ALT, MAX_PRODUCT_IMAGES } from '@/lib/catalog';
import { Select } from '../Select';
import { PRODUCT_ASPECTS, useImageCrop } from './ImageCropper';

/** `option` = số thứ tự quy cách ảnh này thuộc về (vd. hoa màu đỏ); null = ảnh chung. */
export type AdminImage = { id: number; url: string; alt: string; option: number | null };

/** Ảnh sản phẩm: tải lên ngay (không cần bấm Lưu), ảnh đầu tiên là ảnh đại diện.
 *  `options` = quy cách đã lưu — gắn ảnh vào quy cách thì khách chọn quy cách đó là ảnh lớn đổi theo. */
export function ProductImages({ slug, name, initial, canEdit, options = [] }: {
  slug?: string; name: string; initial: AdminImage[]; canEdit: boolean; options?: { idx: number; label: string }[];
}) {
  const router = useRouter();
  const [images, setImages] = useState(initial);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const { crop, cropDialog } = useImageCrop();

  if (!slug) {
    return <span className="hint">Bấm <b>Lưu sản phẩm</b> trước, sau đó tải ảnh lên ở trang sửa.</span>;
  }

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    const list = [...files].slice(0, MAX_PRODUCT_IMAGES - images.length);
    if (list.length < files.length) setError(`Mỗi sản phẩm tối đa ${MAX_PRODUCT_IMAGES} ảnh — đã bỏ bớt ảnh thừa`);
    // gửi lần lượt từng ảnh: mỗi request nhỏ, không vượt giới hạn 4,5MB của Vercel
    for (const [i, f] of list.entries()) {
      // chọn khung cắt cho từng ảnh trước khi tải
      const c = await crop(f, { aspects: PRODUCT_ASPECTS, step: list.length > 1 ? `Ảnh ${i + 1}/${list.length}` : undefined, max: 1600, minSide: 600 });
      if (c === 'cancel') break;
      if (c === 'skip') continue;
      setBusy(`Đang tải ảnh ${i + 1}/${list.length}…`);
      try {
        const fd = new FormData();
        fd.set('slug', slug);
        fd.set('photo', await compressImage(f, 1600, WATERMARK, c));
        const r = await uploadProductImageAction(fd);
        if (!r.ok) { setError(r.error); break; }
        setImages(r.images);
      } catch {
        setError('Không đọc được ảnh này, vui lòng chọn ảnh khác (JPG, PNG, WebP)');
        break;
      }
    }
    setBusy('');
    if (input.current) input.current.value = '';
    router.refresh();
  };

  /** Cắt lại ảnh đã tải: ảnh lưu sẵn đã có chữ ký phủ kín nên không đóng thêm lần nữa. */
  const recrop = async (id: number, url: string) => {
    setError('');
    let blob: Blob;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      blob = await res.blob();
    } catch {
      setError('Không mở được ảnh này, vui lòng tải lại trang');
      return;
    }
    const c = await crop(blob, { aspects: PRODUCT_ASPECTS, max: 1600, minSide: 600, okLabel: 'Lưu ảnh' });
    if (c === 'cancel' || c === 'skip') return;
    setBusy('Đang lưu ảnh…');
    try {
      const fd = new FormData();
      fd.set('slug', slug);
      fd.set('id', String(id));
      fd.set('photo', await compressImage(blob, 1600, undefined, c));
      const r = await replaceProductImageAction(fd);
      if (!r.ok) setError(r.error); else setImages(r.images);
    } catch {
      setError('Có lỗi, vui lòng thử lại');
    }
    setBusy('');
    router.refresh();
  };

  /** Lưu mô tả ảnh khi rời ô (không đổi thì thôi). */
  const saveAlt = async (id: number, alt: string) => {
    if ((images.find((x) => x.id === id)?.alt ?? '') === alt.trim()) return;
    setError('');
    const r = await setProductImageAltAction({ slug, id, alt }).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
    if (!r.ok) return setError(r.error);
    setImages(r.images);
    router.refresh();
  };

  /** Gắn ảnh vào quy cách — lưu ngay. */
  const saveOption = async (id: number, value: string) => {
    setError('');
    const option = value === '' ? null : Number(value);
    const r = await setProductImageOptionAction({ slug, id, option }).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
    if (!r.ok) return setError(r.error);
    setImages(r.images);
    router.refresh();
  };
  const optionLabel = (idx: number | null) => (idx === null ? undefined : options.find((o) => o.idx === idx)?.label);

  const edit = async (id: number, op: 'delete' | 'first' | 'left' | 'right') => {
    if (op === 'delete' && !confirm('Xóa ảnh này?')) return;
    setError('');
    setBusy(op === 'delete' ? 'Đang xóa…' : 'Đang sắp xếp…');
    const r = await editProductImageAction({ slug, id, op }).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
    setBusy('');
    if (!r.ok) return setError(r.error);
    setImages(r.images);
    router.refresh();
  };

  return (
    <>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} />
      <div className="pi-grid">
        {images.map((img, i) => {
          const main = i === 0;
          return (
            <figure key={img.id} className={main ? 'pi-tile pi-tile--main' : 'pi-tile'}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={main ? 'Ảnh chính' : `Ảnh phụ ${i}`} loading="lazy" />
              <span className={main ? 'pi-tag pi-tag--main' : 'pi-tag'}>{main ? '★ Ảnh chính' : `Ảnh phụ ${i}`}</span>
              {optionLabel(img.option) && <span className="pi-tag pi-tag--opt">{optionLabel(img.option)}</span>}
              {canEdit && (
                <figcaption>
                  {!main && <button type="button" className="pi-primary" onClick={() => edit(img.id, 'first')} disabled={!!busy}>★ Làm ảnh chính</button>}
                  <span className="pi-tools">
                    <button type="button" onClick={() => recrop(img.id, img.url)} disabled={!!busy} aria-label="Cắt lại ảnh" title="Cắt lại ảnh">✂</button>
                    {i > 1 && <button type="button" onClick={() => edit(img.id, 'left')} disabled={!!busy} aria-label="Dời sang trái" title="Dời sang trái">‹</button>}
                    {i > 0 && i < images.length - 1 && <button type="button" onClick={() => edit(img.id, 'right')} disabled={!!busy} aria-label="Dời sang phải" title="Dời sang phải">›</button>}
                    <button type="button" onClick={() => edit(img.id, 'delete')} disabled={!!busy} aria-label="Xóa ảnh" title="Xóa ảnh">✕</button>
                  </span>
                </figcaption>
              )}
            </figure>
          );
        })}
        {canEdit && images.length < MAX_PRODUCT_IMAGES && (
          <button type="button" className={images.length ? 'pi-tile pi-tile--add' : 'pi-tile pi-tile--add pi-tile--main'} disabled={!!busy} onClick={() => input.current?.click()}>
            <b>{busy || (images.length ? '+ Thêm ảnh phụ' : '+ Tải ảnh chính')}</b>
            {!busy && <small>{images.length ? 'Chọn được nhiều ảnh' : 'Chọn nhiều ảnh: ảnh đầu làm ảnh chính'}</small>}
          </button>
        )}
      </div>
      {busy && images.length >= MAX_PRODUCT_IMAGES && <span className="hint">{busy}</span>}
      {error && <span className="vx-err" role="alert">{error}</span>}
      {cropDialog}
      {images.length > 0 && options.length > 1 && (
        <div className="pi-alts">
          <b>Ảnh theo quy cách</b>
          <span className="hint">Chọn quy cách cho từng ảnh (vd. ảnh hoa đỏ → “Màu đỏ”). Khách bấm quy cách nào thì ảnh lớn đổi sang ảnh đó. Lưu ngay.</span>
          {images.map((img, i) => (
            <div key={img.id} className="pi-alt">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" loading="lazy" />
              <span>{i === 0 ? 'Ảnh chính' : `Ảnh phụ ${i}`}</span>
              <Select className="vx-input" value={img.option === null ? '' : String(img.option)} disabled={!canEdit || !!busy}
                aria-label={`Quy cách của ${i === 0 ? 'ảnh chính' : `ảnh phụ ${i}`}`} onChange={(e) => saveOption(img.id, e.target.value)}>
                <option value="">Ảnh chung (mọi quy cách)</option>
                {options.map((o) => <option key={o.idx} value={String(o.idx)}>{o.label}</option>)}
                {img.option !== null && !optionLabel(img.option) && <option value={String(img.option)}>(Quy cách đã xóa)</option>}
              </Select>
            </div>
          ))}
        </div>
      )}
      {images.length > 0 && (
        <details className="pi-alts">
          <summary>Mô tả ảnh cho Google ({images.filter((x) => x.alt).length}/{images.length} ảnh đã viết)</summary>
          <span className="hint">Tả đúng thứ có trong ảnh, ngắn gọn (vd. “Chậu kim tiền cao 60cm đặt cạnh cửa sổ”), không liệt kê từ khóa. Để trống thì web dùng tên sản phẩm.</span>
          {images.map((img, i) => (
            <label key={`${img.id}-${img.alt}`} className="pi-alt">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" loading="lazy" />
              <span>{i === 0 ? 'Ảnh chính' : `Ảnh phụ ${i}`}</span>
              <input className="vx-input" defaultValue={img.alt} maxLength={MAX_IMAGE_ALT} disabled={!canEdit}
                placeholder={imageAlt({ name: name || 'Tên sản phẩm' }, i)} onBlur={(e) => saveAlt(img.id, e.target.value)} />
            </label>
          ))}
        </details>
      )}
      <span className="hint">
        {images.length}/{MAX_PRODUCT_IMAGES} ảnh · Chọn nhiều ảnh một lần được, chỉnh khung cắt từng ảnh (✂ để cắt lại ảnh đã tải), ảnh tự thu nhỏ và đóng chữ ký “{WATERMARK}” chống lấy ảnh. <b>Ảnh chính</b> (khung lớn) hiện trên thẻ sản phẩm, giỏ hàng và đầu trang chi tiết; <b>ảnh phụ</b> hiện ở dải ảnh nhỏ bên dưới. Ảnh lưu ngay, không cần bấm Lưu.
      </span>
    </>
  );
}
