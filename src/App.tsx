import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./routes/Home";
import Product from "./routes/Product";
import Watch from "./routes/Watch";
import Portfolio from "./routes/Portfolio";
import TopNav from "./components/TopNav";

export default function App() {
  const location = useLocation();
  const isDetail = location.pathname.startsWith("/s/");

  return (
    <div className="min-h-full flex flex-col bg-toss-bg">
      <TopNav />
      <main className={isDetail ? "" : "container-wide py-8"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/s/:id" element={<Product />} />
          <Route path="/watch" element={<Watch />} />
          <Route path="/me" element={<Portfolio />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="border-t border-toss-border bg-white mt-16">
        <div className="container-wide py-8 text-[12px] text-toss-text-tertiary leading-relaxed">
          이 사이트는 투자 판단 참고용이며 매수 추천이 아닙니다. 실제 매매는 신한투자증권 MTS에서 본인 판단으로 진행하세요.
          데이터는 신한투자증권 공식 자료를 기반으로 하지만 지연/오차가 있을 수 있습니다.
        </div>
      </footer>
    </div>
  );
}

function NotFound() {
  return (
    <div className="empty-state">
      <p className="text-[20px] font-bold">페이지를 찾을 수 없어요</p>
      <a href="/" className="text-toss-blue text-[14px] font-semibold">홈으로</a>
    </div>
  );
}
