const threshold = 10

let gui={}
gui.textArea=(()=>{
  let element=document.getElementById('textArea')

  return {
    get value() {return element.value},
    oninput: function(func) {element.addEventListener("input",func)}
  }
})()

let textRuler = (()=>{
  let canvas = document.createElement('canvas')
  let ctx = canvas.getContext('2d')
  ctx.font="12px Times New Roman"

  function measure(text) {
    return Math.ceil(ctx.measureText(text).width)
  }

  return {
    measure: measure
  }
})

let replacements = [
  [/\s--\s/gi, '--'],
  [/^\s/gi, '- '],
  [/\s\/\s/gi, '/'],
  [/\s;/gi, ';'],
  [/\/\s/gi, '/']
]

let bulletPress = (string)=>{
  let pieces = string.split('\n')
    .map(x=>x.split('|'))

  let bullets = ['']

  console.log(pieces)

  pieces.forEach(terms=>{
    let tempBullets = []

    terms.forEach(term=>{
      tempBullets.push(bullets.map(x=>x+' '+term))
    })

    bullets = tempBullets.flat().slice(0)
  })

  bullets = bullets.map(x=>{
    replacements.forEach(replacement=>{
      x = x.replace(...replacement)
    })
    return x
  })

  console.table(bullets)
}

gui.textArea.oninput(()=>
  bulletPress(gui.textArea.value)
)