# Cắt ảnh có cây nằm giữa thành ô banner 12:5 (xuất 1200×500) với cây dời sang phải, chừa bên trái cho chữ
# (ô nhỏ trang chủ: tiêu đề + nút nằm bên trái). Bên phải cắt bớt EXT px, bên trái thiếu ảnh nên nối thêm EXT px, có 2 cách:
#   - soi gương (không có FILL): lấy dải MIR px sát mép trái ảnh gốc, soi gương rồi kéo giãn ra EXT px — hợp nền mờ trơn;
#   - lấp bằng dải bên phải cây (có FILL): lấy dải từ cột FILL tới mép phải ảnh gốc (cùng hàng nên cùng độ sâu, độ mờ),
#     kéo giãn ra EXT px, hòa dần vào mép trái ảnh thật trên MIR px — hợp nền có vân chéo (đất luống) vì soi gương sẽ ra hình chữ V.
# Phần nối được làm mờ BLUR px từ SOIL (y trên ảnh gốc; 0 = cả chiều cao) trở xuống để chi tiết nét không lộ là bản sao.
# Dùng: python3 banner-doi-cay.py <ảnh gốc> <file ra .webp> EXT MIR Y0 W SOIL BLUR [FILL [x,y,r]]
#   (cần Python + Pillow; chạy tay khi đổi ảnh, không nằm trong build)
#   Cây giống.jpg -> public/images/banner/bao-gia-si.webp   : 330 250 240 1200 652 6
#   giong hoa.jpg -> public/images/banner/tra-benh-cay.webp : 456 90 471 1150 0 3 505 213,325,20
import sys
from PIL import Image, ImageOps, ImageFilter, ImageDraw
src, out = sys.argv[1], sys.argv[2]
EXT, MIR, Y0, W, SOIL, BLUR = (int(v) for v in sys.argv[3:9])
FILL = int(sys.argv[9]) if len(sys.argv) > 9 else 0
HEAL = [int(v) for v in sys.argv[10].split(',')] if len(sys.argv) > 10 else None  # x,y,r: đốm sáng cần xóa trong phần nối
H = round(W * 5 / 12)
im = Image.open(src).convert('RGB')
canvas = Image.new('RGB', (W, H))
if FILL:
    canvas.paste(im.crop((FILL, Y0, im.width, Y0 + H)).resize((EXT, H), Image.LANCZOS), (0, 0))
    edge = ImageOps.mirror(im.crop((0, Y0, MIR, Y0 + H)))  # mép trái ảnh thật soi gương, chỉ để hòa dần ngay chỗ nối
    ramp = Image.new('L', (MIR, H))
    for x in range(MIR):
        t = x / (MIR - 1); ImageDraw.Draw(ramp).line([(x, 0), (x, H)], fill=round(255 * t * t * (3 - 2 * t)))
    canvas.paste(edge, (EXT - MIR, 0), ramp)
else:
    canvas.paste(ImageOps.mirror(im.crop((0, Y0, MIR, Y0 + H))).resize((EXT, H), Image.LANCZOS), (0, 0))
canvas.paste(im.crop((0, Y0, W - EXT, Y0 + H)), (EXT, 0))
mask = Image.new('L', (W, H), 0)
ImageDraw.Draw(mask).rectangle((0, max(0, SOIL - Y0), EXT - 22, H), fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(14))  # mép vùng làm mờ chuyển dần, không lộ đường ranh
canvas = Image.composite(canvas.filter(ImageFilter.GaussianBlur(BLUR)), canvas, mask)
if HEAL:
    x, y, r = HEAL; box = (x - 3 * r, y - 3 * r, x + 3 * r, y + 3 * r)
    spot = Image.new('L', (6 * r, 6 * r), 0); ImageDraw.Draw(spot).ellipse((2 * r, 2 * r, 4 * r, 4 * r), fill=255)
    canvas.paste(canvas.crop(box).filter(ImageFilter.MedianFilter(4 * r + 1)), box[:2], spot.filter(ImageFilter.GaussianBlur(r / 2)))
if W != 1200: canvas = canvas.resize((1200, 500), Image.LANCZOS)
canvas.save(out, 'WEBP', quality=84, method=6)
print(out, canvas.size)
