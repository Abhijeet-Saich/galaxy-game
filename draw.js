//function to draw grid
export function draw_grid(ctx, minor, major, stroke, fill) {
    minor = minor || 10;
    major = major || minor * 5;
    stroke = stroke || "#00FF00";
    fill = fill || "#009900";
    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.fillStyle = fill;
    let width = ctx.canvas.width, height = ctx.canvas.height
    for (var x = 0; x < width; x += minor) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.lineWidth = (x % major == 0) ? 0.5 : 0.25;
        ctx.stroke();
        if (x % major == 0) { ctx.fillText(x, x, 10); }
    }
    for (var y = 0; y < height; y += minor) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.lineWidth = (y % major == 0) ? 0.5 : 0.25;
        ctx.stroke();
        if (y % major == 0) { ctx.fillText(y, 0, y + 10); }
    }
    ctx.restore();
}


//drawing function
export function draw_ship(ctx, radius, options) {
    options = options || {};
    let angle = (options.angle || 0.5 * Math.PI) / 2;
    // Now we have two curve arguments
    let curve1 = options.curve1 || 0.25;
    let curve2 = options.curve2 || 0.75;
    // the guide drawing code is getting complicated
    if (options.guide) {
        ctx.strokeStyle = "white";
        ctx.fillStyle = "white";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(
            Math.cos(-angle) * radius,
            Math.sin(-angle) * radius
        );
        ctx.lineTo(0, 0);
        ctx.lineTo(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
        );
        ctx.moveTo(-radius, 0);
        ctx.lineTo(0, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(
            Math.cos(angle) * radius * curve2,
            Math.sin(angle) * radius * curve2,
            radius / 40, 0, 2 * Math.PI
        );
        ctx.fill();
        ctx.beginPath();
        ctx.arc(
            Math.cos(-angle) * radius * curve2,
            Math.sin(-angle) * radius * curve2,
            radius / 40, 0, 2 * Math.PI
        );
        ctx.fill();
        ctx.beginPath();
        ctx.arc(radius * curve1 - radius, 0, radius / 50, 0, 2 * Math.PI);
        ctx.fill();
    }
    if (options.thruster) {
        ctx.save();
        ctx.strokeStyle = "yellow";
        ctx.fillStyle = "red";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(
            Math.cos(Math.PI + angle * 0.8) * radius / 2,
            Math.sin(Math.PI + angle * 0.8) * radius / 2
        )
        ctx.quadraticCurveTo(-radius * 2, 0,
            Math.cos(Math.PI - angle * 0.8) * radius / 2,
            Math.sin(Math.PI - angle * 0.8) * radius / 2
        );
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    if (options.reverse) {
        ctx.save();

        const deg45 = 45 * Math.PI / 180;

        let flameLength = radius * 0.55;
        let baseWidth = radius * 0.20;

        // GLOW SETTINGS FOR BLUR TRANSITION
        ctx.shadowColor = "cyan";
        ctx.shadowBlur = radius * 0.25;   // adjust this for more/less glow

        ctx.fillStyle = "blue";           // core
        ctx.strokeStyle = "cyan";         // outer edge
        ctx.lineWidth = 1.0;

        function drawCone(angle) {
            let Bx = Math.cos(angle) * 0.5*radius;
            let By = Math.sin(angle) * 0.5*radius;

            let nx = Math.cos(angle);
            let ny = Math.sin(angle);

            let tx = -ny;
            let ty = nx;

            let BLx = Bx + tx * baseWidth;
            let BLy = By + ty * baseWidth;

            let BRx = Bx - tx * baseWidth;
            let BRy = By - ty * baseWidth;

            let Tx = Bx + nx * flameLength;
            let Ty = By + ny * flameLength;

            ctx.beginPath();
            ctx.moveTo(BLx, BLy);
            ctx.lineTo(Tx, Ty);
            ctx.lineTo(BRx, BRy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        drawCone(+deg45);
        drawCone(-deg45);

        ctx.restore();
    }

    ctx.save();
    if (options.guide) {
        ctx.strokeStyle = "white";
        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
    }
    ctx.lineWidth = options.lineWidth || 2;
    ctx.strokeStyle = options.stroke || options.compromised && !options.guide ? "red" : "white";
    ctx.fillStyle = options.fill || "black";
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    // here we have the three curves
    ctx.quadraticCurveTo(
        Math.cos(angle) * radius * curve2,
        Math.sin(angle) * radius * curve2,
        Math.cos(Math.PI - angle) * radius,
        Math.sin(Math.PI - angle) * radius
    );
    ctx.quadraticCurveTo(-radius * curve1, 0,
        Math.cos(Math.PI + angle) * radius,
        Math.sin(Math.PI + angle) * radius
    );
    ctx.quadraticCurveTo(
        Math.cos(-angle) * radius * curve2,
        Math.sin(-angle) * radius * curve2,
        radius, 0
    );
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}
export function draw_asteriod(ctx, radius, shape, options) {
    options = options || {};
    ctx.strokeStyle = options.stroke || "white";
    ctx.fillStyle = options.fill || "black";
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < shape.length; i++) {
        ctx.rotate(2 * Math.PI / shape.length);
        ctx.lineTo(radius + radius * options.noise * shape[i], 0);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (options.guide) {
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.lineWidth = 0.2;
        ctx.arc(0, 0, radius + radius * options.noise, 0, 2 *
            Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, radius - radius * options.noise, 0, 2 *
            Math.PI);
        ctx.stroke();
    }
    ctx.restore();
}
export function draw_projectile(ctx, radius, lifetime) {
    ctx.save();
    ctx.fillStyle = "rgb(100%, 100%, " + (100 * lifetime) + "%)";
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
}