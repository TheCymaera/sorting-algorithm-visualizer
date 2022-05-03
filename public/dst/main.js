(function () {
    'use strict';

    class Memory {
        arrays;
        constructor(values) {
            this.arrays = values.map(i => i.slice());
        }
        clone() {
            return new Memory(this.arrays);
        }
        get(path) {
            return this.arrays[path.id][path.index];
        }
        write(path, value) {
            this.arrays[path.id][path.index] = value;
        }
    }
    class MemoryPath {
        id;
        index;
        constructor(id, index) {
            this.id = id;
            this.index = index;
        }
        toString() {
            return `${this.id}:${this.index}`;
        }
    }

    class Allocator {
        constructor(data, stream) {
            this.#data = data;
            this.#emitter = stream;
        }
        getArray(id) {
            const out = [];
            for (let i = 0; i < this.#data.arrays[id].length; i++) {
                out.push(new AddressEditor(this.#data, new MemoryPath(id, i), this.#emitter));
            }
            return out;
        }
        createArray(length) {
            this.#emitter.emit(new CreateArrayEvent(length).applyTo(this.#data));
            return this.getArray(this.#data.arrays.length - 1);
        }
        createVector() {
            this.#emitter.emit(new CreateArrayEvent(length).applyTo(this.#data));
            return new VectorEditor(this.#data, this.#data.arrays.length - 1, this.#emitter);
        }
        #data;
        #emitter;
    }
    class VectorEditor {
        constructor(memory, id, stream) {
            this.#memory = memory;
            this.#id = id;
            this.#stream = stream;
        }
        get(index) {
            return new AddressEditor(this.#memory, new MemoryPath(this.#id, index), this.#stream);
        }
        push(value) {
            const index = this.#memory.arrays[this.#id].length;
            this.#stream.emit(new SetEvent(new MemoryPath(this.#id, index), value).applyTo(this.#memory));
            return this.get(index);
        }
        toArray() {
            const out = [];
            for (let i = 0; i < this.#memory.arrays[this.#id].length; i++) {
                out.push(this.get(i));
            }
            return out;
        }
        #memory;
        #id;
        #stream;
    }
    class AddressEditor {
        constructor(data, path, emitter) {
            this.#data = data;
            this.#path = path;
            this.#emitter = emitter;
        }
        read() {
            this.#emitter.emit(new GetEvent(this.#path).applyTo(this.#data));
            return this.#data.get(this.#path);
        }
        write(value) {
            this.#emitter.emit(new SetEvent(this.#path, value).applyTo(this.#data));
        }
        copy(other) {
            this.#emitter.emit(new CopyEvent(this.#path, other.#path).applyTo(this.#data));
        }
        swap(other) {
            this.#emitter.emit(new SwapEvent(this.#path, other.#path).applyTo(this.#data));
        }
        lessThan(other) {
            this.#emitter.emit(new CompareEvent(this.#path, other.#path).applyTo(this.#data));
            return this.#data.get(this.#path) < this.#data.get(other.#path);
        }
        greaterThan(other) {
            this.#emitter.emit(new CompareEvent(this.#path, other.#path).applyTo(this.#data));
            return this.#data.get(this.#path) > this.#data.get(other.#path);
        }
        lessThanOrEqualTo(other) {
            this.#emitter.emit(new CompareEvent(this.#path, other.#path).applyTo(this.#data));
            return this.#data.get(this.#path) <= other.#data.get(other.#path);
        }
        greaterThanOrEqualTo(other) {
            this.#emitter.emit(new CompareEvent(this.#path, other.#path).applyTo(this.#data));
            return this.#data.get(this.#path) >= other.#data.get(other.#path);
        }
        #data;
        #path;
        #emitter;
    }
    class CreateArrayEvent {
        length;
        constructor(length) {
            this.length = length;
        }
        applyTo(memory) {
            memory.arrays.push(new Array(this.length).fill(0));
            return this;
        }
    }
    class GetEvent {
        path;
        constructor(path) {
            this.path = path;
        }
        applyTo(_memory) {
            // do nothing
            return this;
        }
    }
    class SetEvent {
        path;
        value;
        constructor(path, value) {
            this.path = path;
            this.value = value;
        }
        applyTo(memory) {
            memory.write(this.path, this.value);
            return this;
        }
    }
    class CompareEvent {
        lhs;
        rhs;
        constructor(lhs, rhs) {
            this.lhs = lhs;
            this.rhs = rhs;
        }
        applyTo(_memory) {
            // do nothing
            return this;
        }
    }
    class CopyEvent {
        lhs;
        rhs;
        constructor(lhs, rhs) {
            this.lhs = lhs;
            this.rhs = rhs;
        }
        applyTo(data) {
            data.write(this.lhs, data.get(this.rhs));
            return this;
        }
    }
    class SwapEvent {
        lhs;
        rhs;
        constructor(lhs, rhs) {
            this.lhs = lhs;
            this.rhs = rhs;
        }
        applyTo(memory) {
            const lhs = memory.get(this.lhs);
            const rhs = memory.get(this.rhs);
            memory.write(this.lhs, rhs);
            memory.write(this.rhs, lhs);
            return this;
        }
    }

    /**
     * A resource that needs to be disposed, such as an event listener.
     * @example
     * const id = setInterval(callback, 1000);
     * return new Disposable(()=>clearInterval(id));
     */
    class Disposable {
        constructor(dispose) {
            this.dispose = dispose;
        }
        dispose() {
            // do nothing
        }
        static is(value) {
            return value && "dispose" in value;
        }
        static all(...disposables) {
            return new Disposable(() => {
                for (const disposable of disposables) {
                    if (Disposable.is(disposable))
                        disposable.dispose();
                }
            });
        }
        static empty = new Disposable(() => undefined);
    }

    /**
     * Duration
     */
    class Duration {
        milliseconds;
        constructor({ milliseconds = 0, seconds = 0, minutes = 0, hours = 0, days = 0, weeks = 0 }) {
            this.milliseconds = (milliseconds +
                seconds * Duration.millisecondsPerSecond +
                minutes * Duration.millisecondsPerMinute +
                hours * Duration.millisecondsPerHour +
                days * Duration.millisecondsPerDay +
                weeks * Duration.millisecondsPerWeek);
        }
        set seconds(value) {
            this.milliseconds = value * Duration.millisecondsPerSecond;
        }
        get seconds() {
            return this.milliseconds / Duration.millisecondsPerSecond;
        }
        set minutes(value) {
            this.milliseconds = value * Duration.millisecondsPerMinute;
        }
        get minutes() {
            return this.milliseconds / Duration.millisecondsPerMinute;
        }
        set hours(value) {
            this.milliseconds = value * Duration.millisecondsPerHour;
        }
        get hours() {
            return this.milliseconds / Duration.millisecondsPerHour;
        }
        set days(value) {
            this.milliseconds = value * Duration.millisecondsPerDay;
        }
        get days() {
            return this.milliseconds / Duration.millisecondsPerDay;
        }
        set weeks(value) {
            this.milliseconds = value * Duration.millisecondsPerWeek;
        }
        get weeks() {
            return this.milliseconds / Duration.millisecondsPerWeek;
        }
        get weeksPart() {
            return Math.floor(this.milliseconds / Duration.millisecondsPerWeek);
        }
        get daysPart() {
            return Math.floor(this.milliseconds / Duration.millisecondsPerDay);
        }
        get hoursPart() {
            return Math.floor((this.milliseconds % Duration.millisecondsPerDay) / Duration.millisecondsPerHour);
        }
        get minutesPart() {
            return Math.floor((this.milliseconds % Duration.millisecondsPerHour) / Duration.millisecondsPerMinute);
        }
        get secondsPart() {
            return Math.floor((this.milliseconds % Duration.millisecondsPerMinute) / Duration.millisecondsPerSecond);
        }
        get millisecondsPart() {
            return this.milliseconds % Duration.millisecondsPerSecond;
        }
        clone() {
            return new Duration({ milliseconds: this.milliseconds });
        }
        abs() {
            this.milliseconds = Math.abs(this.milliseconds);
            return this;
        }
        toString() {
            const abs = this.clone().abs();
            return `${this.daysPart}:${abs.hoursPart}:${abs.minutesPart}:${abs.secondsPart}:${abs.millisecondsPart}`;
        }
        static millisecondsPerSecond = 1000;
        static millisecondsPerMinute = Duration.millisecondsPerSecond * 60;
        static millisecondsPerHour = Duration.millisecondsPerMinute * 60;
        static millisecondsPerDay = Duration.millisecondsPerHour * 24;
        static millisecondsPerWeek = Duration.millisecondsPerDay * 7;
    }

    class Emitter {
        addListener(listener) {
            this.#listeners.add(listener);
            return new Disposable(() => this.removeListener(listener));
        }
        removeListener(listener) {
            this.#listeners.delete(listener);
        }
        addOnceListener(listener) {
            const onceListener = (value) => {
                this.removeListener(onceListener);
                listener(value);
            };
            return this.addListener(onceListener);
        }
        [Symbol.asyncIterator]() {
            return new Emitter.Queue(this);
        }
        Emit(value) {
            for (const listener of this.#listeners)
                listener(value);
        }
        #listeners = new Set();
    }
    (function (Emitter) {
        class Queue {
            onQueueShifted = new CustomEmitter;
            constructor(stream) {
                this.#queue = [];
                this.#stream = stream;
                stream.addListener(value => this.#queue.push(value));
            }
            [Symbol.asyncIterator]() {
                return this;
            }
            isEmpty() {
                return this.#queue.length === 0;
            }
            async next() {
                if (this.#queue.length === 0)
                    await new Promise(resolve => this.#stream.addOnceListener(resolve));
                this.onQueueShifted.emit();
                return { done: false, value: this.#queue.shift() };
            }
            #stream;
            #queue;
        }
        Emitter.Queue = Queue;
    })(Emitter || (Emitter = {}));
    class CustomEmitter extends Emitter {
        emit(value) {
            super.Emit(value);
        }
    }

    /**
     * Timer
     */
    class Timer {
        _handle;
        dispose() {
            clearInterval(this._handle);
        }
        /**
         * Returns a promise that resolves after a specified duration.
         * @example
         * console.log("IE: I'll only take a moment.");
         * await Timer.delayed(new Duration({hour: 1}));
         * console.log("IE: Complete!");
         */
        static schedule(duration) {
            return new Promise(resolve => setTimeout(resolve, duration.milliseconds));
        }
        /**
         * Returns a repeating timer.
         * @example
         * Timer.periodic(new Duration({seconds: 1}), ()=>console.log("Tick"));
         */
        static periodic(duration, callback) {
            return new Timer(setInterval(() => {
                callback.call(this);
            }, duration.milliseconds));
        }
        constructor(_handle) {
            this._handle = _handle;
        }
    }

    class Vec2 {
        x;
        y;
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        clone() {
            return new Vec2(this.x, this.y);
        }
        length() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }
        distanceTo(other) {
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
        angleTo(other) {
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            return Math.atan2(dy, dx);
        }
        normalize() {
            const length = this.length();
            if (length > 0) {
                this.x /= length;
                this.y /= length;
            }
            return this;
        }
        copy(other) {
            this.x = other.x;
            this.y = other.y;
            return this;
        }
        add(other) {
            this.x += other.x;
            this.y += other.y;
            return this;
        }
        subtract(other) {
            this.x -= other.x;
            this.y -= other.y;
            return this;
        }
        multiply(scale) {
            this.x *= scale;
            this.y *= scale;
            return this;
        }
        rotate(angle) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const x = this.x;
            const y = this.y;
            this.x = x * cos - y * sin;
            this.y = x * sin + y * cos;
            return this;
        }
        toString() {
            return `Vec2(${this.x.toFixed(3)}, ${this.y.toFixed(3)})`;
        }
        static zero = Object.freeze(new Vec2(0, 0));
    }

    class Circle {
        center;
        radius;
        constructor(center, radius) {
            this.center = center;
            this.radius = radius;
        }
        static zero = Object.freeze(new Circle(Vec2.zero, 0));
    }

    class Path {
        origin = new Vec2(0, 0);
        segments = [];
        setOrigin(origin) {
            this.origin = origin;
            return this;
        }
        lineTo(point) {
            this.segments.push(new Path.LineTo(point));
            return this;
        }
        close() {
            this.segments.push(new Path.Close());
            return this;
        }
    }
    (function (Path) {
        class LineTo {
            point;
            constructor(point) {
                this.point = point;
            }
        }
        Path.LineTo = LineTo;
        class Close {
            constructor() { }
        }
        Path.Close = Close;
    })(Path || (Path = {}));

    class Rect {
        x1;
        y1;
        x2;
        y2;
        constructor(x1, y1, x2, y2) {
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
        }
        static zero = Object.freeze(new Rect(0, 0, 0, 0));
        static fromPoints(p1, p2) {
            return new Rect(p1.x, p1.y, p2.x, p2.y);
        }
        static fromCenter(center, xSize, ySize) {
            const x1 = center.x - xSize / 2;
            const y1 = center.y - ySize / 2;
            return new Rect(x1, y1, x1 + xSize, y1 + ySize);
        }
        static fromDimensions(x, y, width, height) {
            return new Rect(x, y, x + width, y + height);
        }
        static fromCoordinates(x1, y1, x2, y2) {
            return new Rect(x1, y1, x2, y2);
        }
        get width() {
            return this.x2 - this.x1;
        }
        get height() {
            return this.y2 - this.y1;
        }
        set width(value) {
            this.x2 = this.x1 + value;
        }
        set height(value) {
            this.y2 = this.y1 + value;
        }
        get center() {
            return new Vec2((this.x1 + this.x2) / 2, (this.y1 + this.y2) / 2);
        }
        set center(value) {
            const width = this.width;
            const height = this.height;
            this.x1 = value.x - width / 2;
            this.y1 = value.y - height / 2;
            this.x2 = value.x + width / 2;
            this.y2 = value.y + height / 2;
        }
        get minX() {
            return Math.min(this.x1, this.x2);
        }
        get minY() {
            return Math.min(this.y1, this.y2);
        }
        get maxX() {
            return Math.max(this.x1, this.x2);
        }
        get maxY() {
            return Math.max(this.y1, this.y2);
        }
        toString() {
            return `Rect(${this.x1.toFixed(3)}, ${this.y1.toFixed(3)}, ${this.width.toFixed(3)}, ${this.height.toFixed(3)})`;
        }
        static mapPointOnto(i, point, o) {
            const x = (point.x - i.x1) / (i.x2 - i.x1) * (o.x2 - o.x1) + o.x1;
            const y = (point.y - i.y1) / (i.y2 - i.y1) * (o.y2 - o.y1) + o.y1;
            return new Vec2(x, y);
        }
        static mapRectOnto(i, r, o) {
            return Rect.fromPoints(Rect.mapPointOnto(i, new Vec2(r.x1, r.y1), o), Rect.mapPointOnto(i, new Vec2(r.x2, r.y2), o));
        }
    }

    class AnimationFrameScheduler {
        constructor(callback) {
            this.#callback = callback;
            this.#handle = requestAnimationFrame(this.#onAnimationFrame);
            this.#oldTime = performance.now();
        }
        dispose() {
            cancelAnimationFrame(this.#handle);
        }
        static schedule() {
            const oldTime = performance.now();
            return new Promise(resolve => requestAnimationFrame(() => resolve(new Duration({ milliseconds: performance.now() - oldTime }))));
        }
        static periodic(callback) {
            return new AnimationFrameScheduler(callback);
        }
        #onAnimationFrame = () => {
            const oldTime = this.#oldTime;
            this.#oldTime = performance.now();
            this.#callback(new Duration({ milliseconds: this.#oldTime - oldTime }));
            this.#handle = requestAnimationFrame(this.#onAnimationFrame);
        };
        #oldTime;
        #handle;
        #callback;
    }

    class Color {
        r;
        g;
        b;
        a;
        static fromRGBA(r, g, b, a) {
            return new Color(r, g, b, a);
        }
        static black = Object.freeze(new Color(0, 0, 0, 255));
        static white = Object.freeze(new Color(255, 255, 255, 255));
        static transparent = Object.freeze(new Color(0, 0, 0, 0));
        constructor(r, g, b, a) {
            this.r = r | 0;
            this.g = g | 0;
            this.b = b | 0;
            this.a = a | 0;
        }
        toString() {
            return "#" +
                this.r.toString(16).padStart(2, "0") +
                this.g.toString(16).padStart(2, "0") +
                this.b.toString(16).padStart(2, "0") +
                this.a.toString(16).padStart(2, "0");
        }
    }

    class PathStyle {
        color;
        width;
        cap;
        join;
        miterLimit;
        constructor({ color = Color.transparent, width = 1, cap = PathStyle.Cap.Butt, join = PathStyle.Join.Miter, miterLimit = 10, } = {}) {
            this.color = color;
            this.width = width;
            this.cap = cap;
            this.join = join;
            this.miterLimit = miterLimit;
        }
    }
    (function (PathStyle) {
        (function (Cap) {
            Cap[Cap["Butt"] = 0] = "Butt";
            Cap[Cap["Round"] = 1] = "Round";
            Cap[Cap["Square"] = 2] = "Square";
        })(PathStyle.Cap || (PathStyle.Cap = {}));
        (function (Join) {
            Join[Join["Miter"] = 0] = "Miter";
            Join[Join["Round"] = 1] = "Round";
            Join[Join["Bevel"] = 2] = "Bevel";
        })(PathStyle.Join || (PathStyle.Join = {}));
    })(PathStyle || (PathStyle = {}));

    class ShapeStyle {
        stroke;
        fillColor;
        constructor({ stroke = new PathStyle(), fillColor = Color.transparent } = {}) {
            this.stroke = stroke;
            this.fillColor = fillColor;
        }
    }

    class Canvas2DRenderer {
        ctx;
        constructor(ctx) {
            this.ctx = ctx;
        }
        static fromCanvas(canvas) {
            return new Canvas2DRenderer(canvas.getContext("2d"));
        }
        static sampleCSSColor(color) {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 1;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);
            const result = ctx.getImageData(0, 0, 1, 1).data;
            return Color.fromRGBA(result[0], result[1], result[2], result[3]);
        }
        viewportRect() {
            return this.#viewportRect;
        }
        setViewportRect(viewRect) {
            this.#viewportRect = viewRect;
        }
        clientRect() {
            return Rect.fromCoordinates(0, this.ctx.canvas.clientHeight, this.ctx.canvas.clientWidth, 0);
        }
        bitmapRect() {
            return Rect.fromCoordinates(0, this.ctx.canvas.height, this.ctx.canvas.width, 0);
        }
        clear() {
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        }
        drawLine(point1, point2, style) {
            const p1 = Rect.mapPointOnto(this.#viewportRect, point1, this.bitmapRect());
            const p2 = Rect.mapPointOnto(this.#viewportRect, point2, this.bitmapRect());
            this.#setPathStyle(style);
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
        }
        drawPath(path, style) {
            this.#setPathStyle(style);
            this.#usePath(path);
            this.ctx.stroke();
        }
        drawCircle(circle, style) {
            const center = Rect.mapPointOnto(this.#viewportRect, circle.center, this.bitmapRect());
            const radius = circle.radius * this.ctx.canvas.width / this.#viewportRect.width;
            this.#setShapeStyle(style);
            this.ctx.beginPath();
            this.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();
        }
        drawRect(rect, style) {
            const mappedRect = Rect.mapRectOnto(this.#viewportRect, rect, this.bitmapRect());
            this.#setShapeStyle(style);
            this.ctx.beginPath();
            this.ctx.rect(mappedRect.x1, mappedRect.y1, mappedRect.width, mappedRect.height);
            this.ctx.fill();
            this.ctx.stroke();
        }
        drawSprite(rect, sprite) {
            const mappedRect = Rect.mapRectOnto(this.#viewportRect, rect, this.bitmapRect());
            const bitmapRect = sprite.bitmapRect;
            this.ctx.drawImage(sprite.image, bitmapRect.x1, bitmapRect.y1, bitmapRect.width, bitmapRect.height, mappedRect.x1, mappedRect.y1, mappedRect.width, mappedRect.height);
        }
        #viewportRect = Rect.zero;
        #usePath(path) {
            this.ctx.beginPath();
            const p = Rect.mapPointOnto(this.#viewportRect, path.origin, this.bitmapRect());
            this.ctx.moveTo(p.x, p.y);
            for (const segment of path.segments) {
                if (segment instanceof Path.LineTo) {
                    const p = Rect.mapPointOnto(this.#viewportRect, segment.point, this.bitmapRect());
                    this.ctx.lineTo(p.x, p.y);
                }
                if (segment instanceof Path.Close) {
                    this.ctx.closePath();
                }
            }
        }
        #setPathStyle(pathStyle) {
            this.ctx.lineWidth = pathStyle.width;
            this.ctx.strokeStyle = pathStyle.color.toString();
            this.ctx.miterLimit = pathStyle.miterLimit;
            switch (pathStyle.cap) {
                case PathStyle.Cap.Butt:
                    this.ctx.lineCap = "butt";
                    break;
                case PathStyle.Cap.Round:
                    this.ctx.lineCap = "round";
                    break;
                case PathStyle.Cap.Square:
                    this.ctx.lineCap = "square";
                    break;
            }
            switch (pathStyle.join) {
                case PathStyle.Join.Miter:
                    this.ctx.lineJoin = "miter";
                    break;
                case PathStyle.Join.Round:
                    this.ctx.lineJoin = "round";
                    break;
                case PathStyle.Join.Bevel:
                    this.ctx.lineJoin = "bevel";
                    break;
            }
        }
        #setShapeStyle(shapeStyle) {
            this.#setPathStyle(shapeStyle.stroke);
            this.ctx.fillStyle = shapeStyle.fillColor.toString();
        }
    }

    class Scheduler {
        next(currentTime) {
            const out = [];
            for (const [time, item] of this.#items) {
                if (time <= currentTime)
                    out.push(item);
            }
            return out;
        }
        schedule(time, item) {
            this.#items.push([time, item]);
        }
        unscheduleAll() {
            this.#items = [];
        }
        #items = [];
    }

    var sidebarHTML = "<div style=\"padding: .5em;\">\n\t<label>\n\t\t<span>Event duration <small>(milliseconds)</small></span>\n\t\t<input type=\"number\" class=\"outlined-text-field\" />\n\t</label>\n</div>";

    class BarChartPresentation {
        color = Canvas2DRenderer.sampleCSSColor(getComputedStyle(document.body).color);
        auxillaryColor = Color.fromRGBA(this.color.r, this.color.g, this.color.b, this.color.a * .7);
        readColor = Canvas2DRenderer.sampleCSSColor(getComputedStyle(document.body).getPropertyValue("--yellow"));
        writeColor = Canvas2DRenderer.sampleCSSColor(getComputedStyle(document.body).getPropertyValue("--red"));
        displayName = "Bar Chart";
        element = document.createElement("canvas");
        sidebarElement = document.createElement("div");
        #renderer = Canvas2DRenderer.fromCanvas(this.element);
        #audioCtx = new AudioContext();
        #eventDurationInput;
        #animationScheduler = new Scheduler();
        #defaultDurationInMilliseconds = 5;
        constructor() {
            this.element.style.imageRendering = "pixelated";
            this.sidebarElement.innerHTML = sidebarHTML;
            this.#eventDurationInput = this.sidebarElement.querySelector("input");
            this.#eventDurationInput.valueAsNumber = this.#defaultDurationInMilliseconds;
            this.#eventDurationInput.placeholder = this.#defaultDurationInMilliseconds.toString();
            AnimationFrameScheduler.periodic(() => {
                // only render the latest frame
                const frames = this.#animationScheduler.next(this.#audioCtx.currentTime);
                frames[frames.length - 1]?.();
            });
        }
        #eventDuration() {
            return new Duration({ milliseconds: this.#eventDurationInput.valueAsNumber || this.#defaultDurationInMilliseconds });
        }
        async present(data, changes) {
            this.#animationScheduler.unscheduleAll();
            this.#drawBars(data);
            this.#audioCtx.resume();
            const time = new Duration({ seconds: this.#audioCtx.currentTime });
            for await (const [data, change] of changes) {
                const eventDuration = this.#eventDuration();
                this.#animationScheduler.schedule(time.seconds, () => {
                    // the sound is very piercing for event durations < 10 milliseconds,
                    // so I'm scheduling it with the animation in order to throttle it.
                    this.#scheduleEventSounds(this.#audioCtx.currentTime, data, change);
                    this.#drawEventBars(data, change);
                });
                time.milliseconds += eventDuration.milliseconds;
                this.#animationScheduler.schedule(time.seconds, () => this.#drawBars(data));
                // prevent more than 5 events from being scheduled at once.
                // we need to do this to support bogo-sort.
                while (time.seconds - this.#audioCtx.currentTime > eventDuration.seconds * 5)
                    await Timer.schedule(eventDuration);
            }
        }
        #drawEventBars(data, event) {
            if (event instanceof GetEvent)
                this.#drawBars(data, new Map().set(event.path.toString(), this.readColor));
            if (event instanceof SetEvent)
                this.#drawBars(data, new Map().set(event.path.toString(), this.writeColor));
            if (event instanceof CompareEvent)
                this.#drawBars(data, new Map().set(event.lhs.toString(), this.readColor).set(event.rhs.toString(), this.readColor));
            if (event instanceof SwapEvent)
                this.#drawBars(data, new Map().set(event.lhs.toString(), this.writeColor).set(event.rhs.toString(), this.writeColor));
            if (event instanceof CopyEvent)
                this.#drawBars(data, new Map().set(event.lhs.toString(), this.writeColor).set(event.rhs.toString(), this.readColor));
        }
        #drawBars(memory, colors = new Map) {
            const width = Math.max(...memory.arrays.map(i => i.length));
            const arrayHeight = memory.arrays[0].length;
            const totalHeight = (memory.arrays.length) * arrayHeight;
            const viewport = Rect.fromCoordinates(0, 0, width, totalHeight);
            this.#renderer.setViewportRect(viewport);
            this.element.width = viewport.width;
            this.element.height = viewport.height;
            this.#renderer.clear();
            for (let p = memory.arrays.length - 1; p >= 0; p--) {
                const y = (memory.arrays.length - 1 - p) * arrayHeight;
                const array = memory.arrays[p];
                for (let i = 0; i < array.length; i++) {
                    const x = i;
                    const width = 1;
                    const height = array[i];
                    const color = colors.get(new MemoryPath(p, i).toString()) ?? (p === 0 ? this.color : this.auxillaryColor);
                    this.#renderer.drawRect(Rect.fromDimensions(x, y, width, height), new ShapeStyle({ fillColor: color }));
                }
            }
        }
        #scheduleEventSounds(time, data, event) {
            const minNumber = 0;
            const maxNumber = Math.max(...data.arrays.map(i => Math.max(...i))) || 1;
            if (event instanceof SwapEvent || event instanceof CopyEvent || event instanceof CompareEvent) {
                this.#scheduleSound(time, data.get(event.lhs), minNumber, maxNumber, "triangle");
                this.#scheduleSound(time, data.get(event.rhs), minNumber, maxNumber, "triangle");
            }
            if (event instanceof GetEvent) {
                this.#scheduleSound(time, data.get(event.path), minNumber, maxNumber, "triangle");
            }
            if (event instanceof SetEvent) {
                this.#scheduleSound(time, event.value, minNumber, maxNumber, "triangle");
            }
        }
        #scheduleSound(time, number, min, max, type) {
            const volume = .03;
            const minHertz = 100;
            const maxHertz = 900;
            const duration = .08;
            const attack = .3;
            const decay = .6;
            const hertzPercent = (number - min) / (max - min);
            const hertz = minHertz + (maxHertz - minHertz) * hertzPercent;
            const attackStart = time;
            const attackEnd = attackStart + duration * attack;
            const decayStart = attackEnd + duration * (1 - attack - decay);
            const decayEnd = decayStart + duration * decay;
            const oscillator = this.#audioCtx.createOscillator();
            oscillator.type = type;
            oscillator.frequency.value = hertz;
            oscillator.start(attackStart);
            oscillator.stop(decayEnd);
            const envelope = this.#audioCtx.createGain();
            envelope.gain.setValueAtTime(0.0001, attackStart);
            envelope.gain.linearRampToValueAtTime(volume, attackEnd);
            envelope.gain.setValueAtTime(volume, decayStart);
            envelope.gain.exponentialRampToValueAtTime(0.0001, decayEnd);
            oscillator.connect(envelope);
            envelope.connect(this.#audioCtx.destination);
        }
        ;
    }

    const displayName$a = "Shuffle";
    function run$a(array) {
        for (let i = 0; i < array.length; i++) {
            const j = Math.floor(Math.random() * (i + 1));
            array[i].swap(array[j]);
        }
    }

    var shuffle = /*#__PURE__*/Object.freeze({
        __proto__: null,
        displayName: displayName$a,
        run: run$a
    });

    const displayName$9 = "Insertion Sort";
    function run$9(array) {
        for (let i = 1; i < array.length; i++) {
            let j = i;
            while (j > 0 && array[j - 1].greaterThan(array[j])) {
                array[j - 1].swap(array[j]);
                j--;
            }
        }
    }

    var insertionSort = /*#__PURE__*/Object.freeze({
        __proto__: null,
        displayName: displayName$9,
        run: run$9
    });

    const displayName$8 = "Bubble Sort";
    function run$8(array) {
        for (let i = 0; i < array.length; i++) {
            for (let j = 0; j < array.length - i - 1; j++) {
                if (array[j].greaterThan(array[j + 1])) {
                    array[j].swap(array[j + 1]);
                }
            }
        }
    }

    var bubbleSort = /*#__PURE__*/Object.freeze({
        __proto__: null,
        displayName: displayName$8,
        run: run$8
    });

    const displayName$7 = "Selection Sort";
    function run$7(array) {
        for (let current = 0; current < array.length; current++) {
            let max = current;
            for (let i = current + 1; i < array.length; i++) {
                if (array[max].greaterThan(array[i]))
                    max = i;
            }
            array[current].swap(array[max]);
        }
    }

    var selectionSort = /*#__PURE__*/Object.freeze({
        __proto__: null,
        displayName: displayName$7,
        run: run$7
    });

    const displayName$6 = "Shell Sort";
    function run$6(array) {
        let gap = array.length;
        while (gap > 1) {
            gap = Math.floor(gap / 2);
            for (let i = gap; i < array.length; i++) {
                let j = i;
                while (j >= gap && array[j - gap].greaterThan(array[j])) {
                    array[j - gap].swap(array[j]);
                    j -= gap;
                }
            }
        }
    }

    var shellSort = /*#__PURE__*/Object.freeze({
        __proto__: null,
        displayName: displayName$6,
        run: run$6
    });

    const displayName$5 = "Quick Sort";
    function run$5(array) {
        quickSort(array, 0, array.length - 1);
    }
    // Sorts a (portion of an) array, divides it into partitions, then sorts those
    function quickSort(A, lo, hi) {
        // Ensure indices are in correct order
        if (lo >= hi || lo < 0)
            return;
        // Partition array and get the pivot index
        let p = partition(A, lo, hi);
        // Sort the two partitions
        quickSort(A, lo, p - 1); // Left side of pivot
        quickSort(A, p + 1, hi); // Right side of pivot
    }
    // Divides array into two partitions
    function partition(A, lo, hi) {
        // Temporary pivot index
        let i = lo - 1;
        for (let j = lo; j < hi; j++) {
            // If the current element is less than or equal to the pivot
            if (A[j].lessThan(A[hi])) {
                // Move the temporary pivot index forward
                i = i + 1;
                // Swap the current element with the element at the temporary pivot index
                A[i].swap(A[j]);
            }
        }
        // Move the pivot element to the correct pivot position (between the smaller and larger elements)
        i = i + 1;
        A[i].swap(A[hi]);
        return i; // the pivot index
    }

    var quickSort$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        displayName: displayName$5,
        run: run$5
    });

    const displayName$4 = "Top Down Merge Sort";
    function run$4(array, alloc) {
        topDownMergeSort(array, alloc.createArray(array.length), array.length);
    }
    function copyArray$1(output, iBegin, iEnd, input) {
        for (let i = iBegin; i < iEnd; i++)
            output[i].copy(input[i]);
    }
    // Array A[] has the items to sort; array B[] is a work array.
    function topDownMergeSort(a, b, n) {
        copyArray$1(b, 0, n, a); // one time copy of A[] to B[]
        splitMerge(b, 0, n, a); // sort data from B[] into A[]
    }
    // Split A[] into 2 runs, sort both runs into B[], merge both runs from B[] to A[]
    // iBegin is inclusive; iEnd is exclusive (A[iEnd] is not in the set).
    function splitMerge(b, iBegin, iEnd, a) {
        if (iEnd - iBegin <= 1) // if run size == 1
            return; //   consider it sorted
        // split the run longer than 1 item into halves
        let iMiddle = Math.floor((iEnd + iBegin) / 2); // iMiddle = mid point
        // recursively sort both runs from array A[] into B[]
        splitMerge(a, iBegin, iMiddle, b); // sort the left  run
        splitMerge(a, iMiddle, iEnd, b); // sort the right run
        // merge the resulting runs from array B[] into A[]
        merge$1(b, iBegin, iMiddle, iEnd, a);
    }
    //  Left source half is A[ iBegin:iMiddle-1].
    // Right source half is A[iMiddle:iEnd-1   ].
    // Result is            B[ iBegin:iEnd-1   ].
    function merge$1(a, iBegin, iMiddle, iEnd, b) {
        let i = iBegin, j = iMiddle;
        // While there are elements in the left or right runs...
        for (let k = iBegin; k < iEnd; k++) {
            // If left run head exists and is <= existing right run head.
            if (i < iMiddle && (j >= iEnd || a[i].lessThanOrEqualTo(a[j]))) {
                b[k].copy(a[i]);
                i++;
            }
            else {
                b[k].copy(a[j]);
                j++;
            }
        }
    }

    var topDownMergeSort$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        displayName: displayName$4,
        run: run$4
    });

    const displayName$3 = "Bottom Up Merge Sort";
    function run$3(array, alloc) {
        bottomUpMergeSort(array, alloc.createArray(array.length), array.length);
    }
    function bottomUpMergeSort(a, b, n) {
        // Each 1-element run in array is already "sorted".
        // Make successively longer sorted runs of length 2, 4, 8, 16... until the whole array is sorted.
        for (let width = 1; width < n; width = 2 * width) {
            for (let i = 0; i < n; i = i + 2 * width) {
                // Merge two runs: A[i:i+width-1] and A[i+width:i+2*width-1] to B[]
                // or copy A[i:n-1] to B[] ( if (i+width >= n) )
                merge(a, i, Math.min(i + width, n), Math.min(i + 2 * width, n), b);
            }
            // Now work array B is full of runs of length 2*width.
            // Copy array B to array A for the next iteration.
            // A more efficient implementation would swap the roles of A and B.
            copyArray(b, a, n);
            // Now array A is full of runs of length 2*width.
        }
    }
    //  Left run is A[iLeft :iRight-1].
    // Right run is A[iRight:iEnd-1  ].
    function merge(a, iLeft, iRight, iEnd, b) {
        let i = iLeft, j = iRight;
        // While there are elements in the left or right runs...
        for (let k = iLeft; k < iEnd; k++) {
            // If left run head exists and is <= existing right run head.
            if (i < iRight && (j >= iEnd || a[i].lessThan(a[j]))) {
                b[k].copy(a[i]);
                i = i + 1;
            }
            else {
                b[k].copy(a[j]);
                j = j + 1;
            }
        }
    }
    function copyArray(b, a, n) {
        for (let i = 0; i < n; i++)
            a[i].copy(b[i]);
    }

    var bottomUpMergeSort$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        displayName: displayName$3,
        run: run$3
    });

    const displayName$2 = "Heap Sort";
    function run$2(array) {
        for (let i = array.length - 1; i >= 0; i--) {
            heapify(array, i);
        }
        for (let i = array.length - 1; i >= 0; i--) {
            array[0].swap(array[i]);
            heapify(array, 0, i - 1);
        }
    }
    function heapify(array, index, end = array.length - 1) {
        let largest = index;
        const left = 2 * index + 1;
        const right = 2 * index + 2;
        if (left <= end && array[left].greaterThan(array[largest])) {
            largest = left;
        }
        if (right <= end && array[right].greaterThan(array[largest])) {
            largest = right;
        }
        if (largest !== index) {
            array[index].swap(array[largest]);
            heapify(array, largest, end);
        }
    }

    var heapSort = /*#__PURE__*/Object.freeze({
        __proto__: null,
        displayName: displayName$2,
        run: run$2
    });

    const displayName$1 = "Bogo Sort";
    async function run$1(array, alloc, queue) {
        while (!isSorted(array)) {
            run$a(array);
            while (!queue.isEmpty())
                await new Promise(resolve => queue.onQueueShifted.addOnceListener(resolve));
        }
    }
    function isSorted(array) {
        for (let i = 0; i < array.length - 1; i++) {
            if (array[i].greaterThan(array[i + 1]))
                return false;
        }
        return true;
    }

    var bogoSort = /*#__PURE__*/Object.freeze({
        __proto__: null,
        displayName: displayName$1,
        run: run$1
    });

    const displayName = "Bucket Sort (k = 5)";
    const k = 5;
    function run(array, alloc) {
        const buckets = [];
        for (let i = 0; i < k; i++)
            buckets.push(alloc.createVector());
        const max = Math.max(...array.map(i => i.read()));
        for (let i = 0; i < array.length; i++) {
            const value = array[i].read();
            const percent = value / max;
            const bucketIndex = value === max ? (k - 1) : Math.floor(k * percent);
            buckets[bucketIndex].push(value);
        }
        for (const bucket of buckets)
            run$5(bucket.toArray());
        let n = 0;
        for (const bucket of buckets) {
            for (const item of bucket.toArray()) {
                array[n].copy(item);
                n += 1;
            }
        }
    }

    var bucketSort = /*#__PURE__*/Object.freeze({
        __proto__: null,
        displayName: displayName,
        k: k,
        run: run
    });

    const main = document.querySelector(".app-main");
    const sidebar = document.querySelector(".app-sidebar");
    const algorithmsSidebar = document.querySelector(".app-algorithms-sidebar");
    const dataSidebar = document.querySelector(".app-data-sidebar");
    const presentationSidebar = document.querySelector(".app-presentations-sidebar");
    const presentationSidebarSelector = presentationSidebar.querySelector("select");
    const presentationSidebarContent = presentationSidebar.querySelector("stack-");
    const app = new class {
        // for debugging
        editor;
        // allow running tasks to be canceled in case the user starts a new task
        // before the current one is finished.
        task = Disposable.empty;
        memory;
        algorithms = [
            shuffle,
            // fast 
            quickSort$1,
            heapSort,
            shellSort,
            // slow
            bubbleSort,
            insertionSort,
            selectionSort,
            // auxillary
            topDownMergeSort$1,
            bottomUpMergeSort$1,
            bucketSort,
            bogoSort,
        ];
        presentations = [
            new BarChartPresentation(),
        ];
        activePresentation = this.presentations[0];
        updateAlgorithms() {
            // render sidebar
            algorithmsSidebar.innerHTML = "";
            for (const algorithm of this.algorithms) {
                const button = document.createElement("button");
                button.classList.add("panel-button");
                button.innerText = algorithm.displayName;
                button.addEventListener("click", () => this.runAlgorithm(algorithm));
                algorithmsSidebar.appendChild(button);
            }
        }
        updatePresentations() {
            // render sidebar
            presentationSidebarSelector.innerHTML = "";
            presentationSidebarSelector.append(...this.presentations.map(presentation => {
                const option = document.createElement("option");
                option.innerText = presentation.displayName;
                return option;
            }));
        }
        updateActivePresentation() {
            // render sidebar & present data
            presentationSidebarContent.innerHTML = "";
            presentationSidebarContent.append(this.activePresentation.sidebarElement);
            main.innerHTML = "";
            main.appendChild(this.activePresentation.element);
            this.activePresentation.present(this.memory.clone(), []);
        }
        async runAlgorithm(algorithm) {
            this.task.dispose();
            const array = this.memory.arrays[0].slice();
            const memory = new Memory([array]);
            // create editors
            const emitter = new CustomEmitter();
            const memoryEditor = new Allocator(memory, emitter);
            const arrayEditor = memoryEditor.getArray(0);
            this.editor = memoryEditor;
            let canceled = false;
            this.task = new Disposable(() => canceled = true);
            // create queue and run algorithm
            const queue = new Emitter.Queue(emitter);
            const presentationMemory = memory.clone();
            this.activePresentation.present(presentationMemory.clone(), (async function* () {
                for await (const event of queue) {
                    if (canceled)
                        return;
                    event.applyTo(app.memory = presentationMemory);
                    yield [presentationMemory.clone(), event];
                }
            })());
            algorithm.run(arrayEditor, memoryEditor, queue);
        }
        constructor() {
            const array = new Array(100);
            for (let i = 0; i < array.length; i++)
                array[i] = i + 1;
            this.memory = new Memory([array]);
            this.updateAlgorithms();
            this.updatePresentations();
            this.updateActivePresentation();
            presentationSidebarSelector.onchange = () => {
                const index = presentationSidebarSelector.selectedIndex;
                this.activePresentation = this.presentations[index];
                this.updateActivePresentation();
            };
        }
    };
    console.log(`For debugging, see "app"`);
    Object.defineProperty(window, "app", {
        value: app,
    });
    // bind nav buttons to sidebar
    const buttons = [...document.querySelector(".app-nav-rail").children].slice(0, 3);
    const bindSidebar = (button, element) => {
        button.addEventListener("click", () => {
            for (const button of buttons)
                button.toggleAttribute("selected", false);
            button.toggleAttribute("selected", true);
            sidebar.replaceChildren(element);
        });
    };
    bindSidebar(buttons[0], algorithmsSidebar);
    bindSidebar(buttons[1], dataSidebar);
    bindSidebar(buttons[2], presentationSidebar);
    buttons[0].click();
    dataSidebar.children[0].addEventListener("click", () => {
        const length = parseInt(prompt("Enter array length:") ?? "");
        if (!Number.isFinite(length))
            return;
        app.task.dispose();
        const array = new Array(length);
        for (let i = 0; i < array.length; i++)
            array[i] = i + 1;
        app.memory = new Memory([array]);
        app.activePresentation.present(app.memory, []);
    });
    dataSidebar.children[1].addEventListener("click", () => {
        const length = parseInt(prompt("Enter array length:") ?? "");
        if (!Number.isFinite(length))
            return;
        app.task.dispose();
        const array = new Array(length);
        for (let i = 0; i < array.length; i++)
            array[i] = Math.floor(Math.random() * length);
        app.memory = new Memory([array]);
        app.activePresentation.present(app.memory, []);
    });
    dataSidebar.children[2].addEventListener("click", () => {
        const csv = prompt("Enter comma separated values:");
        if (!csv)
            return;
        const parsed = csv.split(",").map(x => parseInt(x) || 0);
        app.task.dispose();
        app.memory = new Memory([parsed]);
        app.activePresentation.present(app.memory, []);
    });
    document.querySelector("#openDialog").onclick =
        document.querySelector("#closeDialog").onclick = () => {
            document.body.toggleAttribute("data-dialog-opened");
        };
    document.querySelector("#share").onclick = async () => {
        try {
            await navigator.share({
                title: document.title,
                text: document.querySelector('meta[name="description"]')?.content ?? document.title,
                url: window.location.href
            });
        }
        catch {
            alert("Sharing is not supported in this environment.");
        }
    };

})();
//# sourceMappingURL=main.js.map
