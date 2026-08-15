import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@fontsource-variable/noto-sans-kr";
import "./globals.css";

const sans = Geist({variable:"--sans",subsets:["latin"]});
const mono = Geist_Mono({variable:"--mono",subsets:["latin"]});
export const metadata:Metadata={
  metadataBase:new URL("https://line-core-academy.rotmxm.chatgpt.site"),
  title:"라인 코어 아카데미",
  description:"스토리 미션으로 완성하는 파이썬 PD 라인팔로잉 학습",
  applicationName:"라인 코어 아카데미",
  manifest:"/site.webmanifest",
  other:{"codex-preview":"development"},
  icons:{
    icon:[
      {url:"/favicon.svg",type:"image/svg+xml"},
      {url:"/icon-192.png",sizes:"192x192",type:"image/png"},
    ],
    shortcut:"/favicon.svg",
    apple:[{url:"/apple-touch-icon.png",sizes:"180x180",type:"image/png"}],
  },
  openGraph:{
    title:"라인 코어 아카데미",
    description:"스토리 미션으로 완성하는 파이썬 PD 라인팔로잉 학습",
    type:"website",
    locale:"ko_KR",
    images:[{url:"/og.png",width:1200,height:630,alt:"라인 코어 아카데미 라인 팔로잉 로봇"}],
  },
  twitter:{card:"summary_large_image",images:["/og.png"]},
};
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#001e41"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><head><link rel="preload" as="image" href="/assets/lumi-clear.webp" type="image/webp"/></head><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>}
