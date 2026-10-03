// Chuẩn hoá chuỗi để tìm kiếm không dấu: "Cà Phê Thủ Đức" -> "ca phe thu duc".
// Dùng cho cột Place.searchName và cho chuỗi người dùng gõ vào ô tìm kiếm.
export function toSearchText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
