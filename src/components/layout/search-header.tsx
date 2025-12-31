import type {FormEvent} from 'react';
import {useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {ArrowLeft} from 'lucide-react';
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
    const navigate = useNavigate();

    const handleBack = () => {
        // UserRequest: 히스토리가 없을 때는 홈으로 이동해 뒤로가기 무반응을 방지
        if (window.history.length <= 1) {
            navigate('/');
            return;
        }
        navigate(-1);
    };

    return (
        <header
            className="sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-4 md:py-3">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBack}
                        aria-label="뒤로가기"
                        className="h-10 w-10"
                    >
                        <ArrowLeft className="w-5 h-5"/>
                    </Button>
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
