"use client";

import { useRef, useState, type FormEvent } from "react";
import { ContactDeliveryError, type ContactMessage } from "@/lib/contact";

// 구따지의 발송 기능을 연결할 때 이 세 값을 전달한다.
export type { ContactMessage } from "@/lib/contact";
export const EMPTY_CONTACT_MESSAGE: ContactMessage = { name: "", replyTo: "", message: "" };

type ContactFormProps = {
  draft: ContactMessage;
  onDraftChange: (draft: ContactMessage) => void;
  onBack: () => void;
  // 실제 발송 함수는 성공 시 resolve, 실패 시 reject하도록 연결한다.
  // 함수가 없으면 전송 버튼을 비활성화하며 성공한 것처럼 표시하지 않는다.
  onSend?: (message: ContactMessage) => Promise<void>;
};

export function ContactForm({ draft, onDraftChange, onBack, onSend }: ContactFormProps) {
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; text: string } | null>(null);
  const sending = useRef(false);

  const update = (field: keyof ContactMessage, value: string) => {
    onDraftChange({ ...draft, [field]: value });
    setFeedback(null);
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current) return;
    if (!onSend) {
      setFeedback({ error: true, text: "메일 전송 기능을 준비 중입니다. 작성한 내용은 전송되지 않았습니다." });
      return;
    }
    const payload: ContactMessage = {
      name: draft.name.trim(), replyTo: draft.replyTo.trim(), message: draft.message.trim(),
    };
    if (!payload.name || !payload.replyTo || !payload.message) {
      setFeedback({ error: true, text: "이름, 답변받을 이메일, 내용을 모두 입력해 주세요." });
      return;
    }
    sending.current = true;
    setIsSending(true);
    setFeedback(null);
    try {
      await onSend(payload);
      onDraftChange(EMPTY_CONTACT_MESSAGE);
      setFeedback({ error: false, text: "메일을 보냈습니다. 남겨주신 이메일로 답변드릴게요." });
    } catch (error) {
      // 실패하면 작성 내용을 보존하고 서버 내부 오류는 화면에 노출하지 않는다.
      setFeedback({ error: true, text: error instanceof ContactDeliveryError ? error.message : "메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요." });
    } finally {
      sending.current = false;
      setIsSending(false);
    }
  };

  return (
    <div className="contact-form">
      <p className="eyebrow">FILE / NEW MESSAGE</p>
      <div className="contact-form-heading">
        <h2>메일 보내기</h2>
        <button className="contact-back" type="button" onClick={onBack} disabled={isSending}>← contact</button>
      </div>
      <form onSubmit={submit} aria-busy={isSending}>
        <div className="contact-fields">
          <div className="contact-field">
            <label htmlFor="contact-name">이름</label>
            <input id="contact-name" name="name" autoComplete="name" placeholder="이름을 입력해 주세요" value={draft.name} onChange={(event) => update("name", event.target.value)} maxLength={80} required disabled={isSending} autoFocus />
          </div>
          <div className="contact-field">
            <label htmlFor="contact-reply-to">답변받을 이메일</label>
            <input id="contact-reply-to" name="replyTo" type="email" autoComplete="email" placeholder="you@example.com" value={draft.replyTo} onChange={(event) => update("replyTo", event.target.value)} maxLength={254} required disabled={isSending} />
          </div>
          <div className="contact-field contact-message-field">
            <label htmlFor="contact-message">내용</label>
            <textarea id="contact-message" name="message" placeholder="전하고 싶은 이야기를 적어 주세요." value={draft.message} onChange={(event) => update("message", event.target.value)} maxLength={5000} required disabled={isSending} />
          </div>
        </div>
        {!onSend && <p id="contact-delivery-status" className="contact-form-notice">메일 전송 설정이 필요합니다.</p>}
        {feedback && <p className={`contact-feedback ${feedback.error ? "is-error" : "is-success"}`} role={feedback.error ? "alert" : "status"}>{feedback.text}</p>}
        <div className="contact-form-actions">
          <button className="contact-send" type="submit" disabled={isSending || !onSend} aria-describedby={!onSend ? "contact-delivery-status" : undefined}>{isSending ? "전송 중…" : "전송"}</button>
        </div>
      </form>
    </div>
  );
}
