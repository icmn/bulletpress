const cap = 764
const margin = 10

const gui = {

  get textArea() {
    let element = document.getElementById('textArea')
    return {
      get value() { return element.value },
      oninput: function(func) { element.addEventListener("input", func) },
      triggerInput: function () { element.dispatchEvent(new Event("input")) }
    }
  },

  get displayArea() {
    let element = document.getElementById('displayArea')
  
    return {
      update: text => element.innerText = text
    }
  },

  get textRuler() {
    let canvas = document.createElement('canvas')
    let ctx = canvas.getContext('2d')
    ctx.font="12pt Times New Roman"
  
    function measure(text) {
      return Math.ceil(ctx.measureText(text).width)
    }
  
    function countSpaces(text) {
      return text.split(" ").length - 1
    }
  
    return {
      measure: measure,
      countSpaces: countSpaces
    }
  }
}


const bulletPress = (string) => {
  
  let replacements = [
    [/\s*--\s*/gi, '--'],   // 'asdf -- abcd' >>> 'asdf--abcd'
    [/^\s+/gi, '- '],       // ' asdf' >>> '- asdf'
    [/\s+$/gi, ''],         // 'asdf ' >>> 'asdf'
    [/\s*\/\s*/gi, '/'], 
    [/\s*,/gi, ','],
    [/\s+;/gi, ';'],
    [/\s+/gi, ' ']
  ]
  
  let pieces = string
    .split('\n')
    .map((x) => x.split('|'))

  let bullets = ['']

  pieces.forEach((terms) => {
    let tempBullets = []

    terms.forEach((term) => {
      tempBullets.push(
        bullets.map(x => `${x} ${term}`)
      )
    })

    bullets = tempBullets.flat().slice(0)
  })

  // OPTIMIZATION: Store bullets as objects with pixelLength attached
  bullets = bullets.map((x) => {
    replacements.forEach((replacement) => {
      x = x.replace(...replacement)
    })
    return x.trim()
  }).map((x) => {
    while (gui.textRuler.measure(x) > cap && gui.textRuler.countSpaces(x) > 1) {
      x = x.split('').reverse().join('').replace(' ','\u2006').split('').reverse().join('')
    }
    return x
  }).filter(x=>{
    pixelLength = gui.textRuler.measure(x)
    return pixelLength <= cap && pixelLength >= cap - margin
  }).sort((x,y) => gui.textRuler.measure(y) - gui.textRuler.measure(x))

  return bullets.length ? bullets : ['No bullets of length/all bullets over length']
}


// ONREADY Event
document.onreadystatechange = function () {
  if (document.readyState === "complete") {
    // Setup html listeners
    gui.textArea.oninput(() => {
      gui.displayArea.update(
        bulletPress(gui.textArea.value).join('\n')
      )
    })
    // Trigger page
    gui.textArea.triggerInput();
  }
}
