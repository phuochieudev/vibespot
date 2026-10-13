// Chuyển thuộc tính thô (JSONB) của quán thành các nhãn hiển thị cho người dùng.
const OUTLETS: Record<string, string> = {
  NONE: 'Không có ổ cắm',
  FEW: 'Ít ổ cắm',
  SOME: 'Vừa đủ ổ cắm',
  MANY: 'Nhiều ổ cắm',
};
const NOISE: Record<string, string> = {
  QUIET: 'Yên tĩnh',
  MODERATE: 'Ồn vừa phải',
  LOUD: 'Khá ồn',
};

export function describeAttributes(attrs: Record<string, unknown>): string[] {
  const out: string[] = [];
  if (typeof attrs.wifiMbps === 'number') out.push(`Wifi ${Math.round(attrs.wifiMbps)} Mbps`);
  else if (attrs.hasWifi === true) out.push('Có wifi');
  if (attrs.airConditioned === true) out.push('Máy lạnh');
  if (attrs.openLate === true) out.push('Mở khuya');
  if (attrs.freeParking === true) out.push('Giữ xe miễn phí');
  if (typeof attrs.outlets === 'string' && OUTLETS[attrs.outlets])
    out.push(OUTLETS[attrs.outlets]!);
  if (typeof attrs.noise === 'string' && NOISE[attrs.noise]) out.push(NOISE[attrs.noise]!);
  if (typeof attrs.avgPriceVnd === 'number') {
    out.push(`~${attrs.avgPriceVnd.toLocaleString('vi-VN')}đ/ly`);
  }
  return out;
}
