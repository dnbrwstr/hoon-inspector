import { accessToken, baseId, tables, editRoot } from "./airtable.js";

const inspectKey = "Alt";

const infoBox = createNode(`<div class="urbit-lookup-infobox"></div>`);
document.body.appendChild(infoBox);

const reticle = createNode(`<div class="urbit-lookup-reticle"></div>`);
document.body.appendChild(reticle);

function createNode(htmlString) {
  const dummy = document.createElement("div");
  dummy.innerHTML = htmlString;
  return dummy.firstChild;
}

let lookupController = null;

function interruptAndFetch(url, fetchOptions) {
  if (lookupController) {
    lookupController.abort();
  }
  lookupController = new AbortController();
  fetchOptions.signal = lookupController.signal;
  return fetch(url, fetchOptions);
}

// Fetch a record from airtable given a formula to filter records by
async function fetchFirstMatchingRecord(tableName, viewName, filterByFormula) {
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
  return data
    ? `<span style="margin-right: 10px; font-weight: bold;">${data.fields["Rune"]}</span>
    <span style="margin-right: 10px">${data.fields["Description"]}</span>
    <a target="_blank" class="urbit-lookup-edit-button" href="${editRoot}/${data.id}?blocks=hide">Edit</a>`
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
    <span style="margin-right: 10px; font-weight: bold;">${data.fields["Aura"]}</span>
    <span style="margin-right: 10px">${data.fields["Description"]}</span>
    <a target="_blank" href="${editRoot}/${data.id}?blocks=hide">Edit</a>
`
    : null;
}

const breakRegex = /[\s]/;

function getTokenAtPoint(x, y) {
  const range = document.caretRangeFromPoint(x, y);
  while (true) {
    if (range.startOffset === 0) {
      const isInline =
        getComputedStyle(range.startContainer).display === "inline";
      const previousSiblingIsInline =
        getComputedStyle(range.startContainer.previousSibling()).display ===
        "inline";
      if (isInline && previousSiblingIsInline) {
        range.setStartBefore(
          range.startContainer.previousSibling(),
          range.startContainer.textContent.length
        );
        range.setStart(range.startContainer, range.startContainer.length);
      }
    }
    try {
      range.setStartBefore(range.startContainer, range.startOffset - 1);
    } catch (e) {
      break;
    }
    if (!range.toString() || range.toString()[0].match(breakRegex)) {
      range.setStartBefore();
      range.setStart(range.startContainer, range.startOffset + 1);
      break;
    }
  }
  while (true) {
    try {
      range.setEnd(range.endContainer, range.endOffset + 1);
    } catch (e) {
      break;
    }
    if (
      !range.toString() ||
      range
        .toString()
        [range.endOffset - range.startOffset - 1].match(breakRegex)
    ) {
      range.setEnd(range.endContainer, range.endOffset - 1);
      break;
    }
  }
  return range;
}

const state = {
  text: null,
  rect: null,
  inspecting: false,
  activeResult: false,
};

document.addEventListener("mousemove", async function (e) {
  if (!state.inspecting && !state.activeResult) {
    return;
  }

  const target = document.elementFromPoint(e.clientX, e.clientY);
  if (
    target.classList.contains("urbit-lookup-infobox") ||
    target.closest(".urbit-lookup-infobox")
  ) {
    return;
  }

  const range = getTokenAtPoint(e.clientX, e.clientY);
  const text = range.toString();
  const rect = range.getBoundingClientRect();

  if (text !== state.text || !rectsAreEqual(rect, state.rect)) {
    hideResult();
    if (!state.inspecting) {
      return;
    }
    state.text = text;
    state.rect = rect;
    showReticle(rect);
    let content = null;
    if (text.match(/^\W[\W_]$/)) {
      content = await loadRuneContent(text);
    } else if (text[0] === "@") {
      content = await loadAuraContent(text);
    }
    showInfoBox(rect, content);
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
    infoBox.innerHTML = content;
    infoBox.style.display = "block";
    infoBox.style.left = rect.x + "px";
    infoBox.style.top = rect.y - infoBox.clientHeight + "px";
  } else {
    infoBox.innerHTML = "";
    infoBox.style.display = "none";
  }
}

function hideInfoBox() {
  infoBox.style.display = "none";
}

document.addEventListener("keydown", (e) => {
  if (e.key === inspectKey) {
    state.inspecting = true;
  }
});

// Matches any sequence of two characters without letters or numbers, but including underscores
document.addEventListener("keyup", (e) => {
  if (e.key === inspectKey) {
    state.inspecting = false;
  }
});

window.addEventListener(
  "blur",
  () => {
    hideResult();
    state.inspecting = false;
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
