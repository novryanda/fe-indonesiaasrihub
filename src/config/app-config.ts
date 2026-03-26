import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Indonesia ASRI Hub",
  version: packageJson.version,
  copyright: `© ${currentYear}, Indonesia ASRI Hub.`,
  meta: {
    title: "Indonesia ASRI Hub - Platform",
    description:
      "Indonesia ASRI Hub",
  },
};
