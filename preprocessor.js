// todo:
// add processor
// add postprocessor
// remove startNode, endNode
// add clear button
// make rod adding clean
// improve visual style
// restrict to 2 permits

let defaultInput =
`

3 2

0 0 0
3 1 0
5 0 1

0 1 2 1 1
1 2 3 0 1

` 

// `

// nodeCount rodCount

// node1x node1xPermit node1force
// node2x node2xPermit node2force
// ...

// rod1startNode rod1endNode rod1area forceX1 elastic1
// rod2startNode rod2endNode rod2area forceX2 elastic2
// ...

// ` 

let constructionPercentage = 0.7
let nodeSize = 5

let arrowDist = 0.4
let arrowLength = 0.3

let permitStrokeCount = 4
let permitSize = 30
let permitDx = 10
let permitDy = 10

let canvas = null
let ctx = null

let zoomMagnitude = 0.1

let camera = {
    x: -200,
    y: -250,
    zoom: 50
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
	
	document.getElementById('open').addEventListener('change', handleFileSelect, false)

    $("#canvas").mousedown((e) => { handleMouseDown(e) })
    $("#canvas").mousemove((e) => { handleMouseMove(e) })
    $("#canvas").mouseup((e) => { handleMouseUp(e) })
    $("#canvas").mouseleave(() => { handleMouseLeave() })
    $("#canvas").on('DOMMouseScroll mousewheel', (e) => { handleMouseWheel(e) })

    let offset = $("#canvas").offset()
    canvasOffsetX = offset.left
    canvasOffsetY = offset.top

    construction = parseConstruction(defaultInput.trim())
    updateControls(construction)
    redraw()
})

handleMouseWheel = (e) =>
{
    if (e.originalEvent.detail > 0 || e.originalEvent.wheelDelta < 0)
    {
        camera.zoom *= 1 - zoomMagnitude

        if (camera.zoom < 1)
        {
            camera.zoom = 1
        }
    }
    else
    {
        camera.zoom *= 1 + zoomMagnitude
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

        node.permit = parseInt(getNextNumber())
        node.force = parseFloat(getNextNumber())

        construction.nodes.push(node)
    }

    construction.rods = []
    for (let i = 0; i < rodCount; ++i)
    {
        let rod = {}

        rod.startNode = parseInt(getNextNumber())
        rod.endNode = parseInt(getNextNumber())

        rod.area = parseFloat(getNextNumber())
        rod.force = parseFloat(getNextNumber())
        rod.elastic = parseFloat(getNextNumber())

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
    // ctx.fillRect(coords.x - nodeSize / 2, coords.y - nodeSize / 2, nodeSize, nodeSize)
    
    if (node.permit == 0)
    {
        for (let i = 0; i < permitStrokeCount; ++i)
        {
            let start = {
                x: coords.x + (permitDx / 2),
                y: coords.y - (permitSize / 2) + (permitSize / permitStrokeCount) * i * 2
            }
            
            let end = {
                x: start.x - permitDx,
                y: start.y - permitDy
            }
            
            ctx.beginPath()
            ctx.moveTo(start.x, start.y)
            ctx.lineTo(end.x, end.y)
            ctx.stroke()
        }
    }
    
    drawNodeForce(node)
}

drawNodeForce = (node) =>
{
    let coords = getPointCanvasCoords(node)
    
    if (Math.abs(node.force) < 0.001)
    {
        return
    }
    
    let angle = node.force > 0 ? 0 : Math.PI
    drawArrow(coords.x, coords.y, 1, angle)
}

drawRod = (construction, rod) =>
{
    let start = construction.nodes[rod.startNode]
    let end = construction.nodes[rod.endNode]

    let vx = start.x - end.x
    let vy = start.y - end.y
    let angle = Math.atan2(vy, vx)

    let point0 = {
        x: start.x + Math.cos(angle + Math.PI / 2) * rod.area / 2,
        y: start.y + Math.sin(angle + Math.PI / 2) * rod.area / 2
    }

    let point1 = {
        x: start.x + Math.cos(angle - Math.PI / 2) * rod.area / 2,
        y: start.y + Math.sin(angle - Math.PI / 2) * rod.area / 2
    }

    let point2 = {
        x: end.x + Math.cos(angle - Math.PI / 2) * rod.area / 2,
        y: end.y + Math.sin(angle - Math.PI / 2) * rod.area / 2
    }

    let point3 = {
        x: end.x + Math.cos(angle + Math.PI / 2) * rod.area / 2,
        y: end.y + Math.sin(angle + Math.PI / 2) * rod.area / 2
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
    
    drawRodForce(rod)
}

drawArrow = (x, y, length, angle) =>
{
    let size = arrowLength * camera.zoom * length
    
    let point0 = {
        x: x,
        y: y
    }
    
    let point1 = {
        x: point0.x + Math.cos(angle) * size,
        y: point0.y + Math.sin(angle) * size
    }
    
    let point2 = {
        x: point1.x + Math.cos(angle + Math.PI - Math.PI / 6) * (size / 3),
        y: point1.y + Math.sin(angle + Math.PI - Math.PI / 6) * (size / 3)
    }
    
    let point3 = {
        x: point1.x + Math.cos(angle + Math.PI + Math.PI / 6) * (size / 3),
        y: point1.y + Math.sin(angle + Math.PI + Math.PI / 6) * (size / 3)
    }
    
    ctx.beginPath()
    ctx.moveTo(point0.x, point0.y)
    ctx.lineTo(point1.x, point1.y)
    ctx.lineTo(point2.x, point2.y)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(point1.x, point1.y)
    ctx.lineTo(point3.x, point3.y)
    ctx.stroke()
}

drawRodForce = (rod) =>
{
    if (Math.abs(rod.force) < 0.001)
    {
        return
    }
    
    let start = getPointCanvasCoords(construction.nodes[rod.startNode])
    let end = getPointCanvasCoords(construction.nodes[rod.endNode])
    
    let arrowDistSize = arrowDist * camera.zoom
    let arrowCount = Math.floor(Math.abs(start.x - end.x) / arrowDistSize)
    
    for (let i = 0; i < arrowCount; ++i)
    {
        let angle = null
        let x = null
        
        if (rod.force > 0)
        {
            angle = 0
            x = start.x + i * arrowDistSize
        }
        else
        {
            angle = Math.PI
            x = end.x - i * arrowDistSize
        }
        
        drawArrow(x, start.y, 1, angle)
    }
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

updateControls = (construction) =>
{
    let nodes = {}
    for (let i = 0; i < construction.nodes.length; ++i)
    {
        nodes["Node " + i] = i
    }
    
    let sel = $("#rodPosition")
    sel.empty()
    $.each(nodes, (key, value) =>
    {
        sel.append($("<option></option>").attr("value", value).text(key))
    })
    
    let spnp = $("#setPermitNodePosition")
    spnp.empty()
    $.each(nodes, (key, value) =>
    {
        spnp.append($("<option></option>").attr("value", value).text(key))
    })
    
    let sfnp = $("#setForceNodePosition")
    sfnp.empty()
    $.each(nodes, (key, value) =>
    {
        sfnp.append($("<option></option>").attr("value", value).text(key))
    })
    
    let rods = {}
    for (let i = 0; i < construction.rods.length; ++i)
    {
        rods["Rod " + i] = i
    }
    
    let rrp = $("#removeRodPosition")
    rrp.empty()
    $.each(rods, (key, value) =>
    {
        rrp.append($("<option></option>").attr("value", value).text(key))
    })
    
    let sfrp = $("#setForceRodPosition")
    sfrp.empty()
    $.each(rods, (key, value) =>
    {
        sfrp.append($("<option></option>").attr("value", value).text(key))
    })

    $("#debugArea").text(JSON.stringify(construction))
}

addRod = () =>
{
    let length = parseFloat($("#rodLength").val())
    let area = parseFloat($("#rodArea").val())
    let elastic = parseFloat($("#rodElastic").val())
    let position = parseInt($('#rodPosition').find(":selected").val())

    let node = {}

    node.x = construction.nodes[position].x
    node.y = 0

    node.permit = 0

    let rod = {}

    rod.startNode = position
    rod.endNode = position + 1

    rod.area = area
    rod.elastic = elastic

    for (let i = position; i < construction.nodes.length; ++i)
    {
        construction.nodes[i].x += length
    }

    for (let i = position; i < construction.rods.length; ++i)
    {
        construction.rods[i].startNode++
        construction.rods[i].endNode++
    }

    construction.nodes.splice(position, 0, node)
    construction.rods.splice(position, 0, rod)

    updateControls(construction)
    redraw()
}

removeRod = () =>
{
    let position = parseInt($('#removeRodPosition').find(":selected").val())
    
    let length = construction.nodes[position + 1].x - construction.nodes[position].x
    
    for (let i = position + 1; i < construction.nodes.length; ++i)
    {
        construction.nodes[i].x -= length
    }
    
    for (let i = position + 1; i < construction.rods.length; ++i)
    {
        construction.rods[i].startNode--
        construction.rods[i].endNode--
    }
    
    construction.nodes.splice(position, 1)
    construction.rods.splice(position, 1)
    
    updateControls(construction)
    redraw()
}

setForce = () =>
{
    let position = parseInt($('#setForceRodPosition').find(":selected").val())
    let force = parseFloat($("#forceX").val())
    
    construction.rods[position].force = force
    
    updateControls(construction)
    redraw()
}

setPermit = () =>
{
    let position = parseInt($('#setPermitNodePosition').find(":selected").val())
    let permitValue = parseInt($('#permitValue').find(":selected").val())
    
    construction.nodes[position].permit = permitValue
    
    updateControls(construction)
    redraw()
}

setNodeForce = () =>
{
    let position = parseInt($('#setForceNodePosition').find(":selected").val())
    let force = parseFloat($("#forceNode").val())
    
    construction.nodes[position].force = force
    
    updateControls(construction)
    redraw()
}

debug = () =>
{
    alert(camera.zoom)
}

function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}

save = () =>
{
    let fileContents = JSON.stringify(construction)
    download("construction.txt", fileContents)
}

handleFileSelect = (e) =>
{
    let file = e.target.files[0]

    let reader = new FileReader()

    reader.onload = (e) => {
        var text = reader.result
		construction = JSON.parse(text)
		
		updateControls(construction)
		redraw()
    }

    reader.readAsText(file)
}

// PROCESSOR ---------------------------------------------------------------------

getInitialVariables = () =>
{
    let K = []
    let Q = []

    for (let i = 0; i < construction.rods.length; ++i)
    {
        let rod = construction.rods[i]
        let length = construction.nodes[i + 1].x - construction.nodes[i].x

        let eal = rod.elastic * rod.area / length
        let k = [
            [eal, -eal],
            [-eal, eal]
        ]
        K.push(k)

        let ql = -rod.force * length / 2
        let q = [ql, ql]
        Q.push(q)
    }
    
    return {
        K: K,
        Q: Q
    }
}

process = () =>
{
    let v = getInitialVariables()
    console.log(v.K)
    console.log(v.Q)
}