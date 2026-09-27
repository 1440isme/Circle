import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<number>('SMTP_PORT', 587));
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    this.fromAddress =
      this.configService.get<string>('SMTP_FROM') || 'CIRCLE <no-reply@circle.local>';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP Mailer initialized using host: ${host}:${port}`);
    } else {
      // In development / local testing without SMTP server: log to console safely
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
      this.logger.log(
        'SMTP credentials not set. Initialized local Stream Mailer (emails logged to terminal).',
      );
    }
  }

  /**
   * Generates a branded Circle HTML email template.
   */
  private renderEmailTemplate(options: {
    title: string;
    greeting: string;
    message: string;
    otp: string;
    footerNote: string;
  }): string {
    const { title, greeting, message, otp, footerNote } = options;

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F7FAF8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #24332C;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #F7FAF8;
      padding: 40px 16px;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 24px;
      border: 1px solid #E5ECE8;
      overflow: hidden;
      box-shadow: 0 4px 16px -2px rgba(36, 51, 44, 0.05);
    }
    .header {
      padding: 32px 32px 16px;
      text-align: center;
    }
    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background-color: #DDF3E8;
      color: #4FA982;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #24332C;
      margin: 20px 0 8px;
    }
    .content {
      padding: 0 32px 32px;
      line-height: 1.6;
      font-size: 15px;
      color: #485A52;
    }
    .otp-box {
      margin: 28px 0;
      background-color: #F7FAF8;
      border: 1.5px dashed #78C6A3;
      border-radius: 18px;
      padding: 24px;
      text-align: center;
    }
    .otp-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #24332C;
      margin: 0;
      display: inline-block;
    }
    .otp-hint {
      font-size: 13px;
      color: #718078;
      margin-top: 8px;
    }
    .footer {
      border-top: 1px solid #E5ECE8;
      padding: 20px 32px;
      background-color: #FAFDFB;
      font-size: 12px;
      color: #8C9C94;
      text-align: center;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand-pill">
          <span>● CIRCLE</span>
        </div>
        <h1 class="title">${title}</h1>
      </div>
      <div class="content">
        <p>${greeting}</p>
        <p>${message}</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="otp-hint">Mã có hiệu lực trong 5 phút. Tuyệt đối không chia sẻ mã này.</div>
        </div>
        <p style="font-size: 13px; color: #718078;">${footerNote}</p>
      </div>
      <div class="footer">
        © 2026 CIRCLE — Nền tảng kết nối nhóm thân mật.<br>
        Email này được gửi tự động, vui lòng không phản hồi trực tiếp.
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Sends 6-digit OTP email to verify account registration.
   */
  async sendOtpVerification(email: string, otp: string, displayName?: string): Promise<boolean> {
    const greeting = displayName ? `Xin chào <strong>${displayName}</strong>,` : 'Xin chào bạn,';
    const html = this.renderEmailTemplate({
      title: 'Kích hoạt tài khoản CIRCLE',
      greeting,
      message:
        'Cảm ơn bạn đã đăng ký tham gia CIRCLE. Vui lòng nhập mã xác thực gồm 6 chữ số dưới đây để kích hoạt tài khoản của bạn:',
      otp,
      footerNote:
        'Nếu bạn không thực hiện đăng ký tài khoản trên CIRCLE, vui lòng bỏ qua email này một cách an toàn.',
    });

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject: `[CIRCLE] ${otp} là mã xác thực kích hoạt tài khoản của bạn`,
        html,
      });

      this.logger.log(`Verification OTP email sent to ${email}. (OTP: ${otp})`);
      if (info.message) {
        this.logger.debug(`Email content stream generated for ${email}`);
      }
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send verification email to ${email}: ${err.message}`);
      return false;
    }
  }

  /**
   * Sends 6-digit OTP email to reset forgotten password.
   */
  async sendPasswordResetOtp(email: string, otp: string, displayName?: string): Promise<boolean> {
    const greeting = displayName ? `Xin chào <strong>${displayName}</strong>,` : 'Xin chào bạn,';
    const html = this.renderEmailTemplate({
      title: 'Đặt lại mật khẩu CIRCLE',
      greeting,
      message:
        'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản CIRCLE của bạn. Hãy nhập mã xác nhận dưới đây để tiếp tục:',
      otp,
      footerNote:
        'Nếu bạn không yêu cầu đặt lại mật khẩu, ai đó có thể đã nhập nhầm email của bạn. Mật khẩu của bạn vẫn an toàn và không bị thay đổi.',
    });

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject: `[CIRCLE] ${otp} là mã khôi phục mật khẩu của bạn`,
        html,
      });

      this.logger.log(`Password reset OTP email sent to ${email}. (OTP: ${otp})`);
      if (info.message) {
        this.logger.debug(`Email content stream generated for ${email}`);
      }
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send password reset email to ${email}: ${err.message}`);
      return false;
    }
  }
}
