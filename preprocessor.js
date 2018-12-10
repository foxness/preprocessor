// commit 1: added rod removing
// commit 2: removed y z permits
// commit 3: added force setting
// commit 4: added arrow drawing
// commit 5: added force drawing

let defaultInput =
`

3 2

0 0
0.5 0
1 0

0 1 0.1 2 1 0
1 2 0.2 1 0 1

` 

// `

// nodeCount rodCount

// node1x node1xPermit
// node2x node2xPermit
// ...

// rod1startNode rod1endNode rod1width rod1height forceX1 forceY1
// rod2startNode rod2endNode rod2width rod2height forceX2 forceY2
// ...

// ` 

let constructionPercentage = 0.7
let nodeSize = 5

let arrowDist = 20
let arrowLength = 15

let canvas = null
let ctx = null

let zoomMagnitude = 0.1

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

        node.permit = parseInt(getNextNumber())

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
		
		rod.forceX = parseFloat(getNextNumber())
        rod.forceY = parseFloat(getNextNumber())

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
	
	drawXForce(construction, rod)
	drawYForce(construction, rod)
}

drawArrow = (x, y, length, angle) =>
{
	let point0 = {
		x: x,
		y: y
	}
	
	let point1 = {
		x: point0.x + Math.cos(angle) * length,
		y: point0.y + Math.sin(angle) * length
	}
	
	let point2 = {
		x: point1.x + Math.cos(angle + Math.PI - Math.PI / 6) * (length / 3),
		y: point1.y + Math.sin(angle + Math.PI - Math.PI / 6) * (length / 3)
	}
	
	let point3 = {
		x: point1.x + Math.cos(angle + Math.PI + Math.PI / 6) * (length / 3),
		y: point1.y + Math.sin(angle + Math.PI + Math.PI / 6) * (length / 3)
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

drawXForce = (construction, rod) =>
{
	if (rod.forceX < 0.001)
	{
		return
	}
	
	let start = getPointCanvasCoords(construction.nodes[rod.startNode])
    let end = getPointCanvasCoords(construction.nodes[rod.endNode])
	
	let arrowCount = Math.floor(Math.abs(start.x - end.x) / 20)
	
	for (let i = 0; i < arrowCount; ++i)
	{
		let angle = rod.forceX > 0 ? 0 : Math.PI
		drawArrow(start.x + i * arrowDist, start.y, rod.forceX * arrowLength, angle)
	}
}

drawYForce = (construction, rod) =>
{
	if (rod.forceY < 0.001)
	{
		return
	}
	
	let start = getPointCanvasCoords(construction.nodes[rod.startNode])
    let end = getPointCanvasCoords(construction.nodes[rod.endNode])
	
	let arrowCount = Math.floor(Math.abs(start.x - end.x) / 20)
	
	for (let i = 0; i < arrowCount; ++i)
	{
		let angle = rod.forceY > 0 ? Math.PI / 2 : -Math.PI / 2
		drawArrow(start.x + i * arrowDist, start.y, rod.forceY * arrowLength, angle)
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
    let width = parseFloat($("#rodWidth").val())
    let height = parseFloat($("#rodHeight").val())
    let position = parseInt($('#rodPosition').find(":selected").val())

    let node = {}

    node.x = construction.nodes[position].x
    node.y = 0

    node.permit = 0

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
	let forceX = parseFloat($("#forceX").val())
	let forceY = parseFloat($("#forceY").val())
	
	construction.rods[position].forceX = forceX
	construction.rods[position].forceY = forceY
	
	updateControls(construction)
    redraw()
}

debug = () =>
{
    alert(camera.zoom)
}