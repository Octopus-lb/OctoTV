import { env as cloudflareEnv } from "cloudflare:workers";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Sends transactional email through Resend when configured. Verification and
 * password-reset links are secrets and are never written to application logs.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = cloudflareEnv.RESEND_API_KEY;
  const from = cloudflareEnv.EMAIL_FROM || "OctoTV <no-reply@octotv.local>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Transactional email is not configured.");
    }
    console.info("[octotv:email] Email provider is not configured; message was not sent.");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Transactional email provider returned HTTP ${response.status}.`);
  }
}

export function verificationEmail(
  url: string,
  locale: "ar" | "en" | "tr" | "fr",
): EmailPayload {
  const subjects = {
    ar: "أكّد بريدك الإلكتروني في OctoTV",
    en: "Confirm your OctoTV email",
    tr: "OctoTV e-postanızı doğrulayın",
    fr: "Confirmez votre e-mail OctoTV",
  };
  const bodies = {
    ar: "اضغط على الرابط التالي لتأكيد بريدك. تنتهي صلاحية الرابط خلال ساعة.",
    en: "Use the link below to verify your email. It expires in one hour.",
    tr: "E-postanızı doğrulamak için aşağıdaki bağlantıyı kullanın. Bir saat içinde sona erer.",
    fr: "Utilisez le lien ci-dessous pour vérifier votre e-mail. Il expire dans une heure.",
  };
  return {
    to: "",
    subject: subjects[locale],
    text: `${bodies[locale]}\n\n${url}\n\nOctoTV`,
    html: `<p>${bodies[locale]}</p><p><a href="${url}">${url}</a></p><p>OctoTV</p>`,
  };
}

export function resetPasswordEmail(
  url: string,
  locale: "ar" | "en" | "tr" | "fr",
): EmailPayload {
  const subjects = {
    ar: "إعادة تعيين كلمة مرور OctoTV",
    en: "Reset your OctoTV password",
    tr: "OctoTV şifrenizi sıfırlayın",
    fr: "Réinitialisez votre mot de passe OctoTV",
  };
  const bodies = {
    ar: "اضغط على الرابط التالي لتعيين كلمة مرور جديدة. إذا لم تطلب ذلك فتجاهل الرسالة.",
    en: "Use the link below to choose a new password. If you did not request this, ignore this message.",
    tr: "Yeni bir şifre belirlemek için aşağıdaki bağlantıyı kullanın. Bu isteği siz yapmadıysanız iletiyi yok sayın.",
    fr: "Utilisez le lien ci-dessous pour choisir un nouveau mot de passe. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
  };
  return {
    to: "",
    subject: subjects[locale],
    text: `${bodies[locale]}\n\n${url}\n\nOctoTV`,
    html: `<p>${bodies[locale]}</p><p><a href="${url}">${url}</a></p><p>OctoTV</p>`,
  };
}
