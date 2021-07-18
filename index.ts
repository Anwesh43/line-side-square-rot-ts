const w : number = window.innerWidth 
const h : number = window.innerHeight 
const colors : Array<string> = [
    "#EF5350",
    "#01579B",
    "#00C853",
    "#4A148C",
    "#C51162"
]
const parts : number = 4
const scGap : number = 0.02 / parts 
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