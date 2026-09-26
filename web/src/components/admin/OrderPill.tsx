import { STATUS_LABEL, type Status } from '@/lib/order-labels';

const PILL: Record<Status, string> = {
  pending: 'new', confirmed: 'prep', preparing: 'prep', shipping: 'ship', delivered: 'done', cancelled: 'cancel',
};

export function OrderPill({ status, style }: { status: Status; style?: React.CSSProperties }) {
  return <span className={`ad-pill ${PILL[status]}`} style={style}>{STATUS_LABEL[status]}</span>;
}
