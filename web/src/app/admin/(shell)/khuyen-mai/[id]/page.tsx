import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { VoucherForm, type VoucherFormValue } from '@/components/admin/VoucherForm';
import { requireAccess } from '@/server/auth';
import { getVoucher } from '@/server/vouchers';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await params).id === 'moi' ? 'Tạo mã giảm giá' : 'Sửa mã giảm giá' };
}

const ymd = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '');

const EMPTY: VoucherFormValue = {
  code: '', label: '', kind: 'discount', discountType: 'percent', discountValue: '', maxDiscount: '', minOrder: '',
  usageLimit: '', perCustomerLimit: '1', startsAt: '', endsAt: '', active: true,
};

/** AdminVoucherForm: /admin/khuyen-mai/moi để tạo, /admin/khuyen-mai/<id> để sửa. */
export default async function AdminVoucherPage({ params }: Props) {
  await requireAccess('promotions', 'full');
  const { id } = await params;
  let initial = EMPTY;
  if (id !== 'moi') {
    const num = Number(id);
    const v = Number.isInteger(num) && num > 0 ? await getVoucher(num) : undefined;
    if (!v) notFound();
    initial = {
      id: v.id, code: v.code, label: v.label, kind: v.kind, discountType: v.discountType,
      discountValue: String(v.discountValue), maxDiscount: v.maxDiscount ? String(v.maxDiscount) : '',
      minOrder: v.minOrder ? String(v.minOrder) : '', usageLimit: v.usageLimit ? String(v.usageLimit) : '',
      perCustomerLimit: String(v.perCustomerLimit), startsAt: ymd(v.startsAt), endsAt: ymd(v.endsAt), active: v.active,
    };
  }
  return <VoucherForm key={id} initial={initial} />;
}
