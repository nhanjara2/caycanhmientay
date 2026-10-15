import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Blocks';
import { EmptyPosts } from '@/components/PostParts';
import { ShortVideos } from '@/components/ShortVideos';
import { TIKTOK_NAME, TIKTOK_URL, YOUTUBE_URL } from '@/lib/contact';
import { CATEGORIES, isCategory, SECTIONS, VIDEO_PAGE } from '@/lib/posts';
import { publishedVideos } from '@/server/posts';

type SP = { 'chuyen-muc'?: string; v?: string };
type Props = { searchParams: Promise<SP> };

const DESCRIPTION = 'Video ngắn từ vườn Cây Cảnh Miền Tây: cây thật tại vườn, mẹo chăm cây, bắt bệnh, dùng thuốc và phân bón đúng cách.';

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { v } = await searchParams;
  // Link chia sẻ /video?v=… : xem trước trên Zalo / Facebook hiện đúng tên + ảnh của video đó.
  const shared = v ? (await publishedVideos()).find((x) => x.slug === v) : undefined;
  if (shared) {
    return {
      title: shared.title, description: DESCRIPTION, alternates: { canonical: shared.href },
      openGraph: { type: 'video.other', title: shared.title, description: DESCRIPTION, images: shared.thumb ? [shared.thumb] : undefined },
    };
  }
  return { title: 'Video ngắn', description: DESCRIPTION, alternates: { canonical: VIDEO_PAGE } };
}

/** Video ngắn: mọi video đã đăng ở /admin/noi-dung (thêm nhanh bằng link YouTube Shorts), bấm là xem ngay. */
export default async function VideoPage({ searchParams }: Props) {
  const sp = await searchParams;
  const all = await publishedVideos();
  const cat = isCategory(sp['chuyen-muc']) ? sp['chuyen-muc'] : undefined;
  const shown = cat ? all.filter((x) => x.category === cat) : all;
  const used = new Set(all.map((x) => x.category));
  const chips = CATEGORIES.filter((c) => used.has(c.key));

  return (
    <div className="shv-page">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Video ngắn' }]} />
      <header className="shv-head">
        <h1>Video ngắn</h1>
        {chips.length > 1 && (
          <nav className="shv-chips" aria-label="Chủ đề">
            <Link href={VIDEO_PAGE} className="vx-chip" aria-pressed={!cat}>Tất cả ({all.length})</Link>
            {chips.map((c) => (
              <Link key={c.key} href={`${VIDEO_PAGE}?chuyen-muc=${c.key}`} className="vx-chip" aria-pressed={cat === c.key}>
                {c.name} ({all.filter((x) => x.category === c.key).length})
              </Link>
            ))}
          </nav>
        )}
      </header>

      {shown.length > 0 ? (
        <ShortVideos videos={shown} layout="grid" openSlug={sp.v} />
      ) : (
        <EmptyPosts text="Video đang được cập nhật" hint={<>Trong lúc chờ, mời xem <Link href={SECTIONS.blog.path}>Góc chăm cây</Link> hoặc <Link href="/benh-cay">thư viện bệnh cây</Link>.</>} />
      )}

      <p className="shv-more">
        Xem thêm trên <a href={YOUTUBE_URL} target="_blank" rel="noreferrer">kênh YouTube Cây Cảnh Miền Tây</a>
        {' '}và <a href={TIKTOK_URL} target="_blank" rel="noreferrer">TikTok @{TIKTOK_NAME}</a>
      </p>
    </div>
  );
}
