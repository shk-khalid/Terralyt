import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  position?: "bottom" | "top";
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, helperText, children, value, onChange, disabled, position = "bottom", ...props }, ref) => {
    const uniqueId = React.useId();
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const selectRef = React.useRef<HTMLSelectElement | null>(null);

    // Sync external ref if passed
    React.useImperativeHandle(ref, () => selectRef.current!);

    // Extract options
    const options: Array<{ value: string; label: string }> = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const element = child as React.ReactElement<any>;
        if (element.type === React.Fragment) {
          React.Children.forEach(element.props.children, (subChild) => {
            if (React.isValidElement(subChild)) {
              const subElement = subChild as React.ReactElement<any>;
              const val = subElement.props.value !== undefined ? String(subElement.props.value) : '';
              const lbl = typeof subElement.props.children === 'string' || typeof subElement.props.children === 'number'
                ? String(subElement.props.children)
                : subElement.props.children || val;
              options.push({ value: val, label: lbl });
            }
          });
        } else {
          const val = element.props.value !== undefined ? String(element.props.value) : '';
          const lbl = typeof element.props.children === 'string' || typeof element.props.children === 'number'
            ? String(element.props.children)
            : element.props.children || val;
          options.push({ value: val, label: lbl });
        }
      }
    });

    // Determine current value
    const currentValue = value !== undefined ? String(value) : (selectRef.current?.value || options[0]?.value || "");
    const selectedOption = options.find(opt => opt.value === currentValue) || options[0];

    // Handle click outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    const handleSelectOption = (val: string) => {
      if (selectRef.current) {
        selectRef.current.value = val;
        // Trigger synthetic change event for React's onChange handler
        const event = new Event("change", { bubbles: true });
        Object.defineProperty(event, 'target', { writable: true, value: selectRef.current });
        if (onChange) {
          onChange({
            ...event,
            target: selectRef.current,
            currentTarget: selectRef.current,
          } as unknown as React.ChangeEvent<HTMLSelectElement>);
        }
      }
      setIsOpen(false);
    };

    return (
      <div ref={containerRef} className="flex flex-col space-y-1.5 w-full relative">
        {label && (
          <label 
            htmlFor={uniqueId}
            className="text-xs font-semibold uppercase tracking-wider text-esg-muted"
          >
            {label}
          </label>
        )}
        
        {/* Hidden native select for compatibility & accessibility */}
        <select
          id={uniqueId}
          ref={selectRef}
          value={currentValue}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
          {...props}
        >
          {children}
        </select>

        {/* Custom styled trigger button */}
        <div className="relative w-full">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className={`flex h-10 w-full items-center justify-between rounded-xl border border-esg-border bg-esg-clay px-3 py-2 text-sm text-esg-text focus-ring cursor-pointer hover:border-esg-sage transition-all duration-150 text-left ${
              isOpen ? "border-esg-sage" : ""
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
          >
            <span className="truncate">{selectedOption?.label || "Select..."}</span>
            <ChevronDown className={`h-4 w-4 text-esg-muted transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`} />
          </button>

          {/* Custom absolute dropdown options list */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={position === "top" ? { opacity: 0, y: 4, scale: 0.98 } : { opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={position === "top" ? { opacity: 0, y: 4, scale: 0.98 } : { opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className={`absolute z-50 left-0 right-0 max-h-60 overflow-auto rounded-xl border border-esg-border bg-esg-clay p-1 shadow-lg focus:outline-none ${
                  position === "top" ? "bottom-full mb-2" : "mt-2"
                }`}
              >
                {options.map((option) => {
                  const isSelected = option.value === currentValue;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelectOption(option.value)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-esg-text hover:bg-esg-moss/45 transition-colors duration-150 text-left cursor-pointer ${
                        isSelected ? "bg-esg-moss/30 font-medium" : ""
                      }`}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && <Check className="h-4 w-4 text-esg-dark shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {helperText && (
          <p className="text-xs text-esg-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

