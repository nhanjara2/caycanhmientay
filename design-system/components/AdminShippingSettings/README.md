# AdminShippingSettings
**Cài đặt giao hàng**:

- **Bản đồ vùng giao** vẽ theo đa giác: Vùng 1 nội thành (giao cây trong ngày, `primary`), Vùng 2 ngoại thành (`sun`, nét đứt), Vùng 3 tỉnh lân cận (chỉ giao vật tư qua hãng vận chuyển); chấm là cửa hàng/vườn xuất hàng.
- **Bảng phí theo vùng**: phí cây sống và vật tư, thời gian, **ngưỡng miễn phí giao** riêng cho từng loại; phụ phí cây lớn (cần xe tải).
- **Khung giờ × ngày** với **số đơn tối đa** mỗi ô (ô cao điểm `primary` đặc, ô nghỉ xám); đủ đơn thì khung tự hiện "Đã kín" ở thanh toán. Mục riêng cho **ngày lễ, Tết** (dùng cho lịch giao ở CampaignLayout).
- Dữ liệu này cấp cho MapPicker ("trong vùng giao cây sống"), CheckoutForm (khung giờ), OrderSummary (phí) và AdminDelivery.
