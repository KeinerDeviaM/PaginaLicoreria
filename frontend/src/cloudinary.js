const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const assetFolder = import.meta.env.VITE_CLOUDINARY_FOLDER;

export function hasCloudinaryConfig() {
  return Boolean(cloudName && uploadPreset);
}

export async function uploadImageToCloudinary(file) {
  if (!hasCloudinaryConfig()) {
    throw new Error('Falta configurar Cloudinary en el archivo frontend/.env.');
  }

  if (!file) {
    throw new Error('Selecciona una imagen antes de subirla.');
  }

  if (!String(file.type || '').startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen valida.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  if (assetFolder) {
    formData.append('folder', assetFolder);
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Cloudinary no acepto la imagen.');
  }

  if (!data.secure_url) {
    throw new Error('Cloudinary no devolvio una URL valida.');
  }

  return {
    url: data.secure_url,
    publicId: data.public_id || ''
  };
}
