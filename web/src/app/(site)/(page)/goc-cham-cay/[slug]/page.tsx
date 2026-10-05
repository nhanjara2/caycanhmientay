import { PostDetail, postMetadata, type PostPageProps } from '@/components/PostDetail';

export const generateMetadata = postMetadata;

/** Bài viết / video Góc chăm cây (soạn ở /admin/noi-dung). */
export default function Page(props: PostPageProps) {
  return <PostDetail section="blog" {...props} />;
}
