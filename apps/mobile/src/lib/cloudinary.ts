// Ảnh gốc từ Cloudinary có thể rất lớn. Chèn phép biến đổi vào URL để tải bản đã cắt/nén:
// c_fill = cắt vừa khung, q_auto/f_auto = tự chọn chất lượng và định dạng nhẹ nhất.
// Ảnh đã biến đổi cũng không mang theo metadata gốc (vd. toạ độ GPS trong EXIF).
export function thumb(url: string, width: number, height: number): string {
  const marker = '/image/upload/';
  const at = url.indexOf(marker);
  if (at === -1) return url;
  const head = url.slice(0, at + marker.length);
  return `${head}c_fill,w_${width},h_${height},q_auto,f_auto/${url.slice(at + marker.length)}`;
}
