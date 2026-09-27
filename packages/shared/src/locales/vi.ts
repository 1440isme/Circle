/**
 * CIRCLE — Vietnamese Locale Dictionary (vi)
 */

export const vi = {
  common: {
    appName: 'CIRCLE',
    slogan: 'Nền tảng Kết nối & Tương tác Nhóm Thân mật',
    searchPlaceholder: 'Tìm kiếm tin nhắn, ảnh kỷ niệm, lịch hẹn...',
    loading: 'Đang tải...',
    save: 'Lưu',
    cancel: 'Hủy',
    language: 'Ngôn ngữ',
    vietnamese: 'Tiếng Việt',
    english: 'English',
    connecting: 'Đang kết nối CIRCLE...',
    copyright: '© 2026 CIRCLE — Đề tài Tốt nghiệp Kỹ sư CNTT (Trương Công Bình & Ninh Thị Mỹ Hạnh).',
    communityStandards: 'Tiêu chuẩn cộng đồng',
    privacyPolicy: 'Chính sách bảo mật',
    dualTokenSecurity: 'Bảo mật kép Dual-Token & Mã hóa bcrypt',
  },
  auth: {
    login: 'Đăng nhập',
    register: 'Đăng ký',
    logout: 'Đăng xuất',
    welcomeBack: 'Chào mừng trở lại',
    loginSubtitle: 'Đăng nhập để vào không gian kết nối và trò chuyện nhóm thân mật.',
    createAccount: 'Tạo tài khoản CIRCLE',
    registerSubtitle: 'Mở ra không gian riêng tư, ấm cúng và an toàn cùng bạn bè thân thiết.',
    email: 'Địa chỉ Email',
    emailPlaceholder: 'tenban@domain.com',
    password: 'Mật khẩu',
    passwordPlaceholder: 'Nhập mật khẩu an toàn',
    confirmPassword: 'Xác nhận mật khẩu',
    confirmPasswordPlaceholder: 'Nhập lại mật khẩu',
    displayName: 'Họ tên hoặc Biệt danh',
    displayNamePlaceholder: 'VD: Trương Công Bình',
    rememberMe: 'Duy trì trạng thái đăng nhập trên thiết bị này (7 ngày)',
    forgotPassword: 'Quên mật khẩu?',
    forgotPasswordNotice: 'Vui lòng liên hệ quản trị viên để khôi phục mật khẩu trong giai đoạn thử nghiệm.',
    noAccount: 'Chưa có tài khoản CIRCLE?',
    hasAccount: 'Đã có tài khoản CIRCLE?',
    signUpNow: 'Đăng ký tham gia ngay',
    signInHere: 'Đăng nhập tại đây',
    authenticating: 'Đang xác thực...',
    creatingAccount: 'Đang khởi tạo tài khoản...',
    termsAgreement: 'Tôi cam kết tuân thủ Quy chuẩn Cộng đồng và tôn trọng không gian an toàn tâm lý của các nhóm bạn CIRCLE.',
    termsRequiredError: 'Bạn cần đồng ý với Quy chuẩn Cộng đồng của CIRCLE để tiếp tục',
    min8Chars: 'Tối thiểu 8 ký tự',
    passwordMatch: 'Mật khẩu trùng khớp',
    passwordMismatch: 'Mật khẩu chưa khớp',
    userBadge: 'Xác thực người dùng',
    communityBadge: 'Gia nhập cộng đồng',
    profile: 'Hồ sơ cá nhân',
    member: 'Thành viên',
    admin: 'Quản trị viên',
    guest: 'Khách',
    loginFailed: 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.',
    registerFailed: 'Đăng ký không thành công. Vui lòng thử lại sau.',
  },
  validation: {
    emailRequired: 'Email không được để trống',
    emailInvalid: 'Địa chỉ email không đúng định dạng',
    passwordRequired: 'Mật khẩu không được để trống',
    passwordMinLength: 'Mật khẩu phải có tối thiểu 8 ký tự',
    confirmPasswordRequired: 'Vui lòng xác nhận mật khẩu',
    passwordMismatch: 'Mật khẩu xác nhận không trùng khớp',
    displayNameRequired: 'Vui lòng nhập tên hiển thị của bạn',
    displayNameMinLength: 'Tên hiển thị phải có ít nhất 2 ký tự',
    displayNameMaxLength: 'Tên hiển thị không được vượt quá 50 ký tự',
  },
  nav: {
    activeCircle: 'Kỷ Niệm Mùa Thu 🍂',
    notifications: 'Thông báo nhóm',
    reflectionCard: 'Điều muốn nói',
    accountInfo: 'Thông tin tài khoản',
  },
};

type DeepRecord<T> = {
  [K in keyof T]: T[K] extends Record<string, any> ? DeepRecord<T[K]> : string;
};

export type TranslationDictionary = DeepRecord<typeof vi>;
