let PARSED_FILE = [];
let generatedText = "";
function generate() {

  let textParsedFromFile = PARSED_FILE;
  let template = getTemplate();
  if (template.length > 0) {
    textParsedFromFile.forEach(textRow => generatedText += getGeneratedText(updateTemplateWithValuesFromRow(template, textRow)) + ";\n");
  }
  setReaderOutput();
}

function resetGeneratedText() {
  generatedText = "";
  setReaderOutput();
}

function setReaderOutput() {
  if (generatedText === "") {
    document.getElementById("template-output").innerHTML = "";
  } else {
    document.getElementById("template-output").innerHTML = generatedText.split("\n")
      .map(txt => "<p>" + txt + "</p>").join("");
  }
}

function download() {
  if (generatedText !== "") {
    try {
      download_csv(generatedText);
    } catch (e) {
      console.warn(e);
    }
  }
}

function getTemplate() {
  return document.getElementById("template-input").value.trim();
}

function updateTemplateWithValuesFromRow(template, textRow) {
  try {
    Object.keys(textRow).forEach(
      label => {
        const exTo = textRow[label];
        const exFrom = '$' + label;
        template = template.split(exFrom).join(exTo)
      }
    );

  } catch (e) {
    showError(e);
  }
  return template;
}

function getGeneratedText(template) {

  const {textLineToChange, startIndex, endIndex} = getTextToChangeFromBraces(template);
  if (startIndex === 0) {
    return template;
  }
  if (textLineToChange === '') {
    return template;
  }
  if (textLineToChange.indexOf("{") !== -1) {
    return getGeneratedText(textLineToChange);
  }
  let changedTextLine = getChangedLine(textLineToChange);
  let generated = template.slice(0, startIndex - 1) + changedTextLine + template.slice(endIndex + 1);
  if (generated.indexOf("{") !== -1) {
    return getGeneratedText(generated);
  }
  return generated;
}

function getTextToChangeFromBraces(template) {

  // let startIndex;
  // try {
  let startIndex = getStartIndex(template);
  // } catch (e) {
  //   showError(e);
  // }
  let endIndex;
  // try {
  if (startIndex > 0) {
    endIndex = getEndIndex(template, startIndex);
  } else {
    endIndex = template.length - 1;
  }
  // } catch (e) {
  //   showError(e)
  // }

  let textLineToChange = template.slice(startIndex, endIndex);


  return {textLineToChange, startIndex, endIndex};
}

function getChangedLine(textLineToChange) {
  const textListToChange = getTextListToChangeFromText(textLineToChange);
  return getRandomTextFromList(textListToChange);
}

function getTextListToChangeFromText(textLineToChange) {
  return textLineToChange.split(/\|(?![^{]*})/g)
    .map(string => {
      let stringTrimmed = string.trim();
      if (stringTrimmed == null || stringTrimmed === "") {
        throw new Error("Błąd składni, puste klamry { }")
      }
      return stringTrimmed;
    });
}

function getRandomTextFromList(listaDoPodmiany) {
  return listaDoPodmiany[Math.floor(Math.random() * listaDoPodmiany.length) || 0];
}

function createObject(row, labels) {
  const obj = {};
  row = row.split(";");
  for (let i = 0; i < row.length - 1; i++) {
    try {
      let key = labels[i].replace(new RegExp('"', "g"), "");
      obj[key] = row[i].replace(new RegExp('"', "g"), "");
    } catch (e) {
      console.warn(e);
    }
  }
  return obj;
}

function isNotEmpty(obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key))
      return true;
  }
  return false;
}

function createObjectsFromRows(rows, labels) {
  let objects = [];
  rows.forEach(
    row => {
      let obj = createObject(row, labels);
      if (isNotEmpty(obj)) {
        objects.push(obj);
      }
    }
  );
  PARSED_FILE = objects;
  return objects;
}

function createTable(reader) {
  var table = document.createElement('table');
  var tableBody = document.createElement('tbody');

  reader.result.split("\n").forEach(function (rowData) {
    var row = document.createElement('tr');

    rowData.split(";").forEach(function (cellData) {
      var cell = document.createElement('td');
      cell.appendChild(document.createTextNode(cellData));
      row.appendChild(cell);
    });

    tableBody.appendChild(row);
  });

  table.appendChild(tableBody);
  document.getElementById("reader-output").appendChild(table);
}

function readFile() {
  PARSED_FILE = [];
  document.getElementById("reader-output").innerHTML = "";
  let rows;
  let labels;
  const reader = new FileReader();
  reader.readAsText(document.getElementById("reader-input").files[0]);
  reader.onload = function () {
    rows = reader.result.split("\n");
    labels = rows[0].split(";");
    rows.shift();
    createTable(reader);
    return createObjectsFromRows(rows, labels);
  };
}


function download_csv(csvText) {
  let fileName = "generated";

  const dateTime = new Date().toLocaleString();

  fileName = fileName + dateTime + ".csv";
  const hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvText);
  hiddenElement.target = '_blank';
  hiddenElement.download = fileName;
  hiddenElement.click();
}


function getEndIndex(text, endIndex) {
  let bracesToBalance = 1;
  while (true) {
    if (text[endIndex] === '{') {
      bracesToBalance++;
    } else if (text[endIndex] === '}') {
      bracesToBalance--;
      if (bracesToBalance === 0) break;
    }
    endIndex++;
  }
  return endIndex;
}

function getStartIndex(text) {
  const openingBrace = text.indexOf('{');
  // if (openingBrace === -1) {
  // throw new Error("Nie ma żadnej klamry otwierającej '{' ");
  // }
  return openingBrace + 1;
}

function showError(e) {
  alert(e);
  console.warn(e);
}
