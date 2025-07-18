import {
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

export const s3Client = new S3Client({
  region: process.env.REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "key",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "secret",
  },
});

const bucketName = process.env.BUCKET_NAME || "kings-chic";

export const saveFile = async (
  blob: Blob | undefined,
  parentFolder: string,
  keyString = ""
) => {
  try {
    if (!blob) {
      return { ok: false, filename: "" };
    }

    let hash =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    let extension = blob.type.split("/")[1];
    let filename =
      "uploads/" +
      parentFolder +
      "/" +
      blob.name +
      "." +
      hash +
      `${keyString ? `-${keyString}` : ""}` +
      "." +
      extension;

    // @ts-ignore
    const stream = Readable.from(blob.stream());

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: filename,
        Body: stream,
        ContentLength: blob.size,
      },
    });

    await upload.done();

    return { ok: true, filename };
  } catch (error) {
    console.error(error);
    return { ok: false, filename: "" };
  }
};

export const deleteFile = (key: any) => {
  try {
    s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
    return { ok: true };
  } catch (error) {
    console.error(error);
  }
};

export const deliverFile = async (filename: string) => {
  try {
    if (!bucketName || !filename) {
      throw new Error("Bucket name or filename is missing");
    }

    let url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: filename,
        ResponseContentDisposition: "inline",
        ResponseContentType: "application/octet-stream",
      }),
      {
        expiresIn: 3600,
      }
    );

    if (!url) {
      return {
        ok: false,
        data: [],
      };
    }

    return {
      data: url,
      ok: true,
    };
  } catch (error) {
    console.error("Error in deliverFile:", error);
    return {
      ok: false,
      data: [],
    };
  }
};

export const getAsBlob = async (filename: string) => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: filename,
    });

    const data = await s3Client.send(command);

    const stream = data.Body as Readable;
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    return {
      data: buffer,
      ok: true,
    };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      data: null,
    };
  }
};
