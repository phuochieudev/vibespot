import { Alert } from 'react-native';

// Một số mục trong thiết kế chưa có backend (đăng nhập Google/Apple, quên mật khẩu qua email, cài đặt...).
// Hiện thông báo rõ ràng thay vì để nút bấm không phản hồi.
export function comingSoon(feature: string) {
  Alert.alert('Sắp ra mắt', `${feature} đang được phát triển.`);
}
