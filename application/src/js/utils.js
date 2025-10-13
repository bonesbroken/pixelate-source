export const defaultPixelSettings = {
    "factor": 1,
};

export function pixelateSource(settings) {
    if(!settings) return;
    const canvas = document.getElementById('pixelCanvas');
    if (!canvas) return;
    
    // Ensure canvas dimensions are properly set based on its container
    const container = canvas.parentElement;
    if (container && container.id === 'group') {
        canvas.width = 600;
        canvas.height = 600;
    } else {
        canvas.width = window.innerWidth || 800;
        canvas.height = window.innerHeight || 600;
    }
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const factor = settings && (settings["factor"] !== undefined && settings["factor"] !== null) ? settings["factor"] : defaultPixelSettings["factor"];

    if (settings.customImageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            ctx.clearRect(0, 0, width, height);
            
            // Calculate aspect ratios
            const canvasAspect = width / height;
            const imgAspect = img.width / img.height;
            
            let drawWidth, drawHeight, drawX, drawY;
            
            if (canvasAspect > imgAspect) {
                // Canvas is wider than image, fit to height
                drawHeight = height;
                drawWidth = drawHeight * imgAspect;
                drawX = (width - drawWidth) / 2;
                drawY = 0;
            } else {
                // Canvas is taller than image, fit to width
                drawWidth = width;
                drawHeight = drawWidth / imgAspect;
                drawX = 0;
                drawY = (height - drawHeight) / 2;
            }
            
            // Draw the image with proper aspect ratio
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

            if (factor > 1) {
                applyPixelationEffect(ctx, width, height, factor);
            }
        };
        
        img.src = settings.customImageUrl;
    } else {
        // Clear canvas if no custom image
        ctx.clearRect(0, 0, width, height);
    }
}

function applyPixelationEffect(ctx, width, height, factor) {
    console.log('factor', factor);
    // Get the current canvas data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Apply pixelation by averaging pixels in blocks
    const blockSize = factor;
    
    for (let y = 0; y < height; y += blockSize) {
        for (let x = 0; x < width; x += blockSize) {
            // Calculate the average color for this block
            let totalR = 0, totalG = 0, totalB = 0, totalA = 0;
            let pixelCount = 0;
            
            // Sample pixels in the block
            for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
                for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
                    const pixelIndex = ((y + dy) * width + (x + dx)) * 4;
                    totalR += data[pixelIndex];
                    totalG += data[pixelIndex + 1];
                    totalB += data[pixelIndex + 2];
                    totalA += data[pixelIndex + 3];
                    pixelCount++;
                }
            }
            
            // Calculate average color
            const avgR = Math.round(totalR / pixelCount);
            const avgG = Math.round(totalG / pixelCount);
            const avgB = Math.round(totalB / pixelCount);
            const avgA = Math.round(totalA / pixelCount);
            
            // Apply the average color to all pixels in the block
            for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
                for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
                    const pixelIndex = ((y + dy) * width + (x + dx)) * 4;
                    data[pixelIndex] = avgR;
                    data[pixelIndex + 1] = avgG;
                    data[pixelIndex + 2] = avgB;
                    data[pixelIndex + 3] = avgA;
                }
            }
        }
    }
    
    // Put the modified image data back to the canvas
    ctx.putImageData(imageData, 0, 0);
}
