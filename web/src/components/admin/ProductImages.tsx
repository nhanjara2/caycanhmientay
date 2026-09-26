'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { editProductImageAction, uploadProductImageAction } from '@/app/actions/admin';
import { compressImage, WATERMARK } from '@/lib/compress-image';
import { MAX_PRODUCT_IMAGES } from '@/lib/catalog';

export type AdminImage = { id: number; url: string };

/** Ảnh sản phẩm: tải lên ngay (không cần bấm Lưu), ảnh đầu tiên là ảnh đại diện. */
export function ProductImages({ slug, initial, canEdit }: { slug?: string; initial: AdminImage[]; canEdit: boolean }) {
  const router = useRouter();
  const [images, setImages] = useState(initial);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

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
      setBusy(`Đang tải ảnh ${i + 1}/${list.length}…`);
      try {
        const fd = new FormData();
        fd.set('slug', slug);
        fd.set('photo', await compressImage(f, 1600, WATERMARK));
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
              {canEdit && (
                <figcaption>
                  {!main && <button type="button" className="pi-primary" onClick={() => edit(img.id, 'first')} disabled={!!busy}>★ Làm ảnh chính</button>}
                  <span className="pi-tools">
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
      <span className="hint">
        {images.length}/{MAX_PRODUCT_IMAGES} ảnh · Chọn nhiều ảnh một lần được, ảnh tự thu nhỏ và đóng chữ ký “{WATERMARK}” chống lấy ảnh. <b>Ảnh chính</b> (khung lớn) hiện trên thẻ sản phẩm, giỏ hàng và đầu trang chi tiết; <b>ảnh phụ</b> hiện ở dải ảnh nhỏ bên dưới. Ảnh lưu ngay, không cần bấm Lưu.
      </span>
    </>
  );
}
