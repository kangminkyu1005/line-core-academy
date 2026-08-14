"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function CodeScreenTestShortcut(){
  const pathname=usePathname();
  if(pathname.startsWith("/code-screen-preview"))return null;
  return <Link
    href="/code-screen-preview"
    aria-label="코드 작성 화면 테스트 바로가기"
    style={{
      position:"fixed",
      right:"18px",
      bottom:"18px",
      zIndex:80,
      minHeight:"48px",
      padding:"0 17px",
      border:"2px solid #fdcd34",
      borderRadius:"14px",
      background:"#001e41",
      color:"#ffffff",
      boxShadow:"0 12px 28px rgba(0,30,65,.32)",
      display:"inline-flex",
      alignItems:"center",
      justifyContent:"center",
      gap:"8px",
      textDecoration:"none",
      fontSize:"12px",
      fontWeight:900,
      letterSpacing:"-.01em",
    }}
  >
    <span aria-hidden="true" style={{width:"25px",height:"25px",borderRadius:"8px",background:"#fdcd34",color:"#001e41",display:"grid",placeItems:"center",fontFamily:"monospace",fontSize:"13px"}}>&lt;/&gt;</span>
    코드 작성 화면 테스트
  </Link>;
}
