import { useState } from 'react';

function SliderCard({ title, subtitle, body, imageSrc, imageAlt, footer, isUniform = false }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Controlla se il testo è troppo lungo (circa 150 caratteri per 3 righe)
  const shouldTruncate = body && body.length > 150;
  const displayText = shouldTruncate && !isExpanded 
    ? body.substring(0, 150) + '...' 
    : body;

  const cardClasses = isUniform 
    ? "bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border-0 hover:bg-white/15 transition-all duration-300 h-[150px] w-full flex flex-col"
    : "bg-white/10 backdrop-blur-md rounded-xl p-0 overflow-hidden border border-white/20 hover:bg-white/15 transition-all duration-300 max-w-4xl mx-auto";

  return (
    <div className={cardClasses}>
      {imageSrc && (
        <div className="aspect-video bg-gray-800 relative overflow-hidden flex-shrink-0">
          <img
            src={imageSrc}
            alt={imageAlt || title || 'immagine'}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className={isUniform ? "p-4 flex-1 flex flex-col" : "p-8"}>
        {title && (
          <h3 className={`font-semibold text-white mb-2 ${isUniform ? 'text-lg text-center line-clamp-2' : 'text-2xl mb-3 text-center'}`}>
            {title}
          </h3>
        )}
        {subtitle && (
          <p className={`text-indigo-300 text-sm mb-3 text-center ${isUniform ? 'flex-shrink-0' : 'mb-4'}`}>
            {subtitle}
          </p>
        )}
        {body && (
          <div className={isUniform ? "flex-1 flex flex-col justify-between" : ""}>
            <p className={`text-white/80 leading-relaxed text-center ${
              isUniform 
                ? 'text-sm flex-1 overflow-hidden' + (isExpanded ? '' : ' line-clamp-3')
                : 'text-base'
            }`}>
              {displayText}
            </p>
            {shouldTruncate && isUniform && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-indigo-300 hover:text-indigo-200 text-xs font-medium transition-colors self-center"
              >
                {isExpanded ? 'Mostra meno' : 'Leggi tutto'}
              </button>
            )}
          </div>
        )}
        {footer && <div className={isUniform ? "mt-2 flex-shrink-0" : "mt-4"}>{footer}</div>}
      </div>
    </div>
  );
}

export default SliderCard;