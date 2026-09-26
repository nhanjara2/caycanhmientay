# Cây Cảnh Miền Tây

Nguồn của website bán cây cảnh, thuốc BVTV, phân bón và vật tư làm vườn.

Design system lấy về từ artifact **Cây Cảnh Miền Tây** (namespace `VuonXanh`). Giao diện **chỉ có tông sáng**.

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| [design-system/BRANDBOOK.md](design-system/BRANDBOOK.md) | Sổ tay thương hiệu: nguyên tắc, giọng văn, bố cục từng trang, mobile, admin |
| [design-system/COMPONENTS.md](design-system/COMPONENTS.md) | Chỉ mục 148 component theo 22 nhóm (sinh tự động) |
| [design-system/tokens.json](design-system/tokens.json) | Nguồn của token: 20 màu, 10 kiểu chữ, spacing, radius, shadow |
| [design-system/tokens.css](design-system/tokens.css) | Sinh từ `tokens.json` — **không sửa tay** |
| [design-system/components.css](design-system/components.css) | 363 class `.vx-*` / `.ad-*` / `.m-*` dùng chung |
| `design-system/components/<Tên>/preview.html` | Markup mẫu (147 file) |
| `design-system/components/<Tên>/README.md` | Quy tắc dùng component đó (147 file) |

## Lệnh

```bash
node tools/build-tokens.mjs   # tokens.json  -> design-system/tokens.css
node tools/build-index.mjs    # components/* -> design-system/COMPONENTS.md
node tools/preview.mjs        # http://localhost:4321 — duyệt toàn bộ component
```

## Quy ước

- **Chỉ giao diện sáng.** `tokens.css` khai báo `color-scheme: light`; không làm theme tối.
- Chữ: **Be Vietnam Pro** (Google Fonts) 400/500/600/700. Nội dung 14px, giá 18px/700.
- Màu: `primary` cho mọi hành động mua và điều hướng · `sale` chỉ cho giảm giá · `sun` chỉ cho Flash sale.
- Mọi giá kèm đơn vị: "/ Chậu", "/ Chai", "/ Bao".
- Thuốc BVTV: bắt buộc số đăng ký, hoạt chất, liều pha, thời gian cách ly và hộp lưu ý an toàn.

Chi tiết xem [design-system/BRANDBOOK.md](design-system/BRANDBOOK.md).
