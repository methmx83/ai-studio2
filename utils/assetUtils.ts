
import { MediaType, AssetMetadata } from '../types';

export const getAssetMetadata = async (file: File, type: MediaType): Promise<{ thumbnailUrl: string; duration: number; metadata: AssetMetadata }> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const baseMetadata: AssetMetadata = {
      fileSize: file.size,
      mimeType: file.type,
    };
    
    if (type === MediaType.IMAGE) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imgAspect = img.width / img.height;
          const canvasAspect = canvas.width / canvas.height;
          let drawWidth = canvas.width;
          let drawHeight = canvas.height;
          let offsetX = 0;
          let offsetY = 0;

          if (imgAspect > canvasAspect) {
            drawHeight = canvas.width / imgAspect;
            offsetY = (canvas.height - drawHeight) / 2;
          } else {
            drawWidth = canvas.height * imgAspect;
            offsetX = (canvas.width - drawWidth) / 2;
          }

          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        }
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve({ 
          thumbnailUrl, 
          duration: 0, 
          metadata: { ...baseMetadata, width: img.width, height: img.height } 
        });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        resolve({ thumbnailUrl: '', duration: 0, metadata: baseMetadata });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } else if (type === MediaType.VIDEO) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      video.onloadedmetadata = () => {
        video.currentTime = 0.1; 
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const videoAspect = video.videoWidth / video.videoHeight;
          const canvasAspect = canvas.width / canvas.height;
          let drawWidth = canvas.width;
          let drawHeight = canvas.height;
          let offsetX = 0;
          let offsetY = 0;

          if (videoAspect > canvasAspect) {
            drawHeight = canvas.width / videoAspect;
            offsetY = (canvas.height - drawHeight) / 2;
          } else {
            drawWidth = canvas.height * videoAspect;
            offsetX = (canvas.width - drawWidth) / 2;
          }

          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
        }
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve({ 
          thumbnailUrl, 
          duration: video.duration, 
          metadata: { ...baseMetadata, width: video.videoWidth, height: video.videoHeight } 
        });
        URL.revokeObjectURL(url);
      };
      
      video.onerror = () => {
        resolve({ thumbnailUrl: '', duration: 0, metadata: baseMetadata });
        URL.revokeObjectURL(url);
      };
      video.src = url;
    } else if (type === MediaType.AUDIO) {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, '#1e3a8a');
          gradient.addColorStop(1, '#1e1b4b');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < canvas.width; i += 10) {
            const h = Math.random() * 60 + 20;
            ctx.moveTo(i, canvas.height / 2 - h / 2);
            ctx.lineTo(i, canvas.height / 2 + h / 2);
          }
          ctx.stroke();

          ctx.fillStyle = 'white';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('AUDIO ASSET', canvas.width / 2, canvas.height - 20);
        }
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve({ thumbnailUrl, duration: audio.duration, metadata: baseMetadata });
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        resolve({ thumbnailUrl: '', duration: 0, metadata: baseMetadata });
        URL.revokeObjectURL(url);
      };
      audio.src = url;
    } else {
      resolve({ thumbnailUrl: '', duration: 0, metadata: baseMetadata });
      URL.revokeObjectURL(url);
    }
  });
};
