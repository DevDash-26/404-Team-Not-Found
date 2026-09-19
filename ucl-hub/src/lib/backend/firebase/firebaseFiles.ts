/** Firebase Storage implementation of the `FileStore` port. */

import { deleteObject, getDownloadURL, ref, uploadBytes, type FirebaseStorage } from "firebase/storage";
import { fromFirebaseCode } from "@/utils/errors";
import type { FileStore, UploadedFile } from "../types";

export class FirebaseFileStore implements FileStore {
  constructor(private readonly storage: FirebaseStorage) {}

  async upload(path: string, file: Blob, contentType: string): Promise<UploadedFile> {
    try {
      const fileRef = ref(this.storage, path);
      await uploadBytes(fileRef, file, { contentType });
      return { url: await getDownloadURL(fileRef), path };
    } catch (error) {
      throw fromFirebaseCode((error as { code?: string }).code, error);
    }
  }

  async remove(path: string): Promise<void> {
    try {
      await deleteObject(ref(this.storage, path));
    } catch (error) {
      const code = (error as { code?: string }).code;
      // Removing something already gone is not an error worth surfacing.
      if (code !== "storage/object-not-found") throw fromFirebaseCode(code, error);
    }
  }
}
