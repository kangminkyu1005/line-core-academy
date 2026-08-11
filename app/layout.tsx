import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const sans = Geist({variable:"--sans",subsets:["latin"]});
const mono = Geist_Mono({variable:"--mono",subsets:["latin"]});
export const metadata:Metadata={title:"라인 코어 아카데미",description:"스토리 미션으로 완성하는 파이썬 PD 라인팔로잉 학습",other:{"codex-preview":"development"},icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><head><link rel="preload" as="image" href="/assets/lumi-clear.webp" type="image/webp"/></head><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>}
