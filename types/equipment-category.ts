// OP-034: Public Equipment Catalog Foundation. Taxonomy from the original
// ТЗ (engineering/foundational/TZ_SPEC76_ORIGINAL.md, section 4.1), plus
// "other" for anything outside the 15 named categories.
export type EquipmentCategory =
  | "excavator"
  | "mini_excavator"
  | "dump_truck"
  | "truck_crane"
  | "manipulator"
  | "aerial_platform"
  | "loader"
  | "bulldozer"
  | "roller"
  | "grader"
  | "drilling_rig"
  | "lowboy_trailer"
  | "vacuum_truck"
  | "septic_truck"
  | "municipal_equipment"
  | "other";

export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  "excavator",
  "mini_excavator",
  "dump_truck",
  "truck_crane",
  "manipulator",
  "aerial_platform",
  "loader",
  "bulldozer",
  "roller",
  "grader",
  "drilling_rig",
  "lowboy_trailer",
  "vacuum_truck",
  "septic_truck",
  "municipal_equipment",
  "other",
];

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  excavator: "Экскаваторы",
  mini_excavator: "Мини-экскаваторы",
  dump_truck: "Самосвалы",
  truck_crane: "Автокраны",
  manipulator: "Манипуляторы",
  aerial_platform: "Автовышки",
  loader: "Погрузчики",
  bulldozer: "Бульдозеры",
  roller: "Катки",
  grader: "Грейдеры",
  drilling_rig: "Ямобуры",
  lowboy_trailer: "Тралы",
  vacuum_truck: "Илососы",
  septic_truck: "Ассенизаторы",
  municipal_equipment: "Коммунальная техника",
  other: "Прочая спецтехника",
};
