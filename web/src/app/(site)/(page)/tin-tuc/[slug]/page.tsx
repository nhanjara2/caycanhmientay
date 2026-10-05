import { PostDetail, postMetadata, type PostPageProps } from '@/components/PostDetail';

export const generateMetadata = postMetadata;

/** Bài Truyền thông (tin tức, cộng đồng, báo chí, tuyển dụng) — soạn ở /admin/noi-dung. */
export default function Page(props: PostPageProps) {
  return <PostDetail section="news" {...props} />;
}
