export const BOARD_ID = "main";

export type GiftRow = {
  board_id: string;
  villager_id: string;
  given_by: string;
  given_at: string;
};

/** villager id -> { giver name -> given_at } */
export type GiftState = Record<string, Record<string, string>>;

export type GiftChange =
  | { eventType: "INSERT"; new: GiftRow }
  | { eventType: "UPDATE"; new: GiftRow }
  | { eventType: "DELETE"; old: GiftRow };

export function applyGiftChange(state: GiftState, change: GiftChange): GiftState {
  const next = { ...state };
  if (change.eventType === "DELETE") {
    const { villager_id, given_by } = change.old;
    if (!next[villager_id]) return next;
    const givers = { ...next[villager_id] };
    delete givers[given_by];
    if (Object.keys(givers).length === 0) delete next[villager_id];
    else next[villager_id] = givers;
  } else {
    const { villager_id, given_by, given_at } = change.new;
    next[villager_id] = { ...next[villager_id], [given_by]: given_at };
  }
  return next;
}

export function giftersOf(state: GiftState, villagerId: string): string[] {
  return Object.keys(state[villagerId] ?? {});
}
