const cap = 764
const margin = 10
const MAX_CHARS = 115
const DestinationPkgEnum = Object.freeze({
  'MyEval': 'MyEval',
  'AF1206': 'AF1206'
});

(function (factory) {
  this.gui = factory();
}.bind(window, function () {

  // Lazy Loaded
  let workbench = null;
  let displayArea = null;
  let themeSwitch = null;
  let destRuleSet = null;
  let textRuler = null;
  let wordsearch = null;

  function getWorkBench() {
    if (workbench === null) {
      let element = document.getElementById('textArea');
      workbench = {
        get value() { return element.value },
        oninput: function(func) { element.addEventListener("input", func) },
        triggerInput: function () { element.dispatchEvent(new Event("input")) }
      }
    }
    return workbench;
  }

  function getDisplayArea() {
    if (displayArea === null) {
      let element = document.getElementById('displayArea');
      displayArea = {
        update: html => element.innerHTML = html
      }
    }
    return displayArea;
  }

  function getThemeSwitch() {
    if (themeSwitch === null) {
      let element = document.getElementById('ckbox-light-dark-mode')
      let bodyElement = document.body
    
      function isDarkMode() { return bodyElement.classList.contains("dark"); }
      function isLightMode() { return bodyElement.classList.contains("light"); }
      function onclick(func) { element.addEventListener("click", func); }
      function changeMode() {
        const isChecked = element.checked
        if (isChecked && !isDarkMode()) {
          bodyElement.classList.remove('light')
          bodyElement.classList.add('dark')
        } else if (!isChecked && !isLightMode()) {
          bodyElement.classList.remove('dark')
          bodyElement.classList.add('light')
        }
      }
      themeSwitch = Object.freeze({
        isDarkMode,
        isLightMode,
        onclick,
        changeMode
      });
    }
    return themeSwitch;
  }

  function getDestRuleSet() {
    if (destRuleSet === null) {
      let editor = document.getElementById("bulletpress-editor")
      let element = document.getElementById("ckbox-style-mode")
      let mode = DestinationPkgEnum.MyEval // DEFAULT == checked
    
      function isMyEvalStyle() { return mode === DestinationPkgEnum.MyEval }
      function is1206Style() { return mode === DestinationPkgEnum.AF1206 }
      function onclick(func) { element.addEventListener("click", func); }
      function changeMode() {
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
      destRuleSet = Object.freeze({
        get ruleStyle() {
          return element.checked ? DestinationPkgEnum.MyEval : DestinationPkgEnum.AF1206;
        },
        isMyEvalStyle,
        onclick,
        changeMode
      });
    }
    return destRuleSet;
  }

  function getTextRuler() {
    if (textRuler === null) {
      let canvas = document.createElement('canvas')
      let ctx = canvas.getContext('2d')
      ctx.font="12pt Times New Roman"
    
      function measure(text) {
        return Math.ceil(ctx.measureText(text).width)
      }
    
      function countSpaces(text) {
        return text.split(" ").length - 1
      }
      
      textRuler = {
        measure: measure,
        countSpaces: countSpaces
      }
    }
    return textRuler;
  }

  function getWordSearch() {
    if (wordsearch === null) {
      const toggleBtn = document.getElementById("ckbox-word-search-show")
      const searchtxtbox = document.getElementById("txtbox-word-search")
      const searchDialog = document.getElementById("bulletpress-editor").querySelector(".search-dialog")
      const wordListView = document.getElementById("bulletpress-editor").querySelector(".search-results-wordlist")

      function triggerSearchInput() {
        searchtxtbox.dispatchEvent(new Event("input"))
      }

      function toggleViewOfSearchDialog() {
        searchDialog.classList.toggle("hide");
        if (!searchDialog.classList.contains("hide")) {
          triggerSearchInput();
          searchtxtbox.focus();
        } else {
          searchDialog.dispatchEvent(new Event("dialogClose"));
        }
      }

      function updateWordListView(wordDefList) {
        if (Array.prototype !== Object.getPrototypeOf(wordDefList)) return;
        const wordListHtml = (wordDefList.length === 0)
          ? '<div style="text-align: center;">no matches found.</div>'
          : wordDefList.map((wordDef) => {
              return `<div>${wordDef['word']}</div>`
            }).reduce((prev, wordhtml, i, all_words) => `${prev}${wordhtml}`, "");
        wordListView.innerHTML = wordListHtml;
      }

      wordsearch = {
        toggleViewOfSearchDialog,
        onDialogClose: function(func) { searchDialog.addEventListener("dialogClose", func); },
        onclick: function(func) { toggleBtn.addEventListener("click", func); },
        searchtext: {
          get value() { return searchtxtbox.value },
          oninput: function(func) { searchtxtbox.addEventListener("input", func) },
          triggerInput: triggerSearchInput
        },
        wordlist: {
          update: updateWordListView
        }
      }
    }
    return wordsearch;
  }

  return {
    get destPkg() { return getDestRuleSet().ruleStyle; },
    get textArea() { return getWorkBench(); },
    get displayArea() { return getDisplayArea(); },
    get themeSwitch() { return getThemeSwitch(); },
    get destRuleSet() { return getDestRuleSet(); },
    get textRuler() { return getTextRuler(); },
    get wordsearch() { return getWordSearch(); }
  };

}))();


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
      return charLength <= MAX_CHARS+3
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
  if (bullets.length > 0) {
    if (gui.destPkg === DestinationPkgEnum.MyEval) {
      // Add overage formatting cue
      bullets = bullets.map((str) => {
        if (str.length > MAX_CHARS) {
          return [
            str.substring(0, MAX_CHARS),
            '<span class="error-font char-overage">',
            str.substring(MAX_CHARS),
            '</span>'
          ].join('');
        }
        return str;
      })
      bullets.unshift(Array(MAX_CHARS).fill("#").join(''));
    } else if (gui.destPkg === DestinationPkgEnum.AF1206) {
      visual_cue = "-"
      do {
        visual_cue += visual_cue.charAt(0)
      } while (gui.textRuler.measure(visual_cue) < cap)
      bullets.unshift(visual_cue)
    }
    return bullets.map((bullet) => '<div>' + bullet + '</div>');
  }
  return [ '<div>No bullets of length/all bullets over length</div>' ]
}


// ONREADY Event
document.onreadystatechange = function () {
  if (document.readyState === "complete") {
    // Setup html listeners
    gui.textArea.oninput(() => {
      gui.displayArea.update(
        bulletPress(gui.textArea.value).join('')
      )
    })
    gui.themeSwitch.onclick(() => {
      gui.themeSwitch.changeMode();
    })
    gui.destRuleSet.onclick(() => {
      gui.destRuleSet.changeMode();
      gui.textArea.triggerInput();
    })
    gui.wordsearch.onclick(() => {
      gui.wordsearch.toggleViewOfSearchDialog();
    })
    gui.wordsearch.searchtext.oninput(() => {
      gui.wordsearch.wordlist.update(
        Dictionary.search(gui.wordsearch.searchtext.value)
      )
    })

    // Trigger page
    gui.themeSwitch.changeMode();
    gui.textArea.triggerInput();
  }
}
