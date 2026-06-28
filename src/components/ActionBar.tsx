interface Props {
  isWatching: boolean;
  onToggleWatch: () => void;
  buyUrl?: string;
}

export default function ActionBar({ isWatching, onToggleWatch, buyUrl }: Props) {
  const handleBuy = () => {
    if (buyUrl) {
      window.open(buyUrl, "_blank", "noopener");
    } else {
      window.open(
        "https://www.shinhaninvest.com/siw/main/invest/invest-product-list.do",
        "_blank",
        "noopener"
      );
    }
  };

  return (
    <div className="action-bar max-w-[440px] left-1/2 -translate-x-1/2 w-full">
      <button
        onClick={onToggleWatch}
        className="action-bar-watch"
        aria-label={isWatching ? "관심 해제" : "관심 추가"}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5"
          fill={isWatching ? "#3182F6" : "none"}
          stroke={isWatching ? "#3182F6" : "#8B95A1"}
          strokeWidth={1.8}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
        </svg>
      </button>
      <button onClick={handleBuy} className="action-bar-buy">
        신한MTS에서 매수
      </button>
    </div>
  );
}
