var idCounter = 0;

function MapRange(inValue, inMin, inMax, outMin, outMax)
{
    return (inValue - inMin) / (inMax - inMin) * (outMax - outMin) + outMin;
}

class Vector2
{
    constructor(x, y)
    {
        this.x = x === undefined ? 0 : x;
        this.y = y === undefined ? 0 : y;
    }
}

class Circle
{
    constructor(position, radius)
    {
        this.position = position;
        this.velocity = new Vector2(0, 0);
        this.acceleration = new Vector2(0, 0);
        this.radius = radius;
        this.id = idCounter++;
        this.movable = false;
    }

    Draw(context)
    {
        context.fillStyle = "black";
        context.beginPath();
        context.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
        context.stroke();
    }

    Update(circles)
    {
        if (!this.movable)
            return;

        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        for (var i = 0; i < circles.length; i++)
        {
            const circle = circles[i];

            if (this.id == circle.id)
                continue;

            const distance = Math.hypot(this.position.x - circle.position.x, this.position.y - circle.position.y);

            // Check for overlap.
            if (distance <= this.radius + circle.radius)
            {
                const overlap = (distance - this.radius - circle.radius);

                // Static collision.
                if (circle.movable)
                {
                    // Move this circle.
                    this.position.x -= overlap / 2 * (this.position.x - circle.position.x) / distance;
                    this.position.y -= overlap / 2 * (this.position.y - circle.position.y) / distance;

                    // Move other circle.
                    circle.position.x += overlap / 2 * (this.position.x - circle.position.x) / distance;
                    circle.position.y += overlap / 2 * (this.position.y - circle.position.y) / distance;
                }
                else
                {
                    // Move this circle only.
                    this.position.x -= overlap * (this.position.x - circle.position.x) / distance;
                    this.position.y -= overlap * (this.position.y - circle.position.y) / distance;
                }

                // Dynamic collision.

                const normal = new Vector2((circle.position.x - this.position.x) / distance,
                                           (circle.position.y - this.position.y) / distance);

                const tangent = new Vector2(-normal.y, normal.x);

                const thisTangentDotProduct = this.velocity.x * tangent.x + this.velocity.y * tangent.y;
                const otherTangentDotProduct = circle.velocity.x * tangent.x + circle.velocity.y * tangent.y;

                this.velocity.x = tangent.x * thisTangentDotProduct;
                this.velocity.y = tangent.y * thisTangentDotProduct;
                circle.velocity.x = tangent.x * otherTangentDotProduct;
                circle.velocity.y = tangent.y * otherTangentDotProduct;

                if (circle.movable)
                {
                    const thisNormalDotProduct = this.velocity.x * normal.x + this.velocity.y * normal.y;
                    const otherNormalDotProduct = circle.velocity.x * normal.x + circle.velocity.y * normal.y;

                    const thisMass = Math.pow(this.radius, 2) * Math.PI;
                    const otherMass = Math.pow(circle.radius, 2) * Math.PI;

                    const thisMomentum = (thisNormalDotProduct * (thisMass - otherMass) + 2 * otherMass * otherNormalDotProduct) / (thisMass + otherMass);
                    const otherMomentum = (otherNormalDotProduct * (otherMass - thisMass) + 2 * thisMass * thisNormalDotProduct) / (thisMass + otherMass);

                    this.velocity.x += normal.x * thisMomentum;
                    this.velocity.y += normal.y * thisMomentum;
                    circle.velocity.x += normal.x + otherMomentum;
                    circle.velocity.y += normal.y + otherMomentum;
                }
            }
        }
    }
}

class BeachballCircle extends Circle
{
    constructor(position, radius)
    {
        super(position, radius);

        this.movable = true;

        // Gravity.
        this.acceleration.y = .02;
    }
}

class PlayerCircle extends Circle
{
    constructor(position, radius)
    {
        super(position, radius);

        this.movable = true;

        // Gravity.
        this.acceleration.y = .02;

        this.leftPressed = false;
        this.rightPressed = false;

        document.addEventListener("keydown", event =>
        {
            event.preventDefault();

            if (event.keyCode == 37) this.leftPressed = true;
            if (event.keyCode == 39) this.rightPressed = true;
        });

        document.addEventListener("keyup", event =>
        {
            event.preventDefault();

            if (event.keyCode == 37) this.leftPressed = false;
            if (event.keyCode == 39) this.rightPressed = false;
        });
    }

    Update(circles)
    {
        if (this.leftPressed) this.velocity.x = -2;
        if (this.rightPressed) this.velocity.x = 2;

        super.Update(circles);
    }
}

const canvas = document.getElementById("game");
const context = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var circles = [];

const playerCircle = new PlayerCircle(new Vector2(50, 50), 25);
const playerCircleId = playerCircle.id;
circles.push(playerCircle);

for (var i = 0; i < canvas.width / 10; i++)
    circles.push(new Circle(new Vector2(i * 10, 400 + Math.sin(i * .1) * 100), 10));

for (var i = 0; i < 10; i++)
    circles.push(new BeachballCircle(new Vector2(i * canvas.width / 10, 0), 10));

setInterval(() =>
{
    // Reset transformation.
    context.setTransform(1, 0, 0, 1, 0, 0);

    // Clear canvas.
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Update.

    circles.forEach(circle =>
    {
        circle.Update(circles);    
    });

    const playerCirclePosition = circles.find((circle) =>
    {
        return circle.id == playerCircleId;
    }).position;

    // Camera effect.
    context.translate(-playerCirclePosition.x + canvas.width / 2, -playerCirclePosition.y + canvas.height / 2);

    // Draw.
    
    circles.forEach(circle =>
    {
        circle.Draw(context);
    });
}, 0);