import React from 'react';

export const Card = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerBorder = true,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={`glass-panel rounded-2xl overflow-hidden transition-all duration-300 ${
        glow ? 'glow-brand' : ''
      } ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div
          className={`px-6 py-5 flex items-center justify-between gap-4 ${
            headerBorder ? 'border-b border-slate-800/80' : ''
          }`}
        >
          <div>
            {title && <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};
