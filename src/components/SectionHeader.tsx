interface Props {
  title: string;
  more?: string;
  onMore?: () => void;
}

export default function SectionHeader({ title, more, onMore }: Props) {
  return (
    <div className="section-header">
      <h2 className="section-title">{title}</h2>
      {more && (
        <button onClick={onMore} className="section-more">
          {more}
        </button>
      )}
    </div>
  );
}
