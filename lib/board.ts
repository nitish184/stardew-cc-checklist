import { fullContribution, type CheckedItems } from "./progress";
import type { BundleItem, Room } from "./schema";

/** Single global board. Reset clears every row with this id. */
export const BOARD_ID = "main";

export type CheckRow = {
  board_id: string;
  slot_id: string;
  checked_by: string;
  checked_at: string;
};

export type BoardState = Record<string, { checkedBy: string; checkedAt: string }>;

export type RemoteChange =
  | { eventType: "INSERT"; new: CheckRow }
  | { eventType: "UPDATE"; new: CheckRow }
  | { eventType: "DELETE"; old: CheckRow };

export function applyRemoteChange(state: BoardState, change: RemoteChange): BoardState {
  const next = { ...state };
  if (change.eventType === "DELETE") {
    delete next[change.old.slot_id];
  } else {
    next[change.new.slot_id] = {
      checkedBy: change.new.checked_by,
      checkedAt: change.new.checked_at,
    };
  }
  return next;
}

export function indexSlots(rooms: Room[]): Record<string, BundleItem> {
  const index: Record<string, BundleItem> = {};
  for (const room of rooms)
    for (const bundle of room.bundles)
      for (const slot of bundle.items) index[slot.id] = slot;
  return index;
}

/** Derive the quantity/quality progress input from which slots are checked. */
export function checkedItemsFromBoard(
  state: BoardState,
  index: Record<string, BundleItem>,
): CheckedItems {
  const checked: CheckedItems = {};
  for (const slotId of Object.keys(state)) {
    const slot = index[slotId];
    if (slot) checked[slotId] = fullContribution(slot);
  }
  return checked;
}
