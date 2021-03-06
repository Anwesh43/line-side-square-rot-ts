const w : number = window.innerWidth * 0.8
const h : number = window.innerHeight * 0.8
const colors : Array<string> = [
    "#EF5350",
    "#01579B",
    "#00C853",
    "#4A148C",
    "#C51162"
]
const parts : number = 4
const scGap : number = 0.04 / parts 
const strokeFactor : number = 90 
const sizeFactor : number = 4.9 
const delay : number = 20 
const backColor : string = "#BDBDBD"
const deg : number = Math.PI / 2 

class ScaleUtil {

    static maxScale(scale : number, i : number, n : number) : number {
        return Math.max(0, scale - i / n)
    }

    static divideScale(scale : number, i : number, n : number) : number {
        return Math.min(1 / n, ScaleUtil.maxScale(scale, i, n)) * n 
    }
}

class DrawingUtil {

    static drawLine(context : CanvasRenderingContext2D, x1 : number, y1 : number, x2 : number, y2 : number) {
        context.beginPath()
        context.moveTo(x1, y1)
        context.lineTo(x2, y2)
        context.stroke()
    }

    static drawSideSquareRot(context : CanvasRenderingContext2D, scale : number) {
        const size : number = Math.min(w, h) / sizeFactor 
        const sc1 : number = ScaleUtil.divideScale(scale, 0, parts)
        const sc2 : number = ScaleUtil.divideScale(scale, 1, parts)
        const sc3 : number = ScaleUtil.divideScale(scale, 2, parts)
        const sc4 : number = ScaleUtil.divideScale(scale, 3, parts)
        context.save()
        context.translate(w / 2 + (w / 2 + size / 2) * sc4, h - size / 2 - (h / 2 - size / 2) * sc2)
        context.rotate(Math.PI * sc2)
        for (var j = 0; j < 2; j++) {
            console.log("JSCAKE", j, (size / 2) * (1 - 2 * j), size * 0.5 * (1 - 2 * j))
           
            if (sc1 > 0) {
                context.save()
                context.translate((size / 2) * (1 - 2 * j), 0)
                DrawingUtil.drawLine(context, 0, size / 2, 0, size / 2 -size * sc1)
                context.restore()
            }
            if (sc3 > 0) {
                context.save()
                context.translate((size / 2) * (1 - 2 * j), size * 0.5 * (1 - 2 * j))
                DrawingUtil.drawLine(context, 0, 0,  -size * sc3 * (1 - 2 * j), 0)
                context.restore()
            }
        }
        context.restore()
    }

    static drawLSSRNode(context : CanvasRenderingContext2D, i : number, scale : number) {
        context.lineCap = 'round'
        context.lineWidth = Math.min(w, h) / strokeFactor 
        context.strokeStyle = colors[i]
        DrawingUtil.drawSideSquareRot(context, scale)
    }
}

class Stage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D 
    renderer : Renderer = new Renderer()

    initCanvas() {
        this.canvas.width = w 
        this.canvas.height = h 
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor 
        this.context.fillRect(0, 0, w, h)
        this.renderer.render(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.renderer.handleTap(() => {
                this.render()
            })
        }
    }

    static init() {
        const stage : Stage = new Stage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {
    
    scale : number = 0 
    dir : number = 0 
    prevScale : number = 0 

    update(cb : Function) {
        this.scale += this.dir * scGap 
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir 
            this.dir = 0 
            this.prevScale = this.scale 
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale 
            cb()
        }
    }
}

class Animator {
    
    animated : boolean = false 
    interval : number 

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true 
            this.interval = setInterval(cb, delay)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false 
            clearInterval(this.interval)
        }
    }
}

class LSSRNode {

    prev : LSSRNode 
    next : LSSRNode 
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < colors.length - 1) {
            this.next = new LSSRNode(this.i + 1)
            this.next.prev = this  
        }
    }

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawLSSRNode(context, this.i, this.state.scale)
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : LSSRNode {
        var curr : LSSRNode = this.prev 
        if (dir == 1) {
            curr = this.next 
        }
        if (curr) {
            return curr 
        }
        cb()
        return this 
    }
}

class LineSideSquareRot {

    curr : LSSRNode = new LSSRNode(0)
    dir : number = 1

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }

    draw(context : CanvasRenderingContext2D) {
        this.curr.draw(context)
    }
}

class Renderer {

    lssr : LineSideSquareRot = new LineSideSquareRot()
    animator : Animator = new Animator()

    render(context : CanvasRenderingContext2D) {
        this.lssr.draw(context)
    }

    handleTap(cb : Function) {
        this.lssr.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.lssr.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}