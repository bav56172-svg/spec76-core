import type { EntityId, IsoDateTime } from "./common";

export interface Equipment {
  id: EntityId;
  company_id: EntityId;
  equipment_name: string;
  created_at: IsoDateTime;
}

export type EquipmentCreateInput = Pick<Equipment, "equipment_name">;
