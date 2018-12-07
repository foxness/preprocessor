let defaultInput =
`

3 2

0 0 0 0
0.5 1 1 1
1 0 0 0

0 1 1 2
1 2 2 1

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

let construction = null

$(document).ready(() =>
{
    canvas = document.getElementById("canvas")
    ctx = canvas.getContext("2d")
    $("#input").val(defaultInput.trim())
    update()
})

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

getConstructionParams = (construction) =>
{
    let xMin = Math.min(...construction.nodes.map(a => a.x))
    let xMax = Math.max(...construction.nodes.map(a => a.x))

    let xSize = xMax - xMin

    return {
        xMin: xMin,
        xMax: xMax,
        xSize: xSize,
    }
}

getNodeCanvasCoords = (constructionParams, node) =>
{
    let xMin = constructionParams.xMin
    let xSize = constructionParams.xSize

    let x = (xSize == 0 ? 0.5 : ((1 - constructionPercentage) / 2) + (node.x - xMin) / xSize * constructionPercentage) * canvas.width
    let y = 0.5 * canvas.height

    return { x: x, y: y }
}

drawNode = (constructionParams, node) =>
{
    let coords = getNodeCanvasCoords(constructionParams, node)
    ctx.fillRect(coords.x - nodeSize / 2, coords.y - nodeSize / 2, nodeSize, nodeSize)
}

drawRod = (construction, constructionParams, rod) =>
{
    let start = getNodeCanvasCoords(constructionParams, construction.nodes[rod.startNode])
    let end = getNodeCanvasCoords(constructionParams, construction.nodes[rod.endNode])

    let rodWidth = rod.width * 10

    let vx = start.x - end.x
    let vy = start.y - end.y
    let angle = Math.atan2(vy, vx)

    let x0 = start.x + Math.cos(angle + Math.PI / 2) * rodWidth / 2
    let y0 = start.y + Math.sin(angle + Math.PI / 2) * rodWidth / 2

    let x1 = start.x + Math.cos(angle - Math.PI / 2) * rodWidth / 2
    let y1 = start.y + Math.sin(angle - Math.PI / 2) * rodWidth / 2

    let x2 = end.x + Math.cos(angle - Math.PI / 2) * rodWidth / 2
    let y2 = end.y + Math.sin(angle - Math.PI / 2) * rodWidth / 2

    let x3 = end.x + Math.cos(angle + Math.PI / 2) * rodWidth / 2
    let y3 = end.y + Math.sin(angle + Math.PI / 2) * rodWidth / 2

    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.lineTo(x3, y3)
    ctx.lineTo(x0, y0)
    ctx.stroke()
}

drawConstruction = (construction) =>
{
    ctx.fillStyle = "#ffffff"
    ctx.strokeStyle = "#ffffff"

    let constructionParams = getConstructionParams(construction)

    construction.nodes.forEach(node => drawNode(constructionParams, node))
    construction.rods.forEach(rod => drawRod(construction, constructionParams, rod))
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
    
    redraw()
}

addRod = () =>
{
    let rawLength = $("#rodLength").val()
    let rawWidth = $("#rodWidth").val()
    let rawHeight = $("#rodHeight").val()

    let node = {}

    node.x = construction.nodes[construction.nodes.length - 1].x + parseFloat(rawLength)

    node.xPermit = 0
    node.yPermit = 0
    node.zPermit = 0

    construction.nodes.push(node)

    let rod = {}

    rod.startNode = construction.nodes.length - 2
    rod.endNode = construction.nodes.length - 1

    rod.width = parseFloat(rawWidth)
    rod.height = parseFloat(rawHeight)

    construction.rods.push(rod)

    redraw()
}