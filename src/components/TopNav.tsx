import { NavLink, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";

export default function TopNav() {
  const navigate = useNavigate();
  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2 cursor-pointer flex-shrink-0"
        >
          <span className="w-7 h-7 rounded-full bg-toss-blue text-white text-[12px] font-bold flex items-center justify-center">
            신
          </span>
          <span className="text-[18px] font-bold text-toss-text-primary tracking-tight">
            신한 퇴직연금
          </span>
        </div>

        {/* Primary nav */}
        <nav className="flex items-center gap-7">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}
          >
            홈
          </NavLink>
          <NavLink
            to="/watch"
            className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}
          >
            펀드 골라보기
          </NavLink>
          <NavLink
            to="/me"
            className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}
          >
            내 연금
          </NavLink>
        </nav>

        {/* Search bar - centered */}
        <div className="flex-1 flex justify-center px-8">
          <div className="w-full max-w-[480px]">
            <SearchBar />
          </div>
        </div>

        {/* Right action */}
        <a
          href="https://www.shinhansec.com/"
          target="_blank"
          rel="noopener"
          className="flex-shrink-0 inline-flex items-center h-9 px-4 rounded-lg bg-toss-blue text-white text-[13px] font-bold hover:bg-toss-blue-hover transition-colors"
        >
          신한 MTS
        </a>
      </div>
    </header>
  );
}
