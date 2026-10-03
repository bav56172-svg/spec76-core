import type { EntityId, IsoDateTime } from "./common";
import type { EquipmentCategory } from "./equipment-category";

export type EquipmentStatus = "draft" | "published" | "archived";

export interface Equipment {
  id: EntityId;
  company_id: EntityId;
  equipment_name: string;
  category: EquipmentCategory | null;
  price_hour: number | null;
  price_shift: number | null;
  description: string | null;
  cover_photo_path: string | null;
  status: EquipmentStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type EquipmentCreateInput = Pick<Equipment, "equipment_name">;

// OP-034: fields a company can edit after creating the equipment row —
// everything needed to turn a bare "Моя техника" entry into a publishable
// catalog listing.
export type EquipmentUpdateInput = Partial<
  Pick<
    Equipment,
    | "category"
    | "price_hour"
    | "price_shift"
    | "description"
    | "cover_photo_path"
    | "status"
  >
>;
