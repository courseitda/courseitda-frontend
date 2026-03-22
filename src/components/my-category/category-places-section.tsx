import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SavedCategoryPlace, SearchedPlace } from '@/entities/types';
import { UI_COPY } from '@/shared/constants/ui-copy';
import { MapPin, PenLine, Search, X } from 'lucide-react';

type DisplayPlace = Pick<SavedCategoryPlace, 'id' | 'name' | 'addressName'>;

type CategoryPlacesSectionProps = {
  sectionTitle: string;
  placeCount: number;
  isEditing: boolean;
  isPending: boolean;
  canSubmit: boolean;
  submitLabel: string;
  pendingSubmitLabel: string;
  selectedPlaces: DisplayPlace[];
  detailPlaces: DisplayPlace[];
  placeQuery: string;
  placeResults: SearchedPlace[];
  placeSearchLoading: boolean;
  highlightedSearchPlaceId: string | null;
  focusedPlaceId: string | null;
  onPlaceQueryChange: (value: string) => void;
  onSearchPlaces: () => void | Promise<void>;
  onAddPlace: (place: SearchedPlace) => void;
  onSelectSearchPlace: (placeId: string) => void;
  onRemovePlace: (placeId: string) => void;
  onFocusPlace: (placeId: string) => void;
  onSubmit: () => void | Promise<void>;
  onStartEditing?: () => void;
  onCancelEditing?: () => void;
};

// UserRequest: 내 카테고리 생성/상세 페이지의 장소 편집 UI를 공통 컴포넌트로 통합한다.
export const CategoryPlacesSection = ({
  sectionTitle,
  placeCount,
  isEditing,
  isPending,
  canSubmit,
  submitLabel,
  pendingSubmitLabel,
  selectedPlaces,
  detailPlaces,
  placeQuery,
  placeResults,
  placeSearchLoading,
  highlightedSearchPlaceId,
  focusedPlaceId,
  onPlaceQueryChange,
  onSearchPlaces,
  onAddPlace,
  onSelectSearchPlace,
  onRemovePlace,
  onFocusPlace,
  onSubmit,
  onStartEditing,
  onCancelEditing,
}: CategoryPlacesSectionProps) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between gap-3">
      <p className="flex items-center gap-1.5 text-lg font-semibold">
        <MapPin className="h-4 w-4 text-primary" />
        {sectionTitle}
        <span className="text-xs text-muted-foreground">({placeCount}곳)</span>
      </p>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            {onCancelEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancelEditing}
                disabled={isPending}
              >
                {UI_COPY.myCategory.editorDialog.cancel}
              </Button>
            )}
            <Button
              type="button"
              // UserRequest: 장소 편집 섹션의 제출 버튼은 현재 페이지 문구 규칙을 그대로 유지한다.
              onClick={() => void onSubmit()}
              disabled={isPending || !canSubmit}
            >
              {isPending ? pendingSubmitLabel : submitLabel}
            </Button>
          </>
        ) : (
          onStartEditing && (
            <Button
              type="button"
              onClick={onStartEditing}
              className="gap-2 rounded-full"
            >
              <PenLine className="h-4 w-4" />
              {UI_COPY.myCategory.detailDialog.editAction}
            </Button>
          )
        )}
      </div>
    </div>

    {isEditing ? (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="max-h-[24vh] space-y-1 overflow-y-auto pr-1 md:max-h-[220px]">
            {selectedPlaces.length === 0 ? (
              <div className="flex min-h-24 items-center justify-center rounded-xl border-2 border-dashed border-border px-3 text-sm text-muted-foreground">
                {UI_COPY.myCategory.editorDialog.noPlacesSelected}
              </div>
            ) : (
              selectedPlaces.map((place) => (
                <Card key={place.id} className="border-border bg-card shadow-sm">
                  <div className="flex items-center">
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => onFocusPlace(place.id)}
                      >
                        <CardHeader className="flex-row items-center space-y-0 py-1.5">
                          <CardTitle className="flex flex-1 items-center gap-1.5 truncate text-base">
                            <MapPin className="h-4 w-4 shrink-0 text-primary" />
                            <span className="truncate">{place.name}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-1.5 pt-0">
                          <p className="truncate text-sm text-muted-foreground">{place.addressName}</p>
                        </CardContent>
                      </button>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="mr-2 shrink-0 self-center"
                      onClick={() => onRemovePlace(place.id)}
                      aria-label={UI_COPY.myCategory.editorDialog.removePlaceAriaLabel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">{UI_COPY.myCategory.editorDialog.placeSearchLabel}</p>
          <div className="flex min-w-0 items-center gap-2">
            <Input
              className="min-w-0 flex-1"
              placeholder={UI_COPY.myCategory.editorDialog.placeSearchPlaceholder}
              value={placeQuery}
              onChange={(event) => onPlaceQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void onSearchPlaces();
                }
              }}
            />
            <Button
              onClick={() => void onSearchPlaces()}
              disabled={placeSearchLoading}
              className="shrink-0 gap-2 px-3"
            >
              <Search className="h-4 w-4" />
              {UI_COPY.myCategory.editorDialog.searchAction}
            </Button>
          </div>
          {placeSearchLoading && (
            <div className="text-sm text-muted-foreground">{UI_COPY.myCategory.editorDialog.searching}</div>
          )}
          {!placeSearchLoading && placeResults.length > 0 && (
            <div className="max-h-[24vh] space-y-1 overflow-y-auto pr-1 md:max-h-[220px]">
              {placeResults.map((place) => {
                const isSelected = selectedPlaces.some((item) => item.id === place.id);

                return (
                  <Card key={place.id} className="border-border bg-card shadow-sm">
                    <button
                      type="button"
                      className={`flex w-full items-start gap-2.5 p-3 text-left transition-colors ${
                        highlightedSearchPlaceId === place.id ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => onSelectSearchPlace(place.id)}
                    >
                      <div className="mt-0.5 shrink-0 text-primary">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-medium">{place.name}</p>
                        <p className="break-words text-xs text-muted-foreground">{place.addressName}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={isSelected ? 'secondary' : 'outline'}
                        className="shrink-0"
                        onClick={(event) => {
                          event.stopPropagation();
                          onAddPlace(place);
                        }}
                        disabled={isSelected}
                      >
                        {isSelected
                          ? UI_COPY.myCategory.detailDialog.addCompleted
                          : UI_COPY.myCategory.editorDialog.addPlaceAction}
                      </Button>
                    </button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    ) : (
      <div className="max-h-[42vh] space-y-1 overflow-y-auto pr-1 md:max-h-none">
        {detailPlaces.length === 0 ? (
          <div className="flex min-h-24 items-center justify-center rounded-xl border-2 border-dashed border-border px-3 text-sm text-muted-foreground">
            {UI_COPY.myCategory.detailDialog.noPlacesInDetail}
          </div>
        ) : (
          detailPlaces.map((place) => (
            <Card
              key={place.id}
              className={`transition-colors ${
                focusedPlaceId === place.id
                  ? 'border-primary/30 bg-primary/5 shadow-sm ring-1 ring-primary/20'
                  : 'border-border bg-card shadow-sm hover:bg-accent/20'
              }`}
            >
              <button
                type="button"
                onClick={() => onFocusPlace(place.id)}
                className="w-full text-left"
              >
                <CardHeader className="cursor-pointer flex-row items-center space-y-0 py-1.5">
                  <CardTitle className="flex flex-1 items-center gap-1.5 truncate text-base">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{place.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-1.5 pt-0">
                  <p className="break-words text-sm text-muted-foreground">{place.addressName}</p>
                </CardContent>
              </button>
            </Card>
          ))
        )}
      </div>
    )}
  </section>
);
