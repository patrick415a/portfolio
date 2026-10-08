"use client";

import { useSyncExternalStore } from "react";

type NoteSnapshot = {
  text: string;
  status: "loading" | "saved" | "session";
};

const STORAGE_KEY = "sungho-portfolio:notes:v1";
const EMPTY_NOTE: NoteSnapshot = { text: "", status: "loading" };
let snapshot = EMPTY_NOTE;
const listeners = new Set<() => void>();

// 창이 닫히거나 최소화되어도 이번 방문의 메모는 메모리에 남는다.
// 브라우저 저장이 허용되면 새로고침 후에도 같은 메모를 불러온다.
function readSavedNote() {
  // 저장에 실패한 최신 메모를 오래된 저장 내용으로 덮어쓰지 않는다.
  if (snapshot.status === "session") return;
  try {
    const text = window.localStorage.getItem(STORAGE_KEY) ?? "";
    if (snapshot.status !== "saved" || snapshot.text !== text) {
      snapshot = { text, status: "saved" };
    }
  } catch {
    snapshot = { text: snapshot.text, status: "session" };
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  readSavedNote();
  // 같은 사이트의 다른 탭에서 메모가 바뀌면 열린 메모장도 갱신한다.
  const onStorage = (event: StorageEvent) => {
    if ((event.key === STORAGE_KEY || event.key === null) && event.storageArea === window.localStorage) {
      readSavedNote();
      listeners.forEach((listener) => listener());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return EMPTY_NOTE;
}

function saveNote(text: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, text);
    snapshot = { text, status: "saved" };
  } catch {
    snapshot = { text, status: "session" };
  }
  listeners.forEach((listener) => listener());
}

export function NotesContent() {
  // 서버의 빈 화면과 브라우저 저장 내용을 구분해 hydration 오류를 피한다.
  const note = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div className="notes-content">
      <textarea
        className="notes-editor"
        aria-label="메모 내용"
        placeholder="여기에 자유롭게 메모하세요."
        value={note.text}
        disabled={note.status === "loading"}
        onChange={(event) => saveNote(event.target.value)}
      />
      <div className="notes-statusbar">
        <span role="status">
          {note.status === "loading" ? "메모 불러오는 중" : note.status === "session" ? "자동 저장 불가 · 이번 방문 동안만 보관" : "자동 저장 · 이 브라우저에만 보관"}
        </span>
        <span>{Array.from(note.text).length.toLocaleString("ko-KR")}자</span>
      </div>
    </div>
  );
}
