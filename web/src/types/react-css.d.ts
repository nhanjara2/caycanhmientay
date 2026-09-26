// Cho phép biến CSS (--cols, …) trong style={{ }} — dùng trong các view sinh tự động.
import 'react';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
