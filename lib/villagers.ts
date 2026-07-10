import raw from "@/data/villagers.json";
import { VillagersDatasetSchema } from "./schema";

export const villagersDataset = VillagersDatasetSchema.parse(raw);
