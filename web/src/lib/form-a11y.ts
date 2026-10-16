/**
 * Báo lỗi ô nhập cho trình đọc màn hình (mục 12 checklist SEO): ô lỗi có `aria-invalid` + `aria-describedby` trỏ tới câu báo lỗi
 * (câu đó mang `id = <id ô>-err`); bấm Gửi mà còn lỗi thì focus ô lỗi đầu tiên.
 */
export const errId = (id: string) => `${id}-err`;

/** Gắn vào ô nhập: `<input id="co-name" {...invalidProps('co-name', touched && errors.name)} />`. */
export function invalidProps(id: string, error: unknown) {
  return error ? { 'aria-invalid': true as const, 'aria-describedby': errId(id) } : {};
}

/** Sau khi hiện lỗi (chờ React vẽ xong): focus ô lỗi đầu tiên, không có thì câu báo lỗi đầu tiên. */
export function focusFirstError(root: HTMLElement | null) {
  requestAnimationFrame(() => {
    const el = root?.querySelector<HTMLElement>('[aria-invalid="true"], .vx-err');
    if (!el) return;
    if (!el.matches('input, textarea, select, button, [tabindex]')) el.tabIndex = -1;
    el.focus();
  });
}
