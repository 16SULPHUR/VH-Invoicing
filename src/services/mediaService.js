import axios from "axios";
import { env } from "@/config/env";

export const mediaService = {
  async uploadImage(file) {
    if (!env.mediaUploadUrl) {
      throw new Error("VITE_MEDIA_UPLOAD_URL is not configured");
    }
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(env.mediaUploadUrl, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.url;
  },

  async uploadImages(files) {
    const urls = [];
    for (const file of files) {
      urls.push(await this.uploadImage(file));
    }
    return urls;
  },
};
