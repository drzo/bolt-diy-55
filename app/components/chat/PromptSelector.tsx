import React, { useState, useRef, useEffect } from 'react';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';
import { PromptLibrary } from '~/lib/common/prompt-library';
import { useSettings } from '~/lib/hooks/useSettings';

interface PromptSelectorProps {
  className?: string;
}

export const PromptSelector: React.FC<PromptSelectorProps> = ({ className }) => {
  const { promptId, setPromptId } = useSettings();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Get available prompts
  const promptList = PromptLibrary.getList();
  const filteredPrompts = promptList.filter((prompt) => prompt.label.toLowerCase().includes(searchQuery.toLowerCase()));

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset index when query or dropdown state changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchQuery, isDropdownOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  // Scroll to focused item
  useEffect(() => {
    if (focusedIndex >= 0 && optionsRef.current[focusedIndex]) {
      optionsRef.current[focusedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isDropdownOpen) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1 >= filteredPrompts.length ? 0 : prev + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 < 0 ? filteredPrompts.length - 1 : prev - 1));
        break;
      case 'Enter':
        e.preventDefault();

        if (focusedIndex >= 0 && focusedIndex < filteredPrompts.length) {
          const selectedPrompt = filteredPrompts[focusedIndex];
          handleSelectPrompt(selectedPrompt.id);
        }

        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        setSearchQuery('');
        break;
      case 'Tab':
        if (!e.shiftKey && focusedIndex === filteredPrompts.length - 1) {
          setIsDropdownOpen(false);
        }

        break;
    }
  };

  const handleSelectPrompt = (id: string) => {
    setPromptId(id);
    setIsDropdownOpen(false);
    setSearchQuery('');
    toast.success(`Prompt changed to ${promptList.find((p) => p.id === id)?.label}`);
  };

  const selectedPrompt = promptList.find((p) => p.id === promptId);

  return (
    <div className={classNames('relative', className)} onKeyDown={handleKeyDown} ref={dropdownRef}>
      <div
        className={classNames(
          'w-full p-2 rounded-lg border border-bolt-elements-borderColor',
          'bg-bolt-elements-prompt-background text-bolt-elements-textPrimary',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-bolt-elements-focus',
          'transition-all cursor-pointer',
          isDropdownOpen ? 'ring-2 ring-bolt-elements-focus' : undefined,
        )}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsDropdownOpen(!isDropdownOpen);
          }
        }}
        role="combobox"
        aria-expanded={isDropdownOpen}
        aria-controls="prompt-listbox"
        aria-haspopup="listbox"
        tabIndex={0}
      >
        <div className="flex items-center justify-between">
          <div className="truncate">{selectedPrompt?.label || 'Select persona'}</div>
          <div
            className={classNames(
              'i-ph:caret-down w-4 h-4 text-bolt-elements-textSecondary opacity-75',
              isDropdownOpen ? 'rotate-180' : undefined,
            )}
          />
        </div>
      </div>

      {isDropdownOpen && (
        <div
          className="absolute z-20 w-full mt-1 py-1 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 shadow-lg"
          role="listbox"
          id="prompt-listbox"
        >
          <div className="px-2 pb-2">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search personas..."
                className={classNames(
                  'w-full pl-8 py-1.5 rounded-md text-sm',
                  'bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor',
                  'text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary',
                  'focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus',
                  'transition-all',
                )}
                onClick={(e) => e.stopPropagation()}
                role="searchbox"
                aria-label="Search prompts"
              />
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                <span className="i-ph:magnifying-glass text-bolt-elements-textTertiary" />
              </div>
            </div>
          </div>

          <div
            className={classNames(
              'max-h-60 overflow-y-auto',
              'sm:scrollbar-none',
              '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2',
              '[&::-webkit-scrollbar-thumb]:bg-bolt-elements-borderColor',
              '[&::-webkit-scrollbar-thumb]:hover:bg-bolt-elements-borderColorHover',
              '[&::-webkit-scrollbar-thumb]:rounded-full',
              '[&::-webkit-scrollbar-track]:bg-bolt-elements-background-depth-2',
              '[&::-webkit-scrollbar-track]:rounded-full',
              'sm:[&::-webkit-scrollbar]:w-1.5 sm:[&::-webkit-scrollbar]:h-1.5',
              'sm:hover:[&::-webkit-scrollbar-thumb]:bg-bolt-elements-borderColor/50',
              'sm:hover:[&::-webkit-scrollbar-thumb:hover]:bg-bolt-elements-borderColor',
              'sm:[&::-webkit-scrollbar-track]:bg-transparent',
            )}
          >
            {filteredPrompts.length === 0 ? (
              <div className="px-3 py-2 text-sm text-bolt-elements-textTertiary">No prompts found</div>
            ) : (
              filteredPrompts.map((prompt, index) => (
                <div
                  ref={(el) => (optionsRef.current[index] = el)}
                  key={prompt.id}
                  role="option"
                  aria-selected={promptId === prompt.id}
                  className={classNames(
                    'px-3 py-2 text-sm cursor-pointer',
                    'hover:bg-bolt-elements-background-depth-3',
                    'text-bolt-elements-textPrimary',
                    'outline-none',
                    promptId === prompt.id || focusedIndex === index
                      ? 'bg-bolt-elements-background-depth-2'
                      : undefined,
                    focusedIndex === index ? 'ring-1 ring-inset ring-bolt-elements-focus' : undefined,
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPrompt(prompt.id);
                  }}
                  tabIndex={focusedIndex === index ? 0 : -1}
                >
                  <div className="font-medium">{prompt.label}</div>
                  <div className="text-xs text-bolt-elements-textSecondary truncate">{prompt.description}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
