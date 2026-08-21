import { supabase } from "./supbase.js";

function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9._-]/g, "_");
}


export async function uploadArticleFile(articleId, file) {
  const safeName = sanitizeFileName(file.name);
  const filePath = `${articleId}/${safeName}`;

  const { error } = await supabase
    .storage
    .from("articles")
    .upload(filePath, file);

  if (error) throw error;

  return filePath;
}


export function getArticleFileUrl(filePath) {
  return supabase
    .storage
    .from("articles")
    .getPublicUrl(filePath)
    .data.publicUrl;
}
