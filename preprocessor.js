// todo:
// add clear button

let defaultInput =
`

3 2

0 0
3 0
5 1

2 1 1
3 0 1

0 1

` 

// `

// nodeCount rodCount

// node1x node1force
// node2x node2force
// ...

// rod1area forceX1 elastic1
// rod2area forceX2 elastic2
// ...

// leftSupport rightSupport

// ` 

let constructionColor = "#eee"
let upcColor = "#ff00ff"
let npcColor = "#00ff00"

let renderConstruction = true;
let renderNx = true;
let renderUx = true;

let constructionPercentage = 0.7
let nodeSize = 5

let arrowDist = 0.4
let arrowLength = 0.3

let supportStrokeCount = 4
let supportSize = 30
let supportDx = 10
let supportDy = 10

let canvas = null
let ctx = null

let zoomMagnitude = 0.1

let camera = {
    x: -250,
    y: -300,
    zoom: 60
}

let construction = null

let canvasOffsetX = null
let canvasOffsetY = null
let dragging = false
let startDragX = null
let startDragY = null
let offsetDragX = 0
let offsetDragY = 0

let graphDx = 0.1
let defaultY = 0

let outdated = true
let upc = null
let npc = null

let solve = math.lusolve

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

    $('#leftSupport').change(() => {
        construction.leftSupport = $('#leftSupport').prop('checked')
        outdated = true
        update()
    })

    $('#rightSupport').change(() => {
        construction.rightSupport = $('#rightSupport').prop('checked')
        outdated = true
        update()
    })

    $('#renderConstruction').change(() => {
        renderConstruction = $('#renderConstruction').prop('checked')
        redraw()
    })

    $('#renderNx').change(() => {
        renderNx = $('#renderNx').prop('checked')
        redraw()
    })

    $('#renderUx').change(() => {
        renderUx = $('#renderUx').prop('checked')
        redraw()
    })

    let offset = $("#canvas").offset()
    canvasOffsetX = offset.left
    canvasOffsetY = offset.top

    construction = parseConstruction(defaultInput.trim())
    update()
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
        node.y = defaultY
        node.force = parseFloat(getNextNumber())

        construction.nodes.push(node)
    }

    construction.rods = []
    for (let i = 0; i < rodCount; ++i)
    {
        let rod = {}

        rod.area = parseFloat(getNextNumber())
        rod.force = parseFloat(getNextNumber())
        rod.elastic = parseFloat(getNextNumber())

        construction.rods.push(rod)
    }

    construction.leftSupport = parseInt(getNextNumber()) == 1
    construction.rightSupport = parseInt(getNextNumber()) == 1

    return construction
}

getPointCanvasCoords = (point) =>
{
    let x = (point.x * camera.zoom) - camera.x + offsetDragX
    let y = (point.y * camera.zoom) - camera.y + offsetDragY

    return { x: x, y: y }
}

drawSupports = () =>
{
    let indices = []

    if (construction.leftSupport)
    {
        indices.push(0)
    }

    if (construction.rightSupport)
    {
        indices.push(construction.nodes.length - 1)
    }

    indices.forEach(s =>
        {
            let coords = getPointCanvasCoords(construction.nodes[s])

            for (let i = 0; i < supportStrokeCount; ++i)
            {
                let start = {
                    x: coords.x + (supportDx / 2),
                    y: coords.y - (supportSize / 2) + (supportSize / supportStrokeCount) * i * 2
                }
                
                let end = {
                    x: start.x - supportDx,
                    y: start.y - supportDy
                }
                
                ctx.beginPath()
                ctx.moveTo(start.x, start.y)
                ctx.lineTo(end.x, end.y)
                ctx.stroke()
            }
        })
}

drawNode = (node) =>
{
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

drawRod = (rodIndex) =>
{
    let rod = construction.rods[rodIndex]
    let start = construction.nodes[rodIndex]
    let end = construction.nodes[rodIndex + 1]

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
    
    drawRodForce(rodIndex)
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

drawRodForce = (rodIndex) =>
{
    let rod = construction.rods[rodIndex]

    if (Math.abs(rod.force) < 0.001)
    {
        return
    }
    
    let start = getPointCanvasCoords(construction.nodes[rodIndex])
    let end = getPointCanvasCoords(construction.nodes[rodIndex + 1])
    
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

drawUpc = () =>
{
    let startX = construction.nodes[0].x
    let endX = construction.nodes[construction.nodes.length - 1].x
    
    for (let i = 0; startX + i * graphDx < endX; ++i)
    {
        let x1 = startX + i * graphDx
        let x2 = startX + (i + 1) * graphDx
        
        let y1 = defaultY - upc(x1)
        let y2 = defaultY - upc(x2)

        let coords1func = getPointCanvasCoords({ x: x1, y: y1 })
        let coords2func = getPointCanvasCoords({ x: x2, y: y2 })
        let coords1floor = getPointCanvasCoords({ x: x1, y: defaultY })
        let coords2floor = getPointCanvasCoords({ x: x2, y: defaultY })

        ctx.beginPath()
        ctx.moveTo(coords1floor.x, coords1floor.y)
        ctx.lineTo(coords1func.x, coords1func.y)
        ctx.lineTo(coords2func.x, coords2func.y)
        ctx.lineTo(coords2floor.x, coords2floor.y)
        ctx.lineTo(coords1floor.x, coords1floor.y)
        ctx.stroke()
    }
}

drawNpc = () =>
{
    let startX = construction.nodes[0].x
    let endX = construction.nodes[construction.nodes.length - 1].x
    
    for (let i = 0; startX + i * graphDx < endX; ++i)
    {
        let x1 = startX + i * graphDx
        let x2 = startX + (i + 1) * graphDx
        
        let y1 = defaultY - npc(x1)
        let y2 = defaultY - npc(x2)

        let coords1func = getPointCanvasCoords({ x: x1, y: y1 })
        let coords2func = getPointCanvasCoords({ x: x2, y: y2 })
        let coords1floor = getPointCanvasCoords({ x: x1, y: defaultY })
        let coords2floor = getPointCanvasCoords({ x: x2, y: defaultY })

        ctx.beginPath()
        ctx.moveTo(coords1floor.x, coords1floor.y)
        ctx.lineTo(coords1func.x, coords1func.y)
        ctx.lineTo(coords2func.x, coords2func.y)
        ctx.lineTo(coords2floor.x, coords2floor.y)
        ctx.lineTo(coords1floor.x, coords1floor.y)
        ctx.stroke()
    }
}

drawConstruction = () =>
{
    ctx.strokeStyle = constructionColor

    if (renderConstruction)
    {
        construction.nodes.forEach(node => drawNode(node))

        for (let i = 0; i < construction.rods.length; ++i)
        {
            drawRod(i)
        }

        drawSupports()
    }

    if (!outdated)
    {
        if (renderUx)
        {
            ctx.strokeStyle = upcColor
            drawUpc()
        }

        if (renderNx)
        {
            ctx.strokeStyle = npcColor
            drawNpc()
        }
    }
}

clearCanvas = () =>
{
    ctx.clearRect(0, 0, canvas.width, canvas.height)
}

redraw = () =>
{
    clearCanvas()
    drawConstruction()
}

updateControls = () =>
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

    $('#leftSupport').prop('checked', construction.leftSupport)
    $('#rightSupport').prop('checked', construction.rightSupport)

    $("#debugArea").text(JSON.stringify(construction))
}

update = () =>
{
    updateControls()
    redraw()
}

addRod = () =>
{
    let length = parseFloat($("#rodLength").val())
    let area = parseFloat($("#rodArea").val())
    let elastic = parseFloat($("#rodElastic").val())
    let position = parseInt($('#rodPosition').find(":selected").val())

    let node = {}

    node.x = construction.nodes[position].x
    node.y = defaultY
    node.force = 0

    let rod = {}

    rod.force = 0
    rod.area = area
    rod.elastic = elastic

    for (let i = position; i < construction.nodes.length; ++i)
    {
        construction.nodes[i].x += length
    }

    construction.nodes.splice(position, 0, node)
    construction.rods.splice(position, 0, rod)

    outdated = true
    update()
}

removeRod = () =>
{
    let position = parseInt($('#removeRodPosition').find(":selected").val())
    let length = lengthOf(position)
    
    for (let i = position + 1; i < construction.nodes.length; ++i)
    {
        construction.nodes[i].x -= length
    }
    
    construction.nodes.splice(position, 1)
    construction.rods.splice(position, 1)
    
    outdated = true
    update()
}

setForce = () =>
{
    let position = parseInt($('#setForceRodPosition').find(":selected").val())
    let force = parseFloat($("#forceX").val())
    
    construction.rods[position].force = force
    
    outdated = true
    update()
}

setNodeForce = () =>
{
    let position = parseInt($('#setForceNodePosition').find(":selected").val())
    let force = parseFloat($("#forceNode").val())
    
    construction.nodes[position].force = force
    
    outdated = true
    update()
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
        
        outdated = true
		update()
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
        let length = lengthOf(i)

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

getEquationVariables = (K, Q) =>
{
    let aSize = construction.nodes.length
    let A = []
    for (let y = 0; y < aSize; ++y)
    {
        let a = []
        for (let x = 0; x < aSize; ++x)
        {
            a.push(0)
        }
        A.push(a)
    }

    for (let i = 0; i < aSize; ++i)
    {
        let k1i = i - 1
        let k2i = i

        let k1 = k1i >= 0 && k1i < K.length ? K[k1i][1][1] : 0
        let k2 = k2i >= 0 && k2i < K.length ? K[k2i][0][0] : 0

        A[i][i] = k1 + k2
    }

    for (let i = 0; i < aSize - 1; ++i)
    {
        A[i][i + 1] = K[i][0][1]
        A[i + 1][i] = K[i][1][0]
    }

    if (construction.leftSupport)
    {
        A[0][0] = 1
        A[0][1] = 0
        A[1][0] = 0
    }

    if (construction.rightSupport)
    {
        A[aSize - 1][aSize - 1] = 1
        A[aSize - 2][aSize - 1] = 0
        A[aSize - 1][aSize - 2] = 0
    }

    let bSize = aSize
    let B = []
    for (let i = 0; i < bSize; ++i)
    {
        let q1i = i - 1
        let q2i = i
        let q1 = q1i >= 0 && q1i < Q.length ? -Q[q1i][1] : 0
        let q2 = q2i >= 0 && q2i < Q.length ? -Q[q2i][0] : 0
        let f = construction.nodes[i].force
        B.push(q1 + q2 + f)
    }

    if (construction.leftSupport)
    {
        B[0] = 0
    }

    if (construction.rightSupport)
    {
        B[B.length - 1] = 0
    }

    return {
        A: A,
        B: B
    }
}

deltaToU = (delta) =>
{
    let U = []
    for (let i = 0; i < construction.rods.length; ++i)
    {
        U.push([delta[i][0], delta[i + 1][0]])
    }
    return U
}

lengthOf = (rodIndex) =>
{
    return construction.nodes[rodIndex + 1].x - construction.nodes[rodIndex].x
}

uToUpc = (U) =>
{
    let up = []
    for (let i = 0; i < construction.rods.length; ++i)
    {
        let rod = construction.rods[i]

        let u = (x) =>
        {
            let a = U[i][0]
            let b = (x / lengthOf(i)) * (U[i][1] - U[i][0])
            let c = ((rod.force * lengthOf(i) * x) / (2 * rod.elastic * rod.area)) * (1 - x / lengthOf(i))
            return a + b + c
        }

        up.push(u)
    }

    let upContinuous = (x) =>
    {
        for (let i = 0; i < construction.rods.length; ++i)
        {
            let start = construction.nodes[i].x
            let end = construction.nodes[i + 1].x

            if (start <= x && x <= end)
            {
                return up[i](x - start)
            }
        }

        return null
    }

    return upContinuous
}

uToNpc = (U) =>
{
    let np = []
    for (let i = 0; i < construction.rods.length; ++i)
    {
        let rod = construction.rods[i]

        let n = (x) =>
        {
            let a = (rod.elastic * rod.area / lengthOf(i)) * (U[i][1] - U[i][0])
            let b = (rod.force * lengthOf(i) / 2) * (1 - 2 * x / lengthOf(i))
            return a + b
        }

        np.push(n)
    }

    let npc = (x) =>
    {
        for (let i = 0; i < construction.rods.length; ++i)
        {
            let start = construction.nodes[i].x
            let end = construction.nodes[i + 1].x

            if (start <= x && x <= end)
            {
                return np[i](x - start)
            }
        }

        return null
    }

    return npc
}

process = () =>
{
    let iv = getInitialVariables()
    let ev = getEquationVariables(iv.K, iv.Q)
    let delta = solve(ev.A, ev.B)
    let U = deltaToU(delta)

    upc = uToUpc(U)
    npc = uToNpc(U)

    outdated = false
    redraw()
}