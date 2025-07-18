import { unlinkSync } from "node:fs";

export const saveFile = (blob: Blob | undefined, parentFolder: string) => {
  try {
    if (!blob) {
      return { ok: false, filename: "" };
    }

    const newBlob = new Blob([blob], {
      type: "image/png",
    });

    let hash =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    let filename =
      "uploads/" + parentFolder + "/" + hash + "." + blob.name.split('.').pop();
//@ts-ignore
    Bun.write(filename, newBlob);

    return { ok: true, filename };
  } catch (error) {
    console.error(error);
    return { ok: false, filename: "" };
  }
};


  export const deliverFile = (filename: any) => {
  return  `http://localhost:4000/view`;
  };

  export const deleteFile = async (filename: string, parentFolder: string) => {
    try {
      // The filename is already in the correct format: uploads/parentFolder/hash.extension
      console.log(`Attempting to delete file: ${filename}`);
      
      // Verify that the parentFolder matches the filename's folder
      const parts = filename.split('/');
      if (parts.length !== 3 || parts[0] !== 'uploads' || parts[1] !== parentFolder) {
        throw new Error(`Invalid filename format: ${filename}. Expected format: uploads/${parentFolder}/hash.extension`);
      }
      //@ts-ignore
      // Use asynchronous unlink
      await fs.unlink(filename);
      console.log(`Successfully deleted file: ${filename}`);
      return { ok: true };
    } catch (error) {
      console.error(`Error deleting file ${filename}:`, error);
      return { ok: false };
    }
  };

