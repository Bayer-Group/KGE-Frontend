export function Vector(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Vector.prototype.add = function (vector) {
    return new Vector(this.x + vector.x, this.y + vector.y);
};

Vector.prototype.subtract = function (vector) {
    return new Vector(this.x - vector.x, this.y - vector.y);
};

Vector.prototype.multiply = function (vector) {
    return new Vector(this.x * vector.x, this.y * vector.y);
};

Vector.prototype.multiplyScalar = function (scalar) {
    return new Vector(this.x * scalar, this.y * scalar);
};

Vector.prototype.divide = function (vector) {
    return new Vector(this.x / vector.x, this.y / vector.y);
};

Vector.prototype.divideScalar = function (scalar) {
    return new Vector(this.x / scalar, this.y / scalar);
};

Vector.prototype.length = function () {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
};

Vector.prototype.normalize = function () {
    return this.divideScalar(this.length());
};
