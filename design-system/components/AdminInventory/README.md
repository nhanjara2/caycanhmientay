# AdminInventory
Tồn kho theo từng kho/cửa hàng.

- 4 KpiCard: giá trị tồn, **dưới mức tối thiểu**, **thuốc/phân sắp hết hạn**, **cây tồn quá 30 ngày** (cây sống xuống sắc theo thời gian, nên bán hoặc giảm giá sớm).
- Bảng: mỗi kho một cột có số + thanh mức tồn (`primary` đủ, `sale` thấp, `danger` hết); cột **Lô / hạn dùng** cho thuốc, phân; cây lớn ghi số cây có ảnh riêng.
- Thao tác: Nhập hàng, Chuyển kho, **Kiểm kê** (quét mã vạch bằng app kho).
- Quy tắc: thuốc BVTV xuất theo **hạn dùng gần nhất trước**; hết hạn thì tự khóa bán. Cây lớn (≥ size L) quản lý **theo từng cây** có mã, ảnh, vị trí trong vườn — khách mua cây nào giao đúng cây đó.
