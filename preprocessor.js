let defaultInput =
`

3 2

0 0 0 0
0.5 1 1 1
1 0 0 0

0 1 0.1 2
1 2 0.2 1

` 

// `

// nodeCount rodCount

// node1x node1xPermit node1yPermit node1zPermit
// node2x node2xPermit node2yPermit node2zPermit
// ...

// rod1startNode rod1endNode rod1width rod1height
// rod2startNode rod2endNode rod2width rod2height
// ...

// ` 

let constructionPercentage = 0.7
let nodeSize = 5

let canvas = null
let ctx = null

let zoomMagnitude = 30

let camera = {
    x: -200,
    y: -250,
    zoom: 300
}

let construction = null

let canvasOffsetX = null
let canvasOffsetY = null
let dragging = false
let startDragX = null
let startDragY = null
let offsetDragX = 0
let offsetDragY = 0

$(document).ready(() =>
{
    canvas = document.getElementById("canvas")
    ctx = canvas.getContext("2d")
    $("#input").val(defaultInput.trim())

    $("#canvas").mousedown((e) => { handleMouseDown(e) })
    $("#canvas").mousemove((e) => { handleMouseMove(e) })
    $("#canvas").mouseup((e) => { handleMouseUp(e) })
    $("#canvas").mouseleave(() => { handleMouseLeave() })
    $("#canvas").on('DOMMouseScroll mousewheel', (e) => { handleMouseWheel(e) })

    let offset = $("#canvas").offset()
    canvasOffsetX = offset.left
    canvasOffsetY = offset.top

    update()
})

handleMouseWheel = (e) =>
{
    if (e.originalEvent.detail > 0 || e.originalEvent.wheelDelta < 0)
    {
        camera.zoom -= zoomMagnitude

        if (camera.zoom < 1)
        {
            camera.zoom = 1
        }
    }
    else
    {
        camera.zoom += zoomMagnitude
    }
    
    redraw()
    return false
}

handleMouseDown = (e) =>
{
    let mx = e.clientX - canvasOffsetX
    let my = e.clientY - canvasOffsetY

    startDragX = mx
    startDragY = my

    dragging = true
}

handleMouseMove = (e) =>
{
    if (dragging)
    {
        let mx = e.clientX - canvasOffsetX
        let my = e.clientY - canvasOffsetY

        offsetDragX = mx - startDragX
        offsetDragY = my - startDragY

        redraw()
    }
}

handleMouseUp = (e) =>
{
    if (dragging)
    {
        let mx = e.clientX - canvasOffsetX
        let my = e.clientY - canvasOffsetY

        camera.x -= offsetDragX
        camera.y -= offsetDragY

        offsetDragX = 0
        offsetDragY = 0

        dragging = false
        redraw()
    }
}

handleMouseLeave = () =>
{
    if (dragging)
    {
        offsetDragX = 0
        offsetDragY = 0
    
        dragging = false
    
        redraw()
    }
}

parseConstruction = (raw) =>
{
    // todo: find out why this line
    // raw.replace("\r", "").replace("\n", " ").split(" ").filter(x => x.length > 0)
    // doesn't work but the next line does

    let numbers = raw.replace(/\n|\r/g, " ").split(" ").filter(x => x.length > 0)
    let construction = {}

    let cur = 0
    getNextNumber = () => numbers[cur++]

    let nodeCount = parseInt(getNextNumber())
    let rodCount = parseInt(getNextNumber())

    construction.nodes = []
    for (let i = 0; i < nodeCount; ++i)
    {
        let node = {}

        node.x = parseFloat(getNextNumber())
        node.y = 0

        node.xPermit = parseInt(getNextNumber())
        node.yPermit = parseInt(getNextNumber())
        node.zPermit = parseInt(getNextNumber())

        construction.nodes.push(node)
    }

    construction.rods = []
    for (let i = 0; i < rodCount; ++i)
    {
        let rod = {}

        rod.startNode = parseInt(getNextNumber())
        rod.endNode = parseInt(getNextNumber())

        rod.width = parseFloat(getNextNumber())
        rod.height = parseFloat(getNextNumber())

        construction.rods.push(rod)
    }

    return construction
}

// getConstructionParams = (construction) =>
// {
//     let xMin = Math.min(...construction.nodes.map(a => a.x))
//     let xMax = Math.max(...construction.nodes.map(a => a.x))

//     let xSize = xMax - xMin

//     return {
//         xMin: xMin,
//         xMax: xMax,
//         xSize: xSize,
//     }
// }

getPointCanvasCoords = (point) =>
{
    let x = (point.x * camera.zoom) - camera.x + offsetDragX
    let y = (point.y * camera.zoom) - camera.y + offsetDragY

    return { x: x, y: y }
}

drawNode = (node) =>
{
    let coords = getPointCanvasCoords(node)
    ctx.fillRect(coords.x - nodeSize / 2, coords.y - nodeSize / 2, nodeSize, nodeSize)
}

drawRod = (construction, rod) =>
{
    let start = construction.nodes[rod.startNode]
    let end = construction.nodes[rod.endNode]

    let vx = start.x - end.x
    let vy = start.y - end.y
    let angle = Math.atan2(vy, vx)

    let point0 = {
        x: start.x + Math.cos(angle + Math.PI / 2) * rod.width / 2,
        y: start.y + Math.sin(angle + Math.PI / 2) * rod.width / 2
    }

    let point1 = {
        x: start.x + Math.cos(angle - Math.PI / 2) * rod.width / 2,
        y: start.y + Math.sin(angle - Math.PI / 2) * rod.width / 2
    }

    let point2 = {
        x: end.x + Math.cos(angle - Math.PI / 2) * rod.width / 2,
        y: end.y + Math.sin(angle - Math.PI / 2) * rod.width / 2
    }

    let point3 = {
        x: end.x + Math.cos(angle + Math.PI / 2) * rod.width / 2,
        y: end.y + Math.sin(angle + Math.PI / 2) * rod.width / 2
    }
    
    let canvasPoint0 = getPointCanvasCoords(point0)
    let canvasPoint1 = getPointCanvasCoords(point1)
    let canvasPoint2 = getPointCanvasCoords(point2)
    let canvasPoint3 = getPointCanvasCoords(point3)

    ctx.beginPath()
    ctx.moveTo(canvasPoint0.x, canvasPoint0.y)
    ctx.lineTo(canvasPoint1.x, canvasPoint1.y)
    ctx.lineTo(canvasPoint2.x, canvasPoint2.y)
    ctx.lineTo(canvasPoint3.x, canvasPoint3.y)
    ctx.lineTo(canvasPoint0.x, canvasPoint0.y)
    ctx.stroke()
}

drawConstruction = (construction) =>
{
    ctx.fillStyle = "#ffffff"
    ctx.strokeStyle = "#ffffff"

    construction.nodes.forEach(node => drawNode(node))
    construction.rods.forEach(rod => drawRod(construction, rod))
}

clearCanvas = () =>
{
    ctx.clearRect(0, 0, canvas.width, canvas.height)
}

redraw = () =>
{
    clearCanvas()
    drawConstruction(construction)
}

update = () =>
{
    let inp = $("textarea").val()
    construction = parseConstruction(inp)
    // console.log(construction)

    updateControls(construction)
    
    redraw()
}

updateControls = (construction) =>
{
    let options = {}
    for (let i = 0; i < construction.nodes.length; ++i)
    {
        options["Node " + i] = i
    }
    
    let sel = $("#rodPosition")
    sel.empty()
    $.each(options, (key, value) =>
    {
        sel.append($("<option></option>").attr("value", value).text(key))
    })
}

debug = () =>
{
    console.log(construction)
}

addRod = () =>
{
    let length = parseFloat($("#rodLength").val())
    let width = parseFloat($("#rodWidth").val())
    let height = parseFloat($("#rodHeight").val())
    let position = parseInt($('#rodPosition').find(":selected").val())

    // if (position == construction.nodes.length - 1)
    // {
    //     let node = {}

    //     node.x = construction.nodes[construction.nodes.length - 1].x + length
    //     node.y = 0
    
    //     node.xPermit = 0
    //     node.yPermit = 0
    //     node.zPermit = 0
    
    //     construction.nodes.push(node)
    
    //     let rod = {}
    
    //     rod.startNode = construction.nodes.length - 2
    //     rod.endNode = construction.nodes.length - 1
    
    //     rod.width = width
    //     rod.height = height
    
    //     construction.rods.push(rod)
    // }

    let node = {}

    node.x = construction.nodes[position].x
    node.y = 0

    node.xPermit = 0
    node.yPermit = 0
    node.zPermit = 0

    let rod = {}

    rod.startNode = position
    rod.endNode = position + 1

    rod.width = width
    rod.height = height

    for (let i = position; i < construction.nodes.length; ++i)
    {
        construction.nodes[i].x += length
    }

    for (let i = position; i < construction.rods.length; ++i)
    {
        construction.rods[i].startNode += 1
        construction.rods[i].endNode += 1
    }

    construction.nodes.splice(position, 0, node)
    construction.rods.splice(position, 0, rod)

    updateControls(construction)
    redraw()
}