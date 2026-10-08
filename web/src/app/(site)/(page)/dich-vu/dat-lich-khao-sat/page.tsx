import type { Metadata } from 'next';
import { QuoteForm } from '@/components/QuoteForm';
import { serviceFromParam } from '@/lib/service-labels';
import { listAddresses } from '@/server/addresses';
import { accountPhone, getCurrentUser } from '@/server/auth';
import { surveySlots } from '@/server/service-requests';

export const metadata: Metadata = {
  title: 'Đặt lịch khảo sát & báo giá',
  description: 'Khảo sát miễn phí sân vườn, ban công, cây văn phòng, chăm sóc định kỳ và chữa cây tại nhà. Kỹ sư gọi xác nhận trong 2 giờ làm việc.',
};

type Props = { searchParams: Promise<{ loai?: string; 'phuong-an'?: string; 'uoc-tinh'?: string }> };

const WHY: [React.ReactNode, string][] = [
  [<path key="p" d="M4 20h4L19 9l-4-4L4 16z" />, 'Phối cảnh 3D không gian'],
  [<><path d="M6 3h9l4 4v14H6z" /><path d="M9 12h7M9 16h7" /></>, 'Bảng vật tư, cây và chi phí chi tiết'],
  [<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>, 'Tiến độ thi công dự kiến'],
  [<><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></>, 'Chính sách bảo hành cây 30 ngày'],
];

/** QuoteRequestForm: form bên trái (điền sẵn nếu đã đăng nhập, ?loai= chọn sẵn dịch vụ), cam kết bên phải. */
export default async function Page({ searchParams }: Props) {
  const [{ loai, 'phuong-an': fromAdvisor, 'uoc-tinh': fromRental }, user, slots] = await Promise.all([searchParams, getCurrentUser(), surveySlots()]);
  const addr = user ? (await listAddresses(user.id))[0] : undefined;

  return (
    <div className="qf">
      <QuoteForm
        slots={slots}
        fromAdvisor={fromAdvisor === '1'}
        fromRental={fromRental === '1'}
        defaults={{
          service: serviceFromParam(loai),
          name: user?.name ?? '',
          phone: (user && accountPhone(user)) ?? '',
          address: addr ? `${addr.street}, ${addr.area}` : '',
        }}
      />
      <aside className="qf-side">
        <div className="ar-cta">
          <b>Khảo sát miễn phí</b>
          <span>Kỹ sư gọi xác nhận trong 2 giờ làm việc. Báo giá gửi qua Zalo sau 48 giờ kể từ khảo sát.</span>
        </div>
        <div className="nw-box">
          <h3>Bạn sẽ nhận được</h3>
          <div className="au-why" style={{ fontSize: '0.8125rem' }}>
            {WHY.map(([icon, text]) => (
              <div key={text}><svg className="vx-ico" viewBox="0 0 24 24" aria-hidden="true">{icon}</svg>{text}</div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
