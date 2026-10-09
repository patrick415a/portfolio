import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 서버가 보여주는 Next.js 상태 표시를 숨긴다. 포트폴리오의 하단 독과는 별개다.
  devIndicators: false,
  // MariaDB 드라이버는 Node.js 서버에서 직접 실행하며 브라우저 코드에 포함하지 않는다.
  serverExternalPackages: ["mariadb"],
  // Web3Forms Access Key는 브라우저 공개용이다. 구따지의 Vite 설정 이름도 지원한다.
  env: {
    NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY: (process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY
      ?? process.env.VITE_WEB3FORMS_ACCESS_KEY ?? "").trim(),
  },
};

export default nextConfig;
