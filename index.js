import { draw_asteriod, draw_ship, draw_projectile, draw_grid } from './draw.js';


function collision(obj1, obj2) {
    return distance_between(obj1, obj2) < (obj1.radius + obj2.radius);
}

function distance_between(obj1, obj2) {
    return Math.sqrt(Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2));
}

let ctx = document.getElementById('canvas').getContext('2d');
ctx.canvas.setAttribute("tabindex", "1");
ctx.canvas.focus(); //canvas is not focused by default

function extend(Child, Parent) {
    let par = new Parent();
    Child.prototype = par;
    Child.prototype.constructor = Child;
    Child.prototype.super = Parent;
}


function Mass(x, y, mass, radius, x_speed, y_speed, angle, r_speed) {
    this.x = x;
    this.y = y;
    this.x_speed = x_speed || 0;   // by default object is at rest
    this.y_speed = y_speed || 0;
    this.mass = mass || 100;
    this.radius = radius || 20;    // default radius is 10pixels
    this.angle = angle || 0;                  // to change the oreintation of object when drawing on canvas
    this.r_speed = r_speed || 0;              // speed for rotation
}
//method to update the position of 'mass' object
Mass.prototype.update = function (elapsed) {
    this.x += elapsed * this.x_speed;  //changes made by object in every frame
    this.y += elapsed * this.y_speed;
    this.angle += elapsed * this.r_speed;
    this.angle %= 2 * Math.PI;
    //spawn on opp side when out of canvas
    // wrap around screen properly
    if (this.x > ctx.canvas.width + this.radius) this.x = -this.radius;
    if (this.x < -this.radius) this.x = ctx.canvas.width + this.radius;

    if (this.y > ctx.canvas.height + this.radius) this.y = -this.radius;
    if (this.y < -this.radius) this.y = ctx.canvas.height + this.radius;

}
// method to apply the thrust\recoil, responsible for changing x_speed and y_speed
Mass.prototype.push = function (angle, force) {
    this.x_speed += (force / this.mass) * Math.cos(angle);
    this.y_speed += (force / this.mass) * Math.sin(angle);
}
Mass.prototype.twist = function (force, elapsed) {
    this.angle += force * elapsed;
}



//creating ship class
function Ship(x, y, mass, radius, x_speed, y_speed) {
    this.super(x, y, mass, radius, x_speed, y_speed);
    this.health = 100;
    this.thrust = 2;
    this.thruster = false;
    this.reverse = false;
    this.taking_hit = false;
    this.steering_power = 3;
    this.right_thruster = false;
    this.left_thruster = false;
    this.trigger = false;
    this.recoil = 5;  // force applied when particle is shot
    this.loaded = false;
    this.reload_time = 0.25;
    this.time_until_reloaded = this.reload_time;
    this.compromised = false;
    this.max_health = 2.0;
    this.health = this.max_health;
}
extend(Ship, Mass);  //inheriting properties from Mass cons function
//function to draw ship
Ship.prototype.draw = function (c, guide) {
    c.save();
    c.translate(this.x, this.y);
    c.rotate(this.angle);
    c.strokeStyle = "white";
    c.lineWidth = 2;
    c.fillStyle = "black";
    if (this.compromised && guide) {
        c.save();
        c.fillStyle = "red";
        c.beginPath();
        c.arc(0, 0, this.radius, 0, 2 * Math.PI);
        c.fill();
        c.restore();
    }
    draw_ship(c, this.radius, {
        guide: guide,
        thruster: this.thruster,
        reverse: this.reverse,
        compromised: this.compromised,
    });
    c.restore();
}
Ship.prototype.update = function (elapsed) {
    if (this.thruster) this.push(this.angle, this.thrust, elapsed);  //update speeds when thrust is applied
    if (this.reverse) this.push(this.angle + Math.PI, this.thrust * 0.75, elapsed);  // to stop the forward motion of ship
    this.twist((this.right_thruster - this.left_thruster) * this.steering_power, elapsed);
    Mass.prototype.update.apply(this, arguments);
    //reloading
    this.loaded = this.time_until_reloaded === 0;
    if (!this.loaded) {
        this.time_until_reloaded -= Math.min(elapsed, this.time_until_reloaded)
    }
    if (this.compromised) this.health -= Math.min(elapsed, this.health);
}
Ship.prototype.projectile = function () {
    this.time_until_reloaded = this.reload_time;
    let p = new Projectile(0.025, 1, this.x + Math.cos(this.angle) * this.radius, this.y + Math.sin(this.angle) * this.radius);
    p.push(this.angle, this.recoil);
    this.push(this.angle + Math.PI, this.recoil);
    return p;
}



//creating particle class
function Projectile(mass, lifetime, x, y, x_speed, y_speed, r_speed) {
    var density = 0.001; // low density means we can see very light projectiles
    var radius = Math.sqrt((mass / density) / Math.PI);
    this.super(x, y, mass, radius, x_speed, y_speed, 0, r_speed);
    this.lifetime = lifetime;
    this.life = 1.0;
}
extend(Projectile, Mass);
//to update the position of projectile
Projectile.prototype.update = function (elapsed) {
    this.life -= elapsed / this.lifetime;
    Mass.prototype.update.apply(this, arguments);
}
// method to draw the projectile
Projectile.prototype.draw = function (c, guide) {
    c.save();
    c.translate(this.x, this.y);
    c.rotate(this.angle);
    draw_projectile(c, this.radius, this.life, guide);
    c.restore();
}



//creating asteroid class
function Asteroid(mass, x, y, radius, x_speed, y_speed) {
    this.super(x, y, mass, radius, x_speed, y_speed, 0, 5);
    this.circumference = 2 * Math.PI * this.radius;
    this.segments = Math.ceil(this.circumference / 15);
    this.segments = Math.min(25, Math.max(5, this.segments));    // randomizing no of segments
    this.noise = 0.2;
    this.shape = [];
    for (var i = 0; i < this.segments; i++) {
        this.shape.push(2 * (Math.random() - 0.5));   // shape array contains no_of_elements equals to segments
    }
}
extend(Asteroid, Mass);
//function to draw asteroid
Asteroid.prototype.draw = function (ctx, guide) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    draw_asteriod(ctx, this.radius, this.shape, {
        noise: this.noise,
        guide: guide
    });
    ctx.restore();
}
//function to move asteroid
Asteroid.prototype.move = function (elapsed) {
    this.update(elapsed);
}
Asteroid.prototype.child = function (mass) {
    return new Asteroid(mass, this.x, this.y, this.radius*0.75)
}


//indicator class
function Indicator(label, x, y, width, height) {
    this.label = label + ": ";
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}
Indicator.prototype.draw = function (c, max, level) {
    c.save();
    c.strokeStyle = "white";
    c.fillStyle = "white";
    c.font = this.height + "pt Arial";
    var offset = c.measureText(this.label).width;
    c.fillText(this.label, this.x, this.y + this.height - 1);
    c.beginPath();
    c.rect(offset + this.x, this.y, this.width, this.height);
    c.stroke();
    c.beginPath();
    c.rect(offset + this.x, this.y, this.width * (max / level), this.height);
    c.fill();
    c.restore()
}



//number indicator
function NumberIndicator(label, x, y, options) {
    options = options || {}
    this.label = label + ": ";
    this.x = x;
    this.y = y;
    this.digits = options.digits || 0;
    this.pt = options.pt || 10;
    this.align = options.align || 'end';
}
NumberIndicator.prototype.draw = function (c, value) {
    c.save();
    c.fillStyle = "white";
    c.font = this.pt + "pt Arial";
    c.textAlign = this.align;
    c.fillText(
        this.label + value.toFixed(this.digits),
        this.x, this.y + this.pt - 1
    );
    c.restore();
}



//final message display 
function Message(x, y, options) {
    options = options || {};
    this.x = x;
    this.y = y;
    this.main_pt = options.main_pt || 28;
    this.sub_pt = options.sub_pt || 18;
    this.fill = options.fill || "white";
    this.textAlign = options.align || 'center';
}
Message.prototype.draw = function (c, main, sub) {
    c.save();
    c.fillStyle = this.fill;
    c.textAlign = this.textAlign;
    c.font = this.main_pt + "pt Arial";
    c.fillText(main, this.x, this.y);
    c.font = this.sub_pt + "pt Arial";
    c.fillText(sub, this.x, this.y + this.main_pt);
    c.restore();
}


function AsteroidsGame(id) {
    this.canvas = document.getElementById(id);
    this.c = this.canvas.getContext("2d");
    this.canvas.focus();
    this.guide = false;
    this.game_over = false;
    this.level = 1; 
    this.message = new Message(this.canvas.width / 2, this.canvas.height * 0.4);
    this.score = 0;
    this.ship_mass = 1;
    this.ship_radius = 15;
    this.asteroid_mass = 5000; // Mass of asteroids
    this.mass_destroyed = 500;
    this.asteroid_push = 500000; // max force to apply in one frame
    this.ship = new Ship(
        this.canvas.width / 2,
        this.canvas.height / 2,
        this.ship_mass, this.ship_radius
    );
    this.projectiles = [];
    this.asteroids = [];
    this.asteroids.push(this.moving_asteroid());

    this.canvas.addEventListener("keydown", this.keyDown.bind(this), true);
    this.canvas.addEventListener("keyup", this.keyUp.bind(this), true);
    this.health_indicator = new Indicator("health", 5, 5, 100, 10);
    this.score_indicator = new NumberIndicator("score", this.canvas.width - 10, 5);
    this.fps_indicator = new NumberIndicator("fps", this.canvas.width - 10, this.canvas.height - 15, { digits: 2 });
    this.level_indicator = new NumberIndicator("level", this.canvas.width/2, 5, {align: "center"});

    window.requestAnimationFrame(this.frame.bind(this));
}
AsteroidsGame.prototype.moving_asteroid = function (elapsed) {
    var asteroid = this.new_asteroid();
    this.push_asteroid(asteroid, elapsed);
    return asteroid;
}
AsteroidsGame.prototype.new_asteroid = function () {
    return new Asteroid(
        this.asteroid_mass,
        this.canvas.width * Math.random(),
        this.canvas.height * Math.random(),
        40
    );
}
AsteroidsGame.prototype.push_asteroid = function (asteroid, elapsed) {
    elapsed = elapsed || 0.015;
    asteroid.push(2 * Math.PI * Math.random(), asteroid.mass * 100);
    asteroid.twist((Math.random() - 0.5) * Math.PI * this.asteroid_push * 0.02, elapsed);
}
AsteroidsGame.prototype.keyDown = function (e) {
    this.key_handler(e, true);
}
AsteroidsGame.prototype.keyUp = function (e) {
    this.key_handler(e, false);
}
AsteroidsGame.prototype.key_handler = function (e, value) {
    var nothing_handled = false;

    switch (e.key || e.keyCode) {
        case "ArrowLeft":
        case 37:
            this.ship.left_thruster = value;
            break;

        case "ArrowUp":
        case 38:
            this.ship.thruster = value;     // FIXED
            break;

        case "ArrowRight":
        case 39:
            this.ship.right_thruster = value;
            break;

        case "ArrowDown":
        case 40:
            this.ship.reverse = value;      // FIXED
            break;

        case " ":
        case 32:
            if(this.game_over) {
                this.reset_game();
            } else {
                this.ship.trigger = value;
            }
            break;

        case "g":
        case 71:
            if (value) this.guide = !this.guide;
            break;

        default:
            nothing_handled = true;
    }

    if (!nothing_handled) e.preventDefault();
}
AsteroidsGame.prototype.frame = function (timestamp) {
    if (!this.previous) this.previous = timestamp;
    var elapsed = timestamp - this.previous;
    this.fps = 1000 / elapsed;
    this.update(elapsed / 1000);
    this.draw();
    this.previous = timestamp;
    window.requestAnimationFrame(this.frame.bind(this));
}
AsteroidsGame.prototype.update = function (elapsed) {
    if(this.asteroids.length == 0) this.level_up();
    if(this.ship.health <= 0) {
        this.game_over = true;
        return;
    }
    this.ship.compromised = false;
    this.asteroids.forEach(function (asteroid) {
        asteroid.update(elapsed, this.c);
        if (collision(asteroid, this.ship)) {
            this.ship.compromised = true;
        }
    }, this);
    this.ship.update(elapsed, this.c);
    this.projectiles.forEach(function (p, i, projectiles) {
        p.update(elapsed, this.c);
        if (p.life <= 0) {
            projectiles.splice(i, 1);
        } else {
            // we check if any projectile is hitting the asteroid
            this.asteroids.forEach((asteroid, j, asteroids) => {
                if (collision(asteroid, p)) {
                    projectiles.splice(i, 1);   // remove that projectile
                    this.asteroids.splice(j, 1);  // remove that asteroid
                    this.split_asteroid(asteroid, elapsed);  // to split the asteroid
                }
            })
        }
    }, this);
    if (this.ship.trigger && this.ship.loaded) {
        this.projectiles.push(this.ship.projectile(elapsed));
    }
}
AsteroidsGame.prototype.draw = function () {
    this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.level_indicator.draw(this.c, this.level);
    if (this.guide) {
        draw_grid(this.c);
        this.asteroids.forEach(function (asteroid) {
            draw_line(this.c, asteroid, this.ship);
            this.projectiles.forEach(function (p) {
                draw_line(this.c, asteroid, p);
            }, this);
        }, this);
        this.fps_indicator.draw(this.c, this.fps);
    }
    this.asteroids.forEach(function (asteroid) {
        asteroid.draw(this.c, this.guide);
    }, this);
    if (this.game_over) {
        this.message.draw(this.c, "GAME OVER", "Press space to play again");
        return;
    };
    this.ship.draw(this.c, this.guide);
    this.projectiles.forEach(function (p) { p.draw(this.c); }, this);
    this.health_indicator.draw(this.c, this.ship.health, this.ship.max_health);
    this.score_indicator.draw(this.c, this.score);
}
AsteroidsGame.prototype.split_asteroid = function (asteroid, elapsed) {
    asteroid.mass -= this.mass_destroyed;
    this.score += this.mass_destroyed;
    var split = 0.25 + 0.5 * Math.random(); // split unevenly
    var ch1 = asteroid.child(asteroid.mass * split);
    var ch2 = asteroid.child(asteroid.mass * (1 - split));
    [ch1, ch2].forEach(function (child) {
        if (child.mass < this.mass_destroyed) {
            this.score += child.mass;
        } else {
            this.push_asteroid(child, elapsed);
            this.asteroids.push(child);
        }
    }, this);
}
AsteroidsGame.prototype.reset_game = function() {
    this.game_over = false;
    this.score = 0;
    this.level = 0;
    this.ship = new Ship(this.canvas.width / 2, this.canvas.height / 2, this.ship_mass, this.ship_radius);
    this.projectiles = [];
    this.asteroids = [];
    // this.level_up();
}
AsteroidsGame.prototype.level_up = function() {
    this.level += 1;
    for(var i = 0; i < this.level; i++) {
        this.asteroids.push(this.moving_asteroid());
    }
}
function draw_line(ctx, obj1, obj2) {
    ctx.save();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(obj1.x, obj1.y);
    ctx.lineTo(obj2.x, obj2.y);
    ctx.stroke();
    ctx.restore();
}

let game = new AsteroidsGame('canvas');