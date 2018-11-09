let defaultInput =
`

3 2

0 0 0 0 0
0.5 0 1 1 1
1 0 0 0 0

0 1
1 2

`

$(document).ready(() =>
{
    let canvas = document.getElementById("canvas")
    window.ctx = canvas.getContext("2d")
    $("#input").val(defaultInput.trim())
    update()
})

parseConstruction = (raw) =>
{
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

update = () =>
{
    let inp = $("textarea").val()
    let construction = parseConstruction(inp)
    console.log(construction)
    // alert(inp)
    // ctx.fillStyle = "#FF0000"
    // ctx.fillRect(0,0,150,75)
}