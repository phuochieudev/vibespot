import { CloudinaryService, PHOTO_FOLDER, signParams } from './cloudinary.service.js';

describe('signParams', () => {
  // Ví dụ trong tài liệu Cloudinary (api_secret "abcd"). Giá trị này là kết quả tính được,
  // dùng để phát hiện thay đổi vô ý; độ đúng với Cloudinary được kiểm chứng bằng upload thật.
  const params = {
    eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop',
    public_id: 'sample_image',
    timestamp: 1315060510,
  };

  it('cho kết quả cố định với cùng đầu vào', () => {
    expect(signParams(params, 'abcd')).toBe('bfd09f95f331f558cbd1320e67aa8d488770583e');
  });

  it('không phụ thuộc thứ tự khai báo tham số', () => {
    const reversed = { timestamp: 1315060510, public_id: 'sample_image', eager: params.eager };
    expect(signParams(reversed, 'abcd')).toBe(signParams(params, 'abcd'));
  });

  it('đổi secret hoặc tham số thì chữ ký đổi', () => {
    const base = signParams(params, 'abcd');
    expect(signParams(params, 'abce')).not.toBe(base);
    expect(signParams({ ...params, timestamp: 1 }, 'abcd')).not.toBe(base);
  });
});

describe('CloudinaryService.owns', () => {
  const config = { get: (k: string) => (k === 'CLOUD_NAME' ? 'demo' : undefined) };
  const svc = new CloudinaryService(config as never);
  const id = `${PHOTO_FOLDER}/abc123`;

  it('chấp nhận ảnh trong tài khoản và thư mục của mình', () => {
    expect(svc.owns(`https://res.cloudinary.com/demo/image/upload/v1/${id}.jpg`, id)).toBe(true);
  });

  it('từ chối ảnh của tài khoản khác, thư mục khác, hoặc domain khác', () => {
    expect(svc.owns(`https://res.cloudinary.com/other/image/upload/v1/${id}.jpg`, id)).toBe(false);
    expect(
      svc.owns('https://res.cloudinary.com/demo/image/upload/v1/evil/abc.jpg', 'evil/abc'),
    ).toBe(false);
    expect(svc.owns(`https://evil.com/demo/image/upload/v1/${id}.jpg`, id)).toBe(false);
  });

  it('từ chối khi publicId không khớp URL', () => {
    expect(
      svc.owns(`https://res.cloudinary.com/demo/image/upload/v1/${id}.jpg`, `${PHOTO_FOLDER}/zzz`),
    ).toBe(false);
  });
});
