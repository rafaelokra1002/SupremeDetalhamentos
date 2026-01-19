'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchSelect({
  items = [],
  value,
  onChange,
  placeholder = 'Buscar...',
  displayField = 'nome',
  valueField = 'id',
  renderItem,
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Find selected item
  const selectedItem = items.find((item) => item[valueField] === value);

  // Filter items based on search
  const filteredItems = items.filter((item) => {
    const searchValue = typeof displayField === 'function' 
      ? displayField(item) 
      : item[displayField];
    return searchValue?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    onChange(item);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
  };

  const getDisplayValue = (item) => {
    if (typeof displayField === 'function') {
      return displayField(item);
    }
    return item[displayField];
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={`
          w-full px-4 py-3 rounded-lg border transition-colors cursor-pointer
          bg-supreme-gray border-supreme-light-gray text-white
          hover:border-gray-500 focus-within:border-red-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          flex items-center gap-2
        `}
      >
        <Search size={18} className="text-gray-500 flex-shrink-0" />
        
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 p-0"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={`flex-1 truncate ${selectedItem ? 'text-white' : 'text-gray-500'}`}>
            {selectedItem ? getDisplayValue(selectedItem) : placeholder}
          </span>
        )}

        {selectedItem && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-supreme-light-gray rounded text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-supreme-dark border border-supreme-light-gray rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-3 text-gray-500 text-center text-sm">
              Nenhum item encontrado
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item[valueField]}
                onClick={() => handleSelect(item)}
                className={`
                  px-4 py-3 cursor-pointer transition-colors
                  hover:bg-supreme-gray
                  ${item[valueField] === value ? 'bg-supreme-gray border-l-2 border-red-500' : ''}
                `}
              >
                {renderItem ? renderItem(item) : (
                  <span className="text-white">{getDisplayValue(item)}</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
