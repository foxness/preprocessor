$(document).ready(() =>
{
    let canvas = document.getElementById("canvas")
    window.ctx = canvas.getContext("2d")
})

parseConstruction = (raw) =>
{
    let lines = raw.replace("\r", "").split("\n")
    let construction = {}
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