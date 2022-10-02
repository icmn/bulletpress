const cap = 764
const margin = 10
const MAX_CHARS = 115

const DestinationPkgEnum = Object.freeze({
  'MyEval': 'MyEval',
  'AF1206': 'AF1206'
})

const gui = {

  get destPkg() { return gui.destRuleSet.ruleStyle; },

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


  get destRuleSet() {
    let editor = document.getElementById("bulletpress-editor")
    let element = document.getElementById("ckbox-style-mode")
    let mode = DestinationPkgEnum.MyEval // DEFAULT == checked

    function isMyEvalStyle() { return mode === DestinationPkgEnum.MyEval }
    function is1206Style() { return mode === DestinationPkgEnum.AF1206 }

    return {
      get ruleStyle() { 
        return element.checked ? DestinationPkgEnum.MyEval : DestinationPkgEnum.AF1206;
      },
      onclick: function(func) { element.addEventListener("click", func); },
      changeMode: function() {
        const isChecked = element.checked
        if (isChecked && isMyEvalStyle()) {
          // Change to MyEval
          editor.classList.remove("pixelwidth")
          editor.classList.add("characterlength")
        } else {
          // Change to 1206
          editor.classList.remove("characterlength")
          editor.classList.add("pixelwidth")
        }
      }
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
    [/^\s*-?\s*/gi, '- '],       // ' asdf' >>> '- asdf'
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
    if (gui.destPkg === DestinationPkgEnum.AF1206) {
      while (gui.textRuler.measure(x) > cap && gui.textRuler.countSpaces(x) > 1) {
        x = x.split('').reverse().join('').replace(' ','\u2006').split('').reverse().join('')
      }
    }
    return x
  }).filter((x) => {
    if (gui.destPkg === DestinationPkgEnum.MyEval) {
      charLength = x.length
      return charLength <= MAX_CHARS
    } else if (gui.destPkg === DestinationPkgEnum.AF1206) {
      pixelLength = gui.textRuler.measure(x)
      return pixelLength <= cap && pixelLength >= cap - margin
    }
    return true
  }).sort((x, y) => {
    if (gui.destPkg === DestinationPkgEnum.MyEval) {
      return y.length - x.length
    } else if (gui.destPkg === DestinationPkgEnum.AF1206) {
      return gui.textRuler.measure(y) - gui.textRuler.measure(x)
    }
    return 0
  })
  if (bullets.length) {
    if (gui.destPkg === DestinationPkgEnum.MyEval) {
      bullets.unshift(Array(MAX_CHARS).fill("#").join(''))
    } else if (gui.destPkg === DestinationPkgEnum.AF1206) {
      visual_cue = "-"
      do {
        visual_cue += visual_cue.charAt(0)
      } while (gui.textRuler.measure(visual_cue) < cap)
      bullets.unshift(visual_cue)
    }
    return bullets
  }
  return [ 'No bullets of length/all bullets over length' ]
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
    gui.destRuleSet.onclick(() => {
      gui.destRuleSet.changeMode();
      gui.textArea.triggerInput();
    })
    // Trigger page
    gui.textArea.triggerInput();
  }
}
