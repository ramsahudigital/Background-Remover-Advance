// script.js
document.addEventListener('DOMContentLoaded', function() {
  const uploadSection = document.getElementById('uploadSection');
  const uploadBtn = document.getElementById('uploadBtn');
  const imageInput = document.getElementById('imageInput');
  const originalImage = document.getElementById('originalImage');
  const processedCanvas = document.getElementById('processedCanvas');
  const imageContainer = document.getElementById('imageContainer');
  const processBtn = document.getElementById('processBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const loading = document.getElementById('loading');
  
  // Advanced options
  const sensitivitySlider = document.getElementById('sensitivitySlider');
  const smoothnessSlider = document.getElementById('smoothnessSlider');
  const sensitivityValue = document.getElementById('sensitivityValue');
  const smoothnessValue = document.getElementById('smoothnessValue');
  
  // Update slider values
  sensitivitySlider.addEventListener('input', function() {
    sensitivityValue.textContent = this.value + '%';
  });
  
  smoothnessSlider.addEventListener('input', function() {
    smoothnessValue.textContent = this.value + '%';
  });
  
  // Upload button click
  uploadBtn.addEventListener('click', function() {
    imageInput.click();
  });
  
  // Drag and drop functionality
  uploadSection.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.style.borderColor = 'var(--accent-color)';
    this.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
  });
  
  uploadSection.addEventListener('dragleave', function() {
    this.style.borderColor = 'var(--primary-color)';
    this.style.backgroundColor = 'linear-gradient(135deg, rgba(67, 56, 202, 0.05), rgba(139, 92, 246, 0.05))';
  });
  
  uploadSection.addEventListener('drop', function(e) {
    e.preventDefault();
    this.style.borderColor = 'var(--primary-color)';
    this.style.backgroundColor = 'linear-gradient(135deg, rgba(67, 56, 202, 0.05), rgba(139, 92, 246, 0.05))';
    
    if (e.dataTransfer.files.length) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  });
  
  // File input change
  imageInput.addEventListener('change', function() {
    if (this.files.length) {
      handleImageUpload(this.files[0]);
    }
  });
  
  // Process button click
  processBtn.addEventListener('click', processImage);
  
  // Download button click
  downloadBtn.addEventListener('click', function() {
    const link = document.createElement('a');
    link.download = 'background-removed-image.png';
    link.href = processedCanvas.toDataURL('image/png');
    link.click();
  });
  
  function handleImageUpload(file) {
    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
      originalImage.src = e.target.result;
      imageContainer.style.display = 'flex';
      processBtn.style.display = 'block';
      
      // Reset canvas
      const ctx = processedCanvas.getContext('2d');
      ctx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
      
      // Hide download button until processing is complete
      downloadBtn.style.display = 'none';
    };
    
    reader.readAsDataURL(file);
  }
  
  function processImage() {
    // Show loading state
    loading.style.display = 'block';
    processBtn.disabled = true;
    processBtn.textContent = 'Processing...';
    
    // Simulate processing delay for demonstration
    setTimeout(() => {
      try {
        const img = originalImage;
        const canvas = processedCanvas;
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions to match image
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        // Draw the original image on canvas
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Get advanced options values
        const sensitivity = parseInt(sensitivitySlider.value) / 100;
        const smoothness = parseInt(smoothnessSlider.value) / 100;
        const preserveHair = document.getElementById('preserveHair').checked;
        const autoEnhance = document.getElementById('autoEnhance').checked;
        
        // Advanced background removal algorithm
        // This is a simplified version - in a real app, you'd use a more sophisticated algorithm or ML model
        
        // Calculate average background color (assuming corners are background)
        let bgR = 0, bgG = 0, bgB = 0;
        const samplePoints = [
          {x: 0, y: 0}, 
          {x: canvas.width-1, y: 0}, 
          {x: 0, y: canvas.height-1}, 
          {x: canvas.width-1, y: canvas.height-1},
          {x: Math.floor(canvas.width/2), y: 0},
          {x: Math.floor(canvas.width/2), y: canvas.height-1},
          {x: 0, y: Math.floor(canvas.height/2)},
          {x: canvas.width-1, y: Math.floor(canvas.height/2)}
        ];
        
        samplePoints.forEach(point => {
          const idx = (point.y * canvas.width + point.x) * 4;
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
        });
        
        bgR = Math.floor(bgR / samplePoints.length);
        bgG = Math.floor(bgG / samplePoints.length);
        bgB = Math.floor(bgB / samplePoints.length);
        
        // Process each pixel
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Calculate color difference from background
          const diff = Math.sqrt(
            Math.pow(r - bgR, 2) + 
            Math.pow(g - bgG, 2) + 
            Math.pow(b - bgB, 2)
          );
          
          // Dynamic threshold based on sensitivity
          const threshold = 30 + (70 * (1 - sensitivity));
          
          // Apply edge smoothing
          if (diff < threshold) {
            // Background pixel - make transparent
            data[i + 3] = 0;
          } else {
            // Foreground pixel
            if (autoEnhance) {
              // Enhance edges based on smoothness
              const edgeFactor = smoothness * 0.5;
              
              // Check neighboring pixels to smooth edges
              if (i > 4 && i < data.length - 4) {
                const prevTransparent = data[i - 1] === 0;
                const nextTransparent = data[i + 7] === 0; // Next pixel's alpha
                
                if (prevTransparent || nextTransparent) {
                  // Edge pixel - apply partial transparency based on smoothness
                  const alpha = Math.floor(255 * (0.5 + edgeFactor));
                  data[i + 3] = Math.max(data[i + 3], alpha);
                }
              }
            }
            
            // Preserve details like hair
            if (preserveHair) {
              // Detect fine details by checking for semi-transparent pixels
              if (diff < threshold * 1.5) {
                // Semi-transparent for fine details
                const alpha = Math.floor(255 * (diff / (threshold * 1.5)));
                data[i + 3] = Math.max(data[i + 3], alpha);
              }
            }
          }
        }
        
        // Apply the modified image data back to canvas
        ctx.putImageData(imageData, 0, 0);
        
        // Hide loading state
        loading.style.display = 'none';
        processBtn.disabled = false;
        processBtn.textContent = 'Remove Background';
        
        // Show download button
        downloadBtn.style.display = 'block';
        
        // Add success animation
        downloadBtn.style.transform = 'scale(1.1)';
        setTimeout(() => {
          downloadBtn.style.transform = 'scale(1)';
        }, 300);
        
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Error processing image. Please try again.');
        loading.style.display = 'none';
        processBtn.disabled = false;
        processBtn.textContent = 'Remove Background';
      }
    }, 1500); // Simulate processing time
  }
});
