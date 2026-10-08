export type ContactMessage = { name: string; replyTo: string; message: string };

const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const WEB3FORMS_ACCESS_KEY = (process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY ?? "").trim();
export const isContactDeliveryConfigured = Boolean(WEB3FORMS_ACCESS_KEY);

// 사용자에게 보여도 되는 전송 오류만 이 타입으로 전달한다.
export class ContactDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContactDeliveryError";
  }
}

export async function sendLetter(letter: ContactMessage): Promise<void> {
  if (!isContactDeliveryConfigured) {
    throw new ContactDeliveryError("메일 전송 설정이 필요합니다. 잠시 후 다시 시도해 주세요.");
  }
  const name = letter.name.trim();
  const email = letter.replyTo.trim();
  const message = letter.message.trim();
  if (!name || !email || !message || name.length > 80 || email.length > 254 || message.length > 5000
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ContactDeliveryError("이름, 올바른 이메일 주소, 내용을 확인해 주세요.");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `[포트폴리오] ${name.replace(/[\r\n]/g, " ")}님의 메시지`,
        from_name: "이성호 포트폴리오",
        name, email, message, botcheck: false,
      }),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => null);
    if (response.status === 429) {
      throw new ContactDeliveryError("메일을 너무 자주 보냈습니다. 잠시 후 다시 시도해 주세요.");
    }
    if (!response.ok || result?.success !== true) {
      throw new ContactDeliveryError("메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ContactDeliveryError("전송 시간이 오래 걸리고 있습니다. 네트워크를 확인하고 다시 시도해 주세요.");
    }
    if (error instanceof ContactDeliveryError) throw error;
    throw new ContactDeliveryError("메일을 보내지 못했습니다. 네트워크를 확인하고 다시 시도해 주세요.");
  } finally {
    window.clearTimeout(timeout);
  }
}
