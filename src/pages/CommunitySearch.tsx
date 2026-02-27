import type {FormEvent} from 'react';
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import SearchHeader from '@/components/layout/search-header';

const CommunitySearch = () => {
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState('');

    // UserRequest: 추천 검색어를 지역/일정 파트로 분리하고 이모티콘 라벨로 가독성을 높인다.
    const regionKeywords = [
        {value: '성수', label: '성수'},
        {value: '연남', label: '연남'},
        {value: '잠실', label: '잠실'},
        {value: '강남', label: '강남'},
    ];
    // UserRequest: 일정 검색어는 먹거리와 활동으로 분리해 빠르게 선택할 수 있게 구성한다.
    const foodKeywords = [
        {value: '점심', label: '점심'},
        {value: '저녁', label: '저녁'},
        {value: '카페', label: '카페'},
        {value: '브런치', label: '브런치'},
        {value: '디저트', label: '디저트'},
    ];
    // UserRequest: 일정 검색어는 먹거리와 활동으로 분리해 빠르게 선택할 수 있게 구성한다.
    const activityKeywords = [
        {value: '전시', label: '전시'},
        {value: '영화', label: '영화'},
        {value: '공방', label: '공방'},
        {value: '보드게임', label: '보드게임'},
        {value: '방탈출', label: '방탈출'},
    ];

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

            <main className="container mx-auto px-4 py-8 md:py-10">
                {/* UserRequest: 추천 검색어 영역은 상단 제목과 분류 카드를 분리해 더 깔끔하게 구성 */}
                <section className="max-w-2xl mx-auto space-y-5">
                    <h2 className="text-base font-semibold">추천 검색어</h2>

                    {/* UserRequest: 추천 검색어를 지역 파트와 일정 파트로 분리해 선택할 수 있도록 구성 */}
                    <section className="space-y-3">
                        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground">🗺️ 지역</h3>
                        <div className="flex flex-wrap gap-2">
                            {regionKeywords.map((item) => (
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
                            <h4 className="text-xs text-muted-foreground">🍽️ 식사</h4>
                            <div className="flex flex-wrap gap-2">
                                {foodKeywords.map((item) => (
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
                            <h4 className="text-xs text-muted-foreground">🎯 활동</h4>
                            <div className="flex flex-wrap gap-2">
                                {activityKeywords.map((item) => (
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
