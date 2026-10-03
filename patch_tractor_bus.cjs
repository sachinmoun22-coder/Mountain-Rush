const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

const additionalMethods = `
    static drawTractor(ctx) {
        ctx.save();
        
        // Exhaust pipe
        ctx.fillStyle = '#424242';
        ctx.fillRect(15, -60, 6, 40);
        ctx.fillStyle = '#212121';
        ctx.fillRect(13, -65, 10, 5); // Exhaust tip
        
        // Smoke effect from exhaust based on time (simple placeholder shape)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(18, -75 + Math.sin(Date.now() / 200) * 5, 8, 0, Math.PI * 2);
        ctx.fill();

        // Main body (Classic Red Tractor)
        ctx.fillStyle = '#d32f2f'; // Red
        
        // Engine block (front)
        ctx.beginPath();
        ctx.roundRect(10, -25, 45, 30, 4);
        ctx.fill();
        ctx.stroke();

        // Grill
        ctx.fillStyle = '#eeeeee';
        ctx.fillRect(45, -20, 10, 20);
        ctx.fillStyle = '#212121';
        ctx.fillRect(48, -18, 4, 16);

        // Driver cabin base
        ctx.fillStyle = '#d32f2f';
        ctx.beginPath();
        ctx.roundRect(-40, -35, 40, 40, 5);
        ctx.fill();
        ctx.stroke();

        // Mudguards
        ctx.strokeStyle = '#d32f2f';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(-30, -5, 40, Math.PI, Math.PI * 2);
        ctx.stroke();

        // Steering wheel
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-10, -35);
        ctx.lineTo(-5, -45);
        ctx.stroke();
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.ellipse(-2, -47, 4, 8, Math.PI/4, 0, Math.PI*2);
        ctx.fill();

        // Driver Bill
        VehicleDraw.drawBillDriver(ctx, -20, -35, false);
        
        // Roof
        ctx.fillStyle = '#ffb04c'; // Yellow-ish roof
        ctx.fillRect(-45, -75, 45, 5);
        ctx.fillStyle = '#212121';
        ctx.fillRect(-40, -70, 4, 35); // Pillar

        ctx.restore();
    }

    static drawBus(ctx) {
        ctx.save();
        
        // Main body
        ctx.fillStyle = '#fbc02d'; // Classic School Bus Yellow
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 3;
        
        // Body shape
        ctx.beginPath();
        ctx.roundRect(-80, -55, 160, 75, 10);
        ctx.fill();
        ctx.stroke();

        // Windows
        ctx.fillStyle = '#81d4fa'; // Light blue glass
        for(let i = -70; i <= 40; i+= 30) {
            ctx.beginPath();
            ctx.roundRect(i, -45, 20, 25, 3);
            ctx.fill();
            ctx.stroke();
        }

        // Driver window (front)
        ctx.beginPath();
        ctx.roundRect(70, -45, 10, 25, 3);
        ctx.fill();
        ctx.stroke();

        // Black stripe
        ctx.fillStyle = '#212121';
        ctx.fillRect(-80, -10, 160, 5);

        // Lights
        ctx.fillStyle = '#d32f2f'; // Tail light
        ctx.fillRect(-80, 5, 5, 10);
        ctx.fillStyle = '#fff176'; // Headlight
        ctx.fillRect(75, 5, 5, 10);
        
        // Driver Bill
        VehicleDraw.drawBillDriver(ctx, 60, -20, false);

        ctx.restore();
    }
`;

code = code.replace('    // Hill Climb Racing Big Knobby Off-Road Wheel', additionalMethods + '\n    // Hill Climb Racing Big Knobby Off-Road Wheel');
fs.writeFileSync('game.js', code);
console.log('Patched tractor and bus');
