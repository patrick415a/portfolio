import Image from "next/image";
import { profile } from "@/data/profile";

// 현재 사이트의 바탕화면을 작은 그림으로 표현한다. 실제 스크린샷과 구분해 미리보기로 표시한다.
export function PortfolioPreview() {
  return (
    <div className="portfolio-preview" role="img" aria-label="바탕화면과 소개 창으로 구성된 포트폴리오 미리보기">
      <div className="preview-scene" aria-hidden="true">
        <p className="preview-welcome">SUNGHO&apos;S DESKTOP</p>
        <div className="preview-shortcuts">
          {["about", "works", "notes"].map((icon) => (
            <Image key={icon} src={`/assets/icons/${icon}-smooth.png`} alt="" width={32} height={32} />
          ))}
        </div>
        <div className="preview-window">
          <div className="preview-titlebar"><span>about_me.txt</span><i /><i /><i /></div>
          <div className="preview-body">
            <strong>안녕하세요,<br />성호입니다!</strong>
            <Image className="preview-avatar" src={profile.avatarSrc} alt="" width={80} height={80} sizes="80px" />
            <div className="preview-lines"><span /><span /></div>
            <div className="preview-tags"><span>REACT</span><span>DESIGN</span></div>
          </div>
        </div>
        <div className="preview-dock"><span /><span /><span /><span /></div>
      </div>
    </div>
  );
}
