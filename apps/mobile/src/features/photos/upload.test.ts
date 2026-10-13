import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// File của expo-file-system là module native => dùng bản giả có bytes() như bản thật.
class FakeFile {
  constructor(readonly uri: string) {}
  async bytes() {
    return new Uint8Array([1, 2, 3]);
  }
}
vi.mock('expo-file-system', () => ({ File: FakeFile }));
vi.mock('expo-secure-store', () => ({ getItemAsync: async () => null }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { hostUri: 'test:8081' } } }));

// FormData giả ghi lại các phần đã append để kiểm tra (FormData của Node ép object thành chuỗi).
class RecordingFormData {
  parts: [string, unknown][] = [];
  append(name: string, value: unknown) {
    this.parts.push([name, value]);
  }
}

const signature = {
  cloudName: 'demo',
  apiKey: 'key123',
  folder: 'vibespot/places',
  timestamp: 1700000000,
  signature: 'sig456',
};

let calls: { url: string; body: unknown }[];

beforeEach(() => {
  calls = [];
  vi.stubGlobal('FormData', RecordingFormData);
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: { body?: unknown }) => {
      calls.push({ url, body: init?.body });
      if (url.includes('/uploads/signature')) {
        return new Response(JSON.stringify(signature), { status: 200 });
      }
      return new Response(
        JSON.stringify({ secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/vibespot/places/a.jpg', public_id: 'vibespot/places/a' }),
        { status: 200 },
      );
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe('uploadImage', () => {
  it('gửi file dạng File (có bytes) cùng đúng các trường đã ký tới Cloudinary', async () => {
    const { uploadImage } = await import('./upload');
    const result = await uploadImage('file:///photo.jpg');

    expect(result).toEqual({
      url: 'https://res.cloudinary.com/demo/image/upload/v1/vibespot/places/a.jpg',
      publicId: 'vibespot/places/a',
    });

    const upload = calls.find((c) => c.url.includes('api.cloudinary.com'))!;
    expect(upload.url).toBe('https://api.cloudinary.com/v1_1/demo/image/upload');

    const parts = new Map((upload.body as RecordingFormData).parts);
    // Phần file phải có bytes() thì fetch của Expo mới chấp nhận.
    expect(typeof (parts.get('file') as FakeFile).bytes).toBe('function');
    expect((parts.get('file') as FakeFile).uri).toBe('file:///photo.jpg');
    expect(parts.get('api_key')).toBe('key123');
    expect(parts.get('timestamp')).toBe('1700000000');
    expect(parts.get('folder')).toBe('vibespot/places');
    expect(parts.get('signature')).toBe('sig456');
  });

  it('ném lỗi kèm thông báo của Cloudinary khi upload thất bại', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('/uploads/signature')
          ? new Response(JSON.stringify(signature), { status: 200 })
          : new Response(JSON.stringify({ error: { message: 'Invalid Signature' } }), { status: 401 }),
      ),
    );
    const { uploadImage } = await import('./upload');
    await expect(uploadImage('file:///photo.jpg')).rejects.toThrow('Invalid Signature');
  });
});
