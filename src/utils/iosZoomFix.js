// Utility per correggere problemi di zoom su iOS
export const resetIOSZoom = () => {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    // Reset viewport scale
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }
    
    // Force body scale reset
    document.body.style.zoom = '1';
    document.documentElement.style.zoom = '1';
    
    // Prevent zoom on input focus
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.style.fontSize = '16px';
      input.style.transformOrigin = 'left top';
      input.style.transform = 'scale(1)';
    });
  }
};

// Auto-fix on page load and resize
export const initIOSZoomFix = () => {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    resetIOSZoom();
    
    // Reset on orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(resetIOSZoom, 100);
    });
    
    // Reset on resize
    window.addEventListener('resize', resetIOSZoom);
    
    // Reset on input blur (after zoom might have occurred)
    document.addEventListener('blur', (e) => {
      if (e.target.matches('input, textarea, select')) {
        setTimeout(resetIOSZoom, 100);
      }
    }, true);
  }
};