import { accessToken, baseId, tables, getEditUrl } from "./airtable.js";

const inspectKey = "Alt";

const wrapper = document.createElement("div");
wrapper.style.position = "fixed";
wrapper.style.top = 0;
document.body.appendChild(wrapper);
const shadow = wrapper.attachShadow({ mode: "open" });
const stylesheetUrl =
  window.chrome && window.chrome.runtime
    ? window.chrome.runtime.getURL("styles.css")
    : "../extension/styles.css";
const linkTag = document.createElement("link");
linkTag.setAttribute("rel", "stylesheet");
linkTag.setAttribute("href", stylesheetUrl);
shadow.appendChild(linkTag);

// const root = document.body;

// const dummy = document.createElement("div");
// dummy.style.width = "500px";
// dummy.style.height = "500px";
// dummy.style.backgroundColor = "red";
// shadow.appendChild(dummy);

const infoBox = createNode(`<div class="ul-infobox"></div>`);
const contentBox = createNode(`<div class="ul-infobox-content"></div>`);
infoBox.appendChild(contentBox);
shadow.appendChild(infoBox);

const reticle = createNode(`<div class="ul-reticle"></div>`);
shadow.appendChild(reticle);

function createNode(htmlString) {
  const dummy = document.createElement("div");
  dummy.innerHTML = htmlString;
  return dummy.firstChild;
}

let lookupController = null;
let pendingUrl = null;

async function interruptAndFetch(url, fetchOptions) {
  if (lookupController) {
    console.log("abort", pendingUrl, "for", url);
    lookupController.abort();
  }
  pendingUrl = url;
  lookupController = new AbortController();
  fetchOptions.signal = lookupController.signal;
  try {
    const res = await fetch(url, fetchOptions);
    lookupController = null;
    return res;
  } catch (e) {
    lookupController = null;
    throw e;
  }
}

// Fetch a record from airtable given a formula to filter records by
async function fetchFirstMatchingRecord(tableName, viewName, filterByFormula) {
  console.log("fetch", tableName, viewName, filterByFormula);
  const queryString = new URLSearchParams({
    view: viewName,
    filterByFormula,
  }).toString();
  const res = await interruptAndFetch(
    `https://api.airtable.com/v0/${baseId}/${tableName}?${queryString}`,
    {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    }
  );
  const json = await res.json();
  return json && json.records && json.records.length ? json.records[0] : null;
}

async function loadRuneContent(rune) {
  const data = await fetchFirstMatchingRecord(
    tables.runes.name,
    tables.runes.views.grid.name,
    `{Rune} = "${rune}"`
  );
  const editUrl = getEditUrl(tables.runes, data.id);
  return data
    ? `
    <div class="ul-header">
      <span class="ul-target ul-code">${data.fields["Rune"]}</span> <span class="ul-category">rune</span>
    </div>
    <span class="ul-target-description">${data.fields["Description"]}</span>
    <a target="_blank" class="ul-edit-button" href="${editUrl}">Edit</a>`
    : null;
}

async function loadAuraContent(aura) {
  const data = await fetchFirstMatchingRecord(
    tables.auras.name,
    tables.auras.views.grid.name,
    `{Aura} = "${aura}"`
  );
  return data
    ? `
    <div class="ul-header">
       <span class="ul-target ul-code">${
         data.fields["Aura"]
       }</span> <span class="ul-category">aura</span>
    </div>
    <span class="ul-target-description">${data.fields["Description"]}${
        data.fields["Example"]
          ? `, for example: <span class="ul-target-example ul-code">${data.fields["Example"]}</span>`
          : ""
      }</span>
    <a target="_blank" class="ul-edit-button" href="${getEditUrl(
      tables.auras,
      data.id
    )}">Edit</a>
    `
    : null;
}

async function loadVocabContent(name) {
  const data = await fetchFirstMatchingRecord(
    tables.vocab.name,
    tables.vocab.views.grid.name,
    `LOWER({Name}) = LOWER("${name}")`
  );
  return data
    ? `
    <div class="ul-header">
       <span class="ul-target ul-code">${data.fields["Name"]}</span>
    </div>
    <span class="ul-target-description">${data.fields["Description"]}${
        data.fields["Example"]
          ? `, for example: <span class="ul-target-example ul-code">${data.fields["Example"]}</span>`
          : ""
      }</span>
    <a target="_blank" class="ul-edit-button" href="${getEditUrl(
      tables.auras,
      data.id
    )}">Edit</a>
    <div class="ul-notes">${renderAirtableMarkdown(data.fields["Notes"])}</div>
    `
    : null;
}

function renderAirtableMarkdown(markdown) {
  return (
    markdown
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        return `<a target="_blank" href="${url}">${text}</a>`;
      })
      .replace(/\n/g, "<br>")

      .replace(
        /\[([^\]]+)\]\(([^\)]+)\)/g,
        (_, text, link) => `<a target="_blank" href="${link}">${text}</a>`
      )
      .replace(
        /\[([^\]]+)\]\(([^\)]+)\)/g,
        (_, text, link) => `<a target="_blank" href="${link}">${text}</a>`
      )
      .replace(
        /`([^`]+)`/g,
        (_, text) => `<span class="ul-code">${text}</span>`
      )
      // Render headings
      .replace(/^# (.*)/gm, (_, text) => `<h1>${text}</h1>`)
      .replace(/^## (.*)/gm, (_, text) => `<h2>${text}</h2>`)
      .replace(/^### (.*)/gm, (_, text) => `<h3>${text}</h3>`)
      .replace(/^#### (.*)/gm, (_, text) => `<h4>${text}</h4>`)
      .replace(/^##### (.*)/gm, (_, text) => `<h5>${text}</h5>`)
      .replace(/^###### (.*)/gm, (_, text) => `<h6>${text}</h6>`)
      .replace(/\*\*(.*)\*\*/gm, (_, text) => `<b>${text}</b>`)
      .replace(/_(.*)_/gm, (_, text) => `<i>${text}</i>`)
  );
}

const breakRegex = /[\s\(\)\[\]\`]/;

function getTokenAtPoint(x, y) {
  const selection = document.getSelection();
  selection.removeAllRanges();
  selection.addRange(document.caretRangeFromPoint(x, y));

  let lastValue = null;
  while (true) {
    selection.modify("extend", "backward", "character");
    const content = selection.toString();
    if (content && content[0].match(breakRegex)) {
      selection.modify("extend", "forward", "character");
      break;
    }
    if (content === lastValue) {
      break;
    }
    lastValue = content;
  }
  // Reverse the direction of the selection. Without this, modifying the
  // selection in the other direction will reset the changes we just made.
  selection.setBaseAndExtent(
    selection.focusNode,
    selection.focusOffset,
    selection.anchorNode,
    selection.anchorOffset
  );
  while (true) {
    selection.modify("extend", "forward", "character");
    const content = selection.toString();
    if (content.match(breakRegex)) {
      selection.modify("extend", "backward", "character");
      break;
    }
    if (content === lastValue) {
      break;
    }
    lastValue = content;
  }
  const text = selection.toString();
  const rangeLayouts = getSelectionRanges(selection).map((r) =>
    r.getBoundingClientRect()
  );
  const layout = getBoundingRectExtents(rangeLayouts);
  selection.removeAllRanges();
  return {
    text,
    layout,
  };
}

function getSelectionRanges(selection) {
  const ranges = [];
  for (let i = 0; i < selection.rangeCount; i++) {
    ranges.push(selection.getRangeAt(i));
  }
  return ranges;
}

function smallestDistanceBetweenBoundingRectAndPointer(rect, x, y) {
  const rectCenterX = rect.x + rect.width / 2;
  const rectCenterY = rect.y + rect.height / 2;
  const dx = Math.max(Math.abs(rectCenterX - x) - rect.width / 2, 0);
  const dy = Math.max(Math.abs(rectCenterY - y) - rect.height / 2, 0);
  return Math.sqrt(dx * dx + dy * dy);
}

function getBoundingRectExtents(rects) {
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  const width = Math.max(...rects.map((r) => r.x + r.width)) - x;
  const height = Math.max(...rects.map((r) => r.y + r.height)) - y;
  return {
    x,
    y,
    width,
    height,
  };
}

const state = {
  targetLayout: null,
  inspectKeyDown: false,
  activeResult: false,
  lookupText: null,
};

document.addEventListener("mousemove", async function (e) {
  if (!state.inspectKeyDown && !state.activeResult) {
    return;
  }

  const target = document.elementFromPoint(e.clientX, e.clientY);
  if (
    target.classList.contains("ul-infobox") ||
    target.closest(".ul-infobox")
  ) {
    return;
  }

  const { text, layout } = getTokenAtPoint(e.clientX, e.clientY);
  const offset = smallestDistanceBetweenBoundingRectAndPointer(
    layout,
    e.clientX,
    e.clientY
  );
  if (offset > 5) {
    hideResult();
    return;
  }

  if (text !== state.lookupText) {
    hideResult();
    if (!state.inspectKeyDown) {
      return;
    }
    state.lookupText = text;
    state.targetLayout = layout;
    showReticle(layout);
    let content = null;
    if (text.match(/^\W[\W_]$/)) {
      content = await loadRuneContent(text);
    } else if (text[0] === "@") {
      content = await loadAuraContent(text);
    } else {
      content = await loadVocabContent(text);
    }
    showInfoBox(layout, content);
  }
});

function rectsAreEqual(rect1, rect2) {
  return (
    rect1.x === rect2.x &&
    rect1.y === rect2.y &&
    rect1.width === rect2.width &&
    rect1.height === rect2.height
  );
}

function showReticle(rect) {
  reticle.style.display = "block";
  reticle.style.width = rect.width + "px";
  reticle.style.height = rect.height + "px";
  reticle.style.top = rect.y + "px";
  reticle.style.left = rect.x + "px";
}

function hideResult() {
  state.activeResult = false;
  reticle.style.display = "none";
  infoBox.style.display = "none";
}

function showInfoBox(rect, content) {
  if (content) {
    state.activeResult = true;
    contentBox.innerHTML = content;
    infoBox.style.display = "block";
    infoBox.style.left = rect.x + "px";
    infoBox.style.top = rect.y - infoBox.clientHeight + "px";
  } else {
    contentBox.innerHTML = "";
    infoBox.style.display = "none";
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === inspectKey) {
    state.inspectKeyDown = true;
  }
});

// Matches any sequence of two characters without letters or numbers, but including underscores
document.addEventListener("keyup", (e) => {
  if (e.key === inspectKey) {
    state.inspectKeyDown = false;
  }
});

window.addEventListener(
  "blur",
  () => {
    hideResult();
    state.inspectKeyDown = false;
  },
  true
);

window.addEventListener(
  "scroll",
  () => {
    hideResult();
  },
  true
);
