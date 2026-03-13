import type {FormEvent} from 'react';
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import SearchHeader from '@/components/layout/search-header';
import { UI_COPY } from '@/shared/constants/ui-copy';

const CommunitySearch = () => {
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState('');

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

    const chipClassName =
        'rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors';

    return (
        <div className="min-h-screen bg-background">
            {/* UserRequest: 검색 페이지는 공통 헤더 예외로 기존 SearchHeader(뒤로가기+검색창)를 사용 */}
            <SearchHeader
                value={keyword}
                onChange={setKeyword}
                onSubmit={handleSubmit}
                autoFocus
            />

            <main className="container mx-auto px-8 py-8 md:py-10">
                {/* UserRequest: 추천 검색어 영역은 상단 제목과 분류 카드를 분리해 더 깔끔하게 구성 */}
                <section className="max-w-2xl mx-auto space-y-5">
                    <h2 className="text-base font-semibold">{UI_COPY.communitySearch.sectionTitle}</h2>

                    {/* UserRequest: 추천 검색어를 지역 파트와 일정 파트로 분리해 선택할 수 있도록 구성 */}
                    <section className="space-y-3">
                        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground">{UI_COPY.communitySearch.regionTitle}</h3>
                        <div className="flex flex-wrap gap-2">
                            {UI_COPY.communitySearch.regionKeywords.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => handleQuickSearch(item.value)}
                                    className={chipClassName}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* UserRequest: 추천 검색어를 지역 파트와 일정 파트로 분리해 선택할 수 있도록 구성 */}
                    <section className="border-t border-border/60 pt-4">
                        <section className="space-y-2">
                            <h4 className="text-xs text-muted-foreground">{UI_COPY.communitySearch.foodTitle}</h4>
                            <div className="flex flex-wrap gap-2">
                                {UI_COPY.communitySearch.foodKeywords.map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => handleQuickSearch(item.value)}
                                        className={chipClassName}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="mt-4 space-y-3 border-t border-border/60 pt-4">
                            <h4 className="text-xs text-muted-foreground">{UI_COPY.communitySearch.activityTitle}</h4>
                            <div className="flex flex-wrap gap-2">
                                {UI_COPY.communitySearch.activityKeywords.map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => handleQuickSearch(item.value)}
                                        className={chipClassName}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </section>
                    </section>
                </section>
            </main>
        </div>
    );
};

export default CommunitySearch;
