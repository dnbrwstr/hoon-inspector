const accessToken =
  "patWDC65tfbBCrhEQ.1b85570f07cb173ff0c8f31af590c603d5b4de61e44770e53d29024771d9b792";

const baseId = "appRkyb7YMwIW0U98";

const tables = {
  runes: {
    name: "Runes",
    id: "tblVBwnzYxF363Ku8",
    views: {
      grid: {
        id: "viwpnH1dn3TPx7Mcb",
        name: "Grid view",
      },
    },
  },
  auras: {
    name: "Auras",
    id: "tblBgPU0roZVUY5Il",
    views: {
      grid: {
        name: "Grid view",
      },
    },
  },
};

export const apiRoot = `https://api.airtable.com/v0/${baseId}/${tables.runes.name}`;
export const editRoot = `https://airtable.com/${baseId}/${tables.runes.id}/${tables.runes.views.grid.id}`;

export { accessToken, baseId, tables };
