import { updateUser } from "./update-user";

export async function deactivateUser(userId: string, accessToken?: string) {
  return updateUser(userId, { status: "nonaktif" }, accessToken);
}
