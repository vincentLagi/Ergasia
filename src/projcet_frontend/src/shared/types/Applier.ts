import { User } from "./User";

export interface ApplierPayload {
    user : User;
    appliedAt: BigInt;
}