let defaultInput =
`

3 2

0 0 0 0 0
0.5 0 1 1 1
1 0 0 0 0

0 1
1 2

`

let constructionPercentage = 0.7
let nodeSize = 5
let rodWidth = 10

let canvas = null
let ctx = null

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

    construction.nodeCount = parseInt(getNextNumber())
    construction.rodCount = parseInt(getNextNumber())

    construction.nodes = []
    for (let i = 0; i < construction.nodeCount; ++i)
    {
        let node = {}

        node.x = parseFloat(getNextNumber())
        node.y = parseFloat(getNextNumber())

        node.xPermit = parseInt(getNextNumber())
        node.yPermit = parseInt(getNextNumber())
        node.zPermit = parseInt(getNextNumber())

        construction.nodes.push(node)
    }

    construction.rods = []
    for (let i = 0; i < construction.rodCount; ++i)
    {
        let rod = {}

        rod.startNode = parseInt(getNextNumber())
        rod.endNode = parseInt(getNextNumber())

        construction.rods.push(rod)
    }

    return construction
}

getNodeCanvasCoords = (construction, node) =>
{
    let xMin = Math.min(...construction.nodes.map(a => a.x))
    let xMax = Math.max(...construction.nodes.map(a => a.x))

    let yMin = Math.min(...construction.nodes.map(a => a.y))
    let yMax = Math.max(...construction.nodes.map(a => a.y))

    let xSize = xMax - xMin
    let ySize = yMax - yMin

    let x = (xSize == 0 ? 0.5 : ((1 - constructionPercentage) / 2) + (node.x - xMin) / xSize * constructionPercentage) * canvas.width
    let y = (ySize == 0 ? 0.5 : ((1 - constructionPercentage) / 2) + (node.y - yMin) / ySize * constructionPercentage) * canvas.height

    return { x: x, y: y }
}

drawConstruction = (construction) =>
{
    ctx.fillStyle = "#ffffff"

    construction.nodes.forEach(node => {
        let coords = getNodeCanvasCoords(construction, node)
        ctx.fillRect(coords.x, coords.y, nodeSize, nodeSize)
    })

    construction.rods.forEach(rod => {

    })
}

update = () =>
{
    let inp = $("textarea").val()
    let construction = parseConstruction(inp)
    // console.log(construction)
    
    drawConstruction(construction)
}