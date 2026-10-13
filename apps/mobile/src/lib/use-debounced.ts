import { useEffect, useState } from 'react';

// Trả về giá trị sau khi người dùng ngừng thay đổi `ms` mili-giây (tránh gọi API mỗi phím gõ).
export function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}
