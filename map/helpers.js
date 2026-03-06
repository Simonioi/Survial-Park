// Helper functions for math, utilities, and drawing
const helpers = {
    radians: (deg) => deg * Math.PI / 180,
    
    degrees: (rad) => rad * 180 / Math.PI,
    
    random: (max) => Math.random() * max,
    
    randomColor: () => {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `rgb(${r},${g},${b})`;
    },
    
    distance: (x1, y1, x2, y2) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    checkCircleCollision: (x1, y1, r1, x2, y2, r2) => {
        const dist = helpers.distance(x1, y1, x2, y2);
        return dist < (r1 + r2);
    }
};

// Canvas drawing functions for 2D map
const draw = {
    clear: (ctx, width, height) => {
        ctx.clearRect(0, 0, width, height);
    },
    
    circle: (ctx, x, y, radius, color = '#000000', alpha = 1) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },
    
    polygon: (ctx, points, color = '#000000', type = 'fill') => {
        if (points.length < 2) return;
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.closePath();
        if (type === 'fill') {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }
};
