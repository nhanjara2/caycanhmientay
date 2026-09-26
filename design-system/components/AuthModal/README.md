# AuthModal
Hộp **Đăng nhập / Đăng ký** gộp làm một (không tách 2 trang), mở từ "Đăng nhập" trên Header, khi thêm vào giỏ lần đầu, hoặc khi bấm Nhận ưu đãi. Rộng 400px; mobile là màn toàn màn hình (MobileAuth).

**Bước 1 – Chọn cách đăng nhập:** logo, tiêu đề, lợi ích (tặng voucher, tích điểm) → **Số điện thoại** (cách chính, vì SĐT cần cho giao hàng và tra cứu đơn tại cửa hàng) → "hoặc" → **Tiếp tục với Google** · Zalo · Apple → điều khoản.

**Bước 2 – OTP:** 6 ô số, ô đang nhập viền `primary` + quầng; gửi **qua Zalo trước, SMS dự phòng** (rẻ hơn, tỉ lệ nhận cao hơn); đếm ngược gửi lại; tự điền khi mã đến trên điện thoại.

**Bước 3 – Đăng nhập Google lần đầu:** hiện tài khoản Google đã xác thực (tên, email) → giải thích **vì sao cần SĐT** (shipper gọi, bảo hành tại cửa hàng, nhắc chăm cây qua Zalo) → nhập SĐT + OTP. Cho phép "Để sau", nhưng sẽ hỏi lại ở bước thanh toán.

**Bước 4 – SĐT đã có tài khoản:** không tạo tài khoản trùng; đề nghị **liên kết** Google vào tài khoản cũ sau khi xác thực OTP, giữ nguyên đơn, điểm, bảo hành.

Quy tắc: tài khoản định danh bằng **SĐT đã xác thực**; Google/Zalo/Apple là cách đăng nhập gắn vào tài khoản đó. Email Google dùng để gửi hóa đơn và tin, khách tắt được.
