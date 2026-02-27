import type {FormEvent} from 'react';
import SharedCategorySearchBar from '@/components/community/shared-category-search-bar';

type SearchHeaderProps = {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    autoFocus?: boolean;
};

// UserRequest: 검색 전용 페이지에서 뒤로가기 + 검색바 조합 헤더 제공
const SearchHeader = ({
                          value,
                          onChange,
                          onSubmit,
                          autoFocus = false,
                      }: SearchHeaderProps) => {
    return (
        <header
            className="sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-4 md:py-3">
                <div className="flex items-center">
                    <SharedCategorySearchBar
                        value={value}
                        onChange={onChange}
                        onSubmit={onSubmit}
                        autoFocus={autoFocus}
                        formClassName="w-full max-w-none"
                        wrapperClassName="h-10"
                        inputClassName="h-10 bg-muted/30 border-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                </div>
            </div>
        </header>
    );
};

export default SearchHeader;
