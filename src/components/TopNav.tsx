import { NavLink, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";

export default function TopNav() {
  const navigate = useNavigate();
  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <div onClick={() => navigate("/")} className="top-nav-logo flex items-center gap-2">
          <span className="inline-block w-7 h-7 rounded-lg bg-toss-blue text-white text-[14px] font-bold flex items-center justify-center">아</span>
          아빠 퇴직연금
        </div>

        <nav className="flex items-center gap-6">
          <NavLink to="/" end className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}>홈</NavLink>
          <NavLink to="/watch" className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}>관심</NavLink>
          <NavLink to="/me" className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}>내자산</NavLink>
        </nav>

        <div className="flex-1 max-w-md">
          <SearchBar />
        </div>

        <a
          href="https://www.shinhansec.com/"
          target="_blank"
          rel="noopener"
          className="text-[13px] font-semibold text-toss-text-tertiary hover:text-toss-text-primary transition-colors"
        >
          신한투자증권 ↗
        </a>
      </div>
    </header>
  );
}
