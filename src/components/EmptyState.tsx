import { useNavigate } from "react-router-dom";

interface Props {
  icon?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaTo?: string;
}

export default function EmptyState({ icon = "⭐", title, description, ctaLabel, ctaTo }: Props) {
  const navigate = useNavigate();
  return (
    <div className="empty-state">
      <span className="text-5xl">{icon}</span>
      <p className="text-[17px] font-bold text-toss-text-primary">{title}</p>
      {description && (
        <p className="text-[14px] text-toss-text-tertiary leading-relaxed">{description}</p>
      )}
      {ctaLabel && ctaTo && (
        <button
          onClick={() => navigate(ctaTo)}
          className="mt-2 px-6 py-3 rounded-2xl bg-toss-blue text-white text-[15px] font-bold"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
