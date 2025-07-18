import * as crypto from "node:crypto";
import { Footer, Payload } from "paseto-ts/lib/types";
import { decrypt, encrypt, generateKeys } from "paseto-ts/v4";

class PasetoUtil {
  private static secretKey: string = process.env.PASETO_SECRET_KEY || "";
  private static adminSecretKey: string =
    process.env.PASETO_ADMIN_SECRET_KEY || "";

  private static getRandomValues(array: Uint8Array): Uint8Array {
    const bytes = crypto.randomBytes(array.length);
    array.set(bytes);
    return array;
  }

  public static getKey(): string {
    return generateKeys("local", {
      format: "paserk",
      getRandomValues: PasetoUtil.getRandomValues,
    });
  }

  public static async encodePaseto(
    payload: Record<string, string>,
    isAdmin: boolean = false
  ): Promise<string | null> {
    try {
      const key = isAdmin ? PasetoUtil.adminSecretKey : PasetoUtil.secretKey;
      return encrypt(key, payload, {
        addExp: false,
      });
    } catch (error) {
      console.error("Failed to encode Paseto token:", error);
      return null;
    }
  }

  public static async decodePaseto(
    token: string,
    isAdmin: boolean = false
  ): Promise<{
    payload: Payload & { [key: string]: any };
    footer: Footer | string;
  } | null> {
    try {
      const key = isAdmin ? PasetoUtil.adminSecretKey : PasetoUtil.secretKey;
      return decrypt(key, token);
    } catch (error) {
      console.error("Failed to decode Paseto token:", error);
      return null;
    }
  }
}

export { PasetoUtil };
