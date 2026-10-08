// githubUrl에는 https://로 시작하는 전체 주소를 적으면 Contact 링크가 활성화된다.
// 실제 수신자는 Web3Forms Access Key에 연결된 이메일이다. email은 연락처 정보다.
// 소개에 표시할 기본 정보와 캐릭터 이미지도 이 파일에서 관리한다.
export const profile: {
  name: string;
  birthDate: string;
  birthDateLabel: string;
  avatarSrc: string;
  email?: string;
  githubUrl?: string;
} = {
  name: "이성호",
  birthDate: "1995-04-15",
  birthDateLabel: "1995년 4월 15일",
  avatarSrc: "/assets/sungho-avatar.png",
  email: "patrick415@gmail.com",
  githubUrl: undefined,
};
