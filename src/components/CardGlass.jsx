export default function CardGlass({ children, className = "" }) {
  return (
    <div className={`glass-card ${className}`}>
      {children}
    </div>
  );
}