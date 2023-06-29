// import { accessToken, baseId, tables } from "./src/airtable";
//   console.log(accessToken, baseId, tables);

import(chrome.runtime.getURL("./src/main.js"));

// (async () => {
//   const src = chrome.runtime.getURL("./src/main.js");
//   const logAirtable = await import(src);
//   // logAirtable.default();
// })();

// // https://airtable.com/appRkyb7YMwIW0U98/tblBgPU0roZVUY5Il/viwjaB6uP3oX15nx3?blocks=hide
// const apiRoot = `https://api.airtable.com/v0/${baseId}/${tables.runes.name}`;
// const editRoot = `https://airtable.com/${baseId}/${tables.runes.id}/${tables.runes.views.grid.id}`

// const inspectKey = "Alt";

// const infoBox = createNode(`<div class="urbit-lookup-infobox"></div>`)
// document.body.appendChild(infoBox);

// const reticle = createNode(`<div class="urbit-lookup-reticle"></div>`)
// document.body.appendChild(reticle);

// function createNode(htmlString) {
//   const dummy = document.createElement('div')
//   dummy.innerHTML = htmlString;
//   return dummy.firstChild;
// }

// const lookupController = new AbortController();

// async function fetchRuneData(rune) {
//   const queryString = new URLSearchParams({
//     view: tables.runes.views.grid.name,
//     filterByFormula: `{Rune} = "${rune}"`,
//   }).toString();

//   const res = await fetch(apiRoot + "?" + queryString, {
//     headers: {
//       Authorization: "Bearer " + accessToken,
//     },
//     signal: lookupController.signal
//   });

//   const json = await res.json();
//   const data = json.records[0];
//   return data;
// };

// const breakRegex = /\s/;

// function getWordRangeAtPoint(x, y) {
//   const range = document.caretRangeFromPoint(x, y);
//   while (true) {
//     try {
//       range.setStart(range.startContainer, range.startOffset - 1);
//     } catch (e) {
//       break;
//     }
//     if (!range.toString() || range.toString()[0].match(breakRegex)) {
//       range.setStart(range.startContainer, range.startOffset + 1);
//       break;
//     }
//   }
//   while (true) {
//     try {
//       range.setEnd(range.endContainer, range.endOffset + 1);
//     } catch (e) {
//       break;
//     }
//     if (
//       !range.toString() ||
//       range
//         .toString()
//         [range.endOffset - range.startOffset - 1].match(breakRegex)
//     ) {
//       range.setEnd(range.endContainer, range.endOffset - 1);
//       break;
//     }
//   }
//   return range;
// }

// const state = {
//   text: null,
//   rect: null,
//   inspecting: false,
//   activeResult: false,
// };

// document.addEventListener("mousemove", async function (e) {
//   if (!state.inspecting && !state.activeResult) {
//     return;
//   }

//   const target = document.elementFromPoint(e.clientX, e.clientY);
//   if (
//     target.classList.contains("urbit-lookup-infobox") ||
//     target.closest(".urbit-lookup-infobox")
//   ) {
//     return;
//   }

//   const range = getWordRangeAtPoint(e.clientX, e.clientY);
//   const text = range.toString();
//   const rect = range.getBoundingClientRect();

//   if (text !== state.text || rect.toJSON() !== state.rect.toJSON()) {
//     if (!state.inspecting) {
//       hideResult();
//       return;
//     }

//     state.text = text;
//     state.rect = rect;
//     lookupController.abort();

//     showReticle(rect);
//     showInfoBox(rect, 'loading', null);
//     if (text.match(/\W{2}/)) {
//       try {
//         const data = await fetchRuneData(text);
//         if (data) {
//           showInfoBox(rect, 'ready', data)
//         } else {
//           showInfoBox(rect, 'notFound', null)
//         }
//       } catch (e) {
//         console.log("request aborted", text)
//       }
//     } else {
//       hideInfoBox();
//     }
//   }
// });

// function showReticle(rect) {
//   reticle.style.display = "block";
//   reticle.style.width = rect.width + "px"
//   reticle.style.height = rect.height + "px"
//   reticle.style.top = rect.y + 'px'
//   reticle.style.left = rect.x + "px";
// }

// function hideResult() {
//   state.activeResult = false;
//   reticle.style.display = "none";
//   infoBox.style.display = "none";
// }

// function showInfoBox(rect, state, data) {
//   if (state === "ready") {
//     infoBox.style.display = "block";
//     infoBox.innerHTML = `
//       <span style="margin-right: 10px; font-weight: bold;">${data.fields["Rune"]}</span>
//       <span style="margin-right: 10px">${data.fields["Description"]}</span>
//       <a target="_blank" href="${editRoot}/${data.id}?blocks=hide">Edit</a>
//     `;
//     infoBox.style.left = rect.x + "px"
//     infoBox.style.top = rect.y - infoBox.clientHeight + "px";
//   } else if (state === 'notFound') {
//     infoBox.style.display = "block";
//     infoBox.innerHTML = "No results"
//   }
// }

// function hideInfoBox() {
//   infoBox.style.display = "none";
// }

// document.addEventListener("keydown", (e) => {
//   if (e.key === inspectKey) {
//     state.inspecting = true;
//   }
// })

// document.addEventListener("keyup", (e) => {
//   if (e.key === inspectKey) {
//     state.inspecting = false;
//   }
// })

// window.addEventListener("blur", () => {
//   state.inspecting = false;
// })
