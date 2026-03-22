import type { FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { UI_COPY } from '@/shared/constants/ui-copy';

type SharedCategorySearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readOnly?: boolean;
  autoFocus?: boolean;
  onFocus?: () => void;
  onClick?: () => void;
  inputClassName?: string;
  formClassName?: string;
  wrapperClassName?: string;
};

// UserRequest: 커뮤니티 검색 입력 UI를 공통 컴포넌트로 분리
const SharedCategorySearchBar = ({
  value,
  onChange,
  onSubmit,
  readOnly = false,
  autoFocus = false,
  onFocus,
  onClick,
  inputClassName = '',
  formClassName = '',
  wrapperClassName = '',
}: SharedCategorySearchBarProps) => (
  <form onSubmit={onSubmit} className={`w-5/6 max-w-xl mx-auto ${formClassName}`}>
    <div className={`relative w-full ${wrapperClassName}`}>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={UI_COPY.community.searchPlaceholder}
        readOnly={readOnly}
        autoFocus={autoFocus}
        onFocus={onFocus}
        onClick={onClick}
        className={`pl-4 pr-12 border-primary/70 focus-visible:ring-primary rounded-full h-12 ${inputClassName}`}
      />
      <button
        type="submit"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80"
        aria-label={UI_COPY.community.searchActionAriaLabel}
      >
        <Search className="w-5 h-5" />
      </button>
    </div>
  </form>
);

export default SharedCategorySearchBar;
