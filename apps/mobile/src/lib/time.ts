// "3 ngày trước", "vừa xong"... cho thời điểm đánh giá.
export function timeAgo(iso: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'vừa xong';
  const units: [number, string][] = [
    [60, 'phút'],
    [60 * 60, 'giờ'],
    [60 * 60 * 24, 'ngày'],
    [60 * 60 * 24 * 30, 'tháng'],
    [60 * 60 * 24 * 365, 'năm'],
  ];
  // Chọn đơn vị lớn nhất mà khoảng thời gian còn >= 1 đơn vị đó.
  let label = 'phút';
  let size = 60;
  for (const [s, name] of units) {
    if (seconds >= s) {
      size = s;
      label = name;
    }
  }
  return `${Math.floor(seconds / size)} ${label} trước`;
}
