// 현지 체험 카테고리. 항목을 추가·수정하면 등록 화면과 목록 필터에 자동 반영됩니다.
export const EXPERIENCE_CATEGORIES = [
  { value: "TOUR", label: "현지 투어" },
  { value: "FOOD", label: "맛집 동행" },
  { value: "INTERPRETER", label: "통역 동행" },
  { value: "PHOTO", label: "사진 촬영" },
] as const;

export type ExperienceCategory = (typeof EXPERIENCE_CATEGORIES)[number]["value"];

export const CATEGORY_VALUES = EXPERIENCE_CATEGORIES.map((c) => c.value) as [ExperienceCategory, ...ExperienceCategory[]];

export function categoryLabel(value: string): string {
  return EXPERIENCE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
