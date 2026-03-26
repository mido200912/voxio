export const generateOtpEmail = (title, text, otp) => {
  return `
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; }
  .wrapper { background-color: #0a0a0a; padding: 40px 20px; width: 100%; box-sizing: border-box; }
  .email-container { max-width: 500px; margin: 0 auto; background-color: #141414; border: 1px solid #262626; border-radius: 12px; overflow: hidden; }
  .header { padding: 30px 20px; text-align: center; border-bottom: 1px solid #262626; background-color: #111111; }
  .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: #ffffff; }
  .content { padding: 40px 30px; text-align: center; }
  .title { font-size: 22px; font-weight: 600; margin-bottom: 15px; color: #ffffff; }
  .text { font-size: 15px; line-height: 1.6; color: #a3a3a3; margin-bottom: 30px; }
  .otp-box { background-color: #000000; border: 1px solid #333333; border-radius: 8px; padding: 25px 20px; text-align: center; margin-bottom: 30px; }
  .otp-code { font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #ffffff; margin: 0; padding-left: 12px; }
  .footer { padding: 25px 30px; text-align: center; border-top: 1px solid #262626; background-color: #111111; }
  .footer p { margin: 0; font-size: 12px; color: #666666; line-height: 1.5; }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="email-container">
      <div class="header">
        <h1>Aithor</h1>
      </div>
      <div class="content">
        <h2 class="title">${title}</h2>
        <p class="text">${text}</p>
        <div class="otp-box">
          <p class="otp-code">${otp}</p>
        </div>
        <p class="text" style="font-size: 13px; margin-bottom: 0;">This code is valid for 10 minutes.<br/>If you didn't request this, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Aithor Security System.<br/>All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};
