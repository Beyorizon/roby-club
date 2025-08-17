export default function CardGlass({ children, className = "" }) {
  return (
    <div className={`backdrop-blur-lg bg-white/10 border border-white/15 rounded-2xl shadow-2xl ${className}`}>
      {children}
    </div>
  );
}