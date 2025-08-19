function SliderCard({ title, subtitle, body, imageSrc, imageAlt, footer }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-0 overflow-hidden border border-white/20 hover:bg-white/15 transition-all duration-300 max-w-4xl mx-auto">
      {imageSrc && (
        <div className="aspect-video bg-gray-800 relative overflow-hidden">
          <img
            src={imageSrc}
            alt={imageAlt || title || 'immagine'}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-8">
        {title && <h3 className="text-2xl font-semibold text-white mb-3 text-center">{title}</h3>}
        {subtitle && <p className="text-indigo-300 text-sm mb-4 text-center">{subtitle}</p>}
        {body && <p className="text-white/80 text-base leading-relaxed text-center">{body}</p>}
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  );
}

export default SliderCard;