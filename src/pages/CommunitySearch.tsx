import type {FormEvent} from 'react';
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import SearchHeader from '@/components/layout/search-header';

const CommunitySearch = () => {
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState('');

    const recommendedKeywords = ['데이트', '브런치', '카페'];

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const value = keyword.trim();
        if (!value) {
            return;
        }
        navigate(`/community/search/results?keyword=${encodeURIComponent(value)}`);
    };

    const handleQuickSearch = (value: string) => {
        setKeyword(value);
        navigate(`/community/search/results?keyword=${encodeURIComponent(value)}`);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* UserRequest: 검색 전용 페이지는 SearchHeader로 교체하고 상단에 고정 */}
            <SearchHeader
                value={keyword}
                onChange={setKeyword}
                onSubmit={handleSubmit}
                autoFocus
            />

            <main className="container mx-auto px-4 py-8 md:py-10 space-y-8">
                {/* UserRequest: 추천 검색어 섹션 */}
                <section className="max-w-2xl mx-auto space-y-3">
                    <h2 className="text-sm font-semibold">추천 검색어</h2>
                    <div className="flex flex-wrap gap-2">
                        {recommendedKeywords.map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => handleQuickSearch(item)}
                                className="rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default CommunitySearch;
