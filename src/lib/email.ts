import nodemailer from "nodemailer";

// ─── Transport ────────────────────────────────────────────────────────────────

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_SERVER_HOST,
    port:   Number(process.env.EMAIL_SERVER_PORT ?? 587),
    secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
}

const FROM = process.env.EMAIL_FROM ?? "FinansApp <noreply@finansapp.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Templates ────────────────────────────────────────────────────────────────

function baseTemplate(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
    .header { background: linear-gradient(135deg,#6366f1,#8b5cf6); padding: 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 800; }
    .header p  { color: rgba(255,255,255,.8); margin: 4px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .body p { color: #475569; line-height: 1.7; margin: 0 0 16px; }
    .btn { display: inline-block; padding: 12px 28px; background: #6366f1; color: #fff; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; margin: 8px 0; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 16px 0; }
    .amount { font-size: 22px; font-weight: 800; color: #6366f1; }
    .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>₺ FinansApp</h1>
      <p>Kişisel Finans Yönetimi</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} FinansApp. Bu e-postayı almak istemiyorsanız ayarlarınızdan bildirimleri kapatabilirsiniz.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email functions ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, name: string) {
  const transport = createTransport();
  await transport.sendMail({
    from: FROM,
    to:   email,
    subject: "FinansApp'a Hoş Geldiniz! 🎉",
    html: baseTemplate("Hoş Geldiniz", `
      <p>Merhaba <strong>${name}</strong>,</p>
      <p>FinansApp'a kayıt olduğunuz için teşekkürler. Artık gelir ve giderlerinizi kolayca takip edebilir, bütçe oluşturabilir ve finansal hedeflerinize ulaşabilirsiniz.</p>
      <p style="text-align:center"><a href="${APP_URL}/dashboard" class="btn">Dashboard'a Git</a></p>
      <div class="card">
        <p style="margin:0;font-size:14px;color:#64748b">Başlamak için şunları yapabilirsiniz:</p>
        <ul style="color:#64748b;font-size:14px;margin:8px 0 0;padding-left:20px">
          <li>İlk işleminizi ekleyin</li>
          <li>Bütçenizi oluşturun</li>
          <li>Kredi kartlarınızı tanımlayın</li>
          <li>Ödeme takibini başlatın</li>
        </ul>
      </div>
    `),
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl  = `${APP_URL}/reset-password?token=${token}`;
  const transport = createTransport();
  await transport.sendMail({
    from: FROM,
    to:   email,
    subject: "Şifre Sıfırlama Talebi — FinansApp",
    html: baseTemplate("Şifre Sıfırlama", `
      <p>Hesabınız için bir şifre sıfırlama talebi aldık.</p>
      <p>Aşağıdaki butona tıklayarak şifrenizi sıfırlayabilirsiniz:</p>
      <p style="text-align:center"><a href="${resetUrl}" class="btn">Şifremi Sıfırla</a></p>
      <div class="card">
        <p style="margin:0;font-size:13px;color:#ef4444">⚠️ Bu bağlantı 1 saat içinde geçerliliğini yitirecektir. Eğer bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
      </div>
    `),
  });
}

export async function sendPaymentReminderEmail(
  email:  string,
  name:   string,
  payments: Array<{ name: string; amount: number; dueDate: string; daysLeft: number }>
) {
  const transport = createTransport();
  const rows = payments.map((p) => `
    <div class="card" style="margin:8px 0">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <strong style="color:#1e293b">${p.name}</strong>
          <div style="font-size:12px;color:#64748b;margin-top:2px">
            ${p.daysLeft === 0 ? "⚠️ Bugün vadesi doluyor!" : `${p.daysLeft} gün sonra — ${new Date(p.dueDate).toLocaleDateString("tr-TR")}`}
          </div>
        </div>
        <div class="amount">₺${p.amount.toLocaleString("tr-TR")}</div>
      </div>
    </div>
  `).join("");

  await transport.sendMail({
    from: FROM,
    to:   email,
    subject: `${payments.length} ödeme yaklaşıyor — FinansApp Hatırlatıcı`,
    html: baseTemplate("Ödeme Hatırlatıcı", `
      <p>Merhaba <strong>${name}</strong>,</p>
      <p>Yaklaşan ödeme(leriniz) için hatırlatma:</p>
      ${rows}
      <p style="text-align:center;margin-top:24px"><a href="${APP_URL}/payments" class="btn">Ödemeleri Görüntüle</a></p>
    `),
  });
}

export async function sendOverdueAlert(
  email:    string,
  name:     string,
  payments: Array<{ name: string; amount: number; dueDate: string }>
) {
  const transport = createTransport();
  const rows = payments.map((p) => `
    <div class="card" style="border-color:#ef444440;background:#fff5f5;margin:8px 0">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <strong style="color:#ef4444">${p.name}</strong>
          <div style="font-size:12px;color:#64748b;margin-top:2px">Vade: ${new Date(p.dueDate).toLocaleDateString("tr-TR")}</div>
        </div>
        <div style="font-size:20px;font-weight:800;color:#ef4444">₺${p.amount.toLocaleString("tr-TR")}</div>
      </div>
    </div>
  `).join("");

  await transport.sendMail({
    from: FROM,
    to:   email,
    subject: `🔴 ${payments.length} ödeme gecikti — FinansApp`,
    html: baseTemplate("Gecikmiş Ödemeler", `
      <p>Merhaba <strong>${name}</strong>,</p>
      <p style="color:#ef4444"><strong>Aşağıdaki ödemeler vadesi geçmiş durumda:</strong></p>
      ${rows}
      <p style="text-align:center;margin-top:24px"><a href="${APP_URL}/payments" class="btn" style="background:#ef4444">Hemen Öde</a></p>
    `),
  });
}
