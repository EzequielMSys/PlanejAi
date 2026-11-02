export default async function prepareActivityPhoto(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Escolha uma foto JPG, PNG ou WEBP.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Escolha uma foto de até 10 MB ou recorte uma questão por vez.');
  const source = URL.createObjectURL(file)
  try {
    const image = new window.Image()
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('Não foi possível abrir esta foto. Tente outro arquivo.')); image.src = source })
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 60000000) throw new Error('A imagem é grande demais. Recorte a atividade antes de anexar.')
    const scale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Não foi possível preparar a foto neste navegador.')
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .9))
    // Re-encoding removes metadata and keeps multipart below Vercel's body limit.
    if (!blob || blob.size > 3 * 1024 * 1024) throw new Error('Recorte uma questão por vez para reduzir o tamanho da foto.')
    return blob
  } finally { URL.revokeObjectURL(source) }
}
