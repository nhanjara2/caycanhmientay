import Link from '@/components/LocaleLink';
import { ADVISOR_URL, KINDS, SPACE_KINDS } from '@/lib/plant-advisor';
import { Icon } from './Icon';

/** Dải mời dùng Tư vấn chọn cây ở đầu trang danh mục Cây cảnh; đang ở nhóm con nào (Cây ban công…) thì mở sẵn loại đó. */
export function AdvisorBanner({ sub }: { sub?: string }) {
  const kind = SPACE_KINDS.find((k) => KINDS[k].sub === sub);
  return (
    <Link href={kind ? `${ADVISOR_URL}?loai=${kind}` : ADVISOR_URL} className="pa-banner">
      <span className="pa-banner__ic"><Icon name="sprout" /></span>
      <span className="pa-banner__t">
        <b>Chưa biết chọn cây nào{kind ? ` cho ${KINDS[kind].name.replace(/^Cây /, '')}` : ''}?</b>
        Trả lời vài câu hỏi để biết nên trồng cây gì, bao nhiêu cây, cao bao nhiêu cho từng vị trí.
      </span>
      <span className="pa-banner__go">Tư vấn chọn cây<Icon name="chevron" size={16} /></span>
    </Link>
  );
}
