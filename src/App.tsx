import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./routes/Home";
import Product from "./routes/Product";
import Watch from "./routes/Watch";
import Portfolio from "./routes/Portfolio";
import BottomTabBar from "./components/BottomTabBar";

export default function App() {
  const location = useLocation();
  const isDetail = location.pathname.startsWith("/s/");

  return (
    <div className="min-h-full flex flex-col max-w-[440px] mx-auto bg-white relative">
      <main className={`flex-1 ${isDetail ? "" : "pb-14"}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/s/:id" element={<Product />} />
          <Route path="/watch" element={<Watch />} />
          <Route path="/me" element={<Portfolio />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isDetail && <BottomTabBar />}
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-[17px] font-bold text-toss-text-primary">페이지를 찾을 수 없어요</p>
      <a href="/" className="text-toss-blue text-[15px] font-semibold">홈으로</a>
    </div>
  );
}
